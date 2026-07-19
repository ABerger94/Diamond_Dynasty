import { useCallback, useEffect, useState } from 'react'
import type { GameState } from '../types/game'

const STORAGE_KEY = 'diamond-dynasty:game'

function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as GameState) : null
  } catch {
    return null
  }
}

/** Persists a single in-progress game to localStorage (the app only supports one live game at a time). */
export function useGameState() {
  const [game, setGame] = useState<GameState | null>(() => loadGame())

  useEffect(() => {
    if (game) localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
    else localStorage.removeItem(STORAGE_KEY)
  }, [game])

  const endGame = useCallback(() => setGame(null), [])

  return { game, setGame, endGame }
}
