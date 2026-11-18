import assert from 'node:assert/strict';
import test from 'node:test';
import { SAMPLE_AVATAR_CARDS } from '../src/cards/catalog.js';
import {
  addCard,
  assertDeckSize,
  createDeck,
  createHand,
  discardCard,
  drawCards,
  removeCard,
} from '../src/cards/hand.js';
import { assessActionPlay, assessAffordability } from '../src/cards/play.js';
import { DesignBlockedError } from '../src/design/errors.js';
import { defaultRules } from '../src/design/blocked-rules.js';
import { HAND_SIZE } from '../src/schema/constants.js';
import { rollAcquisition } from '../src/avatars/ownership.js';
import {
  TEST_ONLY,
  testOnlyActionCard,
  testOnlyCostByType,
  testOnlyDeckMax,
  testOnlyDrawOne,
  testOnlyNoExtraActionLimit,
} from './helpers/stub-rules.js';

test('hand size is 5', () => {
  assert.equal(HAND_SIZE, 5);
  const hand = createHand('SIDE');
  assert.equal(hand.maxSize, 5);
  for (let index = 0; index < 5; index += 1) {
    const added = addCard(hand, testOnlyActionCard({ cardId: `c${index}`, actionType: 'ATK' }));
    assert.equal(added.ok, true);
  }
  assert.equal(hand.cards.length, 5);
  assert.equal(addCard(hand, testOnlyActionCard({ cardId: 'c6', actionType: 'DEF' })).reason, 'HAND_FULL');
  assert.equal(hand.cards.length, 5);
  assert.throws(() => createHand('SIDE', Array.from({ length: 6 }, (_, index) => (
    testOnlyActionCard({ cardId: `x${index}`, actionType: 'Skill' })
  ))), (error) => error.reason === 'HAND_FULL');
  assert.equal(addCard(hand, testOnlyActionCard({ cardId: 'c0', actionType: 'ATK' })).reason, 'DUPLICATE_CARD_ID');
  assert.equal(removeCard(hand, 'c0').ok, true);
  assert.equal(removeCard(hand, 'c0').reason, 'NOT_IN_HAND');
});

test('null costs throw, and an injected TEST-ONLY table supplies affordability', () => {
  const card = testOnlyActionCard({ cardId: 'atk', actionType: 'ATK' });
  const hand = createHand('SIDE', [card]);
  const defaults = defaultRules();
  assert.throws(() => assessAffordability({
    card,
    inHand: true,
    ap: 5,
    rules: defaults,
  }), (error) => error instanceof DesignBlockedError && error.questionId === 'Q-AP-COST');

  const costs = testOnlyCostByType({ ATK: 2, DEF: 1, Skill: 4 });
  assert.equal(costs.label, TEST_ONLY);
  const afforded = assessAffordability({ card, inHand: true, ap: 5, rules: { resolveApCost: costs } });
  assert.deepEqual(afforded, { ok: true, cost: 2, costSource: 'rule', ap: 5 });
  const poor = assessAffordability({ card, inHand: true, ap: 1, rules: { resolveApCost: costs } });
  assert.equal(poor.reason, 'INSUFFICIENT_AP');
  assert.equal(poor.cost, 2);

  const seen = { called: false };
  const limit = () => {
    seen.called = true;
    return { ok: true };
  };
  const blocked = assessActionPlay({
    card,
    inHand: true,
    ap: 1,
    rules: { resolveApCost: costs, perTurnActionLimit: limit },
    playsThisTurn: 0,
  });
  assert.equal(blocked.reason, 'INSUFFICIENT_AP');
  assert.equal(seen.called, false);

  assert.throws(() => assessActionPlay({
    card,
    inHand: true,
    ap: 5,
    rules: { resolveApCost: costs, perTurnActionLimit: defaults.perTurnActionLimit },
    playsThisTurn: 0,
  }), (error) => error.questionId === 'Q-ACTION-LIMIT');

  const played = assessActionPlay({
    card: hand.cards[0],
    inHand: true,
    ap: 5,
    rules: { resolveApCost: costs, perTurnActionLimit: testOnlyNoExtraActionLimit },
    playsThisTurn: 0,
  });
  assert.equal(played.ok, true);
  assert.equal(played.cost, 2);
});

test('a content integer cost is read from the card and avatar cards are not actions', () => {
  const card = testOnlyActionCard({ cardId: 'priced', actionType: 'DEF', apCost: 3 });
  assert.equal(card.labels[0], TEST_ONLY);
  assert.equal(card.costStatus, 'SET');
  const result = assessAffordability({
    card,
    inHand: true,
    ap: 3,
    rules: defaultRules(),
  });
  assert.equal(result.ok, true);
  assert.equal(result.costSource, 'card');
  const avatarCard = SAMPLE_AVATAR_CARDS[0];
  assert.equal(assessAffordability({
    card: avatarCard,
    inHand: true,
    ap: 5,
    rules: defaultRules(),
  }).reason, 'NOT_ACTION_CARD');
  assert.equal(assessAffordability({
    card: testOnlyActionCard({ cardId: 'missing', actionType: 'Skill' }),
    inHand: false,
    ap: 5,
    rules: defaultRules(),
  }).reason, 'NOT_IN_HAND');
});

test('deck size, draw, and discard throw unless a TEST-ONLY rule is injected', () => {
  const deck = createDeck([
    testOnlyActionCard({ cardId: 'd1', actionType: 'ATK' }),
    testOnlyActionCard({ cardId: 'd2', actionType: 'Skill' }),
  ]);
  assert.equal(deck.sizeRule, 'BLOCKED_BY_DESIGN');
  assert.equal(deck.questionId, 'Q-DECK-SIZE');
  const hand = createHand('SIDE');
  assert.throws(() => assertDeckSize(deck), (error) => error.questionId === 'Q-DECK-SIZE');
  assert.throws(() => drawCards(hand, deck), (error) => error.questionId === 'Q-DRAW-DISCARD');
  assert.throws(() => discardCard(hand, 'd1'), (error) => error.questionId === 'Q-DRAW-DISCARD');

  const cap = testOnlyDeckMax(4);
  assert.equal(cap.label, TEST_ONLY);
  assert.equal(assertDeckSize(deck, { deckSize: cap }).ok, true);
  assert.equal(testOnlyDrawOne.label, TEST_ONLY);
  const drawn = drawCards(hand, deck, { draw: testOnlyDrawOne });
  assert.equal(drawn.label, TEST_ONLY);
  assert.equal(drawn.cardId, 'd1');
  assert.equal(hand.cards.length, 1);
  assert.equal(deck.cards.length, 1);
});

test('gacha and upgrade defaults throw', () => {
  assert.throws(() => rollAcquisition({ subjectId: 'AVT_AEG_001' }), (error) => error.questionId === 'Q-GACHA');
  assert.throws(() => defaultRules().upgrade({ equipmentId: 'EQ_AEG_POT_HELMET_SILVER_001' }), (error) => {
    return error.questionId === 'Q-UPGRADE';
  });
});
