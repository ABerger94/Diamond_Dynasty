/**
 * Fixed percentile breakpoints for each raw stat component, used to rate a single player looked
 * up on demand (no full pool available to rank against — see reference.ts).
 *
 * CALIBRATION NOTE: these are reasonable approximations of modern-MLB qualified-player
 * distributions from general sabermetric knowledge, not computed from a real bulk dataset (this
 * sandbox can't reach any stats API to compute exact ones — see the Companion App section of the
 * rulebook). Treat as a v1 baseline: replace with breakpoints computed from a real bulk export
 * (e.g. via a fetch script run outside this environment) once one exists, without touching
 * anything else in the ratings pipeline.
 *
 * Each table is [percentile, value] pairs, sorted by value ascending, spanning roughly the 0th to
 * 100th percentile of a qualified modern-era player.
 */

export type Breakpoints = [percentile: number, value: number][]

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

export const HITTER_REFERENCE = {
  /**
   * Raised toward an all-time-blended norm rather than a single high-offense era. Unlike
   * strikeout rate (which has climbed steadily — see PITCHER_REFERENCE.kRate), league batting
   * average has fallen over time: the high-offense 1990s-2000s ran a league average roughly
   * .265-.270 vs. the 2020s' ~.245, so a hitter whose career was concentrated in that stretch
   * gets a raw AVG that reads as more dominant against a modern-only benchmark than it actually
   * was relative to their own contemporaries. Moving the bar up (harder to clear) corrects the
   * same direction of error as kRate's move down (easier to clear) — both are pointed at
   * "don't let league-wide era drift masquerade as individual quality." Top of the curve (100th)
   * is left unchanged since a truly dominant peak season is dominant in any era. Best-effort
   * estimate, not measured against real bulk historical data (same caveat as the rest of this file).
   */
  avgStat: [[0, 0.2], [10, 0.242], [25, 0.258], [50, 0.273], [75, 0.29], [90, 0.305], [100, 0.35]] as Breakpoints,
  inverseK: [[0, 0.65], [10, 0.72], [25, 0.76], [50, 0.79], [75, 0.82], [90, 0.86], [100, 0.93]] as Breakpoints,
  /**
   * Also raised, though more modestly than avgStat — power's historical trend is less one-
   * directional (the 1994-2004 high-offense era and the post-2015 launch-angle era are both
   * elevated relative to the decades before them), so the case for correction is weaker. Still
   * nudged up since Piazza's own prime (1993-2002) sits inside that first elevated stretch.
   */
  iso: [[0, 0.056], [10, 0.108], [25, 0.138], [50, 0.168], [75, 0.202], [90, 0.235], [100, 0.35]] as Breakpoints,
  hrRate: [[0, 0.0035], [10, 0.013], [25, 0.02], [50, 0.0275], [75, 0.036], [90, 0.045], [100, 0.09]] as Breakpoints,
  bbRate: [[0, 0.02], [10, 0.045], [25, 0.06], [50, 0.08], [75, 0.1], [90, 0.13], [100, 0.2]] as Breakpoints,
  bbToK: [[0, 0.1], [10, 0.25], [25, 0.35], [50, 0.45], [75, 0.65], [90, 0.9], [100, 2.5]] as Breakpoints,
  sbRate: [[0, -0.01], [10, 0], [25, 0.002], [50, 0.006], [75, 0.015], [90, 0.035], [100, 0.1]] as Breakpoints,
  /** Sprint speed in ft/sec (Statcast-era only; most sources won't have this — see reference.ts). */
  sprintSpeed: [[0, 23], [10, 25], [25, 26], [50, 27], [75, 28], [90, 29.5], [100, 31]] as Breakpoints,
  triplesRate: [[0, 0], [10, 0], [25, 0.001], [50, 0.003], [75, 0.006], [90, 0.011], [100, 0.03]] as Breakpoints,
  fielding: [[0, -20], [10, -10], [25, -4], [50, 0], [75, 4], [90, 10], [100, 25]] as Breakpoints,
  overallPlus: [[0, 55], [10, 75], [25, 88], [50, 100], [75, 115], [90, 135], [100, 220]] as Breakpoints,
}

export const PITCHER_REFERENCE = {
  velo: [[0, 88], [10, 91], [25, 92.5], [50, 94], [75, 95.5], [90, 97], [100, 101]] as Breakpoints,
  /**
   * Softened toward an all-time-blended norm rather than strictly today's game. League-average
   * strikeout rate has risen roughly 15% -> 23% of PAs from the 1960s-90s to the 2020s, so a
   * historical pitcher's real (unremarkable-for-their-own-era) K rate was reading as mediocre
   * against a modern-only benchmark, while a hitter from a higher-average era read as inflated on
   * the hitter side — see reference.ts's Velocity fallback comment for the related issue. This is
   * still a best-effort estimate, not measured across real historical bulk data (same caveat as
   * the rest of this file); the top of the curve is left close to unchanged since a dominant
   * strikeout rate is dominant in any era.
   */
  kRate: [[0, 0.07], [10, 0.12], [25, 0.15], [50, 0.19], [75, 0.24], [90, 0.29], [100, 0.4]] as Breakpoints,
  inverseBb: [[0, 0.84], [10, 0.89], [25, 0.91], [50, 0.925], [75, 0.94], [90, 0.955], [100, 0.98]] as Breakpoints,
  outsPerAppearance: [[0, 2.5], [10, 3], [25, 4], [50, 6], [75, 12], [90, 17], [100, 21]] as Breakpoints,
  groundBallRate: [[0, 0.28], [10, 0.33], [25, 0.38], [50, 0.43], [75, 0.48], [90, 0.53], [100, 0.65]] as Breakpoints,
  swingingStrikeRate: [[0, 0.06], [10, 0.08], [25, 0.095], [50, 0.11], [75, 0.13], [90, 0.15], [100, 0.2]] as Breakpoints,
  /**
   * Widened at the top end toward an all-time-blended norm. Home-run rate has swung far more
   * dramatically across MLB history than strikeout or walk rate — dead-ball-era pitchers (pre-
   * 1920) commonly allowed under 0.1 HR/9, something no modern-era pitcher does, while modern
   * league-average sits around 1.1. The old 100th-percentile mark (-0.2, i.e. 0.2 HR/9) meant any
   * pitcher from that low-home-run era clamped straight to a maxed-out Movement score — not
   * because they were personally exceptional at it, but because the entire league allowed almost
   * no home runs at the time. Moving the ceiling to -0.05 leaves room to differentiate within that
   * historically-dominant tier instead of flattening it all to 20. Best-effort estimate, not
   * measured against real bulk historical data (same caveat as the rest of this file).
   */
  inverseHr9: [[0, -2.4], [10, -1.7], [25, -1.35], [50, -1.05], [75, -0.8], [90, -0.55], [100, -0.05]] as Breakpoints,
  inverseEra: [[0, -6.5], [10, -5.0], [25, -4.3], [50, -3.8], [75, -3.3], [90, -2.8], [100, -1.0]] as Breakpoints,
  saveRate: [[0, 0], [50, 0], [75, 0.05], [90, 0.3], [100, 0.7]] as Breakpoints,
}

export { scoreAgainstReference }
