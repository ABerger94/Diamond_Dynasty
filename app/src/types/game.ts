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
  | 'doublePlay'
  | 'walk'
  | 'intentionalWalk'
  | 'error'
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
  /** Null for a "quick play" side with no saved roster — see awayTeamName/homeTeamName below. */
  awayRosterId: string | null
  homeRosterId: string | null
  /** Display name for a side. Always set — mirrors the roster's name when one is selected, or a
   * manager-entered name for quick play, so the UI never needs a roster lookup just to show
   * "who's up." */
  awayTeamName: string
  homeTeamName: string
  /** Regulation length chosen before the game started (Rulebook §4) — 3, 6, or 9. Extra innings
   * past this still follow the normal tie-breaking rules (§9), just starting from a shorter base. */
  regulationInnings: number
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
