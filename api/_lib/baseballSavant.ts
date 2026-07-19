/**
 * Statcast metrics from Baseball Savant (baseballsavant.mlb.com — also run by MLB, same as the
 * Stats API), filling the gap the free MLB Stats API leaves: Sprint Speed, Outs Above Average,
 * and average fastball velocity.
 *
 * IMPORTANT — HIGHER UNCERTAINTY than mlbStatsApi.ts: Baseball Savant's leaderboard URLs and CSV
 * column names are far less consistently documented than the official Stats API, and this is
 * just as unverified against the live site (blocked from this dev sandbox — see repo root
 * vercel.json/README). To reduce the blast radius of guessing wrong, every lookup here:
 *   1. Parses CSV by fuzzy column-name matching (substring search) rather than fixed column
 *      indices or exact names, so minor naming differences don't silently break it.
 *   2. Returns `null`/omits the metric rather than a fabricated value when a column can't be
 *      found, and every call site treats that as "unavailable" (ratings already have a fallback
 *      for missing Speed/Fielding/Velocity inputs — src/lib/ratings/reference.ts).
 *   3. Is wrapped in try/catch by the caller (api/players/[id].ts) so a Savant failure never
 *      breaks the base MLB Stats API response.
 * If this comes back empty or wrong after a real deploy, log the raw CSV header row first —
 * that's almost certainly where the mismatch is.
 */

const BASE = 'https://baseballsavant.mlb.com'

/** Minimal CSV parser: handles quoted fields containing commas, not much else. Savant's exports
 * are simple enough (no embedded newlines in fields) that this is sufficient. */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const splitLine = (line: string): string[] => {
    const cells: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') inQuotes = !inQuotes
      else if (ch === ',' && !inQuotes) {
        cells.push(cur)
        cur = ''
      } else cur += ch
    }
    cells.push(cur)
    return cells
  }
  const header = splitLine(lines[0]).map((h) => h.trim().toLowerCase())
  return lines.slice(1).map((line) => {
    const cells = splitLine(line)
    const row: Record<string, string> = {}
    header.forEach((h, i) => (row[h] = cells[i] ?? ''))
    return row
  })
}

/** First column name containing all of `needles` (case-insensitive substring match). */
function findColumn(header: string[], ...needles: string[]): string | null {
  return header.find((h) => needles.every((n) => h.includes(n))) ?? null
}

function findIdColumn(header: string[]): string | null {
  return findColumn(header, 'player_id') ?? findColumn(header, 'mlbam') ?? findColumn(header, 'id')
}

async function fetchCsv(path: string): Promise<Record<string, string>[]> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`Baseball Savant ${path} -> ${res.status}`)
  return parseCsv(await res.text())
}

/** Sprint speed (ft/sec) for a given season, keyed by MLBAM player id. */
export async function fetchSprintSpeed(year: number): Promise<Map<string, number>> {
  const rows = await fetchCsv(`/leaderboard/sprint_speed?year=${year}&position=&team=&min=0&csv=true`)
  const result = new Map<string, number>()
  if (rows.length === 0) return result
  const header = Object.keys(rows[0])
  const idCol = findIdColumn(header)
  const speedCol = findColumn(header, 'sprint', 'speed')
  if (!idCol || !speedCol) return result
  for (const row of rows) {
    const id = row[idCol]
    const speed = parseFloat(row[speedCol])
    if (id && !Number.isNaN(speed)) result.set(id, speed)
  }
  return result
}

/** Outs Above Average for a given season, keyed by MLBAM player id. */
export async function fetchOutsAboveAverage(year: number): Promise<Map<string, number>> {
  const rows = await fetchCsv(
    `/leaderboard/outs_above_average?type=Fielder&startYear=${year}&endYear=${year}&split=no&team=&range=year&min=1&pos=&roles=&viz=hide&csv=true`,
  )
  const result = new Map<string, number>()
  if (rows.length === 0) return result
  const header = Object.keys(rows[0])
  const idCol = findIdColumn(header)
  const oaaCol = findColumn(header, 'outs_above_average') ?? findColumn(header, 'oaa')
  if (!idCol || !oaaCol) return result
  for (const row of rows) {
    const id = row[idCol]
    const oaa = parseFloat(row[oaaCol])
    if (id && !Number.isNaN(oaa)) result.set(id, oaa)
  }
  return result
}

/** Average fastball (4-seam/sinker) velocity in mph for a given season, keyed by MLBAM player id. */
export async function fetchAvgFastballVelocity(year: number): Promise<Map<string, number>> {
  const rows = await fetchCsv(`/leaderboard/pitch-arsenal-stats?type=pitcher&pitchType=&year=${year}&team=&min=1&csv=true`)
  const result = new Map<string, number>()
  if (rows.length === 0) return result
  const header = Object.keys(rows[0])
  const idCol = findIdColumn(header)
  const pitchTypeCol = findColumn(header, 'pitch_type') ?? findColumn(header, 'pitch_name')
  const veloCol = findColumn(header, 'velo') ?? findColumn(header, 'speed')
  if (!idCol || !veloCol) return result
  for (const row of rows) {
    const id = row[idCol]
    if (!id) continue
    const pitchType = pitchTypeCol ? row[pitchTypeCol]?.toUpperCase() : ''
    const isFastball = !pitchTypeCol || ['FF', 'SI', 'FT', '4-SEAM', 'SINKER'].some((t) => pitchType.includes(t))
    if (!isFastball) continue
    const velo = parseFloat(row[veloCol])
    if (!Number.isNaN(velo) && !result.has(id)) result.set(id, velo)
  }
  return result
}
