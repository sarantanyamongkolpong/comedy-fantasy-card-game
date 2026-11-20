import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { FACTIONS, SAMPLE_AVATARS, SAMPLE_EQUIPMENT, SAMPLE_VARIANTS } from '../src/avatars/catalog.js';
import { SAMPLE_OWNERSHIP, createOwnership } from '../src/avatars/ownership.js';
import { SAMPLE_ACTION_CARDS, SAMPLE_AVATAR_CARDS } from '../src/cards/catalog.js';
import {
  validateActionCard,
  validateAssetManifest,
  validateAvatar,
  validateAvatarCard,
  validateEquipment,
  validateFaction,
  validateOwnership,
  validateVariant,
} from '../src/schema/validate.js';
import { validateSkillSlots } from '../src/schema/validate-v05.js';

const STARTERS = [
  ['AVT_AEG_001', 'Sir Potlid', 'เซอร์ฝาหม้อ', 'FAC_AEG', 'Aegis Dominion', 'Tank', 'humanoid_heavy'],
  ['AVT_PHA_001', 'Nox Squeak', 'น็อกซ์ รองเท้าดัง', 'FAC_PHA', 'Phantom Blades', 'DPS', 'humanoid_standard'],
  ['AVT_CEL_001', 'Madame Meteor', 'มาดามดาวตก', 'FAC_CEL', 'Celestial Nexus', 'Magic', 'humanoid_standard'],
  ['AVT_SAN_001', 'Sister Plaster', 'ซิสเตอร์พลาสเตอร์', 'FAC_SAN', 'Sanctuary Order', 'Support', 'humanoid_standard'],
];

test('factions keep the specified names and roles', () => {
  assert.deepEqual(
    FACTIONS.map((faction) => [faction.factionId, faction.name, faction.role]),
    [
      ['FAC_AEG', 'Aegis Dominion', 'Tank'],
      ['FAC_PHA', 'Phantom Blades', 'DPS'],
      ['FAC_CEL', 'Celestial Nexus', 'Magic'],
      ['FAC_SAN', 'Sanctuary Order', 'Support'],
    ],
  );
  for (const faction of FACTIONS) assert.deepEqual(validateFaction(faction), []);
  const renamed = { ...FACTIONS[0], name: 'Aegis' };
  assert.ok(validateFaction(renamed).some((error) => error.path.endsWith('name')));
});

test('starter avatars, avatar cards, and action cards validate with empty stats and costs', () => {
  assert.equal(SAMPLE_AVATARS.length, 4);
  assert.equal(SAMPLE_AVATAR_CARDS.length, 4);
  assert.deepEqual(
    SAMPLE_ACTION_CARDS.map((card) => card.actionType),
    ['ATK', 'DEF', 'Skill'],
  );
  for (const [avatarId, nameEn, nameTh, factionId, , role, rigId] of STARTERS) {
    const avatar = SAMPLE_AVATARS.find((row) => row.avatarId === avatarId);
    assert.equal(avatar.nameEn, nameEn);
    assert.equal(avatar.nameTh, nameTh);
    assert.equal(avatar.factionId, factionId);
    assert.equal(avatar.role, role);
    assert.equal(avatar.rigId, rigId);
    assert.equal(avatar.rarity, null);
    assert.deepEqual(avatar.stats, { pow: null, def: null, spd: null, valueStatus: 'TBD' });
    assert.deepEqual(validateAvatar(avatar), []);
    const card = SAMPLE_AVATAR_CARDS.find((row) => row.avatarId === avatarId);
    assert.equal(card.rarity, null);
    assert.equal(card.assetId, avatar.assetIds.cardArt);
    assert.deepEqual(validateAvatarCard(card), []);
  }
  for (const card of SAMPLE_ACTION_CARDS) {
    assert.equal(card.apCost, null);
    assert.equal(card.costStatus, 'TBD');
    assert.equal(card.effectId, null);
    assert.equal(card.rarity, null);
    assert.equal(card.name, null);
    assert.deepEqual(validateActionCard(card), []);
  }
});

test('schema rejects invented TBD numbers, bad types, and upgrade payloads', () => {
  const avatar = structuredClone(SAMPLE_AVATARS[0]);
  avatar.stats = { pow: 10, def: null, spd: null, valueStatus: 'TBD' };
  assert.ok(validateAvatar(avatar).length > 0);

  const attack = { ...SAMPLE_ACTION_CARDS[0], actionType: 'ATTACK' };
  assert.ok(validateActionCard(attack).some((error) => error.path.endsWith('actionType')));

  const priced = { ...SAMPLE_ACTION_CARDS[0], apCost: 2, costStatus: 'TBD' };
  assert.ok(validateActionCard(priced).some((error) => error.path.endsWith('costStatus')));

  const equipment = structuredClone(SAMPLE_EQUIPMENT[0]);
  equipment.upgrade = { pow: 1 };
  assert.ok(validateEquipment(equipment).some((error) => error.path.endsWith('upgrade')));
});

test('equipment, variants, and ownership samples validate', () => {
  const ids = new Set(SAMPLE_EQUIPMENT.map((item) => item.equipmentId));
  for (const item of SAMPLE_EQUIPMENT) {
    assert.equal(item.upgrade, null);
    assert.equal(item.statModifiers.valueStatus, 'TBD');
    assert.deepEqual(validateEquipment(item), []);
    if (item.variantOf) assert.ok(ids.has(item.variantOf));
  }
  const gold = SAMPLE_EQUIPMENT.find((item) => item.equipmentId === 'EQ_AEG_POT_HELMET_GOLD_001');
  assert.equal(gold.variantOf, 'EQ_AEG_POT_HELMET_SILVER_001');
  for (const variant of SAMPLE_VARIANTS) assert.deepEqual(validateVariant(variant), []);
  assert.equal(SAMPLE_VARIANTS.find((row) => row.label === 'goldpot').status, 'CONCEPT');
  assert.deepEqual(validateOwnership(SAMPLE_OWNERSHIP), []);
  assert.equal(SAMPLE_OWNERSHIP.source, null);
  const stored = createOwnership(SAMPLE_OWNERSHIP);
  assert.equal(stored.subjectId, 'AVT_AEG_001');
  assert.throws(() => createOwnership({ ...SAMPLE_OWNERSHIP, source: 'gacha' }));
});

test('JSON Schema document parses and names the core records', () => {
  const schema = JSON.parse(readFileSync(new URL('../src/schema/game.schema.json', import.meta.url), 'utf8'));
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  for (const name of [
    'Stats',
    'Faction',
    'Avatar',
    'AvatarCard',
    'ActionCard',
    'Equipment',
    'Ownership',
    'Variant',
    'AssetManifestEntry',
    'AvatarV05',
    'ActionCardV05',
    'Deck',
    'GachaBanner',
    'PlayerProfile',
    'Furniture',
    'RuleConfig',
  ]) {
    assert.ok(schema.$defs[name], name);
  }
});

test('art manifest snapshot validates and reports duplicate ids', () => {
  const manifest = JSON.parse(
    readFileSync(new URL('./fixtures/asset-manifest.snapshot.json', import.meta.url), 'utf8'),
  );
  assert.equal(manifest._snapshot.source_commit, 'd65c89dc87a9554d5611a108146b509c7aa7fcf0');
  assert.equal(manifest.source_asset_count, 87);
  assert.ok(manifest.assets.length < 87);
  assert.deepEqual(validateAssetManifest(manifest), []);
  const duplicate = structuredClone(manifest);
  duplicate.assets.push({ ...duplicate.assets[0] });
  assert.ok(validateAssetManifest(duplicate).some((error) => error.message.includes('duplicate')));
});

test('avatar rarity skill slots follow CORE-026 through CORE-029', () => {
  const slots = (active, passive, ultimate) => ({ active, passive, ultimate });
  const present = { Name: 'sample' };
  const check = (rarity, skills) => {
    const errors = [];
    validateSkillSlots(rarity, skills, 'skills', errors);
    return errors;
  };
  assert.deepEqual(check('N', slots(null, null, null)), []);
  assert.deepEqual(check('N', slots(present, null, null)), []);
  assert.ok(check('N', slots(null, present, null)).some((error) => error.path.endsWith('passive')));
  assert.ok(check('R', slots(present, present, null)).length > 0);
  assert.ok(check('R', slots(null, null, null)).length > 0);
  assert.deepEqual(check('R', slots(present, null, null)), []);
  assert.deepEqual(check('Epic', slots(present, present, null)), []);
  assert.ok(check('Epic', slots(present, null, null)).some((error) => error.path.endsWith('passive')));
  assert.ok(check('EX', slots(present, present, null)).some((error) => error.path.endsWith('ultimate')));
  assert.deepEqual(check('EX', slots(present, present, present)), []);
  assert.deepEqual(check(null, undefined), []);
});
