export type Position = 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH' | 'SP' | 'RP'

export const HITTER_POSITIONS: Position[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH']
export const PITCHER_POSITIONS: Position[] = ['SP', 'RP']

/** Raw MLB stat line used as input to the ratings engine. All counting stats are season totals. */
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
  sprintSpeedFtPerSec: number
  /** Batting average with runners in scoring position; used for Clutch. */
  avgWithRisp: number
  /** Fielding runs above average (or OAA-style metric) at the player's primary position. */
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
  avgFastballVeloMph: number
  /** ERA in high-leverage/late-and-close situations; used for Clutch. */
  eraCloseAndLate: number
  /** Ground-ball rate, 0-1; used for Movement. */
  groundBallRate: number
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
  primaryPosition: Position
  team: string
  throwsBats: string
  isPitcher: boolean
  season: number
  hitterStats?: HitterStatLine
  pitcherStats?: PitcherStatLine
  /** Reserved for future ability system; unused by the v1 engine. */
  abilities?: string[]
}

/** Hidden decimal ratings, one field per rating name, e.g. { contact: 14.68 }. */
export type RatingBlock<T extends string> = Record<T, number>

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
