import type { PlayerWithRatings } from '../store/players'
import type { Roster } from '../types/roster'

export interface RosterTransferPayload {
  kind: 'diamond-dynasty-roster'
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
  return { kind: 'diamond-dynasty-roster', version: 1, roster, players }
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
  if (data?.kind !== 'diamond-dynasty-roster' || !data.roster || !Array.isArray(data.players)) {
    throw new Error('Not a Diamond Dynasty roster file')
  }
  return data as RosterTransferPayload
}
