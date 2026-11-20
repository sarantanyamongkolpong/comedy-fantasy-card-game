# v0.5 rules as implemented

Source: `docs/design/v05/tabs/v05_Core_Rules.md` on `core/v05-design-source` (not copied into this branch). Placeholder rows are not approved. Locked rows are not configurable.

## Locked

| ID | Behavior | Where |
|---|---|---|
| CORE-002 | Avatars are units on the field. Avatar cards cannot be action cards. | `src/engine/model.js` `normalizeCard` |
| CORE-003 | 4 avatars on each side. Mixed factions are allowed. | `createMatch` |
| CORE-004 | Wipe the enemy side to win. Lose all 4 of your avatars to lose. | `checkOutcome` |
| CORE-006 | Higher team SPD starts, then sides alternate. | `chooseStarter`, `advanceTo` |
| CORE-007 | 5 AP at the start of your turn. | `beginTurn` |
| CORE-008 | AP cost is an integer 0–5 on the card. Missing cost is rejected. | `normalizeCard` |
| CORE-009 | Action deck is 30 cards. | `createMatch` |
| CORE-010 | Opening hand is 5. | `createMatch` |
| CORE-011 | Unplayed cards stay. At your turn start, draw back to 5 if the piles have cards. | `refillHand` |
| CORE-012 | An effect draw may raise the hand above 5. | `resolve.js` draw op |
| CORE-013 | At end of round, discard down to 5 for free. | `resolveEndOfRoundDiscard` |
| CORE-014 | A voluntary discard on your turn costs 1 AP per card. | `discardVoluntary` |
| CORE-015 | End Turn is explicit. 0 AP does not end the turn. | `endTurn` |
| CORE-016 | A played card goes to Discard, or to Void when the card says so. | `playAction` |
| CORE-017 | An empty draw pile shuffles Discard into Draw. Void is not included. | `recycleDiscard` |
| CORE-018 | Void is its own list. `getZones` returns all four lists at any time. | `getZones` |
| CORE-019 | A retrieve effect takes only cards that match its permit, from the pile it names. | `validateRetrieve` |
| CORE-020 | Action types are ATK, DEF, and Skill. | `normalizeCard` |
| CORE-021 | A Skill card fires the chosen avatar's Active. One card fires one avatar unless `skillTargetCount` says otherwise. There is no free Active call. | `resolve.js` `trigger_active` |
| CORE-022 | A card with no faction requirement can be used by any faction. | `factionOk` |
| CORE-023 | A faction requirement needs an actor of that faction, unless `factionOverride` is set. | `factionOk` |
| CORE-005 read | `stats.atk` wins. If only legacy `pow` is present, it is used as ATK and kept on `unit.legacy.pow`. | `normalizeAvatar` |

Cancellation spends nothing. `previewAction` does not change the match. `armAction` only records a pending card. `cancelAction` and an illegal `playAction` leave AP where it was. Ending the turn clears a pending card without spending AP.

Passives with a chance use the match RNG (`src/engine/rng.js`). Chance `0` and `1` do not draw a number. The stream state is `state.rngState`.

Saving Grace is avatar data on the Justina sample: Regen +3, 2 ticks, all living teammates. Dead units are not healed. The status leaves after the second tick.

## Pending — placeholder, not approved

These stay `status: 'PENDING_OWNER'`. `resolveRuleConfig` rejects an attempt to mark them `LOCKED`.

| Topic | Config | Placeholder used so the loop can be played |
|---|---|---|
| CORE-038 team SPD | `teamSpd.aggregation`, `teamSpd.tieBreak` | `sum` of all four roster SPD values, taken once at the start. Tie: dedicated seeded stream labelled `spd-tie`, which does not move the draw stream. Also implemented: `average`, `max`. |
| CORE-004 simultaneous death | `simultaneousDeath.policy` | `higher_team_spd_then_input_order`. Alternate: `input_order` (teams[0]). |
| CORE-039 damage | `damage.formula`, `damage.minDamage`, `damage.preset` | Default is unchanged: `preset` null and `placeholder_atk_minus_def` with `minDamage` 1, so `max(1, effectiveATK - effectiveDEF) + on-attack bonus`. Named alternates, still placeholders: `floor_25_pct_atk` and `floor_50_pct_atk` (also at least ceil of that percent of ATK), and `flat_atk` (effective ATK, ignores DEF). Selecting a preset does not rewrite the default formula fields. |
| CORE-039 HP | `hp.base`, `hp.perDef` | If the avatar does not bring `maxHp`, `maxHp = 10 + DEF * 2`. KO at HP 0. |
| OPEN-02 heal cap | `healCap.policy` | `clamp_to_max_hp`. Alternate: `allow_overheal`. |
| OPEN-02 regen ticks | `regenTickTiming.timing` | Tick at the start of that side's later turns. A regen applied during a turn does not tick on that same turn. Two ticks means two of those starts, then the status is removed. |
| OPEN-02 durations | `statusExpiry` | A timed buff or Taunt expires at the start of the owner's later turn (`appliedTurn + durationTurns * sideCount`). A 1-turn Taunt therefore covers the enemy turn. Next-attack bonuses expire at end of turn, or as soon as that attack resolves. |
| OPEN-02 regen stack | `regenStack.policy` | Keep the higher amount and refresh the tick count upward. Alternate: `stack_separate`. |
| CORE-040 duplicates | `deckDuplicateMax.value` | `null`. No cap is invented. A positive integer enforces one. |
| Shield | `shield.policy` | Amounts add into one pool. The pool has no turn limit. |

Unknown formula names, aggregations, and policies throw. They are not silently treated as the placeholder.

## AUTO and SYNC

AUTO battle mode is locked (`autoMode.enabled` is true). SYNC is not implemented: there is no sync function and no sync config.

`autoPolicy` is `PROPOSED`. The default name is `balanced`. The table in `defaultRuleConfig().autoPolicy.policies` decides the order: heal or regen when a living ally is under `allyLowHpRatio` (0.4), shield or taunt the tank when an enemy strike can reduce an ally to 0, otherwise the highest estimated damage on the lowest-HP legal target, then `any_legal_expected_value`. That last tier plays any remaining legal card, highest expected value first, including a Skill that fires an Active and a zero-amount shield. A turn is not passed while a legal card remains. A shield of 0 does not count as the lethal-shield tier, so it cannot spend the turn ahead of a damaging play. AP is spent greedily. A voluntary discard happens only when nothing legal remains and a card cannot be played even with enough AP. Editing the ratio or the priority order is allowed. Marking the policy `LOCKED` is rejected.

## Sample avatars

`proposedSampleRoster()` in `src/engine/samples.js` is fixture data, not the catalog.

| ID | designRef | Name | Active |
|---|---|---|---|
| `AVT_AEG_002` | `AV_EX01` | JUSTIN CASE | Shield +2 and Taunt 1 turn (proposed) |
| `AVT_PHA_002` | `AV_EX02` | JUSTIN TIME | Reckless Rush, next attack ATK +2 this turn (proposed) |
| `AVT_CEL_002` | `AV_EX03` | JUSTIN THEORY | Arcane Formula, next attack ATK +3 this turn (proposed) |
| `AVT_SAN_002` | `AV_EX04` | JUSTINA MOMENT | Saving Grace, Regen +3 for 2 ticks (active locked). Passive Moral Support is proposed. |

Existing `AVT_*_001` ids are not reused. Stats on these samples are proposed. `buildSampleDeck()` repeats sample actions up to 30 because no duplicate cap is approved. Those repeats are not a balance claim.

## Legacy modules

`src/battle/battle.js`, `src/cards/hand.js`, and `src/cards/play.js` still implement the older blocked shell. Frozen stress tests, replay, and the balance lab import them. v0.5 draw, discard, Void, skills, and damage are in `src/engine`, not in those files.
