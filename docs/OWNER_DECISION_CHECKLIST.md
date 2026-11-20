# Owner decision checklist

**PROPOSALS ONLY. Nothing in this file is an approved rule.**

Checking a box is the Owner's approval of that line. An unchecked line is not a rule. Do not implement from an unchecked line. Do not mark this research `PRODUCTION_READY`.

Owner approval required: **YES** for every line.

Arguments, alternatives in full, and the word ILLUSTRATIVE where a number is only an example: `docs/DESIGN_DECISION_RESEARCH.md`. Groups and the graph: `docs/DESIGN_DEPENDENCY_MAP.md`.

`Q-TARGETING` and `Q-RARITY` are already in `docs/OPEN_DESIGN_DECISIONS.md`. They are not newly identified. `Q-AVATAR-CARD-ROLE` is newly identified and is a research label only.

Decision order is dependency order. The first 15 lines are the minimum set for a playable Battle Demo.

## Demo-blocking

- [ ] **Q-HAND-OWNER** — Recommended: one hand of 5 per side. Alternatives: one hand of 5 per avatar; one hand shared by both sides.
- [ ] **Q-AVATAR-CARD-ROLE** — Newly identified. Recommended: avatar cards stay collection faces, stay out of the battle deck, and are not a separate pull. Alternatives: make them playable; treat one as a commander outside the deck.
- [ ] **Q-PLAY-DESTINATION** — Recommended: after resolution the card goes to that side's discard pile, and `playedRecords` stays a log. Alternatives: the card stays in play; the card leaves the match.
- [ ] **Q-DRAW-DISCARD** — Recommended: both sides draw to 5 at battle start, refill to 5 at each own turn start, keep unplayed cards, and recycle discard in play order with no random shuffle. Alternatives: a fresh hand each turn with unplayed cards discarded and a logged shuffle; draw 1 and do not recycle.
- [ ] **Q-AP-LEFTOVER** — Recommended: confirm the code, a turn sets that side's AP to 5 and leftover AP is dropped. Alternatives: add 5 to leftover AP; add 5 to leftover AP with a cap of 10.
- [ ] **Q-AP-COST** — Recommended: each action card has its own non-negative integer cost, first content band 1–3, no avatar discount. Alternatives: one cost for all ATK, one for all DEF, and one for all Skill; the chosen avatar modifies the cost.
- [ ] **Q-ACTION-LIMIT** — Recommended: the AP pool is the only per-turn cap. Alternatives: one card per turn; at most one Skill per turn on top of AP.
- [ ] **Q-SPD-AGG** — Recommended: team SPD is the sum of the four avatars' SPD. Alternatives: the highest single SPD; the lowest single SPD.
- [ ] **Q-SPD-TIE** — Recommended: sideA acts first, and that choice stays fixed for the battle. Alternatives: higher POW sum, then sideA; a logged coin flip.
- [ ] **Q-HP** — Recommended: each avatar has battle HP, and the side loses when all four are at 0. Alternatives: one shared party HP pool; the side loses when any one avatar is at 0.
- [ ] **Q-TARGETING** — Already in the question file. Recommended: the player picks one living ally and, for a hostile card, one living enemy. Alternatives: cards may hit every enemy or every ally; a hit lands on a random living enemy.
- [ ] **Q-DAMAGE** — Recommended: ATK is printed strike plus ally POW minus target DEF, then Block; a DEF card adds Block that expires at the start of that side's next turn; damage may be 0. Alternatives: a DEF card permanently raises DEF; printed card damage ignores POW and DEF.
- [ ] **Q-SKILL** — Recommended: `effectId` selects an effect, and the first two shapes are Heal and Pierce, with no faction lock. Alternatives: Skill uses the ATK formula with a bigger number; each faction has its own passive. A demo pile with no Skill card is a smaller legal answer for the demo only.
- [ ] **Q-SIMULTANEOUS** — Recommended: the side that did not start wins. Alternatives: the side that removed more HP in that resolution wins, then the side that did not start; the battle is a draw.
- [ ] **Q-TURN-LIMIT** — Recommended: after both sides have taken 6 turns, compare living avatars, then HP, then give the win to the side that did not start. Alternatives: no cap; rising fatigue damage after 6 turns.

## Pre-alpha

- [ ] **Q-DECK-SIZE** — Recommended: exactly 20 action cards per side, at most 2 copies of the same catalog action, avatar cards excluded. Alternatives: exactly 12; exactly 30. Not required to finish a scripted fight.
- [ ] **Q-RARITY** — Already in the question file. Recommended: Common, Rare, Epic, Legendary, for the gem and the drop table, with no damage multiplier and no extra upgrade cap. Alternatives: five ranks that also multiply damage; a cosmetic gem with equal drop weights.
- [ ] **Q-UPGRADE** — Recommended: levels on the player's equipment instance, flat stat additions, proposed cap of 3 levels above base. The gold pot helmet stays a variant, not a level. Alternatives: avatar levels plus equipment levels; a one-step card upgrade and no equipment levels.
- [ ] **Q-SLOT-ANCHOR** — Recommended: add an anchor name on each equipment item, then retire the slot map. Alternatives: keep the map; store both and reject a mismatch. `EQ_DAGGER_BASIC_001` and its `main_hand|off_hand` slot stay unresolved by this line.

## Live-ops

- [ ] **Q-GACHA** — Recommended: disclosed odds, a visible hard pity, unique avatars converting duplicates into upgrade material, and stackable quantity on action cards and equipment. No rate in the research is a final rate. Alternatives: disclosed odds with no pity; no random unlocks.

## Demo-blocking ids

Q-HAND-OWNER, Q-AVATAR-CARD-ROLE, Q-PLAY-DESTINATION, Q-DRAW-DISCARD, Q-AP-LEFTOVER, Q-AP-COST, Q-ACTION-LIMIT, Q-SPD-AGG, Q-SPD-TIE, Q-HP, Q-TARGETING, Q-DAMAGE, Q-SKILL, Q-SIMULTANEOUS, Q-TURN-LIMIT.
