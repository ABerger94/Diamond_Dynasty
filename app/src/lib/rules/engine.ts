/**
 * Diamond Dynasty is played at the table with real cards and real dice — this app does not
 * simulate at-bats, roll dice, or decide outcomes (see docs/RULEBOOK.md's Companion App note).
 * What's here is purely informational bookkeeping the scorekeeper benefits from having on
 * screen: fatigue status and steal eligibility, both derived from ratings/outs already being
 * tracked for the scorecard, not from anything the app itself resolved.
 */

export type PitcherRole = 'SP' | 'RP'

/** Stamina-scaled fatigue thresholds per Rulebook §8; baseline calibrated at Stamina 10. */
export function fatigueThresholds(role: PitcherRole, stamina: number): number[] {
  const scale = stamina / 10
  if (role === 'SP') return [Math.round(15 * scale), Math.round(21 * scale)]
  return [Math.round(6 * scale)]
}

/** Number of -1 Control penalties currently in effect for a pitcher with `outsRecorded`, for
 * display only — the players apply this to their own dice math at the table. */
export function fatiguePenalty(role: PitcherRole, stamina: number, outsRecorded: number): number {
  return fatigueThresholds(role, stamina).filter((t) => outsRecorded >= t).length
}

/** Minimum Speed to legally attempt a steal, per Rulebook §7. */
export const STEAL_SPEED_THRESHOLD = 12
