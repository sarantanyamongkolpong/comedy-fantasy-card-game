import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createAssetLoader } from '../../src/assets/loader.js';
import { SAMPLE_AVATARS, SAMPLE_EQUIPMENT, SAMPLE_VARIANTS } from '../../src/avatars/catalog.js';
import { SAMPLE_OWNERSHIP } from '../../src/avatars/ownership.js';
import { createBattle } from '../../src/battle/battle.js';
import { SAMPLE_ACTION_CARDS, SAMPLE_AVATAR_CARDS } from '../../src/cards/catalog.js';
import {
  validateActionCard,
  validateAssetManifest,
  validateAvatar,
  validateAvatarCard,
  validateEquipment,
  validateFaction,
  validateOwnership,
  validateStats,
  validateVariant,
} from '../../src/schema/validate.js';
import {
  testOnlySide,
  testOnlySideDefeatedWhenAllKo,
  testOnlyTeamSpdSum,
} from '../helpers/stub-rules.js';

function loadJson(name) {
  return JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8'));
}

function loader() {
  const rigs = loadJson('rigs.snapshot.json');
  const items = loadJson('equipment-items.snapshot.json');
  const frameLayout = loadJson('frame_layout.snapshot.json');
  return createAssetLoader({
    manifest: loadJson('asset-manifest.snapshot.json'),
    dataFiles: { rigs: rigs.rigs, items: items.items, frameLayout },
  });
}

function has(errors, path) {
  return errors.some((error) => error.path === path || error.path.endsWith(path));
}

function battleRules() {
  return {
    teamSpd: testOnlyTeamSpdSum,
    isSideDefeated: testOnlySideDefeatedWhenAllKo,
  };
}

test('starter character and asset ids stay the shipped values', () => {
  assert.deepEqual(
    SAMPLE_AVATARS.map((avatar) => avatar.avatarId),
    ['AVT_AEG_001', 'AVT_PHA_001', 'AVT_CEL_001', 'AVT_SAN_001'],
  );
  assert.deepEqual(
    SAMPLE_AVATAR_CARDS.map((card) => card.cardId),
    ['AVC_AVT_AEG_001', 'AVC_AVT_PHA_001', 'AVC_AVT_CEL_001', 'AVC_AVT_SAN_001'],
  );
  assert.deepEqual(
    SAMPLE_ACTION_CARDS.map((card) => card.cardId),
    ['ACT_SCHEMA_ATK', 'ACT_SCHEMA_DEF', 'ACT_SCHEMA_SKILL'],
  );
  assert.deepEqual(
    SAMPLE_EQUIPMENT.map((item) => item.equipmentId),
    ['EQ_AEG_POT_HELMET_SILVER_001', 'EQ_AEG_POT_HELMET_GOLD_001', 'EQ_STAFF_NEUTRAL_001'],
  );
  assert.equal(SAMPLE_VARIANTS[0].assetId, 'EQ_AEG_POT_HELMET_GOLD_001');
  assert.equal(SAMPLE_OWNERSHIP.subjectId, 'AVT_AEG_001');
  for (const avatar of SAMPLE_AVATARS) assert.equal(Object.isFrozen(avatar), true);
});

test('invalid card ids and invalid card records fail validation', () => {
  assert.ok(has(validateActionCard(null), 'actionCard'));
  assert.ok(has(validateActionCard([]), 'actionCard'));
  const emptyId = { ...SAMPLE_ACTION_CARDS[0], cardId: '' };
  assert.ok(has(validateActionCard(emptyId), 'cardId'));
  const missingId = { ...SAMPLE_ACTION_CARDS[0] };
  delete missingId.cardId;
  assert.ok(has(validateActionCard(missingId), 'cardId'));
  assert.ok(has(validateActionCard({ ...SAMPLE_ACTION_CARDS[0], cardKind: 'spell' }), 'cardKind'));
  assert.ok(has(validateActionCard({ ...SAMPLE_ACTION_CARDS[0], name: 4 }), 'name'));
  assert.ok(has(validateActionCard({ ...SAMPLE_ACTION_CARDS[0], apCost: -1, costStatus: 'SET' }), 'apCost'));
  assert.ok(has(validateActionCard({ ...SAMPLE_ACTION_CARDS[0], apCost: 1.5, costStatus: 'SET' }), 'apCost'));
  assert.ok(has(validateActionCard({ ...SAMPLE_ACTION_CARDS[0], apCost: null, costStatus: 'SET' }), 'costStatus'));
  assert.ok(has(validateActionCard({ ...SAMPLE_ACTION_CARDS[0], apCost: 2, costStatus: 'TBD' }), 'costStatus'));
  assert.ok(has(validateActionCard({ ...SAMPLE_ACTION_CARDS[0], effectId: '' }), 'effectId'));
  assert.ok(has(validateActionCard({ ...SAMPLE_ACTION_CARDS[0], rarity: '' }), 'rarity'));
  assert.ok(has(validateActionCard({ ...SAMPLE_ACTION_CARDS[0], rarity: 1 }), 'rarity'));
  assert.ok(has(validateActionCard({ ...SAMPLE_ACTION_CARDS[0], labels: 'ATK' }), 'labels'));
  assert.ok(has(validateActionCard({ ...SAMPLE_ACTION_CARDS[0], labels: [1] }), 'labels'));
  assert.ok(has(validateActionCard({ ...SAMPLE_ACTION_CARDS[0], invented: true }), 'invented'));

  assert.ok(has(validateAvatarCard(null), 'avatarCard'));
  assert.ok(has(validateAvatarCard({ ...SAMPLE_AVATAR_CARDS[0], cardKind: 'action_card' }), 'cardKind'));
  assert.ok(has(validateAvatarCard({ ...SAMPLE_AVATAR_CARDS[0], cardId: '' }), 'cardId'));
  assert.ok(has(validateAvatarCard({ ...SAMPLE_AVATAR_CARDS[0], avatarId: '' }), 'avatarId'));
  assert.ok(has(validateAvatarCard({ ...SAMPLE_AVATAR_CARDS[0], nameEn: '' }), 'nameEn'));
  assert.ok(has(validateAvatarCard({ ...SAMPLE_AVATAR_CARDS[0], nameTh: '' }), 'nameTh'));
  assert.ok(has(validateAvatarCard({ ...SAMPLE_AVATAR_CARDS[0], factionId: 'FAC_NOPE' }), 'factionId'));
  assert.ok(has(validateAvatarCard({ ...SAMPLE_AVATAR_CARDS[0], role: 'DPS' }), 'role'));
  assert.ok(has(validateAvatarCard({ ...SAMPLE_AVATAR_CARDS[0], assetId: '' }), 'assetId'));
  assert.ok(has(validateAvatarCard({ ...SAMPLE_AVATAR_CARDS[0], bonus: 1 }), 'bonus'));
});

test('missing character data is rejected and does not invent a stand-in', () => {
  assert.equal(SAMPLE_AVATARS.find((avatar) => avatar.avatarId === 'AVT_MISSING'), undefined);
  assert.ok(validateAvatar(null).length > 0);
  assert.ok(validateAvatar([]).length > 0);
  assert.ok(has(validateAvatar({}), 'avatarId'));
  const broken = structuredClone(SAMPLE_AVATARS[0]);
  broken.avatarId = 'avt_aeg_001';
  assert.ok(has(validateAvatar(broken), 'avatarId'));
  broken.avatarId = 'AVT_AEG_001';
  broken.nameEn = '';
  assert.ok(has(validateAvatar(broken), 'nameEn'));
  broken.nameEn = SAMPLE_AVATARS[0].nameEn;
  broken.nameTh = '';
  assert.ok(has(validateAvatar(broken), 'nameTh'));
  broken.nameTh = SAMPLE_AVATARS[0].nameTh;
  broken.factionId = 'FAC_NOPE';
  assert.ok(has(validateAvatar(broken), 'factionId'));
  broken.factionId = 'FAC_AEG';
  broken.role = 'DPS';
  assert.ok(has(validateAvatar(broken), 'role'));
  broken.role = 'Tank';
  broken.rarity = '';
  assert.ok(has(validateAvatar(broken), 'rarity'));
  broken.rarity = null;
  broken.rigId = '';
  assert.ok(has(validateAvatar(broken), 'rigId'));
  broken.rigId = 'humanoid_heavy';
  broken.assetIds = null;
  assert.ok(has(validateAvatar(broken), 'assetIds'));
  broken.assetIds = { cardArt: '' };
  assert.ok(has(validateAvatar(broken), 'assetIds.cardArt'));
  broken.assetIds = SAMPLE_AVATARS[0].assetIds;
  broken.extra = true;
  assert.ok(has(validateAvatar(broken), 'extra'));

  assert.ok(has(validateStats(null, 'avatar.stats'), 'avatar.stats'));
  assert.ok(has(validateStats([], 'avatar.stats'), 'avatar.stats'));
  assert.ok(has(validateStats({ pow: -1, def: 0, spd: 0, valueStatus: 'SET' }, 'avatar.stats'), 'pow'));
  assert.ok(has(validateStats({ pow: 1.5, def: 0, spd: 0, valueStatus: 'SET' }, 'avatar.stats'), 'pow'));
  assert.ok(has(validateStats({ pow: '1', def: 0, spd: 0, valueStatus: 'SET' }, 'avatar.stats'), 'pow'));
  assert.ok(has(validateStats({ pow: 1, def: 1, spd: 1, valueStatus: 'MAYBE' }, 'avatar.stats'), 'valueStatus'));
  assert.ok(has(validateStats({ pow: 1, def: null, spd: null, valueStatus: 'TBD' }, 'avatar.stats'), 'avatar.stats'));
  assert.ok(has(validateStats({ pow: 1, def: null, spd: 1, valueStatus: 'SET' }, 'avatar.stats'), 'avatar.stats'));
  assert.ok(has(validateStats({ pow: 1, def: 1, spd: 1, hp: 10, valueStatus: 'SET' }, 'avatar.stats'), 'hp'));

  const sideB = testOnlySide('B', [0, 0, 0, 0]);
  const missingStats = testOnlySide('A', [1, 0, 0, 0]);
  missingStats.members[0].stats = undefined;
  assert.throws(
    () => createBattle({ sideA: missingStats, sideB, rules: battleRules() }),
    (error) => error.reason === 'INVALID_STATS',
  );
  const negative = testOnlySide('A', [1, 0, 0, 0]);
  negative.members[0].stats = { pow: 1, def: 1, spd: -5, valueStatus: 'SET' };
  assert.throws(
    () => createBattle({ sideA: negative, sideB, rules: battleRules() }),
    (error) => {
      assert.equal(error.reason, 'INVALID_STATS');
      assert.ok(error.errors.some((issue) => issue.path.endsWith('spd')));
      return true;
    },
  );
  const withHp = testOnlySide('A', [1, 0, 0, 0]);
  withHp.members[0].stats = { pow: 1, def: 1, spd: 1, hp: 10, valueStatus: 'SET' };
  assert.throws(
    () => createBattle({ sideA: withHp, sideB, rules: battleRules() }),
    (error) => error.reason === 'INVALID_STATS',
  );
  const nameless = testOnlySide('A', [1, 0, 0, 0]);
  nameless.members[0].avatarId = '';
  assert.throws(
    () => createBattle({ sideA: nameless, sideB, rules: battleRules() }),
    TypeError,
  );
  const before = structuredClone(sideB);
  assert.deepEqual(sideB, before);

  const assets = loader();
  const missing = assets.placement('AVT_MISSING', 'EQ_SWORD_BASIC_001');
  assert.equal(missing.ok, false);
  assert.equal(missing.reason, 'MISSING_RIG');
  assert.equal(missing.avatarId, 'AVT_MISSING');
  const known = assets.placement('AVT_AEG_001', 'EQ_AEG_POT_HELMET_SILVER_001');
  assert.equal(known.ok, true);
  assert.equal(known.avatarId, 'AVT_AEG_001');
});

test('missing equipment data is rejected', () => {
  assert.equal(SAMPLE_EQUIPMENT.find((item) => item.equipmentId === 'EQ_MISSING'), undefined);
  assert.ok(validateEquipment(null).length > 0);
  assert.ok(validateEquipment([]).length > 0);
  assert.ok(has(validateEquipment({}), 'equipmentId'));
  const broken = structuredClone(SAMPLE_EQUIPMENT[0]);
  broken.equipmentId = '';
  assert.ok(has(validateEquipment(broken), 'equipmentId'));
  broken.equipmentId = SAMPLE_EQUIPMENT[0].equipmentId;
  broken.slot = '';
  assert.ok(has(validateEquipment(broken), 'slot'));
  broken.slot = 'headgear';
  broken.nativeAvatarId = 12;
  assert.ok(has(validateEquipment(broken), 'nativeAvatarId'));
  broken.nativeAvatarId = 'AVT_AEG_001';
  broken.assetId = '';
  assert.ok(has(validateEquipment(broken), 'assetId'));
  broken.assetId = SAMPLE_EQUIPMENT[0].assetId;
  broken.variantOf = '';
  assert.ok(has(validateEquipment(broken), 'variantOf'));
  broken.variantOf = null;
  broken.statModifiers = null;
  assert.ok(has(validateEquipment(broken), 'statModifiers'));
  broken.statModifiers = SAMPLE_EQUIPMENT[0].statModifiers;
  broken.upgrade = { pow: 1 };
  assert.ok(has(validateEquipment(broken), 'upgrade'));
  broken.upgrade = null;
  broken.upgradeStatus = 'READY';
  assert.ok(has(validateEquipment(broken), 'upgradeStatus'));
  broken.upgradeStatus = 'BLOCKED_BY_DESIGN';
  broken.bonus = true;
  assert.ok(has(validateEquipment(broken), 'bonus'));
  assert.deepEqual(validateEquipment(SAMPLE_EQUIPMENT[0]), []);

  const assets = loader();
  const missing = assets.placement('AVT_AEG_001', 'EQ_MISSING');
  assert.equal(missing.ok, false);
  assert.equal(missing.reason, 'MISSING_EQUIPMENT_DATA');
  assert.equal(missing.equipmentId, 'EQ_MISSING');
  const both = assets.placement('AVT_MISSING', 'EQ_ALSO_MISSING');
  assert.equal(both.reason, 'MISSING_EQUIPMENT_DATA');
  const unresolved = assets.resolve('EQ_MISSING');
  assert.equal(unresolved.reason, 'MISSING_ID');
  assert.equal(unresolved.found, false);
  assert.ok(assets.ids().includes('EQ_AEG_POT_HELMET_SILVER_001'));
  assert.throws(() => createAssetLoader(), /manifest\.assets array is required/);
  assert.throws(() => createAssetLoader({ manifest: {} }), /manifest\.assets array is required/);

  const character = {
    anchors: { head: [10, 20] },
    fit: { EQ_BAD_FIT: [1] },
  };
  const incomplete = createAssetLoader({
    manifest: { assets: [{ asset_id: 'EQ_PARTIAL', path: 'x', type: 't', owner: 'o', status: 'CONCEPT' }] },
    dataFiles: {
      rigs: [{ characters: { AVT_PARTIAL: character, AVT_NO_ANCHORS: {} } }],
      items: {
        EQ_NO_SLOT: { pivot: [1, 1] },
        EQ_BLANK_SLOT: { slot: ' | ', pivot: [1, 1] },
        EQ_NO_PIVOT: { slot: 'headgear' },
        EQ_SHORT_PIVOT: { slot: 'headgear', pivot: [1] },
        EQ_BAD_FIT: { slot: 'headgear', pivot: [0, 0] },
        EQ_CAPE: { slot: 'cape', pivot: [0, 0] },
        EQ_SHORT_ANCHOR: { slot: 'headgear', pivot: [0, 0] },
      },
    },
  });
  assert.equal(incomplete.placement('AVT_NO_ANCHORS', 'EQ_NO_PIVOT').reason, 'MISSING_ANCHORS');
  assert.equal(incomplete.placement('AVT_PARTIAL', 'EQ_NO_SLOT').reason, 'MISSING_SLOT');
  assert.equal(incomplete.placement('AVT_PARTIAL', 'EQ_BLANK_SLOT').reason, 'MISSING_SLOT');
  assert.equal(incomplete.placement('AVT_PARTIAL', 'EQ_NO_PIVOT').reason, 'MISSING_PIVOT');
  assert.equal(incomplete.placement('AVT_PARTIAL', 'EQ_SHORT_PIVOT').reason, 'MISSING_PIVOT');
  assert.equal(incomplete.placement('AVT_PARTIAL', 'EQ_BAD_FIT').reason, 'INVALID_FIT');
  assert.equal(incomplete.placement('AVT_PARTIAL', 'EQ_CAPE').reason, 'NO_ANCHOR_MAPPING');
  character.anchors = { head: [10] };
  assert.equal(incomplete.placement('AVT_PARTIAL', 'EQ_SHORT_ANCHOR').reason, 'MISSING_ANCHOR');
});

test('invalid factions are rejected and the four names stay fixed', () => {
  assert.ok(has(validateFaction(null), 'faction'));
  assert.ok(has(validateFaction([]), 'faction'));
  assert.ok(has(validateFaction({ factionId: 'FAC_NOPE', name: 'Nope', role: 'Tank' }), 'factionId'));
  assert.ok(has(validateFaction({ factionId: '', name: 'Aegis Dominion', role: 'Tank' }), 'factionId'));
  assert.ok(has(validateFaction({ factionId: 'FAC_AEG', name: 'Aegis', role: 'Tank' }), 'name'));
  assert.ok(has(validateFaction({ factionId: 'FAC_AEG', name: 'Aegis Dominion', role: 'DPS' }), 'role'));
  assert.ok(has(validateFaction({ factionId: 'FAC_PHA', name: 'Phantom Blades', role: 'Tank' }), 'role'));
  assert.ok(has(validateFaction({
    factionId: 'FAC_CEL',
    name: 'Celestial Nexus',
    role: 'Magic',
    motto: 'extra',
  }), 'motto'));
  const swapped = structuredClone(SAMPLE_AVATARS[1]);
  swapped.factionId = 'FAC_SAN';
  assert.ok(has(validateAvatar(swapped), 'role'));
  swapped.role = 'Support';
  swapped.factionId = 'FAC_SAN';
  assert.deepEqual(validateAvatar(swapped), []);
  assert.deepEqual(validateFaction({ factionId: 'FAC_SAN', name: 'Sanctuary Order', role: 'Support' }), []);
});

test('asset manifest and ownership rejects stay structural', () => {
  assert.ok(has(validateOwnership(null), 'ownership'));
  assert.ok(has(validateOwnership({ ...SAMPLE_OWNERSHIP, ownershipId: '' }), 'ownershipId'));
  assert.ok(has(validateOwnership({ ...SAMPLE_OWNERSHIP, ownerId: '' }), 'ownerId'));
  assert.ok(has(validateOwnership({ ...SAMPLE_OWNERSHIP, subjectKind: 'potion' }), 'subjectKind'));
  assert.ok(has(validateOwnership({ ...SAMPLE_OWNERSHIP, subjectId: '' }), 'subjectId'));
  assert.ok(has(validateOwnership({ ...SAMPLE_OWNERSHIP, quantity: 0 }), 'quantity'));
  assert.ok(has(validateOwnership({ ...SAMPLE_OWNERSHIP, quantity: 1.5 }), 'quantity'));
  assert.ok(has(validateOwnership({ ...SAMPLE_OWNERSHIP, source: 'gacha' }), 'source'));
  assert.ok(has(validateOwnership({ ...SAMPLE_OWNERSHIP, sourceStatus: 'SET' }), 'sourceStatus'));
  assert.ok(has(validateOwnership({ ...SAMPLE_OWNERSHIP, note: 'extra' }), 'note'));

  assert.ok(has(validateVariant(null), 'variant'));
  assert.ok(has(validateVariant({ ...SAMPLE_VARIANTS[0], variantId: '' }), 'variantId'));
  assert.ok(has(validateVariant({ ...SAMPLE_VARIANTS[0], baseId: '' }), 'baseId'));
  assert.ok(has(validateVariant({ ...SAMPLE_VARIANTS[0], subjectKind: 'avatar' }), 'subjectKind'));
  assert.ok(has(validateVariant({ ...SAMPLE_VARIANTS[0], label: '' }), 'label'));
  assert.ok(has(validateVariant({ ...SAMPLE_VARIANTS[0], assetId: '' }), 'assetId'));
  assert.ok(has(validateVariant({ ...SAMPLE_VARIANTS[0], status: 'SHIPPED' }), 'status'));
  assert.ok(has(validateVariant({ ...SAMPLE_VARIANTS[0], note: 'extra' }), 'note'));

  assert.ok(has(validateAssetManifest(null), 'manifest'));
  assert.ok(has(validateAssetManifest({}), 'assets'));
  assert.ok(validateAssetManifest({ assets: [null] }).some((error) => error.message.includes('object')));
  assert.ok(has(validateAssetManifest({
    assets: [{ path: 'a', type: 't', owner: 'o', status: 'CONCEPT' }],
  }), 'asset_id'));
  const duplicate = {
    assets: [
      { asset_id: 'A', path: 'a', type: 't', owner: 'o', status: 'CONCEPT' },
      { asset_id: 'A', path: 'b', type: 't', owner: 'o', status: 'WIP' },
    ],
  };
  const errors = validateAssetManifest(duplicate);
  assert.ok(errors.some((error) => error.message.includes('duplicate')));
  assert.ok(errors.some((error) => error.path.endsWith('status')));
});
