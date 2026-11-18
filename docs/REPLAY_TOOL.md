# Battle replay tool

Developer CLI for recording a battle, printing it, replaying it, and diffing JSON. There is no visual UI. The tool calls the public battle API (`createBattle`, `playCard`, `endTurn`, `resolveEffect`, `evaluateOutcome`, `publicView`, `addCard`). It does not patch the engine and it does not add gameplay rules.

Node.js 18 or newer. No install and no npm dependencies.

```bash
node tools/replay/cli.js run tools/replay/examples/blocked-damage.scenario.json
node tools/replay/cli.js record tools/replay/examples/blocked-damage.scenario.json --out tools/replay/examples/blocked-damage.log.json
node tools/replay/cli.js replay tools/replay/examples/blocked-damage.log.json
node tools/replay/cli.js print tools/replay/examples/blocked-damage.log.json
node tools/replay/cli.js diff tools/replay/examples/blocked-damage.log.json tools/replay/examples/ap-and-turns.log.json
```

`node --test` runs `tests/debug/` together with the rest of the suite.

## Commands

| Command | What it does | Exit |
|---|---|---|
| `run <scenario>` | Record in memory, pretty-print, replay. `--out` also writes a log. | 0 consistent, 1 inconsistent, 2 usage |
| `record <scenario> --out <log>` | Write a sealed log. | 0, or 2 |
| `replay <log>` | Re-execute and print findings. `--print` pretty-prints first. `--ruleset` overrides the lookup. | 0 consistent, 1 inconsistent, 2 usage |
| `print <log>` | Pretty-print a log. | 0, or 2 |
| `diff <left> <right>` | Structural diff of two JSON values (logs or snapshots). | 0 equal, 1 different, 2 usage |

`--ruleset` is either an id from `tools/replay/examples/rulesets.js` or a path to a module that exports `ruleset` (or `default`) as `{ id, label, parameters, rules }`.

The CLI refuses a ruleset whose `label` is not `TEST-ONLY`, and it refuses an injected function that is not labelled `TEST-ONLY`. Engine defaults are allowed through because they throw `BLOCKED_BY_DESIGN`. The library under `src/debug` will still record other labels; the CLI is the gate for example runs.

## Scenario

`format` is `comedy-fantasy.scenario`, `version` is `1`. A scenario names `rulesetId`, both sides, optional hands, and `steps`.

| `op` | Effect |
|---|---|
| `play` | `playCard`. Does not resolve the effect. |
| `resolve` | `resolveEffect` for a card id dealt in `hands`. |
| `act` | Play, then resolve when the play is accepted. |
| `endTurn` | `endTurn`. |
| `evaluate` | `evaluateOutcome`. |
| `mark` | Set an existing boolean marker, then stop. A later `evaluate` reads it. |

Shipped examples:

| File | What it shows |
|---|---|
| `blocked-damage.scenario.json` | AP spend, `DAMAGE_FORMULA_TBD`, `SKILL_EFFECT_TBD`, `INSUFFICIENT_AP`, turn pass, AP refresh. |
| `ap-and-turns.scenario.json` | Plays without resolve, `NOT_ACTIVE_SIDE`, rival turn. |
| `ko-outcome.scenario.json` | Fixture `ko` markers, then the injected defeat predicate, then `BATTLE_DECIDED`. |

`tools/replay/examples/rulesets.js` is the only ruleset the examples use (`test-only-sum-spd-ko`). It sums SPD, treats every `ko` marker as defeat, charges ATK 2 / DEF 1 / Skill 3, and adds no extra action cap. Damage and skill are not replaced. None of this is an engine default.

Player avatar ids are the four catalog ids. Their POW / DEF / SPD numbers in the scenario are fixtures (`valueStatus: "SET"`). Catalog stats remain `null`. Rival ids are fixture slots.

## Pretty print

`print` writes one block per event. AP is the value before the action. `AP After` appears when the action changed it.

```
TURN 01
Active Team: PLAYER
AP: 5
Active Avatars: AVT_AEG_001, AVT_PHA_001, AVT_CEL_001, AVT_SAN_001
Action: ATK_CARD
Result: BLOCKED_BY_DESIGN
Reason: DAMAGE_FORMULA_TBD
Question: Q-DAMAGE
Cost: 2
AP After: 3
```

`Active Avatars` is the active side's party in party order. The tool does not choose a target (`Q-TARGETING` is open).

The full print of the blocked-damage example:

```
BATTLE blocked-damage
Format: comedy-fantasy.battle-log v1
Ruleset: test-only-sum-spd-ko
Ruleset Hash: sha256:00f144f0df4823976db3214a390df44794c8e68a15b99eea897ee3a97ba88f59
Label: TEST-ONLY
Note: TEST-ONLY fixture. Stat numbers and AP costs are not catalog values. Damage and skill stay on the engine defaults and record BLOCKED_BY_DESIGN.

TURN 01
Active Team: PLAYER
AP: 5
Active Avatars: AVT_AEG_001, AVT_PHA_001, AVT_CEL_001, AVT_SAN_001
Action: ATK_CARD
Result: BLOCKED_BY_DESIGN
Reason: DAMAGE_FORMULA_TBD
Question: Q-DAMAGE
Cost: 2
AP After: 3

TURN 01
Active Team: PLAYER
AP: 3
Active Avatars: AVT_AEG_001, AVT_PHA_001, AVT_CEL_001, AVT_SAN_001
Action: SKILL_CARD
Result: BLOCKED_BY_DESIGN
Reason: SKILL_EFFECT_TBD
Question: Q-SKILL
Cost: 3
AP After: 0

TURN 01
Active Team: PLAYER
AP: 0
Active Avatars: AVT_AEG_001, AVT_PHA_001, AVT_CEL_001, AVT_SAN_001
Action: DEF_CARD
Result: REJECTED
Reason: INSUFFICIENT_AP
Cost: 1

TURN 01
Active Team: PLAYER
AP: 0
Active Avatars: AVT_AEG_001, AVT_PHA_001, AVT_CEL_001, AVT_SAN_001
Action: END_TURN
Result: TURN_ENDED
Next Team: RIVAL
Next AP: 5

TURN 02
Active Team: RIVAL
AP: 5
Active Avatars: TESTONLY_RIVAL_1, TESTONLY_RIVAL_2, TESTONLY_RIVAL_3, TESTONLY_RIVAL_4
Action: END_TURN
Result: TURN_ENDED
Next Team: PLAYER
Next AP: 5

TURN 03
Active Team: PLAYER
AP: 5
Active Avatars: AVT_AEG_001, AVT_PHA_001, AVT_CEL_001, AVT_SAN_001
Action: DEF_CARD
Result: BLOCKED_BY_DESIGN
Reason: DAMAGE_FORMULA_TBD
Question: Q-DAMAGE
Cost: 1
AP After: 4

OUTCOME ongoing
```

## Replay findings

Replay builds a scenario from `setup` and `events`, runs it, and diffs the stored body against that run.

| Code | Meaning |
|---|---|
| `INTEGRITY_MISMATCH` | The seal does not match the body. |
| `RULESET_ID_MISMATCH` | The loaded ruleset id differs. |
| `RULESET_HASH_MISMATCH` | Parameters or function source differ. |
| `SETUP_MISMATCH` | `createBattle` or dealing did not fail the same way. |
| `INITIAL_STATE_MISMATCH` | The opening snapshot differs. |
| `EVENT_COUNT_MISMATCH` | The run produced a different number of events. |
| `SEQUENCE_MISMATCH` | Index, op, input, or an unexpected event field differs. |
| `RESULT_MISMATCH` | The API result differs. |
| `STATE_MISMATCH` | `before` or `after` differs. `phase` says which. |
| `FINAL_STATE_MISMATCH` | The closing snapshot differs. |

`diff` and the `diff` object on a finding use leaf paths. Object keys are compared as a set. Arrays are compared by index. Kinds are `changed`, `added`, and `removed`.

A consistent log is not a designed ruleset. It means this engine, with the named fixture functions, reproduced the file.

## What this tool does not do

- It does not change `src/battle`, `src/cards`, `src/avatars`, or `src/schema`.
- It does not ship fixture SPD sums, AP tables, or `ko` checks as engine defaults.
- It does not render cards or pick a target avatar.
- It does not mark the game `PRODUCTION_READY`.
