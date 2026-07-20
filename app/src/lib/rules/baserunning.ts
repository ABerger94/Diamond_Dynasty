import type { AtBatOutcome, BaseState } from '../../types/game'

export const OUT_OUTCOMES: AtBatOutcome[] = [
  'strikeout',
  'routineOut',
  'groundout',
  'lineout',
  'flyout',
  'popout',
  'sacFly',
  'doublePlay',
]

/** Bases advanced by the batter on a hit (or error) outcome; every existing runner advances the
 * same amount (station-to-station convention), per Rulebook §7. An Error always counts as a
 * Single for base-advancement purposes (§6). */
const HIT_ADVANCE: Partial<Record<AtBatOutcome, number>> = {
  infieldSingle: 1,
  single: 1,
  error: 1,
  double: 2,
  triple: 3,
  homeRun: 4,
}

export interface AdvanceResult {
  bases: BaseState
  runsScored: number
  outsAdded: number
}

/** A Walk (or Intentional Walk) only forces runners with no open base behind them — unlike a hit,
 * it isn't station-to-station for everyone (Rulebook §7). */
function advanceOnWalk(bases: BaseState, batterId: string): AdvanceResult {
  let { first, second, third } = bases
  let runsScored = 0
  if (first) {
    if (second) {
      if (third) runsScored = 1
      third = second
    }
    second = first
  }
  first = batterId
  return { bases: { first, second, third }, runsScored, outsAdded: 0 }
}

export function advanceRunners(bases: BaseState, outcome: AtBatOutcome, batterId: string): AdvanceResult {
  if (outcome === 'walk' || outcome === 'intentionalWalk') {
    return advanceOnWalk(bases, batterId)
  }

  if (outcome === 'sacFly') {
    const runsScored = bases.third ? 1 : 0
    return { bases: { first: bases.first, second: bases.second, third: null }, runsScored, outsAdded: 1 }
  }

  if (outcome === 'doublePlay') {
    // The lead runner off 1st is also out at 2nd (Rulebook §6) — no additional roll.
    return { bases: { ...bases, first: null }, runsScored: 0, outsAdded: 2 }
  }

  if (OUT_OUTCOMES.includes(outcome)) {
    return { bases, runsScored: 0, outsAdded: 1 }
  }

  const advance = HIT_ADVANCE[outcome]
  if (advance === undefined) {
    // foul / ballInPlay are not terminal outcomes; nothing to advance yet.
    return { bases, runsScored: 0, outsAdded: 0 }
  }

  let runsScored = 0
  const occupied: Record<number, string> = {}
  const runners: [number, string | null][] = [
    [1, bases.first],
    [2, bases.second],
    [3, bases.third],
  ]
  for (const [base, runnerId] of runners) {
    if (!runnerId) continue
    const newPos = base + advance
    if (newPos >= 4) runsScored++
    else occupied[newPos] = runnerId
  }
  const batterNewPos = advance
  if (batterNewPos >= 4) runsScored++
  else occupied[batterNewPos] = batterId

  return {
    bases: { first: occupied[1] ?? null, second: occupied[2] ?? null, third: occupied[3] ?? null },
    runsScored,
    outsAdded: 0,
  }
}
