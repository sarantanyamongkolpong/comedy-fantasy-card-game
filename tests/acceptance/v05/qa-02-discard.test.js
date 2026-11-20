import assert from 'node:assert/strict';
import { bindApi, ENGINE_EXPORTS, ENGINE_FILES, loadNamed } from './helpers/load-api.js';
import { buildMatch } from './helpers/match.js';
import { apOf, asState, expectReject, playCard, zonesOf } from './helpers/state.js';

const engine = await loadNamed(ENGINE_FILES, ENGINE_EXPORTS, 'stream A');

bindApi(engine, [
  {
    name: 'QA-02 CORE-014 voluntary discard costs 1 AP',
    fn(api) {
      let state = asState(api.createMatch(buildMatch()));
      const hand = zonesOf(api, state, 'player').hand;
      const target = hand.find((entry) => entry.cardId === 'ACT_VOID');
      if (!target) throw new Error('opening hand is missing ACT_VOID');
      const before = apOf(state, 'player');
      state = asState(api.discardVoluntary(state, target.instanceId));
      const zones = zonesOf(api, state, 'player');
      assert.equal(apOf(state, 'player'), before - 1);
      assert.equal(zones.hand.some((entry) => entry.instanceId === target.instanceId), false);
      assert.ok(zones.discard.some((entry) => entry.instanceId === target.instanceId));
      assert.equal(zones.void.length, 0);
    },
  },
  {
    name: 'QA-02 CORE-013 mandatory end discard is free and stops at 5',
    fn(api) {
      let state = asState(api.createMatch(buildMatch()));
      state = playCard(api, state, 'player', 'ACT_GEN_DRAW', 'AVT_CEL_002').state;
      const beforeAp = apOf(state, 'player');
      let zones = zonesOf(api, state, 'player');
      assert.ok(zones.hand.length > 5);
      const excess = zones.hand.length - 5;
      const chosen = zones.hand.slice(0, excess).map((card) => card.instanceId);
      const tooFew = chosen.slice(0, Math.max(0, excess - 1));
      if (excess > 1) {
        expectReject(() => api.resolveEndOfRoundDiscard(state, tooFew));
        assert.equal(apOf(state, 'player'), beforeAp);
        assert.equal(zonesOf(api, state, 'player').hand.length, zones.hand.length);
      }
      state = asState(api.resolveEndOfRoundDiscard(state, chosen));
      zones = zonesOf(api, state, 'player');
      assert.equal(zones.hand.length, 5);
      assert.equal(apOf(state, 'player'), beforeAp, 'mandatory discard does not spend AP');
      for (const instanceId of chosen) {
        assert.ok(zones.discard.some((card) => card.instanceId === instanceId));
        assert.equal(zones.void.some((card) => card.instanceId === instanceId), false);
      }
    },
  },
]);
