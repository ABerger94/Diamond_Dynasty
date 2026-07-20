/** Lineup-slot positions (the 9 starting spots) plus a generic pitcher tag plus display-only tags
 * from raw source data ('OF' generic outfielder) that get resolved to concrete slots at import time.
 * There's no 'SP'/'RP' here — MLB's own player data never distinguishes them (every pitcher is
 * just "P"; starter vs. reliever is a role inferred from usage, not a field the API exposes), so
 * this app doesn't pretend to know it either for browsing/searching/display. SP/RP still exists as
 * a roster-building concept (Rulebook §2's 5 starting pitcher / 6 relief pitcher slots) — any
 * pitcher card is eligible for either roster section; which one is purely the roster builder's
 * choice (see Roster.startingPitchers/reliefPitchers in types/roster.ts), not an attribute of the
 * player. In-game fatigue (lib/rules/engine.ts) follows that same roster placement. */
export type Position = 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH' | 'OF' | 'P'

export const HITTER_POSITIONS: Position[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH']
export const PITCHER_POSITIONS: Position[] = ['P']
const OUTFIELD_SLOTS: Position[] = ['LF', 'CF', 'RF']

/** Which of the 9 lineup slots a hitter may fill: their primary slot, always DH, and for a
 * generic 'OF' tag (no LF/CF/RF split in the source data) any of the three outfield slots. */
export function eligibleLineupSlots(primaryPosition: Position): Position[] {
  if (primaryPosition === 'OF') return [...OUTFIELD_SLOTS, 'DH']
  if (primaryPosition === 'DH') return ['DH']
  return [primaryPosition, 'DH']
}

/** Raw MLB stat line used as input to the ratings engine. All counting stats are season totals.
 * sprintSpeedFtPerSec/avgWithRisp and wrcPlus/opsPlus are alternate inputs to the same Speed/Clutch
 * ratings — supply whichever your data source has (see src/lib/ratings.ts for the fallback rules). */
export interface HitterStatLine {
  plateAppearances: number
  atBats: number
  hits: number
  doubles: number
  triples: number
  homeRuns: number
  walks: number
  strikeouts: number
  stolenBases: number
  caughtStealing: number
  /** Sprint speed in ft/sec, if available; Speed falls back to SB/triples rate otherwise. */
  sprintSpeedFtPerSec?: number
  /** Batting average with runners in scoring position, if available; used for Clutch. */
  avgWithRisp?: number
  /** wRC+ (100 = league average), if available; Clutch falls back to this (or opsPlus) without avgWithRisp. */
  wrcPlus?: number
  /** OPS+ (100 = league average), if available; secondary Clutch fallback. */
  opsPlus?: number
  /** Fielding runs above average (e.g. DRS or OAA) at the player's primary position. */
  fieldingRunsAboveAvg: number
}

export interface PitcherStatLine {
  outsRecorded: number
  /** Number of appearances (starts + relief outings); used with outsRecorded for Stamina. */
  appearances: number
  battersFaced: number
  strikeouts: number
  walks: number
  hits: number
  homeRuns: number
  /** Statcast-only; absent from basic stats feeds (e.g. MLB Stats API's free endpoints). When
   * missing, Velocity falls back to a neutral rating rather than being penalized. */
  avgFastballVeloMph?: number
  /** ERA in high-leverage/late-and-close situations, if available; used for Clutch. */
  eraCloseAndLate?: number
  /** Season ERA; Clutch falls back to this (blended with save rate) without eraCloseAndLate. */
  era?: number
  /** Saves; part of the Clutch fallback (closers pitching the highest-leverage innings). */
  saves?: number
  /** True ground-ball rate, 0-1, if available; used for Movement. */
  groundBallRate?: number
  /** Swinging-strike rate, 0-1; Movement's 2nd-choice fallback without groundBallRate. */
  swingingStrikeRate?: number
  /** HR/9; Movement's last-resort fallback without either of the above. */
  hrPer9?: number
}

export interface HitterRatings {
  contact: number
  power: number
  discipline: number
  speed: number
  fielding: number
  clutch: number
}

export interface PitcherRatings {
  velocity: number
  stuff: number
  control: number
  movement: number
  stamina: number
  clutch: number
}

export interface Player {
  id: string
  name: string
  /** Hitting/display position — for pure pitchers this is always 'P'. */
  primaryPosition: Position
  team: string
  throwsBats: string
  /** For telling same-name players apart (card lookup, search results). */
  birthYear?: number
  /** For 'career', `season` is a representative year (e.g. debut) rather than the stats' actual
   * span — display "Career" instead of "{season} season" when this is 'career'. */
  statSource?: 'season' | 'career'
  season: number
  hitterStats?: HitterStatLine
  pitcherStats?: PitcherStatLine
  /** Flavor label shown on the card (e.g. "Two-Way", "Closer"); no gameplay effect on its own. */
  rosterTag?: string
  /** Ability names; mechanics implemented in src/lib/rules/abilities.ts. */
  abilities?: string[]
}

export interface DerivedRatings {
  hitter?: {
    display: HitterRatings
    hidden: HitterRatings
    overall: number
  }
  pitcher?: {
    display: PitcherRatings
    hidden: PitcherRatings
    overall: number
  }
}
