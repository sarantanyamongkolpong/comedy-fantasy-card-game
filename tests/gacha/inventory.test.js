import assert from 'node:assert/strict';
import test from 'node:test';
import { V05_STARTER_ACTIONS, DEMO_MIXED_DECK } from '../../src/cards/catalog.js';
import {
  bindDeck,
  consumeDuplicate,
  createProfile,
  grantItem,
  setFavorite,
  setLocked,
} from '../../src/save/inventory.js';

function ownedDeckProfile() {
  let profile = createProfile();
  const counts = new Map();
  for (const id of DEMO_MIXED_DECK.cardIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const [catalogId, quantity] of counts) {
    profile = grantItem(profile, { kind: 'action', catalogId, quantity });
  }
  return profile;
}

test('gacha grants stack and do not remove what the player already owns', () => {
  const start = grantItem(createProfile(), { kind: 'avatar', catalogId: 'AVT_AEG_001', quantity: 1 });
  const next = grantItem(start, { kind: 'avatar', catalogId: 'AVT_AEG_002', quantity: 2 });
  assert.equal(start.inventory.avatars.length, 1);
  assert.equal(next.inventory.avatars.length, 2);
  assert.equal(next.inventory.avatars.find((row) => row.catalogId === 'AVT_AEG_002').quantity, 2);
  const again = grantItem(next, { kind: 'avatar', catalogId: 'AVT_AEG_002', quantity: 1 });
  assert.equal(again.inventory.avatars.find((row) => row.catalogId === 'AVT_AEG_002').quantity, 3);
  assert.equal(next.inventory.avatars.find((row) => row.catalogId === 'AVT_AEG_002').quantity, 2);
});

test('locked, favorite, and in-deck copies cannot be consumed', () => {
  const cardsById = new Map(V05_STARTER_ACTIONS.map((card) => [card.cardId, card]));
  let profile = ownedDeckProfile();
  profile = grantItem(profile, { kind: 'action', catalogId: 'ACT_GEN_ATK_001', quantity: 1 });
  profile = bindDeck(profile, DEMO_MIXED_DECK, { cardsById, teamFactions: ['FAC_AEG', 'FAC_PHA', 'FAC_CEL', 'FAC_SAN'] });
  const jab = () => profile.inventory.actions.find((row) => row.catalogId === 'ACT_GEN_ATK_001');
  const before = jab().quantity;
  profile = consumeDuplicate(profile, { kind: 'action', catalogId: 'ACT_GEN_ATK_001', quantity: 1 });
  assert.equal(jab().quantity, before - 1);
  assert.throws(
    () => consumeDuplicate(profile, { kind: 'action', catalogId: 'ACT_GEN_ATK_001', quantity: 1 }),
    (error) => error.code === 'PROTECTED' && error.reason === 'in-deck',
  );

  profile = setLocked(profile, 'action', 'ACT_GEN_ATK_002', true);
  assert.throws(
    () => consumeDuplicate(profile, { kind: 'action', catalogId: 'ACT_GEN_ATK_002', quantity: 1 }),
    (error) => error.reason === 'locked',
  );
  profile = setLocked(profile, 'action', 'ACT_FAC_SAN_002', false);
  profile = setFavorite(profile, 'action', 'ACT_FAC_SAN_002', true);
  assert.throws(
    () => consumeDuplicate(profile, { kind: 'action', catalogId: 'ACT_FAC_SAN_002', quantity: 1 }),
    (error) => error.reason === 'favorite',
  );
});
