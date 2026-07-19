/**
 * Deliberately duplicated from app/src/lib/ratings/{shared,referenceDistributions,reference}.ts
 * rather than imported — see api/_lib/types.ts for why. Keep in sync by hand if the app's version
 * changes; this is the price of a cross-directory value import having broken production once
 * already (api/README.md) with no way to debug it from this sandbox.
 */

import type { DerivedRatings, HitterRatings, HitterStatLine, PitcherRatings, PitcherStatLine, Player } from './types'

const SCALE_MIN = 1
const SCALE_MAX = 20
const NEUTRAL_PERCENTILE = 50

function percentileToRating(percentile: number): number {
  return SCALE_MIN + (percentile / 100) * (SCALE_MAX - SCALE_MIN)
}

function avg(...percentiles: number[]): number {
  return percentiles.reduce((sum, p) => sum + p, 0) / percentiles.length
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

interface HitterComponents {
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
  overallPlus?: number
}

function hitterComponents(s: HitterStatLine): HitterComponents {
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

interface PitcherComponents {
  velo?: number
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

function pitcherComponents(s: PitcherStatLine): PitcherComponents {
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

type Breakpoints = [percentile: number, value: number][]

function scoreAgainstReference(value: number, breakpoints: Breakpoints): number {
  const first = breakpoints[0]
  const last = breakpoints[breakpoints.length - 1]
  if (value <= first[1]) return first[0]
  if (value >= last[1]) return last[0]
  for (let i = 0; i < breakpoints.length - 1; i++) {
    const [p0, v0] = breakpoints[i]
    const [p1, v1] = breakpoints[i + 1]
    if (value >= v0 && value <= v1) {
      const t = (value - v0) / (v1 - v0)
      return p0 + t * (p1 - p0)
    }
  }
  return 50
}

// Calibration notes: see app/src/lib/ratings/referenceDistributions.ts (identical values).
const HITTER_REFERENCE = {
  avgStat: [[0, 0.19], [10, 0.23], [25, 0.245], [50, 0.26], [75, 0.278], [90, 0.295], [100, 0.345]] as Breakpoints,
  inverseK: [[0, 0.65], [10, 0.72], [25, 0.76], [50, 0.79], [75, 0.82], [90, 0.86], [100, 0.93]] as Breakpoints,
  iso: [[0, 0.05], [10, 0.1], [25, 0.13], [50, 0.16], [75, 0.195], [90, 0.23], [100, 0.35]] as Breakpoints,
  hrRate: [[0, 0.003], [10, 0.012], [25, 0.018], [50, 0.025], [75, 0.033], [90, 0.042], [100, 0.09]] as Breakpoints,
  bbRate: [[0, 0.02], [10, 0.045], [25, 0.06], [50, 0.08], [75, 0.1], [90, 0.13], [100, 0.2]] as Breakpoints,
  bbToK: [[0, 0.1], [10, 0.25], [25, 0.35], [50, 0.45], [75, 0.65], [90, 0.9], [100, 2.5]] as Breakpoints,
  sbRate: [[0, -0.01], [10, 0], [25, 0.002], [50, 0.006], [75, 0.015], [90, 0.035], [100, 0.1]] as Breakpoints,
  sprintSpeed: [[0, 23], [10, 25], [25, 26], [50, 27], [75, 28], [90, 29.5], [100, 31]] as Breakpoints,
  triplesRate: [[0, 0], [10, 0], [25, 0.001], [50, 0.003], [75, 0.006], [90, 0.011], [100, 0.03]] as Breakpoints,
  fielding: [[0, -20], [10, -10], [25, -4], [50, 0], [75, 4], [90, 10], [100, 25]] as Breakpoints,
  overallPlus: [[0, 55], [10, 75], [25, 88], [50, 100], [75, 115], [90, 135], [100, 220]] as Breakpoints,
}

const PITCHER_REFERENCE = {
  velo: [[0, 88], [10, 91], [25, 92.5], [50, 94], [75, 95.5], [90, 97], [100, 101]] as Breakpoints,
  kRate: [[0, 0.1], [10, 0.15], [25, 0.18], [50, 0.22], [75, 0.26], [90, 0.3], [100, 0.4]] as Breakpoints,
  inverseBb: [[0, 0.84], [10, 0.89], [25, 0.91], [50, 0.925], [75, 0.94], [90, 0.955], [100, 0.98]] as Breakpoints,
  outsPerAppearance: [[0, 2.5], [10, 3], [25, 4], [50, 6], [75, 12], [90, 17], [100, 21]] as Breakpoints,
  groundBallRate: [[0, 0.28], [10, 0.33], [25, 0.38], [50, 0.43], [75, 0.48], [90, 0.53], [100, 0.65]] as Breakpoints,
  swingingStrikeRate: [[0, 0.06], [10, 0.08], [25, 0.095], [50, 0.11], [75, 0.13], [90, 0.15], [100, 0.2]] as Breakpoints,
  inverseHr9: [[0, -2.2], [10, -1.6], [25, -1.3], [50, -1.1], [75, -0.9], [90, -0.7], [100, -0.2]] as Breakpoints,
  inverseEra: [[0, -6.5], [10, -5.0], [25, -4.3], [50, -3.8], [75, -3.3], [90, -2.8], [100, -1.0]] as Breakpoints,
  saveRate: [[0, 0], [50, 0], [75, 0.05], [90, 0.3], [100, 0.7]] as Breakpoints,
}

/** Derives 1-20 ratings for a single player against fixed reference-distribution breakpoints —
 * see app/src/lib/ratings/reference.ts (identical logic) for the pool-relative alternative and
 * fallback-chain rationale. */
export function deriveRatingsFromReference(player: Player): DerivedRatings {
  const result: DerivedRatings = {}

  if (player.hitterStats) {
    const c = hitterComponents(player.hitterStats)
    const contactPct = avg(scoreAgainstReference(c.avgStat, HITTER_REFERENCE.avgStat), scoreAgainstReference(c.inverseK, HITTER_REFERENCE.inverseK))
    const powerPct = avg(scoreAgainstReference(c.iso, HITTER_REFERENCE.iso), scoreAgainstReference(c.hrRate, HITTER_REFERENCE.hrRate))
    const disciplinePct = avg(scoreAgainstReference(c.bbRate, HITTER_REFERENCE.bbRate), scoreAgainstReference(c.bbToK, HITTER_REFERENCE.bbToK))

    const sbPct = scoreAgainstReference(c.sbRate, HITTER_REFERENCE.sbRate)
    const speedPct =
      c.sprintSpeed !== undefined
        ? avg(scoreAgainstReference(c.sprintSpeed, HITTER_REFERENCE.sprintSpeed), sbPct)
        : avg(sbPct, scoreAgainstReference(c.triplesRate, HITTER_REFERENCE.triplesRate))

    const fieldingPct = scoreAgainstReference(c.fielding, HITTER_REFERENCE.fielding)

    const clutchPct =
      c.avgWithRisp !== undefined
        ? scoreAgainstReference(c.avgWithRisp, HITTER_REFERENCE.avgStat)
        : c.overallPlus !== undefined
          ? scoreAgainstReference(c.overallPlus, HITTER_REFERENCE.overallPlus)
          : NEUTRAL_PERCENTILE

    const hidden: HitterRatings = {
      contact: round1(percentileToRating(contactPct)),
      power: round1(percentileToRating(powerPct)),
      discipline: round1(percentileToRating(disciplinePct)),
      speed: round1(percentileToRating(speedPct)),
      fielding: round1(percentileToRating(fieldingPct)),
      clutch: round1(percentileToRating(clutchPct)),
    }
    const display: HitterRatings = {
      contact: Math.round(hidden.contact),
      power: Math.round(hidden.power),
      discipline: Math.round(hidden.discipline),
      speed: Math.round(hidden.speed),
      fielding: Math.round(hidden.fielding),
      clutch: Math.round(hidden.clutch),
    }
    const overall = Math.round(
      (hidden.contact + hidden.power + hidden.discipline + hidden.speed + hidden.fielding + hidden.clutch) / 6,
    )
    result.hitter = { display, hidden, overall }
  }

  if (player.pitcherStats) {
    const c = pitcherComponents(player.pitcherStats)
    const velocityPct = c.velo !== undefined ? scoreAgainstReference(c.velo, PITCHER_REFERENCE.velo) : NEUTRAL_PERCENTILE
    const stuffPct = scoreAgainstReference(c.kRate, PITCHER_REFERENCE.kRate)
    const controlPct = scoreAgainstReference(c.inverseBb, PITCHER_REFERENCE.inverseBb)

    const movementPct =
      c.groundBallRate !== undefined
        ? scoreAgainstReference(c.groundBallRate, PITCHER_REFERENCE.groundBallRate)
        : c.swingingStrikeRate !== undefined
          ? scoreAgainstReference(c.swingingStrikeRate, PITCHER_REFERENCE.swingingStrikeRate)
          : c.inverseHr9 !== undefined
            ? scoreAgainstReference(c.inverseHr9, PITCHER_REFERENCE.inverseHr9)
            : NEUTRAL_PERCENTILE

    const staminaPct = scoreAgainstReference(c.outsPerAppearance, PITCHER_REFERENCE.outsPerAppearance)

    let clutchPct: number
    if (c.inverseCloseEra !== undefined) {
      clutchPct = scoreAgainstReference(c.inverseCloseEra, PITCHER_REFERENCE.inverseEra)
    } else if (c.inverseEra !== undefined && c.saveRate !== undefined) {
      clutchPct = avg(scoreAgainstReference(c.inverseEra, PITCHER_REFERENCE.inverseEra), scoreAgainstReference(c.saveRate, PITCHER_REFERENCE.saveRate))
    } else if (c.inverseEra !== undefined) {
      clutchPct = scoreAgainstReference(c.inverseEra, PITCHER_REFERENCE.inverseEra)
    } else if (c.saveRate !== undefined) {
      clutchPct = scoreAgainstReference(c.saveRate, PITCHER_REFERENCE.saveRate)
    } else {
      clutchPct = NEUTRAL_PERCENTILE
    }

    const hidden: PitcherRatings = {
      velocity: round1(percentileToRating(velocityPct)),
      stuff: round1(percentileToRating(stuffPct)),
      control: round1(percentileToRating(controlPct)),
      movement: round1(percentileToRating(movementPct)),
      stamina: round1(percentileToRating(staminaPct)),
      clutch: round1(percentileToRating(clutchPct)),
    }
    const display: PitcherRatings = {
      velocity: Math.round(hidden.velocity),
      stuff: Math.round(hidden.stuff),
      control: Math.round(hidden.control),
      movement: Math.round(hidden.movement),
      stamina: Math.round(hidden.stamina),
      clutch: Math.round(hidden.clutch),
    }
    const overall = Math.round(
      (hidden.velocity + hidden.stuff + hidden.control + hidden.movement + hidden.stamina + hidden.clutch) / 6,
    )
    result.pitcher = { display, hidden, overall }
  }

  return result
}
