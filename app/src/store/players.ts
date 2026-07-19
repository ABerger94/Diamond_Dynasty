import { useMemo } from 'react'
import { SEED_PLAYERS } from '../data/players.seed'
import { deriveRatingsForPool } from '../lib/ratings'
import type { DerivedRatings, Player } from '../types/player'

export interface PlayerWithRatings {
  player: Player
  ratings: DerivedRatings
}

/** Player pool + derived ratings. Seed data only for v1 — see docs/RULEBOOK.md §10. */
export function usePlayerPool(): PlayerWithRatings[] {
  return useMemo(() => {
    const derived = deriveRatingsForPool(SEED_PLAYERS)
    return SEED_PLAYERS.map((player) => ({
      player,
      ratings: derived.get(player.id) ?? {},
    }))
  }, [])
}
