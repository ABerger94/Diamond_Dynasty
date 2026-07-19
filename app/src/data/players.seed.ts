import type { HitterStatLine, PitcherStatLine, Player, Position } from '../types/player'

/**
 * SEED / DEMO DATA — illustrative stat lines only, not sourced from an official feed.
 * Replace/extend this file once real season data is imported (see docs/RULEBOOK.md §10 roadmap
 * and the Companion App feature list in the original design doc: "imports from MLB/statistical
 * databases"). Values are chosen to be roughly plausible for each player's real-world profile so
 * the ratings engine produces sensible relative results, not to be historically exact.
 */

function hitter(overrides: Partial<HitterStatLine> = {}): HitterStatLine {
  return {
    plateAppearances: 600,
    atBats: 540,
    hits: 140,
    doubles: 27,
    triples: 2,
    homeRuns: 20,
    walks: 50,
    strikeouts: 130,
    stolenBases: 8,
    caughtStealing: 3,
    sprintSpeedFtPerSec: 27.0,
    avgWithRisp: 0.26,
    fieldingRunsAboveAvg: 0,
    ...overrides,
  }
}

function pitcher(overrides: Partial<PitcherStatLine> = {}): PitcherStatLine {
  return {
    outsRecorded: 550,
    appearances: 30,
    battersFaced: 700,
    strikeouts: 180,
    walks: 55,
    hits: 160,
    homeRuns: 22,
    avgFastballVeloMph: 94.0,
    eraCloseAndLate: 4.0,
    groundBallRate: 0.43,
    ...overrides,
  }
}

let counter = 0
function id(): string {
  counter += 1
  return `p${counter}`
}

interface SeedHitter {
  name: string
  pos: Position
  team: string
  bats: string
  season: number
  stats: HitterStatLine
}

interface SeedPitcher {
  name: string
  pos: Position
  team: string
  throws: string
  season: number
  stats: PitcherStatLine
}

const SEASON = 2024

const seedHitters: SeedHitter[] = [
  // Catchers
  { name: 'Adley Rutschman', pos: 'C', team: 'BAL', bats: 'S', season: SEASON, stats: hitter({ hits: 140, doubles: 30, homeRuns: 15, walks: 65, strikeouts: 95, sprintSpeedFtPerSec: 26.5, fieldingRunsAboveAvg: 8 }) },
  { name: 'Salvador Perez', pos: 'C', team: 'KC', bats: 'R', season: SEASON, stats: hitter({ atBats: 520, hits: 138, homeRuns: 27, walks: 25, strikeouts: 105, sprintSpeedFtPerSec: 24.0, fieldingRunsAboveAvg: 5 }) },
  { name: 'Will Smith', pos: 'C', team: 'LAD', bats: 'R', season: SEASON, stats: hitter({ atBats: 480, hits: 130, doubles: 24, homeRuns: 18, walks: 55, strikeouts: 85, avgWithRisp: 0.29, fieldingRunsAboveAvg: 6 }) },
  { name: 'J.T. Realmuto', pos: 'C', team: 'PHI', bats: 'R', season: SEASON, stats: hitter({ atBats: 460, hits: 118, homeRuns: 14, stolenBases: 12, caughtStealing: 3, sprintSpeedFtPerSec: 27.8, fieldingRunsAboveAvg: 10 }) },

  // First base
  { name: 'Freddie Freeman', pos: '1B', team: 'LAD', bats: 'L', season: SEASON, stats: hitter({ hits: 197, doubles: 40, homeRuns: 22, walks: 70, strikeouts: 90, avgWithRisp: 0.32, fieldingRunsAboveAvg: 4 }) },
  { name: 'Pete Alonso', pos: '1B', team: 'NYM', bats: 'R', season: SEASON, stats: hitter({ hits: 150, homeRuns: 34, walks: 65, strikeouts: 130, fieldingRunsAboveAvg: 1 }) },
  { name: 'Matt Olson', pos: '1B', team: 'ATL', bats: 'L', season: SEASON, stats: hitter({ hits: 145, homeRuns: 29, walks: 75, strikeouts: 140, fieldingRunsAboveAvg: 7 }) },
  { name: 'Vladimir Guerrero Jr.', pos: '1B', team: 'TOR', bats: 'R', season: SEASON, stats: hitter({ hits: 168, doubles: 32, homeRuns: 30, walks: 60, strikeouts: 90, avgWithRisp: 0.31, fieldingRunsAboveAvg: -2 }) },

  // Second base
  { name: 'Marcus Semien', pos: '2B', team: 'TEX', bats: 'R', season: SEASON, stats: hitter({ plateAppearances: 700, atBats: 640, hits: 155, doubles: 30, homeRuns: 22, stolenBases: 14, sprintSpeedFtPerSec: 27.6, fieldingRunsAboveAvg: 9 }) },
  { name: 'Jose Altuve', pos: '2B', team: 'HOU', bats: 'R', season: SEASON, stats: hitter({ hits: 158, doubles: 28, homeRuns: 20, stolenBases: 18, sprintSpeedFtPerSec: 27.0, avgWithRisp: 0.29, fieldingRunsAboveAvg: 3 }) },
  { name: 'Ozzie Albies', pos: '2B', team: 'ATL', bats: 'S', season: SEASON, stats: hitter({ hits: 150, doubles: 33, homeRuns: 18, stolenBases: 10, sprintSpeedFtPerSec: 28.1, fieldingRunsAboveAvg: 6 }) },
  { name: 'Luis Arraez', pos: '2B', team: 'SD', bats: 'L', season: SEASON, stats: hitter({ atBats: 550, hits: 190, doubles: 25, triples: 2, homeRuns: 6, walks: 35, strikeouts: 35, stolenBases: 5, caughtStealing: 2, sprintSpeedFtPerSec: 26.0, avgWithRisp: 0.33, fieldingRunsAboveAvg: -3 }) },

  // Third base
  { name: 'Jose Ramirez', pos: '3B', team: 'CLE', bats: 'S', season: SEASON, stats: hitter({ hits: 168, doubles: 30, homeRuns: 36, walks: 65, strikeouts: 80, stolenBases: 40, caughtStealing: 5, sprintSpeedFtPerSec: 28.3, avgWithRisp: 0.31, fieldingRunsAboveAvg: 8 }) },
  { name: 'Manny Machado', pos: '3B', team: 'SD', bats: 'R', season: SEASON, stats: hitter({ hits: 155, homeRuns: 29, walks: 45, strikeouts: 100, fieldingRunsAboveAvg: 5 }) },
  { name: 'Austin Riley', pos: '3B', team: 'ATL', bats: 'R', season: SEASON, stats: hitter({ hits: 148, doubles: 32, homeRuns: 28, walks: 50, strikeouts: 135, fieldingRunsAboveAvg: 2 }) },
  { name: 'Nolan Arenado', pos: '3B', team: 'STL', bats: 'R', season: SEASON, stats: hitter({ hits: 140, homeRuns: 20, walks: 40, strikeouts: 90, fieldingRunsAboveAvg: 12 }) },

  // Shortstop
  { name: 'Francisco Lindor', pos: 'SS', team: 'NYM', bats: 'S', season: SEASON, stats: hitter({ plateAppearances: 690, atBats: 630, hits: 165, doubles: 34, homeRuns: 33, stolenBases: 29, walks: 60, sprintSpeedFtPerSec: 28.0, avgWithRisp: 0.28, fieldingRunsAboveAvg: 9 }) },
  { name: 'Bobby Witt Jr.', pos: 'SS', team: 'KC', bats: 'R', season: SEASON, stats: hitter({ hits: 211, doubles: 45, homeRuns: 32, stolenBases: 31, walks: 45, strikeouts: 100, sprintSpeedFtPerSec: 29.5, avgWithRisp: 0.33, fieldingRunsAboveAvg: 10 }) },
  { name: 'Trea Turner', pos: 'SS', team: 'PHI', bats: 'R', season: SEASON, stats: hitter({ hits: 175, homeRuns: 15, stolenBases: 30, sprintSpeedFtPerSec: 29.2, fieldingRunsAboveAvg: 4 }) },
  { name: 'Corey Seager', pos: 'SS', team: 'TEX', bats: 'L', season: SEASON, stats: hitter({ atBats: 490, hits: 145, doubles: 35, homeRuns: 30, walks: 55, avgWithRisp: 0.3, fieldingRunsAboveAvg: 1 }) },

  // Left field
  { name: 'Kyle Schwarber', pos: 'LF', team: 'PHI', bats: 'L', season: SEASON, stats: hitter({ hits: 130, homeRuns: 38, walks: 100, strikeouts: 200, sprintSpeedFtPerSec: 25.5, fieldingRunsAboveAvg: -6 }) },
  { name: 'Juan Soto', pos: 'LF', team: 'NYY', bats: 'L', season: SEASON, stats: hitter({ hits: 166, doubles: 31, homeRuns: 41, walks: 129, strikeouts: 118, avgWithRisp: 0.32, fieldingRunsAboveAvg: -1 }) },
  { name: 'Ian Happ', pos: 'LF', team: 'CHC', bats: 'S', season: SEASON, stats: hitter({ hits: 140, homeRuns: 25, walks: 70, strikeouts: 145, fieldingRunsAboveAvg: 3 }) },
  { name: 'Randy Arozarena', pos: 'LF', team: 'SEA', bats: 'R', season: SEASON, stats: hitter({ hits: 135, homeRuns: 20, stolenBases: 22, sprintSpeedFtPerSec: 28.6, fieldingRunsAboveAvg: 0 }) },
  { name: 'Joey Gallo', pos: 'LF', team: 'WSH', bats: 'L', season: SEASON, stats: hitter({ atBats: 350, hits: 70, doubles: 12, homeRuns: 25, walks: 70, strikeouts: 160, sprintSpeedFtPerSec: 27.2, avgWithRisp: 0.19, fieldingRunsAboveAvg: 3 }) },

  // Center field
  { name: 'Julio Rodriguez', pos: 'CF', team: 'SEA', bats: 'R', season: SEASON, stats: hitter({ hits: 160, doubles: 28, homeRuns: 32, stolenBases: 30, sprintSpeedFtPerSec: 29.0, avgWithRisp: 0.29, fieldingRunsAboveAvg: 6 }) },
  { name: 'Mike Trout', pos: 'CF', team: 'LAA', bats: 'R', season: SEASON, stats: hitter({ atBats: 300, hits: 80, homeRuns: 20, walks: 45, strikeouts: 75, sprintSpeedFtPerSec: 27.5, fieldingRunsAboveAvg: 4 }) },
  { name: 'Byron Buxton', pos: 'CF', team: 'MIN', bats: 'R', season: SEASON, stats: hitter({ atBats: 400, hits: 105, homeRuns: 22, stolenBases: 20, sprintSpeedFtPerSec: 30.1, fieldingRunsAboveAvg: 14 }) },
  { name: 'Cody Bellinger', pos: 'CF', team: 'CHC', bats: 'L', season: SEASON, stats: hitter({ hits: 145, homeRuns: 18, stolenBases: 13, sprintSpeedFtPerSec: 28.2, fieldingRunsAboveAvg: 5 }) },

  // Right field
  { name: 'Aaron Judge', pos: 'RF', team: 'NYY', bats: 'R', season: SEASON, stats: hitter({ atBats: 550, hits: 160, doubles: 20, homeRuns: 55, walks: 110, strikeouts: 170, sprintSpeedFtPerSec: 27.5, avgWithRisp: 0.31, fieldingRunsAboveAvg: 5 }) },
  { name: 'Ronald Acuna Jr.', pos: 'RF', team: 'ATL', bats: 'R', season: SEASON, stats: hitter({ hits: 175, homeRuns: 30, stolenBases: 45, walks: 65, sprintSpeedFtPerSec: 29.8, avgWithRisp: 0.3, fieldingRunsAboveAvg: 3 }) },
  { name: 'Mookie Betts', pos: 'RF', team: 'LAD', bats: 'R', season: SEASON, stats: hitter({ hits: 150, doubles: 30, homeRuns: 26, walks: 70, strikeouts: 70, stolenBases: 12, sprintSpeedFtPerSec: 27.8, avgWithRisp: 0.29, fieldingRunsAboveAvg: 11 }) },
  { name: 'Kyle Tucker', pos: 'RF', team: 'HOU', bats: 'L', season: SEASON, stats: hitter({ hits: 155, homeRuns: 30, stolenBases: 23, walks: 65, sprintSpeedFtPerSec: 28.0, avgWithRisp: 0.31, fieldingRunsAboveAvg: 6 }) },
  { name: 'Juan Pierre', pos: 'RF', team: 'LAD', bats: 'L', season: 2004, stats: hitter({ plateAppearances: 748, atBats: 678, hits: 187, doubles: 15, triples: 8, homeRuns: 1, walks: 44, strikeouts: 47, stolenBases: 45, caughtStealing: 12, sprintSpeedFtPerSec: 30.4, avgWithRisp: 0.27, fieldingRunsAboveAvg: 2 }) },

  // Designated hitter
  { name: 'Shohei Ohtani', pos: 'DH', team: 'LAD', bats: 'L', season: SEASON, stats: hitter({ hits: 197, doubles: 38, homeRuns: 54, walks: 81, strikeouts: 162, stolenBases: 59, caughtStealing: 4, sprintSpeedFtPerSec: 28.9, avgWithRisp: 0.33, fieldingRunsAboveAvg: 0 }) },
  { name: 'Yordan Alvarez', pos: 'DH', team: 'HOU', bats: 'L', season: SEASON, stats: hitter({ atBats: 460, hits: 140, homeRuns: 35, walks: 55, strikeouts: 95, sprintSpeedFtPerSec: 25.0, avgWithRisp: 0.32, fieldingRunsAboveAvg: -2 }) },
  { name: 'Marcell Ozuna', pos: 'DH', team: 'ATL', bats: 'R', season: SEASON, stats: hitter({ hits: 150, homeRuns: 39, walks: 70, strikeouts: 145, sprintSpeedFtPerSec: 24.5, fieldingRunsAboveAvg: -8 }) },
  { name: 'J.D. Martinez', pos: 'DH', team: 'NYM', bats: 'R', season: SEASON, stats: hitter({ atBats: 430, hits: 110, homeRuns: 16, walks: 40, strikeouts: 120, sprintSpeedFtPerSec: 24.0, fieldingRunsAboveAvg: -5 }) },

  // Historical speed reference (per user-provided rating example)
  { name: 'Rickey Henderson', pos: 'LF', team: 'OAK', bats: 'R', season: 1990, stats: hitter({ plateAppearances: 594, atBats: 489, hits: 159, doubles: 33, triples: 3, homeRuns: 28, walks: 97, strikeouts: 60, stolenBases: 65, caughtStealing: 10, sprintSpeedFtPerSec: 30.8, avgWithRisp: 0.29, fieldingRunsAboveAvg: 4 }) },
]

const seedPitchers: SeedPitcher[] = [
  // Starting pitchers
  { name: 'Paul Skenes', pos: 'SP', team: 'PIT', throws: 'R', season: SEASON, stats: pitcher({ outsRecorded: 460, appearances: 23, battersFaced: 590, strikeouts: 170, walks: 40, homeRuns: 12, avgFastballVeloMph: 98.5, eraCloseAndLate: 2.1, groundBallRate: 0.52 }) },
  { name: 'Gerrit Cole', pos: 'SP', team: 'NYY', throws: 'R', season: SEASON, stats: pitcher({ outsRecorded: 600, appearances: 32, battersFaced: 820, strikeouts: 220, walks: 45, homeRuns: 20, avgFastballVeloMph: 97.0, eraCloseAndLate: 2.8, groundBallRate: 0.42 }) },
  { name: 'Zack Wheeler', pos: 'SP', team: 'PHI', throws: 'R', season: SEASON, stats: pitcher({ outsRecorded: 620, appearances: 32, battersFaced: 830, strikeouts: 224, walks: 42, homeRuns: 16, avgFastballVeloMph: 96.5, eraCloseAndLate: 2.6, groundBallRate: 0.44 }) },
  { name: 'Spencer Strider', pos: 'SP', team: 'ATL', throws: 'R', season: SEASON, stats: pitcher({ outsRecorded: 580, appearances: 30, battersFaced: 780, strikeouts: 260, walks: 55, homeRuns: 22, avgFastballVeloMph: 97.8, eraCloseAndLate: 3.0, groundBallRate: 0.36 }) },
  { name: 'Corbin Burnes', pos: 'SP', team: 'BAL', throws: 'R', season: SEASON, stats: pitcher({ outsRecorded: 610, appearances: 32, battersFaced: 810, strikeouts: 200, walks: 38, homeRuns: 18, avgFastballVeloMph: 95.5, eraCloseAndLate: 2.9, groundBallRate: 0.5 }) },
  { name: 'Tarik Skubal', pos: 'SP', team: 'DET', throws: 'L', season: SEASON, stats: pitcher({ outsRecorded: 610, appearances: 31, battersFaced: 800, strikeouts: 230, walks: 30, homeRuns: 14, avgFastballVeloMph: 96.0, eraCloseAndLate: 2.0, groundBallRate: 0.46 }) },
  { name: 'Logan Webb', pos: 'SP', team: 'SF', throws: 'R', season: SEASON, stats: pitcher({ outsRecorded: 630, appearances: 33, battersFaced: 840, strikeouts: 190, walks: 40, homeRuns: 15, avgFastballVeloMph: 93.5, eraCloseAndLate: 3.1, groundBallRate: 0.55 }) },
  { name: 'Framber Valdez', pos: 'SP', team: 'HOU', throws: 'L', season: SEASON, stats: pitcher({ outsRecorded: 600, appearances: 31, battersFaced: 790, strikeouts: 175, walks: 55, homeRuns: 14, avgFastballVeloMph: 95.0, eraCloseAndLate: 3.3, groundBallRate: 0.6 }) },
  { name: 'Dylan Cease', pos: 'SP', team: 'SD', throws: 'R', season: SEASON, stats: pitcher({ outsRecorded: 590, appearances: 31, battersFaced: 800, strikeouts: 220, walks: 65, homeRuns: 20, avgFastballVeloMph: 96.8, eraCloseAndLate: 3.4, groundBallRate: 0.4 }) },
  { name: 'Chris Sale', pos: 'SP', team: 'ATL', throws: 'L', season: SEASON, stats: pitcher({ outsRecorded: 570, appearances: 29, battersFaced: 750, strikeouts: 225, walks: 40, homeRuns: 17, avgFastballVeloMph: 94.5, eraCloseAndLate: 2.5, groundBallRate: 0.41 }) },

  // Relief pitchers
  { name: 'Josh Hader', pos: 'RP', team: 'HOU', throws: 'L', season: SEASON, stats: pitcher({ outsRecorded: 190, appearances: 62, battersFaced: 260, strikeouts: 90, walks: 30, homeRuns: 5, avgFastballVeloMph: 96.5, eraCloseAndLate: 2.4, groundBallRate: 0.35 }) },
  { name: 'Emmanuel Clase', pos: 'RP', team: 'CLE', throws: 'R', season: SEASON, stats: pitcher({ outsRecorded: 210, appearances: 68, battersFaced: 270, strikeouts: 65, walks: 12, homeRuns: 2, avgFastballVeloMph: 99.5, eraCloseAndLate: 1.5, groundBallRate: 0.58 }) },
  { name: 'Devin Williams', pos: 'RP', team: 'NYY', throws: 'R', season: SEASON, stats: pitcher({ outsRecorded: 170, appearances: 55, battersFaced: 230, strikeouts: 95, walks: 25, homeRuns: 3, avgFastballVeloMph: 95.0, eraCloseAndLate: 2.0, groundBallRate: 0.4 }) },
  { name: 'Edwin Diaz', pos: 'RP', team: 'NYM', throws: 'R', season: SEASON, stats: pitcher({ outsRecorded: 195, appearances: 65, battersFaced: 260, strikeouts: 100, walks: 28, homeRuns: 6, avgFastballVeloMph: 98.0, eraCloseAndLate: 2.6, groundBallRate: 0.38 }) },
  { name: 'Ryan Helsley', pos: 'RP', team: 'STL', throws: 'R', season: SEASON, stats: pitcher({ outsRecorded: 200, appearances: 63, battersFaced: 265, strikeouts: 88, walks: 22, homeRuns: 4, avgFastballVeloMph: 99.0, eraCloseAndLate: 2.2, groundBallRate: 0.48 }) },
  { name: 'Mason Miller', pos: 'RP', team: 'ATH', throws: 'R', season: SEASON, stats: pitcher({ outsRecorded: 150, appearances: 50, battersFaced: 200, strikeouts: 100, walks: 30, homeRuns: 5, avgFastballVeloMph: 100.2, eraCloseAndLate: 2.3, groundBallRate: 0.37 }) },
  { name: 'Camilo Doval', pos: 'RP', team: 'SF', throws: 'R', season: SEASON, stats: pitcher({ outsRecorded: 190, appearances: 64, battersFaced: 255, strikeouts: 75, walks: 32, homeRuns: 6, avgFastballVeloMph: 97.5, eraCloseAndLate: 3.3, groundBallRate: 0.45 }) },
  { name: 'Felix Bautista', pos: 'RP', team: 'BAL', throws: 'R', season: 2023, stats: pitcher({ outsRecorded: 210, appearances: 68, battersFaced: 275, strikeouts: 110, walks: 26, homeRuns: 4, avgFastballVeloMph: 99.8, eraCloseAndLate: 1.8, groundBallRate: 0.4 }) },
]

export const SEED_PLAYERS: Player[] = [
  ...seedHitters.map(
    (h): Player => ({
      id: id(),
      name: h.name,
      primaryPosition: h.pos,
      team: h.team,
      throwsBats: h.bats,
      isPitcher: false,
      season: h.season,
      hitterStats: h.stats,
    }),
  ),
  ...seedPitchers.map(
    (p): Player => ({
      id: id(),
      name: p.name,
      primaryPosition: p.pos,
      team: p.team,
      throwsBats: p.throws,
      isPitcher: true,
      season: p.season,
      pitcherStats: p.stats,
    }),
  ),
]
