import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { boxesOverlap, canPlace, expectedFootprint, insideStage, replacePreview } from './placement-rules.js';
import { transparentRatio } from './webp-alpha.js';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const read = (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8'));

const manifest = read('web/manifests/hideout.json');
const tiers = read('content/prod/hideout/tiers.json');
const objects = read('content/prod/hideout/objects.json');
const placement = read('content/prod/hideout/placement.json');
const houseTiers = read('content/v05/hideout/house-tiers.json');
const mainManifest = read('web/assets-manifest.json');

const REQUIRED_IDS = [
  'HOU_TIER_CABIN', 'HOU_TIER_BUNGALOW', 'HOU_TIER_COTTAGE', 'HOU_TIER_LOFT', 'HOU_TIER_VILLA', 'HOU_TIER_PENTHOUSE',
  'BG_HIDEOUT_CABIN', 'BG_HIDEOUT_BUNGALOW', 'BG_HIDEOUT_COTTAGE', 'BG_HIDEOUT_LOFT', 'BG_HIDEOUT_VILLA', 'BG_HIDEOUT_PENTHOUSE',
  'PROP_HIDEOUT_BED', 'PROP_HIDEOUT_SOFA', 'PROP_HIDEOUT_BOOKCASE', 'PROP_HIDEOUT_SHELF', 'PROP_HIDEOUT_WARDROBE',
  'FUR_REF_BUNGALOW_BOX', 'FUR_REF_COTTAGE_BOX', 'FUR_REF_LOFT_TALL_CABINET', 'FUR_REF_VILLA_DISPLAY_COUNTER', 'FUR_REF_PENTHOUSE_LARGE_TALL_CABINET',
  'PROP_HIDEOUT_CHEST',
  'DEC_HIDEOUT_STAR_RUG', 'DEC_HIDEOUT_STAR_BANNER', 'DEC_HIDEOUT_WALL_LANTERN', 'DEC_HIDEOUT_PLANTER',
  'PROP_HIDEOUT_WORKBENCH', 'INT_HIDEOUT_CRYSTAL_ORB',
  'ICO_FUR_REF_BUNGALOW_BOX', 'ICO_FUR_REF_COTTAGE_BOX', 'ICO_FUR_REF_LOFT_TALL_CABINET', 'ICO_FUR_REF_VILLA_DISPLAY_COUNTER', 'ICO_FUR_REF_PENTHOUSE_LARGE_TALL_CABINET',
];

const CONTENT_IDS = [
  'furniture_companion_bed', 'furniture_cozy_sofa', 'furniture_bookcase', 'furniture_trophy_shelf', 'furniture_wardrobe',
  'furniture_ornate_storage_chest', 'furniture_magic_workbench',
  'FUR_REF_BUNGALOW_BOX', 'FUR_REF_COTTAGE_BOX', 'FUR_REF_LOFT_TALL_CABINET', 'FUR_REF_VILLA_DISPLAY_COUNTER', 'FUR_REF_PENTHOUSE_LARGE_TALL_CABINET',
];

const CAP = {
  exterior: 260_000,
  interior: 180_000,
  furniture: 140_000,
  storage: 140_000,
  decoration: 80_000,
  interactive: 140_000,
  icon: 50_000,
};

test('hideout ids stay stable and the fragment is review-only', () => {
  assert.equal(manifest.status, 'GENERATED_REVIEW');
  assert.equal(tiers.status, 'GENERATED_REVIEW');
  assert.equal(objects.status, 'GENERATED_REVIEW');
  assert.equal(placement.status, 'GENERATED_REVIEW');
  assert.equal(Object.hasOwn(manifest, 'assets'), false);
  const ids = manifest.entries.map((asset) => asset.asset_id);
  assert.deepEqual(ids, REQUIRED_IDS);
  assert.equal(new Set(ids).size, ids.length);
  const paths = manifest.entries.map((asset) => asset.path);
  assert.equal(new Set(paths).size, paths.length);
  for (const asset of manifest.entries) {
    for (const key of ['asset_id', 'slot', 'path', 'anchor', 'subject_id', 'rarity', 'status', 'source_path', 'bytes']) {
      assert.equal(Object.hasOwn(asset, key), true, `${asset.asset_id} ${key}`);
    }
    assert.equal(asset.status, 'GENERATED_REVIEW');
    assert.equal(asset.rarity, null);
    assert.equal(asset.path.startsWith('web/assets/hideout/'), true, asset.path);
    assert.equal(asset.source_path.startsWith('art-src/hideout/'), true, asset.source_path);
  }
  assert.equal(mainManifest.assets.some((asset) => String(asset.path).includes('web/assets/hideout/')), false);
  assert.deepEqual(tiers.tiers.map((tier) => tier.name), ['Cabin', 'Bungalow', 'Cottage', 'Loft', 'Villa', 'Penthouse']);
  const contentIds = new Set(objects.objects.map((row) => row.id));
  for (const id of CONTENT_IDS) assert.equal(contentIds.has(id), true, id);
});

test('hideout files exist and match the manifest byte counts', () => {
  for (const asset of manifest.entries) {
    for (const rel of [asset.path, asset.source_path]) {
      const size = statSync(join(root, rel)).size;
      assert.equal(size > 0, true, rel);
    }
    assert.equal(statSync(join(root, asset.path)).size, asset.bytes, asset.asset_id);
    assert.equal(asset.bytes <= CAP[asset.category], true, `${asset.asset_id} ${asset.bytes}`);
  }
});

test('shipped cutouts are transparent and interiors are opaque', async () => {
  for (const asset of manifest.entries) {
    const ratio = await transparentRatio(readFileSync(join(root, asset.path)));
    if (asset.category === 'interior') {
      assert.equal(ratio.ratio, 0, asset.asset_id);
    } else {
      assert.equal(ratio.ratio > 0.05, true, `${asset.asset_id} ${ratio.ratio}`);
    }
  }
});

test('one tier preview stays inside the screen byte budget', () => {
  const byId = new Map(manifest.entries.map((asset) => [asset.asset_id, asset]));
  for (const tier of tiers.tiers) {
    const layout = placement.previewLayouts[tier.id];
    const ids = new Set([tier.interiorAssetId, ...Object.values(layout.anchors)]);
    let total = 0;
    for (const id of ids) total += byId.get(id).bytes;
    assert.equal(total <= 2_000_000, true, `${tier.id} ${total}`);
    assert.equal(layout.installed, false);
    assert.equal(layout.grantsCapacity, false);
    assert.equal(layout.previewOnly, true);
  }
});

test('anchors fit the stage, the grid, and their layer', () => {
  assert.deepEqual(placement.layerOrder, ['interior', 'floor-decor', 'wall', 'floor-furniture', 'storage', 'interactive']);
  assert.equal(placement.stage.width, 1672);
  assert.equal(placement.stage.height, 941);
  const layers = new Map();
  for (const anchor of placement.anchors) {
    assert.equal(insideStage(anchor, placement.stage), true, anchor.id);
    assert.equal(placement.layerOrder.includes(anchor.layer), true, anchor.layer);
    assert.deepEqual(anchor.footprint, expectedFootprint(anchor, placement.grid.cell));
    const group = layers.get(anchor.layer) ?? [];
    for (const other of group) {
      assert.equal(boxesOverlap(anchor, other), false, `${anchor.id} overlaps ${other.id}`);
    }
    group.push(anchor);
    layers.set(anchor.layer, group);
  }
});

test('replacement checks category and footprint and grants nothing', () => {
  const byAnchor = new Map(placement.anchors.map((anchor) => [anchor.id, anchor]));
  const byObject = new Map(objects.objects.map((row) => [row.manifestAssetId, row]));
  for (const tier of tiers.tiers) {
    const seen = new Set();
    for (const [anchorId, assetId] of Object.entries(placement.previewLayouts[tier.id].anchors)) {
      assert.equal(seen.has(assetId), false, `${tier.id} repeats ${assetId}`);
      seen.add(assetId);
      const decision = canPlace(byAnchor.get(anchorId), byObject.get(assetId));
      assert.equal(decision.ok, true, `${tier.id} ${anchorId} ${assetId} ${decision.reason}`);
    }
  }
  const floor = byAnchor.get('floor.west');
  const box = byObject.get('FUR_REF_BUNGALOW_BOX');
  assert.equal(canPlace(floor, box).reason, 'category');
  const huge = { ...byObject.get('PROP_HIDEOUT_BED'), footprint: { cols: 99, rows: 99 } };
  assert.equal(canPlace(floor, huge).reason, 'footprint');
  const swapped = replacePreview(
    placement.previewLayouts.cabin.anchors,
    'floor.west',
    byObject.get('PROP_HIDEOUT_SOFA'),
    placement.anchors,
  );
  assert.equal(swapped.decision.ok, true);
  assert.equal(swapped.layout['floor.west'], 'PROP_HIDEOUT_SOFA');
  assert.equal(swapped.installed, false);
  assert.equal(swapped.grantsCapacity, false);
  assert.equal(Object.hasOwn(swapped, 'price'), false);
});

test('storage visual capacity copies the sheet and nothing else has a number', () => {
  const expected = new Map(houseTiers.houseTiers.map((tier) => [
    tier.referenceFurniture?.furnitureId ?? null,
    tier.referenceFurniture?.capacity ?? null,
  ]));
  for (const row of objects.objects) {
    assert.equal(row.price, null, row.id);
    assert.equal(JSON.stringify(row).includes('houseTierBonus'), false, row.id);
    if (row.visualCapacityStatus === 'FROM_SOURCE') {
      assert.equal(row.visualCapacity, expected.get(row.id), row.id);
    } else {
      assert.equal(row.visualCapacity, null, row.id);
    }
  }
  const loft = readFileSync(join(root, 'web/assets/hideout/storage/FUR_REF_LOFT_TALL_CABINET.webp'));
  const penthouse = readFileSync(join(root, 'web/assets/hideout/storage/FUR_REF_PENTHOUSE_LARGE_TALL_CABINET.webp'));
  assert.equal(loft.equals(penthouse), false);
  const bungalow = manifest.entries.find((asset) => asset.asset_id === 'FUR_REF_BUNGALOW_BOX');
  const cottage = manifest.entries.find((asset) => asset.asset_id === 'FUR_REF_COTTAGE_BOX');
  assert.notEqual(bungalow.path, cottage.path);
});
