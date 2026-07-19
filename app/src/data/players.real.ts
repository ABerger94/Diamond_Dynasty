import type { HitterStatLine, PitcherStatLine, Player, Position } from '../types/player'

/**
 * Real 2025-season data supplied by the user (players.csv, batting_stats.csv, pitching_stats.csv,
 * fielding_stats.csv, abilities.csv, diamond_dynasty_ratings.csv, card_database.csv — the
 * "Exhaustive MLB Database" workbook packages the same seven tables). Ratings are re-derived by
 * the percentile engine (src/lib/ratings.ts) from the raw stats below rather than importing the
 * precomputed ratings sheet directly, per the "re-derive from stats" decision — that keeps one
 * rating pipeline for every player, including future additions with no precomputed ratings.
 */

interface RawPlayer {
  id: string
  name: string
  team: string
  /** Position code as given: concrete slot, 'OF' (generic), 'SP'/'CP', or 'TW' (two-way). */
  position: string
  bats: string
  throws: string
}

const RAW_PLAYERS: RawPlayer[] = [
  { id: '660271', name: 'Shohei Ohtani', team: 'LAD', position: 'TW', bats: 'L', throws: 'R' },
  { id: '592450', name: 'Aaron Judge', team: 'NYY', position: 'OF', bats: 'R', throws: 'R' },
  { id: '665742', name: 'Juan Soto', team: 'NYY', position: 'OF', bats: 'L', throws: 'R' },
  { id: '605141', name: 'Mookie Betts', team: 'LAD', position: 'OF', bats: 'R', throws: 'R' },
  { id: '677951', name: 'Bobby Witt Jr.', team: 'KC', position: 'SS', bats: 'R', throws: 'R' },
  { id: '683002', name: 'Gunnar Henderson', team: 'BAL', position: 'SS', bats: 'L', throws: 'R' },
  { id: '660670', name: 'Ronald Acuña Jr.', team: 'ATL', position: 'OF', bats: 'R', throws: 'R' },
  { id: '668939', name: 'Adley Rutschman', team: 'BAL', position: 'C', bats: 'S', throws: 'R' },
  { id: '518692', name: 'Freddie Freeman', team: 'LAD', position: '1B', bats: 'L', throws: 'R' },
  { id: '543760', name: 'Marcus Semien', team: 'TEX', position: '2B', bats: 'R', throws: 'R' },
  { id: '608070', name: 'José Ramírez', team: 'CLE', position: '3B', bats: 'S', throws: 'R' },
  { id: '608369', name: 'Corey Seager', team: 'TEX', position: 'SS', bats: 'L', throws: 'R' },
  { id: '547180', name: 'Bryce Harper', team: 'PHI', position: '1B', bats: 'L', throws: 'R' },
  { id: '656941', name: 'Kyle Schwarber', team: 'PHI', position: 'DH', bats: 'L', throws: 'R' },
  { id: '650333', name: 'Luis Arraez', team: 'SD', position: '1B', bats: 'L', throws: 'R' },
  { id: '650402', name: 'Elly De La Cruz', team: 'CIN', position: 'SS', bats: 'S', throws: 'R' },
  { id: '682998', name: 'Corbin Carroll', team: 'ARI', position: 'OF', bats: 'L', throws: 'L' },
  { id: '664058', name: 'Christopher Morel', team: 'TB', position: '3B', bats: 'R', throws: 'R' },
  { id: '605155', name: 'Alex Bregman', team: 'HOU', position: '3B', bats: 'R', throws: 'R' },
  { id: '622110', name: 'Christian Walker', team: 'ARI', position: '1B', bats: 'R', throws: 'R' },
  { id: '665926', name: 'Andrés Giménez', team: 'CLE', position: '2B', bats: 'L', throws: 'R' },
  { id: '656305', name: 'Matt Chapman', team: 'SF', position: '3B', bats: 'R', throws: 'R' },
  { id: '624413', name: 'Pete Alonso', team: 'NYM', position: '1B', bats: 'R', throws: 'R' },
  { id: '669203', name: 'Corbin Burnes', team: 'BAL', position: 'SP', bats: 'R', throws: 'R' },
  { id: '543037', name: 'Gerrit Cole', team: 'NYY', position: 'SP', bats: 'R', throws: 'R' },
  { id: '554430', name: 'Zack Wheeler', team: 'PHI', position: 'SP', bats: 'L', throws: 'R' },
  { id: '669373', name: 'Tarik Skubal', team: 'DET', position: 'SP', bats: 'L', throws: 'L' },
  { id: '657097', name: 'Logan Webb', team: 'SF', position: 'SP', bats: 'R', throws: 'R' },
  { id: '656302', name: 'Dylan Cease', team: 'SD', position: 'SP', bats: 'R', throws: 'R' },
  { id: '661403', name: 'Framber Valdez', team: 'HOU', position: 'SP', bats: 'L', throws: 'L' },
  { id: '624564', name: 'Emmanuel Clase', team: 'CLE', position: 'CP', bats: 'R', throws: 'R' },
  { id: '623352', name: 'Josh Hader', team: 'HOU', position: 'CP', bats: 'L', throws: 'L' },
  { id: '605204', name: 'Edwin Díaz', team: 'NYM', position: 'CP', bats: 'R', throws: 'R' },
  { id: '664875', name: 'Ryan Helsley', team: 'STL', position: 'CP', bats: 'R', throws: 'R' },
  { id: '688335', name: 'Mason Miller', team: 'OAK', position: 'CP', bats: 'R', throws: 'R' },
]

/** Player ID -> fielding_stats.csv "Primary Position" (the concrete slot for hitters; 'P' for pitchers). */
const FIELDING_PRIMARY_POSITION: Record<string, string> = {
  '660271': 'DH',
  '592450': 'OF',
  '665742': 'OF',
  '605141': 'OF',
  '677951': 'SS',
  '683002': 'SS',
  '660670': 'OF',
  '668939': 'C',
  '518692': '1B',
  '543760': '2B',
  '608070': '3B',
  '608369': 'SS',
  '547180': '1B',
  '656941': 'DH',
  '650333': '1B',
  '650402': 'SS',
  '682998': 'OF',
  '664058': '3B',
  '605155': '3B',
  '622110': '1B',
  '665926': '2B',
  '656305': '3B',
  '624413': '1B',
}

/** Player ID -> [Games at Position, Errors, Fielding%, DRS, OAA, dWAR]; DRS feeds fieldingRunsAboveAvg. */
const FIELDING_STATS: Record<string, { drs: number }> = {
  '660271': { drs: 0 },
  '592450': { drs: 2 },
  '665742': { drs: -4 },
  '605141': { drs: 4 },
  '677951': { drs: 12 },
  '683002': { drs: 8 },
  '660670': { drs: 1 },
  '668939': { drs: 7 },
  '518692': { drs: 2 },
  '543760': { drs: 6 },
  '608070': { drs: 5 },
  '608369': { drs: 2 },
  '547180': { drs: 3 },
  '656941': { drs: 0 },
  '650333': { drs: -2 },
  '650402': { drs: 4 },
  '682998': { drs: 1 },
  '664058': { drs: -6 },
  '605155': { drs: 4 },
  '622110': { drs: 14 },
  '665926': { drs: 15 },
  '656305': { drs: 11 },
  '624413': { drs: 3 },
}

const BATTING_STATS: Record<string, HitterStatLine> = {
  '660271': hitter(731, 636, 197, 38, 7, 54, 81, 162, 59, 4, 190),
  '592450': hitter(704, 559, 180, 36, 1, 58, 133, 171, 10, 0, 223),
  '665742': hitter(713, 563, 162, 31, 4, 41, 129, 119, 7, 4, 178),
  '605141': hitter(514, 450, 130, 24, 5, 19, 54, 57, 16, 2, 141),
  '677951': hitter(709, 636, 211, 45, 11, 32, 53, 106, 31, 5, 168),
  '683002': hitter(719, 606, 170, 31, 7, 37, 78, 159, 21, 4, 155),
  '660670': hitter(221, 192, 48, 8, 1, 4, 27, 46, 16, 1, 102),
  '668939': hitter(642, 556, 139, 21, 1, 19, 74, 93, 1, 1, 109),
  '518692': hitter(637, 542, 153, 35, 2, 22, 78, 102, 9, 3, 138),
  '543760': hitter(712, 642, 155, 27, 2, 23, 64, 131, 7, 1, 96),
  '608070': hitter(682, 607, 169, 39, 2, 39, 54, 82, 41, 5, 143),
  '608369': hitter(533, 484, 135, 21, 0, 30, 45, 95, 1, 0, 137),
  '547180': hitter(628, 550, 157, 42, 0, 30, 72, 138, 7, 3, 149),
  '656941': hitter(692, 573, 142, 22, 0, 38, 114, 197, 5, 1, 136),
  '650333': hitter(677, 633, 200, 32, 0, 4, 38, 29, 9, 4, 112),
  '650402': hitter(705, 627, 162, 36, 7, 25, 70, 218, 67, 12, 117),
  '682998': hitter(680, 595, 137, 22, 14, 22, 73, 147, 35, 6, 108),
  '664058': hitter(560, 498, 109, 13, 3, 21, 51, 172, 8, 3, 91),
  '605155': hitter(620, 532, 138, 28, 2, 26, 78, 81, 3, 1, 126),
  '622110': hitter(550, 494, 124, 24, 1, 26, 49, 133, 2, 0, 119),
  '665926': hitter(640, 565, 142, 22, 5, 14, 42, 115, 30, 4, 101),
  '656305': hitter(645, 570, 141, 38, 1, 27, 66, 165, 2, 1, 121),
  '624413': hitter(675, 597, 143, 31, 0, 34, 65, 172, 3, 1, 119),
}

/** [Season IP as printed (e.g. 194.1 = 194 2/3... actually .1/.2 are thirds), Games, K, BB, H, HR, ERA, Saves, AvgFBVelo, SwStr%] */
const PITCHING_STATS: Record<string, PitcherStatLine> = {
  '660271': pitcher(162.0, 28, 186, 45, 130, 18, 3.14, 0, 96.8, 14.2),
  '669203': pitcher(194.1, 32, 181, 48, 165, 22, 2.92, 0, 95.3, 12.1),
  '543037': pitcher(168.1, 29, 175, 45, 146, 21, 3.41, 0, 95.9, 11.9),
  '554430': pitcher(200.0, 32, 224, 37, 155, 15, 2.57, 0, 95.1, 13.5),
  '669373': pitcher(192.1, 31, 228, 35, 142, 15, 2.39, 0, 96.2, 15.1),
  '657097': pitcher(213.2, 33, 172, 50, 212, 12, 3.47, 0, 92.4, 10.5),
  '656302': pitcher(189.1, 33, 220, 60, 142, 18, 3.47, 0, 96.8, 15.3),
  '661403': pitcher(176.1, 28, 166, 55, 141, 14, 3.06, 0, 92.1, 11.2),
  '624564': pitcher(74.1, 74, 66, 10, 39, 2, 0.61, 47, 99.5, 16.5),
  '623352': pitcher(71.0, 71, 105, 31, 57, 12, 3.8, 34, 96.0, 16.2),
  '605204': pitcher(61.1, 64, 84, 24, 41, 9, 3.52, 20, 97.5, 17.1),
  '664875': pitcher(66.1, 65, 79, 23, 50, 4, 2.04, 49, 99.6, 13.8),
  '688335': pitcher(65.0, 56, 104, 17, 40, 5, 2.49, 28, 100.9, 18.2),
}

const ABILITIES: Record<string, string[]> = {
  '660271': ['Two-Way Phenom'],
  '592450': ['Bronx Bomber'],
  '665742': ['Soto Shuffle'],
  '650333': ['Contact Machine'],
  '650402': ['Electric Speed'],
  '624564': ['Dragon Cutter'],
}

/** Builds a HitterStatLine from batting_stats.csv's counting stats plus OPS+ for the Clutch
 * fallback (no RISP split was provided in the source data). */
function hitter(
  pa: number,
  ab: number,
  hits: number,
  doubles: number,
  triples: number,
  hr: number,
  bb: number,
  so: number,
  sb: number,
  cs: number,
  opsPlus: number,
): HitterStatLine {
  return {
    plateAppearances: pa,
    atBats: ab,
    hits,
    doubles,
    triples,
    homeRuns: hr,
    walks: bb,
    strikeouts: so,
    stolenBases: sb,
    caughtStealing: cs,
    opsPlus,
    fieldingRunsAboveAvg: 0, // overwritten from FIELDING_STATS below
  }
}

/** Converts baseball's thirds-of-an-inning notation (194.1 = 194 IP + 1 out) to total outs. */
function inningsToOuts(ip: number): number {
  const whole = Math.trunc(ip)
  const thirds = Math.round((ip - whole) * 10)
  return whole * 3 + thirds
}

function pitcher(
  ip: number,
  games: number,
  strikeouts: number,
  walks: number,
  hits: number,
  homeRuns: number,
  era: number,
  saves: number,
  avgFastballVeloMph: number,
  swingingStrikePct: number,
): PitcherStatLine {
  const outsRecorded = inningsToOuts(ip)
  return {
    outsRecorded,
    appearances: games,
    // Not in the source data; standard approximation (outs + baserunners allowed via hits/walks).
    battersFaced: outsRecorded + hits + walks,
    strikeouts,
    walks,
    hits,
    homeRuns,
    avgFastballVeloMph,
    era,
    saves,
    // No GB% column in the source; swinging-strike% stands in for Movement instead.
    groundBallRate: swingingStrikePct / 100,
  }
}

export const SEED_PLAYERS: Player[] = RAW_PLAYERS.map((raw): Player => {
  const battingStats = BATTING_STATS[raw.id]
  const pitchingStats = PITCHING_STATS[raw.id]
  const isTwoWay = raw.position === 'TW'

  const hitterStats = battingStats ? { ...battingStats, fieldingRunsAboveAvg: FIELDING_STATS[raw.id]?.drs ?? 0 } : undefined

  let primaryPosition: Position
  let pitcherPosition: 'SP' | 'RP' | undefined
  let rosterTag: string | undefined

  if (isTwoWay) {
    primaryPosition = (FIELDING_PRIMARY_POSITION[raw.id] as Position) ?? 'DH'
    pitcherPosition = 'SP'
    rosterTag = 'Two-Way'
  } else if (pitchingStats) {
    pitcherPosition = raw.position === 'CP' ? 'RP' : 'SP'
    primaryPosition = pitcherPosition
    rosterTag = raw.position === 'CP' ? 'Closer' : undefined
  } else {
    primaryPosition = (FIELDING_PRIMARY_POSITION[raw.id] as Position) ?? (raw.position as Position)
  }

  return {
    id: raw.id,
    name: raw.name,
    primaryPosition,
    pitcherPosition,
    team: raw.team,
    throwsBats: `${raw.bats}/${raw.throws}`,
    season: 2025,
    hitterStats,
    pitcherStats: pitchingStats,
    rosterTag,
    abilities: ABILITIES[raw.id],
  }
})
