# Diamond Dynasty — Companion App

A React + TypeScript + Vite web app that companions the Diamond Dynasty tabletop card game. See
[`../docs/RULEBOOK.md`](../docs/RULEBOOK.md) (canonical copy lives at `src/content/rulebook.md`
and renders on the app's Rulebook page).

## Run it

```bash
npm install
npm run dev      # dev server
npm run build    # type-check + production build
npm run lint      # oxlint
```

## What's here

- **Rulebook** (`/`) — the full rules, rendered from `src/content/rulebook.md`.
- **Players** (`/players`) — searchable card lookup with derived 1–20 ratings and abilities.
- **Cards** (`/cards`) — individual physical card tracking (brand, set, parallel, serial number,
  autograph/relic, condition) linked to a player; cosmetic only, per Rulebook §1.
- **Roster Builder** (`/roster`) — build a 25-card roster (9 starters, 5 bench, 5 SP, 6 RP),
  saved to `localStorage`. Two-way players occupy a hitting slot and a pitcher slot at once.
- **Play Ball** (`/play`) — pick two rosters and play out the at-bat resolver + score tracker
  live, per the rulebook's dice/outcome tables, abilities included.

## Data

`src/data/players.real.ts` holds real 2025-season data (36 players) transcribed from the source
CSVs/workbook — see the note at the top of that file for exactly which columns feed which rating
and what's approximated when a column isn't available (e.g. no Sprint Speed or RISP-average split
in the source, so Speed/Clutch fall back to steal rate/triples and OPS+ respectively).
`src/lib/ratings.ts` derives every rating by percentile ranking each player's raw stats against
the loaded pool, so ratings shift as the pool changes. Add more players by conforming their data
to `HitterStatLine` / `PitcherStatLine` (`src/types/player.ts`) and appending to the array — the
engine needs no other changes.

## Architecture

- `src/types/` — data models (Player/ratings, Roster, CardEntry, GameState).
- `src/lib/ratings.ts` — stat-line → 1–20 rating derivation.
- `src/lib/rules/` — the rules engine: dice, at-bat resolution, defense checks, base running,
  fatigue, stealing, abilities (`abilities.ts`), and the full game reducer (`game.ts`). This is
  the authoritative implementation of `docs/RULEBOOK.md` — keep both in sync.
- `src/store/` — React hooks wrapping the player pool and `localStorage`-backed rosters/cards/game.
- `src/pages/`, `src/components/` — UI.
