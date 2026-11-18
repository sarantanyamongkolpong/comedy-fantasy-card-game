# Turn-based battle core stress test

Branch `test/battle-engine-stress`, cut from `feat/card-systems-cursor` at `dba87d708f456f9059f9df3da3cb6f3e219795cd`. This is a regression pass over the current battle, hand, avatar, and schema code. It does not add damage, HP, deck, draw, cost, SPD, skill, or simultaneous-defeat formulas. Those stay `BLOCKED_BY_DESIGN`. Test-only stubs stay in `tests/` and are not installed as defaults.

This branch is not `PRODUCTION_READY`. Owner approval is required before any merge. Do not merge it.

## How to run

Node.js v22.23.4. No install and no npm dependencies.

```bash
node --test
node --test --experimental-test-coverage
```

`npm test` already runs `node --test`, which discovers `tests/stress/*.test.js`. `package.json` was not changed.

## Result

Command: `node --test --experimental-test-coverage`

```
# tests 54
# suites 0
# pass 54
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

24 of those tests are new (`tests/stress/battle-engine.stress.test.js`, `tests/stress/data-edges.stress.test.js`). The other 30 are the existing suite. Counts and the coverage table are copied into `docs/TEST_COVERAGE_REPORT.md`. Each required edge is in `docs/EDGE_CASE_REPORT.md`.

## Bugs fixed

Both bugs were observed before the fix and are now locked by failing-then-passing assertions. The fixes stay inside the current hand and turn rules. No numeric formula was added.

1. **A duplicate card id could be played twice.** `addCard` already rejects a repeated id. `createHand` did not, so a hand built with two copies of the same id played both copies and spent AP twice (`5 - 2 - 2 = 1` in the probe). `createHand` now throws `DUPLICATE_CARD_ID` for a repeated string id. `playCard` returns `DUPLICATE_CARD_ID` and does not spend or remove anything when the live hand already contains that id more than once.

2. **A failed write could leave a turn or a play half-applied.** `endTurn` updated the turn index, the active side, and AP before pushing the log, and only rolled back if `evaluateOutcome` threw. Freezing `state.log` left the battle on turn 2 with side B active and `ap.B` set to 5, while the log stayed at length 2. `playCard` removed the card and spent AP before appending the log and `playedRecords`. Freezing the log consumed the card (`ap` 5 → 4, hand empty, no play record). Freezing `playedRecords` wrote the log entry and still dropped the card. Both functions now do their writes in one `try`. On failure they restore only the fields that changed, so a frozen field does not hide the original error. A frozen battle object still fails the first assignment and stays on turn 1.

## What stayed blocked

Default rules still throw `DesignBlockedError` with `code: "BLOCKED_BY_DESIGN"`. The stress suite calls `defaultRules()` for team SPD aggregation, SPD tie-break, HP / defeat, simultaneous defeat, action limits, AP cost, draw, discard, damage, and skill effects. `src/` does not contain `TEST-ONLY`, `stub-rules`, or `Math.random`.

Playing a card still records `effect: "not_applied"`. `resolveEffect` on ATK or DEF still throws `Q-DAMAGE`. Skill still throws `Q-SKILL`. An `effectId` string is not interpreted. Both sides defeated still throws `Q-SIMULTANEOUS` unless a test injects a winner, and a payload that also says `draw` does not create a draw verdict.

## Known limitations

- Party uniqueness for avatar ids is not a specified rule. The engine accepts duplicates, clones them apart, and does not corrupt the input. It does not reject them.
- The engine's own turns set the active pool to 5 and never store a negative pool. `assessAffordability` rejects a negative or non-integer pool (`AP_INVALID`) and a null pool (`AP_UNAVAILABLE`). A caller who overwrites `state.ap` to a value above 5 is not clamped. There is no bonus-AP rule to implement.
- `createBattle({ rules: null })` follows `rules ?? {}`, so null is treated as omitted rules and throws `Q-SPD-AGG`. `resolveRules(null)` itself throws `TypeError`. The battle still does not start and no formula is installed.
- Injected rules receive the live battle. A damage stub that writes `def` and then throws leaves that write in place. The engine does not sandbox stubs.
- `playCard` on an id that is not in the hand returns `CARD_MISSING`, because the play lookup has no card object to validate. `removeCard` on an empty hand returns `NOT_IN_HAND`.
- Hands start empty. Draw and discard still throw `Q-DRAW-DISCARD`. Putting a card id back with `addCard` after a successful play is possible; the play log is not a discard pile (`Q-PLAY-DESTINATION`).
- There is no turn cap (`Q-TURN-LIMIT`). Forty `endTurn` calls keep alternating and refresh AP to 5.
- Battle members are not required to be catalog ids. Test-only ids such as `A_AV1` are valid combatants when POW, DEF, and SPD validate. Missing catalog avatars fail `validateAvatar`. Missing rigs fail placement with `MISSING_RIG`.
- A deck may still contain duplicate ids. Deck size and copies are `Q-DECK-SIZE`. The hand, not the deck, treats `cardId` as unique.
- If both the character and the equipment record are missing, placement returns `MISSING_EQUIPMENT_DATA` because the item is checked first.
- No UI. Nothing here is `PRODUCTION_READY`.

## Coordination

No edit was required in `package.json`, `README.md`, `docs/OPEN_DESIGN_DECISIONS.md`, `docs/SYSTEMS_PROGRESS_REPORT.md`, or `assets/`. If the Owner wants duplicate avatar ids rejected, or wants a caller-supplied AP pool above 5 rejected, that needs a spec sentence before code changes.
