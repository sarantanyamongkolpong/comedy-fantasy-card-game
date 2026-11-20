import assert from 'node:assert/strict';
import test from 'node:test';
import { applyBattleReward, createProfile } from '../../src/save/index.js';

test('a battle result is applied once per match id', () => {
  const start = createProfile({ currency: { G: 1 } });
  const first = applyBattleReward(start, {
    matchId: 'MATCH_DEMO_1',
    rewards: { G: 4, items: [{ kind: 'action', catalogId: 'ACT_GEN_ATK_001', quantity: 2 }] },
  });
  assert.equal(first.applied, true);
  assert.equal(first.profile.currency.G, 5);
  assert.equal(first.profile.inventory.actions[0].quantity, 2);
  assert.equal(start.currency.G, 1);
  assert.equal(start.inventory.actions.length, 0);

  const second = applyBattleReward(first.profile, {
    matchId: 'MATCH_DEMO_1',
    rewards: { G: 100, items: [{ kind: 'avatar', catalogId: 'AVT_SAN_002', quantity: 1 }] },
  });
  assert.equal(second.applied, false);
  assert.equal(second.reason, 'ALREADY_APPLIED');
  assert.equal(second.profile, first.profile);
  assert.equal(first.profile.currency.G, 5);
  assert.equal(first.profile.inventory.avatars.length, 0);

  const empty = applyBattleReward(first.profile, { matchId: 'MATCH_DEMO_2' });
  assert.equal(empty.applied, true);
  assert.equal(empty.grants.G, 0);
  assert.deepEqual(empty.grants.items, []);
  const repeat = applyBattleReward(empty.profile, { matchId: 'MATCH_DEMO_2', rewards: { G: 9 } });
  assert.equal(repeat.applied, false);
  assert.equal(empty.profile.currency.G, 5);
});
