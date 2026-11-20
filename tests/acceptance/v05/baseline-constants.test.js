import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BASE_AP,
  CARD_ACTION_TYPES,
  FACTION_RECORDS,
  HAND_SIZE,
  PARTY_SIZE,
} from '../../../src/schema/constants.js';

test('CORE-003 PARTY_SIZE is 4', () => {
  assert.equal(PARTY_SIZE, 4);
});

test('CORE-007 BASE_AP is 5', () => {
  assert.equal(BASE_AP, 5);
});

test('CORE-010 HAND_SIZE is 5', () => {
  assert.equal(HAND_SIZE, 5);
});

test('CORE-020 action categories are ATK, DEF, and Skill', () => {
  assert.deepEqual([...CARD_ACTION_TYPES], ['ATK', 'DEF', 'Skill']);
});

test('QA-04 faction map is Aegis Dominion, Phantom Blades, Celestial Nexus, and Sanctuary Order', () => {
  assert.deepEqual(FACTION_RECORDS.map((record) => ({ ...record })), [
    { factionId: 'FAC_AEG', name: 'Aegis Dominion', role: 'Tank' },
    { factionId: 'FAC_PHA', name: 'Phantom Blades', role: 'DPS' },
    { factionId: 'FAC_CEL', name: 'Celestial Nexus', role: 'Magic' },
    { factionId: 'FAC_SAN', name: 'Sanctuary Order', role: 'Support' },
  ]);
});

test('CORE-033 CORE-034 CORE-035 superseded rarity, 7 MP, and auto-battler are not the live constants', () => {
  assert.equal(BASE_AP, 5);
  assert.notEqual(BASE_AP, 7);
  assert.equal(HAND_SIZE, 5);
  const names = new Set(FACTION_RECORDS.map((record) => record.name));
  for (const retired of ['Common', 'Rare', 'Legendary', 'Mythic', 'Valhalla']) {
    assert.equal(names.has(retired), false);
  }
  assert.equal(CARD_ACTION_TYPES.includes('Tactic'), false);
});
