import { fetchSeasonPlayers } from '../_lib/mlbStatsApi'

/**
 * GET /api/players/search?q=<name>&season=<year>
 *
 * UNVERIFIED against the live API (see _lib/mlbStatsApi.ts) — this fetches the full season
 * roster (MLB = sportId 1) and filters by name server-side, rather than relying on an uncertain
 * dedicated search endpoint. `season` defaults to the current year; pass an older year (MLB
 * Stats API covers back into the 1800s) to search that season's players instead.
 */
export default async function handler(req: any, res: any) {
  const q = String(req.query?.q ?? '').trim().toLowerCase()
  const season = parseInt(String(req.query?.season ?? new Date().getFullYear()), 10)

  if (!q) {
    res.status(400).json({ error: 'q query param is required' })
    return
  }
  if (!Number.isFinite(season)) {
    res.status(400).json({ error: 'season must be a number' })
    return
  }

  try {
    const players = await fetchSeasonPlayers(season)
    const matches = players.filter((p) => p.fullName.toLowerCase().includes(q)).slice(0, 25)
    res.status(200).json({ season, results: matches })
  } catch (err) {
    res.status(502).json({ error: 'MLB Stats API request failed', detail: err instanceof Error ? err.message : String(err) })
  }
}
