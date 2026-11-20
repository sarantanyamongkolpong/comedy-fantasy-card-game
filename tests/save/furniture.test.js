import assert from 'node:assert/strict';
import test from 'node:test';
import { acquireTier, installFurniture, removeFurniture, storageFromFurniture } from '../../src/schema/hideout.js';
import { createProfile, grantItem, stackCounts } from '../../src/save/inventory.js';
import { stashReport } from '../../src/save/stash.js';

test('install and remove change furniture slots, and the house tier does not', () => {
  const original = { acquiredTiers: ['cabin'], installedFurniture: [] };
  const installed = installFurniture(original, { furnitureId: 'FUR_REF_BUNGALOW_BOX', capacity: 50 });
  const both = installFurniture(installed, { furnitureId: 'FUR_REF_LOFT_TALL_CABINET', capacity: 100 });
  assert.equal(original.installedFurniture.length, 0);
  assert.equal(storageFromFurniture(both).installedSlots, 150);
  assert.equal(storageFromFurniture(both).houseTierBonus, 0);

  const upgraded = acquireTier(both, 'penthouse');
  assert.equal(upgraded.displayTier, 'penthouse');
  assert.equal(storageFromFurniture(upgraded).installedSlots, 150);

  const removed = removeFurniture(upgraded, 'FUR_REF_BUNGALOW_BOX');
  assert.equal(removed.displayTier, 'penthouse');
  assert.equal(removed.acquiredTiers.includes('penthouse'), true);
  assert.equal(storageFromFurniture(removed).installedSlots, 100);
  assert.equal(upgraded.installedFurniture.length, 2);
  assert.throws(() => removeFurniture(removed, 'FUR_REF_BUNGALOW_BOX'), /not installed/);
});

test('two copies of one catalog id stay one stack, and stash slots stay the furniture sum', () => {
  let profile = createProfile();
  profile = grantItem(profile, { kind: 'action', catalogId: 'ACT_TEST', quantity: 2 });
  profile = grantItem(profile, { kind: 'avatar', catalogId: 'AVT_AEG_001', quantity: 1 });
  const counts = stackCounts(profile.inventory);
  assert.equal(counts.stacks.length, 2);
  assert.equal(counts.stacks.find((row) => row.catalogId === 'ACT_TEST').quantity, 2);
  assert.equal(counts.copies, 3);

  profile = {
    ...profile,
    house: installFurniture(profile.house, { furnitureId: 'FUR_REF_BUNGALOW_BOX', capacity: 50 }),
  };
  const before = stashReport(profile);
  profile = { ...profile, house: acquireTier(profile.house, 'villa') };
  const after = stashReport(profile);
  assert.equal(before.storage.installedSlots, 50);
  assert.equal(after.storage.installedSlots, 50);
  assert.equal(after.houseTierAddsSlots, false);
  assert.equal(after.stackCounts.copies, 3);
  assert.equal(after.totalCapacity.value, null);
  assert.equal(after.totalCapacity.status, 'PENDING_OWNER');
  assert.equal(after.prices.status, 'PENDING_OWNER');
  assert.equal(after.loot.status, 'PENDING_OWNER');
  assert.equal(after.rewardG.status, 'PENDING_OWNER');
  assert.equal(after.furnitureGrant.status, 'PENDING_OWNER');
  assert.equal(after.storage.cabinBase.value, null);
  assert.equal(after.storage.cabinBase.status, 'PENDING_OWNER');
});

test('a piece with no capacity number still has to say it is pending or art-only', () => {
  const house = { acquiredTiers: ['cabin'], installedFurniture: [{ furnitureId: 'mystery', capacity: null }] };
  assert.throws(() => storageFromFurniture(house), /non-negative integer/);
});
