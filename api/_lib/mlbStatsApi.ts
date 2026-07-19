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
}

/** All players for a given season (MLB = sportId 1). Season can be any year the sport played,
 * including well into the 1800s. Used both directly and as the basis for name search. */
export async function fetchSeasonPlayers(season: number): Promise<MlbPersonSummary[]> {
  const data = await mlbFetch(`/sports/1/players?season=${season}`)
  const people = data?.people ?? []
  return people.map((p: any): MlbPersonSummary => ({
    id: String(p.id),
    fullName: p.fullName ?? p.nameFirstLast ?? 'Unknown',
    primaryPosition: p.primaryPosition?.abbreviation ?? p.primaryPosition?.code ?? '',
    team: p.currentTeam?.abbreviation ?? p.currentTeam?.name ?? '',
    bats: p.batSide?.code ?? '',
    throws: p.pitchHand?.code ?? '',
  }))
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

export function extractHitterStatLine(stat: any): {
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
  fieldingRunsAboveAvg: number
} | null {
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

export function extractPitcherStatLine(stat: any): {
  outsRecorded: number
  appearances: number
  battersFaced: number
  strikeouts: number
  walks: number
  hits: number
  homeRuns: number
  avgFastballVeloMph?: number
  era?: number
  saves?: number
} | null {
  if (!stat) return null
  const outsRecorded = inningsToOuts(stat.inningsPitched)
  const hits = num(stat.hits)
  const walks = num(stat.baseOnBalls ?? stat.walks)
  return {
    outsRecorded,
    appearances: num(stat.gamesPlayed ?? stat.gamesPitched),
    battersFaced: num(stat.battersFaced, outsRecorded + hits + walks),
    strikeouts: num(stat.strikeOuts ?? stat.strikeouts),
    walks,
    hits,
    homeRuns: num(stat.homeRuns),
    // Average fastball velocity isn't in the basic stats endpoint (Statcast-only); left
    // undefined so Velocity falls back to a neutral rating instead of scoring as 0 mph.
    era: stat.era !== undefined ? num(stat.era) : undefined,
    saves: stat.saves !== undefined ? num(stat.saves) : undefined,
  }
}
