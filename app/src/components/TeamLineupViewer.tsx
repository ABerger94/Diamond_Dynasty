import { useMemo, useState } from 'react'
import { TEAM_ACCENT, type TeamSide } from '../lib/teamColors'
import type { PlayerWithRatings } from '../store/players'
import { HITTER_POSITIONS } from '../types/player'
import type { Roster } from '../types/roster'
import PlayerCard from './PlayerCard'

interface Slot {
  label: string
  playerId: string
}

function buildSlots(roster: Roster): Slot[] {
  const lineup: Slot[] = []
  for (const pos of HITTER_POSITIONS) {
    const playerId = roster.lineup[pos]
    if (playerId) lineup.push({ label: pos, playerId })
  }
  const bench: Slot[] = roster.bench.map((id) => ({ label: 'BN', playerId: id }))
  const sp: Slot[] = roster.startingPitchers.map((id) => ({ label: 'SP', playerId: id }))
  const rp: Slot[] = roster.reliefPitchers.map((id) => ({ label: 'RP', playerId: id }))
  return [...lineup, ...bench, ...sp, ...rp]
}

/** Full team roster with click-through to any player's full stat card — for checking a bench
 * player, pinch-hit option, or reliever mid-game without leaving the Scorecard. */
export default function TeamLineupViewer({
  teamName,
  roster,
  poolById,
  highlightId,
  accent,
}: {
  teamName: string
  roster: Roster
  poolById: Map<string, PlayerWithRatings>
  highlightId?: string | null
  accent: TeamSide
}) {
  const colors = TEAM_ACCENT[accent]
  const [expanded, setExpanded] = useState(false)
  const slots = useMemo(() => buildSlots(roster), [roster])
  const [selectedId, setSelectedId] = useState<string | null>(highlightId ?? slots[0]?.playerId ?? null)

  const selectedIndex = slots.findIndex((s) => s.playerId === selectedId)
  const selected = selectedId ? poolById.get(selectedId) : undefined

  function step(delta: number) {
    if (slots.length === 0) return
    const nextIndex = ((selectedIndex >= 0 ? selectedIndex : 0) + delta + slots.length) % slots.length
    setSelectedId(slots[nextIndex].playerId)
  }

  return (
    <div className="rounded-md border border-slate-800 bg-slate-900">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
      >
        <span className={colors.header}>{teamName} Lineup</span>
        <span className="text-slate-500">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="grid grid-cols-1 gap-4 border-t border-slate-800 p-4 md:grid-cols-2">
          <div className="space-y-1">
            {slots.map((slot) => {
              const p = poolById.get(slot.playerId)
              const isSelected = slot.playerId === selectedId
              const isHighlighted = slot.playerId === highlightId
              const overall = p?.ratings.hitter?.overall ?? p?.ratings.pitcher?.overall
              return (
                <button
                  key={`${slot.label}-${slot.playerId}`}
                  onClick={() => setSelectedId(slot.playerId)}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs ${
                    isSelected ? `${colors.selectedBg} ${colors.selectedText}` : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-7 shrink-0 font-bold ${colors.label}`}>{slot.label}</span>
                  <span className="flex-1 truncate">{p?.player.name ?? 'Unknown'}</span>
                  {isHighlighted && <span className="rounded bg-amber-500/20 px-1 text-[10px] font-semibold text-amber-400">NOW</span>}
                  <span className="shrink-0 text-slate-500">{overall ?? '-'}</span>
                </button>
              )
            })}
          </div>

          <div>
            {selected && (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <button onClick={() => step(-1)} className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800">
                    ← Prev
                  </button>
                  <button onClick={() => step(1)} className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800">
                    Next →
                  </button>
                </div>
                <PlayerCard {...selected} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
