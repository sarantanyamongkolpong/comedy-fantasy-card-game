import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createMatch,
  endTurn,
  proposedSampleMatchInput,
  resolveRuleConfig,
  runAutoTurn,
} from '../../src/engine/index.js';
import { matchInput, roster } from './fixture.js';

// Owner decisions 2026-11-21 (Phase 1, docs/qa/p1/P1_INVESTIGATION.md). All MVP_PROVISIONAL, never LOCKED.

function shieldedEnemy(config) {
  const enemy = roster();
  enemy[0].shield = 5;
  // Player has the fastest single avatar, so the player starts.
  return createMatch(matchInput({ config, enemy, playerSpd: [9, 0, 0, 0], enemySpd: [1, 0, 0, 0] }));
}

test('option C: a shield lasts through the enemy turn and clears when its side starts its next turn', () => {
  const state = shieldedEnemy(undefined);
  assert.equal(state.activeSideId, 'player');
  assert.equal(state.sides.enemy.avatars[0].shield, 5);
  assert.equal(endTurn(state).ok, true);
  assert.equal(state.activeSideId, 'enemy');
  assert.equal(state.sides.enemy.avatars[0].shield, 0);
  const expired = state.log.find((event) => event.type === 'shield_expired');
  assert.deepEqual({ sideId: expired.sideId, amount: expired.amount }, { sideId: 'enemy', amount: 5 });
});

test('shield expiry none keeps the legacy unlimited pool', () => {
  const state = shieldedEnemy(resolveRuleConfig({ shield: { expiry: 'none' } }));
  endTurn(state);
  assert.equal(state.sides.enemy.avatars[0].shield, 5);
  assert.equal(state.log.some((event) => event.type === 'shield_expired'), false);
  assert.throws(() => resolveRuleConfig({ shield: { expiry: 'forever' } }), (error) => error.reason === 'UNKNOWN_SHIELD_POLICY');
});

test('starting side is the side with the single fastest avatar; equal max SPD uses the seeded tie-break', () => {
  const fastOne = createMatch(matchInput({ playerSpd: [9, 0, 0, 0], enemySpd: [5, 5, 5, 5] }));
  assert.equal(fastOne.startingSideId, 'player');
  const tied = createMatch(matchInput({ playerSpd: [7, 1, 1, 1], enemySpd: [7, 0, 0, 0] }));
  assert.equal(tied.log.find((event) => event.type === 'battle_start').tieBreakUsed, true);
});

function autoMatch(seed, cap) {
  const input = proposedSampleMatchInput({ seed, playerControl: 'human', enemyControl: 'ai' });
  input.config = resolveRuleConfig({ autoPolicy: { policies: { balanced: { maxHealCastsPerMatch: cap } } } });
  const state = createMatch(input);
  let guard = 0;
  let healPlays = { player: 0, enemy: 0 };
  while (state.outcome.status !== 'decided' && state.turnIndex <= 200 && guard < 1000) {
    guard += 1;
    if (state.phase === 'end_of_round_discard') {
      for (const sideId of state.sideOrder) runAutoTurn(state, sideId);
      continue;
    }
    const side = state.activeSideId;
    for (const entry of runAutoTurn(state, side).log) if (entry.priority === 'heal_regen') healPlays[side] += 1;
  }
  return { state, healPlays };
}

test('AUTO heal casts are capped per side per match', () => {
  let sawHeal = false;
  for (let seed = 1; seed <= 8; seed += 1) {
    const capped = autoMatch(seed, 1);
    for (const sideId of ['player', 'enemy']) {
      assert.ok(capped.healPlays[sideId] <= 1, `seed ${seed} ${sideId} cast ${capped.healPlays[sideId]}`);
      assert.equal(capped.state.sides[sideId].autoHealCasts ?? 0, capped.healPlays[sideId]);
    }
    const none = autoMatch(seed, 0);
    assert.equal(none.healPlays.player + none.healPlays.enemy, 0);
    sawHeal = sawHeal || capped.healPlays.player + capped.healPlays.enemy > 0;
  }
  assert.equal(sawHeal, true);
  assert.equal(resolveRuleConfig().autoPolicy.policies.balanced.maxHealCastsPerMatch, 3);
  assert.equal(resolveRuleConfig().autoPolicy.status, 'PROPOSED');
  assert.throws(() => resolveRuleConfig({ autoPolicy: { policies: { balanced: { maxHealCastsPerMatch: -1 } } } }), (error) => error.reason === 'UNKNOWN_AUTO_POLICY');
});
