import type { AtBatOutcome, HitType, SwingType } from '../../types/game'
import type { HitterRatings, PitcherRatings, Player } from '../../types/player'

/**
 * Mechanical implementations of the six abilities in the source data (abilities.csv). Several of
 * the source descriptions reference mechanics this engine doesn't have (a ball/strike count, a
 * home-stadium/handedness matchup grid) — each such case has an explicit, documented ruling below
 * rather than being silently skipped. Update docs/RULEBOOK.md's Abilities section to match.
 */

export const ABILITY_NAMES = {
  TWO_WAY_PHENOM: 'Two-Way Phenom',
  BRONX_BOMBER: 'Bronx Bomber',
  SOTO_SHUFFLE: 'Soto Shuffle',
  CONTACT_MACHINE: 'Contact Machine',
  ELECTRIC_SPEED: 'Electric Speed',
  DRAGON_CUTTER: 'Dragon Cutter',
} as const

/** Source descriptions (abilities.csv) plus the ruling actually implemented, for display. */
export const ABILITY_DESCRIPTIONS: Record<string, string> = {
  [ABILITY_NAMES.TWO_WAY_PHENOM]: 'Occupies both a hitting lineup slot and a pitcher slot at once, and never accrues pitcher fatigue.',
  [ABILITY_NAMES.BRONX_BOMBER]: '+1 Power vs. right-handed pitching when batting at home.',
  [ABILITY_NAMES.SOTO_SHUFFLE]: '+1 Discipline on Contact Swings (ruling: stands in for "behind in the count", which this engine doesn\'t track).',
  [ABILITY_NAMES.CONTACT_MACHINE]: '+1 Contact, always on (ruling: stands in for "prevents rating drop under pressure").',
  [ABILITY_NAMES.ELECTRIC_SPEED]: 'A single on a line drive or fly ball automatically goes for a double.',
  [ABILITY_NAMES.DRAGON_CUTTER]: '+1 Stuff and +1 Velocity closing out the 9th inning (or later) with a 1-run lead.',
}

export function hasAbility(player: Player, name: string): boolean {
  return player.abilities?.includes(name) ?? false
}

/** True if the pitcher is exempt from the Rulebook §8 fatigue penalty this at-bat. */
export function isFatigueExempt(player: Player): boolean {
  return hasAbility(player, ABILITY_NAMES.TWO_WAY_PHENOM)
}

export interface BatterAbilityContext {
  swing: SwingType
  battingTeamIsHome: boolean
  pitcherThrows: string
}

/**
 * Applies batter-side ability adjustments before the at-bat roll.
 * - Bronx Bomber: "+1 Power vs standard RHP at home" — applied literally (pitcher throws 'R',
 *   batting team is home).
 * - Soto Shuffle: "+1 Discipline when falling behind 0-2" — this engine has no ball/strike count,
 *   so the closest faithful analog is the batter playing defensively; ruling: applies whenever
 *   Contact Swing is chosen (the same swing Discipline's bonus already keys off, engine.ts).
 * - Contact Machine: "reduces swing-miss penalty / prevents rating drop in high leverage" — this
 *   engine has no such penalty to negate; ruling: a flat +1 Contact, always on.
 */
export function applyBatterAbilities(player: Player, ratings: HitterRatings, ctx: BatterAbilityContext): HitterRatings {
  const r = { ...ratings }
  if (hasAbility(player, ABILITY_NAMES.BRONX_BOMBER) && ctx.pitcherThrows === 'R' && ctx.battingTeamIsHome) {
    r.power += 1
  }
  if (hasAbility(player, ABILITY_NAMES.SOTO_SHUFFLE) && ctx.swing === 'contact') {
    r.discipline += 1
  }
  if (hasAbility(player, ABILITY_NAMES.CONTACT_MACHINE)) {
    r.contact += 1
  }
  return r
}

export interface PitcherAbilityContext {
  inning: number
  /** Pitching team's lead, in runs (positive = pitching team ahead). */
  pitchingTeamLead: number
}

/** Dragon Cutter: "+1 Stuff and Velocity closing the 9th with a 1-run lead" — applied literally. */
export function applyPitcherAbilities(player: Player, ratings: PitcherRatings, ctx: PitcherAbilityContext): PitcherRatings {
  const r = { ...ratings }
  if (hasAbility(player, ABILITY_NAMES.DRAGON_CUTTER) && ctx.inning >= 9 && ctx.pitchingTeamLead === 1) {
    r.stuff += 1
    r.velocity += 1
  }
  return r
}

/**
 * Electric Speed: "guarantees extra-base advance on balls down the line or deep gaps" — ruling:
 * a single on a line drive or fly ball (the two hit types that can reach a gap or the line)
 * automatically upgrades to a double, bypassing the usual 5+ margin requirement (Rulebook §6).
 */
export function upgradeForElectricSpeed(outcome: AtBatOutcome, hitType: HitType | undefined, batter: Player): AtBatOutcome {
  if (outcome !== 'single') return outcome
  if (hitType !== 'lineDrive' && hitType !== 'flyBall') return outcome
  if (!hasAbility(batter, ABILITY_NAMES.ELECTRIC_SPEED)) return outcome
  return 'double'
}
