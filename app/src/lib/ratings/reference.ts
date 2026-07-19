import type { DerivedRatings, HitterRatings, PitcherRatings, Player } from '../../types/player'
import { HITTER_REFERENCE, PITCHER_REFERENCE, scoreAgainstReference } from './referenceDistributions'
import { avg, hitterComponents, NEUTRAL_PERCENTILE, percentileToRating, pitcherComponents, round1 } from './shared'

/**
 * Derives 1-20 ratings for a single player against fixed reference-distribution breakpoints
 * instead of a loaded pool. Use this for a player looked up on demand (e.g. from the live MLB
 * search) where there's no comparable pool to percentile-rank against — see pool.ts for the
 * pool-relative version used by the static featured roster.
 */
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
    const velocityPct = scoreAgainstReference(c.velo, PITCHER_REFERENCE.velo)
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
