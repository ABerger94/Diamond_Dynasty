import type { PlayerWithRatings } from '../store/players'
import type { HitterRatings, PitcherRatings } from '../types/player'
import type { Roster } from '../types/roster'

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function avgHitterRatings(groups: HitterRatings[]): Partial<HitterRatings> {
  if (groups.length === 0) return {}
  const result: Partial<HitterRatings> = {}
  for (const key of Object.keys(groups[0]) as (keyof HitterRatings)[]) {
    result[key] = round1(avg(groups.map((g) => g[key]))!)
  }
  return result
}

function avgPitcherRatings(groups: PitcherRatings[]): Partial<PitcherRatings> {
  if (groups.length === 0) return {}
  const result: Partial<PitcherRatings> = {}
  for (const key of Object.keys(groups[0]) as (keyof PitcherRatings)[]) {
    result[key] = round1(avg(groups.map((g) => g[key]))!)
  }
  return result
}

export interface TeamRatings {
  /** Blend of offenseOverall and pitchingOverall; null if the roster has neither hitters nor pitchers assigned yet. */
  overall: number | null
  offenseOverall: number | null
  pitchingOverall: number | null
  hitterAverages: Partial<HitterRatings>
  pitcherAverages: Partial<PitcherRatings>
  lineupCount: number
  pitcherCount: number
}

function entriesFor(ids: string[], poolById: Map<string, PlayerWithRatings>): PlayerWithRatings[] {
  return ids.map((id) => poolById.get(id)).filter((e): e is PlayerWithRatings => !!e)
}

/**
 * Team Overall for the Roster Builder — averages the ratings of whoever's actually assigned to a
 * roster spot, so an unfinished roster naturally reads lower rather than erroring. Offense is the
 * 9 starting lineup slots only (bench doesn't factor in — they're not on the field). Pitching
 * weights the rotation (SP) 2x against the bullpen (RP) 1x, since starters throw the bulk of a
 * game's innings at the table (Rulebook §8) — a deep bullpen shouldn't outweigh a thin rotation.
 */
export function computeTeamRatings(roster: Roster, poolById: Map<string, PlayerWithRatings>): TeamRatings {
  const lineupEntries = entriesFor(Object.values(roster.lineup).filter((id): id is string => !!id), poolById)
  const spEntries = entriesFor(roster.startingPitchers, poolById)
  const rpEntries = entriesFor(roster.reliefPitchers, poolById)

  const offenseOverall = avg(lineupEntries.map((e) => e.ratings.hitter?.overall).filter((n): n is number => n !== undefined))

  const spOverall = avg(spEntries.map((e) => e.ratings.pitcher?.overall).filter((n): n is number => n !== undefined))
  const rpOverall = avg(rpEntries.map((e) => e.ratings.pitcher?.overall).filter((n): n is number => n !== undefined))
  const weighted: [number, number][] = []
  if (spOverall !== null) weighted.push([spOverall, 2])
  if (rpOverall !== null) weighted.push([rpOverall, 1])
  const pitchingOverall = weighted.length
    ? weighted.reduce((sum, [v, w]) => sum + v * w, 0) / weighted.reduce((sum, [, w]) => sum + w, 0)
    : null

  const overall =
    offenseOverall !== null && pitchingOverall !== null
      ? (offenseOverall + pitchingOverall) / 2
      : (offenseOverall ?? pitchingOverall)

  const hitterGroups = lineupEntries.map((e) => e.ratings.hitter?.display).filter((d): d is HitterRatings => !!d)
  const pitcherGroups = [...spEntries, ...rpEntries].map((e) => e.ratings.pitcher?.display).filter((d): d is PitcherRatings => !!d)

  return {
    overall: overall !== null ? round1(overall) : null,
    offenseOverall: offenseOverall !== null ? round1(offenseOverall) : null,
    pitchingOverall: pitchingOverall !== null ? round1(pitchingOverall) : null,
    hitterAverages: avgHitterRatings(hitterGroups),
    pitcherAverages: avgPitcherRatings(pitcherGroups),
    lineupCount: lineupEntries.length,
    pitcherCount: spEntries.length + rpEntries.length,
  }
}
