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

## MVP_PROVISIONAL — Owner picked for now, not LOCKED

| Topic | Config | Rule in force |
|---|---|---|
| CORE-039 damage | `damage.preset` (default `'flat_atk'`), `damage.status` `'MVP_PROVISIONAL'`, `damage.decision` | Owner t269u (Pote, 2026-11-20 19:48 ICT) picked option A for the MVP: damage = effective ATK + on-attack bonus, DEF is ignored for damage. Shield still absorbs first. DEF still adds HP through the unchanged `hp` formula (`maxHp = 10 + DEF * 2`). The status is `MVP_PROVISIONAL`; `resolveRuleConfig` accepts `MVP_PROVISIONAL` or `PENDING_OWNER` and rejects `LOCKED`. To switch, set `damage.preset` in `src/engine/rule-config.js` (one line) or pass `config.damage.preset`: `null` = legacy `max(minDamage 1, effectiveATK - effectiveDEF)`, `floor_25_pct_atk`, `floor_50_pct_atk`, `flat_atk`. No engine change is needed. No card or skill value was changed. A balance pass follows real play. Sim and match-length report: `docs/final_v05/DAMAGE_FLAT_ATK_REPORT.md`. |

Side effect to know: under `flat_atk` a DEF buff (Justin Case passive *Bulwark*, team DEF +1) no longer changes damage, because DEF only sets max HP at match start. The passive still procs and is logged. This is reported, not fixed.

## Pending — placeholder, not approved

These stay `status: 'PENDING_OWNER'`. `resolveRuleConfig` rejects an attempt to mark them `LOCKED`.

| Topic | Config | Placeholder used so the loop can be played |
|---|---|---|
| CORE-038 team SPD | `teamSpd.aggregation`, `teamSpd.tieBreak` | Owner 2026-11-21 (MVP_PROVISIONAL): `max`, so the side with the single fastest avatar starts. Taken once at the start. Tie: dedicated seeded stream labelled `spd-tie`, which does not move the draw stream. Also implemented: `sum`, `average`. |
| CORE-004 simultaneous death | `simultaneousDeath.policy` | `higher_team_spd_then_input_order`. Alternate: `input_order` (teams[0]). |
| CORE-039 damage (alternates) | `damage.formula`, `damage.minDamage`, `damage.preset` | Moved to MVP_PROVISIONAL above (default `flat_atk`). The legacy fields `formula: placeholder_atk_minus_def` and `minDamage: 1` are kept and apply when `preset` is `null`. `floor_25_pct_atk` / `floor_50_pct_atk` (at least ceil of that percent of ATK) stay selectable placeholders. |
| CORE-039 HP | `hp.base`, `hp.perDef` | If the avatar does not bring `maxHp`, `maxHp = 10 + DEF * 2`. KO at HP 0. |
| OPEN-02 heal cap | `healCap.policy` | `clamp_to_max_hp`. Alternate: `allow_overheal`. |
| OPEN-02 regen ticks | `regenTickTiming.timing` | Tick at the start of that side's later turns. A regen applied during a turn does not tick on that same turn. Two ticks means two of those starts, then the status is removed. |
| OPEN-02 durations | `statusExpiry` | A timed buff or Taunt expires at the start of the owner's later turn (`appliedTurn + durationTurns * sideCount`). A 1-turn Taunt therefore covers the enemy turn. Next-attack bonuses expire at end of turn, or as soon as that attack resolves. |
| OPEN-02 regen stack | `regenStack.policy` | Keep the higher amount and refresh the tick count upward. Alternate: `stack_separate`. |
| CORE-040 duplicates | `deckDuplicateMax.value` | `null`. No cap is invented. A positive integer enforces one. |
| Shield | `shield.policy`, `shield.expiry` | Amounts add into one pool. Owner 2026-11-21 option C (MVP_PROVISIONAL): `expiry: start_of_next_own_turn` clears a side's shields when that side starts its next turn, before Regen ticks and turn-start passives, so a shield covers exactly one enemy turn. `expiry: none` restores the legacy unlimited pool. |

Unknown formula names, aggregations, and policies throw. They are not silently treated as the placeholder.

## AUTO and SYNC

AUTO battle mode is locked (`autoMode.enabled` is true). SYNC is not implemented: there is no sync function and no sync config.

`autoPolicy` is `PROPOSED` (never silently LOCKED). The default name is `balanced`. Owner t282u (MVP_PROVISIONAL): the table first plays a real shield or taunt if a hit can KO, then a worthwhile affordable Regen or heal when an ally is at or below `allyLowHpRatio` (0.5, inclusive). That check skips the skill if it is unaffordable (AP/cost; this ruleset has no MP), if the low unit already has regen, if the unit is at max HP, or if the heal would not land. When that fires, the Skill is given to Justina rather than spent on a next-attack setup. Then a next-attack Skill plays if it raises a still-payable hit, then the highest estimated damage on the lowest-HP legal target. `any_legal_expected_value` plays any other card whose expected value is above 0. A shield of 0 does not outrank a damaging play. `hand_locked_or_no_progress` discards one zero-value or unplayable card for 1 AP so the hand can draw. Owner 2026-11-21: `maxHealCastsPerMatch` (default 3, PROPOSED) caps how many times AUTO casts a Regen or heal Skill per side per match; `null` removes the cap; manual play is never capped. Editing the ratio or the priority order is allowed. Marking the policy `LOCKED` is rejected.

Under the `flat_atk` preset only, Justin Case / Bulwark's turn-start DEF +1 is remapped at resolve time to Shield +2 (Owner t282u, MVP_PROVISIONAL, `damage.bulwark`). Authored skill data is unchanged. Legacy damage presets keep DEF +1.

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
