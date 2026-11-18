# Systems progress report

Branch `feat/card-systems-cursor`, cut from `main` at `7d820535687a2f6c3606ab38ba89e365130f0e88`. Art stays on open PR #1 (`feat/card-art-prototype-mira` @ `d65c89d`). This branch does not merge that PR and does not change `assets/`.

## How to run the tests

Node.js 18 or newer. No install and no npm dependencies.

```bash
node --test
```

`npm test` runs the same command.

## Implementation status

<!-- FEATURE_TABLE_START -->
| Feature | Status | Notes |
|---|---|---|
| Data schema (Avatar, Faction, Stats, Avatar Card, Action Card, Equipment, Ownership, Asset Manifest entry, Variants) | TESTED | JSON Schema plus runtime validators. Sample stats, rarity, and AP costs are null/TBD. |
| Four factions and four starter avatars | TESTED | Names and roles are the specified strings. |
| Party of 4 avatars per side | TESTED |  |
| Team with the highest SPD starts | TESTED | Compares two team SPD numbers from rules.teamSpd. Aggregation is Q-SPD-AGG. |
| Teams alternate turns | TESTED |  |
| 5 AP refreshed at the start of that side's turn | TESTED | Refresh assigns 5. Confirming leftover AP is Q-AP-LEFTOVER. |
| Victory and defeat detection | TESTED | Uses rules.isSideDefeated. HP itself is Q-HP. |
| Deterministic battle log | TESTED | The engine has no RNG. |
| Hand size 5 | TESTED | The battle attaches one hand per side. Hand owner is Q-HAND-OWNER. |
| Action card types ATK, DEF, and Skill | TESTED |  |
| Affordability check and play validation against current AP | TESTED | A null cost blocks through Q-AP-COST unless a rule returns an integer. |
| Asset loader resolves by Asset ID | TESTED |  |
| Anchors, pivots, and frame rects come from data files | TESTED |  |
| Missing ids and CONCEPT or PROTOTYPE statuses | TESTED | Missing ids return MISSING_ID. CONCEPT and PROTOTYPE return an advisory. |
| Deck size | BLOCKED_BY_DESIGN | Q-DECK-SIZE |
| Draw and discard rules | BLOCKED_BY_DESIGN | Q-DRAW-DISCARD |
| AP costs of cards | BLOCKED_BY_DESIGN | Q-AP-COST |
| Damage formula | BLOCKED_BY_DESIGN | Q-DAMAGE |
| HP representation | BLOCKED_BY_DESIGN | Q-HP |
| SPD tie-break rule | BLOCKED_BY_DESIGN | Q-SPD-TIE |
| Team SPD aggregation | BLOCKED_BY_DESIGN | Q-SPD-AGG |
| Per-turn action limits | BLOCKED_BY_DESIGN | Q-ACTION-LIMIT |
| Skill effects | BLOCKED_BY_DESIGN | Q-SKILL |
| Gacha rates | BLOCKED_BY_DESIGN | Q-GACHA |
| Upgrade formulas | BLOCKED_BY_DESIGN | Q-UPGRADE |
| Simultaneous defeat | BLOCKED_BY_DESIGN | Q-SIMULTANEOUS |
| UI and presentation | NOT_IMPLEMENTED | CLI and data only. |
| Auto battler | NOT_IMPLEMENTED | Out of scope. |
| Pixel compositing and image decode | NOT_IMPLEMENTED | The loader returns paths and data-driven placement. It does not decode PNGs. |
<!-- FEATURE_TABLE_END -->

`IMPLEMENTED` is an allowed status. Every behavior this branch ships has a test, so those rows say `TESTED`.

## BLOCKED_BY_DESIGN

Default rules throw. Questions for the Owner are in `docs/OPEN_DESIGN_DECISIONS.md`.

- Q-DECK-SIZE — deck size
- Q-DRAW-DISCARD — draw and discard
- Q-AP-COST — AP costs of cards
- Q-DAMAGE — damage formula, including what a DEF card changes
- Q-HP — HP representation and when a side is defeated
- Q-SPD-TIE — SPD tie-break
- Q-SPD-AGG — how four SPD values become one team SPD
- Q-ACTION-LIMIT — per-turn action limits beyond the AP check
- Q-SKILL — skill effects
- Q-GACHA — gacha rates
- Q-UPGRADE — upgrade formulas
- Q-SIMULTANEOUS — both sides defeated together

Assumptions waiting for confirmation (the prototype still runs): Q-AP-LEFTOVER, Q-HAND-OWNER, Q-PLAY-DESTINATION. Also open: Q-TURN-LIMIT, Q-TARGETING, Q-RARITY, Q-SLOT-ANCHOR.

## Test results

Command: `node --test` (also `npm test`)

Run on this branch with Node.js v22.23.4, zero installed packages:

```
# tests 30
# suites 0
# pass 30
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

30 passing, 0 failing. Suites: `tests/schema.test.js`, `tests/battle.test.js`, `tests/cards.test.js`, `tests/assets.test.js`, `tests/status.test.js`.

## Layout

```
src/avatars/   factions, starter avatars, equipment, variants, ownership
src/battle/    4v4 turns, AP, victory hook
src/cards/     hand of 5, ATK/DEF/Skill, AP checks
src/assets/    manifest loader and slot-anchor map
src/schema/    JSON Schema and validators
src/design/    BLOCKED_BY_DESIGN errors and default rules
src/status/    feature table
tests/         node:test suites and JSON fixtures
docs/          audit, schema, design questions, Mira notes, this report
```

## Known limits

- No UI. Nothing renders a card or a sprite.
- The loader does not decode images. Placement returns numbers read from JSON.
- Sample POW/DEF/SPD, rarity, and AP costs are null.
- Battle tests inject labelled TEST-ONLY rules for team SPD, defeat, costs, and action limits. Those functions are not defaults.
- A later merge with PR #1 will need a small README resolution, because both branches append to `README.md`.
