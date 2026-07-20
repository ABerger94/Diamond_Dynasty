import { useMemo, useState } from 'react'
import BasesDiagram from '../components/BasesDiagram'
import DiceResolverPanel from '../components/DiceResolverPanel'
import TeamLineupViewer from '../components/TeamLineupViewer'
import { changePitcher, createGame, overrideBases, RECORDABLE_OUTCOMES, recordPlateAppearance, recordSteal } from '../lib/rules/game'
import { fatiguePenalty, STEAL_SPEED_THRESHOLD } from '../lib/rules/engine'
import { ABILITY_DESCRIPTIONS, isFatigueExempt } from '../lib/rules/abilities'
import { TEAM_ACCENT, type TeamSide } from '../lib/teamColors'
import { usePlayerPool, type PlayerWithRatings } from '../store/players'
import { useGameState } from '../store/game'
import { useRosters } from '../store/rosters'
import type { AtBatOutcome } from '../types/game'

const OUTCOME_LABELS: Record<AtBatOutcome, string> = {
  strikeout: 'Strikeout',
  routineOut: 'Routine Out',
  ballInPlay: 'Ball In Play',
  foul: 'Foul',
  groundout: 'Groundout',
  lineout: 'Lineout',
  flyout: 'Flyout',
  sacFly: 'Sac Fly',
  popout: 'Popout',
  doublePlay: 'Double Play',
  walk: 'Walk',
  intentionalWalk: 'Intentional Walk',
  error: 'Error',
  infieldSingle: 'Infield Single',
  single: 'Single',
  double: 'Double',
  triple: 'Triple',
  homeRun: 'Home Run',
}
const OUT_OUTCOMES: AtBatOutcome[] = RECORDABLE_OUTCOMES.filter((o) =>
  ['strikeout', 'routineOut', 'groundout', 'lineout', 'flyout', 'popout', 'sacFly', 'doublePlay'].includes(o),
)
const HIT_OUTCOMES: AtBatOutcome[] = RECORDABLE_OUTCOMES.filter((o) => !OUT_OUTCOMES.includes(o))

export default function ScorecardPage() {
  const pool = usePlayerPool()
  const { rosters } = useRosters()
  const { game, setGame, endGame } = useGameState()
  const poolById = useMemo(() => new Map(pool.map((p) => [p.player.id, p])), [pool])

  const [awayMode, setAwayMode] = useState<'roster' | 'quick'>('roster')
  const [homeMode, setHomeMode] = useState<'roster' | 'quick'>('roster')
  const [awayRosterId, setAwayRosterId] = useState('')
  const [homeRosterId, setHomeRosterId] = useState('')
  const [awayPitcherId, setAwayPitcherId] = useState('')
  const [homePitcherId, setHomePitcherId] = useState('')
  const [awayTeamNameInput, setAwayTeamNameInput] = useState('Away')
  const [homeTeamNameInput, setHomeTeamNameInput] = useState('Home')
  const [regulationInnings, setRegulationInnings] = useState(9)

  const awayRoster = rosters.find((r) => r.id === (game?.awayRosterId ?? awayRosterId)) ?? null
  const homeRoster = rosters.find((r) => r.id === (game?.homeRosterId ?? homeRosterId)) ?? null

  const awayReady = awayMode === 'quick' ? awayTeamNameInput.trim().length > 0 : !!awayRosterId && !!awayPitcherId
  const homeReady = homeMode === 'quick' ? homeTeamNameInput.trim().length > 0 : !!homeRosterId && !!homePitcherId

  function startGame() {
    if (!awayReady || !homeReady) return
    setGame(
      createGame({
        awayRoster: awayMode === 'roster' ? awayRoster : null,
        homeRoster: homeMode === 'roster' ? homeRoster : null,
        awayTeamName: awayMode === 'quick' ? awayTeamNameInput.trim() : (awayRoster?.name ?? 'Away'),
        homeTeamName: homeMode === 'quick' ? homeTeamNameInput.trim() : (homeRoster?.name ?? 'Home'),
        awayStartingPitcherId: awayMode === 'roster' ? awayPitcherId : null,
        homeStartingPitcherId: homeMode === 'roster' ? homePitcherId : null,
        regulationInnings,
      }),
    )
  }

  function record(outcome: AtBatOutcome) {
    if (!game) return
    setGame(recordPlateAppearance({ state: game, poolById, outcome }))
  }

  function steal(base: 'first' | 'second', safe: boolean) {
    if (!game) return
    setGame(recordSteal({ state: game, poolById, base, safe }))
  }

  function clearBase(base: 'first' | 'second' | 'third') {
    if (!game) return
    setGame(overrideBases(game, { ...game.bases, [base]: null }))
  }

  if (!game) {
    return (
      <div className="max-w-xl">
        <h1 className="mb-1 text-2xl font-bold text-slate-100">Scorecard</h1>
        <p className="mb-4 text-sm text-slate-400">
          Play the game at the table with real cards and dice per the Rulebook. Pick a saved roster for either side, or
          use Quick Play for a side with no roster loaded — the app just keeps score either way. Record each plate
          appearance's result as it happens. Away bats first.
        </p>
        <div className="space-y-4">
          <div className="rounded-md border border-slate-800 bg-slate-900 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-200">Game Length</p>
            <div className="flex gap-2">
              {[3, 6, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => setRegulationInnings(n)}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                    regulationInnings === n ? 'border-sky-500 bg-sky-500/20 text-sky-300' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {n} innings
                </button>
              ))}
            </div>
          </div>
          <TeamPicker
            side="away"
            label="Away Team"
            mode={awayMode}
            onModeChange={setAwayMode}
            teamName={awayTeamNameInput}
            onTeamNameChange={setAwayTeamNameInput}
            rosters={rosters}
            rosterId={awayRosterId}
            onRosterChange={setAwayRosterId}
            pitcherId={awayPitcherId}
            onPitcherChange={setAwayPitcherId}
            poolById={poolById}
          />
          <TeamPicker
            side="home"
            label="Home Team"
            mode={homeMode}
            onModeChange={setHomeMode}
            teamName={homeTeamNameInput}
            onTeamNameChange={setHomeTeamNameInput}
            rosters={rosters}
            rosterId={homeRosterId}
            onRosterChange={setHomeRosterId}
            pitcherId={homePitcherId}
            onPitcherChange={setHomePitcherId}
            poolById={poolById}
          />
          <button
            onClick={startGame}
            disabled={!awayReady || !homeReady}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start Game
          </button>
        </div>
      </div>
    )
  }

  if ((game.awayRosterId && !awayRoster) || (game.homeRosterId && !homeRoster)) {
    return (
      <div className="max-w-xl space-y-3">
        <p className="text-sm text-red-400">
          One of this game's rosters no longer exists (it was probably deleted on the Roster Builder page). This game
          can't continue — discard it and start a new one.
        </p>
        <button onClick={endGame} className="rounded-md border border-red-800 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950">
          Discard Game
        </button>
      </div>
    )
  }

  const battingIsAway = game.half === 'top'
  const battingOrder = battingIsAway ? game.awayLineupOrder : game.homeLineupOrder
  const battingIndex = battingIsAway ? game.awayBattingIndex : game.homeBattingIndex
  const batterId = battingOrder[battingIndex % battingOrder.length]
  const batter = poolById.get(batterId)
  const pitcherId = battingIsAway ? game.homeCurrentPitcherId : game.awayCurrentPitcherId
  const pitcherEntry = pitcherId ? poolById.get(pitcherId) : undefined
  const fieldingOuts = battingIsAway ? game.homePitcherOuts : game.awayPitcherOuts
  const fieldingRoster = battingIsAway ? homeRoster : awayRoster
  // SP/RP is a roster-building choice (any pitcher card is eligible for either section — see
  // RosterPage), not an attribute of the player, so fatigue follows which list this roster put
  // them in rather than anything on the Player itself.
  const pitcherRole: 'SP' | 'RP' = fieldingRoster?.reliefPitchers.includes(pitcherId ?? '') ? 'RP' : 'SP'
  const penalty =
    pitcherEntry?.ratings.pitcher && !isFatigueExempt(pitcherEntry.player)
      ? fatiguePenalty(pitcherRole, pitcherEntry.ratings.pitcher.display.stamina, fieldingOuts)
      : 0

  const availablePitchers = fieldingRoster ? [...fieldingRoster.startingPitchers, ...fieldingRoster.reliefPitchers] : []

  const awayHighlightId = battingIsAway ? batterId : game.awayCurrentPitcherId
  const homeHighlightId = battingIsAway ? game.homeCurrentPitcherId : batterId

  // No `if (p)` guard here (unlike most poolById lookups in this file) — a quick-play side's
  // runner won't resolve to a real player, but a steal attempt should still be recordable for
  // them, just without a name/speed rating to show.
  const stealCandidates: { base: 'first' | 'second'; playerId: string; player?: PlayerWithRatings }[] = []
  if (game.bases.first) stealCandidates.push({ base: 'first', playerId: game.bases.first, player: poolById.get(game.bases.first) })
  if (game.bases.second) stealCandidates.push({ base: 'second', playerId: game.bases.second, player: poolById.get(game.bases.second) })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Scorecard</h1>
        <button onClick={endGame} className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800">
          End / Discard Game
        </button>
      </div>

      {game.status === 'final' && (
        <div className="mb-4 rounded-md border border-amber-600 bg-amber-950/40 px-4 py-3 text-amber-300">
          Final: <span className={TEAM_ACCENT.away.text}>{game.awayTeamName} {game.awayScore}</span> —{' '}
          <span className={TEAM_ACCENT.home.text}>{game.homeTeamName} {game.homeScore}</span>
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
                <td className={`text-left font-semibold ${TEAM_ACCENT.away.text}`}>{game.awayTeamName}</td>
                {game.lineScore.map((row, i) => (
                  <td key={i} className="text-slate-300">
                    {row.away ?? '-'}
                  </td>
                ))}
                <td className={`font-bold ${TEAM_ACCENT.away.text}`}>{game.awayScore}</td>
              </tr>
              <tr>
                <td className={`text-left font-semibold ${TEAM_ACCENT.home.text}`}>{game.homeTeamName}</td>
                {game.lineScore.map((row, i) => (
                  <td key={i} className="text-slate-300">
                    {row.home ?? '-'}
                  </td>
                ))}
                <td className={`font-bold ${TEAM_ACCENT.home.text}`}>{game.homeScore}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-sm text-slate-400">
            {game.half === 'top' ? 'Top' : 'Bottom'} of inning {game.inning}
            {game.inning <= game.regulationInnings ? ` of ${game.regulationInnings}` : ' (extra innings)'} · {game.outs} out
            {game.outs === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-slate-800 bg-slate-900 p-4">
          <BasesDiagram bases={game.bases} />
          <div className="flex gap-2 text-[10px] text-slate-500">
            {(['first', 'second', 'third'] as const).map(
              (b) =>
                game.bases[b] && (
                  <button key={b} onClick={() => clearBase(b)} className="rounded border border-slate-700 px-1.5 py-0.5 hover:bg-slate-800">
                    Clear {b}
                  </button>
                ),
            )}
          </div>
        </div>
      </div>

      {game.status === 'in_progress' && (
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={`rounded-md border p-4 ${TEAM_ACCENT[battingIsAway ? 'away' : 'home'].border} ${TEAM_ACCENT[battingIsAway ? 'away' : 'home'].bg}`}>
            <p className={`text-xs uppercase tracking-wide ${TEAM_ACCENT[battingIsAway ? 'away' : 'home'].label}`}>At bat</p>
            <p className="text-lg font-bold text-slate-100">{batter?.player.name ?? 'Batter'}</p>
            {batter?.ratings.hitter ? (
              <p className="mb-2 text-xs text-slate-400">
                CON {batter.ratings.hitter.display.contact} · POW {batter.ratings.hitter.display.power} · DIS{' '}
                {batter.ratings.hitter.display.discipline} · SPD {batter.ratings.hitter.display.speed} · CLU{' '}
                {batter.ratings.hitter.display.clutch}
              </p>
            ) : (
              <p className="mb-2 text-xs text-slate-500">No roster loaded for this side — recording only.</p>
            )}
            {batter && <AbilityReminders player={batter.player} />}
          </div>
          <div className={`rounded-md border p-4 ${TEAM_ACCENT[battingIsAway ? 'home' : 'away'].border} ${TEAM_ACCENT[battingIsAway ? 'home' : 'away'].bg}`}>
            <p className={`text-xs uppercase tracking-wide ${TEAM_ACCENT[battingIsAway ? 'home' : 'away'].label}`}>Pitching</p>
            <p className="text-lg font-bold text-slate-100">
              {pitcherEntry?.player.name ?? 'Pitcher'} {penalty > 0 && <span className="text-xs font-normal text-red-400">(-{penalty} CTL fatigue)</span>}
            </p>
            {pitcherEntry?.ratings.pitcher ? (
              <p className="mb-2 text-xs text-slate-400">
                VEL {pitcherEntry.ratings.pitcher.display.velocity} · STF {pitcherEntry.ratings.pitcher.display.stuff} · CTL{' '}
                {pitcherEntry.ratings.pitcher.display.control} · CLU {pitcherEntry.ratings.pitcher.display.clutch}
              </p>
            ) : (
              <p className="mb-2 text-xs text-slate-500">No roster loaded for this side — recording only.</p>
            )}
            {pitcherEntry && <AbilityReminders player={pitcherEntry.player} />}
            {availablePitchers.length > 1 && (
              <select
                value=""
                onChange={(e) => e.target.value && setGame(changePitcher(game, battingIsAway ? 'home' : 'away', e.target.value))}
                className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-400"
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

      <div className="mb-4 space-y-3">
        {awayRoster && <TeamLineupViewer teamName={game.awayTeamName} roster={awayRoster} poolById={poolById} highlightId={awayHighlightId} accent="away" />}
        {homeRoster && <TeamLineupViewer teamName={game.homeTeamName} roster={homeRoster} poolById={poolById} highlightId={homeHighlightId} accent="home" />}
      </div>

      {game.status === 'in_progress' && (
        <div className="mb-4 space-y-3">
          <DiceResolverPanel
            batter={batter}
            pitcherEntry={pitcherEntry}
            fieldingRoster={fieldingRoster}
            poolById={poolById}
            bases={game.bases}
            outs={game.outs}
            inning={game.inning}
            regulationInnings={game.regulationInnings}
            scoreDiff={Math.abs(game.awayScore - game.homeScore)}
            onRecord={record}
          />
          <div className="rounded-md border border-slate-800 bg-slate-900 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Record the result</p>
            <div className="mb-2 flex flex-wrap gap-2">
              {OUT_OUTCOMES.map((o) => (
                <button key={o} onClick={() => record(o)} className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">
                  {OUTCOME_LABELS[o]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {HIT_OUTCOMES.map((o) => (
                <button
                  key={o}
                  onClick={() => record(o)}
                  className="rounded-md border border-emerald-800 bg-emerald-950/40 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-900/40"
                >
                  {OUTCOME_LABELS[o]}
                </button>
              ))}
            </div>
          </div>

          {stealCandidates.length > 0 && (
            <div className="rounded-md border border-slate-800 bg-slate-900 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Steal attempt</p>
              <div className="flex flex-wrap gap-3">
                {stealCandidates.map(({ base, player }) => (
                  <div key={base} className="flex items-center gap-2 text-sm text-slate-300">
                    <span>
                      {player?.player.name ?? 'Runner'} ({base}
                      {player?.ratings.hitter && (
                        <>
                          , SPD {player.ratings.hitter.display.speed}
                          {player.ratings.hitter.display.speed < STEAL_SPEED_THRESHOLD ? ' — below threshold' : ''}
                        </>
                      )}
                      )
                    </span>
                    <button onClick={() => steal(base, true)} className="rounded border border-emerald-700 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-950">
                      Safe
                    </button>
                    <button onClick={() => steal(base, false)} className="rounded border border-red-700 px-2 py-1 text-xs text-red-400 hover:bg-red-950">
                      Out
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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

function AbilityReminders({ player }: { player: PlayerWithRatings['player'] }) {
  if (!player.abilities || player.abilities.length === 0) return null
  return (
    <div className="mb-2 space-y-1">
      {player.abilities.map((name) => (
        <p key={name} className="text-xs">
          <span className="font-semibold text-amber-300">{name}:</span> <span className="text-slate-400">{ABILITY_DESCRIPTIONS[name]}</span>
        </p>
      ))}
    </div>
  )
}

function TeamPicker({
  side,
  label,
  mode,
  onModeChange,
  teamName,
  onTeamNameChange,
  rosters,
  rosterId,
  onRosterChange,
  pitcherId,
  onPitcherChange,
  poolById,
}: {
  side: TeamSide
  label: string
  mode: 'roster' | 'quick'
  onModeChange: (mode: 'roster' | 'quick') => void
  teamName: string
  onTeamNameChange: (name: string) => void
  rosters: { id: string; name: string; startingPitchers: string[] }[]
  rosterId: string
  onRosterChange: (id: string) => void
  pitcherId: string
  onPitcherChange: (id: string) => void
  poolById: Map<string, { player: { name: string } }>
}) {
  const roster = rosters.find((r) => r.id === rosterId)
  const colors = TEAM_ACCENT[side]
  return (
    <div className={`rounded-md border p-4 ${colors.border} ${colors.bg}`}>
      <div className="mb-2 flex items-center justify-between">
        <p className={`text-sm font-semibold ${colors.header}`}>{label}</p>
        <div className="flex gap-1 text-xs">
          <button
            onClick={() => onModeChange('roster')}
            className={`rounded px-2 py-1 ${mode === 'roster' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            Saved roster
          </button>
          <button
            onClick={() => onModeChange('quick')}
            className={`rounded px-2 py-1 ${mode === 'quick' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            Quick play
          </button>
        </div>
      </div>

      {mode === 'quick' ? (
        <div>
          <input
            value={teamName}
            onChange={(e) => onTeamNameChange(e.target.value)}
            placeholder="Team name"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 placeholder-slate-500"
          />
          <p className="mt-1 text-xs text-slate-500">No roster — ratings/lineup won't show, but score, outs, and bases still track normally.</p>
        </div>
      ) : (
        <>
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
          {rosters.length < 1 && <p className="mt-2 text-xs text-amber-400">No saved rosters yet — build one on the Roster Builder page, or switch to Quick Play.</p>}
        </>
      )}
    </div>
  )
}
