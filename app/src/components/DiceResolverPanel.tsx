import { useState } from 'react'
import {
  clutchBonus,
  PITCH_TYPES,
  pitchValue,
  resolveDefenseCheck,
  resolvePhase4,
  roll2d6,
  rollHitType,
  rollLocation,
  SWING_TYPES,
  swingValue,
  type HitType,
  type PitchTypeId,
  type SwingTypeId,
} from '../lib/rules/diceResolver'
import type { PlayerWithRatings } from '../store/players'
import type { BaseState, AtBatOutcome } from '../types/game'
import type { Roster } from '../types/roster'

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

const HIT_TYPE_LABELS: Record<HitType, string> = {
  groundBall: 'Ground Ball',
  lineDrive: 'Line Drive',
  flyBall: 'Fly Ball',
  popUp: 'Pop Up',
}

interface RollBreakdown {
  dice: [number, number]
  total: number
  label: string
}

interface Phase4RollState {
  batter: RollBreakdown
  pitcher: RollBreakdown
  outcome: AtBatOutcome
  differential: number
}

interface DefenseCheckState {
  hitType?: { roll: number; hitType: HitType }
  location?: { roll: number; tiebreak?: number; position: string }
  fielderName?: string
  fielderRating?: number
  runnerRating?: number
  result?: { fielder: RollBreakdown; runner: RollBreakdown; outcome: AtBatOutcome; isError: boolean; isDoublePlay: boolean }
}

export default function DiceResolverPanel({
  batter,
  pitcherEntry,
  fieldingRoster,
  poolById,
  bases,
  outs,
  inning,
  regulationInnings,
  scoreDiff,
  onRecord,
}: {
  batter?: PlayerWithRatings
  pitcherEntry?: PlayerWithRatings
  fieldingRoster: Roster | null
  poolById: Map<string, PlayerWithRatings>
  bases: BaseState
  outs: number
  inning: number
  regulationInnings: number
  scoreDiff: number
  onRecord: (outcome: AtBatOutcome) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [swingChoice, setSwingChoice] = useState<SwingTypeId | ''>('')
  const [pitchChoice, setPitchChoice] = useState<PitchTypeId | ''>('')
  const [batterManualMod, setBatterManualMod] = useState('')
  const [pitcherManualMod, setPitcherManualMod] = useState('')
  const [phase4, setPhase4] = useState<Phase4RollState | null>(null)
  const [defenseCheck, setDefenseCheck] = useState<DefenseCheckState | null>(null)
  const [manualFielderRating, setManualFielderRating] = useState('')
  const [manualRunnerRating, setManualRunnerRating] = useState('')

  const hitterRatings = batter?.ratings.hitter?.display
  const pitcherRatings = pitcherEntry?.ratings.pitcher?.display

  function reset() {
    setSwingChoice('')
    setPitchChoice('')
    setBatterManualMod('')
    setPitcherManualMod('')
    setPhase4(null)
    setDefenseCheck(null)
    setManualFielderRating('')
    setManualRunnerRating('')
  }

  function batterBreakdown(dice: [number, number]): RollBreakdown {
    if (hitterRatings && swingChoice) {
      const { rating, modifier, label } = swingValue(swingChoice, hitterRatings)
      const bonus = clutchBonus(hitterRatings.clutch, inning, regulationInnings, scoreDiff)
      const total = dice[0] + dice[1] + rating + modifier + bonus
      return { dice, total, label: `${label}: ${rating} +${modifier}${bonus ? ` +${bonus} clutch` : ''}` }
    }
    const mod = Number(batterManualMod) || 0
    return { dice, total: dice[0] + dice[1] + mod, label: `Manual modifier: ${mod >= 0 ? '+' : ''}${mod}` }
  }

  function pitcherBreakdown(dice: [number, number]): RollBreakdown {
    if (pitcherRatings && pitchChoice) {
      const { rating, modifier, label } = pitchValue(pitchChoice, pitcherRatings)
      const bonus = clutchBonus(pitcherRatings.clutch, inning, regulationInnings, scoreDiff)
      const total = dice[0] + dice[1] + rating + modifier + bonus
      return { dice, total, label: `${label}: ${rating} +${modifier}${bonus ? ` +${bonus} clutch` : ''}` }
    }
    const mod = Number(pitcherManualMod) || 0
    return { dice, total: dice[0] + dice[1] + mod, label: `Manual modifier: ${mod >= 0 ? '+' : ''}${mod}` }
  }

  const canRoll = (hitterRatings ? !!swingChoice : batterManualMod.trim() !== '') && (pitcherRatings ? !!pitchChoice : pitcherManualMod.trim() !== '')

  function rollPhase4() {
    const batterRoll = batterBreakdown(roll2d6())
    const pitcherRoll = pitcherBreakdown(roll2d6())
    const swingForTie: SwingTypeId = swingChoice || 'power'
    const { outcome, differential } = resolvePhase4(batterRoll.total, pitcherRoll.total, swingForTie)
    setPhase4({ batter: batterRoll, pitcher: pitcherRoll, outcome, differential })
    setDefenseCheck(null)
  }

  function startDefenseCheck() {
    setDefenseCheck({})
  }

  function rollHitTypeStep() {
    setDefenseCheck((d) => ({ ...d, hitType: rollHitType() }))
  }

  function rollLocationStep() {
    const location = rollLocation()
    let fielderName: string | undefined
    let fielderRating: number | undefined
    if (location.position !== 'P' && fieldingRoster) {
      const fielderId = fieldingRoster.lineup[location.position as keyof Roster['lineup']]
      const fielder = fielderId ? poolById.get(fielderId) : undefined
      if (fielder?.ratings.hitter) {
        fielderName = fielder.player.name
        fielderRating = fielder.ratings.hitter.display.fielding
      }
    }
    setDefenseCheck((d) => ({ ...d, location, fielderName, fielderRating }))
  }

  function rollFieldingStep() {
    if (!defenseCheck?.hitType) return
    const fielderRating = defenseCheck.fielderRating ?? (Number(manualFielderRating) || 0)
    const runnerRating = hitterRatings?.speed ?? (Number(manualRunnerRating) || 0)
    const fielderDice = roll2d6()
    const runnerDice = roll2d6()
    const result = resolveDefenseCheck({
      hitType: defenseCheck.hitType.hitType,
      fielderDice,
      fielderRating,
      runnerDice,
      runnerRating,
      bases,
      outs,
    })
    setDefenseCheck((d) => ({
      ...d,
      result: {
        fielder: { dice: fielderDice, total: fielderDice[0] + fielderDice[1] + fielderRating, label: `Fielding ${fielderRating}` },
        runner: { dice: runnerDice, total: runnerDice[0] + runnerDice[1] + runnerRating, label: `Speed ${runnerRating}` },
        outcome: result.outcome,
        isError: result.isError,
        isDoublePlay: result.isDoublePlay,
      },
    }))
  }

  const finalOutcome = defenseCheck?.result?.outcome ?? (phase4 && phase4.outcome !== 'foul' && phase4.outcome !== 'ballInPlay' ? phase4.outcome : null)

  return (
    <div className="rounded-md border border-slate-800 bg-slate-900 p-4">
      <button onClick={() => setExpanded((e) => !e)} className="flex w-full items-center justify-between text-left">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dice Resolver (optional)</span>
        <span className="text-slate-500">{expanded ? '▲' : '▼'}</span>
      </button>
      {!expanded && <p className="mt-1 text-xs text-slate-500">Roll virtual dice with your players' modifiers auto-applied, or use it as a plain 2d6 + modifier calculator.</p>}

      {expanded && (
        <div className="mt-3 space-y-3">
          {!phase4 && (
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-400">Batter</p>
                {hitterRatings ? (
                  <div className="flex flex-wrap gap-2">
                    {SWING_TYPES.map((s) => {
                      const { rating, modifier } = swingValue(s.id, hitterRatings)
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSwingChoice(s.id)}
                          className={`rounded-md border px-2.5 py-1.5 text-xs ${
                            swingChoice === s.id ? 'border-sky-500 bg-sky-500/20 text-sky-300' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {s.label} ({rating} +{modifier})
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <input
                    value={batterManualMod}
                    onChange={(e) => setBatterManualMod(e.target.value)}
                    type="number"
                    placeholder="Batter modifier (e.g. 14)"
                    className="w-48 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500"
                  />
                )}
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-400">Pitcher</p>
                {pitcherRatings ? (
                  <div className="flex flex-wrap gap-2">
                    {PITCH_TYPES.map((p) => {
                      const { rating, modifier } = pitchValue(p.id, pitcherRatings)
                      return (
                        <button
                          key={p.id}
                          onClick={() => setPitchChoice(p.id)}
                          className={`rounded-md border px-2.5 py-1.5 text-xs ${
                            pitchChoice === p.id ? 'border-sky-500 bg-sky-500/20 text-sky-300' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {p.label} ({rating} +{modifier})
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <input
                    value={pitcherManualMod}
                    onChange={(e) => setPitcherManualMod(e.target.value)}
                    type="number"
                    placeholder="Pitcher modifier (e.g. 12)"
                    className="w-48 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500"
                  />
                )}
              </div>
              <button
                onClick={rollPhase4}
                disabled={!canRoll}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                🎲 Roll Dice
              </button>
            </div>
          )}

          {phase4 && (
            <div className="space-y-2 text-xs text-slate-300">
              <p>
                Batter: 🎲 {phase4.batter.dice[0]}+{phase4.batter.dice[1]} + {phase4.batter.label} = <span className="font-bold text-slate-100">{phase4.batter.total}</span>
              </p>
              <p>
                Pitcher: 🎲 {phase4.pitcher.dice[0]}+{phase4.pitcher.dice[1]} + {phase4.pitcher.label} = <span className="font-bold text-slate-100">{phase4.pitcher.total}</span>
              </p>
              <p className="text-slate-400">
                Differential: {phase4.differential > 0 ? '+' : ''}
                {phase4.differential} ({phase4.differential < 0 ? 'pitcher' : phase4.differential > 0 ? 'batter' : 'tie'})
              </p>

              {phase4.outcome === 'foul' && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-100">Foul ball — reroll with the same pitch/swing.</span>
                  <button onClick={rollPhase4} className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">
                    🎲 Roll Again
                  </button>
                </div>
              )}

              {phase4.outcome === 'ballInPlay' && !defenseCheck && (
                <div>
                  <p className="mb-2 font-semibold text-slate-100">Ball Put In Play — Defense Check.</p>
                  <button onClick={startDefenseCheck} className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500">
                    Start Defense Check
                  </button>
                </div>
              )}

              {defenseCheck && (
                <div className="space-y-2 border-t border-slate-800 pt-2">
                  {!defenseCheck.hitType && (
                    <button onClick={rollHitTypeStep} className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">
                      🎲 Roll Hit Type (1d6)
                    </button>
                  )}
                  {defenseCheck.hitType && (
                    <p>
                      Hit Type: 🎲 {defenseCheck.hitType.roll} → <span className="font-semibold text-slate-100">{HIT_TYPE_LABELS[defenseCheck.hitType.hitType]}</span>
                    </p>
                  )}

                  {defenseCheck.hitType && !defenseCheck.location && (
                    <button onClick={rollLocationStep} className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">
                      🎲 Roll Location (1d8)
                    </button>
                  )}
                  {defenseCheck.location && (
                    <p>
                      Location: 🎲 {defenseCheck.location.roll}
                      {defenseCheck.location.tiebreak ? ` (1d2 → ${defenseCheck.location.tiebreak})` : ''} →{' '}
                      <span className="font-semibold text-slate-100">{defenseCheck.location.position}</span>
                      {defenseCheck.fielderName && ` — ${defenseCheck.fielderName} (Fielding ${defenseCheck.fielderRating})`}
                    </p>
                  )}

                  {defenseCheck.location && !defenseCheck.result && (
                    <div className="space-y-2">
                      {!defenseCheck.fielderName && (
                        <input
                          value={manualFielderRating}
                          onChange={(e) => setManualFielderRating(e.target.value)}
                          type="number"
                          placeholder="Fielder's Fielding rating"
                          className="w-48 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500"
                        />
                      )}
                      {!hitterRatings && (
                        <input
                          value={manualRunnerRating}
                          onChange={(e) => setManualRunnerRating(e.target.value)}
                          type="number"
                          placeholder="Batter's Speed rating"
                          className="w-48 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500"
                        />
                      )}
                      <div>
                        <button onClick={rollFieldingStep} className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500">
                          🎲 Roll Fielding Check (2d6 vs 2d6)
                        </button>
                      </div>
                    </div>
                  )}

                  {defenseCheck.result && (
                    <div className="space-y-1">
                      <p>
                        Fielder: 🎲 {defenseCheck.result.fielder.dice[0]}+{defenseCheck.result.fielder.dice[1]} + {defenseCheck.result.fielder.label} ={' '}
                        <span className="font-bold text-slate-100">{defenseCheck.result.fielder.total}</span>
                      </p>
                      <p>
                        Runner: 🎲 {defenseCheck.result.runner.dice[0]}+{defenseCheck.result.runner.dice[1]} + {defenseCheck.result.runner.label} ={' '}
                        <span className="font-bold text-slate-100">{defenseCheck.result.runner.total}</span>
                      </p>
                      {defenseCheck.result.isError && <p className="font-semibold text-red-400">Snake eyes on the fielder's roll — Error!</p>}
                      {defenseCheck.result.isDoublePlay && <p className="font-semibold text-amber-400">Double Play — 2 outs on the play!</p>}
                    </div>
                  )}
                </div>
              )}

              {finalOutcome && (
                <div className="flex items-center gap-2 border-t border-slate-800 pt-2">
                  <span className="font-semibold text-emerald-300">Result: {OUTCOME_LABELS[finalOutcome]}</span>
                  <button
                    onClick={() => {
                      onRecord(finalOutcome)
                      reset()
                    }}
                    className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
                  >
                    Record: {OUTCOME_LABELS[finalOutcome]}
                  </button>
                </div>
              )}

              <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-300">
                Start over
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
