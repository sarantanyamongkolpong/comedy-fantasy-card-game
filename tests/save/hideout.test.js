import assert from 'node:assert/strict';
import test from 'node:test';
import { acquireTier, displayHouseTier, HOUSE_TIERS, installFurniture, storageFromFurniture } from '../../src/schema/hideout.js';

test('house tiers do not add storage; installed furniture does', () => {
  const names = HOUSE_TIERS.map((row) => [row.id, row.name, row.referenceFurniture?.capacity ?? null]);
  assert.deepEqual(names, [
    ['cabin', 'Cabin', null],
    ['bungalow', 'Bungalow', 50],
    ['cottage', 'Cottage', 50],
    ['loft', 'Loft', 100],
    ['villa', 'Villa', 100],
    ['penthouse', 'Penthouse', 150],
  ]);
  for (const row of HOUSE_TIERS) {
    if (!row.referenceFurniture) continue;
    assert.equal(row.referenceFurniture.grantStatus, 'PENDING_OWNER');
  }

  let house = { acquiredTiers: ['cabin'], installedFurniture: [] };
  assert.equal(displayHouseTier(house), 'cabin');
  assert.equal(storageFromFurniture(house).installedSlots, 0);
  assert.equal(storageFromFurniture(house).houseTierBonus, 0);
  assert.equal(storageFromFurniture(house).cabinBase.value, null);
  assert.equal(storageFromFurniture(house).cabinBase.status, 'PENDING_OWNER');

  house = acquireTier(house, 'penthouse');
  assert.equal(house.displayTier, 'penthouse');
  assert.equal(house.installedFurniture.length, 0);
  assert.equal(storageFromFurniture(house).installedSlots, 0);

  house = installFurniture(house, { furnitureId: 'FUR_REF_BUNGALOW_BOX', capacity: 50 });
  house = installFurniture(house, { furnitureId: 'FUR_REF_LOFT_TALL_CABINET', capacity: 100 });
  assert.equal(storageFromFurniture(house).installedSlots, 150);
  assert.equal(house.displayTier, 'penthouse');
});
