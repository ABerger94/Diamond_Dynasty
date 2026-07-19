import { useMemo } from 'react'
import { SEED_PLAYERS } from '../data/players.real'
import { deriveRatingsForPool } from '../lib/ratings'
import type { DerivedRatings, Player } from '../types/player'
import { useCustomPlayers } from './customPlayers'

export interface PlayerWithRatings {
  player: Player
  ratings: DerivedRatings
}

/** The built-in featured pool, ratings derived pool-relative among just those players. */
function useFeaturedPool(): PlayerWithRatings[] {
  return useMemo(() => {
    const derived = deriveRatingsForPool(SEED_PLAYERS)
    return SEED_PLAYERS.map((player) => ({
      player,
      ratings: derived.get(player.id) ?? {},
    }))
  }, [])
}

/** Featured pool + this device's custom players (added from live search or a roster import —
 * store/customPlayers.ts), deduped by id with the featured pool taking priority. Custom players
 * already carry ratings computed at fetch/import time (reference-distribution scored, not
 * pool-relative — see lib/ratings/reference.ts) rather than being re-derived here. */
export function usePlayerPool(): PlayerWithRatings[] {
  const featured = useFeaturedPool()
  const { customPlayers } = useCustomPlayers()

  return useMemo(() => {
    const featuredIds = new Set(featured.map((p) => p.player.id))
    const additions = customPlayers.filter((p) => !featuredIds.has(p.player.id))
    return [...featured, ...additions]
  }, [featured, customPlayers])
}
