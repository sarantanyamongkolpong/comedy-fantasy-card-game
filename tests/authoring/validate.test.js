import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { validateAssetManifest } from '../../src/schema/validate.js';
import { loadCatalog } from '../../tools/authoring/catalog.js';
import { OFFICIAL_FACTION_NAMES } from '../../tools/authoring/ids.js';
import { defaultExamplesDir, defaultManifestPath, defaultTemplatesDir, repoRoot } from '../../tools/authoring/paths.js';
import { formatJsonReport, formatTextReport } from '../../tools/authoring/report.js';
import { loadTemplates } from '../../tools/authoring/templates.js';
import { readManifest, validateCatalog } from '../../tools/authoring/validate-catalog.js';

const templates = loadTemplates(defaultTemplatesDir);
const indexPath = join(repoRoot, 'tests', 'authoring', 'fixtures', 'example-asset-index.json');
const index = readManifest(indexPath);
const snapshot = readManifest(defaultManifestPath);

function validate(catalog, manifest = null, manifestPath = null) {
  return validateCatalog(catalog, {
    templates,
    manifest,
    manifestPath,
    sources: ['memory'],
  }).report;
}

function starter(extra = {}) {
  const loaded = loadCatalog(join(defaultExamplesDir, 'starter-catalog.json'));
  return { ...loaded, ...extra };
}

test('official faction names stay the specified strings', () => {
  assert.deepEqual(OFFICIAL_FACTION_NAMES, [
    'Aegis Dominion',
    'Phantom Blades',
    'Celestial Nexus',
    'Sanctuary Order',
  ]);
});

test('starter catalog passes against the example asset index', () => {
  assert.deepEqual(validateAssetManifest(index), []);
  const report = validate(starter(), index, indexPath);
  assert.equal(report.ok, true, formatTextReport(report));
  assert.equal(report.errors.length, 0);
  assert.deepEqual(report.counts, { avatars: 4, avatarCards: 4, actionCards: 3, equipment: 17 });
  const text = formatTextReport(report);
  assert.match(text, /Result: OK/);
  assert.match(text, /Duplicates: 0/);
  assert.match(text, /does not mark content PRODUCTION_READY/);
  const json = JSON.parse(formatJsonReport(report));
  assert.equal(json.ok, true);
  assert.equal(json.errors.length, 0);
});

test('the partial asset snapshot reports only the ids it does not contain', () => {
  const { report, materialized } = validateCatalog(starter(), {
    templates,
    manifest: snapshot,
    manifestPath: defaultManifestPath,
    sources: ['starter'],
  });
  assert.equal(report.ok, false);
  assert.ok(report.errors.every((error) => error.code === 'ASSET_REF'));
  assert.equal(report.manifest.partial, true);
  assert.match(formatTextReport(report), /Result: FAIL/);
  const snapshotIds = new Set(snapshot.assets.map((entry) => entry.asset_id));
  const referenced = new Set();
  for (const avatar of materialized.avatars) {
    for (const assetId of Object.values(avatar.assetIds)) referenced.add(assetId);
  }
  for (const card of materialized.avatarCards) referenced.add(card.assetId);
  for (const item of materialized.equipment) referenced.add(item.assetId);
  const missing = new Set(
    report.errors.map((error) => error.message.match(/Asset "([^"]+)"/)[1]),
  );
  for (const assetId of referenced) {
    if (snapshotIds.has(assetId)) assert.equal(missing.has(assetId), false, assetId);
    else assert.equal(missing.has(assetId), true, assetId);
  }
  const indexIds = new Set(index.assets.map((entry) => entry.asset_id));
  assert.deepEqual([...referenced].sort(), [...indexIds].sort());
  const snapshotById = new Map(snapshot.assets.map((entry) => [entry.asset_id, entry]));
  for (const entry of index.assets) {
    const known = snapshotById.get(entry.asset_id);
    if (!known) continue;
    assert.equal(entry.path, known.path, entry.asset_id);
    assert.equal(entry.type, known.type, entry.asset_id);
    assert.equal(entry.owner, known.owner, entry.asset_id);
    assert.equal(entry.status, known.status, entry.asset_id);
  }
});

test('character, card, and equipment ids reject the wrong shape', () => {
  const report = validate({
    hasAvatars: true,
    avatars: [
      {
        extends: 'avatar',
        avatarId: 'AVT_AEG_1',
        nameEn: 'Sir Potlid',
        nameTh: 'เซอร์ฝาหม้อ',
        factionId: 'FAC_AEG',
        rigId: 'humanoid_heavy',
      },
      {
        extends: 'avatar',
        avatarId: 'AVT_XXX_001',
        nameEn: 'Nope',
        nameTh: 'ไม่',
        factionId: 'FAC_AEG',
        rigId: 'humanoid_standard',
      },
    ],
    avatarCards: [{ extends: 'avatar-card', avatarId: 'AVT_AEG_001', cardId: 'CARD_1' }],
    actionCards: [{ extends: 'action-card', cardId: 'attack', actionType: 'ATTACK' }],
    equipment: [{ extends: 'equipment', equipmentId: 'helmet', slot: 'headgear', nativeAvatarId: null }],
  });
  assert.equal(report.ok, false);
  assert.ok(report.errors.some((error) => error.code === 'AVATAR_ID' && error.path === 'avatars[0].avatarId'));
  assert.ok(report.errors.some((error) => error.code === 'AVATAR_ID' && error.path === 'avatars[1].avatarId'));
  assert.ok(report.errors.some((error) => error.code === 'CARD_ID' && error.path.startsWith('avatarCards')));
  assert.ok(report.errors.some((error) => error.code === 'CARD_ID' && error.path.startsWith('actionCards')));
  assert.ok(report.errors.some((error) => error.code === 'ACTION_TYPE'));
  assert.ok(report.errors.some((error) => error.code === 'EQUIPMENT_ID'));
  assert.match(formatTextReport(report), /ATK, DEF, or Skill/);
});

test('faction code, faction name, and action category are checked', () => {
  const mismatch = validate({
    avatars: [
      {
        extends: 'avatar',
        avatarId: 'AVT_AEG_001',
        nameEn: 'Sir Potlid',
        nameTh: 'เซอร์ฝาหม้อ',
        factionId: 'FAC_PHA',
        rigId: 'humanoid_heavy',
      },
    ],
  });
  assert.ok(mismatch.errors.some((error) => error.code === 'AVATAR_ID' && error.message.includes('FAC_PHA')));

  const renamed = validate({
    avatars: [
      {
        extends: 'avatar',
        avatarId: 'AVT_AEG_001',
        nameEn: 'Sir Potlid',
        nameTh: 'เซอร์ฝาหม้อ',
        factionId: 'Aegis Empire',
        rigId: 'humanoid_heavy',
      },
    ],
  });
  assert.ok(renamed.errors.some((error) => error.code === 'FACTION' && error.message.includes('Aegis Dominion')));
  assert.equal(
    renamed.errors.filter((error) => error.path.endsWith('factionId') && error.message === 'unknown factionId').length,
    0,
  );

  const skill = validate({
    actionCards: [{ extends: 'action-card', cardId: 'ACT_SCHEMA_SKILL', actionType: 'Skill', labels: ['TBD'] }],
  });
  assert.equal(skill.errors.filter((error) => error.code === 'ACTION_TYPE').length, 0);
});

test('duplicate ids, broken equipment links, and unknown assets are reported', () => {
  const duplicates = validate({
    hasAvatars: true,
    avatars: [
      {
        extends: 'avatar',
        avatarId: 'AVT_AEG_001',
        nameEn: 'Sir Potlid',
        nameTh: 'เซอร์ฝาหม้อ',
        factionId: 'FAC_AEG',
        rigId: 'humanoid_heavy',
      },
      {
        extends: 'avatar',
        avatarId: 'AVT_AEG_001',
        nameEn: 'Sir Potlid',
        nameTh: 'เซอร์ฝาหม้อ',
        factionId: 'FAC_AEG',
        rigId: 'humanoid_heavy',
      },
    ],
    avatarCards: [
      { extends: 'avatar-card', avatarId: 'AVT_AEG_001' },
      { extends: 'avatar-card', avatarId: 'AVT_AEG_001' },
    ],
    equipment: [
      {
        extends: 'equipment',
        equipmentId: 'EQ_AEG_POT_HELMET_GOLD_001',
        slot: 'headgear',
        nativeAvatarId: 'AVT_PHA_001',
        variantOf: 'EQ_MISSING_001',
      },
      {
        extends: 'equipment',
        equipmentId: 'EQ_SWORD_BASIC_001',
        slot: 'main_hand',
        nativeAvatarId: 'nope',
        variantOf: 'EQ_SWORD_BASIC_001',
      },
    ],
  });
  assert.ok(duplicates.errors.some((error) => error.code === 'DUPLICATE' && error.path.startsWith('avatars')));
  assert.ok(duplicates.errors.some((error) => error.code === 'DUPLICATE' && error.message.includes('AVC_AVT_AEG_001')));
  assert.ok(duplicates.errors.some((error) => error.code === 'EQUIPMENT_ID' && error.message.includes('AVT_AEG')));
  assert.ok(duplicates.errors.some((error) => error.code === 'BROKEN_REF' && error.message.includes('EQ_MISSING_001')));
  assert.ok(duplicates.errors.some((error) => error.code === 'BROKEN_REF' && error.message.includes('same equipment')));
  assert.ok(duplicates.errors.some((error) => error.code === 'AVATAR_ID' && error.path.includes('EQ_SWORD_BASIC_001') === false && error.path.endsWith('nativeAvatarId')));

  const assets = validate(
    {
      equipment: [
        { extends: 'equipment', equipmentId: 'EQ_SWORD_BASIC_001', slot: 'main_hand', nativeAvatarId: null },
      ],
    },
    { assets: [{ asset_id: 'EQ_OTHER', path: 'x', type: 'equipment_item', owner: 'shared', status: 'PROTOTYPE' }] },
  );
  assert.ok(assets.errors.some((error) => error.code === 'ASSET_REF' && error.message.includes('EQ_SWORD_BASIC_001')));
});

test('unknown fields such as dropRate are rejected and null costs are not coerced', () => {
  const report = validate({
    actionCards: [
      { extends: 'action-card', cardId: 'ACT_SCHEMA_ATK', actionType: 'ATK', dropRate: 0.5 },
      { extends: 'action-card', cardId: 'ACT_SCHEMA_DEF', actionType: 'DEF', apCost: 0 },
    ],
    equipment: [
      {
        extends: 'equipment',
        equipmentId: 'EQ_SWORD_BASIC_001',
        slot: 'main_hand',
        nativeAvatarId: null,
        upgrade: { pow: 1 },
      },
    ],
  });
  assert.ok(report.errors.some((error) => error.path.endsWith('dropRate')));
  assert.ok(report.errors.some((error) => error.path.endsWith('costStatus')));
  assert.ok(report.errors.some((error) => error.path.endsWith('upgrade')));
  const attack = report.errors.find((error) => error.path.includes('actionCards[1]'));
  assert.ok(attack);
  assert.equal(report.ok, false);
});

test('a bad template id becomes a template error in the report', () => {
  const report = validate({ avatars: [{ extends: 'no-such-template', avatarId: 'AVT_AEG_001' }] });
  assert.equal(report.ok, false);
  assert.equal(report.errors[0].code, 'TEMPLATE');
  assert.match(formatTextReport(report), /Result: FAIL/);
  assert.match(formatTextReport(report), /Unknown template/);
});
