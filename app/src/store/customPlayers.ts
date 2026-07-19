import { useCallback, useEffect, useState } from 'react'
import type { PlayerWithRatings } from './players'

const STORAGE_KEY = 'diamond-dynasty:custom-players'

function loadCustomPlayers(): PlayerWithRatings[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PlayerWithRatings[]) : []
  } catch {
    return []
  }
}

function saveCustomPlayers(players: PlayerWithRatings[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
}

/**
 * Players added on this device beyond the built-in featured set — mainly those found through
 * live MLB search (store/players.ts's usePlayerPool merges these in) and players brought over
 * via a roster import (lib/rosterTransfer.ts) from someone else's device.
 */
export function useCustomPlayers() {
  const [customPlayers, setCustomPlayers] = useState<PlayerWithRatings[]>(() => loadCustomPlayers())

  useEffect(() => {
    saveCustomPlayers(customPlayers)
  }, [customPlayers])

  const addCustomPlayer = useCallback((entry: PlayerWithRatings) => {
    setCustomPlayers((prev) => (prev.some((p) => p.player.id === entry.player.id) ? prev : [...prev, entry]))
  }, [])

  const addCustomPlayers = useCallback((entries: PlayerWithRatings[]) => {
    setCustomPlayers((prev) => {
      const existingIds = new Set(prev.map((p) => p.player.id))
      const additions = entries.filter((e) => !existingIds.has(e.player.id))
      return additions.length > 0 ? [...prev, ...additions] : prev
    })
  }, [])

  const removeCustomPlayer = useCallback((id: string) => {
    setCustomPlayers((prev) => prev.filter((p) => p.player.id !== id))
  }, [])

  return { customPlayers, addCustomPlayer, addCustomPlayers, removeCustomPlayer }
}
