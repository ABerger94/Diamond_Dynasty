import { deriveRatingsFromReference } from '../../app/src/lib/ratings/reference'
import type { Player } from '../../app/src/types/player'
import { extractHitterStatLine, extractPitcherStatLine, fetchPersonBio, fetchSeasonStats } from '../_lib/mlbStatsApi'

/**
 * GET /api/players/[id]?season=<year>
 *
 * UNVERIFIED against the live API (see _lib/mlbStatsApi.ts). Fetches bio + season hitting/
 * pitching stats for one MLB Stats API person ID, builds a Player, and scores it with the
 * reference-distribution engine (no pool needed for a single lookup — src/lib/ratings/reference.ts).
 */
export default async function handler(req: any, res: any) {
  const id = String(req.query?.id ?? '')
  const season = parseInt(String(req.query?.season ?? new Date().getFullYear()), 10)

  if (!id) {
    res.status(400).json({ error: 'player id is required' })
    return
  }

  try {
    const bio = await fetchPersonBio(id)
    if (!bio) {
      res.status(404).json({ error: `No MLB person found for id ${id}` })
      return
    }

    const [hittingStat, pitchingStat] = await Promise.all([
      fetchSeasonStats(id, season, 'hitting').catch(() => null),
      fetchSeasonStats(id, season, 'pitching').catch(() => null),
    ])

    const hitterStats = extractHitterStatLine(hittingStat) ?? undefined
    const pitcherStats = extractPitcherStatLine(pitchingStat) ?? undefined

    if (!hitterStats && !pitcherStats) {
      res.status(404).json({ error: `No ${season} hitting or pitching stats found for player ${id}` })
      return
    }

    const primaryPosition = bio.primaryPosition?.abbreviation ?? (pitcherStats ? 'SP' : 'DH')
    const player: Player = {
      id: String(bio.id ?? id),
      name: bio.fullName ?? bio.nameFirstLast ?? `Player ${id}`,
      primaryPosition,
      pitcherPosition: pitcherStats ? (primaryPosition === 'RP' || primaryPosition === 'CP' ? 'RP' : 'SP') : undefined,
      team: bio.currentTeam?.abbreviation ?? bio.currentTeam?.name ?? '',
      throwsBats: `${bio.batSide?.code ?? '?'}/${bio.pitchHand?.code ?? '?'}`,
      season,
      hitterStats,
      pitcherStats,
    }

    const ratings = deriveRatingsFromReference(player)
    res.status(200).json({ player, ratings })
  } catch (err) {
    res.status(502).json({ error: 'MLB Stats API request failed', detail: err instanceof Error ? err.message : String(err) })
  }
}
