import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createAssetLoader } from '../src/assets/loader.js';

function loadJson(name) {
  return JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
}

function loaderWith(manifest = loadJson('asset-manifest.snapshot.json'), extra = {}) {
  const rigs = loadJson('rigs.snapshot.json');
  const items = loadJson('equipment-items.snapshot.json');
  const frameLayout = loadJson('frame_layout.snapshot.json');
  return createAssetLoader({
    manifest,
    dataFiles: {
      rigs: rigs.rigs,
      items: items.items,
      frameLayout,
      ...extra.dataFiles,
    },
    slotAnchorMap: extra.slotAnchorMap,
  });
}

test('resolve finds ids and handles missing, CONCEPT, and PROTOTYPE rows', () => {
  const loader = loaderWith();
  const frame = loader.resolve('FRAME_AEGIS_001');
  assert.equal(frame.ok, true);
  assert.equal(frame.status, 'PROTOTYPE');
  assert.equal(frame.advisory, 'PROTOTYPE');
  assert.equal(frame.productionReady, false);
  assert.match(frame.entry.path, /^assets\/card-art\/frames\//);

  const emblem = loader.resolve('EMBLEM_AEGIS_001');
  assert.equal(emblem.status, 'CONCEPT');
  assert.equal(emblem.advisory, 'CONCEPT');
  assert.equal(emblem.ok, true);

  const goldpot = loader.resolve('CARD_AVT_AEG_001_card_v1_variant_goldpot');
  assert.equal(goldpot.advisory, 'CONCEPT');

  const missing = loader.resolve('NO_SUCH_ASSET');
  assert.equal(missing.ok, false);
  assert.equal(missing.found, false);
  assert.equal(missing.reason, 'MISSING_ID');
  assert.equal(missing.entry, null);

  const readyManifest = structuredClone(loadJson('asset-manifest.snapshot.json'));
  readyManifest.assets.push({
    asset_id: 'READY_TEST',
    path: 'tests/fixtures/ready.txt',
    type: 'metadata',
    owner: 'shared',
    status: 'PRODUCTION_READY',
  });
  readyManifest.assets.push({
    asset_id: 'ODD_TEST',
    path: 'tests/fixtures/odd.txt',
    type: 'metadata',
    owner: 'shared',
    status: 'WIP',
  });
  readyManifest.assets.push(null);
  readyManifest.assets.push({ ...readyManifest.assets[0] });
  const mixed = loaderWith(readyManifest);
  assert.equal(mixed.resolve('READY_TEST').productionReady, true);
  assert.equal(mixed.resolve('READY_TEST').advisory, null);
  assert.equal(mixed.resolve('ODD_TEST').advisory, 'UNKNOWN_STATUS');
  assert.equal(mixed.resolve('ODD_TEST').ok, true);
  assert.ok(mixed.warnings.some((warning) => warning.reason === 'DUPLICATE_ID'));
  assert.ok(mixed.warnings.some((warning) => warning.reason === 'ENTRY_MISSING_ID'));
  assert.equal(mixed.resolve(readyManifest.assets[0].asset_id).entry.path, readyManifest.assets[0].path);
  assert.equal(mixed.integrity('FRAME_AEGIS_001').sha256.length, 64);
});

test('frame rects and equipment placement come from fixture data', () => {
  const loader = loaderWith();
  const layout = loadJson('frame_layout.snapshot.json');
  const rect = loader.layoutRect('stat_pow');
  assert.equal(rect.ok, true);
  assert.deepEqual(rect.rect, layout.rects.stat_pow);
  assert.equal(loader.layoutRect('nope').reason, 'UNKNOWN_RECT');

  const bare = createAssetLoader({
    manifest: loadJson('asset-manifest.snapshot.json'),
    dataFiles: {},
  });
  assert.equal(bare.layoutRect('name').reason, 'LAYOUT_UNAVAILABLE');

  const rigs = loadJson('rigs.snapshot.json');
  const items = loadJson('equipment-items.snapshot.json');
  const helmet = loader.placement('AVT_AEG_001', 'EQ_AEG_POT_HELMET_SILVER_001');
  assert.equal(helmet.ok, true);
  assert.equal(helmet.anchorName, 'head');
  assert.equal(helmet.sources.fit, 'none');
  assert.equal(helmet.nativeOriginMatches, true);
  assert.deepEqual(helmet.anchor, rigs.rigs[0].characters.AVT_AEG_001.anchors.head);
  assert.deepEqual(helmet.pivot, items.items.EQ_AEG_POT_HELMET_SILVER_001.pivot);

  const gold = loader.placement('AVT_AEG_001', 'EQ_AEG_POT_HELMET_GOLD_001');
  assert.equal(gold.nativeOriginMatches, true);
  assert.equal(items.items.EQ_AEG_POT_HELMET_GOLD_001.variant_of, 'EQ_AEG_POT_HELMET_SILVER_001');

  const sneakers = loader.placement('AVT_PHA_001', 'EQ_PHA_SNEAKERS_SQUEAK_001');
  assert.equal(sneakers.anchorName, 'feet');
  assert.equal(sneakers.nativeOriginMatches, true);

  const sword = loader.placement('AVT_AEG_001', 'EQ_SWORD_BASIC_001');
  const anchor = rigs.rigs[0].characters.AVT_AEG_001.anchors.main_hand;
  const pivot = items.items.EQ_SWORD_BASIC_001.pivot;
  const fit = rigs.rigs[0].characters.AVT_AEG_001.fit.EQ_SWORD_BASIC_001;
  assert.equal(sword.sources.fit, 'rig.fit');
  assert.deepEqual(sword.origin, [anchor[0] - pivot[0] + fit[0], anchor[1] - pivot[1] + fit[1]]);
  assert.notDeepEqual(sword.origin, [anchor[0] - pivot[0], anchor[1] - pivot[1]]);

  const dagger = loader.placement('AVT_AEG_001', 'EQ_DAGGER_BASIC_001');
  assert.equal(dagger.reason, 'AMBIGUOUS_SLOT');
  assert.deepEqual(dagger.slots, ['main_hand', 'off_hand']);
  const chosen = loader.placement('AVT_AEG_001', 'EQ_DAGGER_BASIC_001', { slot: 'off_hand' });
  assert.equal(chosen.ok, true);
  assert.equal(chosen.anchorName, 'off_hand');

  const moved = loaderWith(undefined, { slotAnchorMap: { map: { headgear: 'feet' } } });
  const remapped = moved.placement('AVT_AEG_001', 'EQ_AEG_POT_HELMET_SILVER_001');
  assert.equal(remapped.anchorName, 'feet');
  assert.equal(remapped.nativeOriginMatches, false);

  assert.equal(loader.placement('AVT_AEG_001', 'MISSING_ITEM').reason, 'MISSING_EQUIPMENT_DATA');
  assert.equal(loader.placement('AVT_MISSING', 'EQ_SWORD_BASIC_001').reason, 'MISSING_RIG');
});

test('loader source does not hardcode fixture pixel values', () => {
  const source = readFileSync(new URL('../src/assets/loader.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b\d{2,}\b/);
  assert.doesNotMatch(source, /Math\.random/);
});
