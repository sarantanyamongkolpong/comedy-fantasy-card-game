# Open design decisions

Each item is a question for the Owner. Rows marked BLOCKED_BY_DESIGN throw `DesignBlockedError` (`code: "BLOCKED_BY_DESIGN"`) from the default rule. Tests that need a behavior pass a function labelled `TEST-ONLY` from `tests/helpers/stub-rules.js`. Those stubs are not game defaults.

## Q-DECK-SIZE

Status: BLOCKED_BY_DESIGN

`createDeck` stores an ordered list and does not check a size. `assertDeckSize` throws until a `deckSize` rule is injected.

How many cards are in a deck? Is the cap per player, per avatar, or shared? Does the cap count avatar cards?

## Q-DRAW-DISCARD

Status: BLOCKED_BY_DESIGN

`drawCards` and `discardCard` throw. Starting a battle does not draw. Playing a card removes it from the hand and appends a play record so it cannot be played twice. That record is a log. It is not a discard pile, and nothing shuffles it back.

When does a player draw? How many cards? What happens when the deck is empty? Where does a played card go, and can it return?

## Q-AP-COST

Status: BLOCKED_BY_DESIGN

Sample action cards use `apCost: null` and `costStatus: "TBD"`. `resolveApCost` throws on a null cost. A test can inject `resolveApCost`. A card that already carries a non-negative integer uses that integer, which is how a future content value will work. This prototype ships no such integer.

What does each ATK, DEF, and Skill card cost? Is cost fixed per type, per card, or modified by the avatar?

## Q-DAMAGE

Status: BLOCKED_BY_DESIGN

`resolveEffect` on ATK or DEF calls `rules.damage`, which throws. Playing a card spends AP and does not change POW, DEF, or SPD.

How do POW, DEF, and a card combine into a number? Does a DEF card change the next hit, add a shield, or something else? Can damage be zero?

## Q-HP

Status: BLOCKED_BY_DESIGN

Stats are POW, DEF, and SPD. Battle members have no HP field. `rules.isSideDefeated` throws, so a battle cannot decide a winner until the caller supplies a predicate.

What is the health pool? Is it one number per avatar, and does equipment change it? When is a side defeated: every avatar, one avatar, or another condition?

## Q-SPD-TIE

Status: BLOCKED_BY_DESIGN

If the two team SPD numbers are equal, `rules.spdTieBreak` throws. The engine does not prefer side A, a lower avatar id, or a coin flip.

Who acts first when team SPD is tied? Should the result stay fixed for the whole battle?

## Q-SPD-AGG

Status: BLOCKED_BY_DESIGN

"The team with the highest SPD starts" needs one number per side. The engine compares whatever `rules.teamSpd(side)` returns. It does not sum, average, or take the max itself. Omitting the rule throws.

How do four avatar SPD values become that team number? Sum, highest, lowest, or a separate team stat?

## Q-ACTION-LIMIT

Status: BLOCKED_BY_DESIGN

A play that otherwise affords its cost still calls `rules.perTurnActionLimit`, which throws. The AP check itself does not invent a "one card" or "unlimited cards" cap.

Is the only limit the AP pool? Is there a cap on ATK, DEF, Skill, or cards per turn?

## Q-SKILL

Status: BLOCKED_BY_DESIGN

`resolveEffect` on a Skill card calls `rules.skillEffect`, which throws. The sample Skill card has `effectId: null`.

What does a Skill card do? Does each faction have its own effect? Who chooses the target?

## Q-GACHA

Status: BLOCKED_BY_DESIGN

Ownership rows store `source: null`. `rollAcquisition` and `rules.gachaRate` throw. The schema has no rate field.

Which rewards exist, what are the rates, and what does an ownership `source` string look like?

## Q-UPGRADE

Status: BLOCKED_BY_DESIGN

Equipment `upgrade` is null and `upgradeStatus` is `BLOCKED_BY_DESIGN`. `rules.upgrade` throws. A numeric upgrade payload fails validation.

What is upgraded (avatar, card, equipment)? What is the cost, and how do stats change?

## Q-SIMULTANEOUS

Status: BLOCKED_BY_DESIGN

If the defeat predicate is true for both sides, `rules.simultaneousDefeat` throws. The engine does not declare a draw or pick a winner on its own. A supplied rule may return `{ winnerSideId }` set to one of the two side ids. Anything else is rejected.

What should happen when both sides become defeated together?

## Q-AP-LEFTOVER

Status: assumption, please confirm

At the start of a side's turn, that side's AP is set to 5. Unspent AP from their previous turn is replaced. The other side keeps its current AP until its own turn starts. Before a side's first turn, AP is null.

Please confirm that refresh replaces leftover AP, rather than adding 5 to a bank.

## Q-HAND-OWNER

Status: assumption, please confirm

Hand size is 5. This prototype gives one hand to each side (the player), not one hand to each of the four avatars.

Is the hand of 5 per side, per avatar, or shared across a match in some other way?

## Q-PLAY-DESTINATION

Status: assumption, please confirm

A successful play removes the card from the hand and stores a play event on `playedRecords`. `discardCard` still throws, so this log is not a discard pile.

After a card resolves, does it go to a discard pile, stay in play, or leave the match?

## Q-TURN-LIMIT

Status: open

The battle runs until the defeat predicate names a winner, or until the caller stops calling `endTurn`. There is no turn cap and no fatigue rule.

Is there a maximum number of turns or rounds? What happens at that limit?

## Q-TARGETING

Status: open

`playCard(state, sideId, cardId)` checks the active side, the hand, the type, and AP. It does not take a target avatar.

Does every card choose a target? Can a card hit several avatars? Who is a legal target?

## Q-RARITY

Status: open

`rarity` is null on every sample. The schema allows a string later. No rarity names or drop weights are defined. Frame layout has a `rarity` rect for art; that rect is not a rarity scale.

What are the rarity ranks, and do they change stats, costs, or ownership?

## Q-SLOT-ANCHOR

Status: open (art data shape)

The loader maps a slot name to an anchor name with `src/assets/slot-anchor-map.json`, taken from the prose in the art registry (headgear → `head`, accessory → `feet`, other listed slots use the slot name). Item JSON stores `slot` and `pivot`, not the anchor name.

Should each equipment item gain an `anchor` field so this map can retire? Details are in `docs/INTEGRATION_NOTES_FOR_MIRA.md`.
