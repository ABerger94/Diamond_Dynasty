import type { PlayerWithRatings } from '../store/players'

export interface LiveSearchResult {
  id: string
  fullName: string
  primaryPosition: string
  team: string
  /** YYYY-MM-DD, if available — for telling same-name players apart in results. */
  birthDate?: string
}

/**
 * Calls the Vercel serverless proxy (/api/players/*) in front of the public MLB Stats API — see
 * api/_lib/mlbStatsApi.ts. Only works when deployed (or run with `vercel dev`); there's no MLB
 * data to fetch on a plain `vite dev` server since /api isn't part of the Vite build — a plain
 * `vite dev` server 200s every unmatched route with the SPA shell, so a fetch here gets HTML
 * back, not JSON, hence the friendlier parse-failure message below.
 */
async function parseJsonResponse<T>(res: Response, notOkMessage: string): Promise<T> {
  let body: any
  try {
    body = await res.json()
  } catch {
    throw new Error(res.ok ? 'Server returned a non-JSON response — is /api deployed?' : notOkMessage)
  }
  if (!res.ok) throw new Error(body?.error ?? notOkMessage)
  return body
}

export interface LiveSearchParams {
  /** Player name (substring match). Optional if `season` is given — leaving it blank browses
   * that season's full player pool (filtered by `position` if also given) instead of searching
   * by name. Searches across all of MLB history when `season` is omitted. */
  query?: string
  season?: string
  position?: string
}

/** Searches (or, with a blank query + a season, browses) MLB players via the serverless proxy. */
export async function searchLivePlayers({ query, season, position }: LiveSearchParams): Promise<LiveSearchResult[]> {
  const params = new URLSearchParams()
  if (query?.trim()) params.set('q', query.trim())
  if (season?.trim()) params.set('season', season.trim())
  if (position?.trim()) params.set('position', position.trim())
  const res = await fetch(`/api/players/search?${params}`)
  const data = await parseJsonResponse<{ results?: LiveSearchResult[] }>(res, `Search failed (${res.status})`)
  return data.results ?? []
}

/** Fetches one player. Omit `season` for career totals (works for any era); pass it for a
 * single-season line (also picks up Statcast enrichment where available). */
export async function fetchLivePlayer(id: string, season?: number): Promise<PlayerWithRatings> {
  const params = new URLSearchParams({ id })
  if (season !== undefined) params.set('season', String(season))
  const res = await fetch(`/api/players/lookup?${params}`)
  return parseJsonResponse<PlayerWithRatings>(res, `Lookup failed (${res.status})`)
}
