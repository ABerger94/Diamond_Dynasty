import type { DerivedRatings, HitterRatings, PitcherRatings, Player } from '../../types/player'
import {
  avg,
  hitterComponents,
  NEUTRAL_PERCENTILE,
  percentileToRating,
  pitcherComponents,
  round1,
  type HitterComponents,
  type PitcherComponents,
} from './shared'

/**
 * Percentile rank (0-100) of `value` within `population`, using the mean-rank method so ties
 * split the difference rather than all landing on the same edge.
 */
function percentileRank(value: number, population: number[]): number {
  if (population.length <= 1) return NEUTRAL_PERCENTILE
  let below = 0
  let equal = 0
  for (const v of population) {
    if (v < value) below++
    else if (v === value) equal++
  }
  return ((below + 0.5 * equal) / population.length) * 100
}

/** Percentile of `value` in `population`, filtering both to only the rows where the field is
 * defined — lets a rating fall back to a different stat when the primary one is missing. */
function percentileOfDefined<T>(rows: T[], getter: (row: T) => number | undefined, value: number | undefined): number | undefined {
  if (value === undefined) return undefined
  const population = rows.map(getter).filter((v): v is number => v !== undefined)
  return percentileRank(value, population)
}

/**
 * Derives 1-20 ratings for every hitter/pitcher in `players`, percentile-ranked against that
 * same pool. Call with the full active player pool so ratings stay relative and stable; ratings
 * will shift slightly as players are added to/removed from the pool. For scoring a single player
 * looked up on demand (no pool to rank against), see reference.ts instead.
 */
export function deriveRatingsForPool(players: Player[]): Map<string, DerivedRatings> {
  const hitters = players.filter((p) => p.hitterStats)
  const pitchers = players.filter((p) => p.pitcherStats)

  const hitterRows = hitters.map((p) => ({ id: p.id, c: hitterComponents(p.hitterStats!) }))
  const pitcherRows = pitchers.map((p) => ({ id: p.id, c: pitcherComponents(p.pitcherStats!) }))

  const pop = (rows: { c: HitterComponents }[], key: keyof HitterComponents) =>
    rows.map((r) => r.c[key] as number)
  const ppop = (rows: { c: PitcherComponents }[], key: keyof PitcherComponents) =>
    rows.map((r) => r.c[key] as number)

  const hitterPop = {
    avgStat: pop(hitterRows, 'avgStat'),
    inverseK: pop(hitterRows, 'inverseK'),
    iso: pop(hitterRows, 'iso'),
    hrRate: pop(hitterRows, 'hrRate'),
    bbRate: pop(hitterRows, 'bbRate'),
    bbToK: pop(hitterRows, 'bbToK'),
    sbRate: pop(hitterRows, 'sbRate'),
    triplesRate: pop(hitterRows, 'triplesRate'),
    fielding: pop(hitterRows, 'fielding'),
  }

  const pitcherPop = {
    kRate: ppop(pitcherRows, 'kRate'),
    inverseBb: ppop(pitcherRows, 'inverseBb'),
    outsPerAppearance: ppop(pitcherRows, 'outsPerAppearance'),
  }

  const result = new Map<string, DerivedRatings>()

  for (const row of hitterRows) {
    const c = row.c
    const contactPct = avg(percentileRank(c.avgStat, hitterPop.avgStat), percentileRank(c.inverseK, hitterPop.inverseK))
    const powerPct = avg(percentileRank(c.iso, hitterPop.iso), percentileRank(c.hrRate, hitterPop.hrRate))
    const disciplinePct = avg(percentileRank(c.bbRate, hitterPop.bbRate), percentileRank(c.bbToK, hitterPop.bbToK))

    const sprintPct = percentileOfDefined(hitterRows, (r) => r.c.sprintSpeed, c.sprintSpeed)
    const sbPct = percentileRank(c.sbRate, hitterPop.sbRate)
    const speedPct =
      sprintPct !== undefined
        ? avg(sprintPct, sbPct)
        : avg(sbPct, percentileRank(c.triplesRate, hitterPop.triplesRate))

    const fieldingPct = percentileRank(c.fielding, hitterPop.fielding)

    const riskAvgPct = percentileOfDefined(hitterRows, (r) => r.c.avgWithRisp, c.avgWithRisp)
    const overallPlusPct = percentileOfDefined(hitterRows, (r) => r.c.overallPlus, c.overallPlus)
    const clutchPct = riskAvgPct ?? overallPlusPct ?? NEUTRAL_PERCENTILE

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

    const existing = result.get(row.id) ?? {}
    result.set(row.id, { ...existing, hitter: { display, hidden, overall } })
  }

  for (const row of pitcherRows) {
    const c = row.c
    const velocityPct = percentileOfDefined(pitcherRows, (r) => r.c.velo, c.velo) ?? NEUTRAL_PERCENTILE
    const stuffPct = percentileRank(c.kRate, pitcherPop.kRate)
    const controlPct = percentileRank(c.inverseBb, pitcherPop.inverseBb)

    const gbPct = percentileOfDefined(pitcherRows, (r) => r.c.groundBallRate, c.groundBallRate)
    const swStrPct = percentileOfDefined(pitcherRows, (r) => r.c.swingingStrikeRate, c.swingingStrikeRate)
    const hr9Pct = percentileOfDefined(pitcherRows, (r) => r.c.inverseHr9, c.inverseHr9)
    const movementPct = gbPct ?? swStrPct ?? hr9Pct ?? NEUTRAL_PERCENTILE

    const staminaPct = percentileRank(c.outsPerAppearance, pitcherPop.outsPerAppearance)

    const closeEraPct = percentileOfDefined(pitcherRows, (r) => r.c.inverseCloseEra, c.inverseCloseEra)
    let clutchPct = closeEraPct
    if (clutchPct === undefined) {
      const eraPct = percentileOfDefined(pitcherRows, (r) => r.c.inverseEra, c.inverseEra)
      const savePct = percentileOfDefined(pitcherRows, (r) => r.c.saveRate, c.saveRate)
      if (eraPct !== undefined && savePct !== undefined) clutchPct = avg(eraPct, savePct)
      else clutchPct = eraPct ?? savePct ?? NEUTRAL_PERCENTILE
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

    const existing = result.get(row.id) ?? {}
    result.set(row.id, { ...existing, pitcher: { display, hidden, overall } })
  }

  return result
}
