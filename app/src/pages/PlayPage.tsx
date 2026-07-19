import { useMemo, useState } from 'react'
import BasesDiagram from '../components/BasesDiagram'
import { createGame, playAtBat } from '../lib/rules/game'
import { fatiguePenalty } from '../lib/rules/engine'
import { usePlayerPool } from '../store/players'
import { useGameState } from '../store/game'
import { useRosters } from '../store/rosters'
import type { PitchType, SwingType } from '../types/game'

const PITCH_OPTIONS: { value: PitchType; label: string }[] = [
  { value: 'fastball', label: 'Fastball (Velocity)' },
  { value: 'breakingBall', label: 'Breaking Ball (Stuff)' },
  { value: 'changeup', label: 'Changeup (Control)' },
]
const SWING_OPTIONS: { value: SwingType; label: string }[] = [
  { value: 'contact', label: 'Contact Swing' },
  { value: 'normal', label: 'Normal Swing' },
  { value: 'power', label: 'Power Swing' },
]

export default function PlayPage() {
  const pool = usePlayerPool()
  const { rosters } = useRosters()
  const { game, setGame, endGame } = useGameState()
  const poolById = useMemo(() => new Map(pool.map((p) => [p.player.id, p])), [pool])

  const [awayRosterId, setAwayRosterId] = useState('')
  const [homeRosterId, setHomeRosterId] = useState('')
  const [awayPitcherId, setAwayPitcherId] = useState('')
  const [homePitcherId, setHomePitcherId] = useState('')
  const [pitch, setPitch] = useState<PitchType>('fastball')
  const [swing, setSwing] = useState<SwingType>('normal')

  const awayRoster = rosters.find((r) => r.id === (game?.awayRosterId ?? awayRosterId)) ?? null
  const homeRoster = rosters.find((r) => r.id === (game?.homeRosterId ?? homeRosterId)) ?? null

  function startGame() {
    if (!awayRoster || !homeRoster || !awayPitcherId || !homePitcherId) return
    setGame(createGame(awayRoster, homeRoster, awayPitcherId, homePitcherId))
  }

  function resolve() {
    if (!game || !awayRoster || !homeRoster || game.status === 'final') return
    setGame(playAtBat({ state: game, awayRoster, homeRoster, poolById, pitch, swing }))
  }

  function changePitcher(team: 'away' | 'home', playerId: string) {
    if (!game) return
    setGame({
      ...game,
      awayCurrentPitcherId: team === 'away' ? playerId : game.awayCurrentPitcherId,
      homeCurrentPitcherId: team === 'home' ? playerId : game.homeCurrentPitcherId,
      awayPitcherOuts: team === 'away' ? 0 : game.awayPitcherOuts,
      homePitcherOuts: team === 'home' ? 0 : game.homePitcherOuts,
    })
  }

  if (!game) {
    return (
      <div className="max-w-xl">
        <h1 className="mb-1 text-2xl font-bold text-slate-100">Play Ball</h1>
        <p className="mb-4 text-sm text-slate-400">Pick two rosters to start a game. Away bats first.</p>
        {rosters.length < 1 && <p className="text-sm text-amber-400">Build at least one roster first on the Roster Builder page.</p>}
        <div className="space-y-4">
          <TeamPicker
            label="Away Team"
            rosters={rosters}
            rosterId={awayRosterId}
            onRosterChange={setAwayRosterId}
            pitcherId={awayPitcherId}
            onPitcherChange={setAwayPitcherId}
            poolById={poolById}
          />
          <TeamPicker
            label="Home Team"
            rosters={rosters}
            rosterId={homeRosterId}
            onRosterChange={setHomeRosterId}
            pitcherId={homePitcherId}
            onPitcherChange={setHomePitcherId}
            poolById={poolById}
          />
          <button
            onClick={startGame}
            disabled={!awayRosterId || !homeRosterId || !awayPitcherId || !homePitcherId}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start Game
          </button>
        </div>
      </div>
    )
  }

  if (!awayRoster || !homeRoster) {
    return <p className="text-sm text-red-400">One of this game's rosters no longer exists.</p>
  }

  const battingIsAway = game.half === 'top'
  const battingOrder = battingIsAway ? game.awayLineupOrder : game.homeLineupOrder
  const battingIndex = battingIsAway ? game.awayBattingIndex : game.homeBattingIndex
  const batterId = battingOrder[battingIndex % battingOrder.length]
  const batter = poolById.get(batterId)
  const pitcherId = battingIsAway ? game.homeCurrentPitcherId : game.awayCurrentPitcherId
  const pitcherEntry = pitcherId ? poolById.get(pitcherId) : undefined
  const fieldingOuts = battingIsAway ? game.homePitcherOuts : game.awayPitcherOuts
  const penalty = pitcherEntry?.ratings.pitcher
    ? fatiguePenalty(pitcherEntry.player.primaryPosition === 'RP' ? 'RP' : 'SP', pitcherEntry.ratings.pitcher.display.stamina, fieldingOuts)
    : 0

  const fieldingRoster = battingIsAway ? homeRoster : awayRoster
  const availablePitchers = [...fieldingRoster.startingPitchers, ...fieldingRoster.reliefPitchers]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Play Ball</h1>
        <button onClick={endGame} className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800">
          End / Discard Game
        </button>
      </div>

      {game.status === 'final' && (
        <div className="mb-4 rounded-md border border-amber-600 bg-amber-950/40 px-4 py-3 text-amber-300">
          Final: {awayRoster.name} {game.awayScore} — {homeRoster.name} {game.homeScore}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-md border border-slate-800 bg-slate-900 p-4 md:col-span-2">
          <table className="w-full text-center text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="text-left font-medium">Team</th>
                {game.lineScore.map((_, i) => (
                  <th key={i} className="font-medium">
                    {i + 1}
                  </th>
                ))}
                <th className="font-bold text-slate-300">R</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-left font-semibold text-slate-200">{awayRoster.name}</td>
                {game.lineScore.map((row, i) => (
                  <td key={i} className="text-slate-300">
                    {row.away ?? '-'}
                  </td>
                ))}
                <td className="font-bold text-sky-400">{game.awayScore}</td>
              </tr>
              <tr>
                <td className="text-left font-semibold text-slate-200">{homeRoster.name}</td>
                {game.lineScore.map((row, i) => (
                  <td key={i} className="text-slate-300">
                    {row.home ?? '-'}
                  </td>
                ))}
                <td className="font-bold text-sky-400">{game.homeScore}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-sm text-slate-400">
            {game.half === 'top' ? 'Top' : 'Bottom'} of inning {game.inning} · {game.outs} out{game.outs === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center justify-center rounded-md border border-slate-800 bg-slate-900 p-4">
          <BasesDiagram bases={game.bases} />
        </div>
      </div>

      {game.status === 'in_progress' && batter?.ratings.hitter && pitcherEntry?.ratings.pitcher && (
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-md border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">At bat</p>
            <p className="text-lg font-bold text-slate-100">{batter.player.name}</p>
            <p className="mb-3 text-xs text-slate-400">
              CON {batter.ratings.hitter.display.contact} · POW {batter.ratings.hitter.display.power} · SPD{' '}
              {batter.ratings.hitter.display.speed}
            </p>
            <label className="mb-1 block text-xs font-medium text-slate-400">Swing type</label>
            <select
              value={swing}
              onChange={(e) => setSwing(e.target.value as SwingType)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
            >
              {SWING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pitching</p>
            <p className="text-lg font-bold text-slate-100">
              {pitcherEntry.player.name} {penalty > 0 && <span className="text-xs font-normal text-red-400">(-{penalty} CTL fatigue)</span>}
            </p>
            <p className="mb-3 text-xs text-slate-400">
              VEL {pitcherEntry.ratings.pitcher.display.velocity} · STF {pitcherEntry.ratings.pitcher.display.stuff} · CTL{' '}
              {pitcherEntry.ratings.pitcher.display.control}
            </p>
            <label className="mb-1 block text-xs font-medium text-slate-400">Pitch type</label>
            <select
              value={pitch}
              onChange={(e) => setPitch(e.target.value as PitchType)}
              className="mb-2 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
            >
              {PITCH_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {availablePitchers.length > 1 && (
              <select
                value=""
                onChange={(e) => e.target.value && changePitcher(battingIsAway ? 'home' : 'away', e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-400"
              >
                <option value="">Make a pitching change...</option>
                {availablePitchers
                  .filter((id) => id !== pitcherId)
                  .map((id) => (
                    <option key={id} value={id}>
                      {poolById.get(id)?.player.name}
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>
      )}

      {game.status === 'in_progress' && (
        <button onClick={resolve} className="mb-4 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">
          Resolve At-Bat
        </button>
      )}

      <div className="rounded-md border border-slate-800 bg-slate-900 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Play-by-play</p>
        <ul className="max-h-64 space-y-1 overflow-y-auto text-sm text-slate-300">
          {[...game.log].reverse().map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function TeamPicker({
  label,
  rosters,
  rosterId,
  onRosterChange,
  pitcherId,
  onPitcherChange,
  poolById,
}: {
  label: string
  rosters: { id: string; name: string; startingPitchers: string[] }[]
  rosterId: string
  onRosterChange: (id: string) => void
  pitcherId: string
  onPitcherChange: (id: string) => void
  poolById: Map<string, { player: { name: string } }>
}) {
  const roster = rosters.find((r) => r.id === rosterId)
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900 p-4">
      <p className="mb-2 text-sm font-semibold text-slate-200">{label}</p>
      <select
        value={rosterId}
        onChange={(e) => {
          onRosterChange(e.target.value)
          onPitcherChange('')
        }}
        className="mb-2 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
      >
        <option value="">Select roster...</option>
        {rosters.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      {roster && (
        <select
          value={pitcherId}
          onChange={(e) => onPitcherChange(e.target.value)}
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
        >
          <option value="">Select starting pitcher...</option>
          {roster.startingPitchers.map((id) => (
            <option key={id} value={id}>
              {poolById.get(id)?.player.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
