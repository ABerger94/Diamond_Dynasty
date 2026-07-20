import type { PlayerWithRatings } from '../../store/players'
import { HITTER_POSITIONS } from '../../types/player'
import type { AtBatOutcome, BaseState, GameState } from '../../types/game'
import type { Roster } from '../../types/roster'
import { advanceRunners } from './baserunning'

/**
 * The scorekeeper plays the actual at-bat at the table with real cards and dice, then records
 * the result here. This module only applies the bookkeeping consequences of a result the humans
 * already decided (base advancement, outs, score, lineup order, half-inning/game-end) — it never
 * rolls dice or picks an outcome itself.
 */

/** Outcomes a scorekeeper can record — excludes the non-terminal 'ballInPlay'/'foul' states,
 * which the table resolves before there's a final result to enter. */
export const RECORDABLE_OUTCOMES: AtBatOutcome[] = [
  'strikeout',
  'routineOut',
  'groundout',
  'lineout',
  'flyout',
  'sacFly',
  'popout',
  'doublePlay',
  'walk',
  'intentionalWalk',
  'error',
  'infieldSingle',
  'single',
  'double',
  'triple',
  'homeRun',
]

/** Stands in for a real lineup slot on a "quick play" side with no saved roster — see
 * createGame's `awayRoster`/`homeRoster` params. Every downstream lookup (poolById.get) already
 * treats an unrecognized id as "no player data," falling back to the generic "Batter"/"Runner"
 * labels already used throughout this module — so quick play needs no special-casing beyond
 * having *some* id to put in lineup order and cycle through. */
const GENERIC_BATTER_ID = '__generic_batter__'

export interface CreateGameParams {
  /** Null for a "quick play" side — no roster, no lineup, no pitcher tracking/fatigue for that
   * side; the batter/pitcher shown is just a generic placeholder each half-inning. */
  awayRoster: Roster | null
  homeRoster: Roster | null
  awayTeamName: string
  homeTeamName: string
  awayStartingPitcherId: string | null
  homeStartingPitcherId: string | null
  /** 3, 6, or 9 — chosen before the game starts (Rulebook §4). */
  regulationInnings: number
}

export function createGame({
  awayRoster,
  homeRoster,
  awayTeamName,
  homeTeamName,
  awayStartingPitcherId,
  homeStartingPitcherId,
  regulationInnings,
}: CreateGameParams): GameState {
  const now = new Date().toISOString()
  const lineupFor = (roster: Roster | null) => {
    if (!roster) return [GENERIC_BATTER_ID]
    const order = HITTER_POSITIONS.map((pos) => roster.lineup[pos]).filter((id): id is string => !!id)
    return order.length > 0 ? order : [GENERIC_BATTER_ID]
  }

  return {
    id: `game_${Date.now()}`,
    awayRosterId: awayRoster?.id ?? null,
    homeRosterId: homeRoster?.id ?? null,
    awayTeamName,
    homeTeamName,
    regulationInnings,
    inning: 1,
    half: 'top',
    outs: 0,
    bases: { first: null, second: null, third: null },
    awayScore: 0,
    homeScore: 0,
    lineScore: [{ away: null, home: null }],
    awayBoxScore: [],
    homeBoxScore: [],
    awayPitcherOuts: 0,
    homePitcherOuts: 0,
    awayCurrentPitcherId: awayStartingPitcherId,
    homeCurrentPitcherId: homeStartingPitcherId,
    awayLineupOrder: lineupFor(awayRoster),
    homeLineupOrder: lineupFor(homeRoster),
    awayBattingIndex: 0,
    homeBattingIndex: 0,
    log: ['Play ball!'],
    status: 'in_progress',
    createdAt: now,
    updatedAt: now,
  }
}

function outcomeLabel(outcome: AtBatOutcome): string {
  const labels: Record<AtBatOutcome, string> = {
    strikeout: 'strikes out',
    routineOut: 'is out on a routine play',
    ballInPlay: 'puts the ball in play',
    foul: 'fouls it off',
    groundout: 'grounds out',
    lineout: 'lines out',
    flyout: 'flies out',
    sacFly: 'hits a sacrifice fly',
    popout: 'pops out',
    doublePlay: 'grounds into a double play (2 outs)',
    walk: 'draws a walk',
    intentionalWalk: 'is intentionally walked',
    error: 'reaches on an error',
    infieldSingle: 'beats it out for an infield single',
    single: 'singles',
    double: 'doubles',
    triple: 'triples',
    homeRun: 'homers',
  }
  return labels[outcome]
}

interface PlayResult {
  state: GameState
  extraLog: string[]
}

/** Applies an outs/runs delta to the scorecard: score, line score, pitcher-outs, half-inning
 * flip, inning increment, and game-end status (Rulebook §9) — but does not touch `log`, leaving
 * that to the caller so log assembly happens in exactly one place. Shared by plate appearances
 * and stolen-base attempts, the two ways an out or a run can happen. */
function applyPlayToState(state: GameState, battingIsAway: boolean, outsAdded: number, runsScored: number): PlayResult {
  let outs = state.outs + outsAdded
  let inning = state.inning
  let half = state.half
  const awayScore = state.awayScore + (battingIsAway ? runsScored : 0)
  const homeScore = state.homeScore + (battingIsAway ? 0 : runsScored)
  const lineScore = state.lineScore.map((row) => ({ ...row }))
  const currentRow = lineScore[inning - 1]
  const prevInningRuns = battingIsAway ? (currentRow.away ?? 0) : (currentRow.home ?? 0)
  if (battingIsAway) currentRow.away = prevInningRuns + runsScored
  else currentRow.home = prevInningRuns + runsScored

  const awayPitcherOuts = state.awayPitcherOuts + (battingIsAway ? 0 : outsAdded)
  const homePitcherOuts = state.homePitcherOuts + (battingIsAway ? outsAdded : 0)

  let bases = state.bases
  if (outsAdded > 0 && outs >= 3) {
    outs = 0
    bases = { first: null, second: null, third: null }
    if (half === 'top') {
      half = 'bottom'
    } else {
      half = 'top'
      inning += 1
      lineScore.push({ away: null, home: null })
    }
  }

  const halfJustCompleted = outsAdded > 0 && state.outs + outsAdded >= 3
  let status: GameState['status'] = state.status
  const extraLog: string[] = []

  const regulation = state.regulationInnings
  if (state.half === 'bottom' && state.inning >= regulation && homeScore > awayScore) {
    status = 'final'
    extraLog.push('Walk-off! The home team wins.')
  } else if (state.half === 'top' && state.inning >= regulation && halfJustCompleted && homeScore > awayScore) {
    status = 'final'
  } else if (state.half === 'bottom' && state.inning >= regulation && halfJustCompleted && awayScore !== homeScore) {
    status = 'final'
  }

  return {
    state: {
      ...state,
      inning,
      half,
      outs,
      bases,
      awayScore,
      homeScore,
      lineScore,
      awayPitcherOuts,
      homePitcherOuts,
      status,
      updatedAt: new Date().toISOString(),
    },
    extraLog,
  }
}

export interface RecordPlateAppearanceParams {
  state: GameState
  poolById: Map<string, PlayerWithRatings>
  outcome: AtBatOutcome
}

/** Records a plate appearance's already-decided result and advances the lineup. */
export function recordPlateAppearance({ state, poolById, outcome }: RecordPlateAppearanceParams): GameState {
  if (state.status !== 'in_progress') return state
  const battingIsAway = state.half === 'top'
  const battingOrder = battingIsAway ? state.awayLineupOrder : state.homeLineupOrder
  const battingIndex = battingIsAway ? state.awayBattingIndex : state.homeBattingIndex
  if (battingOrder.length === 0) return state
  const batterId = battingOrder[battingIndex % battingOrder.length]
  const batter = poolById.get(batterId)

  const { bases, runsScored, outsAdded } = advanceRunners(state.bases, outcome, batterId)
  const logLine = `${batter?.player.name ?? 'Batter'} ${outcomeLabel(outcome)}${runsScored > 0 ? ` (${runsScored} run${runsScored > 1 ? 's' : ''} score!)` : ''}.`

  const { state: next, extraLog } = applyPlayToState({ ...state, bases }, battingIsAway, outsAdded, runsScored)
  const newAwayBattingIndex = battingIsAway ? state.awayBattingIndex + 1 : state.awayBattingIndex
  const newHomeBattingIndex = battingIsAway ? state.homeBattingIndex : state.homeBattingIndex + 1

  return {
    ...next,
    awayBattingIndex: newAwayBattingIndex,
    homeBattingIndex: newHomeBattingIndex,
    log: [...state.log, logLine, ...extraLog].slice(-30),
  }
}

export interface RecordStealParams {
  state: GameState
  poolById: Map<string, PlayerWithRatings>
  base: 'first' | 'second'
  safe: boolean
}

/** Records a stolen-base attempt's already-decided result (Rulebook §7). */
export function recordSteal({ state, poolById, base, safe }: RecordStealParams): GameState {
  if (state.status !== 'in_progress') return state
  const runnerId = state.bases[base]
  if (!runnerId) return state
  const battingIsAway = state.half === 'top'
  const runnerName = poolById.get(runnerId)?.player.name ?? 'Runner'
  const target = base === 'first' ? 'second' : 'third'

  let bases: BaseState
  let outsAdded = 0
  let logLine: string
  if (safe) {
    bases = { ...state.bases, [base]: null, [target]: runnerId }
    logLine = `${runnerName} steals ${target} base.`
  } else {
    bases = { ...state.bases, [base]: null }
    outsAdded = 1
    logLine = `${runnerName} is caught stealing ${target} base.`
  }

  const { state: next, extraLog } = applyPlayToState({ ...state, bases }, battingIsAway, outsAdded, 0)
  return { ...next, log: [...state.log, logLine, ...extraLog].slice(-30) }
}

/** Manual correction for anything the recorded outcomes don't cover (wild pitch, error, pickoff,
 * balk, etc.) — the scorekeeper sets the bases directly rather than the app inferring them. */
export function overrideBases(state: GameState, bases: BaseState): GameState {
  return { ...state, bases, updatedAt: new Date().toISOString() }
}

export function changePitcher(state: GameState, team: 'away' | 'home', playerId: string): GameState {
  return {
    ...state,
    awayCurrentPitcherId: team === 'away' ? playerId : state.awayCurrentPitcherId,
    homeCurrentPitcherId: team === 'home' ? playerId : state.homeCurrentPitcherId,
    awayPitcherOuts: team === 'away' ? 0 : state.awayPitcherOuts,
    homePitcherOuts: team === 'home' ? 0 : state.homePitcherOuts,
    updatedAt: new Date().toISOString(),
  }
}
