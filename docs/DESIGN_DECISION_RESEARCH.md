# Design decision research

**PROPOSALS ONLY. Nothing in this file is an approved rule.**

Every recommendation below is a proposal for the Owner. Accepting a proposal requires an explicit Owner decision. Until that decision, the game defaults stay as they are: blocked rules throw `DesignBlockedError`, and the assumptions in `docs/OPEN_DESIGN_DECISIONS.md` stay unconfirmed. This research does not implement a formula, a rate, a cost, a deck size, or a tie-break. It does not change `src/`, `tests/`, or `docs/OPEN_DESIGN_DECISIONS.md`. It must not be treated as `PRODUCTION_READY`.

Owner approval required: **YES** on every item.

Research base: `feat/card-systems-cursor` at `dba87d7`. Questions are taken from `docs/OPEN_DESIGN_DECISIONS.md`. Engine behavior is taken from the code on that commit.

## How to read this file

- A **fixed fact** is something the code or the existing docs already enforce. This file does not reopen it.
- A **proposal** is one way to answer an open question. It becomes a rule only after the Owner approves it.
- **ILLUSTRATIVE** numbers are examples of shape. They are not proposed final values and they are not assigned to any avatar, card, or banner.
- A **proposed value** (for example a deck of 20) is the recommended answer. It is still unapproved.
- `TEST-ONLY` functions in `tests/helpers/stub-rules.js` are harness stubs. They are not game defaults. A proposal that uses similar arithmetic is not an adoption of the stub.

The short approval list is `docs/OWNER_DECISION_CHECKLIST.md`. The grouping and the graph are `docs/DESIGN_DEPENDENCY_MAP.md`.

## Fixed facts these proposals sit on

These are already specified. The proposals are written to fit them.

| Fact | Where it lives |
|---|---|
| Each side has exactly 4 avatars | `PARTY_SIZE` is 4. `createBattle` rejects any other count |
| Each hand holds at most 5 cards | `HAND_SIZE` is 5 |
| A side's turn sets that side's AP to 5 | `BASE_AP` is 5. Unspent AP on the other side is left alone until that side's own turn |
| Factions and roles | `FAC_AEG` Aegis Dominion Tank, `FAC_PHA` Phantom Blades DPS, `FAC_CEL` Celestial Nexus Magic, `FAC_SAN` Sanctuary Order Support |
| Starter avatars | `AVT_AEG_001` Sir Potlid / เซอร์ฝาหม้อ, `AVT_PHA_001` Nox Squeak / น็อกซ์ รองเท้าดัง, `AVT_CEL_001` Madame Meteor / มาดามดาวตก, `AVT_SAN_001` Sister Plaster / ซิสเตอร์พลาสเตอร์ |
| Action types | `ATK`, `DEF`, `Skill` |
| Avatar cards | `AVC_AVT_AEG_001`, `AVC_AVT_PHA_001`, `AVC_AVT_CEL_001`, `AVC_AVT_SAN_001`. `playCard` rejects them with `NOT_ACTION_CARD` |
| Catalog stats | `pow`, `def`, `spd` only. All three are null together (`TBD`) or all three are non-negative integers (`SET`). HP is not a stat |
| Sample action cards | `ACT_SCHEMA_ATK`, `ACT_SCHEMA_DEF`, `ACT_SCHEMA_SKILL` are schema examples. Costs, names, and `effectId` are null. They are not a card list |
| Equipment samples | `EQ_AEG_POT_HELMET_SILVER_001`, `EQ_AEG_POT_HELMET_GOLD_001` (`variantOf` the silver helmet), `EQ_STAFF_NEUTRAL_001` (shared, `nativeAvatarId` null). `upgrade` is null |
| Battle log | Same inputs produce the same public log. `src/` has no `Math.random`, `Date.now`, or `crypto.random` |
| Play path | `playCard(state, sideId, cardId)` checks the active side, the hand, the type, and AP. It spends AP, removes the card, and appends `playedRecords`. The event's effect is `not_applied`. It does not take a target, and it does not call `resolveEffect` or `evaluateOutcome` |
| Hands at start | `createBattle` creates an empty hand per side. It does not draw |
| Duplicate ids in one hand | `addCard` returns `DUPLICATE_CARD_ID` |
| Victory hook | `evaluateOutcome` runs at battle creation and inside `endTurn`. If both sides are defeated, the resolution must name one of the two side ids. `endTurn` rolls back when that call throws |
| Initiative hook | `teamSpd` runs once, inside `createBattle`. The engine does not sum, average, or take the max itself. Equal numbers call `spdTieBreak` once. `startingSideId` is stored |
| Ownership and upgrade validators | `source` must be null. `upgrade` must be null. A numeric upgrade payload fails validation |
| Rarity field | `null` or a non-empty string. No rank names and no weights. The card frame has a `rarity` rect for runtime gems. That rect is not a rarity scale |
| Slot map | `headgear` → `head`, `accessory` → `feet`, `main_hand`, `off_hand`, and `back` use the slot name. Stored in `src/assets/slot-anchor-map.json` |

This research assigns no POW, DEF, SPD, HP, AP cost, or rarity to the four starter ids. Those catalog fields stay empty until a later content pass that the Owner has approved.

## Comparison frame

Proposals are judged against the game this branch already is:

- **Four-character party.** All four roles should be able to matter in one fight. A rule that only reads the fastest avatar, or only a single party HP bar, leaves Tank and Support as labels.
- **Five-card hand.** The player looks at one row of five cards. Four separate hands would be twenty cards on a phone.
- **Base 5 AP, refreshed on your turn.** The turn puzzle is combining a few card costs into 5. A rule that also allows only one card makes the 5 pointless. A rule that banks AP across turns makes the 5 a stockpile.
- **Comedy Fantasy.** The starters are readable characters with jobs: a pot-lid tank, a squeaky DPS, a meteor mage, a plaster support. Rules should be explainable in one sentence. Hidden percent multipliers fight that.
- **Gacha progression.** Collection can sit outside the fight. The battle prototype has no RNG, and it should stay that way. Pull math belongs in a later acquisition step, with published odds.
- **Accessible mobile play.** Short fights, one hand per side, targets chosen by tapping a portrait, no extra cap to memorize on top of AP.

Genre notes used only as comparisons, not as rules of this game:

- Slay the Spire refreshes a small energy pool each turn, clears unspent block on the player's next turn in the base game, and recycles a discard pile into the draw pile when the draw pile is empty.
- Hearthstone's constructed format uses a fixed deck size (30). Unspent mana does not carry over. The hero has one health pool.
- Marvel Snap uses a 12-card deck and ends the match after a short fixed number of turns.
- Genshin Impact and Honkai publish wish probabilities in the client and use a pity counter so a featured high-rarity result is eventually guaranteed. Their exact percentages are theirs. This file does not copy them.

## Topics already in the question file

`Q-RARITY` and `Q-TARGETING` are already in `docs/OPEN_DESIGN_DECISIONS.md` with status `open`. They are researched below as existing topics. They are **not** newly identified.

`Q-AP-LEFTOVER`, `Q-HAND-OWNER`, and `Q-PLAY-DESTINATION` are assumptions waiting for confirmation. `Q-TURN-LIMIT` and `Q-SLOT-ANCHOR` are open. The twelve `BLOCKED_BY_DESIGN` questions are the ones whose default functions throw.

## Newly identified topic

**`Q-AVATAR-CARD-ROLE` is newly identified.** It is not a heading in `docs/OPEN_DESIGN_DECISIONS.md`. The id is a research label in these three docs only. It was not added to the question file, because this task does not edit that file.

Why it is separate: `Q-DECK-SIZE` asks whether a cap counts avatar cards, and the code already refuses to play them. Neither the question file nor the code says what `AVC_*` cards are for. Deck contents, gacha duplicates, and the hand all depend on that answer.

No other new question id is introduced. Related engine gaps (play does not resolve effects, a draw cannot be returned from `simultaneousDefeat`, the hand rejects a repeated `cardId`) are recorded inside the decisions they affect.

## Proposal package

These lines are the recommended options. They are one package: they were written to fit each other. If the Owner picks a different alternative for one row, re-read the linked rows in `docs/DESIGN_DEPENDENCY_MAP.md` before approving the neighbors. None of these lines are approved.

| Order | Id | Tier | Recommended option |
|---|---|---|---|
| 1 | Q-HAND-OWNER | Demo-blocking confirmation | One hand of 5 per side |
| 2 | Q-AVATAR-CARD-ROLE | Demo-blocking, newly identified | Collection face only. Out of the battle deck. Not its own pull |
| 3 | Q-PLAY-DESTINATION | Demo-blocking | Discard pile after the effect resolves |
| 4 | Q-DRAW-DISCARD | Demo-blocking | Deal to 5, refill to 5 each own turn, keep unplayed cards, recycle discard in play order |
| 5 | Q-AP-LEFTOVER | Demo-blocking confirmation | Refresh replaces AP with 5 |
| 6 | Q-AP-COST | Demo-blocking | Per-card integer. First content band is 1, 2, or 3. No avatar discount |
| 7 | Q-ACTION-LIMIT | Demo-blocking | AP is the only per-turn cap |
| 8 | Q-SPD-AGG | Demo-blocking | Sum of the four SPD values |
| 9 | Q-SPD-TIE | Demo-blocking | `sideA` acts first. Fixed for the battle |
| 10 | Q-HP | Demo-blocking | Per-avatar battle HP. Side loses when all four are at 0 |
| 11 | Q-TARGETING | Demo-blocking | Player picks one living ally and, for a hostile card, one living enemy |
| 12 | Q-DAMAGE | Demo-blocking | ATK uses strike + POW − DEF, then Block. DEF adds expiring Block |
| 13 | Q-SKILL | Demo-blocking | `effectId` selects an effect. First shapes: Heal and Pierce |
| 14 | Q-SIMULTANEOUS | Demo-blocking | The side that did not start wins |
| 15 | Q-TURN-LIMIT | Demo-blocking | End after both sides have taken 6 turns, then compare survivors and HP |
| 16 | Q-DECK-SIZE | Pre-alpha | Exactly 20 action cards per side, max 2 copies, avatar cards excluded |
| 17 | Q-RARITY | Pre-alpha | Common, Rare, Epic, Legendary. Drops and gem only. No damage multiplier |
| 18 | Q-UPGRADE | Pre-alpha | Short flat-stat levels on the player's equipment instance |
| 19 | Q-SLOT-ANCHOR | Pre-alpha art | Anchor name on each item, then retire the slot map |
| 20 | Q-GACHA | Live-ops | Disclosed odds, visible hard pity, duplicates feed upgrade or quantity |

### Minimum set before a playable Battle Demo

A playable Battle Demo means a local 4v4 fight that can start, put action cards in the hand of 5, spend the AP pool, resolve ATK, DEF, and Skill onto avatars, and name a winner without throwing `BLOCKED_BY_DESIGN` and without stalling forever.

That minimum set is orders 1 through 15 above.

`Q-DECK-SIZE` is not in that set. `createDeck` already stores any list, and the draw proposal only needs a scripted pile of at least 5 action cards. The lasting constructed cap matters when players build decks. A demo that wants to preview the proposed cap should script 20 anyway. That preview is recommended. It is not required for the fight to finish.

`Q-RARITY`, `Q-UPGRADE`, and `Q-GACHA` sit outside the fight. `Q-SLOT-ANCHOR` is art data. The battle demo can use authored stats directly and can skip rendering.

Approving the minimum set still does not make the demo run. `playCard` does not apply damage, and the default rules still throw until a later implementation task changes them. That task is out of scope here. Approving the sum, the hit formula, or the HP shape also leaves the starter catalogs at `valueStatus: "TBD"`. A later content pass has to set POW, DEF, and SPD together, plus battle HP, on the members the demo loads. This file does not choose those numbers.

---

## Q-HAND-OWNER

Source status: assumption, please confirm. The battle already attaches one hand per side.

Tier: Demo-blocking confirmation.

### 1. Problem definition

Hand size is already 5. The open point is who owns that hand. The four avatars could each hold cards, the side could hold one row, or the match could hold a single shared row. `createBattle` currently builds `hands[sideId]` and nothing else.

### 2. Viable alternatives

1. **One hand of 5 per side.** The player of that side plays from it on their turn.
2. **One hand of 5 per avatar.** Sixteen hands in a 4v4 fight.
3. **One hand for the whole match.** Both sides draw from and play out of the same five cards.

### 3. Advantages

1. Matches the code, matches a phone layout, and lets the player combine Tank, DPS, Magic, and Support cards in one planning row.
2. Each character's cards are obvious. A KO avatar's hand is easy to disable.
3. One row is the smallest UI. Both players always know the shared cards.

### 4. Disadvantages

1. The card does not visually "belong" to Sir Potlid or Nox Squeak until a target is chosen (`Q-TARGETING`).
2. Twenty cards, four of which act on a turn, does not fit the hand size or a phone. AP would need an owner too.
3. The two sides are opponents. A shared hand removes hidden information and makes every play a race for the same cards.

### 5. Complexity

Recommended option: implementation **low** (already built). Player cognitive load **low** ("these five cards are yours").

Alternative 2 is high on both. Alternative 3 is low to build and high to explain, because it fights the usual meaning of a hand.

### 6. Gameplay consequences

One side-hand means the turn is "spend 5 AP on this row." The four characters show up as targets and as POW/DEF sources, not as four decks. A per-avatar hand would make the 5-card rule a per-character rule and would multiply draw, discard, and gacha copies by four.

### 7. Interaction with other systems

Draw, discard, deck size, and AP all assume one owner. `Q-AVATAR-CARD-ROLE` keeps character cards out of this hand. Targeting is what connects a card in the side hand to one of the four portraits.

### 8. Recommended option

Confirm alternative 1. One hand of 5 per side. Demo and long-term.

### 9. Reasoning

The prototype, the mobile frame, and the 5 AP puzzle all assume one row. Per-avatar hands throw away the hand-size decision. A shared match hand throws away the two-team fight. The four-character fantasy is carried by targeting and stats, which is what `Q-TARGETING` and `Q-DAMAGE` are for.

### 10. Owner approval required: YES

---

## Q-AVATAR-CARD-ROLE

**Newly identified.** Not in `docs/OPEN_DESIGN_DECISIONS.md`. Research label only.

Source status: no question heading. The code has the cards and rejects them as actions.

Tier: Demo-blocking.

### 1. Problem definition

Each starter has an avatar card: `AVC_` plus the avatar id. The card repeats identity, points at that avatar's card-art asset, and is not an action. `Q-DECK-SIZE` asks whether a deck cap counts these cards. Nothing says whether they are dealt, pulled, or only displayed.

### 2. Viable alternatives

1. **Collection face.** The avatar card is the codex and card-art face of that avatar. It is not dealt, not played, and not a separate gacha item.
2. **Playable character card.** The play check would have to grow a legal play for `avatar_card`.
3. **Commander.** The card sits outside the action deck and adds a rule ("this side is led by Sir Potlid") without being played.

### 3. Advantages

1. Preserves `NOT_ACTION_CARD`, preserves the four ids, and keeps the hand of 5 for `ATK`, `DEF`, and `Skill`.
2. The portrait on the table is the card you play. Easy to explain in a TCG.
3. The party still fights, and the commander card is a single piece of identity for deck building.

### 4. Disadvantages

1. Players may expect the pretty character card to be playable. The UI has to show it in the roster, not in the hand.
2. Reverses a tested rejection. The card has no AP cost, no action type, and no effect. All of those would become new decisions.
3. The party of four is already the identity. A commander is a second identity system on top of faction, role, and the side hand.

### 5. Complexity

Recommended option: implementation **low** (leave the play check, exclude these ids from the dealt pile). Player cognitive load **low**, once the roster screen and the hand are different places.

Alternative 2 is high. Alternative 3 is medium to build and medium to teach.

### 6. Gameplay consequences

The battle deck is action cards. Sir Potlid is present because he is a party member, not because `AVC_AVT_AEG_001` was drawn. Gacha can award the avatar once. It does not also have to award a duplicate playable copy of the same person.

### 7. Interaction with other systems

`Q-DECK-SIZE` uses this answer when it asks "does the cap count avatar cards?" The proposal there is no. `Q-DRAW-DISCARD` deals action cards only. `Q-GACHA` does not roll `subjectKind: avatar_card` as its own prize. Owning `AVT_*` is the prize. The avatar card stays the face of that record.

`Q-HAND-OWNER` stays simple because these four cards never occupy the five slots.

### 8. Recommended option

Alternative 1. Avatar cards are collection and art faces. They stay out of the battle deck and out of the pull table.

### 9. Reasoning

The branch already separated `avatar_card` from `action_card` and locked the action types. The mobile hand has five slots and three action types to explain. Putting the character cards into that row spends the slots on cards the current rules cannot play. The comedy party is the four members standing in the fight. Their card art still has a job: the roster and the codex.

### 10. Owner approval required: YES

---

## Q-PLAY-DESTINATION

Source status: assumption, please confirm. A successful play removes the card from the hand and appends `playedRecords`. `discardCard` throws. The log is not a zone.

Tier: Demo-blocking.

### 1. Problem definition

After a card resolves, it needs a home. The current log proves it was played. It does not give the draw rule a pile to recycle, and it does not leave a permanent object on a board. The question asks whether the card goes to a discard pile, stays in play, or leaves the match.

### 2. Viable alternatives

1. **Discard pile after resolution.** `playedRecords` remains the log. The card object also moves to that side's discard zone.
2. **Stays in play.** The card remains on the table and keeps affecting the fight until a later rule removes it.
3. **Leaves the match.** The card is gone for the rest of the battle. It does not come back.

### 3. Advantages

1. Matches "play, resolve, done," which fits ATK, DEF, and Skill as actions rather than minions. The discard pile is the fuel for a recycle rule.
2. A DEF card sitting on a portrait is easy to see. Permanent auras have a clear object.
3. The smallest runtime. No second zone, no recycle rules.

### 4. Disadvantages

1. The player must learn two piles. The log and the discard pile have to stay distinct so a future UI does not draw from the log.
2. The schema has no board and no duration. Every card would need "how long does this stay?" That is a new rules layer on a phone.
3. A 6-turn fight (`Q-TURN-LIMIT`) with a small pile runs out of cards. The last turns are empty hands.

### 5. Complexity

Recommended option: implementation **medium** (a real zone the code does not have yet). Player cognitive load **low** ("played cards go to discard").

Alternative 2 is high. Alternative 3 is low to build and harsh to play.

### 6. Gameplay consequences

Cards are moments, not creatures. Sir Potlid's guard happens, then the card is spent. Getting it back is a property of the draw rule, not of the card staying on the table. A later keyword could exile a card so it skips the discard pile. That keyword is not part of this proposal.

### 7. Interaction with other systems

`Q-DRAW-DISCARD` recycles this pile. `Q-DAMAGE` uses expiring Block numbers instead of a DEF card that remains in play. If the Owner picks alternative 2, the Block model in `Q-DAMAGE` has to be rewritten. `playedRecords` stays a log either way. The hand forbids a second copy of the same `cardId`, so a recycled card needs a distinct instance id when it is dealt again (`Q-DECK-SIZE`).

### 8. Recommended option

Alternative 1. The card resolves, then enters that side's discard pile.

### 9. Reasoning

The action types are verbs. A board of permanents is a different game, closer to a minion CCG, and this schema does not have one. Burning the card (alternative 3) makes the small mobile deck run dry. Discard-after-resolution is the usual action-card loop and it keeps a 5-card hand supplied for a multi-round fight.

### 10. Owner approval required: YES

---

## Q-DRAW-DISCARD

Source status: BLOCKED_BY_DESIGN. `drawCards` and `discardCard` throw. Starting a battle does not draw.

Tier: Demo-blocking.

### 1. Problem definition

Hands start empty. A play removes the card. The player needs to know when cards enter the hand, how many, what happens when the draw pile is empty, and whether a played card can return. `addCard` can script a hand in a test. A fight that lasts more than five unrepeatable cards needs a cycle.

### 2. Viable alternatives

1. **Refill, keep, recycle in order.** Both sides draw to 5 at battle start, after initiative is chosen. At the start of each later own turn, draw until the hand is 5. Unplayed cards stay. Played cards sit in the discard pile (`Q-PLAY-DESTINATION`). When a draw needs a card and the draw pile is empty, the discard pile becomes the draw pile, oldest discarded card first. No random shuffle. If both piles are empty, the draw stops.
2. **Fresh hand, discard the rest, logged shuffle.** Each turn draws a new hand of 5 and unplayed cards go to discard at end of turn. An empty draw pile is refilled by a shuffle whose seed is written into the battle log.
3. **Draw 1, no recycle.** Opening hand 5, then one card at the start of each own turn if the hand has room. Empty pile means no more cards. `testOnlyDrawOne` is this shape for a single draw. It is a stub, not this alternative's approval, and it does not define the opening hand.

### 3. Advantages

1. The hand of 5 is always the planning view. A 3-cost card you could not afford remains for next turn. The battle log stays deterministic with no new RNG. Played cards return, so a short fight does not end in an empty hand.
2. Familiar from deckbuilders. High variety. The logged seed keeps the determinism test honest.
3. Easy to explain. Deck size is felt immediately, because the pile runs out.

### 4. Disadvantages

1. A deterministic recycle is predictable. After the first cycle, a careful player knows the order. That is a puzzle, and it is less "shuffly" than a TCG.
2. With 5 AP the player often cannot play the whole hand, so alternative 2 throws away paid-for cards every turn. A logged shuffle is new machinery in a battle core that currently has no RNG.
3. With about two plays a turn and a six-turn fight, the opening 5 plus one per later turn is a small number of cards. Turns 5 and 6 can be empty. That pushes the whole fight onto `Q-TURN-LIMIT` and a large deck.

### 5. Complexity

Recommended option: implementation **medium** (opening deal, refill, two zones, instance ids). Player cognitive load **low to medium** (one sentence, plus "the discard comes back in the order you played").

Alternative 2 is medium to high. Alternative 3 is low to build and medium to enjoy, because empty turns need an explanation.

### 6. Gameplay consequences

Turn 1 is a full row. Later turns top the row back up. Unplayed cards are a plan, not waste. A side that plays two cards a turn draws about two replacements, so a pile of 20 lasts through a six-turn fight with cards left over. A side that dumps five 1-cost cards redraws five and will see the recycle during the fight. Both paces work with the proposed deck size. They fail on a tiny pile.

The enemy's hand can be hidden. Both sides still receive an opening hand at battle start, including the side that acts second, so the player's row is visible during the enemy's first turn.

There is no mulligan in this proposal.

### 7. Interaction with other systems

Depends on `Q-HAND-OWNER`, `Q-AVATAR-CARD-ROLE`, `Q-PLAY-DESTINATION`, and a pile of action cards. The lasting size of that pile is `Q-DECK-SIZE`. The demo can pass a scripted list of at least 5 action cards to `createDeck` without that cap existing.

`addCard` rejects a repeated `cardId`. Two copies of one catalog card, and a recycled instance, need distinct instance ids when they sit in the hand. The catalog identity is what a future copy limit counts.

`src/` has no RNG. Alternative 1 keeps that property. A shuffle belongs only to alternative 2, and only with a seed stored in the log.

Sample ids `ACT_SCHEMA_*` stay out of the demo pile. They are not content.

### 8. Recommended option

Alternative 1.

### 9. Reasoning

The hand size is the resource the player can see. Refilling it respects that. Keeping unplayed cards respects 5 AP: the player should not be punished for a 3-cost card that did not fit this turn. A deterministic recycle fits the tested "no RNG in the battle" property and still lets a small mobile deck survive six turns. A logged shuffle can be a later upgrade if the Owner wants surprise. It is a worse first demo, because it adds hidden order to a comedy puzzle.

Empty-pile behavior is part of the recommendation: recycle discard in discard order; if discard is also empty, draw nothing.

### 10. Owner approval required: YES

---

## Q-AP-LEFTOVER

Source status: assumption, please confirm. The code already sets the active side's AP to 5 at the start of their turn. Leftover AP on that side is replaced on their next turn. The other side keeps its current number. Before a side's first turn, AP is null.

Tier: Demo-blocking confirmation.

### 1. Problem definition

The question is whether "refresh" means "set to 5" or "add 5 to whatever was unspent." The code does the first. A demo that shows a turn counter of 5 would be teaching a rule the Owner has not confirmed.

### 2. Viable alternatives

1. **Replace.** Your turn starts at 5, even if you ended at 0, 2, or null.
2. **Bank.** Your next turn starts at leftover + 5.
3. **Bank with a cap of 10.** Leftover + 5, and the result cannot go above 10. A cap of 5 would collapse into alternative 1, so 10 is the version that is actually different.

### 3. Advantages

1. The number 5 means the same thing every turn. The phone can show five pips. It matches the current code and the usual refreshed-energy pattern (Hearthstone mana and Slay the Spire energy, in general: unspent points do not stockpile in the base games).
2. A player can save for a huge turn. High-cost cards become more attractive.
3. A middle ground. Hoarding exists and has a ceiling.

### 4. Disadvantages

1. A 4-cost or 5-cost card must be played on a fresh turn. There is no "save two turns" plan. The proposed first card band does not need that plan.
2. AP stops being a per-turn puzzle. Turns get longer as the bank grows. A mobile fight drifts.
3. The player must track a growing number and a cap. Two rules replace one.

### 5. Complexity

Recommended option: implementation **low** (already the code). Player cognitive load **low**.

Banking is low to code and medium to plan around. A cap is slightly more of both.

### 6. Gameplay consequences

Every turn is a fresh 5. Ending at 1 is a spent turn, not an investment. That keeps six-turn fights short and keeps the hand puzzle inside one screen.

### 7. Interaction with other systems

`Q-AP-COST` can use 1–3, and a later card can cost 4 or 5, because a fresh turn can pay 5. A cost of 6 is unplayable under alternative 1. `Q-ACTION-LIMIT` can stay "AP only" because the pool resets. Banking would force the cost band and the action cap to be redesigned, or one turn could dump a stockpile into the whole hand.

### 8. Recommended option

Confirm alternative 1. Refresh replaces leftover AP with 5.

### 9. Reasoning

Base AP is 5 so that a turn is a small, repeatable puzzle. Banking changes it into a stockpile and makes the four-character fight slower on a phone. The code, the progress report, and the mobile frame already point the same way. This item is in the demo set because the pip row is player-visible, not because the engine throws.

### 10. Owner approval required: YES

---

## Q-AP-COST

Source status: BLOCKED_BY_DESIGN. Sample cards use `apCost: null` and `costStatus: "TBD"`. `resolveApCost` throws on a null cost. A card that already carries a non-negative integer uses that integer and does not call the rule.

Tier: Demo-blocking.

### 1. Problem definition

The fight needs a price for ATK, DEF, and Skill. The price could be one number per type, a number printed on each card, or a number the chosen avatar then modifies. The schema can store a per-card integer. It has no avatar-modifier field. No sample carries a real price, and the schema examples must not be given one by this document.

### 2. Viable alternatives

1. **Per-card integer.** The Owner sets `apCost` on each real action card. No avatar changes it. Proposed content band for the first approved cards: 1, 2, or 3. No 0-cost card in that set. No card above 5, because AP does not bank.
2. **One cost per type.** Every ATK shares a cost, every DEF shares a cost, every Skill shares a cost.
3. **Avatar modifier.** The printed cost is then raised or lowered by the ally chosen as the source.

### 3. Advantages

1. Two ATK cards can have different weights. The schema path for an integer cost already exists. The hand of 5 plus a pool of 5 is a small knapsack, which is the interesting mobile puzzle.
2. Trivial to remember. "Attacks cost 2" fits on a loading tip.
3. Sir Potlid could make guards cheaper and Nox Squeak could make attacks cheaper. The characters modify the economy directly.

### 4. Disadvantages

1. Each card must show its cost. The first content pass has to pick numbers one card at a time. A 0-cost card would make `Q-ACTION-LIMIT` insufficient.
2. Every attack feels like the same slot. Card design loses a dial, so power differences have to hide in the effect text.
3. Affordability depends on targeting, so the player must pick an ally before the game can say "you cannot pay." More taps, and a KO ally changes the price of a card already in hand.

### 5. Complexity

Recommended option: implementation **low** once integers exist (the reader is already there). Authoring cost is real and is content, not engine. Player cognitive load **low**: the number is on the card, the pool is 5.

Alternative 2 is the lowest build and a flatter game. Alternative 3 is medium to high.

### 6. Gameplay consequences

A turn usually plays two or three cards from the row of five. A 1-cost card is a filler, a 2-cost card is the standard, a 3-cost card is most of the turn. The player still has unspent choices left in hand, which is what the refill rule keeps.

Proposed guidance, not a price list: a Pierce skill that ignores DEF should cost more than an ATK with the same printed strike. Otherwise Pierce replaces ATK. This document assigns no price to `ACT_SCHEMA_ATK`, `ACT_SCHEMA_DEF`, or `ACT_SCHEMA_SKILL`.

### 7. Interaction with other systems

Depends on `Q-AP-LEFTOVER` staying a replace-to-5 rule. Feeds `Q-ACTION-LIMIT`: AP can be the only cap only while 0-cost cards are absent. Does not depend on rarity (`Q-RARITY` proposal: rarity does not change cost). Avatar discounts would have to be decided before targeting, so alternative 3 couples this item to `Q-TARGETING`.

### 8. Recommended option

Alternative 1. Per-card non-negative integer, first content band 1–3, no avatar modifier.

### 9. Reasoning

The engine already treats a printed integer as the cost. Using that dial keeps ATK, DEF, and Skill free to vary inside the 5 AP puzzle. A single cost per type is a good tutorial restriction and a weak long-term game. Avatar discounts are a second price the phone would have to explain, on top of POW and DEF, which already make the four characters matter.

The band 1–3 is a proposed content constraint. It is not a measured average and not a generated card list.

### 10. Owner approval required: YES

---

## Q-ACTION-LIMIT

Source status: BLOCKED_BY_DESIGN. A play that can be paid for still calls `perTurnActionLimit`, which throws. The AP check does not invent a "one card" cap.

Tier: Demo-blocking.

### 1. Problem definition

After AP is enough, is there another cap? Options include no extra cap, a hard card count, or a per-type cap such as one Skill per turn.

### 2. Viable alternatives

1. **AP is the only cap.** The hook returns success whenever the AP check already passed.
2. **One card per turn.**
3. **AP, plus at most one Skill per turn.** ATK and DEF are limited only by AP.

### 3. Advantages

1. One resource. The 5 on the screen is the whole rule. Several cheap cards can chain, which lets a hand of 5 express a plan.
2. Predictable turns and very few taps. Easy on a phone.
3. Stops a hand of heals or pierces from ending the fight in one turn, while cheap ATK cards can still combine.

### 4. Disadvantages

1. Five 1-cost cards can empty the hand in one turn. That is strong, and it is allowed on purpose. A future 0-cost card breaks the cap entirely.
2. Most of the 5 AP is "can you afford the one card you picked." The hand size stops mattering after the first play.
3. A hidden type cap. The player pays AP and then learns the second card was illegal because of its type.

### 5. Complexity

Recommended option: implementation **low** (the hook already exists; the proposed function allows the play). Player cognitive load **low**.

Alternative 2 is low and wasteful of the AP rule. Alternative 3 is low to code and medium to explain.

The stub `testOnlyNoExtraActionLimit` returns success and is labelled TEST-ONLY. This proposal is the same shape. The stub is not an approval.

### 6. Gameplay consequences

The turn ends when the player is done or when the next card costs more than the remaining pips. Playing five 1-cost cards is a legal all-in. Playing one 3-cost card and stopping with 2 left is also legal. Both are readable.

### 7. Interaction with other systems

Depends on `Q-AP-COST` excluding 0-cost cards from the first set, and on `Q-AP-LEFTOVER` resetting the pool. `Q-DRAW-DISCARD` keeps the unplayed remainder, so "I could not pay" is not "I lose the card." If the Owner wants alternative 2, the cost band should be rebuilt around one payment per turn.

The hook should stay in the engine even if the proposed rule is "always allow." A later keyword cap then has a place to live.

### 8. Recommended option

Alternative 1. No per-turn card cap beyond AP.

### 9. Reasoning

Five AP and a five-card hand are the specified puzzle. A one-card turn deletes that puzzle. A Skill sub-cap is a reasonable later keyword and a poor global rule for a first demo, because the type names are already enough to learn. Comedy turns should be "what can I afford," not "which hidden quota did I hit."

### 10. Owner approval required: YES

---

## Q-SPD-AGG

Source status: BLOCKED_BY_DESIGN. The engine compares two finite numbers from `rules.teamSpd(side)` and does not combine the four avatar SPD values itself.

Tier: Demo-blocking.

### 1. Problem definition

"The team with the highest SPD starts" needs one number per side. The four SPD values could be added, or the side could be represented by its fastest avatar, or by its slowest.

With party size fixed at 4, the **average** ranks sides in the same order as the **sum**, and it ties in the same cases. Average is not a separate alternative for "who goes first." It would become different only if the two sides contributed different counts of avatars. They do not.

### 2. Viable alternatives

1. **Sum** of the four avatars' SPD.
2. **Highest** single SPD on the side.
3. **Lowest** single SPD on the side. The slowest member gates the team.

### 3. Advantages

1. Every member's SPD matters, including the Tank and the Support. Gear that adds SPD (`Q-UPGRADE`) matters for the whole party. The number is easy to show as "team speed."
2. One fast DPS pulls the whole comedy team ahead. Easy to feel.
3. A slow poke is a real team cost. Formation planning matters.

### 4. Disadvantages

1. A slow Tank drags the party. Players may resent SPD on a character whose fantasy is to be heavy. The payoff has to be HP and DEF, which are separate proposals.
2. Three of the four SPD numbers do nothing for initiative. Gacha SPD on the Tank is a dead stat. Ties become more common if many avatars share a low number and only one racer matters.
3. Players will avoid SPD on purpose, or avoid slow characters. A printed stat becomes a liability.

### 5. Complexity

Recommended option: implementation **low** (return one sum from the rule). Player cognitive load **low** ("add the four speeds").

The engine must keep calling the rule. It must not grow its own sum. The test `testOnlyTeamSpdSum` adds the four numbers and is explicitly not the game's rule. This proposal recommends that arithmetic. It does not adopt the stub.

### 6. Gameplay consequences

A party of Sir Potlid, Nox Squeak, Madame Meteor, and Sister Plaster has one initiative number. Raising any one of them can flip the first turn. The first turn is stored and not recomputed when someone later reaches 0 HP, which matches `createBattle` calling `teamSpd` once.

### 7. Interaction with other systems

`Q-SPD-TIE` handles equal sums. `Q-SIMULTANEOUS` and `Q-TURN-LIMIT` use "who started," so they depend on this number. Equipment that changes SPD changes the next battle's start, not the current one. HP and KO do not remove a member from this sum under the current call site.

### 8. Recommended option

Alternative 1. Team SPD is the sum of the four avatar SPD values.

### 9. Reasoning

The party is four characters and the card frame prints SPD for each of them. Highest-single SPD throws away three prints. Lowest-single SPD makes a stat the player wants to dump. The sum makes the printed number true for everyone, and at a fixed party size it is the same decision as an average without a second word to teach.

### 10. Owner approval required: YES

---

## Q-SPD-TIE

Source status: BLOCKED_BY_DESIGN. Equal team SPD throws. The engine does not prefer side A, a lower avatar id, or a coin flip unless the rule says so.

Tier: Demo-blocking.

### 1. Problem definition

When the two team numbers are equal, someone still has to move first. The result is computed once today. The question also asks whether that winner should stay first for the whole battle.

### 2. Viable alternatives

1. **`sideA` acts first.** The result is `startingSideId` and is never recomputed.
2. **Higher sum of POW, then `sideA`.** Still deterministic. Uses a second stat.
3. **Logged coin flip.** A seed stored in the battle log picks the side. The battle core stays free of hidden randomness only if that seed is an input, not a private `Math.random`.

### 3. Advantages

1. One sentence. No new stat. Matches the one-shot code. The demo chooses the seat: put the human on `sideA` and the human moves first on a tie.
2. A slow, heavy team can still win a pure speed tie by being stronger. No seat bias until POW is also tied.
3. No seat bias. Fair for a later competitive match.

### 4. Disadvantages

1. Seat bias. Whoever is passed as `sideA` wins every true tie. The engine does not know who the human is. The bias moves if a caller swaps the seats.
2. POW then does two jobs: damage and initiative. A high-POW Tank team steals the first turn from a faster-built team that happened to tie. SPD stops being the whole story.
3. New machinery, a log field, and a player-facing "coin flip" in a prototype whose tested property is "no RNG in `src/`."

### 5. Complexity

Recommended option: implementation **low**. Player cognitive load **low**, plus one sentence of seat bias that the demo must show ("you are side A, ties go to you").

Alternative 2 is low to code and muddy to explain. Alternative 3 is medium.

Recomputing initiative every round is not recommended. It would be new code, and a mid-fight SPD change is not in the combat proposals.

### 6. Gameplay consequences

Equal team speed gives the first seat to side A for the whole fight. Turns still alternate. The side that wins the tie also "started," which matters for `Q-SIMULTANEOUS` and `Q-TURN-LIMIT`: those proposals give the *other* side the combat tie, so winning the speed tie is not also winning a double KO.

### 7. Interaction with other systems

Depends on `Q-SPD-AGG`. Independent of damage numbers except under alternative 2. A future competitive mode should replace alternative 1 with alternative 3 rather than with an unlogged roll. That replacement is not required for the demo.

### 8. Recommended option

Alternative 1. `sideA` goes first on a tie. Fixed for the battle. Demo setup puts the human player on `sideA`.

### 9. Reasoning

The first demo needs a stable, explainable answer that does not borrow POW and does not add RNG to a deterministic battle. Seat bias is real and should be printed in the demo, not hidden. A logged coin flip is the right later answer for two humans. It is extra machinery before the game has two humans.

### 10. Owner approval required: YES

---

## Q-HP

Source status: BLOCKED_BY_DESIGN. Catalog stats are POW, DEF, and SPD. Battle members have no HP field. `isSideDefeated` throws, and `createBattle` calls it immediately, so a battle cannot be constructed on the default rules.

Tier: Demo-blocking.

### 1. Problem definition

The fight needs a health pool and a defeat condition. The pool might be per avatar or per side. Defeat might mean every avatar is down, one avatar is down, or some other condition. Equipment might change the pool. That last part is tied to upgrade and can wait.

### 2. Viable alternatives

1. **Per-avatar HP, defeat when all four are at 0.** HP and max HP are battle fields. They are not new keys inside `stats`. A member at 0 is KO. KO members are illegal targets. Damage floors HP at 0.
2. **One shared party HP pool.** Avatars do not fall over. The side loses when the pool hits 0.
3. **Per-avatar HP, defeat when any one avatar is at 0.**

### 3. Advantages

1. The Tank can have more HP than the DPS when content is written. Focus fire matters. The fight continues after Sir Potlid falls, so Support and DPS still get a scene. The shape "all members down" matches the *shape* of the TEST-ONLY predicate `testOnlySideDefeatedWhenAllKo`. That stub uses a `markers.ko` flag and is not an HP rule. This proposal does not adopt the stub.
2. One bar is the clearest phone UI. Hearthstone's single hero health is the familiar version of this.
3. Extremely tense. Every character is a loss condition.

### 4. Disadvantages

1. Four bars use more UI than one. The Owner still has to author four HP numbers later. This file does not author them.
2. Roles barely matter for survival. The Tank's job becomes "a label on a shared bar."
3. Losing Sister Plaster loses the match. That is harsh for a comedy tutorial and for a four-character party.

### 5. Complexity

Recommended option: implementation **medium** (battle fields, a predicate, KO checks). Player cognitive load **medium** (four portraits with bars, one rule: "down all four").

Alternative 2 is simpler UI and a weaker party fantasy. Alternative 3 is the same build as alternative 1 with a harsher predicate.

### 6. Gameplay consequences

A side is out only when the last portrait falls. Spreading damage is slow. Focusing one portrait is how you remove a healer or a DPS. The Tank's extra HP, once the Owner writes it, is what makes them the bad focus target.

Zero HP is a KO, not a negative number. Healing (`Q-SKILL`) cannot cross 0 under the Skill proposal, so KO is sticky for the demo.

**ILLUSTRATIVE range, not a stat line:** if a typical hit removes about 4 to 8 HP, a multi-round fight wants avatar HP roughly in the 20–40 band, Tank at the high end and DPS at the low end. No starter id receives a number here.

### 7. Interaction with other systems

`Q-DAMAGE` writes this field. `Q-TARGETING` refuses KO portraits. `Q-SKILL` heals it up to max HP. `Q-SIMULTANEOUS` handles both sides at 0. `Q-TURN-LIMIT` compares remaining HP. `Q-UPGRADE` might raise max HP later. The demo does not.

`createBattle` calls the defeat check before any card is played. Both sides need starting HP above 0 or the fight can end at creation.

`playCard` does not call `evaluateOutcome`. A future demo loop has to check defeat after resolving a card. Otherwise a lethal hit sits on the table until `endTurn`, and the player can keep spending AP after the fight is already over. That call-site change is implementation, not part of this task. The proposal is: check after each resolved card, and keep the check inside `endTurn`.

### 8. Recommended option

Alternative 1. Each avatar has their own HP. The side loses when all four are at 0.

### 9. Reasoning

The party is four visible characters with roles. A shared bar erases the Tank's survival fantasy. "Lose when any one falls" erases the reason to bring four. Per-avatar HP with a full-party defeat keeps focus fire meaningful and keeps the joke of the last plaster-nun standing. HP stays out of `stats` because the schema and `DATA_SCHEMA.md` define exactly three stats and say HP is not one of them.

### 10. Owner approval required: YES

---

## Q-TARGETING

Source status: open. Already in `docs/OPEN_DESIGN_DECISIONS.md`. **Not newly identified.**

`playCard(state, sideId, cardId)` does not take a target. The engine does not throw for a missing target. It also cannot express one.

Tier: Demo-blocking.

### 1. Problem definition

There are four avatars on each side. A card needs a legal subject. The open questions are: does every card choose a target, can a card hit several avatars, and who is a legal target? There is no front row, no formation rule, and no "random enemy" helper in the code.

### 2. Viable alternatives

1. **Explicit single subject.** The player taps one living ally. Hostile cards then take one living enemy. Patterns such as "all enemies" wait.
2. **Printed pattern.** Each card declares single, all enemies, all allies, or no target.
3. **No choice.** An ATK hits a random living enemy, or the first member in the array.

### 3. Advantages

1. One tap pattern covers the demo. The player can focus the plaster support or the pot-lid tank. Deterministic. Legal sets are easy to grey out.
2. AoE and auras are how faction identity grows later. Celestial Nexus can be the splash faction.
3. Fast. No target step.

### 4. Disadvantages

1. ATK and DEF cost an ally tap plus, for ATK, an enemy tap. A turn of several cards is a run of taps.
2. Every card needs pattern text. The first demo's UI needs multi-select highlighting before the first fight is fun.
3. Random targets break the deterministic log unless the roll is logged. "Always the first array member" is deterministic and plays like a bug, because array order is not a taught formation.

### 5. Complexity

Recommended option: implementation **medium** (`playCard` needs target ids, and the UI needs portrait buttons). Player cognitive load **medium** and teachable: "tap your character, tap theirs."

Alternative 2 is high for a first demo. Alternative 3 is low to build and poor to play.

### 6. Gameplay consequences

Proposed legal sets, all single target:

| Card | Ally tap | Enemy tap |
|---|---|---|
| ATK | Living ally, the POW source | Living enemy, the victim |
| DEF | Living ally, DEF source and Block recipient | None |
| Heal | Living ally, the recipient | None |
| Pierce | None | Living enemy |

A portrait at 0 HP is not a legal tap. You cannot ATTACK an ally, guard an enemy, or heal an enemy in this proposal. There is no revive in the demo set, so a KO ally stays an illegal tap.

DEF uses one tap, not two: the ally who braces is the ally who receives Block. You cannot move Sir Potlid's DEF onto Sister Plaster. You can brace Sir Potlid, or heal Sister Plaster. That is the accessible version. The more tactical version (source and recipient are different taps) is listed here as a rejected extra, not as a fourth alternative: it adds a tap and a concept ("whose stat, whose body") the first demo does not need.

### 7. Interaction with other systems

`Q-DAMAGE` and `Q-SKILL` use these taps as their inputs. `Q-HP` defines KO. `Q-ACTION-LIMIT` and `Q-AP-COST` stay independent of the tap under the recommended cost rule (no avatar discount). If the Owner picks shared party HP, this table has to be rewritten, because there is no KO portrait to protect.

`Q-SKILL` alternative "splash" would reopen alternative 2. The recommended Skill shapes stay single-target so this table holds.

No proposal here invents a front line. Member array order is storage order only.

### 8. Recommended option

Alternative 1, with the legal sets in the table above.

### 9. Reasoning

Four portraits are the reason targeting exists. A random hit makes the Tank's HP and the Support's heal into luck. A full pattern language is the right growth path after the demo has one working tap. Single explicit targets keep the battle deterministic, keep the phone controls on the portraits, and make focus fire the actual skill.

### 10. Owner approval required: YES

---

## Q-DAMAGE

Source status: BLOCKED_BY_DESIGN. `resolveEffect` on ATK or DEF calls `rules.damage`, which throws. `playCard` spends AP and does not change POW, DEF, or SPD.

Tier: Demo-blocking.

### 1. Problem definition

POW, DEF, and a card have to become a number, or the three printed stats are decoration (SPD is already spoken for by initiative). The open question also asks what a DEF card changes: the next hit, a shield, or something else, and whether damage may be zero.

### 2. Viable alternatives

1. **Strike, then Block.** ATK raw = printed strike + source ally POW − target DEF, floored at 0. Block on the target absorbs that raw damage first. Leftover raw reduces HP. Leftover Block stays until it expires. A DEF card does not change the DEF stat. It adds Block on the chosen ally equal to printed guard + that ally's DEF. Block expires at the start of that side's next turn, unused portion included. Damage may be zero. HP does not go below 0.
2. **Permanent stat.** A DEF card adds to the target's DEF for the rest of the battle. ATK uses the same subtraction with no Block.
3. **Card number only.** Printed strike is the HP loss. POW and DEF are not in the hit. They remain initiative and collection numbers.

### 3. Advantages

1. POW makes the chosen attacker hit harder. DEF makes the chosen victim soak a hit. A DEF *card* is a visible shield that ends, so the guard decision is for this round, not forever. Zero damage is how a strong guard can fully stop a weak hit. Stats on the member are not mutated, which matches today's "play does not change POW, DEF, or SPD."
2. Simple persistence. One number goes up. No expiry to animate.
3. The smallest formula. Card text is the whole hit.

### 4. Disadvantages

1. Two combat numbers (HP and Block) plus the three stats. The player has to see Block disappear on their next turn. Printed strike and printed guard are not schema fields today.
2. DEF cards snowball. Two guards and a Tank become unhittable for the rest of the fight, which pushes every answer onto `Q-TURN-LIMIT` or onto Pierce.
3. The card frame prints POW and DEF. Alternative 3 makes those prints false during the fight. The four roles stop mattering per hit.

### 5. Complexity

Recommended option: implementation **medium** (battle Block field, expiry at turn start, two printed integers that do not exist on the schema yet). Player cognitive load **medium**: "attack is strength plus POW, minus their DEF, then their shield."

Alternative 2 is lower to build and worse to tune. Alternative 3 is low and empty.

**ILLUSTRATIVE, not a card and not an avatar:** ally POW 4, printed strike 3, target DEF 2, Block 0 → raw 5, HP loss 5. The same hit into Block 2 → HP loss 3, Block left 0. A raw of 0 leaves Block unchanged.

### 6. Gameplay consequences

The player taps Nox Squeak to hit hard, or Sir Potlid to brace for a large Block, because his DEF feeds the shield. Madame Meteor's Pierce (`Q-SKILL`) is the hit that skips the DEF subtraction and still meets Block, so a guard card still answers magic. A fully blocked hit is a legal 0. That can stall, which is why `Q-TURN-LIMIT` is in the demo set.

Block from several DEF cards on the same ally adds together. It all expires together at the start of that side's next turn. Expiry is per side, not per card, because this proposal does not leave the card in play.

### 7. Interaction with other systems

Depends on `Q-HP`, `Q-TARGETING`, and `Q-PLAY-DESTINATION` (the card does not stay on the table; Block is the leftover). Feeds `Q-SKILL` Pierce, which reuses the Block step and skips the DEF step. `Q-AP-COST` has to price Pierce above a same-strike ATK so the skip is paid for.

POW and DEF stay catalog stats. Playing a card still does not write them. Equipment modifiers, once `Q-UPGRADE` exists, are already inside the stat the battle reads. They are not a second subtraction.

`resolveEffect` is separate from `playCard`. A future loop calls both. This proposal does not wire them.

### 8. Recommended option

Alternative 1. Zero damage is allowed.

### 9. Reasoning

The three printed stats need one job each: POW hits, DEF soaks, SPD starts. A DEF card that permanently raises DEF makes the soak grow without a turn-by-turn choice. A card-only hit wastes the prints the frame already reserved. Expiring Block is the version a phone can show as a shield icon that clears when your turn comes back, which is the same general shape as base-game block in Slay the Spire, used here as a comparison rather than a copied ruleset.

Printed strike and printed guard are proposal words for future content fields. They are not keys in the schema today, and this task does not add them.

### 10. Owner approval required: YES

---

## Q-SKILL

Source status: BLOCKED_BY_DESIGN. `resolveEffect` on a Skill calls `rules.skillEffect`, which throws. The sample Skill card has `effectId: null`.

Tier: Demo-blocking.

### 1. Problem definition

Skill is the third specified action type. The question asks what it does, whether each faction has its own effect, and who chooses the target. A demo hand that contains a Skill cannot resolve it until this has an answer. A demo pile that contains no Skill card is also an answer, and it is recorded as a scope cut below.

### 2. Viable alternatives

1. **`effectId` selects a designed effect.** No single Skill formula. The first two approved shapes are Heal and Pierce, both single-target. Further shapes are later content under the same rule. Factions do not exclusively own a Skill.
2. **Skill is a larger ATK.** Same formula as `Q-DAMAGE`, with a bigger printed strike and a higher AP cost.
3. **Faction passive.** Each faction has one innate effect. The Skill card only triggers that faction's passive. The player does not pick among effects.

### 3. Advantages

1. Magic and Support become different verbs from DPS. Heal gives Sister Plaster's role a job. Pierce gives Madame Meteor's role a job that DEF cards still interact with, because Block still applies. `effectId` is already a field.
2. One formula to teach. Skill is "the expensive attack."
3. Faction identity is automatic. The player cannot mis-build a Celestial deck into a heal deck.

### 4. Disadvantages

1. Two effect sentences to learn, plus the ATK sentence. Someone has to author the effect table. The sample card stays `effectId: null` until that content exists.
2. Skill is redundant with ATK. The third type does not earn its place. Sanctuary Order has no support verb.
3. Hidden rules. The card text is "do the faction thing," which is a bad phone tooltip, and a side whose Support is the fantasy still cannot carry a heal if the passive is locked to whoever is standing.

### 5. Complexity

Recommended option: implementation **medium** (a small effect table, two functions). Player cognitive load **medium**: two extra sentences.

Alternative 2 is low and flat. Alternative 3 is medium to build and high to read.

A legal smaller demo answer: the scripted pile contains only ATK and DEF, and Skill stays blocked until the effect table exists. That closes the demo. It does not answer the design. The recommendation below is the design answer.

### 6. Gameplay consequences

Proposed Heal: choose one living ally (`Q-TARGETING`). Restore a printed amount, capped at that ally's max HP. A KO ally is not a legal target. No revive in this set.

Proposed Pierce: choose one living enemy. Raw damage is the printed strike. Do not add POW. Do not subtract DEF. Then apply Block exactly as ATK does. A Pierce into a large Block can be 0.

Any side may put either effect in its deck. The content bias, not a hard lock, is:

- Aegis Dominion, Sir Potlid, Tank: DEF cards, high DEF, high HP when numbers are written.
- Phantom Blades, Nox Squeak, DPS: ATK cards, high POW.
- Celestial Nexus, Madame Meteor, Magic: Pierce.
- Sanctuary Order, Sister Plaster, Support: Heal.

Those are content directions for a later card pass. They are not restrictions, and they are not new card ids.

### 7. Interaction with other systems

Depends on `Q-HP`, `Q-TARGETING`, and `Q-DAMAGE`'s Block step. `Q-AP-COST` should price Pierce above a same-strike ATK. Heal pricing should sit in the 1–2 part of the band so a support turn can heal and still do something else inside 5 AP. That is guidance, not a price list.

Faction locks would change `Q-DECK-SIZE` (a 20-card deck becomes four mandatory packages) and would change targeting (a KO faction might make a card unplayable). The recommendation avoids that.

`ACT_SCHEMA_SKILL` remains a schema example with `effectId: null`.

### 8. Recommended option

Alternative 1. Heal and Pierce are the first two shapes. No faction lock.

### 9. Reasoning

The four role strings are already Tank, DPS, Magic, and Support. ATK and DEF cover DPS and Tank. Skill is the open verb for Magic and Support. Making Skill a bigger ATK wastes Support. Making it a faction passive hides the joke inside a rule the card does not print. Two printed effects, usable by any side, keep the hand readable and let a gacha card pool mix heals into a Phantom Blades deck later if the Owner wants that comedy.

### 10. Owner approval required: YES

---

## Q-SIMULTANEOUS

Source status: BLOCKED_BY_DESIGN. If both defeat predicates are true, `simultaneousDefeat` throws. The engine does not declare a draw. A supplied rule must return `{ winnerSideId }` set to one of the two side ids. Anything else is rejected. `endTurn` rolls the turn back when this throws.

Tier: Demo-blocking.

### 1. Problem definition

Both sides can become defeated together. The fight still needs one result. With the recommended single-target kit this is rare: one card drops one portrait, and a side only loses when all four are at 0. It still crashes the turn if it happens, including at `createBattle` if both sides start already defeated. Splash, recoil, or a bug can cause it later.

### 2. Viable alternatives

1. **The side that did not start wins.** Return that side id.
2. **Overkill, then the same fallback.** The side that caused more HP loss in that resolution wins. If the HP loss is equal, or there is no resolution to measure, the side that did not start wins.
3. **Draw.** The battle ends with no winner.

### 3. Advantages

1. One sentence. Deterministic. Fits the current return type. The side that won initiative already moved first, so the tie goes the other way.
2. A double KO still remembers who hit harder. Splash cards feel fair.
3. The fairest story when both parties actually fall over.

### 4. Disadvantages

1. Ignores overkill. A huge finishing hit and a tiny one are the same if both sides reach 0.
2. The player must understand overkill. The rule has to stash "HP lost in this resolution" on the battle, which does not exist today. `simultaneousDefeat` currently receives the state only.
3. The current `evaluateOutcome` path rejects a result that is not a side id. `decidedOutcome` always writes victory and defeat. A draw needs an engine change and a UI state this prototype does not have.

### 5. Complexity

Recommended option: implementation **low** (return the other side id). Player cognitive load **low**.

Alternative 2 is medium. Alternative 3 is medium in code and higher in product surface.

### 6. Gameplay consequences

A double defeat crowns the side that lost the speed check. Players who care about the mirror match still have a winner for ladders and for the demo's result screen. Comebacks remain possible in the ordinary way (HP), because this rule fires only when both predicates are already true.

### 7. Interaction with other systems

Depends on `Q-HP` for the predicate and on `Q-SPD-AGG` / `Q-SPD-TIE` for who started. `Q-TURN-LIMIT` uses the same "non-starting side wins the leftover tie" idea, so the Owner learns it once. If the Owner wants alternative 3, this item leaves the "rule hook only" world and becomes an engine change. That is allowed as a decision. It is not what this proposal asks them to approve.

The recommended combat kit rarely creates this state. The item stays demo-blocking because the throw cancels `endTurn`.

### 8. Recommended option

Alternative 1.

### 9. Reasoning

The demo needs a winner and the function is required to name a side. Overkill is the better competitive rule after splash exists, and it can replace alternative 1 later without changing the fallback. A draw is the better story and the worse fit for the code that exists today. Shipping the low-complexity side-id rule keeps a double KO from rolling the turn back.

### 10. Owner approval required: YES

---

## Q-TURN-LIMIT

Source status: open. The battle runs until the defeat predicate names a winner, or until the caller stops calling `endTurn`. There is no turn cap and no fatigue.

Tier: Demo-blocking.

### 1. Problem definition

A fight of full Blocks can deal 0 forever under the damage proposal. A mobile session needs an end. The question is whether a maximum exists and what happens there. `roundIndex` already increments when the turn returns to the starting side.

### 2. Viable alternatives

1. **Six turns each, then compare.** When a turn would start a 7th round for the starting side, stop instead. Both sides have taken 6 turns. Compare living avatar count. If tied, compare the sum of current HP. If still tied, the side that did not start wins.
2. **No cap.** Current behavior.
3. **Fatigue.** After both sides have taken 6 turns, each later turn deals rising damage to every living avatar. HP still decides the winner.

### 3. Advantages

1. The fight ends on a phone-sized clock. The comparison uses numbers the player can see (standing portraits, then bars). No surprise damage. The 6 is a proposed value, in the same family as Marvel Snap's short match, without copying that game's turn count as a rule.
2. Nothing to explain. A fight ends when it ends.
3. HP remains the only victory currency. Stalling becomes deadly in a visible way.

### 4. Disadvantages

1. A slow, careful fight can be cut off while all eight portraits are standing. The comparison has to be on screen before the last turn.
2. Two DEF-only sides never finish. A demo can hang.
3. Another damage source to tune beside `Q-DAMAGE`. Comedy tone takes a hit if the last round is an unexplained meteor to the face. The rising schedule is a second number series this file would otherwise refuse to invent.

### 5. Complexity

Recommended option: implementation **medium** (stop `endTurn` at the boundary, then a comparison). Player cognitive load **low to medium**: "six turns each, then whoever is healthier."

Alternative 2 is zero build. Alternative 3 is medium and needs authored fatigue numbers.

Walkthrough of the proposed boundary, matching the current `roundIndex` code: the fight starts at round 1. The starting side's later turns bump the round. After the non-starting side finishes round 6, the next turn would be the starting side's round 7. The battle ends instead of starting that turn. Both sides have had six turns.

### 6. Gameplay consequences

A focused side can still win on HP well before the cap, because defeat is checked after each resolution (`Q-HP`). The cap is the stall exit. A 0-damage Block war ends in a judged decision rather than an infinite comic beat.

The proposed 6 is a session length, not a measured average from playtests. This project has no playtests yet.

### 7. Interaction with other systems

Depends on `Q-HP` for the comparison and on initiative for the final tie. Depends on `Q-DAMAGE` allowing 0, which is why the cap is demo-blocking rather than a later polish item. If the Owner forbids 0 damage, the cap is less urgent and can drop to pre-alpha. `Q-DRAW-DISCARD` refill keeps hands full for all six turns, so the cap does not arrive to empty rows under the recommended deck preview of 20.

`Q-SIMULTANEOUS` is a different event (both predicates true mid-fight). The cap is a different event (time called while the fight is ongoing). They share a tie philosophy and should not share one function.

### 8. Recommended option

Alternative 1. Proposed value: 6 turns per side.

### 9. Reasoning

Accessible mobile play means the fight ends. The damage proposal can legally deal 0, and the engine will wait forever. A comparison of visible HP is easier to trust than fatigue damage, and it does not require a new damage curve. Six turns is long enough for a 5 AP puzzle to show up more than once, and short enough for a demo session.

### 10. Owner approval required: YES

---

## Q-DECK-SIZE

Source status: BLOCKED_BY_DESIGN. `createDeck` stores any ordered list. `assertDeckSize` throws until a rule is injected.

Tier: Pre-alpha. Not in the minimum Battle Demo set. See the note in section 8.

### 1. Problem definition

How many cards are in a deck, is the cap per player, per avatar, or shared, and does it count avatar cards? The battle demo can script a pile without this answer. Deck building cannot.

### 2. Viable alternatives

1. **Exactly 20 action cards per side.** The cap is per side, shared by the four avatars, because they share one hand. Avatar cards do not count (`Q-AVATAR-CARD-ROLE`). At most 2 copies of the same catalog action. Instance ids in the hand may still differ, because the hand rejects a repeated `cardId`.
2. **Exactly 12**, same copy rule and the same avatar-card exclusion. This is the Marvel Snap deck size, cited as a comparison.
3. **Exactly 30**, same copy rule and the same avatar-card exclusion. This is the Hearthstone constructed deck size, cited as a comparison.

"Up to N" is not listed. A variable size lets one side bring a tighter cycle. Fixed size keeps the 4v4 fight even.

### 3. Advantages

1. About five cards of attention per role if the player spreads them, without forcing that spread. A six-turn refill fight sees most of the deck and still leaves a remainder if the player plays about two cards a turn (opening 5, then about two replacements on each of five later turns ≈ 15 cards drawn). Room for gacha duplicates, bounded by the copy cap.
2. Very fast cycles. Small on a phone. Construction is a short task.
3. Lots of collection room. A large gacha pool has somewhere to go.

### 4. Disadvantages

1. 20 is a proposed number with no playtest behind it. Four roles can feel thin at five cards each if the card pool is still small.
2. Twelve cards across four roles is three cards per role on a spread. One bad draw order, even a deterministic one, dominates. Less for gacha to sell.
3. A six-turn fight will not see a 30-card deck. Construction becomes homework. Mobile deck building gets long before the card pool deserves it.

### 5. Complexity

Recommended option: implementation **medium** once ownership exists (count catalog ids, reject avatar cards, require exactly 20). Player cognitive load **low**: "bring 20 actions, no more than two the same."

The demo does not need the validator. `createDeck` will hold a scripted list today.

### 6. Gameplay consequences

Both sides bring the same count. The hand of 5 is a quarter of the deck at the start and a repeating window after that. Two-copy cap gives a duplicate from gacha a use (you may play two) and stops a 20-heal deck. Owning more than two is a collection fact. The deck still accepts only two. Extra copies become upgrade material under `Q-GACHA`.

### 7. Interaction with other systems

Depends on `Q-HAND-OWNER` and `Q-AVATAR-CARD-ROLE`. Feeds `Q-DRAW-DISCARD` once players build decks. The copy cap needs a catalog identity distinct from the hand instance id. That identity is not a schema field today. `Q-RARITY` does not change the count. `Q-GACHA` decides what you own; this item decides what you may bring.

A side in this prototype is one player. "Per player" and "per side" are the same cap until a mode exists where they differ. The proposal is per side.

### 8. Recommended option

Alternative 1.

Demo note: a scripted pile of at least 5 action cards is enough to exercise the draw proposal. A representative demo should use 20 if the Owner wants to feel this cap. That preview is not part of the minimum set, because the fight can finish on a shorter script.

### 9. Reasoning

Twelve is a good Snap-sized puzzle and a tight fit for four roles plus gacha. Thirty is a CCG default this fight's length will not showcase. Twenty leaves a little unseen deck in a six-turn refill, gives each role room, and stays editable on a phone. Excluding avatar cards follows `Q-AVATAR-CARD-ROLE`. The two-copy cap is the same shape as a common constructed limit, chosen here so duplicates do something without becoming the whole deck.

### 10. Owner approval required: YES

---

## Q-RARITY

Source status: open. Already in `docs/OPEN_DESIGN_DECISIONS.md`. **Not newly identified.**

`rarity` is null on every sample. The schema allows a non-empty string later. No rank names and no weights exist. The frame rect named `rarity` is a layout slot for gems. It is not a scale.

Tier: Pre-alpha.

### 1. Problem definition

The game needs a rarity vocabulary, and a decision about whether that vocabulary changes stats, costs, or ownership. Drop weights are part of `Q-GACHA`, not a number to hide inside this item.

### 2. Viable alternatives

1. **Four ranks: Common, Rare, Epic, Legendary.** They drive the gem in the `rarity` rect and the drop table. They do not change AP cost and they do not multiply the damage formula. Upgrade cap does not grow with rank (`Q-UPGRADE`).
2. **Five ranks, including Uncommon, and a damage multiplier per rank.**
3. **Cosmetic only.** A gem, and every card is equally available. Rarity does not affect drops.

### 3. Advantages

1. Short gem row for a phone. Four words are enough for a pity table. Combat stays the printed numbers, so a fight is readable without a hidden percent. A Common favorite can still be fully upgraded.
2. Finer gacha granularity. The multiplier is a direct spend incentive.
3. The fairest fight. Collection is fashion.

### 4. Disadvantages

1. If the Owner authors higher base stats on higher ranks, rarity still sells power. This proposal only refuses a second, hidden multiplier. That authored gap has to be visible on the card.
2. A percent inside the hit is another number on a comedy phone UI. Five gem styles cost more art.
3. Gacha has nothing to disclose except "uniform," and progression loses the usual rarity ladder. The frame rect is then decoration with no system behind it.

### 5. Complexity

Recommended option: implementation **low** (a closed set of strings, a gem). The schema currently allows any non-empty string, so a closed set is a later validator change. Player cognitive load **low**.

Alternative 2 is medium in combat and high in explanation. Alternative 3 is low.

This proposal does not set `rarity` on `AVT_AEG_001`, `AVT_PHA_001`, `AVT_CEL_001`, `AVT_SAN_001`, their avatar cards, or the schema action cards. Starters can be owned without a pull and can keep `rarity: null` until the Owner assigns a string.

### 6. Gameplay consequences

During a fight, two cards with the same printed strike hit the same way regardless of gem. Between fights, the gem tells you how the card was obtained and how rare the authored numbers were allowed to be. Ownership records do not need their own rarity field. The subject's rarity is on the avatar, the action card, or the equipment.

### 7. Interaction with other systems

`Q-GACHA` is where weights and pity live. Those weights are meaningless until these names exist, so this item comes first. `Q-AP-COST` and `Q-DAMAGE` do not read the string under this proposal. `Q-UPGRADE` keeps one cap for every rank so the gem is not also a level cap. If the Owner picks alternative 2, `Q-DAMAGE` gains a multiplier and the mobile combat sentence gets longer.

The art rect can later show one to four gems, or four colors. That is presentation. It is not part of this decision's math.

### 8. Recommended option

Alternative 1. Rank names: Common, Rare, Epic, Legendary.

### 9. Reasoning

The frame already reserved a gem slot, and gacha needs a vocabulary before it needs a percentage. Four ranks are enough for a pity ladder and short enough for the card. A damage multiplier would make the hit depend on a word that is not POW, DEF, or the printed strike. Costs staying independent means a Legendary card is not also harder to cast, which would double-charge the player. Authored stat budgets can still rise with rank. That power should be printed in the stat boxes, where the player can see it.

### 10. Owner approval required: YES

---

## Q-UPGRADE

Source status: BLOCKED_BY_DESIGN. Equipment `upgrade` is null and `upgradeStatus` is `BLOCKED_BY_DESIGN`. `rules.upgrade` throws. A numeric upgrade payload fails validation.

Tier: Pre-alpha.

### 1. Problem definition

What gets upgraded (avatar, card, equipment), what it costs, and how stats change. The gold pot helmet is an art variant of the silver one (`variantOf`, different equipment id, different asset id). It is not an upgrade level. Collapsing those ids would violate the existing identity data.

### 2. Viable alternatives

1. **Equipment instance only.** The player's owned copy of an item gains levels. The catalog item stays the base definition. Each level adds a small flat non-negative integer to the item's chosen stat among POW, DEF, and SPD. Proposed cap: base plus 3 levels (0, 1, 2, 3). Cost is upgrade material from duplicates plus a currency. No prices in this file. Avatars and action cards do not gain levels in this version.
2. **Avatar levels and equipment levels.** Two tracks.
3. **One-step card upgrade.** An action card has a single upgraded printed number, in the general deckbuilder sense. Equipment stays unleveled, which leaves the blocked equipment field unused.

### 3. Advantages

1. The blocked field is on equipment, and the art already has items. Flat additions are visible in the three stat boxes. A shared staff (`EQ_STAFF_NEUTRAL_001`, `nativeAvatarId` null) can be upgraded for whoever equips it. The level lives on the ownership instance so two players can own the same staff at different levels.
2. Matches the usual gacha loop: the character grows and the gear grows.
3. Card text getting stronger is easy to show in a deckbuilder UI.

### 4. Disadvantages

1. The four starters do not themselves level. Progression is on hats and staves. Players who expect Sir Potlid to "level up" will not see it in this version.
2. Two currencies, two caps, two UI screens, before the first fight is fun.
3. Does not use the equipment record the schema already marked as blocked. Card upgrades also change combat numbers that `Q-DAMAGE` treats as printed content.

### 5. Complexity

Recommended option: implementation **high** relative to the demo (ownership fields, materials, stat recompute between battles). It is still the smaller of the three for a first progression pass. Player cognitive load **medium**: "this hat is +1 DEF per level, up to 3."

The cap of 3 is a proposed value, not a measurement.

When `statModifiers` becomes `SET`, the schema requires all three of POW, DEF, and SPD to be integers. An item that adds only DEF still stores 0 for the other two. Validation today rejects any non-null `upgrade`. This proposal does not put a number there.

### 6. Gameplay consequences

Between battles, gear shifts the stats the next battle reads. SPD from gear changes who starts, because `teamSpd` runs at the next `createBattle`. It does not change `startingSideId` mid-fight. HP from gear is not in this proposal. Max HP stays the avatar's base until a later decision adds it.

The silver helmet and the gold helmet remain two items. Upgrading silver does not turn it into `EQ_AEG_POT_HELMET_GOLD_001`.

### 7. Interaction with other systems

`Q-GACHA` duplicates need a sink. This proposal is that sink for avatar duplicates and for action-card or equipment copies beyond the deck cap. `Q-RARITY` does not raise the level cap under the rarity proposal. `Q-DAMAGE` reads the resulting stats and does not care how they were raised. The Battle Demo does not apply upgrades.

If the Owner picks alternative 2, avatar HP growth reopens `Q-HP`'s "equipment changes HP" question, which this proposal defers.

### 8. Recommended option

Alternative 1.

### 9. Reasoning

The schema blocked an equipment field, the art pipeline has items, and gacha needs somewhere to put a duplicate. Equipment levels answer all three with flat, printed stat changes. Avatar levels are the right second track after the fight demo exists. Card upgrades are a good deckbuilder trick and a poor use of the equipment work already started. Keeping the gold helmet as a variant protects the asset ids.

### 10. Owner approval required: YES

---

## Q-GACHA

Source status: BLOCKED_BY_DESIGN. Ownership `source` is null and must stay null. `rollAcquisition` and `rules.gachaRate` throw. The schema has no rate field. `quantity` is null or an integer ≥ 1.

Tier: Live-ops. Not required for a Battle Demo.

### 1. Problem definition

Which rewards exist, how odds work, and what an ownership `source` string should look like. This item is about structure, disclosure, and pity. It does not set the game's rates.

### 2. Viable alternatives

1. **Disclosed banner with hard pity.** Before a pull is confirmed, the client shows the subject kinds, the rarity weights, the pity rule, and the duplicate rule. A visible counter guarantees the banner's advertised top reward at the hard pity. Soft pity is allowed only when its curve is disclosed too. Paid and free pulls use the same table unless the banner text says otherwise. Avatars are unique: a duplicate converts to upgrade material and `quantity` stays 1. Action cards and equipment stack `quantity`. The deck-building cap (`Q-DECK-SIZE`) still accepts at most 2 copies of a catalog action. Avatar cards are not a separate prize (`Q-AVATAR-CARD-ROLE`).
2. **Disclosed odds, no pity.** The published weights are the whole rule.
3. **No random acquisition.** Avatars, cards, and items unlock directly. `gachaRate` stays unused.

### 3. Advantages

1. Players can see the worst case. Pity is a disclosed rule, not a secret. Duplicates feed `Q-UPGRADE` instead of vanishing. The battle engine stays deterministic because the roll happens in acquisition, outside `src/battle`.
2. Simpler math. Nothing to count.
3. No loot-box disclosure problem. Progression is a shop or a quest reward. Easiest to explain.

### 4. Disadvantages

1. Pity, duplicate conversion, and banners are a live-ops product. They need UI, persistence, and a legal pass before any real-money pull. The ownership validator will reject a non-null `source` until the schema is changed on purpose.
2. A long unlucky streak has no guaranteed end. That is a known trust problem for this kind of product, and some storefront expectations are easier to meet when a guarantee exists.
3. Drops the gacha progression the game is being compared against. Fine as a design pivot. It is a different product.

### 5. Complexity

Recommended option: implementation **high**, and only after the fight exists. Player cognitive load **medium** if the banner is a single screen with odds, a counter, and a duplicate sentence. It is high if those are hidden.

No rate in this file is a recommendation. The block below is **ILLUSTRATIVE** shape only.

> ILLUSTRATIVE ONLY. Not a proposed rate. Not a banner. Not for implementation.
>
> A banner might display "Legendary 1%, Epic 5%, everything else Common or Rare" and "the advertised Legendary is guaranteed by pull 50 if it has not appeared."
>
> Those figures exist to show what a disclosure looks like. They are not this game's odds, pity distance, or rarity weights.

### 6. Gameplay consequences

Pulls change what you own between battles. They do not roll inside `createBattle`, `playCard`, or `resolveEffect`. A duplicate avatar becomes material for `Q-UPGRADE`. A duplicate action card increments quantity, and the deck still has a two-copy cap, so quantity beyond 2 is collection plus material. Starters are owned at the beginning, outside the banner.

Proposed `source` shape, unstorable until validation changes: `banner:<bannerId>:base`, `banner:<bannerId>:soft_pity`, or `banner:<bannerId>:hard_pity`. `sourceStatus` would leave `TBD` in that same future change. This paragraph is a field proposal, not a schema edit.

### 7. Interaction with other systems

Depends on `Q-RARITY` for the rank names and on `Q-UPGRADE` for the duplicate sink. Depends on `Q-AVATAR-CARD-ROLE` so the pull does not mint a second playable person. `Q-DECK-SIZE` limits how many owned copies enter a fight. The battle's "no RNG" property stays intact only if this roll never moves into `src/battle/battle.js`.

### 8. Recommended option

Alternative 1, as a structure. No numeric rate is recommended.

Legal and storefront notes, not legal advice: randomized paid items should disclose odds before purchase. Major mobile stores have required that disclosure for loot boxes (Apple's App Store Review Guidelines on loot boxes are the example to confirm against the current guideline text). Some regions restrict paid random items more strictly than a disclosure rule. Pity counts as part of the disclosed rule. A real-money banner needs a separate Owner and counsel check. This document does not authorize one.

### 9. Reasoning

The project is being built against a gacha progression frame, and the ownership record already has a `source` waiting for a string. A disclosed hard pity is the structure that lets a comedy card game sell random rewards without a bottomless miss streak. Refusing to print a final percentage here is deliberate: the number is a live-ops and disclosure choice, and an illustrative example must not leak into a banner. Direct unlock (alternative 3) remains available if the Owner would rather skip random rewards entirely.

### 10. Owner approval required: YES

---

## Q-SLOT-ANCHOR

Source status: open (art data shape). Already in `docs/OPEN_DESIGN_DECISIONS.md`. Not a combat rule.

Tier: Pre-alpha art. Not demo-blocking for a battle demo that does not render sprites.

### 1. Problem definition

The loader maps a slot name to an anchor name with `src/assets/slot-anchor-map.json`, taken from the art-registry prose at the art commit recorded in that file. Item JSON stores `slot` and `pivot`, not the anchor name. The question is whether each equipment item should gain an `anchor` field so the map can retire. Details are in `docs/INTEGRATION_NOTES_FOR_MIRA.md`.

Current map, names only: `headgear` → `head`, `accessory` → `feet`, `main_hand` → `main_hand`, `off_hand` → `off_hand`, `back` → `back`.

### 2. Viable alternatives

1. **Anchor field on each item, then retire the map.** The value is an anchor name such as `head` or `feet`, not a pixel. Asset ids stay as they are.
2. **Keep the map** as the only translation from slot to anchor.
3. **Require both** and fail placement when they disagree.

### 3. Advantages

1. The item carries its own attachment point. The prose convention cannot drift away from a hidden map. This is the change `INTEGRATION_NOTES_FOR_MIRA.md` already asks the art side for.
2. No art-file edit. The systems map stays a single switch.
3. Migration is safe. A mismatch is caught.

### 4. Disadvantages

1. Every item record on the art branch needs a field. This systems branch does not edit `assets/`, so the change waits for the art side. `EQ_DAGGER_BASIC_001` still uses the slot string `main_hand|off_hand` on the art branch. An anchor name does not choose a hand. That ambiguity is already note 2 in the Mira doc, and it is not a new question here.
2. The map remains a second source of truth next to the registry prose.
3. Two fields to maintain forever. The map never actually retires.

### 5. Complexity

Recommended option: implementation **low** on the loader once items carry the name, and **medium** as an art-data pass because every item is touched. Player cognitive load **none**. Players never see anchor names.

### 6. Gameplay consequences

None inside the fight. Placement of the silver helmet, the gold helmet, and the shared staff becomes data-driven per item. Stats, rarity, and AP costs stay out of the art JSON, which is the existing integration rule.

### 7. Interaction with other systems

Independent of the combat and gacha graph. `Q-UPGRADE` must not treat a new `anchor` field as a stat. Variant items keep their own asset ids. `EQ_AEG_POT_HELMET_GOLD_001` stays `variantOf` the silver helmet whether or not both gain `"anchor": "head"`.

### 8. Recommended option

Alternative 1. Add the anchor name on each equipment item, then retire `src/assets/slot-anchor-map.json` after the loader reads the item field.

### 9. Reasoning

The map was a bridge over prose. The item is the right owner of its anchor, and the art notes already describe that field. Keeping the map is fine while the art files are untouched. Requiring both forever spends complexity to protect a migration. The battle demo does not need this decision.

### 10. Owner approval required: YES

---

## What this research refuses to decide

- Numeric POW, DEF, SPD, HP, or rarity for `AVT_AEG_001`, `AVT_PHA_001`, `AVT_CEL_001`, `AVT_SAN_001`.
- Names, costs, or effects for `ACT_SCHEMA_ATK`, `ACT_SCHEMA_DEF`, and `ACT_SCHEMA_SKILL`.
- A real gacha percentage or a real pity distance.
- A front row, a mulligan, a revive, a 0-cost card, or a faction lock on who may play a card.
- Any edit to asset ids, character ids, or the gold helmet's `variantOf` link.
- Wiring `playCard` to `resolveEffect` and `evaluateOutcome`. That is future implementation after the Owner approves the formulas.

## Sources read

- `docs/OPEN_DESIGN_DECISIONS.md`
- `docs/DATA_SCHEMA.md`
- `docs/SYSTEMS_PROGRESS_REPORT.md`
- `docs/SYSTEMS_REPO_AUDIT.md`
- `docs/INTEGRATION_NOTES_FOR_MIRA.md`
- `src/battle/battle.js`, `src/cards/hand.js`, `src/cards/play.js`, `src/cards/catalog.js`
- `src/design/blocked-rules.js`, `src/schema/constants.js`, `src/schema/validate.js`, `src/schema/game.schema.json`
- `src/avatars/catalog.js`, `src/avatars/ownership.js`, `src/assets/slot-anchor-map.json`
- `tests/helpers/stub-rules.js` and the battle, card, and status tests, as evidence of current behavior only
