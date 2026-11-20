import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { HOUSE_TIERS, PHASE3_FURNITURE_ART, installFurniture, storageFromFurniture } from '../../src/schema/hideout.js';

const EXISTING = HOUSE_TIERS.flatMap((row) => (row.referenceFurniture ? [row.referenceFurniture.furnitureId] : []));

test('phase 3 furniture is art-only and keeps every existing FUR id', () => {
  const manifest = JSON.parse(readFileSync(new URL('../../art_source/dream_v03/ASSET_MANIFEST.json', import.meta.url), 'utf8'));
  const art = JSON.parse(readFileSync(new URL('../../art_source/dream_v03/furniture/FURNITURE_ART_MANIFEST.json', import.meta.url), 'utf8'));
  const assetIds = Object.keys(manifest.assets).filter((id) => id.startsWith('furniture_'));
  assert.deepEqual(PHASE3_FURNITURE_ART.map((row) => row.assetId), assetIds);
  assert.deepEqual(PHASE3_FURNITURE_ART.map((row) => row.artFileId), art.files.map((row) => row.id));
  assert.deepEqual(EXISTING, [
    'FUR_REF_BUNGALOW_BOX',
    'FUR_REF_COTTAGE_BOX',
    'FUR_REF_LOFT_TALL_CABINET',
    'FUR_REF_VILLA_DISPLAY_COUNTER',
    'FUR_REF_PENTHOUSE_LARGE_TALL_CABINET',
  ]);

  for (const row of PHASE3_FURNITURE_ART) {
    assert.equal(row.status, 'PROPOSED');
    assert.equal(row.artOnly, true);
    assert.equal(row.capacity, null);
    assert.equal(row.price, null);
    assert.equal(row.capacityStatus, 'PENDING_OWNER');
    assert.equal(row.priceStatus, 'PENDING_OWNER');
    assert.equal(row.ownerArtApproval, false);
    assert.equal(row.reviewStatus, 'GENERATED_REVIEW');
    assert.equal(Object.hasOwn(row, 'furnitureId'), false);
    assert.equal(EXISTING.includes(row.assetId), false);
    assert.equal(row.assetId.startsWith('FUR_'), false);
    assert.equal(existsSync(new URL(`../../${row.file}`, import.meta.url)), true);
  }

  let house = { acquiredTiers: ['penthouse'], installedFurniture: [] };
  house = installFurniture(house, { furnitureId: 'FUR_REF_VILLA_DISPLAY_COUNTER', capacity: 100 });
  const slots = storageFromFurniture(house).installedSlots;
  for (const row of PHASE3_FURNITURE_ART) house = installFurniture(house, row);
  assert.equal(storageFromFurniture(house).installedSlots, slots);
  assert.equal(house.displayTier, 'penthouse');
  assert.throws(() => installFurniture(house, { ...PHASE3_FURNITURE_ART[0], capacity: 10 }), /no capacity/);
});
