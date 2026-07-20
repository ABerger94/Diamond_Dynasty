export type TeamSide = 'home' | 'away'

/** Away = red, Home = blue, used consistently across the Scorecard page. */
export const TEAM_ACCENT: Record<TeamSide, { border: string; bg: string; label: string; text: string; header: string; selectedBg: string; selectedText: string }> = {
  away: {
    border: 'border-red-900',
    bg: 'bg-red-950/20',
    label: 'text-red-400',
    text: 'text-red-400',
    header: 'text-red-300',
    selectedBg: 'bg-red-500/20',
    selectedText: 'text-red-300',
  },
  home: {
    border: 'border-sky-900',
    bg: 'bg-sky-950/20',
    label: 'text-sky-400',
    text: 'text-sky-400',
    header: 'text-sky-300',
    selectedBg: 'bg-sky-500/20',
    selectedText: 'text-sky-300',
  },
}
