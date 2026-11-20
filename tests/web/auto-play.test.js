import assert from 'node:assert/strict';
import test from 'node:test';
import { AUTO_TIMING, actionCaption, autoDelayMs, speedChoices } from '../../web/js/auto-play.js';
import { loadGameApi } from '../../web/js/game-api.js';

test('playback speed names come from the data config and stay proposed', async () => {
  const api = await loadGameApi();
  const rules = api.dataRules();
  assert.equal(rules.autoBattle.status, 'LOCKED');
  assert.equal(rules.vrSync.status, 'REJECTED');
  assert.equal(rules.autoPolicy.status, 'PROPOSED');
  assert.deepEqual(speedChoices(rules), rules.autoPolicy.speed.options);
  assert.equal(AUTO_TIMING.status, 'PROPOSED');
  assert.equal(autoDelayMs('normal'), AUTO_TIMING.ms.normal);
  assert.equal(autoDelayMs('fast', 15), 15);
  assert.equal(actionCaption({ kind: 'play', actorAvatarId: 'AVT_AEG_002', cardId: 'ACT_1' }), 'AVT_AEG_002 plays ACT_1');
  assert.equal(actionCaption({ kind: 'end_turn' }), 'End turn');
});

test('player AUTO and enemy turns call the engine exports and the save keeps autoBattle', async () => {
  const api = await loadGameApi();
  assert.equal(api.source, 'engine');
  assert.equal(api.autoAvailable, true);
  assert.equal(typeof api.chooseAutoActions, 'function');
  const profile = (await import('../../web/js/profile.js')).createStarterProfile(api.catalog);
  const { buildMatchInput } = await import('../../web/js/profile.js');
  const match = api.createMatch(buildMatchInput(profile, api.catalog, { seed: 4, mode: 'tower' }));
  if (match.phase === 'enemyTurn') {
    const enemy = api.playEnemyTurn(match);
    assert.equal(enemy.ok, true, enemy.reason);
    assert.ok(Array.isArray(enemy.log));
  }
  assert.equal(match.phase, 'playerTurn');
  const planned = api.chooseAutoActions(match.engine, 'player', { maxActions: 1 });
  assert.ok(Array.isArray(planned));
  const step = api.runAutoTurn(match, 'player', { maxActions: 1, shouldStop: () => false });
  assert.equal(step.ok, true, step.reason);
  assert.ok(step.log.length >= 1);
  profile.autoPlay = { enabled: true, speed: 'fast' };
  const text = api.serialize({ profile, match, screen: 'battle', battleUi: { selection: { mode: 'idle' } } });
  assert.equal(JSON.parse(text).profile.preferences.autoBattle, true);
  const loaded = api.deserialize(text);
  assert.equal(loaded.profile.autoPlay.enabled, true);
  assert.equal(loaded.profile.autoPlay.speed, 'fast');
});
