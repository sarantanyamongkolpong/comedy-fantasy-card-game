import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { deserialize, serialize } from '../../../src/save/index.js';
import { contentCatalog } from '../../../web/js/content-catalog.js';
import { createStarterProfile } from '../../../web/js/profile.js';
import { buildLibrary, capacityFromProfile, copyInstanceId } from '../../../web/js/collection/model.js';

const v1 = JSON.parse(readFileSync(new URL('./fixtures/save-v1.json', import.meta.url), 'utf8'));
const v2 = JSON.parse(readFileSync(new URL('./fixtures/save-v2.json', import.meta.url), 'utf8'));
const legacy = JSON.parse(readFileSync(new URL('../../migrate/fixtures/legacy-pow-save-v1.json', import.meta.url), 'utf8'));

test('version 1 bag save migrates forward and round-trips without dropping inventory', () => {
  const once = deserialize(v1);
  const twice = deserialize(serialize(once));
  assert.deepEqual(twice, once);
  assert.equal(once.saveVersion, 2);
  assert.equal(once.preferences.autoBattle, false);
  assert.equal(once.currency.G, 4);
  assert.deepEqual(once.inventory, v1.profile.inventory);
  assert.deepEqual(once.house.installedFurniture, []);
  assert.equal(capacityFromProfile(once).installedSlots, 0);
  const library = buildLibrary(once, contentCatalog);
  assert.equal(library.mode, 'data');
  assert.equal(library.stacks.find((entry) => entry.catalogId === 'AVT_AEG_002').favorite, true);
  assert.equal(library.stacks.find((entry) => entry.catalogId === 'ACT_GEN_ATK_001').locked, true);
  assert.equal(library.stacks.find((entry) => entry.catalogId === 'ACT_GEN_ATK_001').count, 2);
});

test('version 2 bag save keeps furniture slots, deck reservations, pity, and G', () => {
  const once = deserialize(v2);
  const twice = deserialize(serialize(once));
  assert.deepEqual(twice, once);
  assert.equal(once.saveVersion, 2);
  assert.equal(once.preferences.autoBattle, true);
  assert.equal(once.currency.G, 7);
  assert.equal(once.pity.TEST_BANNER_AVATAR.epicCounter, 3);
  assert.equal(once.house.displayTier, 'bungalow');
  assert.equal(once.house.installedFurniture.length, 3);
  const capacity = capacityFromProfile(once);
  assert.equal(capacity.installedSlots, 50);
  assert.equal(capacity.total, 'PENDING');
  assert.equal(capacity.houseTierAddsSlots, false);
  const library = buildLibrary(once, contentCatalog);
  const avatar = library.stacks.find((entry) => entry.catalogId === 'AVT_AEG_002');
  const action = library.stacks.find((entry) => entry.catalogId === 'ACT_GEN_ATK_001');
  assert.equal(avatar.count, 2);
  assert.equal(avatar.locked, true);
  assert.equal(avatar.equippedCount, 1);
  assert.equal(avatar.copies[0].instanceId, copyInstanceId(v2.profile.inventory.avatars[0], 0));
  assert.equal(action.count, 4);
  assert.equal(action.favorite, true);
  assert.equal(action.equippedCount, 2);
  assert.equal(library.deck.length, 2);
  assert.equal(library.shelf.length, 2);
  assert.deepEqual(library.deck.map((entry) => entry.catalogId), ['ACT_GEN_ATK_001', 'ACT_GEN_ATK_001']);
});

test('legacy version 1 pow save still round-trips and stays visible in the bag', () => {
  const original = readFileSync(new URL('../../migrate/fixtures/legacy-pow-save-v1.json', import.meta.url), 'utf8');
  const once = deserialize(legacy);
  const twice = deserialize(serialize(once));
  assert.deepEqual(twice, once);
  assert.equal(once.saveVersion, 2);
  assert.equal(once.preferences.autoBattle, false);
  assert.equal(once.inventory.avatars[0].record.stats.pow, 5);
  assert.equal(once.inventory.avatars[0].record.stats.atk, 5);
  assert.equal(once.inventory.avatars[0].record.stats.legacy.pow, 5);
  assert.equal(readFileSync(new URL('../../migrate/fixtures/legacy-pow-save-v1.json', import.meta.url), 'utf8'), original);
  const library = buildLibrary(once, { avatars: [], actionCards: [] });
  assert.deepEqual(
    library.stacks.map((entry) => entry.catalogId),
    ['AVT_LEGACY_001', 'AVT_LEGACY_002'],
  );
});

test('a web starter round-trips through save version 2 and the bag still sees the deck', () => {
  const ui = createStarterProfile(contentCatalog);
  const once = deserialize(serialize(ui));
  const twice = deserialize(serialize(once));
  assert.deepEqual(twice.deck, once.deck);
  assert.deepEqual(twice.team, once.team);
  assert.equal(once.preferences.autoBattle, false);
  assert.equal(once.saveVersion, 2);
  assert.equal(once.inventory.actions.length, 0);
  const library = buildLibrary(once, contentCatalog);
  assert.equal(library.mode, 'web');
  assert.equal(library.deck.length, 30);
  assert.equal(library.deck.length, ui.deck.length);
  assert.equal(capacityFromProfile(once, null, library.copies.length).installedSlots, 0);
});
