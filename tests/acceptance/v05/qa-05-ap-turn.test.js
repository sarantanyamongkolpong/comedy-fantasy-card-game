import assert from 'node:assert/strict';
import { bindApi, CONFIG_FILES, ENGINE_EXPORTS, ENGINE_FILES, loadNamed } from './helpers/load-api.js';
import { buildMatch } from './helpers/match.js';
import { apOf, asState, expectReject, flagOf, isPendingStatus, playCard, readOutcome, zonesOf } from './helpers/state.js';

const engine = await loadNamed(ENGINE_FILES, ENGINE_EXPORTS, 'stream A');
const config = await loadNamed(CONFIG_FILES, ['defaultRuleConfig'], 'stream B');

bindApi(engine, [
  {
    name: 'QA-05 CORE-006 higher team SPD acts first for every aggregate',
    fn(api) {
      const state = asState(api.createMatch(buildMatch({ spd: 'playerHigher' })));
      assert.equal(state.activeSideId, 'player');
      const enemyFirst = asState(api.createMatch(buildMatch({ spd: 'enemyHigher' })));
      assert.equal(enemyFirst.activeSideId, 'enemy');
    },
  },
  {
    name: 'QA-05 CORE-006 CORE-038 tie SPD does not throw and does not grant rewards',
    fn(api) {
      const state = asState(api.createMatch(buildMatch({ spd: 'tie' })));
      assert.ok(state.activeSideId === 'player' || state.activeSideId === 'enemy');
      const outcome = readOutcome(api, state);
      assert.equal(outcome.result, 'ongoing');
      assert.equal(outcome.winningSideId, null);
      assert.equal(outcome.rewards.length, 0);
      if (config.mod && config.missing.length === 0) {
        const tie = flagOf(config.mod.defaultRuleConfig(), 'spdTieBreak');
        const aggregate = flagOf(config.mod.defaultRuleConfig(), 'teamSpdAggregation');
        assert.equal(isPendingStatus(tie.status), true);
        assert.equal(tie.value ?? null, null);
        assert.equal(isPendingStatus(aggregate.status), true);
        assert.equal(aggregate.value ?? null, null);
      }
    },
  },
  {
    name: 'QA-05 CORE-007 AP resets to 5 on the next own turn',
    fn(api) {
      let state = asState(api.createMatch(buildMatch()));
      assert.equal(apOf(state, 'player'), 5);
      state = playCard(api, state, 'player', 'ACT_GEN_SKILL', 'AVT_SAN_002').state;
      assert.equal(apOf(state, 'player'), 4);
      state = asState(api.endTurn(state));
      state = asState(api.endTurn(state));
      state = asState(api.startTurn(state));
      assert.equal(state.activeSideId, 'player');
      assert.equal(apOf(state, 'player'), 5);
    },
  },
  {
    name: 'QA-05 CORE-008 costs 0 through 5 are consumed and a cost outside that range is rejected',
    fn(api) {
      let state = asState(api.createMatch(buildMatch()));
      state = playCard(api, state, 'player', 'ACT_GEN_ATK0', 'AVT_AEG_002').state;
      assert.equal(apOf(state, 'player'), 5);
      state = playCard(api, state, 'player', 'ACT_GEN_ATK5', 'AVT_PHA_002').state;
      assert.equal(apOf(state, 'player'), 0);
      const illegal = buildMatch();
      illegal.decks.player[0] = { ...illegal.decks.player[0], costAp: 6, cardId: 'ACT_ILLEGAL' };
      expectReject(() => api.createMatch(illegal));
      const negative = buildMatch();
      negative.decks.player[0] = { ...negative.decks.player[0], costAp: -1 };
      expectReject(() => api.createMatch(negative));
    },
  },
  {
    name: 'QA-05 CORE-015 AP 0 does not auto end the turn',
    fn(api) {
      let state = asState(api.createMatch(buildMatch()));
      state = playCard(api, state, 'player', 'ACT_GEN_ATK5', 'AVT_PHA_002').state;
      assert.equal(apOf(state, 'player'), 0);
      assert.equal(state.activeSideId, 'player');
      const outcome = readOutcome(api, state);
      assert.equal(outcome.result, 'ongoing');
      state = asState(api.endTurn(state));
      assert.equal(state.activeSideId, 'enemy');
    },
  },
  {
    name: 'QA-05 cancellation does not consume AP',
    fn(api) {
      const state = asState(api.createMatch(buildMatch()));
      const card = zonesOf(api, state, 'player').hand.find((entry) => entry.cardId === 'ACT_GEN_ATK5');
      playCard(api, state, 'player', 'ACT_GEN_ATK5', 'AVT_PHA_002', { commit: false });
      assert.equal(apOf(state, 'player'), 5);
      assert.ok(zonesOf(api, state, 'player').hand.some((entry) => entry.instanceId === card.instanceId));
    },
  },
]);
