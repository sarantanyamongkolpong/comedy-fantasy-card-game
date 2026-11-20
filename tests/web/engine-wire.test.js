import assert from 'node:assert/strict';
import test from 'node:test';
import { assertTestBanner } from '../../src/gacha/pull.js';
import { loadGameApi } from '../../web/js/game-api.js';
import { battleReady, buildMatchInput, createStarterProfile } from '../../web/js/profile.js';
import { TEST_BANNERS } from '../../web/js/sample-catalog.js';

test('content and sample banners pass the gacha TEST guard', async () => {
  const api = await loadGameApi();
  for (const banner of [...TEST_BANNERS, ...api.catalog.banners]) {
    assert.doesNotThrow(() => assertTestBanner(banner), banner.bannerId);
    assert.ok(banner.entries.every((entry) => entry.id && entry.rarity && Number.isInteger(entry.weight)));
  }
});

test('createMatch forwards input.config and the web default is flat_atk MVP_PROVISIONAL', async () => {
  const api = await loadGameApi();
  const profile = createStarterProfile(api.catalog);
  const plainInput = buildMatchInput(profile, api.catalog, { seed: 4, mode: 'tower' });
  plainInput.config = api.defaultRuleConfig();
  const plain = api.createMatch(plainInput);
  // Owner t269u: the web build plays flat_atk by default, status MVP_PROVISIONAL (not LOCKED).
  assert.equal(plain.engine.config.damage.preset, 'flat_atk');
  assert.equal(plain.engine.config.damage.status, 'MVP_PROVISIONAL');
  assert.equal(plain.engine.config.damage.formula, 'placeholder_atk_minus_def');

  const config = api.defaultRuleConfig();
  config.damage.preset = null;
  config.damage.formula = 'placeholder_flat_atk';
  const input = buildMatchInput(profile, api.catalog, { seed: 4, mode: 'tower' });
  input.config = config;
  const match = api.createMatch(input);
  assert.equal(match.engine.config.damage.formula, 'placeholder_flat_atk');
  assert.equal(match.engine.config.damage.preset, null);
  assert.equal(match.engine.config.damage.status, 'MVP_PROVISIONAL');
  assert.notEqual(match.engine.config, config);
});

test('a content deck fights on the real engine and the save keeps the match', async () => {
  const api = await loadGameApi();
  const profile = createStarterProfile(api.catalog);
  assert.equal(profile.deck.length, 30);
  assert.equal(battleReady(profile, api.catalog).ok, true);
  const input = buildMatchInput(profile, api.catalog, { seed: 4, mode: 'tower' });
  const match = api.createMatch(input);
  assert.equal(match.source, 'engine');
  assert.equal(api.getZones(match, 'player').hand.length, 5);
  assert.equal(api.getZones(match, 'enemy').hand.length, 5);
  assert.equal(match.units.filter((unit) => unit.avatarId === 'AVT_SAN_002').length, 2);

  const before = match.phase;
  if (before === 'enemyTurn') api.playEnemyTurn(match);
  const hand = api.getZones(match, 'player').hand;
  const actor = match.units.find((unit) => unit.sideId === 'player' && !unit.ko);
  const foe = match.units.find((unit) => unit.sideId === 'enemy' && !unit.ko);
  const card = hand.find((entry) => entry.targetRule === 'Enemy' && !entry.factionRequirement && entry.costAp <= match.ap.player);
  assert.ok(card, 'opening hand should contain a playable strike');
  const played = api.playAction(match, {
    cardInstanceId: card.instanceId,
    actorAvatarId: actor.instanceId,
    targets: [foe.instanceId],
  });
  assert.equal(played.ok, true, played.reason);
  assert.equal(api.getZones(match, 'player').hand.some((entry) => entry.instanceId === card.instanceId), false);

  const text = api.serialize({ profile, match, screen: 'battle', battleUi: { selection: { mode: 'idle' } } });
  const loaded = api.deserialize(text);
  assert.equal(loaded.webBundle, true);
  assert.equal(loaded.screen, 'battle');
  assert.equal(loaded.match.source, 'engine');
  assert.equal(api.getZones(loaded.match, 'player').hand.length, api.getZones(match, 'player').hand.length);
  assert.equal(loaded.profile.deck.length, 30);

  const banner = api.catalog.banners.find((row) => row.pool === 'avatar');
  const state = api.createBannerState(banner);
  const pulled = api.pull(state, { seed: 'gacha:string-seed:1', count: 1 });
  assert.equal(pulled.pulls.length, 1);
  assert.equal(pulled.state.pulls, 1);
  assert.equal(typeof pulled.state.pityEpic, 'number');
  assert.equal(pulled.results.length, 1);
  assert.equal(pulled.chargedG, 0);
});
