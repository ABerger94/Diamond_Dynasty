import type { HitterStatLine, PitcherStatLine } from '../../types/player'

/** Rating scale bounds, per the v1.0 rulebook (§3). */
export const SCALE_MIN = 1
export const SCALE_MAX = 20
/** Neutral percentile used when neither a stat nor its fallback is available for a rating. */
export const NEUTRAL_PERCENTILE = 50

export function percentileToRating(percentile: number): number {
  return SCALE_MIN + (percentile / 100) * (SCALE_MAX - SCALE_MIN)
}

export function avg(...percentiles: number[]): number {
  return percentiles.reduce((sum, p) => sum + p, 0) / percentiles.length
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

// ---- Raw component values, one per rating. Two scoring paths consume these (see pool.ts and
// reference.ts): percentile-rank against a loaded pool, or against fixed reference breakpoints. ----

export interface HitterComponents {
  avgStat: number
  inverseK: number
  iso: number
  hrRate: number
  bbRate: number
  bbToK: number
  sbRate: number
  triplesRate: number
  fielding: number
  sprintSpeed?: number
  avgWithRisp?: number
  /** wRC+ or OPS+ (100 = average); Clutch fallback when avgWithRisp isn't available. */
  overallPlus?: number
}

export function hitterComponents(s: HitterStatLine): HitterComponents {
  const pa = s.plateAppearances || 1
  const ab = s.atBats || 1
  const avgStat = s.hits / ab
  const kRate = s.strikeouts / pa
  const slg = (s.hits - s.doubles - s.triples - s.homeRuns + 2 * s.doubles + 3 * s.triples + 4 * s.homeRuns) / ab
  return {
    avgStat,
    inverseK: 1 - kRate,
    iso: slg - avgStat,
    hrRate: s.homeRuns / pa,
    bbRate: s.walks / pa,
    bbToK: s.walks / Math.max(s.strikeouts, 1),
    sbRate: (s.stolenBases - 0.5 * s.caughtStealing) / pa,
    triplesRate: s.triples / pa,
    fielding: s.fieldingRunsAboveAvg,
    sprintSpeed: s.sprintSpeedFtPerSec,
    avgWithRisp: s.avgWithRisp,
    overallPlus: s.wrcPlus ?? s.opsPlus,
  }
}

export interface PitcherComponents {
  velo: number
  kRate: number
  inverseBb: number
  outsPerAppearance: number
  groundBallRate?: number
  swingingStrikeRate?: number
  inverseHr9?: number
  inverseCloseEra?: number
  inverseEra?: number
  saveRate?: number
}

export function pitcherComponents(s: PitcherStatLine): PitcherComponents {
  const bf = s.battersFaced || 1
  const appearances = s.appearances || 1
  return {
    velo: s.avgFastballVeloMph,
    kRate: s.strikeouts / bf,
    inverseBb: 1 - s.walks / bf,
    outsPerAppearance: s.outsRecorded / appearances,
    swingingStrikeRate: s.swingingStrikeRate,
    groundBallRate: s.groundBallRate,
    inverseHr9: s.hrPer9 !== undefined ? -s.hrPer9 : undefined,
    inverseCloseEra: s.eraCloseAndLate !== undefined ? -s.eraCloseAndLate : undefined,
    inverseEra: s.era !== undefined ? -s.era : undefined,
    saveRate: s.saves !== undefined ? s.saves / appearances : undefined,
  }
}
