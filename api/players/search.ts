import { fetchSeasonPlayers, searchPlayersByName } from '../_lib/mlbStatsApi'

/**
 * GET /api/players/search?q=<name>[&season=<year>]
 *
 * Searches across all of MLB history by default (searchPlayersByName) — not scoped to one
 * season, since a retired player like Babe Ruth won't be on any current-season roster. Pass
 * `season` to instead search just that season's player pool (fetchSeasonPlayers), e.g. if you
 * already know when someone played and want a tighter result set.
 *
 * UNVERIFIED against the live API — see _lib/mlbStatsApi.ts's file header.
 */
export default async function handler(req: any, res: any) {
  const q = String(req.query?.q ?? '').trim()
  const seasonParam = req.query?.season

  if (!q) {
    res.status(400).json({ error: 'q query param is required' })
    return
  }

  try {
    if (seasonParam !== undefined) {
      const season = parseInt(String(seasonParam), 10)
      if (!Number.isFinite(season)) {
        res.status(400).json({ error: 'season must be a number' })
        return
      }
      const players = await fetchSeasonPlayers(season)
      const matches = players.filter((p) => p.fullName.toLowerCase().includes(q.toLowerCase())).slice(0, 25)
      res.status(200).json({ season, results: matches })
      return
    }

    const results = await searchPlayersByName(q)
    res.status(200).json({ results: results.slice(0, 25) })
  } catch (err) {
    res.status(502).json({ error: 'MLB Stats API request failed', detail: err instanceof Error ? err.message : String(err) })
  }
}
