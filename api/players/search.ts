import { fetchSeasonPlayers, searchPlayersByName } from '../_lib/mlbStatsApi'

/**
 * GET /api/players/search?q=<name>[&season=<year>][&position=<pos>]
 *
 * With `q`: searches across all of MLB history by default (searchPlayersByName) — not scoped to
 * one season, since a retired player like Babe Ruth won't be on any current-season roster. Pass
 * `season` alongside it to instead search just that season's player pool (fetchSeasonPlayers),
 * e.g. if you already know when someone played and want a tighter result set.
 *
 * Without `q`: browses instead of searching by name — requires `season` (there's no bounded way
 * to list "everyone in MLB history" without a name to filter by), returning that season's full
 * roster. `position` filters either mode by exact primaryPosition match (e.g. "SS", "SP") and is
 * applied before the result cap so a narrow position filter isn't starved by broader matches.
 *
 * UNVERIFIED against the live API — see _lib/mlbStatsApi.ts's file header.
 */
export default async function handler(req: any, res: any) {
  const q = String(req.query?.q ?? '').trim()
  const seasonParam = req.query?.season
  const position = String(req.query?.position ?? '').trim()

  if (!q && seasonParam === undefined) {
    res.status(400).json({ error: 'q or season query param is required (season is required to browse without a name)' })
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
      const matches = players
        .filter((p) => !q || p.fullName.toLowerCase().includes(q.toLowerCase()))
        .filter((p) => !position || p.primaryPosition === position)
        .slice(0, 50)
      res.status(200).json({ season, results: matches })
      return
    }

    const results = await searchPlayersByName(q)
    const filtered = results.filter((p) => !position || p.primaryPosition === position).slice(0, 25)
    res.status(200).json({ results: filtered })
  } catch (err) {
    res.status(502).json({ error: 'MLB Stats API request failed', detail: err instanceof Error ? err.message : String(err) })
  }
}
