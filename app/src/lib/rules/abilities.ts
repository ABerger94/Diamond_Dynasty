import type { Player } from '../../types/player'

/**
 * Ability reference data (abilities.csv). The app doesn't run the game — players apply these at
 * the table themselves — so this module is purely lookup/display helpers, not resolution logic.
 * Update docs/RULEBOOK.md's Abilities section to match if these change.
 */

export const ABILITY_NAMES = {
  TWO_WAY_PHENOM: 'Two-Way Phenom',
  BRONX_BOMBER: 'Bronx Bomber',
  SOTO_SHUFFLE: 'Soto Shuffle',
  CONTACT_MACHINE: 'Contact Machine',
  ELECTRIC_SPEED: 'Electric Speed',
  DRAGON_CUTTER: 'Dragon Cutter',
} as const

/** Source descriptions (abilities.csv), for display on the card and as an at-bat reminder. */
export const ABILITY_DESCRIPTIONS: Record<string, string> = {
  [ABILITY_NAMES.TWO_WAY_PHENOM]: 'Occupies both a hitting lineup slot and a pitcher slot at once, and never accrues pitcher fatigue.',
  [ABILITY_NAMES.BRONX_BOMBER]: '+1 Power vs. right-handed pitching when batting at home.',
  [ABILITY_NAMES.SOTO_SHUFFLE]: '+1 Discipline when falling behind in the count with two strikes.',
  [ABILITY_NAMES.CONTACT_MACHINE]: 'Reduces swing-and-miss penalty; resists rating drops in high-leverage situations.',
  [ABILITY_NAMES.ELECTRIC_SPEED]: 'Guarantees an extra-base advance on balls hit down the line or into deep gaps.',
  [ABILITY_NAMES.DRAGON_CUTTER]: '+1 Stuff and +1 Velocity closing out the 9th inning (or later) with a 1-run lead.',
}

export function hasAbility(player: Player, name: string): boolean {
  return player.abilities?.includes(name) ?? false
}

/** True if the pitcher is exempt from the Rulebook §8 fatigue penalty (Two-Way Phenom). */
export function isFatigueExempt(player: Player): boolean {
  return hasAbility(player, ABILITY_NAMES.TWO_WAY_PHENOM)
}
