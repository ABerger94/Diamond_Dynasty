import { useMemo, useState } from 'react'
import PlayerCard from '../components/PlayerCard'
import { fetchLivePlayer, searchLivePlayers, type LiveSearchResult } from '../lib/liveSearch'
import { usePlayerPool, type PlayerWithRatings } from '../store/players'
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
      <LiveSearch />

      <h1 className="mb-1 mt-8 text-2xl font-bold text-slate-100">Featured Players</h1>
      <p className="mb-4 text-sm text-slate-400">
        A curated set of real 2025-season players with ratings pre-computed for demo/offline use. Card
        rarity/manufacturer never affects these numbers — only the player behind the card does.
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

function LiveSearch() {
  const [query, setQuery] = useState('')
  const [season, setSeason] = useState(new Date().getFullYear())
  const [results, setResults] = useState<LiveSearchResult[]>([])
  const [selected, setSelected] = useState<PlayerWithRatings | null>(null)
  const [status, setStatus] = useState<'idle' | 'searching' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault()
    if (!query.trim()) return
    setStatus('searching')
    setError('')
    setSelected(null)
    try {
      const found = await searchLivePlayers(query.trim(), season)
      setResults(found)
      setStatus('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatus('error')
    }
  }

  async function pickPlayer(id: string) {
    setStatus('loading')
    setError('')
    try {
      const player = await fetchLivePlayer(id, season)
      setSelected(player)
      setStatus('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatus('error')
    }
  }

  return (
    <section className="rounded-lg border border-sky-900 bg-sky-950/20 p-4">
      <h2 className="mb-1 text-lg font-bold text-slate-100">Search All MLB Players</h2>
      <p className="mb-3 text-xs text-slate-400">
        Live lookup against the public MLB Stats API — covers any season back into MLB history, not just the
        featured set below. Requires the app to be deployed (or run with <code>vercel dev</code>); this won't
        return results on a plain local dev server since it needs the serverless API route.
      </p>
      <form onSubmit={runSearch} className="mb-3 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Player name..."
          className="w-56 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
        />
        <input
          type="number"
          value={season}
          onChange={(e) => setSeason(Number(e.target.value))}
          className="w-24 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        />
        <button type="submit" className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500">
          Search
        </button>
      </form>

      {status === 'searching' && <p className="text-sm text-slate-400">Searching...</p>}
      {status === 'error' && <p className="text-sm text-red-400">{error}</p>}

      {results.length > 0 && !selected && (
        <div className="mb-3 flex flex-wrap gap-2">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => pickPlayer(r.id)}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              {r.fullName} <span className="opacity-60">({r.team || r.primaryPosition})</span>
            </button>
          ))}
        </div>
      )}

      {status === 'loading' && <p className="text-sm text-slate-400">Loading player...</p>}

      {selected && (
        <div className="max-w-sm">
          <PlayerCard {...selected} />
        </div>
      )}
    </section>
  )
}
