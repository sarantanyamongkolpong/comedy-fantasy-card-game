import assert from 'node:assert/strict';
import test from 'node:test';
import { acquireTier, installFurniture, PHASE3_FURNITURE_ART } from '../../../src/schema/hideout.js';
import { contentCatalog } from '../../../web/js/content-catalog.js';
import { createStarterProfile } from '../../../web/js/profile.js';
import {
  buildLibrary,
  capacityFromProfile,
  compareEntries,
  copyInstanceId,
  deckToggleTarget,
  effectiveKind,
  presentCollection,
  rarityRank,
  selectEntries,
} from '../../../web/js/collection/model.js';

const catalog = {
  avatars: [
    { avatarId: 'AVT_A', name: 'Alpha', rarity: 'Epic', factionId: 'FAC_AEG', role: 'Tank', stats: { atk: 1, def: 2, spd: 3 } },
    { avatarId: 'AVT_B', name: 'Beta', rarity: 'EX', factionId: 'FAC_PHA', role: 'DPS', stats: { atk: 4, def: 1, spd: 2 } },
  ],
  actionCards: [
    { cardId: 'ACT_N', name: 'Placeholder Jab', rarity: 'N', type: 'ATK', costAp: 1 },
    { cardId: 'ACT_R', name: 'Smash', rarity: 'R', type: 'ATK', costAp: 2 },
    { cardId: 'ACT_FAC', name: 'Oath', rarity: 'FAC', type: 'Skill', costAp: 2, factionRequirement: 'FAC_AEG' },
    { cardId: 'ACT_E', name: 'Epic Swing', rarity: 'Epic', type: 'ATK', costAp: 3 },
  ],
  factionName: (id) => ({ FAC_AEG: 'Aegis Dominion', FAC_PHA: 'Phantom Blades' }[id] ?? id),
};

function profile() {
  return {
    avatars: [
      { instanceId: 'a1', avatarId: 'AVT_A', locked: false, favorite: true },
      { instanceId: 'a2', avatarId: 'AVT_A', locked: true, favorite: false },
    ],
    actions: [
      { instanceId: 'c1', cardId: 'ACT_N', locked: false, favorite: false },
      { instanceId: 'c2', cardId: 'ACT_FAC', locked: false, favorite: false },
    ],
    tokens: [{ instanceId: 't1', name: 'Test Token', rarity: 'N', pool: 'TEST', note: 'cough' }],
    team: ['a1'],
    deck: ['c2'],
    house: { tierId: 'cabin', installedFurniture: [] },
  };
}

test('rarity order is N, R, Epic, FAC, then EX', () => {
  assert.ok(rarityRank('N') < rarityRank('R'));
  assert.ok(rarityRank('R') < rarityRank('Epic'));
  assert.ok(rarityRank('Epic') < rarityRank('FAC'));
  assert.ok(rarityRank('FAC') < rarityRank('EX'));
  const rows = [
    { name: 'n', rarity: 'N', count: 1, type: 'ATK', catalogId: 'n' },
    { name: 'ex', rarity: 'EX', count: 1, type: 'ATK', catalogId: 'ex' },
    { name: 'fac', rarity: 'FAC', count: 1, type: 'Skill', catalogId: 'fac' },
  ];
  rows.sort((left, right) => compareEntries(left, right, 'rarity'));
  assert.deepEqual(rows.map((row) => row.rarity), ['EX', 'FAC', 'N']);
});

test('stash, inventory, and collection filter by kind, rarity, search, and equipped state', () => {
  const library = buildLibrary(profile(), catalog);
  const alpha = library.stacks.find((entry) => entry.catalogId === 'AVT_A');
  assert.equal(alpha.count, 2);
  assert.equal(alpha.equippedCount, 1);
  assert.equal(alpha.locked, true);
  assert.equal(alpha.favorite, true);
  assert.equal(library.stacks.find((entry) => entry.catalogId === 'ACT_FAC').equipped, true);
  assert.equal(library.codex.find((entry) => entry.catalogId === 'AVT_B').owned, false);
  assert.equal(facingOwned(library, 'ACT_N'), true);

  const fac = selectEntries(library.codex, { kind: 'action', rarity: 'FAC' });
  assert.deepEqual(fac.map((entry) => entry.catalogId), ['ACT_FAC']);
  const found = selectEntries(library.codex, { query: 'beta' });
  assert.deepEqual(found.map((entry) => entry.catalogId), ['AVT_B']);
  const equipped = selectEntries(library.stacks, { state: 'equipped' });
  assert.ok(equipped.some((entry) => entry.catalogId === 'AVT_A'));
  assert.ok(equipped.some((entry) => entry.catalogId === 'ACT_FAC'));
  assert.equal(equipped.some((entry) => entry.catalogId === 'ACT_N'), false);

  const view = presentCollection('inventory', profile(), catalog, { kind: 'avatar', sort: 'name' });
  assert.equal(view.pageItems.length, 2);
  assert.equal(view.pageItems[0].equipped || view.pageItems[1].equipped, true);
  assert.equal(view.capacity.total, 'PENDING');
  assert.equal(view.capacity.cabinBase, 'PENDING');
  assert.match(view.capacity.line, /Furniture slots: 0/);
  assert.match(view.capacity.line, /Total capacity: PENDING/);
  assert.match(view.capacity.line, /Copies held: 5/);
  assert.equal(effectiveKind('deck', 'avatar'), 'action');
  assert.equal(effectiveKind('collection', 'token'), 'all');
});

test('deck builder keeps saved order and toggles a free or seated copy', () => {
  const library = buildLibrary(profile(), catalog);
  assert.deepEqual(library.deck.map((entry) => entry.instanceId), ['c2']);
  assert.deepEqual(library.shelf.map((entry) => entry.instanceId), ['c1']);
  const view = presentCollection('deck', profile(), catalog, { query: 'oath' });
  assert.equal(view.deckCount, 1);
  assert.equal(view.deckRequired, 30);
  assert.equal(view.deckShown, 1);
  assert.equal(view.shelfShown, 0);
  const stack = library.stacks.find((entry) => entry.catalogId === 'ACT_N');
  assert.equal(deckToggleTarget(stack).mode, 'add');
  assert.equal(deckToggleTarget(stack).instanceId, 'c1');
  const seated = library.stacks.find((entry) => entry.catalogId === 'ACT_FAC');
  assert.equal(deckToggleTarget(seated).mode, 'remove');
});

test('capacity counts installed furniture only', () => {
  const ui = createStarterProfile(contentCatalog);
  assert.equal(capacityFromProfile(ui, null, 1).installedSlots, 0);
  let house = { acquiredTiers: ['cabin'], displayTier: 'cabin', installedFurniture: [] };
  house = acquireTier(house, 'penthouse');
  assert.equal(capacityFromProfile({ ...ui, house }, null, 1).installedSlots, 0);
  house = installFurniture(house, {
    furnitureId: 'FUR_REF_PENTHOUSE_LARGE_TALL_CABINET',
    name: 'Large Tall Cabinet',
    capacity: 150,
  });
  assert.equal(capacityFromProfile({ ...ui, house }, null, 1).installedSlots, 150);
  house = installFurniture(house, PHASE3_FURNITURE_ART[0]);
  const capped = capacityFromProfile({ ...ui, house }, null, 3);
  assert.equal(capped.installedSlots, 150);
  assert.equal(capped.houseTierAddsSlots, false);
  assert.equal(capped.total, 'PENDING');
  assert.match(capped.line, /HOME-11/);
  assert.doesNotMatch(capped.line, /Total capacity: \d/);
});

test('starter collection reads the web profile and the real catalog', () => {
  const ui = createStarterProfile(contentCatalog);
  const library = buildLibrary(ui, contentCatalog);
  assert.equal(library.mode, 'web');
  assert.equal(library.deck.length, 30);
  assert.equal(library.shelf.length, 0);
  const fac = selectEntries(library.codex, { rarity: 'FAC', kind: 'action' });
  assert.equal(fac.length, contentCatalog.actionCards.filter((card) => card.rarity === 'FAC').length);
  assert.ok(fac.every((entry) => entry.owned));
  const view = presentCollection('stash', ui, contentCatalog, {});
  assert.equal(view.pageSize, 24);
  view.selected = library.stacks[0];
  const open = presentCollection('stash', ui, contentCatalog, { selectedKey: library.stacks[0].key });
  assert.equal(open.detailOpen, true);
  assert.equal(open.pageSize, 18);
  assert.equal(copyInstanceId({ instanceId: 'STACK_avatar_AVT_AEG_002' }, 0), 'STACK_avatar_AVT_AEG_002#1');
});

function facingOwned(library, catalogId) {
  return library.stacks.some((entry) => entry.catalogId === catalogId && entry.owned);
}
