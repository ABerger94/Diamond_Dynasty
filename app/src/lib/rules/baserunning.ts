import type { AtBatOutcome, BaseState } from '../../types/game'

export const OUT_OUTCOMES: AtBatOutcome[] = [
  'strikeout',
  'routineOut',
  'groundout',
  'lineout',
  'flyout',
  'popout',
  'sacFly',
]

/** Bases advanced by the batter on a hit outcome; every existing runner advances the same amount
 * (station-to-station convention), per Rulebook §7. */
const HIT_ADVANCE: Partial<Record<AtBatOutcome, number>> = {
  infieldSingle: 1,
  single: 1,
  double: 2,
  triple: 3,
  homeRun: 4,
}

export interface AdvanceResult {
  bases: BaseState
  runsScored: number
  outsAdded: number
}

export function advanceRunners(bases: BaseState, outcome: AtBatOutcome, batterId: string): AdvanceResult {
  if (outcome === 'sacFly') {
    const runsScored = bases.third ? 1 : 0
    return { bases: { first: bases.first, second: bases.second, third: null }, runsScored, outsAdded: 1 }
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
