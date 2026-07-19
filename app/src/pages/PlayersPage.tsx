import { useMemo, useState } from 'react'
import PlayerCard from '../components/PlayerCard'
import { usePlayerPool } from '../store/players'
import type { Position } from '../types/player'
import { HITTER_POSITIONS, PITCHER_POSITIONS } from '../types/player'

type RoleFilter = 'all' | 'hitters' | 'pitchers'

export default function PlayersPage() {
  const pool = usePlayerPool()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<RoleFilter>('all')
  const [position, setPosition] = useState<Position | 'all'>('all')

  const filtered = useMemo(() => {
    return pool.filter(({ player }) => {
      if (role === 'hitters' && !player.hitterStats) return false
      if (role === 'pitchers' && !player.pitcherStats) return false
      if (position !== 'all' && player.primaryPosition !== position) return false
      if (query && !player.name.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [pool, query, role, position])

  const positionOptions = role === 'pitchers' ? PITCHER_POSITIONS : role === 'hitters' ? HITTER_POSITIONS : [...HITTER_POSITIONS, ...PITCHER_POSITIONS]

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-100">Card Lookup</h1>
      <p className="mb-4 text-sm text-slate-400">
        Search the seeded player pool to find a card's Diamond Dynasty ratings. Card rarity/manufacturer never
        affects these numbers — only the player behind the card does.
      </p>

      <div className="mb-5 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search player name..."
          className="w-64 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
        />
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value as RoleFilter)
            setPosition('all')
          }}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        >
          <option value="all">All players</option>
          <option value="hitters">Hitters</option>
          <option value="pitchers">Pitchers</option>
        </select>
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value as Position | 'all')}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        >
          <option value="all">All positions</option>
          {positionOptions.map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
        <span className="self-center text-xs text-slate-500">{filtered.length} players</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((entry) => (
          <PlayerCard key={entry.player.id} {...entry} />
        ))}
      </div>
    </div>
  )
}
