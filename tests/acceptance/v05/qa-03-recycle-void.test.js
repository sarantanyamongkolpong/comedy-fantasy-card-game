import assert from 'node:assert/strict';
import { bindApi, ENGINE_EXPORTS, ENGINE_FILES, loadNamed } from './helpers/load-api.js';
import { buildMatch, deckLists } from './helpers/match.js';
import { apOf, asState, findCard, instanceIds, playCard, zonesOf } from './helpers/state.js';

const engine = await loadNamed(ENGINE_FILES, ENGINE_EXPORTS, 'stream A');

function finishTurn(api, state) {
  let next = asState(api.endTurn(state), state);
  if (next.phase === 'end_of_round_discard') {
    const ids = [];
    for (const sideId of ['player', 'enemy']) {
      const hand = zonesOf(api, next, sideId).hand;
      if (hand.length > 5) ids.push(...hand.slice(0, hand.length - 5).map((card) => card.instanceId));
    }
    next = asState(api.resolveEndOfRoundDiscard(next, ids), next);
  }
  return next;
}

bindApi(engine, [
  {
    name: 'QA-03 CORE-016 CORE-017 CORE-018 empty Draw recycles only Discard',
    fn(api) {
      // Recycling needs a long match. Pin the legacy floor-1 damage preset so the battle lasts
      // long enough to empty Draw; the MVP_PROVISIONAL flat_atk default (Owner t269u) ends it first.
      let state = asState(api.createMatch(buildMatch({ config: { damage: { preset: null } } })));
      const voidCard = findCard(zonesOf(api, state, 'player').hand, 'ACT_VOID');
      state = playCard(api, state, 'player', 'ACT_VOID', 'AVT_AEG_002').state;
      assert.ok(zonesOf(api, state, 'player').void.some((card) => card.instanceId === voidCard.instanceId));
      assert.equal(zonesOf(api, state, 'player').discard.some((card) => card.instanceId === voidCard.instanceId), false);

      for (let cycle = 0; cycle < 80; cycle += 1) {
        const zones = zonesOf(api, state, 'player');
        if (zones.draw.length === 0 && zones.discard.length === 0) break;
        if (state.activeSideId !== 'player') {
          state = finishTurn(api, state);
          continue;
        }
        const playable = zonesOf(api, state, 'player').hand.find((card) => {
          if (card.cardId === 'ACT_VOID' || card.cardId === 'ACT_RETRIEVE') return false;
          if (card.costAp > apOf(state, 'player')) return false;
          if (card.factionRequirement && !card.factionOverride && card.factionRequirement !== 'Aegis Dominion') return false;
          return true;
        });
        if (!playable) {
          state = finishTurn(api, state);
          continue;
        }
        state = playCard(api, state, 'player', playable.cardId, 'AVT_AEG_002').state;
        const after = zonesOf(api, state, 'player');
        assert.equal(after.void.some((card) => card.instanceId === voidCard.instanceId), true);
        assert.equal(after.draw.some((card) => card.instanceId === voidCard.instanceId), false);
        assert.equal(after.hand.some((card) => card.instanceId === voidCard.instanceId), false);
        assert.equal(after.discard.some((card) => card.instanceId === voidCard.instanceId), false);
      }

      const recycled = zonesOf(api, state, 'player');
      const seen = new Set(instanceIds([...recycled.draw, ...recycled.hand, ...recycled.discard]));
      assert.equal(seen.has(voidCard.instanceId), false);
      assert.equal(recycled.void.length, 1);
      assert.ok(state.log.some((event) => event.type === 'shuffle_discard' && event.sideId === 'player'), 'Discard must be shuffled back into Draw');
      assert.ok(recycled.draw.length + recycled.hand.length > 0);
    },
  },
  {
    name: 'QA-03 CORE-018 pile viewers return Discard and Void at any time',
    fn(api) {
      let state = asState(api.createMatch(buildMatch()));
      const before = zonesOf(api, state, 'player');
      assert.deepEqual(Object.keys(before).sort(), ['discard', 'draw', 'hand', 'void']);
      state = playCard(api, state, 'player', 'ACT_VOID', 'AVT_AEG_002').state;
      state = playCard(api, state, 'player', 'ACT_GEN_ATK0', 'AVT_AEG_002').state;
      const during = zonesOf(api, state, 'player');
      assert.equal(during.void.length, 1);
      assert.equal(during.discard.length, 1);
      assert.equal(typeof during.void[0].cardId, 'string');
      assert.equal(typeof during.discard[0].cardId, 'string');
      state = asState(api.endTurn(state), state);
      const after = zonesOf(api, state, 'player');
      assert.equal(after.void.length, 1);
      assert.ok(after.discard.length >= 1);
    },
  },
  {
    name: 'QA-03 CORE-019 return effects retrieve only the named permitted card',
    fn(api) {
      const input = buildMatch();
      const deck = deckLists(input)[0];
      const pullFront = (cardId) => {
        const index = deck.findIndex((card) => card.cardId === cardId);
        if (index < 0) throw new Error(`fixture deck is missing ${cardId}`);
        const [card] = deck.splice(index, 1);
        deck.unshift(card);
      };
      pullFront('ACT_RETRIEVE');
      pullFront('ACT_VOID');
      pullFront('ACT_GEN_ATK0');
      let state = asState(api.createMatch(input));
      const voidCard = findCard(zonesOf(api, state, 'player').hand, 'ACT_VOID');
      const zero = findCard(zonesOf(api, state, 'player').hand, 'ACT_GEN_ATK0');
      state = playCard(api, state, 'player', 'ACT_VOID', 'AVT_AEG_002').state;
      state = playCard(api, state, 'player', 'ACT_GEN_ATK0', 'AVT_AEG_002').state;
      const retrieve = findCard(zonesOf(api, state, 'player').hand, 'ACT_RETRIEVE');
      const result = api.playAction(state, {
        cardInstanceId: retrieve.instanceId,
        actorAvatarId: 'AVT_AEG_002',
        targets: { retrieveInstanceIds: [zero.instanceId] },
      });
      state = asState(result, state);
      const zones = zonesOf(api, state, 'player');
      assert.ok(zones.hand.some((card) => card.instanceId === zero.instanceId) || zones.draw.some((card) => card.instanceId === zero.instanceId));
      assert.ok(zones.void.some((card) => card.instanceId === voidCard.instanceId));
      assert.equal(zones.hand.some((card) => card.instanceId === voidCard.instanceId), false);
      assert.equal(zones.draw.some((card) => card.instanceId === voidCard.instanceId), false);
    },
  },
]);
