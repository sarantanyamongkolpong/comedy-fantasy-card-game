import assert from 'node:assert/strict';
import test from 'node:test';
import banners from '../../content/v05/gacha/TEST_ONLY_banners.json' with { type: 'json' };
import { bannerList, createBannerState, integerSeed, pull } from '../../src/gacha/index.js';

test('a banner list may be the content file, and weights stand in for entries', () => {
  const list = bannerList(banners);
  assert.equal(list.length, 3);
  const source = list[0];
  const weightsOnly = { ...source, weights: source.entries };
  delete weightsOnly.entries;
  const state = createBannerState(weightsOnly);
  assert.equal(state.banner.entries.length, source.entries.length);
  assert.equal(state.banner.entries[0].id, 'TEST_POOL_N');

  assert.throws(() => pull(state, { seed: 'gacha:TEST_BANNER_AVATAR:1:1', count: 1 }), /integerSeed/);
  const seed = integerSeed('gacha:TEST_BANNER_AVATAR:1:1');
  assert.equal(Number.isInteger(seed), true);
  assert.equal(seed >= 0, true);
  const pulled = pull(state, { seed, count: 1 });
  assert.equal(pulled.pulls.length, 1);
  assert.equal(pulled.results, pulled.pulls);

  const uiState = { real: state, weights: state.banner.entries, pityEpic: state.epicCounter, pityTop: state.topCounter };
  const fromUi = pull(uiState, { seed: 20261120, count: 1 });
  assert.equal(fromUi.pulls.length, 1);
  assert.equal(fromUi.results[0].id, fromUi.pulls[0].id);
});
