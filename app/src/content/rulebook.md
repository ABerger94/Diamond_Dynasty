# Diamond Dynasty — Official Rulebook (v1.0)

A tabletop baseball game played with real, physical baseball cards from any manufacturer.
Card rarity, manufacturer, and year are cosmetic only — the Diamond Dynasty companion app maps
every card to a set of game ratings derived from the player's real MLB statistics.

> **Companion app note:** the app doesn't decide outcomes on its own — the Scorecard
> (`src/lib/rules/game.ts`) only records a result the players reached and keeps the running score,
> outs, and lineup order. Physical dice and cards at the table remain the default way to play.
> The Scorecard's optional **Dice Resolver** can roll virtual dice for you instead — it pulls the
> right rating and modifier from a loaded roster (or takes manual numbers with no roster), rolls,
> and applies these exact Phase 1-4 and Defense Check rules to land on a result — but it's a
> convenience layer players can choose to use or ignore per at-bat, not a requirement, and it
> never applies anything the rulebook doesn't already say below.

---

## 1. Core Principles

- Players use real baseball cards they already own. No custom cards are printed.
- Card rarity/manufacturer/year has **no gameplay effect**. Teams, logos, and stadiums are cosmetic.
- The app maps each card's player to a set of game ratings and (in future versions) special abilities.
- Gameplay is driven by dice, player ratings, and manager decisions — not the app.

---

## 2. Team Building

Build a 25-player roster from your card collection:

| Slot | Count |
|---|---|
| Starting lineup | 9 (C, 1B, 2B, 3B, SS, LF, CF, RF, DH) |
| Bench | 5 |
| Starting pitchers | 5 |
| Relief pitchers | 6 |

**Two-Way players:** a card with the Two-Way Phenom ability (§10) may occupy both a hitting slot
(lineup or bench) *and* a pitcher slot (starting or relief) at the same time — it isn't two
copies of the card, just one card doing both jobs.

---

## 3. Player Ratings

All ratings run on a **1–20 scale**, derived from real MLB statistics using percentile formulas
against the current player pool.

- **Internal ("hidden") rating**: a decimal value (e.g. `14.68`), used by the app for precision
  as the player pool grows.
- **Display ("card") rating**: the internal value rounded to the nearest whole number. This is
  the only number players use at the table.

| Hitters | Pitchers |
|---|---|
| Contact | Stuff |
| Power | Velocity |
| Discipline | Control |
| Speed | Movement |
| Fielding | Stamina |
| Clutch | Clutch |

Reference points on the 1–20 scale: **10–11 is league average**, **17+ is All-Star caliber**,
**19–20 is historically elite**, **3 and below is replacement level**.

`Discipline` factors into Contact Swings specifically (§5 Phase 2), which is also what makes a
Contact Swing tie result in a Walk instead of a foul ball (§5 Phase 4) — a disciplined hitter on
a Contact Swing is the one most likely to work a pitcher into that tie. There's still no full
walk/count system behind it (§11, Known Limitations); it's a single-roll approximation.

Not every data source has the same advanced splits (Sprint Speed, RISP average, ground-ball
rate, high-leverage ERA). Where one is missing, the affected rating falls back to the next-best
available stat instead of going unrated — see `src/lib/ratings.ts` for the exact fallback per
rating.

---

## 4. Starting the Game

1. Before the first pitch, the managers agree on a game length: **3, 6, or 9 innings**. A full 9
   is the traditional full game; 3 or 6 play the same in every other respect, just shorter —
   Clutch Situations (§5 Phase 3) and game-end (§9) both scale to whichever length is chosen.
2. Each manager reveals their starting lineup/batting order and starting pitcher.
3. Both managers roll 1d6. High roll chooses Home or Away.
4. The Away team always bats first.
5. Each half-inning ends after 3 outs.

---

## 5. The At-Bat

Every plate appearance resolves in four phases.

**Intentional Walk:** before Phase 1, the fielding manager may skip the at-bat entirely and send
the batter to first — no pitch, no dice. Runners advance exactly as on a regular Walk (§7).

### Phase 1 — Pitch Selection (secret)

The pitcher secretly picks one pitch type:

| Pitch | Uses | Modifier |
|---|---|---|
| Fastball | Velocity | +4 Velocity |
| Breaking Ball | Stuff | +4 Stuff |
| Changeup | Control | +4 Control |

### Phase 2 — Batter Approach (secret)

The batter secretly picks one swing type. Each swing selects which rating the roll uses:

| Swing | Rating used | Modifier |
|---|---|---|
| Contact Swing | Contact only | +2, plus Discipline ÷ 10 (rounded down) |
| Normal Swing | Average of Contact and Power (rounded) | +4 |
| Power Swing | Power only | +4 |

*Balance note: every pitch type carries the same +4 modifier, so the batter's average modifier
across swing types needs to land at +4 too, or the batter side of the roll-off structurally
outweighs the pitcher's regardless of ratings. Contact Swing trades a lower modifier for a
narrower, more reliable rating band and the Walk-on-tie payoff (§5 Phase 4); Power Swing trades
Contact's reliability for a swingier, higher-variance rating.*

### Phase 3 — Dice Roll

Both managers roll 2d6 simultaneously.

- **Batter total** = 2d6 + the rating selected by the swing type (§Phase 2), plus its modifier.
- **Pitcher total** = 2d6 + the rating selected by the pitch type (§Phase 1), plus its modifier.

**Clutch Situations:** from the last 3 innings of regulation on (7th inning on for a 9-inning
game, 4th on for 6, the whole game for 3 — see §4), if the game is within 2 runs, both the batter
and pitcher add **half their Clutch rating (rounded down)** to their total as a bonus. This is the
only situation Clutch affects.

### Phase 4 — Outcome Resolution

Subtract the lower total from the higher total.

| Difference | Result |
|---|---|
| Pitcher wins by 6+ | Strikeout |
| Pitcher wins by 3–5 | Ball Put In Play (Defense Check, §6) |
| Pitcher wins by 1–2 | Routine Out |
| Tie (Normal or Power Swing) | Foul ball — reroll with the **same** pitch and swing choices |
| Tie (Contact Swing) | **Walk** |
| Batter wins by 1–3 | Single |
| Batter wins by 4–5 | Double |
| Batter wins by 6–7 | Triple |
| Batter wins by 8+ | Home Run |

---

## 6. Defense Checks

Triggered only by a "Ball Put In Play" result.

**Step 1 — Hit type** (1d6): 1–2 Ground Ball · 3 Line Drive · 4–5 Fly Ball · 6 Pop Up

**Step 2 — Location** (1d8): 1 P · 2 C · 3 1B · 4 2B · 5 3B · 6 SS · 7 LF/CF (roll 1d2 if you
carry separate LF/CF) · 8 RF

**Step 3 — Fielding roll**: the indicated defender rolls 2d6 + Fielding. The batter (or lead
runner, if applicable) rolls 2d6 + Speed. Higher total wins; **the defense wins ties**.

**Resolving the result** (implementation ruling — no dice added, read off the same roll):

| Defense wins (or ties) | Batter wins |
|---|---|
| Ground Ball → Groundout | Ground Ball → Infield Single |
| Line Drive → Lineout | Line Drive → Single (Double if batter's margin is 5+) |
| Fly Ball → Flyout (**Sacrifice Fly**: if a runner is on 3rd with fewer than 2 outs, the out is recorded and the runner scores) | Fly Ball → Single (Double if batter's margin is 5+) |
| Pop Up → Popout | Pop Up → Single |

**Error:** if the defender's 2d6 roll comes up snake eyes (a natural 2), it's an Error regardless
of the total — the batter reaches 1st and existing runners each advance one base, same as a
Single (§7), but it's logged as reaching on an error rather than a clean hit.

**Double Play:** whenever a Ground Ball results in a Groundout with a runner on 1st and fewer
than 2 outs, the lead runner is also out at 2nd — two outs on the play, no additional roll. An
Error never turns into a double play (the defense already muffed it).

*Roadmap (not in v1): fielder's choices — letting the defense choose which runner to put out —
generated from the same Hit Type + Location rolls, without adding new dice.*

---

## 7. Base Running

**Walk (including Intentional Walk):** batter to 1st. Existing runners advance only if forced —
a runner on 1st is forced to 2nd only because the batter is now occupying 1st, and that can chain
to 3rd/home; a runner on 2nd or 3rd with an open base behind them does **not** advance.

- **Single**: batter to 1st; every existing runner advances exactly one base.
- **Double**: batter to 2nd; every existing runner advances exactly two bases.
- **Triple**: batter to 3rd; all existing runners score.
- **Home Run**: batter and all existing runners score.

*Optional variant (not implemented in the v1 app): a manager may send a runner for an extra base
on a close play, resolved as a Speed (runner) vs. Fielding (fielder making the throw) roll-off.*

### Stealing

- Only runners with **Speed 12 or higher** (on the 1–20 scale) may attempt a steal.
- The runner announces the attempt before the next pitch.
- Runner rolls 2d6 + Speed vs. the catcher's 2d6 + Fielding. Higher total wins; **the defense
  wins ties**.

---

## 8. Pitcher Fatigue

Every pitcher's **Stamina** rating sets their personal fatigue thresholds. The listed numbers
are calibrated so a league-average Stamina of **10** produces the baseline thresholds; higher or
lower Stamina scales them proportionally (`threshold = round(baseline × Stamina ÷ 10)`).

| Role | Baseline threshold 1 | Baseline threshold 2 |
|---|---|---|
| Starting pitcher | −1 Control after 15 outs | additional −1 Control after 21 outs |
| Relief pitcher | −1 Control after 6 outs | — |

Fatigue penalties persist until the pitcher is removed from the game.

---

## 9. Substitutions & Ending the Game

- Managers may substitute (pinch hitter, pinch runner, defensive replacement, pitching change)
  between plate appearances only.
- A player or pitcher removed from the game may not return.
- After regulation (3, 6, or 9 innings, chosen at the start of the game per §4), the team with
  more runs wins.
- If tied, play full extra innings until one team leads at the end of an inning.
- If the home team takes the lead in the bottom half of an inning, the game ends immediately
  (walk-off).

---

## 10. Abilities

Some cards carry a named ability. Players apply these themselves at the table, the same as every
other rule in this book — the one exception is Two-Way Phenom's roster-slot rule, which the Roster
Builder enforces directly since it's about deckbuilding, not an at-bat. A few source descriptions
referenced mechanics this game doesn't have (a ball/strike count, a full home/away-and-handedness
matchup grid); those have an explicit ruling below rather than being silently skipped.

| Ability | Effect |
|---|---|
| Two-Way Phenom | Occupies a hitting slot and a pitcher slot at once (§2, enforced by the Roster Builder); ignore pitcher fatigue (§8) entirely for this card. |
| Bronx Bomber | +1 Power vs. right-handed pitching when batting at home. |
| Soto Shuffle | +1 Discipline on Contact Swings. *Ruling: stands in for "behind in the count," which this game doesn't track.* |
| Contact Machine | +1 Contact, always on. *Ruling: stands in for "prevents a rating drop under pressure," which isn't a mechanic here.* |
| Electric Speed | A single on a line drive or fly ball automatically goes for a double. |
| Dragon Cutter | +1 Stuff and +1 Velocity closing out the 9th inning (or later) with a 1-run lead. |

---

## 11. Known Limitations / Roadmap

These are explicit, intentional gaps in v1 — not oversights:

- **No pitch-by-pitch ball-strike count.** Walks exist (a Contact Swing tie, or an Intentional
  Walk declared before Phase 1) but aren't built up from balls and strikes — every plate
  appearance still resolves on a single roll.
- **No fielder's choices.** The defense can't choose which runner to put out; Errors (a natural 2
  on the Fielding roll) and Double Plays (a Groundout with a runner on 1st, fewer than 2 outs)
  are covered (§6), but not the general case of multiple runners with a choice of who's out.
- **No injuries/Durability rating.** Suggested by design review but not required for core
  gameplay; may be added in a future version.
