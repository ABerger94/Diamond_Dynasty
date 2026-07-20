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
  Export a finished roster to a `.json` file and import it on another device — everything is
  per-browser `localStorage`, with no shared backend, so this is how a roster you built on your
  own phone gets to whatever device runs the Scorecard for game night (see `lib/rosterTransfer.ts`).
- **Scorecard** (`/scorecard`) — pick a roster for either side, then record each plate
  appearance's result (Strikeout, Single, Double, ...) as the players resolve it themselves at
  the table. The app advances the lineup, tracks outs/innings/score, and shows the current
  batter/pitcher's ratings and abilities as reference info — it never decides the outcome. Either
  side can instead use **Quick Play** (no saved roster — just a team name) if that side's cards
  aren't in the app yet; the batter/pitcher shown for that side is a generic placeholder and
  fatigue tracking doesn't apply, but score, outs, bases, and the play-by-play log all work
  identically either way. Rosters (for whichever side uses one) need to be loaded in this same
  browser; it's built for one shared device running the game, like a physical scorebook, not each
  player's own device staying in sync. Each rostered team's full lineup (batting order, bench,
  pitchers) is a collapsible panel — click through anyone's full stat card mid-game, not just
  whoever's currently up (`components/TeamLineupViewer.tsx`). An optional, collapsed-by-default
  **Dice Resolver** panel can roll the at-bat for you instead of resolving it with physical dice —
  pick a pitch/swing type and it pulls the rating + modifier from whichever roster is loaded (or
  takes a manual modifier number with no roster), rolls, and walks through the full Phase 1-4 +
  Defense Check chain (including the reroll-on-foul loop, walk-on-Contact-Swing-tie, Errors, and
  Double Plays) down to a final outcome, which still goes through the same `record()` call as
  clicking an outcome button directly — the dice roller only decides *which* button gets pressed,
  never touches game state on its own (`components/DiceResolverPanel.tsx`,
  `lib/rules/diceResolver.ts`).

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
