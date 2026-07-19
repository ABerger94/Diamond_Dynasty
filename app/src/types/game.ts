export type PitchType = 'fastball' | 'breakingBall' | 'changeup'
export type SwingType = 'contact' | 'normal' | 'power'
export type HitType = 'groundBall' | 'lineDrive' | 'flyBall' | 'popUp'

export type AtBatOutcome =
  | 'strikeout'
  | 'routineOut'
  | 'ballInPlay'
  | 'foul'
  | 'groundout'
  | 'lineout'
  | 'flyout'
  | 'sacFly'
  | 'popout'
  | 'infieldSingle'
  | 'single'
  | 'double'
  | 'triple'
  | 'homeRun'

export interface BaseState {
  first: string | null
  second: string | null
  third: string | null
}

export interface LineScoreInning {
  away: number | null
  home: number | null
}

export interface TeamBoxScoreLine {
  playerId: string
  atBats: number
  hits: number
  runs: number
  rbi: number
  strikeouts: number
  walks: number
}

export interface GameState {
  id: string
  awayRosterId: string
  homeRosterId: string
  inning: number
  half: 'top' | 'bottom'
  outs: number
  bases: BaseState
  awayScore: number
  homeScore: number
  lineScore: LineScoreInning[]
  awayBoxScore: TeamBoxScoreLine[]
  homeBoxScore: TeamBoxScoreLine[]
  awayPitcherOuts: number
  homePitcherOuts: number
  awayCurrentPitcherId: string | null
  homeCurrentPitcherId: string | null
  awayLineupOrder: string[]
  homeLineupOrder: string[]
  awayBattingIndex: number
  homeBattingIndex: number
  log: string[]
  status: 'in_progress' | 'final'
  createdAt: string
  updatedAt: string
}

export interface AtBatResult {
  outcome: AtBatOutcome
  pitcherTotal: number
  batterTotal: number
  diff: number
  hitType?: HitType
  fieldingLocation?: string
}
