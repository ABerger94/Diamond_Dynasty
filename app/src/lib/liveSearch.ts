import type { PlayerWithRatings } from '../store/players'

export interface LiveSearchResult {
  id: string
  fullName: string
  primaryPosition: string
  team: string
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

export async function searchLivePlayers(q: string, season: number): Promise<LiveSearchResult[]> {
  const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}&season=${season}`)
  const data = await parseJsonResponse<{ results?: LiveSearchResult[] }>(res, `Search failed (${res.status})`)
  return data.results ?? []
}

export async function fetchLivePlayer(id: string, season: number): Promise<PlayerWithRatings> {
  const res = await fetch(`/api/players/${id}?season=${season}`)
  return parseJsonResponse<PlayerWithRatings>(res, `Lookup failed (${res.status})`)
}
