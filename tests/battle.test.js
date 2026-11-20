import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createBattle, endTurn, evaluateOutcome, playCard, publicView, resolveEffect } from '../src/battle/battle.js';
import { createMatch, getOutcome } from '../src/engine/index.js';
import { matchInput } from './engine/fixture.js';
import { addCard } from '../src/cards/hand.js';
import { defaultRules } from '../src/design/blocked-rules.js';
import { DesignBlockedError } from '../src/design/errors.js';
import { BASE_AP } from '../src/schema/constants.js';
import {
  TEST_ONLY,
  testOnlyActionCard,
  testOnlyCostByType,
  testOnlyMaxPlays,
  testOnlyNoExtraActionLimit,
  testOnlySide,
  testOnlySideDefeatedWhenAllKo,
  testOnlyTeamSpdSum,
} from './helpers/stub-rules.js';

function rules(extra = {}) {
  return {
    teamSpd: testOnlyTeamSpdSum,
    isSideDefeated: testOnlySideDefeatedWhenAllKo,
    ...extra,
  };
}

function assertTestOnly(fn) {
  assert.equal(fn.label, TEST_ONLY);
}

test('missing team SPD and missing defeat rules throw design blocks', () => {
  const sideA = testOnlySide('A', [1, 0, 0, 0]);
  const sideB = testOnlySide('B', [0, 0, 0, 0]);
  assert.throws(() => createBattle({ sideA, sideB }), (error) => {
    assert.ok(error instanceof DesignBlockedError);
    assert.equal(error.code, 'BLOCKED_BY_DESIGN');
    assert.equal(error.questionId, 'Q-SPD-AGG');
    return true;
  });
  assert.throws(() => createBattle({ sideA, sideB, rules: { teamSpd: testOnlyTeamSpdSum } }), (error) => {
    assert.equal(error.questionId, 'Q-HP');
    return true;
  });
});

test('a side must contain exactly four avatars', () => {
  const sideA = testOnlySide('A', [1, 0, 0, 0]);
  sideA.members.pop();
  assert.throws(() => createBattle({ sideA, sideB: testOnlySide('B', [0, 0, 0, 0]), rules: rules() }), (error) => {
    assert.equal(error.reason, 'PARTY_SIZE');
    return true;
  });
});

test('the higher team SPD starts, including when that side is side B', () => {
  assertTestOnly(testOnlyTeamSpdSum);
  const slower = createBattle({
    sideA: testOnlySide('A', [1, 0, 0, 0]),
    sideB: testOnlySide('B', [2, 0, 0, 0]),
    rules: rules(),
  });
  assert.equal(slower.startingSideId, 'B');
  assert.equal(slower.activeSideId, 'B');
  assert.equal(slower.ap.B, BASE_AP);
  assert.equal(slower.ap.A, null);

  const faster = createBattle({
    sideA: testOnlySide('A', [4, 0, 0, 0]),
    sideB: testOnlySide('B', [1, 0, 0, 0]),
    rules: rules(),
  });
  assert.equal(faster.startingSideId, 'A');
});

test('team SPD is whatever the injected rule returns', () => {
  const rule = (side) => (side.sideId === 'A' ? 1 : 9);
  rule.label = TEST_ONLY;
  const battle = createBattle({
    sideA: testOnlySide('A', [9, 9, 9, 9]),
    sideB: testOnlySide('B', [0, 0, 0, 0]),
    rules: rules({ teamSpd: rule }),
  });
  assert.equal(battle.startingSideId, 'B');
  assert.equal(battle.log[0].teamSpd.A, 1);
  assert.equal(battle.log[0].teamSpd.B, 9);
});

test('equal team SPD throws, and an injected tie-break can name the starter', () => {
  const sideA = testOnlySide('A', [1, 0, 0, 0]);
  const sideB = testOnlySide('B', [1, 0, 0, 0]);
  assert.throws(() => createBattle({ sideA, sideB, rules: rules() }), (error) => {
    assert.equal(error.questionId, 'Q-SPD-TIE');
    return true;
  });
  const tie = () => 'B';
  tie.label = TEST_ONLY;
  const battle = createBattle({ sideA, sideB, rules: rules({ spdTieBreak: tie }) });
  assert.equal(battle.startingSideId, 'B');
});

test('turns alternate and AP refreshes to 5 at the start of that side\'s turn', () => {
  const caller = testOnlySide('A', [2, 0, 0, 0]);
  const battle = createBattle({
    sideA: caller,
    sideB: testOnlySide('B', [0, 0, 0, 0]),
    rules: rules(),
  });
  battle.sideA.members[0].markers.ko = true;
  assert.equal(caller.members[0].markers.ko, false);
  assert.equal(battle.baseAp, 5);
  assert.equal(battle.ap.A, 5);
  battle.ap.A = 2;
  const toB = endTurn(battle);
  assert.equal(toB.activeSideId, 'B');
  assert.equal(battle.turnIndex, 2);
  assert.equal(battle.roundIndex, 1);
  assert.equal(battle.ap.B, 5);
  assert.equal(battle.ap.A, 2);
  const backToA = endTurn(battle);
  assert.equal(backToA.activeSideId, 'A');
  assert.equal(battle.turnIndex, 3);
  assert.equal(battle.roundIndex, 2);
  assert.equal(battle.ap.A, 5);
  assert.equal(battle.outcome.status, 'ongoing');
});

test('victory and defeat follow the injected predicate', () => {
  assertTestOnly(testOnlySideDefeatedWhenAllKo);
  const battle = createBattle({
    sideA: testOnlySide('A', [1, 0, 0, 0]),
    sideB: testOnlySide('B', [0, 0, 0, 0]),
    rules: rules(),
  });
  for (const member of battle.sideB.members) member.markers.ko = true;
  const victory = evaluateOutcome(battle);
  assert.equal(victory.status, 'decided');
  assert.equal(victory.winnerSideId, 'A');
  assert.equal(victory.loserSideId, 'B');
  assert.equal(victory.verdict.A, 'victory');
  assert.equal(victory.verdict.B, 'defeat');
  assert.equal(endTurn(battle).reason, 'BATTLE_DECIDED');

  const loss = createBattle({
    sideA: testOnlySide('A', [1, 0, 0, 0]),
    sideB: testOnlySide('B', [0, 0, 0, 0]),
    rules: rules(),
  });
  for (const member of loss.sideA.members) member.markers.ko = true;
  const defeat = evaluateOutcome(loss);
  assert.equal(defeat.verdict.A, 'defeat');
  assert.equal(defeat.verdict.B, 'victory');
});

test('both sides defeated throws the simultaneous-defeat block and does not advance the turn', () => {
  const battle = createBattle({
    sideA: testOnlySide('A', [1, 0, 0, 0]),
    sideB: testOnlySide('B', [0, 0, 0, 0]),
    rules: rules(),
  });
  for (const member of [...battle.sideA.members, ...battle.sideB.members]) member.markers.ko = true;
  assert.throws(() => evaluateOutcome(battle), (error) => {
    assert.equal(error.questionId, 'Q-SIMULTANEOUS');
    return true;
  });
  assert.equal(battle.turnIndex, 1);
  assert.throws(() => endTurn(battle), (error) => error.questionId === 'Q-SIMULTANEOUS');
  assert.equal(battle.activeSideId, 'A');
  assert.equal(battle.turnIndex, 1);
});

test('an injected simultaneous rule can name one winner', () => {
  const battle = createBattle({
    sideA: testOnlySide('A', [1, 0, 0, 0]),
    sideB: testOnlySide('B', [0, 0, 0, 0]),
    rules: rules({
      simultaneousDefeat: () => ({ winnerSideId: 'B', label: TEST_ONLY }),
    }),
  });
  for (const member of [...battle.sideA.members, ...battle.sideB.members]) member.markers.ko = true;
  const outcome = evaluateOutcome(battle);
  assert.equal(outcome.winnerSideId, 'B');
  assert.equal(outcome.verdict.A, 'defeat');
});

test('the same inputs produce the same public log', () => {
  const run = () => {
    const battle = createBattle({
      battleId: 'det',
      sideA: testOnlySide('A', [2, 1, 0, 0]),
      sideB: testOnlySide('B', [1, 0, 0, 0]),
      rules: rules(),
    });
    endTurn(battle);
    endTurn(battle);
    return publicView(battle);
  };
  assert.deepEqual(run(), run());
});

test('damage and skill resolution throw and leave stats untouched', () => {
  const battle = createBattle({
    sideA: testOnlySide('A', [1, 0, 0, 0]),
    sideB: testOnlySide('B', [0, 0, 0, 0]),
    rules: rules(),
  });
  const attack = testOnlyActionCard({ cardId: 'ATK', actionType: 'ATK' });
  const guard = testOnlyActionCard({ cardId: 'DEF', actionType: 'DEF' });
  const skill = testOnlyActionCard({ cardId: 'SK', actionType: 'Skill' });
  assert.throws(() => resolveEffect(battle, attack), (error) => error.questionId === 'Q-DAMAGE');
  assert.throws(() => resolveEffect(battle, guard), (error) => error.questionId === 'Q-DAMAGE');
  assert.throws(() => resolveEffect(battle, skill), (error) => error.questionId === 'Q-SKILL');
  assert.equal(battle.sideA.members[0].stats.pow, 0);
  assert.equal(battle.sideB.members[0].stats.def, 0);
});

test('play spends injected AP, refreshes on the next own turn, and does not apply effects', () => {
  const costs = testOnlyCostByType({ ATK: 2, DEF: 1, Skill: 3 });
  const limit = testOnlyNoExtraActionLimit;
  assertTestOnly(costs);
  assertTestOnly(limit);
  const battle = createBattle({
    sideA: testOnlySide('A', [3, 0, 0, 0]),
    sideB: testOnlySide('B', [1, 0, 0, 0]),
    rules: rules({ resolveApCost: costs, perTurnActionLimit: limit }),
  });
  const cards = [
    testOnlyActionCard({ cardId: 'a1', actionType: 'ATK' }),
    testOnlyActionCard({ cardId: 'a2', actionType: 'ATK' }),
    testOnlyActionCard({ cardId: 'd1', actionType: 'DEF' }),
    testOnlyActionCard({ cardId: 's1', actionType: 'Skill' }),
    testOnlyActionCard({ cardId: 'a3', actionType: 'ATK' }),
  ];
  for (const card of cards) assert.equal(addCard(battle.hands.A, card).ok, true);
  assert.equal(addCard(battle.hands.A, testOnlyActionCard({ cardId: 'extra', actionType: 'ATK' })).reason, 'HAND_FULL');

  const first = playCard(battle, 'A', 'a1');
  assert.equal(first.ok, true);
  assert.equal(first.cost, 2);
  assert.equal(first.effect, 'not_applied');
  assert.equal(battle.ap.A, 3);
  assert.equal(battle.hands.A.cards.length, 4);
  assert.equal(playCard(battle, 'B', 'a2').reason, 'NOT_ACTIVE_SIDE');
  assert.equal(playCard(battle, 'A', 's1').ok, true);
  assert.equal(battle.ap.A, 0);
  const blocked = playCard(battle, 'A', 'd1');
  assert.equal(blocked.reason, 'INSUFFICIENT_AP');
  assert.equal(battle.ap.A, 0);
  assert.equal(battle.hands.A.cards.some((card) => card.cardId === 'd1'), true);
  assert.equal(battle.sideB.members[0].stats.pow, 0);

  endTurn(battle);
  assert.equal(battle.ap.B, 5);
  assert.equal(battle.ap.A, 0);
  endTurn(battle);
  assert.equal(battle.activeSideId, 'A');
  assert.equal(battle.ap.A, 5);
  assert.equal(battle.roundIndex, 2);
});

test('a second play can be rejected by an injected action cap without a shipped cap', () => {
  const cap = testOnlyMaxPlays(1);
  assert.equal(cap.label, TEST_ONLY);
  const battle = createBattle({
    sideA: testOnlySide('A', [2, 0, 0, 0]),
    sideB: testOnlySide('B', [0, 0, 0, 0]),
    rules: rules({
      resolveApCost: testOnlyCostByType({ ATK: 1, DEF: 1, Skill: 1 }),
      perTurnActionLimit: cap,
    }),
  });
  addCard(battle.hands.A, testOnlyActionCard({ cardId: 'a1', actionType: 'ATK' }));
  addCard(battle.hands.A, testOnlyActionCard({ cardId: 'a2', actionType: 'ATK' }));
  assert.equal(playCard(battle, 'A', 'a1').ok, true);
  assert.equal(playCard(battle, 'A', 'a2').reason, 'ACTION_LIMIT');
  assert.equal(battle.ap.A, 4);
  assert.equal(battle.hands.A.cards.length, 1);
});

test('the engine source has no RNG and does not sum SPD itself', () => {
  const root = fileURLToPath(new URL('../src/', import.meta.url));
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name.endsWith('.js')) files.push(path);
    }
  };
  walk(root);
  const battleSource = readFileSync(new URL('../src/battle/battle.js', import.meta.url), 'utf8');
  assert.match(battleSource, /rules\.teamSpd/);
  assert.doesNotMatch(battleSource, /members\.reduce/);
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    assert.equal(source.includes('Math.random'), false, file);
    assert.equal(source.includes('Date.now'), false, file);
    assert.equal(source.includes('crypto.random'), false, file);
    assert.equal(source.includes('stub-rules'), false, file);
    assert.equal(source.includes('TEST-ONLY'), false, file);
  }
  const blockers = defaultRules();
  const expected = {
    teamSpd: 'Q-SPD-AGG',
    spdTieBreak: 'Q-SPD-TIE',
    isSideDefeated: 'Q-HP',
    simultaneousDefeat: 'Q-SIMULTANEOUS',
    perTurnActionLimit: 'Q-ACTION-LIMIT',
    resolveApCost: 'Q-AP-COST',
    draw: 'Q-DRAW-DISCARD',
    discard: 'Q-DRAW-DISCARD',
    deckSize: 'Q-DECK-SIZE',
    damage: 'Q-DAMAGE',
    skillEffect: 'Q-SKILL',
    gachaRate: 'Q-GACHA',
    upgrade: 'Q-UPGRADE',
  };
  for (const [name, questionId] of Object.entries(expected)) {
    assert.throws(() => blockers[name](), (error) => error.questionId === questionId, name);
  }
});

test('v0.5 matches live in src/engine and leave the blocked battle shell in place', () => {
  const sideA = testOnlySide('A', [1, 0, 0, 0]);
  const sideB = testOnlySide('B', [0, 0, 0, 0]);
  assert.throws(() => createBattle({ sideA, sideB }), (error) => error.questionId === 'Q-SPD-AGG');
  const match = createMatch(matchInput({ seed: 1, matchId: 'bridge' }));
  assert.equal(match.productionReady, false);
  assert.equal(match.sides.player.avatars.length, 4);
  assert.equal(match.sides.player.ap, 5);
  assert.equal(getOutcome(match).status, 'ongoing');
  assert.equal(getOutcome(match).rewards, null);
});
