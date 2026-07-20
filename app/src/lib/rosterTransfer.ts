import type { PlayerWithRatings } from '../store/players'
import type { Roster } from '../types/roster'

/** 'diamond-dynasty-roster' is the pre-rename value — still accepted on import (see
 * parseRosterTransferPayload) so roster files exported before the app was renamed to The LineUp
 * still work, but every new export uses 'the-lineup-roster'. */
export type RosterTransferKind = 'the-lineup-roster' | 'diamond-dynasty-roster'

export interface RosterTransferPayload {
  kind: RosterTransferKind
  version: 1
  roster: Roster
  /** Every player referenced by the roster, bundled so the importing device has them even if
   * they're not in its own featured pool (e.g. someone added via live search). */
  players: PlayerWithRatings[]
}

function rosterPlayerIds(roster: Roster): string[] {
  return [...Object.values(roster.lineup), ...roster.bench, ...roster.startingPitchers, ...roster.reliefPitchers].filter(
    (id): id is string => !!id,
  )
}

export function buildRosterTransferPayload(roster: Roster, pool: PlayerWithRatings[]): RosterTransferPayload {
  const ids = new Set(rosterPlayerIds(roster))
  const players = pool.filter((p) => ids.has(p.player.id))
  return { kind: 'the-lineup-roster', version: 1, roster, players }
}

export function downloadRosterTransferFile(roster: Roster, pool: PlayerWithRatings[]): void {
  const payload = buildRosterTransferPayload(roster, pool)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${roster.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'roster'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseRosterTransferPayload(text: string): RosterTransferPayload {
  const data = JSON.parse(text)
  const validKind = data?.kind === 'the-lineup-roster' || data?.kind === 'diamond-dynasty-roster'
  if (!validKind || !data.roster || !Array.isArray(data.players)) {
    throw new Error('Not a valid roster file')
  }
  return data as RosterTransferPayload
}
