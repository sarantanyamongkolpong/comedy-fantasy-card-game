import { DesignBlockedError } from '../design/errors.js';
import { HAND_SIZE } from '../schema/constants.js';

export { HAND_SIZE };

/**
 * @param {string} ownerId
 * @param {object[]} [cards]
 */
export function createHand(ownerId, cards = []) {
  if (typeof ownerId !== 'string' || ownerId.length === 0) {
    throw new TypeError('hand ownerId is required');
  }
  if (!Array.isArray(cards)) throw new TypeError('cards must be an array');
  if (cards.length > HAND_SIZE) {
    const error = new Error(`Hand size is ${HAND_SIZE}`);
    error.reason = 'HAND_FULL';
    error.maxSize = HAND_SIZE;
    throw error;
  }
  return {
    ownerId,
    maxSize: HAND_SIZE,
    cards: cards.map((card) => structuredClone(card)),
  };
}

/**
 * @param {{ cards: object[], maxSize: number }} hand
 * @param {object} card
 */
export function addCard(hand, card) {
  if (!card || typeof card.cardId !== 'string' || card.cardId.length === 0) {
    return { ok: false, reason: 'CARD_MISSING' };
  }
  if (hand.cards.some((held) => held.cardId === card.cardId)) {
    return { ok: false, reason: 'DUPLICATE_CARD_ID' };
  }
  if (hand.cards.length >= hand.maxSize) {
    return { ok: false, reason: 'HAND_FULL', maxSize: hand.maxSize, size: hand.cards.length };
  }
  hand.cards.push(structuredClone(card));
  return { ok: true, size: hand.cards.length };
}

/**
 * @param {{ cards: object[] }} hand
 * @param {string} cardId
 */
export function removeCard(hand, cardId) {
  const index = hand.cards.findIndex((card) => card.cardId === cardId);
  if (index < 0) return { ok: false, reason: 'NOT_IN_HAND' };
  const [card] = hand.cards.splice(index, 1);
  return { ok: true, card, size: hand.cards.length };
}

/**
 * A deck is an ordered list. Its legal size is undesigned.
 * @param {object[]} cards
 */
export function createDeck(cards) {
  if (!Array.isArray(cards)) throw new TypeError('cards must be an array');
  return {
    cards: cards.map((card) => structuredClone(card)),
    sizeRule: 'BLOCKED_BY_DESIGN',
    questionId: 'Q-DECK-SIZE',
  };
}

/**
 * @param {{ cards: object[] }} deck
 * @param {{ deckSize?: Function }} [rules]
 */
export function assertDeckSize(deck, rules) {
  if (typeof rules?.deckSize !== 'function') {
    throw new DesignBlockedError('deck size', 'Q-DECK-SIZE');
  }
  return rules.deckSize(deck);
}

/**
 * @param {object} hand
 * @param {object} deck
 * @param {{ draw?: Function }} [rules]
 */
export function drawCards(hand, deck, rules) {
  if (typeof rules?.draw !== 'function') {
    throw new DesignBlockedError('draw/discard rules', 'Q-DRAW-DISCARD');
  }
  return rules.draw({ hand, deck });
}

/**
 * @param {object} hand
 * @param {string} cardId
 * @param {{ discard?: Function }} [rules]
 */
export function discardCard(hand, cardId, rules) {
  if (typeof rules?.discard !== 'function') {
    throw new DesignBlockedError('draw/discard rules', 'Q-DRAW-DISCARD');
  }
  return rules.discard({ hand, cardId });
}
