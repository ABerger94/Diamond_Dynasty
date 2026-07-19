import { useCallback } from 'react'
import type { GameState } from '../types/game'
import { createLocalStorageStore } from './createLocalStorageStore'

const store = createLocalStorageStore<GameState | null>('diamond-dynasty:game', null)

/** Persists a single in-progress game to localStorage (the app only supports one live game at a time). */
export function useGameState() {
  const [game, setGame] = store.useStore()

  const endGame = useCallback(() => setGame(null), [setGame])

  return { game, setGame, endGame }
}
