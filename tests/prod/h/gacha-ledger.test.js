import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createBannerState, pull } from '../../../src/gacha/index.js';
import {
  COMPANION_EPIC_PITY_PULLS,
  EPIC_PITY_PULLS,
  TOP_PITY_PULLS,
} from '../../../src/schema/constants.js';
import { bindEngine } from '../../../web/js/engine-session.js';
import * as engine from '../../../src/engine/index.js';
import * as gacha from '../../../src/gacha/index.js';
import * as save from '../../../src/save/index.js';

const bannerFile = JSON.parse(readFileSync(new URL('../../../content/v05/gacha/TEST_ONLY_banners.json', import.meta.url), 'utf8'));

const EXPECTED = [
  {
    bannerId: 'TEST_BANNER_AVATAR',
    pool: 'avatar',
    costG: null,
    costStatus: 'PENDING_OWNER',
    entries: [
      { id: 'TEST_POOL_N', rarity: 'N', weight: 100 },
      { id: 'TEST_POOL_EPIC', rarity: 'Epic', weight: 0 },
      { id: 'TEST_POOL_EX', rarity: 'EX', weight: 0 },
    ],
  },
  {
    bannerId: 'TEST_BANNER_ACTION',
    pool: 'action',
    costG: null,
    costStatus: 'PENDING_OWNER',
    entries: [
      { id: 'TEST_POOL_N', rarity: 'N', weight: 100 },
      { id: 'TEST_POOL_EPIC', rarity: 'Epic', weight: 0 },
      { id: 'TEST_POOL_FAC', rarity: 'FAC', weight: 0 },
    ],
  },
  {
    bannerId: 'TEST_BANNER_COMPANION',
    pool: 'companion',
    costG: null,
    costStatus: 'PENDING_OWNER',
    entries: [
      { id: 'TEST_POOL_N', rarity: 'N', weight: 100 },
      { id: 'TEST_POOL_EPIC', rarity: 'Epic', weight: 0 },
    ],
  },
];

test('content/v05 gacha odds, pity caps, and cost stay on the published TEST ledger', () => {
  assert.equal(EPIC_PITY_PULLS, 100);
  assert.equal(TOP_PITY_PULLS, 200);
  assert.equal(COMPANION_EPIC_PITY_PULLS, 100);
  assert.equal(bannerFile.banners.length, EXPECTED.length);
  for (const expected of EXPECTED) {
    const banner = bannerFile.banners.find((row) => row.bannerId === expected.bannerId);
    assert.ok(banner, expected.bannerId);
    assert.equal(banner.pool, expected.pool);
    assert.equal(banner.costG, expected.costG);
    assert.equal(banner.costStatus, expected.costStatus);
    assert.equal(banner.rateStatus, 'TEST_ONLY_NOT_PRODUCTION');
    assert.deepEqual(banner.entries, expected.entries);
  }
});

test('engine pulls charge no G and do not move pity off the locked counters', () => {
  for (const banner of bannerFile.banners) {
    const state = createBannerState(banner);
    assert.equal(state.epicCounter, 0);
    assert.equal(state.pool === 'companion' ? state.topCounter : state.topCounter, banner.pool === 'companion' ? null : 0);
    const once = pull(state, { seed: 7, count: 1 });
    assert.equal(once.spent ?? null, null);
    assert.equal(once.pulls.length, 1);
    assert.equal(once.pulls[0].rarity, 'N');
    assert.equal(once.pulls[0].forced, null);
    assert.equal(once.state.epicCounter, 1);
    if (banner.pool === 'companion') assert.equal(once.state.topCounter, null);
    else assert.equal(once.state.topCounter, 1);
    const ten = pull(state, { seed: 11, count: 10 });
    assert.equal(ten.spent ?? null, null);
    assert.equal(ten.state.pulls, 10);
    assert.equal(ten.state.epicCounter, 10);
    assert.ok(ten.pulls.every((row) => row.rarity === 'N' && row.forced == null));
  }
});

test('web gacha adapter reports chargedG 0 and keeps the banner weight table', () => {
  const api = bindEngine(engine, gacha, save, {
    playEnemyTurn: engine.playEnemyTurn,
    runAutoTurn: engine.runAutoTurn,
    chooseAutoActions: engine.chooseAutoActions,
  });
  for (const banner of bannerFile.banners) {
    const ui = api.createBannerState({ ...banner, weights: banner.entries });
    assert.equal(ui.pityEpic, 0);
    assert.equal(ui.pityEpicMax, 100);
    assert.equal(ui.pityTopMax, banner.pool === 'companion' ? null : 200);
    assert.deepEqual(ui.weights, banner.entries);
    const outcome = api.pull(ui, { seed: 3, count: 10 });
    assert.equal(outcome.chargedG, 0);
    assert.equal(outcome.results.length, 10);
    assert.ok(outcome.results.every((row) => row.rarity === 'N'));
    assert.equal(outcome.state.pityEpic, 10);
    if (banner.pool === 'companion') assert.equal(outcome.state.pityTop, null);
    else assert.equal(outcome.state.pityTop, 10);
    assert.deepEqual(outcome.state.weights, banner.entries);
  }
});
