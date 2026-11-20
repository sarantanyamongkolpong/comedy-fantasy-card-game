import assert from 'node:assert/strict';
import test from 'node:test';
import { bindApi, ENGINE_EXPORTS, ENGINE_FILES, loadNamed } from './helpers/load-api.js';
import { assertDeckCount, buildMatch, deckLists, enemyDeck, playerDeck } from './helpers/match.js';

test('QA-01 fixture decks contain 30 action cards', () => {
  for (const cards of [playerDeck('standard'), playerDeck('faction'), playerDeck('damage'), enemyDeck()]) {
    assertDeckCount(cards, 30);
    assert.equal(new Set(cards.map((card) => card.instanceId)).size, 30);
  }
});
import { apOf, asState, findCard, instanceIds, playCard, zonesOf } from './helpers/state.js';

const engine = await loadNamed(ENGINE_FILES, ENGINE_EXPORTS, 'stream A');

bindApi(engine, [
  {
    name: 'QA-01 CORE-009 CORE-040 action deck count is 30 and duplicate cap stays unset',
    fn(api) {
      const cards = playerDeck('standard');
      assertDeckCount(cards, 30);
      const state = asState(api.createMatch(buildMatch()));
      for (const sideId of ['player', 'enemy']) {
        const zones = zonesOf(api, state, sideId);
        const total = zones.draw.length + zones.hand.length + zones.discard.length + zones.void.length;
        assert.equal(total, 30, `${sideId} deck must stay 30 cards`);
      }
      const strikes = cards.filter((card) => card.cardId === 'ACT_GEN_ATK');
      assert.ok(strikes.length > 1, 'fixture uses duplicate copies because CORE-040 has no approved cap');
    },
  },
  {
    name: 'QA-01 CORE-010 opening hand is the first 5 cards',
    fn(api) {
      const input = buildMatch();
      const state = asState(api.createMatch(input));
      const zones = zonesOf(api, state, 'player');
      assert.equal(zones.hand.length, 5);
      assert.equal(zones.draw.length, 25);
      assert.equal(zones.discard.length, 0);
      assert.equal(zones.void.length, 0);
      const deck = deckLists(input)[0];
      assert.deepEqual(zones.hand.map((card) => card.cardId), deck.slice(0, 5).map((card) => card.cardId));
      assert.deepEqual(zones.draw.map((card) => card.cardId), deck.slice(5).map((card) => card.cardId));
    },
  },
  {
    name: 'QA-01 CORE-011 refill to 5 keeps unplayed leftovers',
    fn(api) {
      let state = asState(api.createMatch(buildMatch()));
      const kept = findCard(zonesOf(api, state, 'player').hand, 'ACT_GEN_ATK5');
      state = playCard(api, state, 'player', 'ACT_GEN_ATK0', 'AVT_AEG_002').state;
      state = asState(api.endTurn(state));
      assert.equal(state.activeSideId, 'enemy');
      state = asState(api.endTurn(state));
      state = asState(api.startTurn(state));
      const zones = zonesOf(api, state, 'player');
      assert.equal(state.activeSideId, 'player');
      assert.equal(zones.hand.length, 5);
      assert.ok(zones.hand.some((card) => card.instanceId === kept.instanceId));
      assert.equal(apOf(state, 'player'), 5);
    },
  },
  {
    name: 'QA-01 CORE-012 effect draw may exceed 5',
    fn(api) {
      let state = asState(api.createMatch(buildMatch()));
      state = playCard(api, state, 'player', 'ACT_GEN_DRAW', 'AVT_CEL_002').state;
      const zones = zonesOf(api, state, 'player');
      assert.ok(zones.hand.length > 5, `effect draw must be allowed to leave the hand above 5, got ${zones.hand.length}`);
    },
  },
]);
