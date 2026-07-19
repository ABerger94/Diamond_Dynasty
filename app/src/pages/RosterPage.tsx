import { useMemo, useRef, useState } from 'react'
import { downloadRosterTransferFile, parseRosterTransferPayload } from '../lib/rosterTransfer'
import { useCustomPlayers } from '../store/customPlayers'
import { useGameState } from '../store/game'
import { usePlayerPool } from '../store/players'
import { useRosters } from '../store/rosters'
import type { Position } from '../types/player'
import { eligibleLineupSlots, HITTER_POSITIONS } from '../types/player'
import { ROSTER_SLOT_LIMITS } from '../types/roster'

export default function RosterPage() {
  const pool = usePlayerPool()
  const { rosters, createRoster, deleteRoster, importRoster, setLineupSlot, toggleListMember } = useRosters()
  const { addCustomPlayers } = useCustomPlayers()
  const { game, endGame } = useGameState()
  const [selectedId, setSelectedId] = useState<string | null>(rosters[0]?.id ?? null)
  const [newName, setNewName] = useState('')
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const roster = rosters.find((r) => r.id === selectedId) ?? null

  const playerById = useMemo(() => new Map(pool.map((p) => [p.player.id, p.player])), [pool])
  const hitters = pool.filter((p) => !!p.player.hitterStats)
  const startingPitchers = pool.filter((p) => !!p.player.pitcherStats && p.player.pitcherPosition === 'SP')
  const reliefPitchers = pool.filter((p) => !!p.player.pitcherStats && p.player.pitcherPosition === 'RP')

  // Separate hitter/pitcher "used" sets (rather than one combined set) so a two-way player's
  // card can occupy both a lineup slot and a pitcher slot at once — Rulebook Two-Way Phenom.
  const usedHitterIds = useMemo(() => {
    if (!roster) return new Set<string>()
    return new Set([...Object.values(roster.lineup), ...roster.bench])
  }, [roster])
  const usedPitcherIds = useMemo(() => {
    if (!roster) return new Set<string>()
    return new Set([...roster.startingPitchers, ...roster.reliefPitchers])
  }, [roster])

  const filledCount = roster
    ? Object.keys(roster.lineup).length + roster.bench.length + roster.startingPitchers.length + roster.reliefPitchers.length
    : 0

  function handleCreate() {
    if (!newName.trim()) return
    const created = createRoster(newName.trim())
    setSelectedId(created.id)
    setNewName('')
  }

  function handleExport() {
    if (!roster) return
    downloadRosterTransferFile(roster, pool)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImportError('')
    try {
      const text = await file.text()
      const payload = parseRosterTransferPayload(text)
      addCustomPlayers(payload.players)
      const imported = importRoster(payload.roster)
      setSelectedId(imported.id)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-100">Roster Builder</h1>
      <p className="mb-4 text-sm text-slate-400">
        Build a 25-card roster: 9 starters, 5 bench, 5 starting pitchers, 6 relievers. Saved locally in your
        browser. Export a finished roster to bring it to whichever device runs the Scorecard for game night —
        the Scorecard needs both teams' rosters loaded in that one browser.
      </p>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(e.target.value || null)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        >
          <option value="">Select a roster...</option>
          {rosters.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New roster name"
          className="w-48 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
        />
        <button
          onClick={handleCreate}
          className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
        >
          Create Roster
        </button>
        {roster && (
          <button onClick={handleExport} className="rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">
            Export "{roster.name}"
          </button>
        )}
        <button onClick={handleImportClick} className="rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">
          Import Roster
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
        {roster && (
          <button
            onClick={() => {
              const inActiveGame = game && (game.awayRosterId === roster.id || game.homeRosterId === roster.id)
              if (inActiveGame) {
                const ok = window.confirm(
                  `"${roster.name}" is being used by the game in progress on the Scorecard page. Deleting it will also discard that game. Continue?`,
                )
                if (!ok) return
                endGame()
              }
              deleteRoster(roster.id)
              setSelectedId(null)
            }}
            className="rounded-md border border-red-800 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950"
          >
            Delete "{roster.name}"
          </button>
        )}
        {roster && <span className="text-xs text-slate-500">{filledCount}/25 filled</span>}
      </div>

      {importError && <p className="mb-4 text-sm text-red-400">Import failed: {importError}</p>}

      {!roster && <p className="text-sm text-slate-500">Create or select a roster to start building.</p>}

      {roster && (
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Starting Lineup</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {HITTER_POSITIONS.map((pos) => (
                <LineupSlot
                  key={pos}
                  position={pos}
                  currentId={roster.lineup[pos] ?? null}
                  options={hitters.filter((h) => eligibleLineupSlots(h.player.primaryPosition).includes(pos))}
                  usedIds={usedHitterIds}
                  onChange={(playerId) => setLineupSlot(roster.id, pos, playerId)}
                />
              ))}
            </div>
          </section>

          <RosterList
            title={`Bench (${roster.bench.length}/${ROSTER_SLOT_LIMITS.bench})`}
            candidates={hitters}
            selected={roster.bench}
            usedIds={usedHitterIds}
            onToggle={(id) => toggleListMember(roster.id, 'bench', id, ROSTER_SLOT_LIMITS.bench)}
          />
          <RosterList
            title={`Starting Pitchers (${roster.startingPitchers.length}/${ROSTER_SLOT_LIMITS.startingPitchers})`}
            candidates={startingPitchers}
            selected={roster.startingPitchers}
            usedIds={usedPitcherIds}
            onToggle={(id) => toggleListMember(roster.id, 'startingPitchers', id, ROSTER_SLOT_LIMITS.startingPitchers)}
          />
          <RosterList
            title={`Relief Pitchers (${roster.reliefPitchers.length}/${ROSTER_SLOT_LIMITS.reliefPitchers})`}
            candidates={reliefPitchers}
            selected={roster.reliefPitchers}
            usedIds={usedPitcherIds}
            onToggle={(id) => toggleListMember(roster.id, 'reliefPitchers', id, ROSTER_SLOT_LIMITS.reliefPitchers)}
          />
        </div>
      )}

      {roster && playerById.size === 0 && null}
    </div>
  )
}

function LineupSlot({
  position,
  currentId,
  options,
  usedIds,
  onChange,
}: {
  position: Position
  currentId: string | null
  options: { player: { id: string; name: string } }[]
  usedIds: Set<string>
  onChange: (playerId: string | null) => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-2">
      <span className="w-8 shrink-0 text-xs font-bold text-sky-400">{position}</span>
      <select
        value={currentId ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full bg-transparent text-sm text-slate-100 focus:outline-none"
      >
        <option value="">— empty —</option>
        {options.map((o) => (
          <option key={o.player.id} value={o.player.id} disabled={usedIds.has(o.player.id) && o.player.id !== currentId}>
            {o.player.name}
          </option>
        ))}
      </select>
    </div>
  )
}

function RosterList({
  title,
  candidates,
  selected,
  usedIds,
  onToggle,
}: {
  title: string
  candidates: { player: { id: string; name: string; team: string; primaryPosition: string } }[]
  selected: string[]
  usedIds: Set<string>
  onToggle: (playerId: string) => void
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {candidates.map(({ player }) => {
          const isSelected = selected.includes(player.id)
          const disabled = !isSelected && usedIds.has(player.id)
          return (
            <button
              key={player.id}
              disabled={disabled}
              onClick={() => onToggle(player.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                isSelected
                  ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                  : disabled
                    ? 'cursor-not-allowed border-slate-800 text-slate-600'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {player.name} <span className="opacity-60">({player.team})</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
