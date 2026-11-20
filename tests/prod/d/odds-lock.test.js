/**
 * Fails if gacha odds, pity thresholds, or currency costs drift from prod/wave-base.
 * Agent D may display these values. It must not change them.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultRuleConfig } from '../../../src/config/index.js';
import { createBannerState, exampleTestBanners, pull, testBanner } from '../../../src/gacha/index.js';
import { createProfile } from '../../../src/save/inventory.js';
import {
  COMPANION_EPIC_PITY_PULLS,
  EPIC_PITY_PULLS,
  TOP_PITY_PULLS,
} from '../../../src/schema/constants.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const bannerPath = join(root, 'content/v05/gacha/TEST_ONLY_banners.json');

const BASE_SHA256 = {
  'src/gacha/pull.js': '4c01767d331d39a34bd3b50a33bdc76ff2031549ab21f25fa6ce16d1f6cdd941',
  'src/gacha/test-config.js': 'c57ef2cd5f2cf2d40b75357ba9c52a969377988f12adde0b0ae7a7d6ee4cbbb3',
  'content/v05/gacha/TEST_ONLY_banners.json': '1df2012c8e5d1348e5e29299090408332d7b514a625bf9f11626eb8910122636',
};

function sha256(file) {
  return createHash('sha256').update(readFileSync(join(root, file))).digest('hex');
}

test('gacha engine files and the TEST banner file match the wave base bytes', () => {
  for (const [file, hash] of Object.entries(BASE_SHA256)) {
    assert.equal(sha256(file), hash, file);
  }
});

test('owner-locked pity thresholds stay Epic 100 and top tier 200', () => {
  assert.equal(EPIC_PITY_PULLS, 100);
  assert.equal(TOP_PITY_PULLS, 200);
  assert.equal(COMPANION_EPIC_PITY_PULLS, 100);
  const pity = defaultRuleConfig().gacha.pity;
  assert.equal(pity.status, 'LOCKED');
  assert.equal(pity.avatarEpicPulls, 100);
  assert.equal(pity.actionEpicPulls, 100);
  assert.equal(pity.companionEpicPulls, 100);
  assert.equal(pity.avatarTopPulls, 200);
  assert.equal(pity.actionTopPulls, 200);
  assert.equal(pity.rules['GA-05'], 100);
  assert.equal(pity.rules['GA-06'], 100);
  assert.equal(pity.rules['GA-07'], 200);
  assert.equal(pity.rules['GA-08'], 200);
  assert.equal(pity.rules['GA-09'], 100);
  assert.equal(pity.rules['GA-10'], null);
  assert.equal(pity.companionTopPity, false);
});

test('production price and drop rates stay pending and the TEST banners are unchanged', () => {
  const config = defaultRuleConfig();
  const rules = config.gacha;
  assert.equal(rules.costG.status, 'PENDING_OWNER');
  assert.equal(rules.costG.value, null);
  assert.equal(rules.rates.status, 'PENDING_OWNER');
  assert.equal(rules.rates.value, null);
  assert.equal(config.duplicateConversion.status, 'PENDING_OWNER');
  assert.equal(config.duplicateConversion.value, null);
  const file = JSON.parse(readFileSync(bannerPath, 'utf8'));
  assert.deepEqual(file, exampleTestBanners());
  for (const banner of file.banners) {
    assert.equal(banner.costG, null);
    assert.equal(banner.costStatus, 'PENDING_OWNER');
    assert.equal(banner.rateStatus, 'TEST_ONLY_NOT_PRODUCTION');
  }
});

test('a free pull still does not spend G, and pity still fires at 100 and 200', () => {
  const avatar = testBanner({
    bannerId: 'TEST_BANNER_AVATAR',
    pool: 'avatar',
    entries: [
      { id: 'TEST_POOL_N', rarity: 'N', weight: 100 },
      { id: 'TEST_POOL_EPIC', rarity: 'Epic', weight: 0 },
      { id: 'TEST_POOL_EX', rarity: 'EX', weight: 0 },
    ],
  });
  const profile = createProfile({ currency: { G: 5 } });
  const free = pull(createBannerState(avatar), { seed: 8, count: 10, profile });
  assert.equal(free.spent, null);
  assert.equal(free.profile.currency.G, 5);
  assert.equal(profile.currency.G, 5);

  const epic = pull(createBannerState(avatar, { epicCounter: 99, topCounter: 1 }), { seed: 4, count: 1 });
  assert.equal(epic.pulls[0].forced, 'epic');
  assert.ok(epic.pulls[0].rarity === 'Epic' || epic.pulls[0].rarity === 'EX');

  const action = testBanner({
    bannerId: 'TEST_BANNER_ACTION',
    pool: 'action',
    entries: [
      { id: 'TEST_POOL_N', rarity: 'N', weight: 100 },
      { id: 'TEST_POOL_EPIC', rarity: 'Epic', weight: 0 },
      { id: 'TEST_POOL_FAC', rarity: 'FAC', weight: 0 },
    ],
  });
  const top = pull(createBannerState(action, { epicCounter: 1, topCounter: 199 }), { seed: 5, count: 1 });
  assert.equal(top.pulls[0].forced, 'top');
  assert.equal(top.pulls[0].rarity, 'FAC');
  assert.equal(top.state.epicCounter, 0);
  assert.equal(top.state.topCounter, 0);
});
