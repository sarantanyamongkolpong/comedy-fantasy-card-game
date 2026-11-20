import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { SAMPLE_AVATARS, SAMPLE_EQUIPMENT } from '../../src/avatars/catalog.js';
import { SAMPLE_ACTION_CARDS, SAMPLE_AVATAR_CARDS } from '../../src/cards/catalog.js';
import { loadCatalog } from '../../tools/authoring/catalog.js';
import { defaultExamplesDir, defaultTemplatesDir } from '../../tools/authoring/paths.js';
import { loadTemplates, materializeCatalog } from '../../tools/authoring/templates.js';

const templates = loadTemplates(defaultTemplatesDir);
const catalog = loadCatalog(join(defaultExamplesDir, 'starter-catalog.json'));
const materialized = materializeCatalog(catalog, templates);

test('starter avatars, avatar cards, and schema action cards match the systems samples', () => {
  assert.equal(materialized.avatars.length, 4);
  materialized.avatars.forEach((avatar, index) => assert.deepEqual(avatar, SAMPLE_AVATARS[index]));
  materialized.avatarCards.forEach((card, index) => assert.deepEqual(card, SAMPLE_AVATAR_CARDS[index]));
  materialized.actionCards.forEach((card, index) => assert.deepEqual(card, SAMPLE_ACTION_CARDS[index]));
});

test('equipment examples keep the systems samples and the art-manifest ids', () => {
  assert.equal(materialized.equipment.length, 17);
  for (const sample of SAMPLE_EQUIPMENT) {
    const found = materialized.equipment.find((item) => item.equipmentId === sample.equipmentId);
    assert.deepEqual(found, sample);
  }
  const gold = materialized.equipment.find((item) => item.equipmentId === 'EQ_AEG_POT_HELMET_GOLD_001');
  assert.equal(gold.variantOf, 'EQ_AEG_POT_HELMET_SILVER_001');
  const dagger = materialized.equipment.find((item) => item.equipmentId === 'EQ_DAGGER_BASIC_001');
  assert.equal(dagger.slot, 'main_hand|off_hand');
  assert.equal(dagger.nativeAvatarId, null);
  const ids = materialized.equipment.map((item) => item.equipmentId);
  for (const id of [
    'EQ_AEG_SWORD_POTLID_001',
    'EQ_AEG_SHIELD_POTLID_001',
    'EQ_PHA_KUNAI_MAIN_001',
    'EQ_PHA_KUNAI_OFF_001',
    'EQ_CEL_HAT_ASTRO_001',
    'EQ_CEL_STAFF_PLANET_001',
    'EQ_CEL_NOODLE_CUP_001',
    'EQ_SAN_CAP_HEALER_001',
    'EQ_SAN_STAFF_BANDAGE_001',
    'EQ_SAN_CLIPBOARD_001',
    'EQ_SHIELD_BUCKLER_001',
  ]) {
    assert.ok(ids.includes(id), id);
  }
});

test('example records keep null and TBD and do not invent stats, rarity, AP, or drop rates', () => {
  const files = [
    ...readdirSync(defaultTemplatesDir).map((name) => join(defaultTemplatesDir, name)),
    join(defaultExamplesDir, 'starter-catalog.json'),
  ];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    assert.equal(text.includes('dropRate'), false, file);
    assert.doesNotMatch(text, /"(pow|def|spd|apCost|rarity)"\s*:\s*-?\d/, file);
  }
  for (const avatar of materialized.avatars) {
    assert.equal(avatar.rarity, null);
    assert.deepEqual(avatar.stats, { pow: null, def: null, spd: null, valueStatus: 'TBD' });
  }
  for (const card of materialized.actionCards) {
    assert.equal(card.apCost, null);
    assert.equal(card.costStatus, 'TBD');
    assert.equal(card.effectId, null);
    assert.equal(card.rarity, null);
    assert.equal(card.name, null);
  }
  for (const item of materialized.equipment) {
    assert.equal(item.upgrade, null);
    assert.equal(item.upgradeStatus, 'BLOCKED_BY_DESIGN');
    assert.deepEqual(item.statModifiers, { pow: null, def: null, spd: null, valueStatus: 'TBD' });
    assert.equal(item.assetId, item.equipmentId);
  }
});
