# Diamond Dynasty — Official Rulebook (v1.0)

A tabletop baseball game played with real, physical baseball cards from any manufacturer.
Card rarity, manufacturer, and year are cosmetic only — the Diamond Dynasty companion app maps
every card to a set of game ratings derived from the player's real MLB statistics.

> **Companion app note:** every rule below that references a rating, dice roll, or resolution
> table is implemented exactly as written here in `src/lib/rules/engine.ts`. If you ever change
> a number in this document, change it in the engine too — this file is the spec, the engine is
> the implementation.

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

`Discipline` is calculated and displayed on every hitter card but is not yet consumed by the
core at-bat resolution (see §10, Known Limitations). It exists today for player evaluation and
future rule expansions (e.g. a walk system).

---

## 4. Starting the Game

1. Each manager reveals their starting lineup/batting order and starting pitcher.
2. Both managers roll 1d6. High roll chooses Home or Away.
3. The Away team always bats first.
4. A regulation game is 9 innings; each half-inning ends after 3 outs.

---

## 5. The At-Bat

Every plate appearance resolves in four phases.

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
| Contact Swing | Contact only | +4 |
| Normal Swing | Average of Contact and Power (rounded) | none |
| Power Swing | Power only | +6 |

### Phase 3 — Dice Roll

Both managers roll 2d6 simultaneously.

- **Batter total** = 2d6 + the rating selected by the swing type (§Phase 2), plus its modifier.
- **Pitcher total** = 2d6 + the rating selected by the pitch type (§Phase 1), plus its modifier.

**Clutch Situations:** from the 7th inning on, if the game is within 2 runs, both the batter and
pitcher add **half their Clutch rating (rounded down)** to their total as a bonus. This is the
only situation Clutch affects.

### Phase 4 — Outcome Resolution

Subtract the lower total from the higher total.

| Difference | Result |
|---|---|
| Pitcher wins by 6+ | Strikeout |
| Pitcher wins by 3–5 | Ball Put In Play (Defense Check, §6) |
| Pitcher wins by 1–2 | Routine Out |
| Tie | Foul ball — reroll with the **same** pitch and swing choices |
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

*Roadmap (not in v1): fielder's choices, double plays, and throwing errors generated from the
same Hit Type + Location rolls, without adding new dice.*

---

## 7. Base Running

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
- After 9 innings, the team with more runs wins.
- If tied, play full extra innings until one team leads at the end of an inning.
- If the home team takes the lead in the bottom half of an inning, the game ends immediately
  (walk-off).

---

## 10. Known Limitations / Roadmap

These are explicit, intentional gaps in v1 — not oversights:

- **No walk/ball-strike count.** Every plate appearance resolves on a single roll; Discipline is
  tracked but not yet consumed by the engine.
- **No abilities system yet.** The data model reserves a slot for special abilities per player,
  but no mechanic uses it in v1.
- **Balls in play are binary (out or hit).** No fielder's choices, double plays, or errors yet
  (see §6 roadmap note).
- **No injuries/Durability rating.** Suggested by design review but not required for core
  gameplay; may be added in a future version.
