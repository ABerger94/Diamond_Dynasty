import { useMemo, useState } from 'react'
import PlayerCard from '../components/PlayerCard'
import { fetchLivePlayer, searchLivePlayers, type LiveSearchResult } from '../lib/liveSearch'
import { useCustomPlayers } from '../store/customPlayers'
import { useHiddenPlayers } from '../store/hiddenPlayers'
import { usePlayerPool, type PlayerWithRatings } from '../store/players'
import type { HitterRatings, PitcherRatings, Position } from '../types/player'
import { HITTER_POSITIONS, PITCHER_POSITIONS } from '../types/player'

type RoleFilter = 'all' | 'hitters' | 'pitchers'
type SortKey = 'name' | 'overall' | keyof HitterRatings | keyof PitcherRatings

const HITTER_SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'overall', label: 'Overall' },
  { value: 'contact', label: 'Contact' },
  { value: 'power', label: 'Power' },
  { value: 'discipline', label: 'Discipline' },
  { value: 'speed', label: 'Speed' },
  { value: 'fielding', label: 'Fielding' },
  { value: 'clutch', label: 'Clutch' },
]
const PITCHER_SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'overall', label: 'Overall' },
  { value: 'velocity', label: 'Velocity' },
  { value: 'stuff', label: 'Stuff' },
  { value: 'control', label: 'Control' },
  { value: 'movement', label: 'Movement' },
  { value: 'stamina', label: 'Stamina' },
  { value: 'clutch', label: 'Clutch' },
]

/** Reads a sort/filter value off whichever side (hitter/pitcher) of a card actually has it —
 * 'clutch' exists on both, most others exist on only one. */
function statValue(entry: PlayerWithRatings, key: SortKey): number {
  if (key === 'overall') return entry.ratings.hitter?.overall ?? entry.ratings.pitcher?.overall ?? 0
  if (entry.ratings.hitter && key in entry.ratings.hitter.display) return entry.ratings.hitter.display[key as keyof HitterRatings]
  if (entry.ratings.pitcher && key in entry.ratings.pitcher.display) return entry.ratings.pitcher.display[key as keyof PitcherRatings]
  return 0
}

export default function PlayersPage() {
  const pool = usePlayerPool()
  const { customPlayers, removeCustomPlayer } = useCustomPlayers()
  const { hiddenIds, hidePlayer, unhideAll } = useHiddenPlayers()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<RoleFilter>('all')
  const [position, setPosition] = useState<Position | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortKey>('overall')
  const [minOverall, setMinOverall] = useState('')

  const customIds = useMemo(() => new Set(customPlayers.map((p) => p.player.id)), [customPlayers])
  function removeFromPool(playerId: string) {
    if (customIds.has(playerId)) removeCustomPlayer(playerId)
    else hidePlayer(playerId)
  }

  function changeRole(next: RoleFilter) {
    setRole(next)
    setPosition('all')
    setSortBy('overall')
  }

  const sortOptions = role === 'pitchers' ? PITCHER_SORT_OPTIONS : role === 'hitters' ? HITTER_SORT_OPTIONS : [{ value: 'overall' as const, label: 'Overall' }]
  const minOverallNum = minOverall.trim() ? Number(minOverall) : null

  const filtered = useMemo(() => {
    const matches = pool.filter((entry) => {
      const { player } = entry
      if (role === 'hitters' && !player.hitterStats) return false
      if (role === 'pitchers' && !player.pitcherStats) return false
      if (position !== 'all' && player.primaryPosition !== position) return false
      if (query && !player.name.toLowerCase().includes(query.toLowerCase())) return false
      if (minOverallNum !== null && statValue(entry, 'overall') < minOverallNum) return false
      return true
    })
    if (sortBy === 'name') return [...matches].sort((a, b) => a.player.name.localeCompare(b.player.name))
    return [...matches].sort((a, b) => statValue(b, sortBy) - statValue(a, sortBy) || a.player.name.localeCompare(b.player.name))
  }, [pool, query, role, position, sortBy, minOverallNum])

  const positionOptions = role === 'pitchers' ? PITCHER_POSITIONS : role === 'hitters' ? HITTER_POSITIONS : [...HITTER_POSITIONS, ...PITCHER_POSITIONS]

  return (
    <div>
      <LiveSearch />

      <h1 className="mb-1 mt-8 text-2xl font-bold text-slate-100">Your Player Pool</h1>
      <p className="mb-4 text-sm text-slate-400">
        The 35 built-in featured players (real 2025 stats), plus anyone you've added from the live search above.
        Only players in this pool can go on a roster. Card rarity/manufacturer never affects these ratings — only
        the player behind the card does.
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
          onChange={(e) => changeRole(e.target.value as RoleFilter)}
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
        <label className="flex items-center gap-1.5 text-sm text-slate-400">
          Sort by
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            <option value="name">Name (A-Z)</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm text-slate-400">
          Min Overall
          <input
            type="number"
            min={1}
            max={20}
            value={minOverall}
            onChange={(e) => setMinOverall(e.target.value)}
            placeholder="Any"
            className="w-16 rounded-md border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </label>
        <span className="self-center text-xs text-slate-500">{filtered.length} players</span>
        {hiddenIds.length > 0 && (
          <button onClick={unhideAll} className="self-center text-xs text-sky-400 hover:text-sky-300">
            {hiddenIds.length} hidden — restore all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((entry) => (
          <PlayerCard key={entry.player.id} {...entry} onRemove={() => removeFromPool(entry.player.id)} />
        ))}
      </div>
    </div>
  )
}

const RESULTS_PAGE_SIZE = 30

function LiveSearch() {
  const { customPlayers, addCustomPlayer } = useCustomPlayers()
  const [query, setQuery] = useState('')
  const [searchSeason, setSearchSeason] = useState('')
  const [searchPosition, setSearchPosition] = useState<Position | 'all'>('all')
  const [results, setResults] = useState<LiveSearchResult[]>([])
  const [visibleCount, setVisibleCount] = useState(RESULTS_PAGE_SIZE)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [season, setSeason] = useState('')
  const [selected, setSelected] = useState<PlayerWithRatings | null>(null)
  const [status, setStatus] = useState<'idle' | 'searching' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault()
    if (!query.trim() && !searchSeason.trim()) {
      setError('Enter a name, or a season to browse without one.')
      setStatus('error')
      return
    }
    setStatus('searching')
    setError('')
    setSelected(null)
    setSelectedId(null)
    try {
      const found = await searchLivePlayers({
        query,
        season: searchSeason,
        position: searchPosition === 'all' ? undefined : searchPosition,
      })
      setResults(found)
      setVisibleCount(RESULTS_PAGE_SIZE)
      // Defaults a picked result's stat lookup to the season just browsed/searched, rather than
      // always falling back to career totals — still editable via the per-player Season field below.
      setSeason(searchSeason)
      setStatus('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatus('error')
    }
  }

  async function pickPlayer(id: string, seasonOverride?: string) {
    setSelectedId(id)
    setStatus('loading')
    setError('')
    try {
      const s = seasonOverride ?? season
      const player = await fetchLivePlayer(id, s.trim() ? Number(s) : undefined)
      setSelected(player)
      setStatus('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatus('error')
    }
  }

  const alreadyAdded = selected ? customPlayers.some((p) => p.player.id === selected.player.id) : false

  return (
    <section className="rounded-lg border border-sky-900 bg-sky-950/20 p-4">
      <h2 className="mb-1 text-lg font-bold text-slate-100">Search All MLB Players</h2>
      <p className="mb-3 text-xs text-slate-400">
        Live lookup against the public MLB Stats API — searches every season of MLB history, not just your
        player pool below, and shows career totals by default. Leave the name blank and pick a season to
        browse that season's whole player pool instead (position filter applies either way). Find someone
        and add them to your pool to put them on a roster. Requires the app to be deployed (or run with{' '}
        <code>vercel dev</code>); this won't return results on a plain local dev server since it needs the
        serverless API route.
      </p>
      <form onSubmit={runSearch} className="mb-3 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Player name (optional if season is set)..."
          className="w-64 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
        />
        <input
          value={searchSeason}
          onChange={(e) => setSearchSeason(e.target.value)}
          placeholder="Season..."
          className="w-24 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
        />
        <select
          value={searchPosition}
          onChange={(e) => setSearchPosition(e.target.value as Position | 'all')}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        >
          <option value="all">All positions</option>
          {[...HITTER_POSITIONS, ...PITCHER_POSITIONS].map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500">
          Search
        </button>
      </form>

      {status === 'searching' && <p className="text-sm text-slate-400">Searching...</p>}
      {status === 'error' && <p className="text-sm text-red-400">{error}</p>}

      {results.length > 0 && (
        <div className="mb-3">
          <div className="mb-2 flex flex-wrap gap-2">
            {results.slice(0, visibleCount).map((r) => {
              const birthYear = r.birthDate?.slice(0, 4)
              return (
                <button
                  key={r.id}
                  onClick={() => pickPlayer(r.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                    selectedId === r.id ? 'border-sky-500 bg-sky-500/20 text-sky-300' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {r.fullName} {birthYear && <span className="opacity-60">(b. {birthYear})</span>}{' '}
                  <span className="opacity-60">{r.team || r.primaryPosition}</span>
                </button>
              )
            })}
          </div>
          <p className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Showing {Math.min(visibleCount, results.length)} of {results.length}
            </span>
            {visibleCount < results.length && (
              <button onClick={() => setVisibleCount((n) => n + RESULTS_PAGE_SIZE)} className="text-sky-400 hover:text-sky-300">
                Show more
              </button>
            )}
          </p>
        </div>
      )}

      {status === 'loading' && <p className="text-sm text-slate-400">Loading player...</p>}

      {selected && (
        <div className="max-w-sm">
          <div className="mb-2 flex items-center gap-2">
            <input
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="Season (blank = career)"
              className="w-40 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 placeholder-slate-500"
            />
            <button
              onClick={() => selectedId && pickPlayer(selectedId, season)}
              className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
            >
              Reload
            </button>
            <button
              onClick={() => addCustomPlayer(selected)}
              disabled={alreadyAdded}
              className="rounded-md bg-emerald-700 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {alreadyAdded ? 'In your pool' : 'Add to My Players'}
            </button>
          </div>
          <PlayerCard {...selected} />
        </div>
      )}
    </section>
  )
}
