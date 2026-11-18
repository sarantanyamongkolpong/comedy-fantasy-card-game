import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { SAMPLE_AVATARS } from '../../src/avatars/catalog.js';
import { createBattle, endTurn, evaluateOutcome, playCard, publicView, resolveEffect } from '../../src/battle/battle.js';
import { addCard, createHand, discardCard, drawCards, removeCard } from '../../src/cards/hand.js';
import { assessActionPlay, resolveApCost } from '../../src/cards/play.js';
import { defaultRules, resolveRules } from '../../src/design/blocked-rules.js';
import { DesignBlockedError } from '../../src/design/errors.js';
import { BASE_AP, PARTY_SIZE } from '../../src/schema/constants.js';
import {
  TEST_ONLY,
  testOnlyActionCard,
  testOnlyAvatar,
  testOnlyCostByType,
  testOnlyNoExtraActionLimit,
  testOnlySide,
  testOnlySideDefeatedWhenAllKo,
  testOnlyTeamSpdSum,
} from '../helpers/stub-rules.js';

function playableRules(extra = {}) {
  return {
    teamSpd: testOnlyTeamSpdSum,
    isSideDefeated: testOnlySideDefeatedWhenAllKo,
    resolveApCost: testOnlyCostByType({ ATK: 2, DEF: 1, Skill: 3 }),
    perTurnActionLimit: testOnlyNoExtraActionLimit,
    ...extra,
  };
}

function openBattle(extra = {}, speeds = {}, battleId = 'stress') {
  return createBattle({
    battleId,
    sideA: testOnlySide('A', speeds.a ?? [3, 0, 0, 0]),
    sideB: testOnlySide('B', speeds.b ?? [1, 0, 0, 0]),
    rules: playableRules(extra),
  });
}

function give(state, sideId, card) {
  const added = addCard(state.hands[sideId], card);
  assert.equal(added.ok, true, added.reason);
  return card;
}

function project(state) {
  const side = (value) => ({
    sideId: value.sideId,
    members: value.members.map((member) => ({
      avatarId: member.avatarId,
      stats: { ...member.stats },
      markers: { ...(member.markers ?? {}) },
    })),
  });
  return {
    battleId: state.battleId,
    startingSideId: state.startingSideId,
    activeSideId: state.activeSideId,
    turnIndex: state.turnIndex,
    roundIndex: state.roundIndex,
    baseAp: state.baseAp,
    ap: { ...state.ap },
    outcome: structuredClone(state.outcome),
    log: structuredClone(state.log),
    hands: Object.fromEntries(
      Object.entries(state.hands).map(([sideId, hand]) => [sideId, hand.cards.map((card) => card.cardId)]),
    ),
    playedRecords: structuredClone(state.playedRecords),
    sideA: side(state.sideA),
    sideB: side(state.sideB),
  };
}

function freezeDeep(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freezeDeep(child);
  }
  return value;
}

test('invalid party sizes are rejected and do not mutate the other side', () => {
  assert.equal(PARTY_SIZE, 4);
  const intact = testOnlySide('B', [1, 0, 0, 0]);
  const snapshot = structuredClone(intact);
  const sizes = [0, 1, 2, 3, 5, 8];
  for (const size of sizes) {
    const sideA = {
      sideId: 'A',
      members: Array.from({ length: size }, (_, index) => testOnlyAvatar(`A_${index}`, 1)),
    };
    assert.throws(
      () => createBattle({ sideA, sideB: intact, rules: playableRules() }),
      (error) => {
        assert.equal(error.reason, 'PARTY_SIZE');
        assert.equal(error.sideId, 'A');
        return true;
      },
      `size ${size}`,
    );
  }
  assert.deepEqual(intact, snapshot);

  const notAnArray = { sideId: 'A', members: 'abcd' };
  assert.throws(
    () => createBattle({ sideA: notAnArray, sideB: intact, rules: playableRules() }),
    (error) => error.reason === 'PARTY_SIZE',
  );
  const arrayLike = { sideId: 'A', members: { 0: testOnlyAvatar('A', 1), length: 4 } };
  assert.throws(
    () => createBattle({ sideA: arrayLike, sideB: intact, rules: playableRules() }),
    (error) => error.reason === 'PARTY_SIZE',
  );

  const holey = [testOnlyAvatar('A1', 1), testOnlyAvatar('A2', 1), testOnlyAvatar('A3', 1)];
  holey.length = 4;
  assert.throws(
    () => createBattle({
      sideA: { sideId: 'A', members: holey },
      sideB: intact,
      rules: playableRules(),
    }),
    (error) => error instanceof TypeError,
  );
  assert.deepEqual(intact, snapshot);
});

test('empty party inputs are rejected', () => {
  const side = testOnlySide('B', [0, 0, 0, 0]);
  assert.throws(() => createBattle(), /sideA and sideB are required/);
  assert.throws(() => createBattle({}), /sideA and sideB are required/);
  assert.throws(() => createBattle({ sideA: null, sideB: side }), /sideA and sideB are required/);
  assert.throws(() => createBattle({ sideA: side, sideB: undefined }), /sideA and sideB are required/);
  assert.throws(
    () => createBattle({ sideA: {}, sideB: side, rules: playableRules() }),
    /sideId is required/,
  );
  assert.throws(
    () => createBattle({ sideA: { sideId: '', members: [] }, sideB: side, rules: playableRules() }),
    /sideId is required/,
  );
  assert.throws(
    () => createBattle({ sideA: { sideId: 'A' }, sideB: side, rules: playableRules() }),
    (error) => error.reason === 'PARTY_SIZE',
  );
  assert.throws(
    () => createBattle({ sideA: { sideId: 'A', members: [] }, sideB: side, rules: playableRules() }),
    (error) => error.reason === 'PARTY_SIZE',
  );
  assert.throws(
    () => createBattle({ sideA: { sideId: 'A', members: null }, sideB: side, rules: playableRules() }),
    (error) => error.reason === 'PARTY_SIZE',
  );
  assert.throws(
    () => createBattle({
      sideA: testOnlySide('A', [1, 0, 0, 0]),
      sideB: testOnlySide('A', [0, 0, 0, 0]),
      rules: playableRules(),
    }),
    /side ids must be different/,
  );
});

test('duplicate avatar ids stay safe because uniqueness inside a party is not a specified rule', () => {
  const shared = testOnlyAvatar('AVT_DUP', 2);
  const sideA = {
    sideId: 'A',
    members: [shared, shared, shared, shared],
  };
  const before = structuredClone(sideA);
  const state = createBattle({
    sideA,
    sideB: testOnlySide('B', [0, 0, 0, 0]),
    rules: playableRules(),
  });
  state.sideA.members[0].stats.spd = 9;
  state.sideA.members[0].markers.ko = true;
  assert.equal(shared.stats.spd, 2);
  assert.equal(shared.markers.ko, false);
  assert.deepEqual(sideA, before);
  assert.equal(state.sideA.members[1].stats.spd, 2);
  assert.equal(state.sideA.members[1].markers.ko, false);
  assert.deepEqual(
    state.sideA.members.map((member) => member.avatarId),
    ['AVT_DUP', 'AVT_DUP', 'AVT_DUP', 'AVT_DUP'],
  );

  const mirrored = createBattle({
    battleId: 'mirror',
    sideA: testOnlySide('A', [1, 1, 1, 1]),
    sideB: {
      sideId: 'B',
      members: ['AVT_AEG_001', 'AVT_PHA_001', 'AVT_CEL_001', 'AVT_SAN_001'].map((avatarId, index) => (
        testOnlyAvatar(avatarId, index)
      )),
    },
    rules: playableRules(),
  });
  const again = createBattle({
    battleId: 'mirror',
    sideA: testOnlySide('A', [1, 1, 1, 1]),
    sideB: {
      sideId: 'B',
      members: ['AVT_AEG_001', 'AVT_PHA_001', 'AVT_CEL_001', 'AVT_SAN_001'].map((avatarId, index) => (
        testOnlyAvatar(avatarId, index)
      )),
    },
    rules: playableRules(),
  });
  mirrored.sideB.members[0].avatarId = 'CHANGED';
  assert.equal(again.sideB.members[0].avatarId, 'AVT_AEG_001');
  assert.deepEqual(
    SAMPLE_AVATARS.map((avatar) => avatar.avatarId),
    ['AVT_AEG_001', 'AVT_PHA_001', 'AVT_CEL_001', 'AVT_SAN_001'],
  );
});

test('invalid card ids are not played and a closed catalog is not invented', () => {
  const state = openBattle();
  assert.equal(playCard(state, 'A', 'NO_SUCH_CARD').reason, 'CARD_MISSING');
  assert.equal(playCard(state, 'A', '').reason, 'CARD_MISSING');
  assert.equal(playCard(state, 'A', null).reason, 'CARD_MISSING');
  assert.equal(state.ap.A, BASE_AP);
  assert.equal(state.hands.A.cards.length, 0);
  assert.equal(state.playedRecords.length, 0);

  assert.equal(addCard(state.hands.A, { cardId: '', cardKind: 'action_card' }).reason, 'CARD_MISSING');
  assert.equal(addCard(state.hands.A, { name: 'missing id' }).reason, 'CARD_MISSING');

  const foreign = testOnlyActionCard({ cardId: 'ACT_NOT_IN_SAMPLE_CATALOG', actionType: 'ATK', apCost: 2 });
  give(state, 'A', foreign);
  const played = playCard(state, 'A', 'ACT_NOT_IN_SAMPLE_CATALOG');
  assert.equal(played.ok, true);
  assert.equal(played.effect, 'not_applied');
  assert.equal(state.ap.A, 3);

  const avatarCard = {
    cardId: 'AVC_AVT_AEG_001',
    cardKind: 'avatar_card',
    avatarId: 'AVT_AEG_001',
  };
  give(state, 'A', { ...testOnlyActionCard({ cardId: 'holder', actionType: 'DEF', apCost: 1 }), ...avatarCard, cardId: 'AVC_AVT_AEG_001' });
  assert.equal(playCard(state, 'A', 'AVC_AVT_AEG_001').reason, 'NOT_ACTION_CARD');
  assert.equal(state.hands.A.cards.some((card) => card.cardId === 'AVC_AVT_AEG_001'), true);
});

test('negative AP and negative costs do not spend or remove a card', () => {
  const state = openBattle();
  const card = testOnlyActionCard({ cardId: 'atk', actionType: 'ATK', apCost: 1 });
  give(state, 'A', card);
  state.ap.A = -3;
  const negativePool = playCard(state, 'A', 'atk');
  assert.equal(negativePool.reason, 'AP_INVALID');
  assert.equal(state.ap.A, -3);
  assert.equal(state.hands.A.cards.length, 1);
  assert.equal(state.playedRecords.length, 0);

  state.ap.A = null;
  assert.equal(playCard(state, 'A', 'atk').reason, 'AP_UNAVAILABLE');
  assert.equal(state.hands.A.cards.length, 1);

  state.ap.A = 1.5;
  assert.equal(playCard(state, 'A', 'atk').reason, 'AP_INVALID');
  state.ap.A = BASE_AP;

  const priced = testOnlyActionCard({ cardId: 'priced', actionType: 'ATK', apCost: -2 });
  give(state, 'A', priced);
  const rejected = playCard(state, 'A', 'priced');
  assert.equal(rejected.ok, false);
  assert.ok(rejected.reason === 'INVALID_CARD' || rejected.reason === 'INVALID_AP_COST');
  assert.equal(state.ap.A, BASE_AP);
  assert.equal(resolveApCost(priced, {}).reason, 'INVALID_AP_COST');

  const sinking = openBattle({
    resolveApCost: () => -1,
  });
  give(sinking, 'A', testOnlyActionCard({ cardId: 'null-cost', actionType: 'DEF' }));
  assert.equal(playCard(sinking, 'A', 'null-cost').reason, 'INVALID_AP_COST');
  assert.equal(sinking.ap.A, BASE_AP);
  assert.equal(sinking.hands.A.cards.length, 1);

  const fresh = openBattle();
  give(fresh, 'A', testOnlyActionCard({ cardId: 'zero', actionType: 'ATK', apCost: 0 }));
  assert.equal(playCard(fresh, 'A', 'zero').ok, true);
  assert.equal(fresh.ap.A, BASE_AP);
  assert.ok(fresh.ap.A >= 0);
});

test('engine turns assign base AP and a cost above that pool is unaffordable', () => {
  assert.equal(BASE_AP, 5);
  const state = openBattle();
  assert.equal(state.ap.A, 5);
  assert.equal(state.ap.B, null);
  assert.equal(state.baseAp, 5);

  state.ap.A = 4;
  endTurn(state);
  assert.equal(state.ap.B, 5);
  assert.equal(state.ap.A, 4);
  endTurn(state);
  assert.equal(state.activeSideId, 'A');
  assert.equal(state.ap.A, 5);

  const costly = openBattle();
  give(costly, 'A', testOnlyActionCard({ cardId: 'six', actionType: 'ATK', apCost: 6 }));
  const blocked = playCard(costly, 'A', 'six');
  assert.equal(blocked.reason, 'INSUFFICIENT_AP');
  assert.equal(blocked.cost, 6);
  assert.equal(blocked.ap, 5);
  assert.equal(costly.ap.A, 5);
  assert.equal(costly.hands.A.cards.length, 1);

  give(costly, 'A', testOnlyActionCard({ cardId: 'exact', actionType: 'DEF', apCost: 5 }));
  assert.equal(playCard(costly, 'A', 'exact').ok, true);
  assert.equal(costly.ap.A, 0);
  assert.ok(costly.ap.A <= BASE_AP);
});

test('a card cannot be played twice, including when a hand is built with a duplicate id', () => {
  assert.throws(
    () => createHand('A', [
      testOnlyActionCard({ cardId: 'same', actionType: 'ATK' }),
      testOnlyActionCard({ cardId: 'same', actionType: 'DEF' }),
    ]),
    (error) => {
      assert.equal(error.reason, 'DUPLICATE_CARD_ID');
      assert.equal(error.cardId, 'same');
      return true;
    },
  );
  assert.throws(
    () => createHand('A', Array.from({ length: 6 }, (_, index) => (
      testOnlyActionCard({ cardId: index === 5 ? 'c0' : `c${index}`, actionType: 'ATK' })
    ))),
    (error) => error.reason === 'HAND_FULL',
  );

  const state = openBattle();
  give(state, 'A', testOnlyActionCard({ cardId: 'once', actionType: 'ATK', apCost: 2 }));
  give(state, 'A', testOnlyActionCard({ cardId: 'other', actionType: 'DEF', apCost: 1 }));
  assert.equal(playCard(state, 'A', 'once').ok, true);
  assert.equal(state.ap.A, 3);
  const second = playCard(state, 'A', 'once');
  assert.equal(second.ok, false);
  assert.equal(second.reason, 'CARD_MISSING');
  assert.equal(state.ap.A, 3);
  assert.equal(state.playedRecords.filter((event) => event.cardId === 'once').length, 1);
  assert.equal(state.hands.A.cards.some((card) => card.cardId === 'once'), false);
  assert.equal(state.hands.A.cards.some((card) => card.cardId === 'other'), true);

  const corrupt = openBattle();
  const copy = testOnlyActionCard({ cardId: 'dup', actionType: 'ATK' });
  give(corrupt, 'A', copy);
  corrupt.hands.A.cards.push(structuredClone(corrupt.hands.A.cards[0]));
  const refused = playCard(corrupt, 'A', 'dup');
  assert.equal(refused.reason, 'DUPLICATE_CARD_ID');
  assert.equal(corrupt.ap.A, BASE_AP);
  assert.equal(corrupt.hands.A.cards.length, 2);
  assert.equal(corrupt.playedRecords.length, 0);
  assert.equal(corrupt.log.some((event) => event.type === 'play'), false);
});

test('a side cannot act on the other side\'s turn', () => {
  const state = openBattle();
  give(state, 'B', testOnlyActionCard({ cardId: 'b-atk', actionType: 'ATK', apCost: 1 }));
  give(state, 'A', testOnlyActionCard({ cardId: 'a-atk', actionType: 'ATK', apCost: 1 }));
  state.ap.B = 5;
  const outside = playCard(state, 'B', 'b-atk');
  assert.equal(outside.reason, 'NOT_ACTIVE_SIDE');
  assert.equal(state.hands.B.cards.length, 1);
  assert.equal(state.ap.B, 5);
  assert.equal(state.ap.A, 5);
  assert.equal(state.activeSideId, 'A');
  assert.equal(playCard(state, 'NOBODY', 'a-atk').reason, 'NOT_ACTIVE_SIDE');
  assert.equal(playCard(state, null, 'a-atk').reason, 'NOT_ACTIVE_SIDE');
  assert.equal(playCard(state, 'A', 'a-atk').ok, true);

  endTurn(state);
  assert.equal(state.activeSideId, 'B');
  assert.equal(playCard(state, 'A', 'a-atk').reason, 'NOT_ACTIVE_SIDE');
  assert.equal(playCard(state, 'B', 'b-atk').ok, true);
  delete state.hands.B;
  assert.equal(playCard(state, 'B', 'b-atk').reason, 'UNKNOWN_SIDE');
});

test('an unaffordable card stays in hand and does not change AP', () => {
  const state = openBattle();
  give(state, 'A', testOnlyActionCard({ cardId: 'dear', actionType: 'Skill', apCost: 3 }));
  give(state, 'A', testOnlyActionCard({ cardId: 'cheap', actionType: 'DEF', apCost: 1 }));
  state.ap.A = 2;
  const poor = playCard(state, 'A', 'dear');
  assert.equal(poor.reason, 'INSUFFICIENT_AP');
  assert.equal(poor.cost, 3);
  assert.equal(state.ap.A, 2);
  assert.equal(state.hands.A.cards.length, 2);
  assert.equal(playCard(state, 'A', 'cheap').ok, true);
  assert.equal(state.ap.A, 1);
  assert.equal(playCard(state, 'A', 'dear').reason, 'INSUFFICIENT_AP');

  const blocked = openBattle();
  give(blocked, 'A', testOnlyActionCard({ cardId: 'null-cost', actionType: 'ATK' }));
  blocked.rules.resolveApCost = defaultRules().resolveApCost;
  assert.throws(() => playCard(blocked, 'A', 'null-cost'), (error) => {
    assert.equal(error.questionId, 'Q-AP-COST');
    return true;
  });
  assert.equal(blocked.ap.A, BASE_AP);
  assert.equal(blocked.hands.A.cards.length, 1);
});

test('invalid action types are rejected by validation, play, and effect resolution', () => {
  const badTypes = ['ATTACK', 'atk', 'skill', 'SKILL', '', null, undefined, 'ULTIMATE'];
  for (const actionType of badTypes) {
    const card = testOnlyActionCard({ cardId: 'bad', actionType: 'ATK' });
    card.actionType = actionType;
    const state = openBattle();
    give(state, 'A', card);
    const result = playCard(state, 'A', 'bad');
    assert.equal(result.reason, 'INVALID_CARD', String(actionType));
    assert.equal(state.ap.A, BASE_AP);
    assert.equal(state.hands.A.cards.length, 1);
    assert.throws(
      () => resolveEffect(state, card),
      (error) => error instanceof TypeError,
    );
    assert.equal(state.sideA.members[0].stats.pow, 0);
  }
});

test('repeated turn transitions keep alternation, base AP, and a decided battle stays put', () => {
  const state = openBattle({}, { a: [4, 0, 0, 0], b: [1, 0, 0, 0] });
  assert.equal(state.startingSideId, 'A');
  for (let step = 0; step < 40; step += 1) {
    const before = state.turnIndex;
    const result = endTurn(state);
    assert.equal(result.ok, true);
    assert.equal(state.turnIndex, before + 1);
    assert.equal(state.roundIndex, Math.ceil(state.turnIndex / 2));
    const expected = state.turnIndex % 2 === 1 ? 'A' : 'B';
    assert.equal(state.activeSideId, expected);
    assert.equal(state.ap[expected], BASE_AP);
    assert.ok(state.ap.A === null || (Number.isInteger(state.ap.A) && state.ap.A >= 0 && state.ap.A <= BASE_AP));
    assert.ok(state.ap.B === null || (Number.isInteger(state.ap.B) && state.ap.B >= 0 && state.ap.B <= BASE_AP));
    assert.equal(state.outcome.status, 'ongoing');
  }
  assert.equal(state.turnIndex, 41);
  assert.equal(state.activeSideId, 'A');
  assert.equal(state.roundIndex, 21);

  const starterB = openBattle({}, { a: [0, 0, 0, 0], b: [2, 0, 0, 0] });
  assert.equal(starterB.startingSideId, 'B');
  endTurn(starterB);
  endTurn(starterB);
  endTurn(starterB);
  assert.equal(starterB.turnIndex, 4);
  assert.equal(starterB.roundIndex, 2);
  assert.equal(starterB.activeSideId, 'A');
  assert.equal(starterB.ap.A, BASE_AP);

  for (const member of state.sideB.members) member.markers.ko = true;
  const victory = evaluateOutcome(state);
  assert.equal(victory.winnerSideId, 'A');
  assert.equal(victory.verdict.B, 'defeat');
  const frozenTurn = state.turnIndex;
  for (let extra = 0; extra < 5; extra += 1) {
    assert.equal(endTurn(state).reason, 'BATTLE_DECIDED');
  }
  assert.equal(state.turnIndex, frozenTurn);
  assert.equal(playCard(state, 'A', 'missing').reason, 'BATTLE_DECIDED');

  const loss = openBattle();
  for (const member of loss.sideA.members) member.markers.ko = true;
  const defeat = evaluateOutcome(loss);
  assert.equal(defeat.verdict.A, 'defeat');
  assert.equal(defeat.winnerSideId, 'B');
  assert.equal(endTurn(loss).reason, 'BATTLE_DECIDED');
  assert.equal(loss.turnIndex, 1);
});

test('inputs, previous snapshots, and frozen objects are not partially mutated', () => {
  const sideA = freezeDeep(testOnlySide('A', [4, 1, 0, 2]));
  const sideB = freezeDeep(testOnlySide('B', [1, 0, 0, 0]));
  const beforeA = structuredClone(sideA);
  const beforeB = structuredClone(sideB);
  const state = createBattle({ sideA, sideB, rules: playableRules(), battleId: 'frozen-input' });
  state.sideA.members[0].stats.pow = 40;
  state.sideA.members[0].markers.ko = true;
  assert.deepEqual(sideA, beforeA);
  assert.deepEqual(sideB, beforeB);
  assert.equal(Object.isFrozen(sideA), true);
  assert.equal(Object.isFrozen(sideA.members[0].stats), true);
  assert.notEqual(state.sideA.members[0], sideA.members[0]);
  assert.notEqual(state.sideA.members[0].stats, sideA.members[0].stats);

  const catalogBefore = structuredClone(SAMPLE_AVATARS);
  const catalogBattle = createBattle({
    sideA: { sideId: 'HEROES', members: SAMPLE_AVATARS },
    sideB: testOnlySide('B', [1, 0, 0, 0]),
    rules: playableRules(),
  });
  catalogBattle.sideA.members[0].stats.pow = 1;
  assert.deepEqual(SAMPLE_AVATARS, catalogBefore);
  assert.equal(Object.isFrozen(SAMPLE_AVATARS[0]), true);
  assert.equal(SAMPLE_AVATARS[0].stats.pow, null);

  const card = freezeDeep(testOnlyActionCard({ cardId: 'frozen-card', actionType: 'ATK', apCost: 1 }));
  const hand = createHand('A');
  assert.equal(addCard(hand, card).ok, true);
  assert.notEqual(hand.cards[0], card);
  hand.cards[0].name = 'local edit';
  assert.equal(card.name, null);
  assert.equal(Object.isFrozen(card), true);

  const live = openBattle();
  give(live, 'A', testOnlyActionCard({ cardId: 'snap', actionType: 'DEF', apCost: 1 }));
  const firstView = publicView(live);
  const firstProjection = project(live);
  const savedProjection = structuredClone(firstProjection);
  playCard(live, 'A', 'snap');
  endTurn(live);
  assert.deepEqual(publicView(live).log.slice(0, firstView.log.length), firstView.log);
  assert.equal(firstView.turnIndex, 1);
  assert.equal(firstView.ap.A, 5);
  assert.deepEqual(firstProjection, savedProjection);
  firstView.ap.A = 0;
  firstView.log.push({ type: 'tamper' });
  firstView.hands.A.push('tamper');
  assert.equal(live.ap.A, 4);
  assert.equal(live.log.some((event) => event.type === 'tamper'), false);
  assert.equal(live.hands.A.cards.some((held) => held.cardId === 'tamper'), false);

  const bare = testOnlySide('A', [2, 0, 0, 0]);
  delete bare.members[0].markers;
  const bareBefore = structuredClone(bare);
  const marked = createBattle({
    sideA: bare,
    sideB: testOnlySide('B', [0, 0, 0, 0]),
    rules: playableRules(),
  });
  assert.deepEqual(bare, bareBefore);
  assert.deepEqual(marked.sideA.members[0].markers, {});

  const mutating = testOnlySide('A', [3, 0, 0, 0]);
  const mutatingBefore = structuredClone(mutating);
  assert.throws(() => createBattle({
    sideA: mutating,
    sideB: testOnlySide('B', [0, 0, 0, 0]),
    rules: {
      teamSpd(side) {
        side.members[0].stats.spd = 0;
        throw new Error('stub failed after touching the clone');
      },
      isSideDefeated: testOnlySideDefeatedWhenAllKo,
    },
  }));
  assert.deepEqual(mutating, mutatingBefore);
});

test('a frozen log, AP pool, or play record list does not leave a half-applied turn or play', () => {
  const frozenLog = openBattle();
  const logTurns = frozenLog.turnIndex;
  Object.freeze(frozenLog.log);
  assert.throws(() => endTurn(frozenLog), TypeError);
  assert.equal(frozenLog.turnIndex, logTurns);
  assert.equal(frozenLog.roundIndex, 1);
  assert.equal(frozenLog.activeSideId, 'A');
  assert.equal(frozenLog.ap.A, BASE_AP);
  assert.equal(frozenLog.ap.B, null);
  assert.equal(frozenLog.log.length, 2);

  const frozenAp = openBattle();
  Object.freeze(frozenAp.ap);
  assert.throws(() => endTurn(frozenAp), TypeError);
  assert.equal(frozenAp.turnIndex, 1);
  assert.equal(frozenAp.activeSideId, 'A');
  assert.equal(frozenAp.ap.B, null);

  const frozenState = openBattle();
  Object.freeze(frozenState);
  assert.throws(() => endTurn(frozenState), TypeError);
  assert.equal(frozenState.turnIndex, 1);
  assert.equal(frozenState.activeSideId, 'A');

  const playLog = openBattle();
  give(playLog, 'A', testOnlyActionCard({ cardId: 'a', actionType: 'ATK', apCost: 1 }));
  Object.freeze(playLog.log);
  assert.throws(() => playCard(playLog, 'A', 'a'), TypeError);
  assert.equal(playLog.ap.A, BASE_AP);
  assert.equal(playLog.hands.A.cards.length, 1);
  assert.equal(playLog.playedRecords.length, 0);
  assert.equal(playLog.log.some((event) => event.type === 'play'), false);

  const playRecords = openBattle();
  give(playRecords, 'A', testOnlyActionCard({ cardId: 'a', actionType: 'ATK', apCost: 1 }));
  Object.freeze(playRecords.playedRecords);
  assert.throws(() => playCard(playRecords, 'A', 'a'), TypeError);
  assert.equal(playRecords.ap.A, BASE_AP);
  assert.equal(playRecords.hands.A.cards.length, 1);
  assert.equal(playRecords.log.some((event) => event.type === 'play'), false);

  const playAp = openBattle();
  give(playAp, 'A', testOnlyActionCard({ cardId: 'a', actionType: 'ATK', apCost: 1 }));
  Object.freeze(playAp.ap);
  assert.throws(() => playCard(playAp, 'A', 'a'), TypeError);
  assert.equal(playAp.ap.A, BASE_AP);
  assert.equal(playAp.hands.A.cards.length, 1);
  assert.equal(playAp.playedRecords.length, 0);
});

test('the same inputs and stubs produce the same state sequence', () => {
  const run = () => {
    const frames = [];
    const state = createBattle({
      battleId: 'replay-1',
      sideA: testOnlySide('A', [4, 1, 0, 2]),
      sideB: testOnlySide('B', [1, 1, 1, 0]),
      rules: playableRules(),
    });
    frames.push(project(state));
    frames.push(publicView(state));
    give(state, 'A', testOnlyActionCard({ cardId: 'a-atk', actionType: 'ATK' }));
    give(state, 'A', testOnlyActionCard({ cardId: 'a-def', actionType: 'DEF' }));
    give(state, 'A', testOnlyActionCard({ cardId: 'a-skill', actionType: 'Skill' }));
    give(state, 'B', testOnlyActionCard({ cardId: 'b-atk', actionType: 'ATK' }));
    frames.push(project(state));
    assert.equal(playCard(state, 'A', 'a-atk').ok, true);
    frames.push(project(state));
    assert.equal(playCard(state, 'A', 'a-skill').ok, true);
    frames.push(project(state));
    assert.equal(playCard(state, 'A', 'a-def').reason, 'INSUFFICIENT_AP');
    frames.push(project(state));
    endTurn(state);
    frames.push(project(state));
    assert.equal(playCard(state, 'B', 'b-atk').ok, true);
    frames.push(project(state));
    endTurn(state);
    endTurn(state);
    frames.push(project(state));
    frames.push(publicView(state));
    return frames;
  };
  const first = run();
  const second = run();
  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(first.at(-2).ap.A, BASE_AP);
  assert.equal(first.at(-2).playedRecords.length, 3);
  assert.deepEqual(first.at(-2).playedRecords.map((event) => event.effect), ['not_applied', 'not_applied', 'not_applied']);

  const root = fileURLToPath(new URL('../../src/', import.meta.url));
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name.endsWith('.js')) files.push(path);
    }
  };
  walk(root);
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    assert.equal(source.includes('Math.random'), false, file);
    assert.equal(source.includes('TEST-ONLY'), false, file);
    assert.equal(source.includes('stub-rules'), false, file);
  }
});

test('invalid injected rules are rejected and do not commit a play or a turn', () => {
  const sideA = () => testOnlySide('A', [1, 0, 0, 0]);
  const sideB = () => testOnlySide('B', [1, 0, 0, 0]);
  assert.throws(() => resolveRules(null), /rules must be an object/);
  assert.throws(() => resolveRules([]), /rules must be an object/);
  assert.throws(() => resolveRules('spd'), /rules must be an object/);
  assert.throws(() => resolveRules(4), /rules must be an object/);
  assert.throws(
    () => createBattle({ sideA: sideA(), sideB: testOnlySide('B', [0, 0, 0, 0]), rules: null }),
    (error) => error instanceof DesignBlockedError && error.questionId === 'Q-SPD-AGG',
  );
  assert.throws(() => createBattle({ sideA: sideA(), sideB: sideB(), rules: [] }), TypeError);
  assert.throws(() => createBattle({ sideA: sideA(), sideB: sideB(), rules: 4 }), TypeError);
  assert.throws(
    () => createBattle({
      sideA: sideA(),
      sideB: sideB(),
      rules: { teamSpd: testOnlyTeamSpdSum, notARule() {} },
    }),
    /Unknown rule/,
  );
  assert.throws(
    () => createBattle({
      sideA: sideA(),
      sideB: sideB(),
      rules: { teamSpd: 'sum' },
    }),
    /must be a function/,
  );

  for (const value of [NaN, Infinity, -Infinity, '3', null, undefined, {}, [], true]) {
    assert.throws(
      () => createBattle({
        sideA: sideA(),
        sideB: testOnlySide('B', [0, 0, 0, 0]),
        rules: { teamSpd: () => value, isSideDefeated: testOnlySideDefeatedWhenAllKo },
      }),
      TypeError,
      `teamSpd ${String(value)}`,
    );
  }
  for (const value of [null, undefined, 'Z', '', 'A ', { sideId: 'A' }, 1, true]) {
    assert.throws(
      () => createBattle({
        sideA: sideA(),
        sideB: sideB(),
        rules: {
          teamSpd: testOnlyTeamSpdSum,
          isSideDefeated: testOnlySideDefeatedWhenAllKo,
          spdTieBreak: () => value,
        },
      }),
      /spdTieBreak must return one of the side ids/,
      `tie ${JSON.stringify(value)}`,
    );
  }
  const tie = () => {
    throw new DesignBlockedError('SPD tie-break rule', 'Q-SPD-TIE');
  };
  assert.throws(
    () => createBattle({
      sideA: sideA(),
      sideB: sideB(),
      rules: { teamSpd: testOnlyTeamSpdSum, isSideDefeated: testOnlySideDefeatedWhenAllKo, spdTieBreak: tie },
    }),
    (error) => error.questionId === 'Q-SPD-TIE',
  );

  for (const value of [1, 0, 'true', 'false', null, undefined, {}, []]) {
    assert.throws(
      () => createBattle({
        sideA: testOnlySide('A', [2, 0, 0, 0]),
        sideB: testOnlySide('B', [0, 0, 0, 0]),
        rules: { teamSpd: testOnlyTeamSpdSum, isSideDefeated: () => value },
      }),
      /isSideDefeated must return a boolean/,
    );
  }

  const midTurn = openBattle();
  const checkpoint = project(midTurn);
  midTurn.rules.isSideDefeated = () => 'yes';
  assert.throws(() => endTurn(midTurn), /isSideDefeated must return a boolean/);
  assert.equal(midTurn.turnIndex, checkpoint.turnIndex);
  assert.equal(midTurn.activeSideId, checkpoint.activeSideId);
  assert.equal(midTurn.ap.B, null);
  assert.equal(midTurn.log.length, checkpoint.log.length);

  const state = openBattle();
  give(state, 'A', testOnlyActionCard({ cardId: 'a', actionType: 'ATK' }));
  for (const value of [false, null, 1, 'ok', {}, { ok: 'yes' }, { ok: 1 }]) {
    state.rules.perTurnActionLimit = () => value;
    assert.throws(
      () => playCard(state, 'A', 'a'),
      /perTurnActionLimit must return/,
      `limit ${JSON.stringify(value)}`,
    );
    assert.equal(state.ap.A, BASE_AP);
    assert.equal(state.hands.A.cards.length, 1);
  }
  state.rules.perTurnActionLimit = () => {
    throw new Error('limit exploded');
  };
  assert.throws(() => playCard(state, 'A', 'a'), /limit exploded/);
  assert.equal(state.ap.A, BASE_AP);
  assert.equal(state.hands.A.cards.length, 1);

  state.rules.perTurnActionLimit = testOnlyNoExtraActionLimit;
  state.rules.resolveApCost = () => {
    throw new Error('cost exploded');
  };
  assert.throws(() => playCard(state, 'A', 'a'), /cost exploded/);
  assert.equal(state.hands.A.cards.length, 1);
  assert.equal(state.ap.A, BASE_AP);
  state.rules.resolveApCost = testOnlyCostByType({ ATK: 1, DEF: 1, Skill: 1 });
  state.rules.perTurnActionLimit = undefined;
  assert.throws(() => playCard(state, 'A', 'a'), (error) => error.reason === 'ACTION_LIMIT_RULE_MISSING');
  assert.equal(state.ap.A, BASE_AP);
  assert.equal(state.hands.A.cards.length, 1);

  const nullCost = testOnlyActionCard({ cardId: 'n', actionType: 'ATK' });
  assert.throws(() => resolveApCost(nullCost, {}), (error) => error.reason === 'AP_COST_RULE_MISSING');
  assert.throws(() => resolveApCost(nullCost, { resolveApCost: 'nope' }), (error) => error.reason === 'AP_COST_RULE_MISSING');
  assert.deepEqual(
    resolveApCost(nullCost, { resolveApCost: () => ({ cost: 4, label: TEST_ONLY }) }),
    { ok: true, cost: 4, source: 'rule' },
  );
  for (const value of [-1, 1.5, NaN, '2', null, undefined, {}, { cost: -1 }, { cost: 1.5 }, { cost: true }, true]) {
    assert.equal(
      resolveApCost(nullCost, { resolveApCost: () => value }).reason,
      'INVALID_AP_COST',
      `cost ${JSON.stringify(value)}`,
    );
  }

  const effectState = openBattle();
  const attack = testOnlyActionCard({ cardId: 'atk', actionType: 'ATK' });
  effectState.rules.damage = () => {
    effectState.sideB.members[0].stats.def = 99;
    throw new Error('damage exploded');
  };
  assert.throws(() => resolveEffect(effectState, attack), /damage exploded/);
  assert.equal(effectState.sideB.members[0].stats.def, 99);
  effectState.rules.damage = defaultRules().damage;
  assert.throws(() => resolveEffect(effectState, attack), (error) => error.questionId === 'Q-DAMAGE');
});

test('battles start with empty hands and an empty hand cannot play', () => {
  const state = openBattle();
  assert.deepEqual(state.hands.A.cards, []);
  assert.deepEqual(state.hands.B.cards, []);
  assert.equal(playCard(state, 'A', 'anything').reason, 'CARD_MISSING');
  assert.equal(state.log.some((event) => event.type === 'play'), false);
  assert.equal(removeCard(state.hands.A, 'anything').reason, 'NOT_IN_HAND');
  assert.throws(() => drawCards(state.hands.A, { cards: [] }), (error) => error.questionId === 'Q-DRAW-DISCARD');
  assert.equal(state.hands.A.cards.length, 0);
  endTurn(state);
  assert.equal(state.outcome.status, 'ongoing');
  assert.equal(state.hands.B.cards.length, 0);

  const hand = createHand('A');
  assert.equal(hand.cards.length, 0);
  assert.equal(removeCard(hand, 'gone').reason, 'NOT_IN_HAND');
  assert.throws(() => createHand(''), /ownerId is required/);
  assert.throws(() => createHand(null), /ownerId is required/);
  assert.throws(() => discardCard(hand, 'gone'), (error) => error.questionId === 'Q-DRAW-DISCARD');
  const injectedDiscard = () => ({ ok: false, reason: 'TEST-ONLY-DISCARD', label: TEST_ONLY });
  injectedDiscard.label = TEST_ONLY;
  assert.equal(discardCard(hand, 'gone', { discard: injectedDiscard }).reason, 'TEST-ONLY-DISCARD');
  assert.equal(hand.cards.length, 0);
  assert.equal(assessActionPlay({
    card: null,
    inHand: false,
    ap: 5,
    rules: playableRules(),
    playsThisTurn: 0,
  }).reason, 'CARD_MISSING');
});

test('unknown card effects stay unapplied and blocked', () => {
  const state = openBattle();
  const statsBefore = structuredClone({
    a: state.sideA.members.map((member) => member.stats),
    b: state.sideB.members.map((member) => member.stats),
  });
  const skill = testOnlyActionCard({ cardId: 'mystery', actionType: 'Skill', apCost: 3 });
  skill.effectId = 'EFFECT_DOES_NOT_EXIST';
  give(state, 'A', skill);
  const attack = testOnlyActionCard({ cardId: 'swing', actionType: 'ATK', apCost: 2 });
  attack.effectId = 'ALSO_UNKNOWN';
  give(state, 'A', attack);
  const played = playCard(state, 'A', 'mystery');
  assert.equal(played.ok, true);
  assert.equal(played.effect, 'not_applied');
  assert.equal(state.sideA.members[0].hp, undefined);
  assert.deepEqual(state.sideA.members.map((member) => member.stats), statsBefore.a);
  assert.deepEqual(state.sideB.members.map((member) => member.stats), statsBefore.b);
  assert.throws(() => resolveEffect(state, skill), (error) => {
    assert.ok(error instanceof DesignBlockedError);
    assert.equal(error.code, 'BLOCKED_BY_DESIGN');
    assert.equal(error.questionId, 'Q-SKILL');
    return true;
  });
  assert.throws(() => resolveEffect(state, attack), (error) => error.questionId === 'Q-DAMAGE');
  assert.throws(
    () => resolveEffect(state, { cardKind: 'avatar_card', actionType: 'ATK', cardId: 'AVC_AVT_AEG_001' }),
    /action card/,
  );
  assert.deepEqual(state.sideA.members.map((member) => member.stats), statsBefore.a);
  assert.deepEqual(state.sideB.members.map((member) => member.stats), statsBefore.b);
  assert.throws(() => defaultRules().skillEffect({ effectId: 'EFFECT_DOES_NOT_EXIST' }), (error) => error.questionId === 'Q-SKILL');
  assert.throws(() => defaultRules().damage({ effectId: 'ALSO_UNKNOWN' }), (error) => error.questionId === 'Q-DAMAGE');
});

test('simultaneous defeat stays BLOCKED_BY_DESIGN and does not invent a draw', () => {
  assert.throws(() => defaultRules().simultaneousDefeat({}), (error) => {
    assert.ok(error instanceof DesignBlockedError);
    assert.equal(error.code, 'BLOCKED_BY_DESIGN');
    assert.equal(error.questionId, 'Q-SIMULTANEOUS');
    return true;
  });

  const state = openBattle();
  for (const member of [...state.sideA.members, ...state.sideB.members]) member.markers.ko = true;
  const before = structuredClone(state.outcome);
  assert.equal(before.status, 'ongoing');
  assert.throws(() => evaluateOutcome(state), (error) => error.questionId === 'Q-SIMULTANEOUS');
  assert.deepEqual(state.outcome, before);
  assert.equal(state.outcome.winnerSideId, null);

  for (const value of [null, undefined, 'A', 'draw', {}, { winnerSideId: null }, { winnerSideId: 'Z' }, { draw: true }]) {
    state.rules.simultaneousDefeat = () => value;
    assert.throws(
      () => evaluateOutcome(state),
      (error) => error.reason === 'SIMULTANEOUS_UNRESOLVED' || error.questionId === 'Q-SIMULTANEOUS' || error instanceof TypeError,
      `simultaneous ${JSON.stringify(value)}`,
    );
    assert.deepEqual(state.outcome, before);
  }

  state.rules.simultaneousDefeat = defaultRules().simultaneousDefeat;
  const turn = state.turnIndex;
  const active = state.activeSideId;
  assert.throws(() => endTurn(state), (error) => error.questionId === 'Q-SIMULTANEOUS');
  assert.equal(state.turnIndex, turn);
  assert.equal(state.activeSideId, active);
  assert.equal(state.ap.B, null);
  assert.equal(state.outcome.status, 'ongoing');
  assert.equal(state.log.at(-1).type, 'turn_start');
  assert.equal(state.log.at(-1).turnIndex, 1);

  assert.throws(() => createBattle({
    sideA: testOnlySide('A', [1, 0, 0, 0]),
    sideB: testOnlySide('B', [0, 0, 0, 0]),
    rules: {
      teamSpd: testOnlyTeamSpdSum,
      isSideDefeated: () => true,
    },
  }), (error) => error.questionId === 'Q-SIMULTANEOUS');

  const drawAttempt = openBattle({
    simultaneousDefeat: () => ({ winnerSideId: 'A', draw: true, label: TEST_ONLY }),
  });
  for (const member of [...drawAttempt.sideA.members, ...drawAttempt.sideB.members]) member.markers.ko = true;
  const namedDraw = evaluateOutcome(drawAttempt);
  assert.equal(namedDraw.winnerSideId, 'A');
  assert.equal(namedDraw.verdict.A, 'victory');
  assert.equal(namedDraw.verdict.B, 'defeat');
  assert.equal(Object.values(namedDraw.verdict).includes('draw'), false);

  const injected = openBattle({
    simultaneousDefeat: () => ({ winnerSideId: 'B', label: TEST_ONLY }),
  });
  for (const member of [...injected.sideA.members, ...injected.sideB.members]) member.markers.ko = true;
  const named = evaluateOutcome(injected);
  assert.equal(named.winnerSideId, 'B');
  assert.equal(named.verdict.A, 'defeat');
  assert.notEqual(named.verdict.A, 'draw');
  assert.throws(() => defaultRules().simultaneousDefeat({}), (error) => error.code === 'BLOCKED_BY_DESIGN');
});
