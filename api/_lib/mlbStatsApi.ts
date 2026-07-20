/**
 * Thin wrapper around the free, public MLB Stats API (statsapi.mlb.com). No API key required.
 *
 * IMPORTANT — UNVERIFIED: this dev environment's network policy blocks statsapi.mlb.com, so none
 * of this has been tested against the live API. Endpoint paths are accurate to public knowledge
 * of the API as of early 2026, but exact field names in the response bodies are reconstructed
 * from memory/documentation and may not match exactly. Every stat extraction below tries a couple
 * of plausible key names and falls back to a safe default rather than throwing, but if ratings
 * come back looking wrong after deploying, the first thing to check is console-logging the raw
 * MLB response and comparing it to what `extractHitterSplit`/`extractPitcherSplit` expect.
 */

import type { HitterStatLine, PitcherStatLine } from './types'

const BASE = 'https://statsapi.mlb.com/api/v1'

async function mlbFetch(path: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`MLB Stats API ${path} -> ${res.status}`)
  return res.json()
}

export interface MlbPersonSummary {
  id: string
  fullName: string
  primaryPosition: string
  team: string
  bats: string
  throws: string
  /** YYYY-MM-DD, if the endpoint included it — for telling same-name players apart. Season/search
   * *list* endpoints may return leaner records than the full person bio (/people/{id}, used by
   * lookup.ts) does; UNVERIFIED whether birthDate is actually present at this level. */
  birthDate?: string
}

function toPersonSummary(p: any): MlbPersonSummary {
  return {
    id: String(p.id),
    fullName: p.fullName ?? p.nameFirstLast ?? 'Unknown',
    primaryPosition: p.primaryPosition?.abbreviation ?? p.primaryPosition?.code ?? '',
    team: p.currentTeam?.abbreviation ?? p.currentTeam?.name ?? '',
    bats: p.batSide?.code ?? '',
    throws: p.pitchHand?.code ?? '',
    birthDate: p.birthDate,
  }
}

/** All players for a given season (MLB = sportId 1). Season can be any year the sport played,
 * including well into the 1800s. Used as the fallback tier of name search (searchPlayersByName)
 * and directly when a caller already knows the season. */
export async function fetchSeasonPlayers(season: number): Promise<MlbPersonSummary[]> {
  const data = await mlbFetch(`/sports/1/players?season=${season}`)
  const people = data?.people ?? []
  return people.map(toPersonSummary)
}

/** A bounded, historically-spread sample of seasons — not all ~150 MLB has played, which would be
 * far too slow to scan in one request. Used wherever a caller wants "across all of MLB history"
 * results without a season of their own to anchor on (name-search fallback below, and search.ts's
 * position-only browse). "All of history" here really means "a representative cross-section" —
 * see api/README.md. */
export const HISTORY_SAMPLE_SEASONS = (() => {
  const currentYear = new Date().getFullYear()
  const decades = [2010, 2000, 1990, 1980, 1970, 1960, 1950, 1940, 1930, 1920, 1910, 1900]
  return [currentYear, currentYear - 1, ...decades]
})()

/** Scans a list of seasons via fetchSeasonPlayers, keeping only players matching `predicate` (or
 * everyone, if omitted), deduped by id, stopping early once `ceiling` matches are found so a
 * common filter doesn't force scanning every season in the list. One bad season doesn't kill the
 * whole scan. */
export async function scanSeasonsForPlayers(
  seasons: number[],
  ceiling: number,
  predicate?: (p: MlbPersonSummary) => boolean,
): Promise<MlbPersonSummary[]> {
  const seen = new Map<string, MlbPersonSummary>()
  for (const season of seasons) {
    try {
      const players = await fetchSeasonPlayers(season)
      for (const p of players) {
        if (!predicate || predicate(p)) seen.set(p.id, p)
      }
    } catch {
      // one bad season shouldn't kill the whole scan
    }
    if (seen.size >= ceiling) break
  }
  return [...seen.values()]
}

/**
 * Name search across ALL of MLB history, not scoped to one season — this is what "search all of
 * recorded MLB history" actually needs, since a real person like Babe Ruth won't appear in any
 * single current-season roster fetch. Tries the global /people/search endpoint first (lower
 * confidence this exists with this exact name/param — UNVERIFIED, see file header); if that
 * fails or returns nothing, falls back to scanning HISTORY_SAMPLE_SEASONS so search still returns
 * *something* useful rather than nothing. A true full-history index isn't available from a single
 * free endpoint as far as this integration knows — see api/README.md.
 */
export async function searchPlayersByName(query: string): Promise<MlbPersonSummary[]> {
  try {
    const data = await mlbFetch(`/people/search?names=${encodeURIComponent(query)}`)
    const people = data?.people ?? []
    if (people.length > 0) {
      return people.map(toPersonSummary)
    }
  } catch {
    // fall through to the season-scan fallback below
  }

  const q = query.toLowerCase()
  // Not a real result cap — search.ts does the actual (much higher) response-size ceiling; this
  // only controls how hard this fallback path works before giving up on finding more matches.
  return scanSeasonsForPlayers(HISTORY_SAMPLE_SEASONS, 300, (p) => p.fullName.toLowerCase().includes(q))
}

export async function fetchPersonBio(personId: string): Promise<any> {
  const data = await mlbFetch(`/people/${personId}`)
  return data?.people?.[0] ?? null
}

export async function fetchSeasonStats(personId: string, season: number, group: 'hitting' | 'pitching' | 'fielding'): Promise<any> {
  const data = await mlbFetch(`/people/${personId}/stats?stats=season&group=${group}&season=${season}`)
  const splits = data?.stats?.[0]?.splits ?? []
  return splits[0]?.stat ?? null
}

/** Career totals — same stat field shape as a season split, just aggregated, so the same
 * extractHitterStatLine/extractPitcherStatLine work unchanged. Used when the caller doesn't know
 * (or doesn't want to guess) which season a player from search results actually played in. */
export async function fetchCareerStats(personId: string, group: 'hitting' | 'pitching' | 'fielding'): Promise<any> {
  const data = await mlbFetch(`/people/${personId}/stats?stats=career&group=${group}`)
  const splits = data?.stats?.[0]?.splits ?? []
  return splits[0]?.stat ?? null
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number)
  return typeof n === 'number' && !Number.isNaN(n) ? n : fallback
}

/** Innings-pitched thirds notation (194.1 = 194 IP + 1 out) to total outs. */
function inningsToOuts(ip: unknown): number {
  const s = String(ip ?? '0')
  const [whole, thirds] = s.split('.')
  return num(whole) * 3 + num(thirds)
}

export function extractHitterStatLine(stat: any): HitterStatLine | null {
  if (!stat) return null
  return {
    plateAppearances: num(stat.plateAppearances),
    atBats: num(stat.atBats),
    hits: num(stat.hits),
    doubles: num(stat.doubles),
    triples: num(stat.triples),
    homeRuns: num(stat.homeRuns),
    walks: num(stat.baseOnBalls ?? stat.walks),
    strikeouts: num(stat.strikeOuts ?? stat.strikeouts),
    stolenBases: num(stat.stolenBases),
    caughtStealing: num(stat.caughtStealing),
    // MLB Stats API's free tier doesn't expose DRS/OAA (those are Statcast/Baseball Savant data,
    // a separate system); neutral fielding until/unless that's wired up separately.
    fieldingRunsAboveAvg: 0,
    // OPS+ isn't part of this endpoint's response either; Clutch falls back to NEUTRAL_PERCENTILE
    // when both avgWithRisp and opsPlus/wrcPlus are absent (src/lib/ratings/reference.ts).
  }
}

export function extractPitcherStatLine(stat: any): PitcherStatLine | null {
  if (!stat) return null
  const outsRecorded = inningsToOuts(stat.inningsPitched)
  const hits = num(stat.hits)
  const walks = num(stat.baseOnBalls ?? stat.walks)
  const homeRuns = num(stat.homeRuns)
  return {
    outsRecorded,
    appearances: num(stat.gamesPlayed ?? stat.gamesPitched),
    battersFaced: num(stat.battersFaced, outsRecorded + hits + walks),
    strikeouts: num(stat.strikeOuts ?? stat.strikeouts),
    walks,
    hits,
    homeRuns,
    // HR/9, derived from the raw homeRuns/outsRecorded this endpoint already has rather than left
    // undefined — groundBallRate/swingingStrikeRate (Statcast-only) never populate for a live
    // lookup, so without this, Movement fell back all the way to a flat neutral rating for every
    // live-searched pitcher, historical or modern, regardless of how good or bad their real HR
    // suppression was.
    hrPer9: outsRecorded > 0 ? (homeRuns * 27) / outsRecorded : undefined,
    // Average fastball velocity isn't in the basic stats endpoint (Statcast-only); left
    // undefined so Velocity falls back to a neutral rating instead of scoring as 0 mph.
    era: stat.era !== undefined ? num(stat.era) : undefined,
    saves: stat.saves !== undefined ? num(stat.saves) : undefined,
  }
}
