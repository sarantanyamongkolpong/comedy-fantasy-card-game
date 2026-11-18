# Battle log format

Version 1 of the debug battle log. The writer is `src/debug`. The schema is `docs/schemas/battle-log.schema.json`. Example files live in `tools/replay/examples/*.log.json`.

This format records what the public battle API already did. It does not define damage, costs, HP, or turn caps.

## Identity

| Field | Value |
|---|---|
| `format` | `comedy-fantasy.battle-log` |
| `version` | `1` |

A log with another format or version is rejected. Add a new version instead of silently changing version 1.

## Top-level fields

| Field | Meaning |
|---|---|
| `battleId` | Passed through to `createBattle`. |
| `label` | Copied from the scenario. Example logs use `TEST-ONLY`. |
| `note` | Human note. Ignored by replay. |
| `ruleset` | Identity of the functions that were injected. |
| `setup` | `sideA`, `sideB`, and the hands that were dealt. |
| `setupResult` | `READY`, or a `BLOCKED_BY_DESIGN` / `ERROR` result when `createBattle` threw. |
| `initialState` | Snapshot after the hands are dealt and before steps. `null` when setup threw. |
| `events` | One entry per scenario step, in order. |
| `finalState` | Snapshot after the last step. `null` when setup threw. |
| `integrity` | `sha256` of the log body with this field removed. |

## Ruleset identity

`ruleset.hash` is `sha256:` plus the hex digest of the canonical JSON for `{ id, label, parameters, entries }`.

Each entry is one key from `resolveRules`:

| Field | Meaning |
|---|---|
| `key` | Rule name (`damage`, `teamSpd`, …). |
| `name` | Function name. |
| `kind` | `ENGINE_DEFAULT` when the source matches the current engine default, `LABELLED` when the caller set `fn.label`, otherwise `UNLABELLED`. |
| `label` | The caller label, or `null`. |
| `sourceHash` | `sha256:` of `Function.prototype.toString` for that function. |

Canonical JSON sorts object keys and drops `undefined`. Arrays keep their order. The hash does not include the function source itself, so a reader can see which fixture parameters were used without embedding a rule implementation.

Replay loads the same ruleset module and recomputes the hash. A mismatch is `RULESET_HASH_MISMATCH`. Changing an engine default's source also changes the hash. Regenerate example logs after that kind of engine edit.

`parameters` is caller-supplied JSON. For the example ruleset it includes the fixture AP table. Those numbers are not card costs from the catalog.

## Integrity

`integrity.hash` covers every other top-level field, including snapshots and results. Replay reports `INTEGRITY_MISMATCH` when the body and the seal disagree. A seal that was recomputed after an edit can still fail replay when the new body does not match a fresh engine run (`RESULT_MISMATCH`, `STATE_MISMATCH`, and the other codes in `docs/REPLAY_TOOL.md`).

## Events

| `op` | Public API | `input` |
|---|---|---|
| `play` | `playCard` | `{ sideId, cardId }` |
| `resolve` | `resolveEffect` | `{ cardId }` |
| `act` | `playCard`, then `resolveEffect` when the play is accepted | `{ sideId, cardId }` |
| `endTurn` | `endTurn` | `{}` |
| `evaluate` | `evaluateOutcome` | `{}` |
| `mark` | Writes a boolean onto a marker key the member already has | `{ sideId, avatarId, marker, value }` |

`mark` is a fixture write. It does not define what the marker means. The example defeat predicate reads `markers.ko`. No HP field is added.

`act` leaves a successful play in place when resolve throws. That is the engine's order: AP is spent in `playCard`, and `resolveEffect` throws without changing POW, DEF, or SPD.

### Result status

| `status` | When |
|---|---|
| `PLAYED` | `playCard` returned `ok`. `effect` stays `not_applied`. |
| `RESOLVED` | `resolveEffect` returned. |
| `REJECTED` | The API returned `ok: false` (`INSUFFICIENT_AP`, `NOT_ACTIVE_SIDE`, `BATTLE_DECIDED`, …). |
| `BLOCKED_BY_DESIGN` | The API threw `DesignBlockedError`. |
| `TURN_ENDED` | `endTurn` returned `ok`. |
| `EVALUATED` | `evaluateOutcome` returned. |
| `MARKED` | A fixture marker write landed. |
| `ERROR` | Some other throw. |
| `READY` | Setup only. The battle was created. |

## Blocked-decision tokens

`reason` on a design block is a display token for an existing `questionId`. The token is not a new rule.

| `questionId` | `reason` |
|---|---|
| `Q-DAMAGE` | `DAMAGE_FORMULA_TBD` |
| `Q-SKILL` | `SKILL_EFFECT_TBD` |
| `Q-AP-COST` | `AP_COST_TBD` |
| `Q-ACTION-LIMIT` | `ACTION_LIMIT_TBD` |
| `Q-HP` | `HP_REPRESENTATION_TBD` |
| `Q-SPD-AGG` | `TEAM_SPD_AGGREGATION_TBD` |
| `Q-SPD-TIE` | `SPD_TIE_BREAK_TBD` |
| `Q-SIMULTANEOUS` | `SIMULTANEOUS_DEFEAT_TBD` |
| `Q-DECK-SIZE` | `DECK_SIZE_TBD` |
| `Q-DRAW-DISCARD` | `DRAW_DISCARD_TBD` |
| `Q-GACHA` | `GACHA_RATE_TBD` |
| `Q-UPGRADE` | `UPGRADE_FORMULA_TBD` |

An unknown `questionId` is copied into `reason` unchanged. `topic` and `message` are copied from the error.

## Snapshots

A snapshot is `publicView` plus the active side's avatar ids and both sides' members, taken from the state object `createBattle` returned.

| Field | Meaning |
|---|---|
| `activeSideId` | Side whose turn it is. |
| `activeAvatarIds` | That side's `avatarId`s in party order. |
| `turnIndex`, `roundIndex` | From the engine. |
| `ap` | Per-side AP. `null` until that side's first turn. |
| `baseAp` | The engine's base AP (5). |
| `outcome` | `ongoing` or `decided`. |
| `hands` | Card ids still in each side's hand. |
| `playedRecords` | Play records the engine stored. |
| `engineLog` | The engine's own log (`battle_start`, `turn_start`, `play`). |
| `sides` | Member `stats`, `markers`, and `labels` for both sides. |

There is no single acting avatar. `Q-TARGETING` is still open, so the active avatars are the whole active party. Example player ids are the catalog ids `AVT_AEG_001`, `AVT_PHA_001`, `AVT_CEL_001`, and `AVT_SAN_001`. Rival ids `TESTONLY_RIVAL_1` … `TESTONLY_RIVAL_4` are empty fixture slots, not new characters. Stats in the examples are fixture numbers (`valueStatus: "SET"`). Catalog stats stay `null`.

`before` / `after` on an event are snapshots. Replay compares them to a fresh run. `diffValues` reports leaf paths such as `ap.PLAYER`.

## First event result

This is `events[0].result` from `tools/replay/examples/blocked-damage.log.json`. The before/after snapshots are in that file.

```json
{
  "actionType": "ATK",
  "apAfter": 3,
  "apBefore": 5,
  "cardId": "ATK_CARD",
  "code": "BLOCKED_BY_DESIGN",
  "message": "BLOCKED_BY_DESIGN: damage formula (Q-DAMAGE)",
  "ok": false,
  "play": {
    "actionType": "ATK",
    "apAfter": 3,
    "apBefore": 5,
    "cardId": "ATK_CARD",
    "cost": 2,
    "effect": "not_applied",
    "ok": true,
    "roundIndex": 1,
    "sideId": "PLAYER",
    "status": "PLAYED",
    "turnIndex": 1
  },
  "questionId": "Q-DAMAGE",
  "reason": "DAMAGE_FORMULA_TBD",
  "status": "BLOCKED_BY_DESIGN",
  "topic": "damage formula"
}
```
