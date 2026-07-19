import { fetchAvgFastballVelocity, fetchOutsAboveAverage, fetchSprintSpeed } from '../_lib/baseballSavant'
import { deriveRatingsFromReference } from '../_lib/ratingsReference'
import type { Player } from '../_lib/types'
import { extractHitterStatLine, extractPitcherStatLine, fetchCareerStats, fetchPersonBio, fetchSeasonStats } from '../_lib/mlbStatsApi'

/**
 * GET /api/players/lookup?id=<mlbamId>[&season=<year>]
 *
 * This used to be the dynamic route /api/players/[id].ts, but that fell through to the SPA's
 * catch-all rewrite in production instead of reaching the function (confirmed: search.ts, a
 * plain filename, deployed and worked; [id].ts did not — requests to it came back as HTML, not
 * JSON). Rather than chase why Vercel's bracket-route convention didn't take here, this uses the
 * same plain-filename-plus-query-param shape that's already proven to work.
 *
 * Without `season`, returns career totals — the point being that a search result for a
 * historical player doesn't come with "which season did they play" attached, and career stats
 * work for anyone regardless of era without having to guess. Pass `season` for a single-season
 * line instead (also enables Statcast enrichment, which is inherently season-specific and skipped
 * in career mode).
 *
 * UNVERIFIED against the live API (see _lib/mlbStatsApi.ts, _lib/baseballSavant.ts). Fetches bio
 * + stats for one MLB Stats API person ID, builds a Player, and scores it with the
 * reference-distribution engine (no pool needed for a single lookup — src/lib/ratings/reference.ts).
 */
export default async function handler(req: any, res: any) {
  const id = String(req.query?.id ?? '')
  const seasonParam = req.query?.season
  const season = seasonParam !== undefined ? parseInt(String(seasonParam), 10) : undefined

  if (!id) {
    res.status(400).json({ error: 'id query param is required' })
    return
  }
  if (seasonParam !== undefined && !Number.isFinite(season)) {
    res.status(400).json({ error: 'season must be a number' })
    return
  }

  try {
    const bio = await fetchPersonBio(id)
    if (!bio) {
      res.status(404).json({ error: `No MLB person found for id ${id}` })
      return
    }

    const [hittingStat, pitchingStat] = await Promise.all([
      (season !== undefined ? fetchSeasonStats(id, season, 'hitting') : fetchCareerStats(id, 'hitting')).catch(() => null),
      (season !== undefined ? fetchSeasonStats(id, season, 'pitching') : fetchCareerStats(id, 'pitching')).catch(() => null),
    ])

    const hitterStats = extractHitterStatLine(hittingStat) ?? undefined
    const pitcherStats = extractPitcherStatLine(pitchingStat) ?? undefined

    if (!hitterStats && !pitcherStats) {
      res.status(404).json({ error: `No ${season !== undefined ? `${season} ` : 'career '}hitting or pitching stats found for player ${id}` })
      return
    }

    // Statcast enrichment (Baseball Savant) — season-specific leaderboards, so only attempted
    // when a season was actually requested. Best-effort, never fails the request.
    if (season !== undefined) {
      if (hitterStats) {
        const [sprintSpeeds, oaa] = await Promise.all([
          fetchSprintSpeed(season).catch(() => new Map<string, number>()),
          fetchOutsAboveAverage(season).catch(() => new Map<string, number>()),
        ])
        if (sprintSpeeds.has(id)) hitterStats.sprintSpeedFtPerSec = sprintSpeeds.get(id)
        if (oaa.has(id)) hitterStats.fieldingRunsAboveAvg = oaa.get(id)!
      }
      if (pitcherStats) {
        const velocities = await fetchAvgFastballVelocity(season).catch(() => new Map<string, number>())
        if (velocities.has(id)) pitcherStats.avgFastballVeloMph = velocities.get(id)
      }
    }

    const primaryPosition = bio.primaryPosition?.abbreviation ?? (pitcherStats ? 'SP' : 'DH')
    const debutYear = parseInt(String(bio.mlbDebutDate ?? '').slice(0, 4), 10)
    const birthYear = parseInt(String(bio.birthDate ?? '').slice(0, 4), 10)
    const player: Player = {
      id: String(bio.id ?? id),
      name: bio.fullName ?? bio.nameFirstLast ?? `Player ${id}`,
      primaryPosition,
      pitcherPosition: pitcherStats ? (primaryPosition === 'RP' || primaryPosition === 'CP' ? 'RP' : 'SP') : undefined,
      team: bio.currentTeam?.abbreviation ?? bio.currentTeam?.name ?? '',
      throwsBats: `${bio.batSide?.code ?? '?'}/${bio.pitchHand?.code ?? '?'}`,
      birthYear: Number.isFinite(birthYear) ? birthYear : undefined,
      season: season ?? (Number.isFinite(debutYear) ? debutYear : new Date().getFullYear()),
      statSource: season !== undefined ? 'season' : 'career',
      hitterStats,
      pitcherStats,
    }

    const ratings = deriveRatingsFromReference(player)
    res.status(200).json({ player, ratings })
  } catch (err) {
    res.status(502).json({ error: 'MLB Stats API request failed', detail: err instanceof Error ? err.message : String(err) })
  }
}
