import { useMemo } from 'react'
import { SEED_PLAYERS } from '../data/players.real'
import { deriveRatingsForPool } from '../lib/ratings'
import type { DerivedRatings, Player } from '../types/player'

export interface PlayerWithRatings {
  player: Player
  ratings: DerivedRatings
}

/** Player pool + derived ratings, from src/data/players.real.ts. */
export function usePlayerPool(): PlayerWithRatings[] {
  return useMemo(() => {
    const derived = deriveRatingsForPool(SEED_PLAYERS)
    return SEED_PLAYERS.map((player) => ({
      player,
      ratings: derived.get(player.id) ?? {},
    }))
  }, [])
}
