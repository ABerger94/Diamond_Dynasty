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
- **Players** (`/players`) — searchable card lookup with derived 1–20 ratings.
- **Roster Builder** (`/roster`) — build a 25-card roster (9 starters, 5 bench, 5 SP, 6 RP),
  saved to `localStorage`.
- **Play Ball** (`/play`) — pick two rosters and play out the at-bat resolver + score tracker
  live, per the rulebook's dice/outcome tables.

## Data

`src/data/players.seed.ts` is illustrative demo data, not an official stats feed — see the note
at the top of that file and Rulebook §10. `src/lib/ratings.ts` derives every rating by percentile
ranking each player's raw stats against the loaded pool, so ratings will shift as the pool
changes. Swap in real season data by conforming it to `HitterStatLine` / `PitcherStatLine`
(`src/types/player.ts`) and replacing the seed array — the engine needs no other changes.

## Architecture

- `src/types/` — data models (Player/ratings, Roster, GameState).
- `src/lib/ratings.ts` — stat-line → 1–20 rating derivation.
- `src/lib/rules/` — the rules engine: dice, at-bat resolution, defense checks, base running,
  fatigue, stealing, and the full game reducer (`game.ts`). This is the authoritative
  implementation of `docs/RULEBOOK.md` — keep both in sync.
- `src/store/` — React hooks wrapping the player pool and `localStorage`-backed rosters/game.
- `src/pages/`, `src/components/` — UI.
