/**
 * Deliberately duplicated from app/src/types/player.ts rather than imported. A cross-directory
 * *value* import from api/ into app/src caused a production 500 (FUNCTION_INVOCATION_FAILED) —
 * see api/README.md — and this dev sandbox can't reach the live deployment to debug why, so /api
 * stays fully self-contained instead. These are plain data shapes (no behavior), so keeping them
 * structurally identical to app/src/types/player.ts by hand is low-risk; TypeScript/JSON don't
 * care that they're declared twice, only that the shapes match.
 */

export type Position = 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH' | 'OF' | 'SP' | 'RP'

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
  sprintSpeedFtPerSec?: number
  avgWithRisp?: number
  wrcPlus?: number
  opsPlus?: number
  fieldingRunsAboveAvg: number
}

export interface PitcherStatLine {
  outsRecorded: number
  appearances: number
  battersFaced: number
  strikeouts: number
  walks: number
  hits: number
  homeRuns: number
  avgFastballVeloMph?: number
  eraCloseAndLate?: number
  era?: number
  saves?: number
  groundBallRate?: number
  swingingStrikeRate?: number
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
  primaryPosition: Position
  pitcherPosition?: 'SP' | 'RP'
  team: string
  throwsBats: string
  statSource?: 'season' | 'career'
  season: number
  hitterStats?: HitterStatLine
  pitcherStats?: PitcherStatLine
  rosterTag?: string
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
