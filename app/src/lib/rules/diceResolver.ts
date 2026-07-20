import type { AtBatOutcome, BaseState } from '../../types/game'
import type { HitterRatings, PitcherRatings, Position } from '../../types/player'

/**
 * Optional dice-rolling helper for the Scorecard (Rulebook §5-6 phases 1-4 plus the Defense
 * Check). This exists purely as a convenience on top of the physical game — players can still
 * resolve every at-bat with real dice and cards and just click the outcome directly, exactly as
 * before; nothing here is required. When used, it generates the same 2d6/1d6/1d8 rolls a table
 * would make by hand and applies the exact thresholds from the rulebook, ending at one of the
 * existing recordable outcomes — it never touches game state itself, that's still entirely
 * `lib/rules/game.ts`'s job.
 */

export type PitchTypeId = 'fastball' | 'breakingBall' | 'changeup'
export const PITCH_TYPES: { id: PitchTypeId; label: string; stat: keyof PitcherRatings; modifier: number }[] = [
  { id: 'fastball', label: 'Fastball', stat: 'velocity', modifier: 6 },
  { id: 'breakingBall', label: 'Breaking Ball', stat: 'stuff', modifier: 5 },
  { id: 'changeup', label: 'Changeup', stat: 'control', modifier: 5 },
]

export type SwingTypeId = 'contact' | 'normal' | 'power'
export const SWING_TYPES: { id: SwingTypeId; label: string }[] = [
  { id: 'contact', label: 'Contact Swing' },
  { id: 'normal', label: 'Normal Swing' },
  { id: 'power', label: 'Power Swing' },
]

export interface RollBreakdown {
  dice: [number, number]
  diceTotal: number
  rating: number
  modifier: number
  clutchBonus: number
  grandTotal: number
  /** Human-readable pieces for display, e.g. "Contact 15 + Discipline bonus 2". */
  ratingLabel: string
}

export function rollD6(): number {
  return 1 + Math.floor(Math.random() * 6)
}

export function roll2d6(): [number, number] {
  return [rollD6(), rollD6()]
}

/** Half the Clutch rating, rounded down — added to both totals in the last 3 innings of
 * regulation (7th on for a 9-inning game, 4th for 6, the whole game for 3) when within 2 runs
 * (Rulebook §5 Phase 3). */
export function clutchBonus(clutch: number, inning: number, regulationInnings: number, scoreDiff: number): number {
  if (inning < regulationInnings - 2) return 0
  if (scoreDiff > 2) return 0
  return Math.floor(clutch / 2)
}

export function pitchValue(pitchId: PitchTypeId, pitcher: PitcherRatings): { rating: number; modifier: number; label: string } {
  const pitch = PITCH_TYPES.find((p) => p.id === pitchId)!
  if (pitchId === 'changeup') {
    const modifier = pitch.modifier + Math.floor(pitcher.movement / 10)
    return { rating: pitcher.control, modifier, label: 'Changeup (Control)' }
  }
  return { rating: pitcher[pitch.stat], modifier: pitch.modifier, label: `${pitch.label} (${pitch.stat[0].toUpperCase()}${pitch.stat.slice(1)})` }
}

export function swingValue(swingId: SwingTypeId, hitter: HitterRatings): { rating: number; modifier: number; label: string } {
  if (swingId === 'contact') {
    const modifier = 2 + Math.floor(hitter.discipline / 10)
    return { rating: hitter.contact, modifier, label: 'Contact Swing (Contact)' }
  }
  if (swingId === 'power') {
    return { rating: hitter.power, modifier: 4, label: 'Power Swing (Power)' }
  }
  const rating = Math.round((hitter.contact + hitter.power) / 2)
  return { rating, modifier: 4, label: 'Normal Swing (avg Contact/Power)' }
}

export interface Phase4Result {
  /** 'foul' means reroll with the same pitch/swing (a tie on Normal/Power Swing) — not itself
   * recordable. Everything else is a real recordable outcome, including 'ballInPlay', which needs
   * the Defense Check below before it resolves to a final outcome. */
  outcome: AtBatOutcome
  differential: number
}

/** Rulebook §5 Phase 4 — reads the batter/pitcher totals (dice + rating + modifiers already
 * included) and the chosen swing type (a tie only walks on a Contact Swing). */
export function resolvePhase4(batterTotal: number, pitcherTotal: number, swingId: SwingTypeId): Phase4Result {
  const differential = batterTotal - pitcherTotal
  if (differential <= -6) return { outcome: 'strikeout', differential }
  if (differential <= -3) return { outcome: 'ballInPlay', differential }
  if (differential <= -1) return { outcome: 'routineOut', differential }
  if (differential === 0) return { outcome: swingId === 'contact' ? 'walk' : 'foul', differential }
  if (differential <= 3) return { outcome: 'single', differential }
  if (differential <= 5) return { outcome: 'double', differential }
  if (differential <= 7) return { outcome: 'triple', differential }
  return { outcome: 'homeRun', differential }
}

export type HitType = 'groundBall' | 'lineDrive' | 'flyBall' | 'popUp'

export function rollHitType(): { roll: number; hitType: HitType } {
  const roll = rollD6()
  const hitType: HitType = roll <= 2 ? 'groundBall' : roll === 3 ? 'lineDrive' : roll <= 5 ? 'flyBall' : 'popUp'
  return { roll, hitType }
}

/** Rulebook §6 Step 2 — 1d8 location roll, with a 1d2 tiebreak between LF/CF on a 7. Positions
 * without a lineup slot (the pitcher himself fielding a comebacker) have no dedicated Fielding
 * rating in this game, so that one case (roll of 1) falls back to a neutral rating rather than a
 * real lookup. */
export function rollLocation(): { roll: number; tiebreak?: number; position: Position | 'P' } {
  const roll = 1 + Math.floor(Math.random() * 8)
  const table: Record<number, Position | 'P'> = { 1: 'P', 2: 'C', 3: '1B', 4: '2B', 5: '3B', 6: 'SS', 8: 'RF' }
  if (roll === 7) {
    const tiebreak = 1 + Math.floor(Math.random() * 2)
    return { roll, tiebreak, position: tiebreak === 1 ? 'LF' : 'CF' }
  }
  return { roll, position: table[roll] }
}

export interface DefenseCheckResult {
  outcome: AtBatOutcome
  isError: boolean
  isDoublePlay: boolean
}

/** Rulebook §6 Step 3 resolution, plus the Error (natural 2 on the fielder's roll, regardless of
 * total) and Double Play (Groundout with a runner on 1st and fewer than 2 outs) rules. */
export function resolveDefenseCheck(params: {
  hitType: HitType
  fielderDice: [number, number]
  fielderRating: number
  runnerDice: [number, number]
  runnerRating: number
  bases: BaseState
  outs: number
}): DefenseCheckResult {
  const { hitType, fielderDice, fielderRating, runnerDice, runnerRating, bases, outs } = params
  const fielderTotal = fielderDice[0] + fielderDice[1] + fielderRating
  const runnerTotal = runnerDice[0] + runnerDice[1] + runnerRating
  const isError = fielderDice[0] + fielderDice[1] === 2
  const defenseWins = !isError && fielderTotal >= runnerTotal
  const margin = runnerTotal - fielderTotal

  if (isError) {
    return { outcome: 'error', isError: true, isDoublePlay: false }
  }

  if (defenseWins) {
    if (hitType === 'groundBall') {
      const doublePlay = !!bases.first && outs < 2
      return { outcome: doublePlay ? 'doublePlay' : 'groundout', isError: false, isDoublePlay: doublePlay }
    }
    if (hitType === 'lineDrive') return { outcome: 'lineout', isError: false, isDoublePlay: false }
    if (hitType === 'flyBall') {
      const sacFly = !!bases.third && outs < 2
      return { outcome: sacFly ? 'sacFly' : 'flyout', isError: false, isDoublePlay: false }
    }
    return { outcome: 'popout', isError: false, isDoublePlay: false }
  }

  // Batter/runner wins the roll-off.
  if (hitType === 'groundBall') return { outcome: 'infieldSingle', isError: false, isDoublePlay: false }
  const extraBase = margin >= 5
  return { outcome: extraBase ? 'double' : 'single', isError: false, isDoublePlay: false }
}
