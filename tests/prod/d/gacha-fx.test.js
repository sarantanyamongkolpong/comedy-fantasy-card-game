import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultRuleConfig } from '../../../src/config/index.js';
import { createBannerState, testBanner } from '../../../src/gacha/index.js';
import { ACTION_RARITIES, AVATAR_RARITIES } from '../../../src/schema/constants.js';
import { gachaAssetUrl } from '../../../web/js/gacha-fx/asset-url.js';
import { annotateDuplicates } from '../../../web/js/gacha-fx/duplicates.js';
import { pityThresholds, pityView, primeBannerCounters } from '../../../web/js/gacha-fx/pity-view.js';
import { createRevealDirector } from '../../../web/js/gacha-fx/sequence.js';
import { highlightResult, summarizeRewards, summaryHeadline } from '../../../web/js/gacha-fx/summary.js';
import { GACHA_FX_CSS } from '../../../web/js/gacha-fx/styles.js';
import { presentationFor, vfxSpec, withGachaFragment } from '../../../web/js/gacha-fx/vfx.js';
import { canonicalBalance, priceLabel, walletView } from '../../../web/js/gacha-fx/wallet-view.js';
import fragment from '../../../web/manifests/gacha.json' with { type: 'json' };
import banners from '../../../content/v05/gacha/TEST_ONLY_banners.json' with { type: 'json' };

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');

test('pity display reads the config object and ignores a stale max on the banner state', () => {
  const stub = {
    gacha: {
      pity: {
        avatarEpicPulls: 17,
        avatarTopPulls: 19,
        actionEpicPulls: 17,
        actionTopPulls: 19,
        companionEpicPulls: 17,
      },
    },
  };
  assert.equal(pityThresholds('avatar', stub).epic, 17);
  assert.equal(pityThresholds('avatar', stub).top, 19);
  assert.equal(pityThresholds('companion', stub).top, null);
  const live = pityThresholds('action', defaultRuleConfig());
  assert.equal(live.epic, 100);
  assert.equal(live.top, 200);
  const view = pityView('avatar', {
    pityEpic: 9,
    pityEpicMax: 7,
    pityTop: 8,
    pityTopMax: 9,
    real: { epicCounter: 4, topCounter: 5 },
  }, defaultRuleConfig());
  assert.equal(view.epic.value, 4);
  assert.equal(view.epic.max, 100);
  assert.equal(view.top.value, 5);
  assert.equal(view.top.max, 200);
  const companion = pityView('companion', { real: { epicCounter: 2, topCounter: null } }, defaultRuleConfig());
  assert.equal(companion.epic.max, 100);
  assert.equal(companion.top, null);
});

test('priming counters does not rewrite pity thresholds', () => {
  const real = createBannerState(testBanner({
    bannerId: 'TEST_BANNER_AVATAR',
    pool: 'avatar',
    entries: [{ id: 'TEST_POOL_N', rarity: 'N', weight: 1 }],
  }), { epicCounter: 1, topCounter: 2 });
  const state = {
    ...real,
    real,
    pityEpic: 1,
    pityTop: 2,
    pityEpicMax: 100,
    pityTopMax: 200,
  };
  const profile = { banners: { TEST_BANNER_AVATAR: state } };
  const primed = primeBannerCounters(profile, 'TEST_BANNER_AVATAR', { epicCounter: 99, topCounter: 199 });
  assert.equal(primed.ok, true);
  assert.equal(primed.pityEpicMax, 100);
  assert.equal(primed.pityTopMax, 200);
  assert.equal(real.epicCounter, 99);
  assert.equal(real.topCounter, 199);
  assert.equal(state.pityEpicMax, 100);
  assert.equal(state.pityTopMax, 200);

  const companionReal = createBannerState(testBanner({
    bannerId: 'TEST_BANNER_COMPANION',
    pool: 'companion',
    entries: [{ id: 'TEST_POOL_N', rarity: 'N', weight: 1 }],
  }), { epicCounter: 3 });
  const companion = {
    ...companionReal,
    real: companionReal,
    pityEpicMax: 100,
    pityTopMax: null,
  };
  const refused = primeBannerCounters(
    { banners: { TEST_BANNER_COMPANION: companion } },
    'TEST_BANNER_COMPANION',
    { topCounter: 10 },
  );
  assert.equal(refused.ok, false);
  assert.equal(companionReal.topCounter, null);
});

test('wallet balance is the canonical G field and a pending price charges nothing', () => {
  assert.equal(canonicalBalance({ currencyG: 4, currency: { G: 9 } }), 4);
  assert.equal(canonicalBalance({ currency: { G: 9 } }), 9);
  assert.equal(canonicalBalance({}), 0);
  for (const banner of banners.banners) {
    const profile = { currencyG: 8 };
    const view = walletView(profile, banner, 10, 3);
    assert.equal(view.balance, 8);
    assert.equal(view.configuredCostG, null);
    assert.equal(view.pendingPrice, true);
    assert.equal(profile.currencyG, 8);
    if (banner.pool === 'companion') {
      assert.equal(view.charged, 0);
      assert.equal(priceLabel(view), 'Companion pulls do not spend G');
    } else {
      assert.equal(view.charged, 3);
      assert.equal(priceLabel(view), 'Price PENDING');
    }
  }
});

test('duplicate copies are labelled and no conversion currency is created', () => {
  const profile = {
    currencyG: 5,
    tokens: [],
    avatars: [{ avatarId: 'AVT_SAMPLE' }],
    actions: [],
  };
  const first = annotateDuplicates(profile, [
    { pool: 'avatar', rarity: 'N', name: 'N TEST token TEST_POOL_N' },
  ]);
  assert.equal(first[0].duplicate, false);
  assert.equal(first[0].copyNumber, 1);
  assert.equal(profile.tokens.length, 0);
  assert.equal(profile.currencyG, 5);
  profile.tokens.push({ pool: 'avatar', rarity: 'N', name: 'N TEST token TEST_POOL_N' });
  const again = annotateDuplicates(profile, [
    { pool: 'avatar', rarity: 'N', name: 'N TEST token TEST_POOL_N' },
    { pool: 'avatar', rarity: 'N', name: 'N TEST token TEST_POOL_N' },
  ]);
  assert.deepEqual(again.map((row) => [row.duplicate, row.copyNumber]), [[true, 2], [true, 3]]);
  assert.match(again[1].duplicateNote, /No conversion/);
  const owned = annotateDuplicates(profile, [{ avatarId: 'AVT_SAMPLE', rarity: 'N', name: 'Hero' }]);
  assert.equal(owned[0].duplicate, true);
  const summary = summarizeRewards(again, 0);
  assert.equal(summary.fresh, 0);
  assert.equal(summary.duplicates, 2);
  assert.equal(summary.charged, 0);
  assert.match(summaryHeadline(summary), /charged 0 G/);
  assert.equal(highlightResult([
    { rarity: 'N' },
    { rarity: 'EX' },
    { rarity: 'R' },
  ]).rarity, 'EX');
});

test('reveal skip and reduced motion settle without extra steps', () => {
  const steps = [];
  const pending = [];
  let cleared = 0;
  const director = createRevealDirector([{ id: 'a' }, { id: 'b' }, { id: 'c' }], {
    stepMs: 40,
    setTimer(fn) {
      pending.push(fn);
      return pending.length;
    },
    clearTimer() { cleared += 1; },
    onStep(step) { steps.push(step.index); },
  });
  director.start();
  assert.deepEqual(steps, [0]);
  pending.shift()();
  assert.deepEqual(steps, [0, 1]);
  director.skip();
  assert.equal(director.skipped, true);
  assert.equal(director.done, true);
  assert.equal(cleared, 1);
  for (const fn of pending) fn();
  assert.deepEqual(steps, [0, 1]);

  let done = 0;
  const reduced = createRevealDirector([{ id: 'a' }, { id: 'b' }], {
    reducedMotion: true,
    onDone() { done += 1; },
  });
  reduced.start();
  assert.equal(reduced.done, true);
  assert.equal(reduced.index, 1);
  assert.equal(done, 1);

  let redraws = 1;
  let alive = true;
  const parked = [];
  const leaving = createRevealDirector([{ id: 'a' }, { id: 'b' }], {
    isAlive: () => alive,
    setTimer(fn) { parked.push(fn); return fn; },
    clearTimer() {},
    onStep() { redraws += 1; },
    onDone() { redraws += 10; },
  });
  leaving.start();
  alive = false;
  parked[0]();
  assert.equal(leaving.done, true);
  assert.equal(redraws, 2);
});

test('every shipped rarity has its own plate and EX keeps an edge mask', () => {
  const manifest = withGachaFragment({
    assets: [
      { asset_id: 'VFX_REVEAL_EPIC', slot: 'gacha-vfx', subject_id: 'Epic', rarity: 'Epic' },
      {
        asset_id: 'VFX_REVEAL_EX',
        slot: 'gacha-vfx',
        subject_id: 'EX',
        rarity: 'EX',
        presentation: { blend: 'screen', mask: 'radial' },
      },
    ],
  });
  const ids = [];
  for (const rarity of new Set([...AVATAR_RARITIES, ...ACTION_RARITIES])) {
    const plate = presentationFor(rarity, manifest);
    assert.ok(vfxSpec(rarity), rarity);
    assert.equal(plate.plate.asset_id, vfxSpec(rarity).assetId);
    ids.push(plate.plate.asset_id);
  }
  assert.equal(new Set(ids).size, ids.length);
  const ex = presentationFor('EX', manifest);
  assert.equal(ex.edgeMask, true);
  assert.equal(ex.mask.asset_id, 'GFX_EDGE_MASK_EX');
  assert.equal(ex.blend, 'screen');
  assert.equal(presentationFor('N', manifest).edgeMask, false);
  assert.equal(presentationFor('FAC', manifest).plate.asset_id, 'GFX_VFX_FAC');
});

test('gacha fragment is GENERATED_REVIEW and each asset file matches its byte count', () => {
  assert.equal(fragment.status, 'GENERATED_REVIEW');
  assert.equal(fragment.review_status, 'GENERATED_REVIEW');
  const required = ['asset_id', 'slot', 'path', 'anchor', 'subject_id', 'rarity', 'status', 'source_path', 'bytes'];
  const ids = new Set();
  for (const asset of fragment.assets) {
    for (const key of required) assert.ok(Object.prototype.hasOwnProperty.call(asset, key), asset.asset_id);
    assert.equal(asset.status, 'CONCEPT', asset.asset_id);
    assert.equal(asset.review_status, 'GENERATED_REVIEW');
    assert.equal(asset.owner, 'web-ui');
    assert.equal(ids.has(asset.asset_id), false);
    ids.add(asset.asset_id);
    assert.match(asset.path, /^web\/assets\/gacha\/.+\.webp$/);
    assert.match(asset.source_path, /^art-src\/gacha\/.+\.svg$/);
    const shipped = statSync(join(root, asset.path));
    assert.equal(shipped.size, asset.bytes, asset.asset_id);
    const svg = readFileSync(join(root, asset.source_path), 'utf8');
    assert.doesNotMatch(svg, /<text[\s>]/);
    assert.doesNotMatch(svg, /PRODUCTION_READY|OWNER_APPROVED|LOCKED/);
  }
  assert.equal(fragment.assets.length, 6);
  assert.doesNotMatch(JSON.stringify(fragment), /PRODUCTION_READY|OWNER_APPROVED/);
});

test('playable page resolves fragment plates from the html location', () => {
  const asset = fragment.assets[0];
  const fromModule = gachaAssetUrl(asset);
  assert.match(fromModule, /vfx_n\.webp$/);
  const fromPlayable = gachaAssetUrl(asset, 'file:///repo/web/dist/playable.html');
  assert.equal(fromPlayable, 'file:///repo/web/assets/gacha/vfx_n.webp');
  const fromIndex = gachaAssetUrl(asset, 'http://127.0.0.1:9/web/index.html');
  assert.equal(fromIndex, 'http://127.0.0.1:9/web/assets/gacha/vfx_n.webp');
});

test('booth motion stays on transform and opacity and honors reduced motion', () => {
  const css = readFileSync(join(root, 'web/css/gacha-fx.css'), 'utf8');
  assert.equal(css, GACHA_FX_CSS);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /animation:\s*none !important/);
  assert.match(css, /transition:\s*none !important/);
  const bodies = [];
  const re = /@keyframes\s+[\w-]+\s*\{/g;
  for (const match of css.matchAll(re)) {
    let index = match.index + match[0].length;
    let depth = 1;
    const start = index;
    while (index < css.length && depth > 0) {
      if (css[index] === '{') depth += 1;
      else if (css[index] === '}') depth -= 1;
      index += 1;
    }
    bodies.push(css.slice(start, index - 1));
  }
  assert.ok(bodies.length >= 6);
  for (const body of bodies) {
    assert.doesNotMatch(body, /\b(width|height|left|top|right|bottom|margin|filter|box-shadow|background-position)\s*:/);
  }
});

test('the booth screen reuses the legacy pull seed and does not invent a price', () => {
  const screen = readFileSync(join(root, 'web/js/gacha-fx/screen.js'), 'utf8');
  const legacy = readFileSync(join(root, 'web/js/screens/gacha.js'), 'utf8');
  const seed = "integerSeed(['gacha', banner.bannerId, ctx.profile.seq, count].join(':'))";
  assert.ok(screen.includes(seed));
  assert.ok(legacy.includes(seed));
  assert.match(screen, /pityView\(/);
  assert.match(screen, /walletView\(/);
  assert.match(screen, /annotateDuplicates\(/);
  assert.match(screen, /prefersReducedMotion\(/);
  assert.match(screen, /createRevealDirector\(/);
  assert.doesNotMatch(screen, /costG\s*[:=]\s*\d+/);
  assert.doesNotMatch(screen, /pity(?:Epic|Top)(?:Max|Pulls)?\s*[:=]\s*\d+/);
});
