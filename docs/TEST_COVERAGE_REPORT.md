# Test coverage report

Node.js v22.23.4. No coverage tool was installed. The numbers below are the report printed by:

```bash
node --test --experimental-test-coverage
```

Exit code 0. The same run's test summary:

```
# tests 54
# suites 0
# pass 54
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 178.640874
```

`node --test` discovers the same 54 tests (30 existing, 24 under `tests/stress/`).

## Totals

| | Line % | Branch % | Functions % |
|---|---:|---:|---:|
| All files | 99.90 | 97.20 | 98.99 |

Every file under `src/` is at 100% line coverage. Branch and function gaps that remain are listed in the table. Uncovered line numbers are the ones the tool printed. An empty uncovered-line cell means no missed lines.

## Report

| File | Line % | Branch % | Funcs % | Uncovered lines |
|---|---:|---:|---:|---|
| `src/assets/loader.js` | 100.00 | 87.23 | 92.31 | |
| `src/avatars/catalog.js` | 100.00 | 100.00 | 100.00 | |
| `src/avatars/ownership.js` | 100.00 | 100.00 | 100.00 | |
| `src/battle/battle.js` | 100.00 | 97.35 | 100.00 | |
| `src/cards/catalog.js` | 100.00 | 100.00 | 100.00 | |
| `src/cards/hand.js` | 100.00 | 94.87 | 100.00 | |
| `src/cards/play.js` | 100.00 | 98.18 | 100.00 | |
| `src/design/blocked-rules.js` | 100.00 | 100.00 | 100.00 | |
| `src/design/errors.js` | 100.00 | 100.00 | 100.00 | |
| `src/index.js` | 100.00 | 100.00 | 100.00 | |
| `src/schema/constants.js` | 100.00 | 100.00 | 100.00 | |
| `src/schema/validate.js` | 100.00 | 100.00 | 100.00 | |
| `src/status/features.js` | 100.00 | 75.00 | 100.00 | |
| `tests/assets.test.js` | 100.00 | 100.00 | 100.00 | |
| `tests/battle.test.js` | 100.00 | 100.00 | 100.00 | |
| `tests/cards.test.js` | 98.70 | 100.00 | 95.65 | 67-68 |
| `tests/helpers/stub-rules.js` | 98.35 | 88.00 | 100.00 | 48-49 |
| `tests/schema.test.js` | 100.00 | 100.00 | 100.00 | |
| `tests/status.test.js` | 100.00 | 100.00 | 100.00 | |
| `tests/stress/battle-engine.stress.test.js` | 100.00 | 97.97 | 98.78 | |
| `tests/stress/data-edges.stress.test.js` | 100.00 | 100.00 | 100.00 | |

## What the remaining gaps are

- `src/status/features.js` is 75% branches. This branch does not edit that file. The markdown helper's empty-notes fallback is not taken, because every feature row has a notes string.
- `src/assets/loader.js`, `src/battle/battle.js`, `src/cards/hand.js`, and `src/cards/play.js` have 100% line coverage. The branch percentages below 100 are combinations on lines that did run (for example a defensive `removeCard` failure after the card was already found, or a non-string id skipped while building a hand). No uncovered line numbers were reported for them.
- `tests/cards.test.js` lines 67-68 are the action-limit callback in the existing affordability test. That callback must not run when AP is already insufficient, so the body stays uncovered on purpose.
- `tests/helpers/stub-rules.js` lines 48-49 throw when a TEST-ONLY cost table has no entry for the action type. The stress suite supplies a complete ATK/DEF/Skill table, so that throw is not hit. The stub is still not a game default.

Coverage is not a design approval. Damage, HP, deck size, draw, AP costs, SPD aggregation, SPD tie-break, action limits, skills, and simultaneous defeat remain `BLOCKED_BY_DESIGN`. This report does not mark any of them `PRODUCTION_READY`.
