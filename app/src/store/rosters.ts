import { useCallback, useEffect, useState } from 'react'
import type { Position } from '../types/player'
import type { Roster } from '../types/roster'

const STORAGE_KEY = 'diamond-dynasty:rosters'

function loadRosters(): Roster[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Roster[]) : []
  } catch {
    return []
  }
}

function saveRosters(rosters: Roster[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rosters))
}

export function emptyRoster(name: string): Roster {
  const now = new Date().toISOString()
  return {
    id: `roster_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
    name,
    lineup: {},
    bench: [],
    startingPitchers: [],
    reliefPitchers: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function useRosters() {
  const [rosters, setRosters] = useState<Roster[]>(() => loadRosters())

  useEffect(() => {
    saveRosters(rosters)
  }, [rosters])

  const createRoster = useCallback((name: string) => {
    const roster = emptyRoster(name)
    setRosters((prev) => [...prev, roster])
    return roster
  }, [])

  const deleteRoster = useCallback((rosterId: string) => {
    setRosters((prev) => prev.filter((r) => r.id !== rosterId))
  }, [])

  /** Adds an imported roster under a fresh id, so it can never collide with (or overwrite) one
   * already on this device — see lib/rosterTransfer.ts. */
  const importRoster = useCallback((roster: Roster) => {
    const now = new Date().toISOString()
    const imported: Roster = { ...roster, id: `roster_${Date.now()}_${Math.round(Math.random() * 1e6)}`, createdAt: now, updatedAt: now }
    setRosters((prev) => [...prev, imported])
    return imported
  }, [])

  const updateRoster = useCallback((rosterId: string, updater: (roster: Roster) => Roster) => {
    setRosters((prev) =>
      prev.map((r) => (r.id === rosterId ? { ...updater(r), updatedAt: new Date().toISOString() } : r)),
    )
  }, [])

  const setLineupSlot = useCallback(
    (rosterId: string, position: Position, playerId: string | null) => {
      updateRoster(rosterId, (roster) => {
        const lineup = { ...roster.lineup }
        if (playerId === null) delete lineup[position]
        else lineup[position] = playerId
        return { ...roster, lineup }
      })
    },
    [updateRoster],
  )

  const toggleListMember = useCallback(
    (rosterId: string, list: 'bench' | 'startingPitchers' | 'reliefPitchers', playerId: string, limit: number) => {
      updateRoster(rosterId, (roster) => {
        const current = roster[list]
        if (current.includes(playerId)) {
          return { ...roster, [list]: current.filter((id) => id !== playerId) }
        }
        if (current.length >= limit) return roster
        return { ...roster, [list]: [...current, playerId] }
      })
    },
    [updateRoster],
  )

  return { rosters, createRoster, deleteRoster, importRoster, updateRoster, setLineupSlot, toggleListMember }
}
