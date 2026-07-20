import { useCallback } from 'react'
import { createLocalStorageStore } from './createLocalStorageStore'
import type { PlayerWithRatings } from './players'

const store = createLocalStorageStore<PlayerWithRatings[]>('the-lineup:custom-players', [], 'diamond-dynasty:custom-players')

/**
 * Players added on this device beyond the built-in featured set — mainly those found through
 * live MLB search (store/players.ts's usePlayerPool merges these in) and players brought over
 * via a roster import (lib/rosterTransfer.ts) from someone else's device.
 */
export function useCustomPlayers() {
  const [customPlayers, setCustomPlayers] = store.useStore()

  const addCustomPlayer = useCallback(
    (entry: PlayerWithRatings) => setCustomPlayers((prev) => (prev.some((p) => p.player.id === entry.player.id) ? prev : [...prev, entry])),
    [setCustomPlayers],
  )

  const addCustomPlayers = useCallback(
    (entries: PlayerWithRatings[]) =>
      setCustomPlayers((prev) => {
        const existingIds = new Set(prev.map((p) => p.player.id))
        const additions = entries.filter((e) => !existingIds.has(e.player.id))
        return additions.length > 0 ? [...prev, ...additions] : prev
      }),
    [setCustomPlayers],
  )

  const removeCustomPlayer = useCallback((id: string) => setCustomPlayers((prev) => prev.filter((p) => p.player.id !== id)), [setCustomPlayers])

  return { customPlayers, addCustomPlayer, addCustomPlayers, removeCustomPlayer }
}
