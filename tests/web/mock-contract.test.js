import assert from 'node:assert/strict';
import test from 'node:test';
import { cancelPlay } from '../../web/js/battle-flow.js';
import { loadGameApi } from '../../web/js/game-api.js';
import {
  createMatch,
  discardVoluntary,
  endTurn,
  getZones,
  playAction,
  resolveEndOfRoundDiscard,
} from '../../web/js/mock-engine.js';
import { battleReady, buildMatchInput, createStarterProfile, deckMessages } from '../../web/js/profile.js';
import { sampleCatalog } from '../../web/js/sample-catalog.js';

function started() {
  const profile = createStarterProfile(sampleCatalog);
  const input = buildMatchInput(profile, sampleCatalog, { seed: 7, mode: 'tower' });
  return { profile, match: createMatch(input) };
}

test('starter deck is 30 and the sample team is battle-ready', () => {
  const profile = createStarterProfile(sampleCatalog);
  assert.equal(profile.deck.length, 30);
  assert.equal(profile.team.length, 4);
  const ready = battleReady(profile, sampleCatalog);
  assert.equal(ready.ok, true, JSON.stringify(ready.messages));
  assert.equal(deckMessages(profile, sampleCatalog).some((message) => message.text.includes('CORE-040')), true);
});

test('opening hands are 5 and cancel does not spend AP', () => {
  const { match } = started();
  assert.equal(getZones(match, 'player').hand.length, 5);
  assert.equal(getZones(match, 'enemy').hand.length, 5);
  const before = match.ap[match.activeSideId];
  const cancelled = cancelPlay(match);
  assert.equal(cancelled.calledEngine, false);
  assert.equal(cancelled.match, match);
  assert.equal(match.ap[match.activeSideId], before);
  assert.equal(cancelled.selection.mode, 'idle');
});

test('a refused FAC play and a cancel-sized miss do not spend AP', () => {
  const { match } = started();
  if (match.activeSideId !== 'player') endTurn(match);
  const ap = match.ap.player;
  const fac = {
    instanceId: 'fac-test',
    name: 'Punctual Stab',
    type: 'ATK',
    rarity: 'FAC',
    costAp: 1,
    factionRequirement: 'FAC_PHA',
    targetRule: 'Enemy',
    onResolveZone: 'Discard',
    effect: { kind: 'strike', bonus: 0 },
  };
  match.zones.player.hand.push(fac);
  const wrong = match.units.find((unit) => unit.sideId === 'player' && unit.factionId !== 'FAC_PHA' && !unit.ko);
  playAction(match, { cardInstanceId: fac.instanceId, actorAvatarId: wrong.instanceId, targets: [] });
  assert.equal(match.ap.player, ap);
  assert.match(match.lastError, /FAC/);
});

test('voluntary discard spends 1 AP and a free end-step discard does not', () => {
  const { match } = started();
  if (match.activeSideId !== 'player') endTurn(match);
  const card = getZones(match, 'player').hand[0];
  const before = match.ap.player;
  discardVoluntary(match, card.instanceId);
  assert.equal(match.ap.player, before - 1);
  assert.equal(getZones(match, 'player').discard.some((entry) => entry.instanceId === card.instanceId), true);
  const hand = match.zones.player.hand;
  while (hand.length < 6) {
    hand.push({ ...hand[0], instanceId: `extra:${hand.length}`, name: 'Extra', costAp: 0, onResolveZone: 'Discard', effect: { kind: 'strike' }, type: 'ATK' });
  }
  const ap = match.ap.player;
  endTurn(match);
  assert.equal(match.phase, 'mandatoryDiscard');
  assert.equal(match.ap.player, ap);
  const excess = getZones(match, 'player').hand.slice(-1).map((entry) => entry.instanceId);
  resolveEndOfRoundDiscard(match, excess);
  assert.equal(match.zones.player.hand.length <= 5, true);
});

test('void cards are not shuffled back into the draw pile', () => {
  const { match } = started();
  if (match.activeSideId !== 'player') endTurn(match);
  const zones = match.zones.player;
  const voidCard = {
    instanceId: 'void-me',
    name: 'Yeet',
    type: 'ATK',
    rarity: 'R',
    costAp: 0,
    factionRequirement: null,
    targetRule: 'Enemy',
    onResolveZone: 'Void',
    effect: { kind: 'strike', bonus: 0 },
  };
  zones.hand.push(voidCard);
  zones.draw.length = 0;
  zones.discard.length = 0;
  const foe = match.units.find((unit) => unit.sideId === 'enemy' && !unit.ko);
  const actor = match.units.find((unit) => unit.sideId === 'player' && !unit.ko);
  playAction(match, { cardInstanceId: 'void-me', actorAvatarId: actor.instanceId, targets: [foe.instanceId] });
  assert.equal(getZones(match, 'player').void.some((card) => card.instanceId === 'void-me'), true);
  assert.equal(getZones(match, 'player').draw.some((card) => card.instanceId === 'void-me'), false);
  assert.equal(getZones(match, 'player').discard.some((card) => card.instanceId === 'void-me'), false);
});

test('the adapter uses the engine when the exports exist', async () => {
  const api = await loadGameApi();
  assert.equal(api.source, 'engine');
  assert.equal(api.productionReady, false);
  assert.equal(api.missing.length, 0);
  assert.equal(typeof api.playEnemyTurn, 'function');
  const config = api.defaultRuleConfig();
  assert.equal(config.damage.status, 'PENDING_OWNER');
  assert.equal(config.meta.productionReady, false);
  assert.equal(api.catalog.source, 'content/v05');
  assert.deepEqual(api.catalog.justinIds, ['AVT_AEG_002', 'AVT_PHA_002', 'AVT_CEL_002', 'AVT_SAN_002']);
});
