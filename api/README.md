# Serverless API

Vercel Node serverless functions (auto-detected from this directory's file structure — no
separate build config needed) that call MLB's public data sources server-side, so the browser
never has to deal with CORS and API keys/dependencies never need bundling into the client.

- `GET /api/players/search?q=<name>` — name search across all of MLB history by default
  (`_lib/mlbStatsApi.ts`'s `searchPlayersByName`). Pass `&season=<year>` to instead search just
  that season's player pool (`fetchSeasonPlayers`, filtered server-side).
- `GET /api/players/lookup?id=<mlbamId>&season=<year>` — one player's bio + stats, enriched with
  Statcast metrics where available (`_lib/baseballSavant.ts`), scored with the
  reference-distribution rating engine (`app/src/lib/ratings/reference.ts`), returned as
  `{ player, ratings }` — directly usable by the app's `PlayerCard` component. Omit `season` for
  career totals (works for any player regardless of era); pass it for a single-season line, which
  is also what enables Statcast enrichment (season-specific leaderboards).

**Both are plain filenames with query params, not `[param].ts` dynamic routes** — a dynamic route
(`/api/players/[id].ts`) was tried first and confirmed broken in production: requests to it
returned the SPA's `index.html` instead of reaching the function, while the plain-filename
`search.ts` deployed and worked correctly. Root cause unconfirmed (not reproducible from this
dev sandbox — see below); the fix was to stop relying on bracket routes rather than chase why.

## Data sources

| Source | What it provides | Confidence |
|---|---|---|
| MLB Stats API (`statsapi.mlb.com`) | Bio, season batting/pitching counting stats, ERA, saves — covers every MLB season back into the 1800s | Well-documented publicly; endpoint paths are solid, exact response field names are reconstructed from memory |
| Baseball Savant (`baseballsavant.mlb.com`) | Sprint Speed, Outs Above Average, average fastball velocity (Statcast era only, ~2015+) | Lower confidence — leaderboard URLs/CSV columns are less consistently documented; parsed by fuzzy column-name matching specifically to reduce breakage from a wrong guess |

Both are official MLB data — no scraping of third-party sites (Baseball-Reference, FanGraphs),
which explicitly prohibit that in their Terms of Service.

## Unverified — read before debugging

**This sandbox's network policy blocks both statsapi.mlb.com and baseballsavant.mlb.com**, so
none of this code has run against the real APIs — only against hand-built mocks matching their
documented/expected shape (see the ratings pipeline tests referenced in commit history). If
something looks wrong after deploying:

1. Hit the MLB/Savant URL directly in a browser first (e.g.
   `https://statsapi.mlb.com/api/v1/people/592450`) to see the real shape.
2. Compare against what `extractHitterStatLine`/`extractPitcherStatLine`
   (`_lib/mlbStatsApi.ts`) or the column-name searches in `_lib/baseballSavant.ts` expect.
3. Field-name mismatches fail soft — a missing field reads as 0/undefined rather than crashing —
   so wrong-looking ratings are more likely than a hard error. Sprint Speed/OAA/fastball velocity
   in particular are worth spot-checking since `_lib/baseballSavant.ts` has the least certainty.
