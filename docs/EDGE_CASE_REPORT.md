# Edge case report

Each row is an input the stress suite actually runs. "Expected" is the current spec: party of 4, POW/DEF/SPD, hand of 5, base AP 5, alternating turns, highest team SPD starts, ATK/DEF/Skill, and win/loss only through the defeat predicate. Unspecified formulas stay `BLOCKED_BY_DESIGN`. "Actual" is the behavior after this branch. Status is `PASS` (already matched the spec), `FIXED` (a spec bug was found and corrected), `LIMITATION` (not specified, so it was not invented), or `BLOCKED_BY_DESIGN`.

Stubs come from `tests/helpers/stub-rules.js` or from a function marked `TEST-ONLY` inside the stress file. None of them are defaults.

## 1. Invalid party sizes

- **Expected:** A side has exactly 4 avatars. Any other size is rejected. The other side's input is left unchanged.
- **Actual:** Sizes 0, 1, 2, 3, 5, and 8 throw `PARTY_SIZE`. A string and an array-like object throw `PARTY_SIZE`. A length-4 array with a hole throws `TypeError` because that slot has no `avatarId`. The untouched side compares equal before and after.
- **Status:** PASS

## 2. Empty party inputs

- **Expected:** Missing sides, an empty member list, and a missing `sideId` do not start a battle.
- **Actual:** `createBattle()` and a missing side throw `TypeError` (`sideA and sideB are required`). `{}` and `sideId: ''` throw because `sideId` is required. `members` omitted, `[]`, or `null` throw `PARTY_SIZE`. Two sides with the same id throw `side ids must be different`.
- **Status:** PASS

## 3. Duplicate avatar ids

- **Expected:** The spec does not say whether one side may field the same avatar id twice, and it does not forbid the same four character ids on both sides. The engine must not corrupt inputs or catalog ids.
- **Actual:** Four references to one test avatar are accepted. `structuredClone` gives the battle its own copies: editing one member's SPD or `ko` flag does not change the input or the other copies. A mirror side using `AVT_AEG_001`, `AVT_PHA_001`, `AVT_CEL_001`, and `AVT_SAN_001` runs. Those catalog ids are unchanged. Uniqueness inside a party is not enforced.
- **Status:** LIMITATION

## 4. Invalid card ids

- **Expected:** An id that is not in the active hand is not played and does not spend AP. An empty id is not a card. The sample action list is not a closed catalog, so a well-formed test card with an unknown id may be played. An avatar card is not an action.
- **Actual:** `NO_SUCH_CARD`, `''`, and `null` return `CARD_MISSING` with AP still 5 and no play record. `addCard` returns `CARD_MISSING` for an empty or absent id. `validateActionCard` reports an empty `cardId`. `ACT_NOT_IN_SAMPLE_CATALOG` with a valid ATK shape plays, spends 2, and records `effect: "not_applied"`. `AVC_AVT_AEG_001` as an avatar card returns `NOT_ACTION_CARD` and stays in hand.
- **Status:** PASS

## 5. Negative AP

- **Expected:** A negative pool, a fractional pool, a null pool, and a negative cost do not spend AP or remove the card. The engine's own turns do not produce a negative pool.
- **Actual:** Pool `-3` returns `AP_INVALID` and stays `-3`. Pool `null` returns `AP_UNAVAILABLE`. Pool `1.5` returns `AP_INVALID`. A card with `apCost: -2` fails validation (`INVALID_CARD`) and `resolveApCost` returns `INVALID_AP_COST`. A cost rule that returns `-1` returns `INVALID_AP_COST`. A zero integer cost is legal and leaves AP at 5. After spends and 40 turn transitions, stored pools are `null` or an integer from 0 through 5.
- **Status:** PASS

## 6. AP greater than the base

- **Expected:** Base AP is 5. A turn starts by assigning 5, replacing leftover AP rather than adding to it. A card whose cost is above the current pool is unaffordable. No rule grants AP above 5.
- **Actual:** The starting side has 5 and the other side has `null`. Leftover 4 is replaced by 5 on that side's next turn, not raised to 9. Cost 6 at AP 5 returns `INSUFFICIENT_AP` and the card stays. Cost 5 spends to 0. A caller who sets `state.ap` above 5 is not clamped; the affordability check uses the stored pool. That clamp was not added, because the spec does not define a bonus-AP rule and existing tests already write the pool directly when they simulate a partial spend.
- **Status:** PASS for engine transitions. LIMITATION for a caller-overwritten pool above 5.

## 7. Card played twice

- **Expected:** A successful play removes the card and appends one play record, so that id cannot be played again from the hand. The hand already treats `cardId` as unique in `addCard`.
- **Actual:** Before the fix, `createHand` accepted two cards with id `same`, and both plays succeeded (AP 5 → 3 → 1, two records). After the fix, `createHand` throws `DUPLICATE_CARD_ID`. A normal second play of `once` returns `CARD_MISSING`, AP stays at the single charge, and `playedRecords` has one entry. Pushing a second copy into `hand.cards` makes `playCard` return `DUPLICATE_CARD_ID` with AP unchanged and both copies still in hand. A 6-card constructor still throws `HAND_FULL` before the duplicate check.
- **Status:** FIXED

## 8. Act outside the active turn

- **Expected:** Only the active side plays. The other side's hand and AP do not change.
- **Actual:** During A's turn, B's play returns `NOT_ACTIVE_SIDE` even if B's AP was set to 5. The card stays. `NOBODY` and `null` return `NOT_ACTIVE_SIDE`. After `endTurn`, A's play returns `NOT_ACTIVE_SIDE` and B can play. Deleting the active hand returns `UNKNOWN_SIDE`.
- **Status:** PASS

## 9. Unaffordable card

- **Expected:** Cost above the current AP does not spend and does not remove the card. A null cost with the default rule throws `Q-AP-COST` and does not play. Cost equal to the pool is affordable.
- **Actual:** Skill cost 3 at AP 2 returns `INSUFFICIENT_AP`; AP stays 2 and the hand stays at 2 cards. A DEF costing 1 then spends to 1, and the skill still does not play. Replacing `resolveApCost` with the default throws `Q-AP-COST` with AP still 5 and the card still in hand. Cost 5 at AP 5 succeeds and leaves 0.
- **Status:** PASS

## 10. Missing character data

- **Expected:** An incomplete avatar record fails validation. A battle member needs an `avatarId` and valid POW/DEF/SPD. HP is not a stat. A rig lookup for an unknown avatar returns a missing result and does not invent a character. Catalog ids stay the shipped four.
- **Actual:** `validateAvatar` rejects null, a bad id, empty names, an unknown faction, a role that does not match the faction, empty rarity, empty `rigId`, bad `assetIds`, and unknown fields. `validateStats` rejects null, arrays, negatives, fractions, strings, a bad `valueStatus`, mixed TBD/SET numbers, and an `hp` field. `createBattle` throws `INVALID_STATS` for missing stats, SPD `-5`, and an `hp` field, and throws `TypeError` for an empty `avatarId`. The other side is not mutated. `placement('AVT_MISSING', ...)` returns `MISSING_RIG`. A character with no anchors returns `MISSING_ANCHORS`. A head anchor that is not a pair returns `MISSING_ANCHOR`. `AVT_AEG_001` with the silver pot helmet still places. `AVT_MISSING` is not in `SAMPLE_AVATARS`.
- **Status:** PASS

## 11. Missing equipment data

- **Expected:** An incomplete equipment record fails validation. Upgrade payloads stay blocked. Placement of an unknown item returns a missing result. Asset ids are not invented.
- **Actual:** `validateEquipment` rejects null, empty ids, a numeric `nativeAvatarId`, an empty `variantOf`, null modifiers, `upgrade: { pow: 1 }`, a status other than `BLOCKED_BY_DESIGN`, and unknown fields. The silver helmet sample still validates. `placement(..., 'EQ_MISSING')` and a pair of unknown ids return `MISSING_EQUIPMENT_DATA`. `resolve('EQ_MISSING')` returns `MISSING_ID`. A missing manifest throws `manifest.assets array is required`. Incomplete items return `MISSING_SLOT`, `MISSING_PIVOT`, `INVALID_FIT`, or `NO_ANCHOR_MAPPING` for slot `cape`. `EQ_MISSING` is not in `SAMPLE_EQUIPMENT`.
- **Status:** PASS

## 12. Invalid faction

- **Expected:** Faction ids, names, and roles stay the four specified rows. A mismatch is a validation error. Names are not renamed.
- **Actual:** Null, an array, `FAC_NOPE`, an empty id, name `Aegis`, and a role that does not match the faction are rejected. An extra field is rejected. Sanctuary Order / Support still validates. An avatar moved to `FAC_SAN` with role Support validates; the same avatar with role DPS does not. The four faction name strings are unchanged.
- **Status:** PASS

## 13. Invalid action type

- **Expected:** The only action types are `ATK`, `DEF`, and `Skill`. Anything else is not played and does not change stats. `resolveEffect` does not invent a fourth type.
- **Actual:** `ATTACK`, `atk`, `skill`, `SKILL`, `''`, `null`, `undefined`, and `ULTIMATE` fail `playCard` with `INVALID_CARD`. AP stays 5 and the card stays in hand. `resolveEffect` throws `TypeError`. POW stays 0.
- **Status:** PASS

## 14. Repeated turn transitions

- **Expected:** Sides alternate. The active pool is set to 5 at the start of that side's turn. Round count follows the turn. A decided battle does not advance. There is no turn cap in the spec.
- **Actual:** With A faster, 40 calls of `endTurn` reach turn 41, round 21, active A. On every step the active side matches the parity and holds AP 5, and pools stay `null` or an integer in 0..5. With B faster, three transitions end on turn 4, round 2, active A, AP 5. Knocking out side B sets A as winner and B as defeat; five further `endTurn` calls return `BATTLE_DECIDED` and the turn index does not move. Knocking out side A sets A's verdict to defeat. `playCard` after a decision returns `BATTLE_DECIDED`.
- **Status:** PASS

## 15. State mutation safety

- **Expected:** Caller inputs and earlier snapshots stay unchanged, including frozen objects. A failed turn or play does not leave a half-written battle.
- **Actual:** Frozen parties and the frozen catalog survive `createBattle`; battle edits do not change them, and member objects are new copies. A frozen card passed to `addCard` stays frozen while the hand holds a separate copy. `publicView` and a projected snapshot taken before a play still match after later plays. Editing the view does not edit the battle. A `teamSpd` stub that mutates the side it receives and then throws does not mutate the input, because it receives a clone. Before the fix, a frozen log, a frozen AP object, or a frozen `playedRecords` array advanced the turn or removed the card anyway. After the fix those calls throw and restore turn index, active side, AP, hand, log, and play records. A fully frozen state object fails on the first assignment and stays on turn 1.
- **Status:** FIXED for half-applied turns and plays. PASS for input and snapshot isolation.

## 16. Deterministic replay

- **Expected:** The same inputs and the same stubs produce the same state sequence. `src/` has no RNG and does not embed the test stubs.
- **Actual:** Two runs of create, three adds, two successful plays, one refused play, and three turn changes compare equal with `deepEqual` and `JSON.stringify`, including `publicView` frames. Every play record says `effect: "not_applied"`. No file under `src/` contains `Math.random`, `TEST-ONLY`, or `stub-rules`.
- **Status:** PASS

## 17. Invalid injected rules

- **Expected:** A rule of the wrong type, an unknown rule, a non-finite team SPD, a bad tie-break, a non-boolean defeat result, a garbage action limit, or a garbage cost does not commit a play or a turn and does not install a formula.
- **Actual:** `resolveRules` rejects `null`, arrays, strings, and numbers. `createBattle({ rules: null })` throws `Q-SPD-AGG` because null is treated as omitted rules (see limitations). Arrays, numbers, unknown keys, and non-functions throw `TypeError` at `createBattle`. `NaN`, infinities, strings, null, objects, arrays, and `true` from `teamSpd` throw `TypeError`. A tie-break that returns anything other than `A` or `B` throws, and the default tie-break still throws `Q-SPD-TIE`. Non-booleans from `isSideDefeated` throw; during `endTurn` the turn, active side, `ap.B === null`, and log length are restored. Garbage `perTurnActionLimit` results throw and leave AP at 5 and the card in hand, including a limit that throws. A missing limit function throws `ACTION_LIMIT_RULE_MISSING`. A missing cost function throws `AP_COST_RULE_MISSING`. `{ cost: 4 }` is accepted as a rule cost. Negative, fractional, and non-integer cost returns are `INVALID_AP_COST`. A damage stub that sets DEF to 99 and then throws leaves that write; the default damage rule still throws `Q-DAMAGE` and does not apply a number itself.
- **Status:** PASS

## 18. Empty hands

- **Expected:** A battle does not draw. Hand size stays 5. An empty hand cannot play. Draw and discard stay blocked unless a test injects them.
- **Actual:** Both hands start as `[]`. Playing any id returns `CARD_MISSING` and writes no play event. `removeCard` returns `NOT_IN_HAND`. `drawCards` and `discardCard` throw `Q-DRAW-DISCARD`. An injected discard labeled `TEST-ONLY` is called and does not fill the hand. `createHand('')` and `createHand(null)` throw. `endTurn` still works with empty hands. The battle outcome stays `ongoing`.
- **Status:** PASS

## 19. Unknown card effect

- **Expected:** `effectId` is not a dispatcher. Skill stays `Q-SKILL`. ATK and DEF stay `Q-DAMAGE`. A play does not change POW, DEF, or SPD and does not create HP.
- **Actual:** A Skill with `effectId: "EFFECT_DOES_NOT_EXIST"` plays, records `effect: "not_applied"`, and leaves every stat equal to the pre-play snapshot. No `hp` field appears. `resolveEffect` throws `Q-SKILL` for that card and `Q-DAMAGE` for an ATK card with `effectId: "ALSO_UNKNOWN"`. An avatar card passed to `resolveEffect` throws `TypeError`. `defaultRules().skillEffect` and `defaultRules().damage` still throw the same question ids.
- **Status:** BLOCKED_BY_DESIGN

## 20. Simultaneous defeat

- **Expected:** If the defeat predicate is true for both sides, the default rule throws `Q-SIMULTANEOUS` and the engine does not pick a winner or declare a draw. A garbage winner is rejected. The turn does not advance.
- **Actual:** `defaultRules().simultaneousDefeat` throws `DesignBlockedError` with `code: "BLOCKED_BY_DESIGN"` and `questionId: "Q-SIMULTANEOUS"`. `evaluateOutcome` leaves `outcome.status` at `ongoing` and `winnerSideId` null. Returns of `null`, `'A'`, `'draw'`, `{}`, `{ winnerSideId: null }`, `{ winnerSideId: 'Z' }`, and `{ draw: true }` throw and leave the outcome unchanged. `endTurn` restores the turn, the active side, and `ap.B === null`. `createBattle` with a predicate that says both sides are defeated throws `Q-SIMULTANEOUS` and returns no battle. An injected `{ winnerSideId: 'A', draw: true, label: 'TEST-ONLY' }` records victory/defeat for the two sides and does not record `draw`. After that, the default rule still throws.
- **Status:** BLOCKED_BY_DESIGN
