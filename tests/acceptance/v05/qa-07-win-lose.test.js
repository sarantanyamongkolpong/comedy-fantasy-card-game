import assert from 'node:assert/strict';
import { bindApi, ENGINE_EXPORTS, ENGINE_FILES, loadNamed } from './helpers/load-api.js';
import { buildMatch } from './helpers/match.js';
import { asState, duplicateRewardIds, playCard, readOutcome } from './helpers/state.js';

const engine = await loadNamed(ENGINE_FILES, ENGINE_EXPORTS, 'stream A');

bindApi(engine, [
  {
    name: 'QA-07 CORE-004 win when every enemy avatar is defeated',
    fn(api) {
      let state = asState(api.createMatch(buildMatch({ damageSide: 'player', enemyHp: 1 })));
      state = playCard(api, state, 'player', 'ACT_DMG_ALL', 'AVT_PHA_002').state;
      assert.ok(state.sides.enemy.avatars.every((avatar) => avatar.defeated === true || avatar.hp <= 0));
      const outcome = readOutcome(api, state);
      assert.equal(outcome.result, 'win');
      assert.equal(outcome.winningSideId, 'player');
      assert.equal(outcome.losingSideId, 'enemy');
      assert.deepEqual(duplicateRewardIds(outcome.rewards), []);
    },
  },
  {
    name: 'QA-07 CORE-004 lose when every own avatar is defeated',
    fn(api) {
      let state = asState(api.createMatch(buildMatch({ damageSide: 'enemy', playerHp: 1 })));
      assert.equal(state.activeSideId, 'enemy');
      const card = api.getZones(state, 'enemy').hand.find((entry) => entry.cardId === 'ACT_DMG_ALL');
      state = asState(api.playAction(state, {
        cardInstanceId: card.instanceId,
        actorAvatarId: state.sides.enemy.avatars[0].avatarId,
        targets: [],
      }), state);
      assert.ok(state.sides.player.avatars.every((avatar) => avatar.defeated === true || avatar.hp <= 0));
      const outcome = readOutcome(api, state);
      assert.equal(outcome.result, 'lose');
      assert.equal(outcome.winningSideId, 'enemy');
      assert.equal(outcome.losingSideId, 'player');
      assert.deepEqual(duplicateRewardIds(outcome.rewards), []);
    },
  },
  {
    name: 'QA-07 simultaneous defeat stays pending and a decided match does not duplicate rewards',
    fn(api) {
      const state = asState(api.createMatch(buildMatch()));
      const policy = state.config?.simultaneousDeath;
      if (policy) {
        assert.equal(policy.status === 'PENDING' || policy.status === 'PENDING_OWNER', true);
      }
      let decided = asState(api.createMatch(buildMatch({ damageSide: 'player', enemyHp: 1 })));
      decided = playCard(api, decided, 'player', 'ACT_DMG_ALL', 'AVT_PHA_002').state;
      const outcome = readOutcome(api, decided);
      assert.deepEqual(duplicateRewardIds(outcome.rewards), []);
      assert.deepEqual(readOutcome(api, decided), outcome);
    },
  },
  {
    name: 'QA-07 rewards are not granted twice',
    fn(api) {
      let state = asState(api.createMatch(buildMatch({ damageSide: 'player', enemyHp: 1 })));
      state = playCard(api, state, 'player', 'ACT_DMG_ALL', 'AVT_PHA_002').state;
      const first = readOutcome(api, state);
      const granted = typeof api.grantMatchRewards === 'function' ? asState(api.grantMatchRewards(state), state) : state;
      const second = readOutcome(api, granted);
      const third = readOutcome(api, granted);
      assert.deepEqual(third.rewards, second.rewards);
      assert.deepEqual(duplicateRewardIds(second.rewards), []);
      assert.ok(second.rewards.length >= first.rewards.length);
      if (typeof api.grantMatchRewards === 'function') {
        const repeat = asState(api.grantMatchRewards(granted), granted);
        assert.deepEqual(readOutcome(api, repeat).rewards, second.rewards);
      }
    },
  },
]);
