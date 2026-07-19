# Diamond Dynasty — Companion App

A React + TypeScript + Vite web app that companions the Diamond Dynasty tabletop card game. See
[`../docs/RULEBOOK.md`](../docs/RULEBOOK.md) (canonical copy lives at `src/content/rulebook.md`
and renders on the app's Rulebook page).

**This app never plays the game.** Diamond Dynasty is played at the table with real physical
cards and real dice — the app's job is player ratings/lookup, rosters, the rulebook, and a
scorecard that records results the players already decided. It does not roll dice or resolve
at-bats itself.

## Run it

```bash
npm install
npm run dev      # dev server
npm run build    # type-check + production build
npm run lint      # oxlint
```

## What's here

- **Rulebook** (`/`) — the full rules, rendered from `src/content/rulebook.md`.
- **Players** (`/players`) — searchable card lookup with derived 1–20 ratings and abilities, plus
  a live "Search All MLB Players" section backed by `/api` (any season, official MLB Stats API +
  Statcast — see `../api/README.md`).
- **Cards** (`/cards`) — individual physical card tracking (brand, set, parallel, serial number,
  autograph/relic, condition) linked to a player; cosmetic only, per Rulebook §1.
- **Roster Builder** (`/roster`) — build a 25-card roster (9 starters, 5 bench, 5 SP, 6 RP),
  saved to `localStorage`. Two-way players occupy a hitting slot and a pitcher slot at once.
- **Scorecard** (`/scorecard`) — pick two rosters, then record each plate appearance's result
  (Strikeout, Single, Double, ...) as the players resolve it themselves at the table. The app
  advances the lineup, tracks outs/innings/score, and shows the current batter/pitcher's ratings
  and abilities as reference info — it never decides the outcome.

## Data

`src/data/players.real.ts` holds real 2025-season data (36 players) transcribed from the source
CSVs/workbook — see the note at the top of that file for exactly which columns feed which rating
and what's approximated when a column isn't available (e.g. no Sprint Speed or RISP-average split
in the source, so Speed/Clutch fall back to steal rate/triples and OPS+ respectively).
`src/lib/ratings/pool.ts` derives ratings by percentile-ranking each loaded player's raw stats
against the rest of the pool; `src/lib/ratings/reference.ts` scores a single player (e.g. one
looked up live, with no pool to rank against) against fixed reference breakpoints instead — see
`referenceDistributions.ts` for calibration notes. Add more players by conforming their data to
`HitterStatLine` / `PitcherStatLine` (`src/types/player.ts`).

## Architecture

- `src/types/` — data models (Player/ratings, Roster, CardEntry, GameState).
- `src/lib/ratings/` — stat-line → 1–20 rating derivation (pool-relative and reference-based).
- `src/lib/rules/` — `game.ts` is the scorecard reducer (records a decided outcome's bookkeeping
  consequences — bases, outs, score, lineup order, game-end — never an outcome itself);
  `baserunning.ts` is the shared base-advancement logic; `engine.ts`/`abilities.ts` are
  informational lookups (fatigue status, ability text) for display only. This is the
  authoritative implementation of `docs/RULEBOOK.md`'s bookkeeping — keep both in sync, but
  note the rulebook's dice/outcome tables are for the players at the table, not app code.
- `src/store/` — React hooks wrapping the player pool and `localStorage`-backed rosters/cards/game.
- `src/pages/`, `src/components/` — UI.
