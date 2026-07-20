import { fetchSeasonPlayers, HISTORY_SAMPLE_SEASONS, scanSeasonsForPlayers, searchPlayersByName } from '../_lib/mlbStatsApi'

/**
 * GET /api/players/search?q=<name>[&season=<year>][&position=<pos>]
 *
 * With `q`: searches across all of MLB history by default (searchPlayersByName) — not scoped to
 * one season, since a retired player like Babe Ruth won't be on any current-season roster. Pass
 * `season` alongside it to instead search just that season's player pool (fetchSeasonPlayers),
 * e.g. if you already know when someone played and want a tighter result set.
 *
 * Without `q` or `season`, but with `position`: browses across a representative sample of seasons
 * (scanSeasonsForPlayers/HISTORY_SAMPLE_SEASONS) for anyone at that position — no name or season
 * required, since a position alone is a perfectly good way to browse. Without `q` and without
 * `position` either, `season` is required (there's no bounded way to list "everyone in MLB
 * history" with no filter at all).
 *
 * `position` filters every mode via plain equality — the app only ever sends real MLB position
 * codes now (including plain "P" for any pitcher; MLB's own data never distinguishes
 * starter/reliever, so the app doesn't ask for that split here — see types/player.ts).
 *
 * Results aren't truncated to some small fixed page size — `RESPONSE_CEILING` below is a sanity
 * limit on response payload size (a full season roster runs several hundred players), not a
 * meaningful cap on real results; the client paginates ("Show more") over however many come back.
 *
 * UNVERIFIED against the live API — see _lib/mlbStatsApi.ts's file header.
 */
const RESPONSE_CEILING = 500

function matchesPosition(candidatePosition: string, filter: string): boolean {
  return !filter || candidatePosition === filter
}

export default async function handler(req: any, res: any) {
  const q = String(req.query?.q ?? '').trim()
  const seasonParam = req.query?.season
  const position = String(req.query?.position ?? '').trim()

  if (!q && seasonParam === undefined && !position) {
    res.status(400).json({ error: 'q, season, or position query param is required' })
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
        .filter((p) => matchesPosition(p.primaryPosition, position))
        .slice(0, RESPONSE_CEILING)
      res.status(200).json({ season, results: matches })
      return
    }

    if (q) {
      const results = await searchPlayersByName(q)
      const filtered = results.filter((p) => matchesPosition(p.primaryPosition, position)).slice(0, RESPONSE_CEILING)
      res.status(200).json({ results: filtered })
      return
    }

    const matches = await scanSeasonsForPlayers(HISTORY_SAMPLE_SEASONS, RESPONSE_CEILING, (p) => matchesPosition(p.primaryPosition, position))
    res.status(200).json({ results: matches.slice(0, RESPONSE_CEILING) })
  } catch (err) {
    res.status(502).json({ error: 'MLB Stats API request failed', detail: err instanceof Error ? err.message : String(err) })
  }
}
