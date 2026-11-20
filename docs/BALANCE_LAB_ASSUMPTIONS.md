# Balance laboratory assumptions

This file says which report numbers move when a scenario field changes, and which behaviors are engine facts the laboratory does not vary. Nothing here is a game rule. The Owner's open questions stay open. See `docs/OPEN_DESIGN_DECISIONS.md`.

Every report copies `evaluatorDefinitions` and `parameters` so the file that holds the numbers also holds the choices that produced them.

## Report fields and the parameters they depend on

| Report field | Moves when these scenario fields change | Also depends on |
|---|---|---|
| `startingSideId`, `teamSpd` | `teamSpd.aggregation`, `teamSpd.rounding`, each avatar's `spd`, `spdTieBreak.method` when the two team numbers are equal | Engine compares the two numbers and starts the higher side. The aggregation reads `stats.spd` only, never marker bonuses |
| `startingHp` | `hp.pool` (`constant`, `terms`, `minimum`, `maximum`, `statRead`) and the avatar's POW, DEF, SPD | A computed HP below 1 rejects the scenario. The laboratory does not start the fight and then declare a winner |
| `winnerSideId`, `loserSideId`, `winRateA`, `winRateB` | `hp.defeatWhen`, damage formula, DEF card, skill, costs, decks, draw, action limit, targeting, policies, simultaneous rule | Set only when `evaluateOutcome` returns `decided`. A cap or a loop leaves them null |
| `unresolved`, `unresolvedRate`, `stoppedReason` | `turnCap.maxTurns`, anything that stops HP from reaching the defeat condition (zero damage, heals, shields, cards that cannot be paid) | `atCap` is `unresolved`. The laboratory does not convert the cap into a win, a loss, or a draw |
| `turns`, `averageTurns`, `rounds` | The same combat parameters as the winner, plus `turnCap.maxTurns` | `turns` is the engine `turnIndex` when the laboratory stops. The cap stops the laboratory from calling `endTurn` once that index is already `maxTurns` |
| `ap.*.spent` | `apCost`, `actionLimit`, which cards the policy can pay, `skill.grantsAp` when a later card in the same turn becomes payable | Sum of `cost` on engine `play` log events for that side |
| `ap.*.refreshed` | How many turns that side actually started | Sum of engine `turn_start.ap`. The engine assigns base AP (5). Leftover AP is replaced, not banked |
| `ap.*.leftover` | Unspent AP at the end of each of that side's started turns, including a turn that ends because the fight was decided or a loop was detected | The laboratory checks `refreshed + grants - spent === leftover` and throws if the ledger breaks |
| `ap.*.grants` | `skill.grantsAp` and how many Skill cards resolve | Added after the skill's own cost is paid. The next turn still starts at base AP |
| `plays`, `neverPlayedAcrossBattles` | Deck counts, costs, action limits, draw order, policy priority | A type omitted from `priority` is also listed under `static.policyOmitted` even if a different policy would have played it |
| `simultaneous` | `hp.defeatWhen` and an effect that makes both predicates true, then `simultaneousDefeat` | The engine requires `{ winnerSideId }` of one of the two sides. The flag is true when both predicates are true after that resolution |
| `seedConsumed` | `spdTieBreak.method` of `seeded` when the totals tie, `draw.order` of `seededShuffle`, `draw.emptyDeck` of `reshuffleDiscard` when a reshuffle runs, `simultaneousDefeat` of `seeded` when that rule runs | False when none of those calls `rng`. A one-card Fisher-Yates shuffle does not draw a number |
| `impossibleAp`, `maxSpendableAp` | `apCost`, `skill.grantsAp`, `actionLimit`, deck counts | See the spendable-AP definition below. This does not depend on which policy is seated |
| `unreachable` | Deck count 0, `maxPlays` or `maxByType` of 0, or an in-deck impossible cost | Independent of the policy. Policy gaps are `policyOmitted` |
| `experimentalDominantPolicy` | `policySweep` plus every combat parameter, because the matrix is re-simulated | Per seat. See the dominance definition below |
| Compare `deltas` | Each side's own parameters. Left minus right | Not a recommendation and not a normalized "fair" match. The two files can differ in every field |

POW changes damage when a formula term reads `pow`. DEF changes damage when a term reads `def`, and it changes a shield when the DEF-card formula reads `def`. SPD changes who starts, and who is the actor when `targeting.actor` is `highestSpdLiving`. A stat that no formula and no selector reads does not change the result. The report still records it, because the scenario supplied it.

## Evaluator definitions

These are how the laboratory applies a supplied config. They are not hidden numbers. Each one is a required field or a fixed reading of fields the scenario already set.

- Formula clamp: apply `minimum`, then `maximum` when `maximum` is not null.
- `incoming.zeroAmountConsumes`: a 0 amount clears `mitigateNext` only when this is true. A 0 amount does not reduce a shield, because there is nothing to absorb.
- Incoming order is the scenario's `damage.incoming.order`. A shield DEF card must say `["shield"]`. A mitigate DEF card must say `["mitigateNext"]`. Heal and noEffect must say `[]`.
- `shieldUnused` of `persist` keeps a shield until damage absorbs it. `expireAtStartOfOwnerNextTurn` clears it after the draw and before plays on the owner's later turns, so the opponent's intervening turn still sees it.
- Multi-target effects resolve every avatar selected at the start of the effect, then the outcome is evaluated once.
- Actor selection uses `targeting.actorStatRead`. It does not follow the damage formula's `statRead` unless the scenario set them to the same value.
- Team SPD ignores marker bonuses.
- Heal and buff selections include defeated avatars only when `hp.revive` is true. Damage selections never include them.
- `loseOnEmptyDraw` and `loseOnOverflow` set that side's experimental HP to 0 so the supplied defeat predicate can run. They are not a second victory type.
- `openingIncludesFirstTurn: true` means each side skips `eachTurnCount` on that side's own first turn. The opening draw is that first draw.
- Repeat seed: `seed + repeatIndex * repeatSeedStep`.
- RNG is mulberry32. Consumption order: seeded SPD tie-break (only if the team totals are equal), side A shuffle when order is `seededShuffle`, side B shuffle, reshuffles in time order, then a seeded simultaneous resolution if that rule runs.
- Policies walk `priority` and take the first legal card of that type in hand order. Types absent from the list are never chosen. The policy label must be `EXPERIMENTAL`.
- The engine play spends AP and does not apply an effect. The laboratory then calls `resolveEffect`.

## Loops

A decision fingerprint is taken after the turn's draw and shield expiry, before cards are played. It includes both sides' HP, shields, mitigate charges, bonuses, KO flags, both AP values, the active side, and the ordered card ids in hand, deck, discard, removed, and in-play. It does not include `turnIndex`, `roundIndex`, or the play log, because those grow even when the position is the same.

If that fingerprint was already seen, the battle stops with `stoppedReason: "repeated-state"`, `loop.kind: "repeated-state"`, `winnerSideId: null`, and `outcome.status: "unresolved"`. The cap is not used as a silent substitute.

A draw burst that returns to a previous hand/deck/discard position stops with `loop.kind: "draw-loop"` and the same unresolved outcome.

If the position keeps changing until `maxTurns`, the stop is `turn-cap`, `loop` is null, and the winner is still null. The note in the outcome is `stop: "turn-cap"`. The engine itself has no cap. The laboratory simply stops calling `endTurn`.

The play guard (`maxTurns * hand size + hand size`) throws if a single battle resolves more cards than that. That throw is a laboratory defect, not a result. Hand size is 5, so a legal turn cannot play more cards than the hand holds, because the laboratory does not draw in the middle of a turn.

## Spendable AP

`maxSpendableAp` is the largest AP balance from which some in-deck card can still be paid during one turn.

- The turn starts at base AP, which is 5. The engine replaces leftovers on the next turn, so a grant does not carry over.
- Only Skill cards with `grantsAp` strictly greater than their own cost are helpers. Cheaper helpers are played first.
- The card being paid occupies one hand slot, so helpers use at most 4 of the 5 slots, and fewer when `maxPlays` or `maxByType.Skill` says so.
- A cost above that balance is `impossibleAp`. If the card is in the deck, `unreachable` also lists `impossibleApCost`.
- A cost of 0 is payable. An action cap of 0 makes the type unreachable even when the cost is payable.

This is the maximum the rules allow, not the AP a particular policy will actually hold.

## Dominance

For each seat, the laboratory averages `wins / battles` across opponent policies. Unresolved battles stay in the denominator. Mirror pairings are included. Cells have equal weight. If one policy's rate is strictly highest, `experimentalDominantPolicy` is that policy id. Otherwise it is null and `tiedPolicyIds` lists the leaders.

The two seats are separate because the higher team SPD starts, so the same policy can win from one seat and lose from the other. The burst sample shows that: always-ATK versus always-ATK is 3 wins for seat A and 0 for seat B, under that file's SPD and damage.

## Engine facts the laboratory does not vary

| Topic | What the engine does | Consequence for a scenario |
|---|---|---|
| Q-AP-LEFTOVER | `createBattle` and `endTurn` assign base AP. There is no rule hook | A scenario cannot bank AP. `parameters.apLeftover` is rejected |
| Q-HAND-OWNER | One hand per side, size 5 | `deck.scope` must be `perSide`. Other scopes are rejected |
| Q-PLAY-DESTINATION | A play removes the card from the hand and appends `playedRecords` | `discard.playedCardsGoTo` is the laboratory zone on top of that log. The engine does not have a discard pile |
| Q-TURN-LIMIT | No engine cap | The scenario's `turnCap` is enforced by not calling `endTurn` |
| Party, hand, base AP, alternating turns, highest team SPD, ATK/DEF/Skill | Fixed | Rejected if the scenario tries to override them |

Q-GACHA, Q-UPGRADE, Q-RARITY, and Q-SLOT-ANCHOR are outside this laboratory. Supplying them is an error.

## Where experimental HP lives

`validateStats` accepts only POW, DEF, and SPD. The laboratory stores HP, shield, mitigate, and bonuses on `member.markers`, which `createBattle` already clones. Those markers are not catalog stats. The laboratory does not write them into `src/avatars/catalog.js`, `src/cards/catalog.js`, or any sample asset.

Cards are built with `apCost: null` and `costStatus: "TBD"` so the engine calls the injected `resolveApCost`. The integer lives in the scenario, not on a production card.

## Sample files are measurements

| File | What the committed report is measuring |
|---|---|
| `EXPERIMENTAL_attrition.json` | Three seeds, POW−DEF, shields and heals, reshuffles. Average turns 28.333, all decided for `LAB_SIDE_A`, average AP spent 29.333 and 36. The reshuffle consumes the seed, so the three fights are not identical (27, 29, 29 turns) |
| `EXPERIMENTAL_burst.json` | Three seeds, flat 12 damage and 12 HP, listed decks, no per-turn draw. The seed is not consumed. Every fight is 1 turn, 4 AP spent by seat A, 0 by seat B. DEF and Skill are in the deck and are never played by always-ATK |
| `EXPERIMENTAL_burst` sweep | always-ATK is the strict highest win rate on both seats under that file. always-DEF versus always-DEF is unresolved. This is not a reason to cost ATK at 1 in the game |
| `EXPERIMENTAL_stalemate.json` | Constant damage 0. Repeated state at turn 6. Cap is 20. Winner is null. AP spent is 4 and 4 |
| `EXPERIMENTAL_unreachable.json` | Skill cost 8, `grantsAp` 0, base AP 5, so both Skill copies are impossible. DEF count 0, so DEF is not in the deck. Seat A still wins on turn 1 with ATK |

Changing any of those parameters changes the number. The laboratory will not tell you which file is "more balanced."

## Coordination

No change to `src/` was required to run these scenarios.

- `playCard` records `effect: "not_applied"` and does not call `resolveEffect`. The laboratory calls `resolveEffect` immediately after a legal play. That is the engine's split, not a defect.
- Q-AP-LEFTOVER has no injection point. Comparing a banking rule needs an engine hook. This laboratory refuses a scenario value that would pretend otherwise.
- Q-TURN-LIMIT has no engine hook. The laboratory reports the stop outside the engine.
- A production HP field would be a schema change. This laboratory does not add one.

No core battle defect blocked the laboratory. Nothing in this branch is a fix for the stress-test work, and nothing here is `PRODUCTION_READY`.
