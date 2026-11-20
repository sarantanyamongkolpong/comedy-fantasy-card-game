import { assessActionPlay } from '../../src/cards/play.js';

/**
 * EXPERIMENTAL policy: walk the priority list and play the first legal card of that type.
 * Hand order is the tie break inside a type. Types absent from the priority are never chosen.
 * @param {object} battle
 * @param {string} sideId
 * @param {{ priority: string[] }} policy
 */
export function chooseCard(battle, sideId, policy) {
  const hand = battle.hands[sideId];
  const playsThisTurn = battle.log.filter(
    (event) => event.type === 'play' && event.turnIndex === battle.turnIndex && event.sideId === sideId,
  ).length;
  for (const actionType of policy.priority) {
    for (const card of hand.cards) {
      if (card.actionType !== actionType) continue;
      const assessment = assessActionPlay({
        card,
        inHand: true,
        ap: battle.ap[sideId],
        rules: battle.rules,
        playsThisTurn,
      });
      if (assessment.ok) return card;
    }
  }
  return null;
}
