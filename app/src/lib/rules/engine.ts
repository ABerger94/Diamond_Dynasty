import type { HitterRatings, PitcherRatings } from '../../types/player'
import type { AtBatOutcome, AtBatResult, HitType, PitchType, SwingType } from '../../types/game'
import { roll2d6, rollDie } from './dice'

/** Mirrors docs/RULEBOOK.md — keep both in sync when changing numbers. */

export function isClutchSituation(inning: number, scoreMargin: number): boolean {
  return inning >= 7 && Math.abs(scoreMargin) <= 2
}

function pitchRatingAndBonus(ratings: PitcherRatings, pitch: PitchType): number {
  switch (pitch) {
    case 'fastball':
      return ratings.velocity + 4
    case 'breakingBall':
      return ratings.stuff + 4
    case 'changeup':
      return ratings.control + 4
  }
}

function swingRatingAndBonus(ratings: HitterRatings, swing: SwingType): number {
  switch (swing) {
    // Contact Swing also folds in a small Discipline bonus — plate discipline shrinking the
    // effective strike zone — so Discipline has a real (if modest) role. Rulebook §5 Phase 2.
    case 'contact':
      return ratings.contact + 4 + Math.floor(ratings.discipline / 10)
    case 'power':
      return ratings.power + 6
    case 'normal':
      return Math.round((ratings.contact + ratings.power) / 2)
  }
}

/** Outcome for a nonzero pitcher-minus-batter difference, per Rulebook §5 Phase 4. */
function outcomeForDiff(diff: number): AtBatOutcome {
  if (diff >= 6) return 'strikeout'
  if (diff >= 3) return 'ballInPlay' // caller must run a defense check (§6)
  if (diff >= 1) return 'routineOut'
  if (diff >= -3) return 'single'
  if (diff >= -5) return 'double'
  if (diff >= -7) return 'triple'
  return 'homeRun'
}

export interface AtBatParams {
  batterRatings: HitterRatings
  pitcherRatings: PitcherRatings
  pitch: PitchType
  swing: SwingType
  inning: number
  scoreMargin: number
  /** Injected for deterministic testing; defaults to real dice. */
  rollFn?: () => number
}

/** Resolves phases 3-4 of an at-bat (dice + outcome). Rerolls internally on a foul/tie. */
export function resolveAtBat(params: AtBatParams): AtBatResult {
  const roll = params.rollFn ?? roll2d6
  const clutch = isClutchSituation(params.inning, params.scoreMargin)
  const clutchBonus = clutch
    ? { batter: Math.floor(params.batterRatings.clutch / 2), pitcher: Math.floor(params.pitcherRatings.clutch / 2) }
    : { batter: 0, pitcher: 0 }

  const batterBase = swingRatingAndBonus(params.batterRatings, params.swing) + clutchBonus.batter
  const pitcherBase = pitchRatingAndBonus(params.pitcherRatings, params.pitch) + clutchBonus.pitcher

  // Reroll loop for ties (foul balls), same pitch/swing choices each time.
  for (let attempt = 0; attempt < 50; attempt++) {
    const batterTotal = roll() + batterBase
    const pitcherTotal = roll() + pitcherBase
    const diff = pitcherTotal - batterTotal

    if (diff === 0) continue // foul ball, reroll

    const outcome = outcomeForDiff(diff)
    return { outcome, pitcherTotal, batterTotal, diff }
  }

  // Extremely unlikely fallback (50 consecutive ties) to guarantee termination.
  return { outcome: 'foul', pitcherTotal: pitcherBase, batterTotal: batterBase, diff: 0 }
}

export interface DefenseCheckResult {
  hitType: HitType
  location: string
  defenderTotal: number
  runnerTotal: number
  defenseWins: boolean
}

const LOCATIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF/CF', 'RF']

export function rollHitType(rollFn: () => number = () => rollDie(6)): HitType {
  const r = rollFn()
  if (r <= 2) return 'groundBall'
  if (r === 3) return 'lineDrive'
  if (r <= 5) return 'flyBall'
  return 'popUp'
}

export function rollHitLocation(rollFn: () => number = () => rollDie(8)): string {
  const r = rollFn()
  return LOCATIONS[r - 1]
}

/** Fielding rating for the defender at `location`; falls back to fielderRating for non-fielders. */
export function resolveDefenseCheck(fielderRating: number, runnerSpeed: number): DefenseCheckResult {
  const hitType = rollHitType()
  const location = rollHitLocation()
  const defenderTotal = roll2d6() + fielderRating
  const runnerTotal = roll2d6() + runnerSpeed
  const defenseWins = defenderTotal >= runnerTotal // ties go to defense
  return { hitType, location, defenderTotal, runnerTotal, defenseWins }
}

/** Converts a resolved defense check into a final at-bat outcome per Rulebook §6. */
export function defenseCheckToOutcome(check: DefenseCheckResult, hasRunnerOnThirdUnderTwoOuts: boolean): AtBatOutcome {
  const margin = check.runnerTotal - check.defenderTotal
  if (check.defenseWins) {
    switch (check.hitType) {
      case 'groundBall':
        return 'groundout'
      case 'lineDrive':
        return 'lineout'
      case 'flyBall':
        return hasRunnerOnThirdUnderTwoOuts ? 'sacFly' : 'flyout'
      case 'popUp':
        return 'popout'
    }
  }
  const bigMargin = margin >= 5
  switch (check.hitType) {
    case 'groundBall':
      return 'infieldSingle'
    case 'lineDrive':
      return bigMargin ? 'double' : 'single'
    case 'flyBall':
      return bigMargin ? 'double' : 'single'
    case 'popUp':
      return 'single'
  }
}

export type PitcherRole = 'SP' | 'RP'

/** Stamina-scaled fatigue thresholds per Rulebook §8; baseline calibrated at Stamina 10. */
export function fatigueThresholds(role: PitcherRole, stamina: number): number[] {
  const scale = stamina / 10
  if (role === 'SP') return [Math.round(15 * scale), Math.round(21 * scale)]
  return [Math.round(6 * scale)]
}

/** Number of -1 Control penalties currently in effect for a pitcher with `outsRecorded`. */
export function fatiguePenalty(role: PitcherRole, stamina: number, outsRecorded: number): number {
  return fatigueThresholds(role, stamina).filter((t) => outsRecorded >= t).length
}

export const STEAL_SPEED_THRESHOLD = 12

export interface StealResult {
  runnerTotal: number
  catcherTotal: number
  safe: boolean
}

export function resolveSteal(runnerSpeed: number, catcherFielding: number): StealResult {
  const runnerTotal = roll2d6() + runnerSpeed
  const catcherTotal = roll2d6() + catcherFielding
  return { runnerTotal, catcherTotal, safe: runnerTotal > catcherTotal } // defense wins ties
}
