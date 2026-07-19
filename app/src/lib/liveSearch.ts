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

/** Searches across all of MLB history (no season needed to find a player). */
export async function searchLivePlayers(q: string): Promise<LiveSearchResult[]> {
  const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`)
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
