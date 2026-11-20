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
        commit: true,
      }));
      assert.ok(state.sides.player.avatars.every((avatar) => avatar.defeated === true || avatar.hp <= 0));
      const outcome = readOutcome(api, state);
      assert.equal(outcome.result, 'lose');
      assert.equal(outcome.winningSideId, 'enemy');
      assert.equal(outcome.losingSideId, 'player');
      assert.deepEqual(duplicateRewardIds(outcome.rewards), []);
    },
  },
  {
    name: 'QA-07 simultaneous defeat is explicit and does not duplicate rewards',
    fn(api) {
      const input = buildMatch({ playerHp: 1, enemyHp: 1 });
      input.decks[0].cards[0] = {
        ...input.decks[0].cards[0],
        cardId: 'ACT_ALL_SIDES',
        instanceId: 'player-ACT_ALL_SIDES-0',
        effect: { op: 'damage', amount: 1, target: 'all_avatars' },
        costAp: 1,
        type: 'ATK',
      };
      let state = asState(api.createMatch(input));
      state = playCard(api, state, 'player', 'ACT_ALL_SIDES', 'AVT_AEG_002').state;
      const outcome = readOutcome(api, state);
      assert.equal(outcome.result, 'simultaneous');
      assert.equal(outcome.winningSideId, null);
      assert.equal(outcome.losingSideId, null);
      assert.deepEqual(duplicateRewardIds(outcome.rewards), []);
      const again = readOutcome(api, state);
      assert.deepEqual(again, outcome);
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
