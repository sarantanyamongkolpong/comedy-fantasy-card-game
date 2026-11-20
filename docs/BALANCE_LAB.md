# Battle balance laboratory

This is an EXPERIMENTAL simulation tool. It does not set game balance, it does not write stats into the character catalog, and it is not `PRODUCTION_READY`.

A scenario file supplies every undecided battle parameter. The laboratory compiles those values into the engine's rule hooks (`teamSpd`, `spdTieBreak`, `isSideDefeated`, `simultaneousDefeat`, `perTurnActionLimit`, `resolveApCost`, `draw`, `discard`, `deckSize`, `damage`, `skillEffect`) and then calls `createBattle`, `playCard`, `resolveEffect`, `evaluateOutcome`, and `endTurn`. A missing parameter is a validation error. There is no hidden default for a cost, a formula, a deck size, or a tie-break.

`docs/BALANCE_LAB_ASSUMPTIONS.md` says which report fields move when which parameter changes, and which engine behaviors the laboratory cannot vary.

## Fixed rules

These come from the engine and are rejected if a scenario tries to set them:

| Rule | Value |
|---|---|
| Party size | 4 |
| Hand size | 5 |
| Base AP | 5, assigned at the start of that side's turn |
| Turns | Alternating |
| First side | Higher team SPD. The team number is the supplied aggregation |
| Action types | ATK, DEF, Skill |
| Winner | `evaluateOutcome` using the supplied defeat predicate |

## Run

Node.js 18 or newer. No install.

```bash
node tools/balance-lab/cli.js validate tools/balance-lab/scenarios/EXPERIMENTAL_burst.json
node tools/balance-lab/cli.js run tools/balance-lab/scenarios/EXPERIMENTAL_burst.json --out tools/balance-lab/reports
node tools/balance-lab/cli.js compare tools/balance-lab/scenarios/EXPERIMENTAL_attrition.json tools/balance-lab/scenarios/EXPERIMENTAL_burst.json --out tools/balance-lab/reports
node tools/balance-lab/cli.js sweep tools/balance-lab/scenarios/EXPERIMENTAL_burst.json --out tools/balance-lab/reports
node tools/balance-lab/cli.js batch tools/balance-lab/scenarios --out tools/balance-lab/reports
```

`node --test` runs the laboratory tests together with the engine tests.

Exit `0` means the scenario ran. A repeated state or a turn cap is a finding, not a failure. Exit `1` means the scenario was rejected or the run threw. Exit `2` means the command line was wrong.

## What a scenario must contain

`label` is `EXPERIMENTAL`. `scenarioId` matches `EXPERIMENTAL_*`. Avatar ids and side ids match `LAB_*`, so a scenario cannot reuse a production id. `notes` is required and is copied into the report. `seed`, `repeats`, and `repeatSeedStep` are required. Repeat `r` uses `seed + r * repeatSeedStep`.

`parameters` must include every key below. Unknown keys are errors. `partySize`, `handSize`, `baseAp`, `apLeftover`, `gachaRate`, `upgrade`, and `rarity` are rejected with a reason instead of being ignored.

| Key | Question | What the scenario decides |
|---|---|---|
| `teamSpd` | Q-SPD-AGG | `sum`, `max`, `min`, or `mean`, plus `rounding` (`none`, or `floor`/`ceil` for a mean) |
| `spdTieBreak` | Q-SPD-TIE | `sideA`, `sideB`, `lowerSideId`, `higherSideId`, or `seeded` |
| `hp` | Q-HP | Per-avatar pool formula, defeat condition, floor, heal cap, and whether a heal can revive |
| `apCost` | Q-AP-COST | Integer cost for ATK, DEF, and Skill. `avatarModifier` must be `none`. `perCard` overrides are explicit |
| `damage` | Q-DAMAGE | Linear ATK formula, what a DEF card does, and how shield or mitigate applies |
| `deck` | Q-DECK-SIZE | Per-side size and an explicit count for ATK, DEF, and Skill, including zero |
| `draw` | Q-DRAW-DISCARD | Opening count, per-turn count, empty deck, full hand, and listed or seeded order |
| `discard` | Q-DRAW-DISCARD | Played cards go to a discard pile, are removed, or stay in a laboratory in-play zone |
| `actionLimit` | Q-ACTION-LIMIT | `apOnly`, `maxPlays`, `maxByType`, or both. Unused caps must be `null` |
| `skill` | Q-SKILL | `damage`, `heal`, `buffStat`, or `noEffect`, plus `grantsAp` (zero is written, not assumed) |
| `simultaneousDefeat` | Q-SIMULTANEOUS | Which side wins when both defeat predicates are true |
| `turnCap` | Q-TURN-LIMIT | `maxTurns`. `atCap` must be `unresolved`. The cap does not award a winner |
| `targeting` | Q-TARGETING | Who acts, who is hit, and how ties between avatars break |

POW, DEF, and SPD are integers on each of the four avatars. Formulas are linear: `constant` plus `coefficient * stat` for each term. A flat amount is a constant and an empty `terms` array. Named presets such as `powMinusDef` are rejected.

`policies.sideA` and `policies.sideB` choose cards. Each policy's `label` is `EXPERIMENTAL` and `priority` is an ordered list of action types. The first legal card of the first available type is played. `policySweep` is `null` or a list of those policies for `sweep`.

## What the run reports

Each battle record has:

- `stoppedReason`: `decided`, `turn-cap`, or `repeated-state`
- `winnerSideId` / `loserSideId`: set only when the engine outcome is `decided`
- `turns`, `rounds`
- AP refreshed, spent, leftover, and skill grants, checked against the engine log
- plays by action type
- `seedConsumed`: true when the seeded tie-break, shuffle, reshuffle, or seeded simultaneous rule drew a number

The summary averages those battles. Unresolved battles stay in the win-rate denominator.

Static checks, before and beside the fights:

- `impossibleAp`: a card's cost is above the AP from which that card could still be paid in one turn
- `unreachable`: not in the deck, forbidden by an action cap of zero, or impossible AP
- `policyOmitted`: action types the seat's policy will never choose
- `neverPlayedAcrossBattles`: types that were legal on paper and still never played

`sweep` crosses `policySweep` with itself and reports `experimentalDominantPolicy` per seat when one policy's win rate is strictly highest. A tie leaves the field null. The note on that object says it is not a balance recommendation.

`compare` subtracts the right scenario's summary from the left. It does not rank the two configs.

JSON and CSV for the checked-in scenarios are in `tools/balance-lab/reports/`.

## Sample scenarios

These four files are inputs, not answers.

| File | Role |
|---|---|
| `EXPERIMENTAL_attrition.json` | POW minus DEF, small shields and heals, longer decided fights |
| `EXPERIMENTAL_burst.json` | Flat damage equal to HP, fights that end on turn 1 under always-ATK |
| `EXPERIMENTAL_stalemate.json` | Zero damage, so the repeated-state detector stops the fight |
| `EXPERIMENTAL_unreachable.json` | Skill costs 8 with no AP grant, and DEF count is 0 |

Attrition and burst are the contrasting pair. The other two exist so the detectors have committed output.

## Sample output

`node tools/balance-lab/cli.js compare tools/balance-lab/scenarios/EXPERIMENTAL_attrition.json tools/balance-lab/scenarios/EXPERIMENTAL_burst.json --out tools/balance-lab/reports`

```text
EXPERIMENTAL balance lab compare
left: EXPERIMENTAL_attrition average turns 28.333 win rate A 1
right: EXPERIMENTAL_burst average turns 1 win rate A 1
delta average turns (left - right): 27.333
delta win rate A (left - right): 0
delta average AP spent total (left - right): 61.333
Deltas are left minus right under each scenario's own supplied parameters. They are not a balance recommendation.
EXPERIMENTAL: these results depend only on the parameters in this scenario. They are not game balance, not a recommendation, and not PRODUCTION_READY.
```

`node tools/balance-lab/cli.js sweep tools/balance-lab/scenarios/EXPERIMENTAL_burst.json --out tools/balance-lab/reports`

```text
EXPERIMENTAL balance lab sweep
scenario: EXPERIMENTAL_burst
policyA, policyB, winsA, winsB, unresolved, averageTurns
always-ATK, always-ATK, 3, 0, 0, 1
always-ATK, always-DEF, 3, 0, 0, 1
always-ATK, mixed, 3, 0, 0, 1
always-DEF, always-ATK, 0, 3, 0, 2
always-DEF, always-DEF, 0, 0, 3, 4
always-DEF, mixed, 0, 3, 0, 4
mixed, always-ATK, 0, 3, 0, 2
mixed, always-DEF, 3, 0, 0, 3
mixed, mixed, 3, 0, 0, 3
seat A experimental dominant policy: always-ATK
seat B experimental dominant policy: always-ATK
EXPERIMENTAL observation under the supplied assumptions and seat. Mirror pairings are included. Not a balance recommendation.
```

Under this burst file, always-ATK wins from seat A in one turn because damage equals HP and that seat starts. always-DEF versus always-DEF never deals damage, so those three repeats are `unresolved` repeated states, not draws and not wins. That observation belongs to this file's formulas, costs, and seat order.

`node tools/balance-lab/cli.js run tools/balance-lab/scenarios/EXPERIMENTAL_unreachable.json --out tools/balance-lab/reports`

```text
impossible AP: Skill#0 cost 8 > 5; Skill#1 cost 8 > 5
unreachable: DEF (notInDeck); Skill (impossibleApCost)
wins A/B/unresolved: 1/0/0
```

The Skill costs more than base AP and `grantsAp` is 0, so the cost is impossible. DEF's count is 0, so it is unreachable because it is not in the deck. Side A still wins with ATK. The findings are reported next to the win, not instead of it.

`node tools/balance-lab/cli.js run tools/balance-lab/scenarios/EXPERIMENTAL_stalemate.json --out tools/balance-lab/reports`

```text
average turns: 6 (min 6, max 6)
wins A/B/unresolved: 0/0/1
stops: decided 0, turn-cap 0, repeated-state 1
```

Damage is the supplied constant 0. The fight stops because the decision state repeated. The turn cap is 20 and is not what stopped it. There is no winner.

## Status

`EXPERIMENTAL`. The sample numbers are measurements of the supplied files. They are not proposed stats for Sir Potlid, Nox Squeak, Madame Meteor, Sister Plaster, or any production card.
