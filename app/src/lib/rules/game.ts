import type { PlayerWithRatings } from '../../store/players'
import type { Position } from '../../types/player'
import { HITTER_POSITIONS } from '../../types/player'
import type { AtBatOutcome, GameState, PitchType, SwingType } from '../../types/game'
import type { Roster } from '../../types/roster'
import { advanceRunners } from './baserunning'
import { roll2d6, rollDie } from './dice'
import { defenseCheckToOutcome, fatiguePenalty, resolveAtBat, rollHitLocation, rollHitType } from './engine'

const DEFAULT_PITCHER_FIELDING = 10

export function createGame(
  awayRoster: Roster,
  homeRoster: Roster,
  awayStartingPitcherId: string,
  homeStartingPitcherId: string,
): GameState {
  const now = new Date().toISOString()
  const awayLineupOrder = HITTER_POSITIONS.map((pos) => awayRoster.lineup[pos]).filter((id): id is string => !!id)
  const homeLineupOrder = HITTER_POSITIONS.map((pos) => homeRoster.lineup[pos]).filter((id): id is string => !!id)

  return {
    id: `game_${Date.now()}`,
    awayRosterId: awayRoster.id,
    homeRosterId: homeRoster.id,
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
    awayLineupOrder,
    homeLineupOrder,
    awayBattingIndex: 0,
    homeBattingIndex: 0,
    log: ['Play ball!'],
    status: 'in_progress',
    createdAt: now,
    updatedAt: now,
  }
}

function lookupFielder(
  location: string,
  fieldingRoster: Roster,
  fieldingPitcherId: string | null,
  poolById: Map<string, PlayerWithRatings>,
): { fielderId: string | null; fielderRating: number } {
  if (location === 'P') {
    return { fielderId: fieldingPitcherId, fielderRating: DEFAULT_PITCHER_FIELDING }
  }
  let slot: Position
  if (location === 'LF/CF') {
    slot = rollDie(2) === 1 ? 'LF' : 'CF'
    if (!fieldingRoster.lineup[slot]) slot = slot === 'LF' ? 'CF' : 'LF'
  } else {
    slot = location as Position
  }
  const fielderId = fieldingRoster.lineup[slot] ?? null
  const fielderRating = fielderId ? (poolById.get(fielderId)?.ratings.hitter?.display.fielding ?? 10) : 10
  return { fielderId, fielderRating }
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
    infieldSingle: 'beats it out for an infield single',
    single: 'singles',
    double: 'doubles',
    triple: 'triples',
    homeRun: 'homers',
  }
  return labels[outcome]
}

export interface PlayAtBatParams {
  state: GameState
  awayRoster: Roster
  homeRoster: Roster
  poolById: Map<string, PlayerWithRatings>
  pitch: PitchType
  swing: SwingType
}

export function playAtBat({ state, awayRoster, homeRoster, poolById, pitch, swing }: PlayAtBatParams): GameState {
  const battingIsAway = state.half === 'top'
  const fieldingRoster = battingIsAway ? homeRoster : awayRoster
  const battingOrder = battingIsAway ? state.awayLineupOrder : state.homeLineupOrder
  const battingIndex = battingIsAway ? state.awayBattingIndex : state.homeBattingIndex
  const batterId = battingOrder[battingIndex % battingOrder.length]
  const batter = poolById.get(batterId)
  const pitcherId = battingIsAway ? state.homeCurrentPitcherId : state.awayCurrentPitcherId
  const pitcherEntry = pitcherId ? poolById.get(pitcherId) : undefined

  if (!batter?.ratings.hitter || !pitcherEntry?.ratings.pitcher || !pitcherId) {
    return state // incomplete roster; caller should prevent this
  }

  const fieldingPitcherOuts = battingIsAway ? state.homePitcherOuts : state.awayPitcherOuts
  const penalty = fatiguePenalty(pitcherEntry.player.primaryPosition === 'RP' ? 'RP' : 'SP', pitcherEntry.ratings.pitcher.display.stamina, fieldingPitcherOuts)
  const effectivePitcherRatings = { ...pitcherEntry.ratings.pitcher.display, control: pitcherEntry.ratings.pitcher.display.control - penalty }

  const scoreMargin = battingIsAway ? state.awayScore - state.homeScore : state.homeScore - state.awayScore

  const atBat = resolveAtBat({
    batterRatings: batter.ratings.hitter.display,
    pitcherRatings: effectivePitcherRatings,
    pitch,
    swing,
    inning: state.inning,
    scoreMargin,
  })

  let outcome: AtBatOutcome = atBat.outcome
  const logLines: string[] = []

  if (outcome === 'ballInPlay') {
    const hitType = rollHitType()
    const location = rollHitLocation()
    const { fielderId, fielderRating } = lookupFielder(location, fieldingRoster, pitcherId, poolById)
    const defenderTotal = roll2d6() + fielderRating
    const runnerTotal = roll2d6() + batter.ratings.hitter.display.speed
    const defenseWins = defenderTotal >= runnerTotal
    const hasRunnerOnThirdUnderTwoOuts = state.bases.third !== null && state.outs < 2
    outcome = defenseCheckToOutcome({ hitType, location, defenderTotal, runnerTotal, defenseWins }, hasRunnerOnThirdUnderTwoOuts)
    const fielderName = fielderId ? poolById.get(fielderId)?.player.name ?? 'the fielder' : 'the fielder'
    logLines.push(`Ball in play to ${location} (${hitType}) — ${fielderName} ${defenseWins ? 'makes the play' : "can't get there"}.`)
  }

  const { bases, runsScored, outsAdded } = advanceRunners(state.bases, outcome, batterId)
  logLines.push(`${batter.player.name} ${outcomeLabel(outcome)}${runsScored > 0 ? ` (${runsScored} run${runsScored > 1 ? 's' : ''} score!)` : ''}.`)

  let outs = state.outs + outsAdded
  let inning = state.inning
  let half = state.half
  let awayScore = state.awayScore + (battingIsAway ? runsScored : 0)
  let homeScore = state.homeScore + (battingIsAway ? 0 : runsScored)
  const lineScore = state.lineScore.map((row) => ({ ...row }))
  const currentRow = lineScore[inning - 1]
  const prevInningRuns = battingIsAway ? currentRow.away ?? 0 : currentRow.home ?? 0
  if (battingIsAway) currentRow.away = prevInningRuns + runsScored
  else currentRow.home = prevInningRuns + runsScored

  const awayPitcherOuts = state.awayPitcherOuts + (battingIsAway ? 0 : outsAdded)
  const homePitcherOuts = state.homePitcherOuts + (battingIsAway ? outsAdded : 0)

  let newBases = bases
  if (outsAdded > 0 && outs >= 3) {
    outs = 0
    newBases = { first: null, second: null, third: null }
    if (half === 'top') {
      half = 'bottom'
    } else {
      half = 'top'
      inning += 1
      lineScore.push({ away: null, home: null })
    }
  }

  const newAwayBattingIndex = battingIsAway ? state.awayBattingIndex + 1 : state.awayBattingIndex
  const newHomeBattingIndex = battingIsAway ? state.homeBattingIndex : state.homeBattingIndex + 1

  const halfJustCompleted = outsAdded > 0 && state.outs + outsAdded >= 3
  let status: GameState['status'] = 'in_progress'

  // Walk-off: home takes the lead batting in the bottom of the 9th or later — ends instantly,
  // even mid-inning (Rulebook §9).
  if (state.half === 'bottom' && state.inning >= 9 && homeScore > awayScore) {
    status = 'final'
    logLines.push('Walk-off! The home team wins.')
  }
  // Home already leads after the top half of the 9th (or later) completes — bottom half is skipped.
  else if (state.half === 'top' && state.inning >= 9 && halfJustCompleted && homeScore > awayScore) {
    status = 'final'
  }
  // Bottom half of the 9th (or later) completes with a decided score.
  else if (state.half === 'bottom' && state.inning >= 9 && halfJustCompleted && awayScore !== homeScore) {
    status = 'final'
  }

  return {
    ...state,
    inning,
    half,
    outs,
    bases: newBases,
    awayScore,
    homeScore,
    lineScore,
    awayPitcherOuts,
    homePitcherOuts,
    awayBattingIndex: newAwayBattingIndex,
    homeBattingIndex: newHomeBattingIndex,
    log: [...state.log, ...logLines].slice(-30),
    status,
    updatedAt: new Date().toISOString(),
  }
}
