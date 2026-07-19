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
  avgStat: [[0, 0.19], [10, 0.23], [25, 0.245], [50, 0.26], [75, 0.278], [90, 0.295], [100, 0.345]] as Breakpoints,
  inverseK: [[0, 0.65], [10, 0.72], [25, 0.76], [50, 0.79], [75, 0.82], [90, 0.86], [100, 0.93]] as Breakpoints,
  iso: [[0, 0.05], [10, 0.1], [25, 0.13], [50, 0.16], [75, 0.195], [90, 0.23], [100, 0.35]] as Breakpoints,
  hrRate: [[0, 0.003], [10, 0.012], [25, 0.018], [50, 0.025], [75, 0.033], [90, 0.042], [100, 0.09]] as Breakpoints,
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
  kRate: [[0, 0.1], [10, 0.15], [25, 0.18], [50, 0.22], [75, 0.26], [90, 0.3], [100, 0.4]] as Breakpoints,
  inverseBb: [[0, 0.84], [10, 0.89], [25, 0.91], [50, 0.925], [75, 0.94], [90, 0.955], [100, 0.98]] as Breakpoints,
  outsPerAppearance: [[0, 2.5], [10, 3], [25, 4], [50, 6], [75, 12], [90, 17], [100, 21]] as Breakpoints,
  groundBallRate: [[0, 0.28], [10, 0.33], [25, 0.38], [50, 0.43], [75, 0.48], [90, 0.53], [100, 0.65]] as Breakpoints,
  swingingStrikeRate: [[0, 0.06], [10, 0.08], [25, 0.095], [50, 0.11], [75, 0.13], [90, 0.15], [100, 0.2]] as Breakpoints,
  inverseHr9: [[0, -2.2], [10, -1.6], [25, -1.3], [50, -1.1], [75, -0.9], [90, -0.7], [100, -0.2]] as Breakpoints,
  inverseEra: [[0, -6.5], [10, -5.0], [25, -4.3], [50, -3.8], [75, -3.3], [90, -2.8], [100, -1.0]] as Breakpoints,
  saveRate: [[0, 0], [50, 0], [75, 0.05], [90, 0.3], [100, 0.7]] as Breakpoints,
}

export { scoreAgainstReference }
