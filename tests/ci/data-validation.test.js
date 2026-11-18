import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { contentTierFor, validateData } from '../../tools/ci/lib/data-validation.mjs';
import { tempRepo } from './temp-repo.js';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

function avatar(id, nameEn = 'Sir Potlid') {
  return {
    avatarId: id,
    nameEn,
    nameTh: 'เซอร์ฝาหม้อ',
    factionId: 'FAC_AEG',
    role: 'Tank',
    stats: { pow: null, def: null, spd: null, valueStatus: 'TBD' },
    rarity: null,
  };
}

test('the systems checkout parses, has unique character ids, and matches the schema', async () => {
  const result = await validateData(repoRoot);
  assert.deepEqual(result.parseErrors, []);
  assert.deepEqual(result.characterDuplicates, []);
  assert.deepEqual(result.schemaErrors, []);
  assert.deepEqual(result.loadErrors, []);
  assert.equal(result.ok, true);
  assert.ok(result.jsonFiles >= 7);
  assert.ok(result.characterCount >= 4);
  assert.ok(result.recordsChecked >= 4);
});

test('duplicate avatar records fail even when each record is schema-valid', async () => {
  const repo = tempRepo();
  try {
    repo.write('content/roster.json', JSON.stringify([avatar('AVT_AEG_001'), avatar('AVT_AEG_001', 'Copy')]));
    const result = await validateData(repo.root);
    assert.equal(result.ok, false);
    assert.equal(result.schemaErrors.length, 0);
    assert.equal(result.characterDuplicates.length, 1);
    assert.equal(result.characterDuplicates[0].id, 'AVT_AEG_001');
  } finally {
    repo.cleanup();
  }
});

test('the same character id in two content files is a duplicate', async () => {
  const repo = tempRepo();
  try {
    repo.write('content/a.json', JSON.stringify(avatar('AVT_AEG_099', 'One')));
    repo.write('content/b.json', JSON.stringify(avatar('AVT_AEG_099', 'Two')));
    const result = await validateData(repo.root);
    assert.equal(result.ok, false);
    assert.equal(result.characterDuplicates[0].id, 'AVT_AEG_099');
    assert.equal(result.characterDuplicates[0].locations.length, 2);
  } finally {
    repo.cleanup();
  }
});

test('a new unique avatar record is accepted', async () => {
  const repo = tempRepo();
  try {
    repo.write('content/roster.json', JSON.stringify(avatar('AVT_AEG_099', 'New Lid')));
    const result = await validateData(repo.root);
    assert.equal(result.ok, true);
    assert.equal(result.characterCount, 1);
  } finally {
    repo.cleanup();
  }
});

test('character index keys must be unique inside one JSON file', async () => {
  const repo = tempRepo();
  try {
    repo.write('content/rigs.json', JSON.stringify({
      rigs: [
        { characters: { AVT_AEG_001: { anchors: { head: [1, 2] } } } },
        { characters: { AVT_AEG_001: { anchors: { head: [3, 4] } } } },
      ],
    }));
    const result = await validateData(repo.root);
    assert.equal(result.ok, false);
    assert.equal(result.characterDuplicates[0].id, 'AVT_AEG_001');
  } finally {
    repo.cleanup();
  }
});

test('manifest owner references are not character definitions', async () => {
  const repo = tempRepo();
  try {
    repo.write('docs/ASSET_MANIFEST.json', JSON.stringify({
      manifest_version: 1,
      project: 'Comedy Fantasy Card Game',
      characters: { AVT_AEG_001: 'Sir Potlid' },
      assets: [{
        asset_id: 'FRAME_A',
        path: 'assets/frame.png',
        type: 'card_frame',
        owner: 'AVT_AEG_001',
        status: 'PROTOTYPE',
      }],
    }));
    const result = await validateData(repo.root);
    assert.equal(result.ok, true);
    assert.equal(result.characterCount, 0);
  } finally {
    repo.cleanup();
  }
});

test('invalid JSON fails parse, and an unknown action type fails schema', async () => {
  const repo = tempRepo();
  try {
    repo.write('content/broken.json', '{');
    repo.write('content/card.json', JSON.stringify({
      cardId: 'ACT_BAD',
      cardKind: 'action_card',
      actionType: 'ATTACK',
      name: null,
      apCost: null,
      costStatus: 'TBD',
      effectId: null,
      rarity: null,
    }));
    const result = await validateData(repo.root);
    assert.equal(result.ok, false);
    assert.equal(result.parseErrors.length, 1);
    assert.match(result.parseErrors[0].file, /content\/broken\.json/);
    assert.ok(result.schemaErrors.some((error) => error.message.includes('ATK, DEF, or Skill') || error.location.includes('actionType')));
  } finally {
    repo.cleanup();
  }
});

test('catalog modules with two records of one avatar id fail', async () => {
  const repo = tempRepo();
  try {
    repo.write('src/avatars/catalog.js', `export const SAMPLE_AVATARS = ${JSON.stringify([avatar('AVT_PHA_001', 'Nox'), avatar('AVT_PHA_001', 'Nox Again')])};\n`);
    const result = await validateData(repo.root);
    assert.equal(result.ok, false);
    assert.equal(result.characterDuplicates[0].id, 'AVT_PHA_001');
    assert.ok(result.characterDuplicates[0].locations.every((location) => location.startsWith('src/avatars/catalog.js')));
  } finally {
    repo.cleanup();
  }
});

const STARTERS = [
  ['AVT_AEG_001', 'FAC_AEG', 'Tank', 'Sir Potlid', 'เซอร์ฝาหม้อ'],
  ['AVT_PHA_001', 'FAC_PHA', 'DPS', 'Nox Squeak', 'น็อกซ์ รองเท้าดัง'],
  ['AVT_CEL_001', 'FAC_CEL', 'Magic', 'Madame Meteor', 'มาดามดาวตก'],
  ['AVT_SAN_001', 'FAC_SAN', 'Support', 'Sister Plaster', 'ซิสเตอร์พลาสเตอร์'],
];

function starterAvatar(row) {
  const [avatarId, factionId, role, nameEn, nameTh] = row;
  return {
    ...avatar(avatarId, nameEn),
    factionId,
    role,
    nameTh,
  };
}

function catalogModule(rows) {
  return `export const SAMPLE_AVATARS = ${JSON.stringify(rows.map(starterAvatar))};
export const FACTIONS = [];
export const SAMPLE_EQUIPMENT = [];
export const SAMPLE_VARIANTS = [];
`;
}

function authoringCatalog() {
  return {
    note: 'Starter authoring records. Existing avatar ids are referenced again here.',
    avatars: STARTERS.map(([avatarId, factionId, , nameEn, nameTh]) => ({
      extends: 'avatar',
      avatarId,
      nameEn,
      nameTh,
      factionId,
      rigId: avatarId === 'AVT_AEG_001' ? 'humanoid_heavy' : 'humanoid_standard',
    })),
    avatarCards: STARTERS.map(([avatarId]) => ({ extends: 'avatar-card', avatarId })),
    actionCards: [
      { extends: 'action-card', cardId: 'ACT_SCHEMA_ATK', actionType: 'ATK' },
      { extends: 'action-card', cardId: 'ACT_SCHEMA_DEF', actionType: 'DEF' },
      { extends: 'action-card', cardId: 'ACT_SCHEMA_SKILL', actionType: 'Skill' },
    ],
    equipment: [
      { extends: 'equipment', equipmentId: 'EQ_AEG_POT_HELMET_SILVER_001', slot: 'headgear', nativeAvatarId: 'AVT_AEG_001' },
      { extends: 'equipment', equipmentId: 'EQ_AEG_POT_HELMET_GOLD_001', slot: 'headgear', nativeAvatarId: 'AVT_AEG_001', variantOf: 'EQ_AEG_POT_HELMET_SILVER_001' },
      { extends: 'equipment', equipmentId: 'EQ_AEG_SWORD_POTLID_001', slot: 'main_hand', nativeAvatarId: 'AVT_AEG_001' },
      { extends: 'equipment', equipmentId: 'EQ_PHA_KUNAI_MAIN_001', slot: 'main_hand', nativeAvatarId: 'AVT_PHA_001' },
      { extends: 'equipment', equipmentId: 'EQ_CEL_HAT_ASTRO_001', slot: 'headgear', nativeAvatarId: 'AVT_CEL_001' },
      { extends: 'equipment', equipmentId: 'EQ_SAN_CAP_HEALER_001', slot: 'headgear', nativeAvatarId: 'AVT_SAN_001' },
      { extends: 'equipment', equipmentId: 'EQ_SWORD_BASIC_001', slot: 'main_hand', nativeAvatarId: null },
    ],
  };
}

function productionPack() {
  const [id, factionId, role, nameEn, nameTh] = STARTERS[0];
  const stats = { pow: null, def: null, spd: null, valueStatus: 'TBD' };
  return {
    avatars: [{
      ...avatar(id, nameEn, { factionId, role, nameTh }),
      assetIds: { cardArt: 'CARD_AVT_AEG_001' },
    }],
    avatarCards: [{
      cardId: 'AVC_AVT_AEG_001',
      cardKind: 'avatar_card',
      avatarId: id,
      nameEn,
      nameTh,
      factionId,
      role,
      rarity: null,
      stats,
      assetId: 'CARD_AVT_AEG_001',
    }],
    equipment: [
      {
        equipmentId: 'EQ_AEG_POT_HELMET_SILVER_001',
        slot: 'headgear',
        nativeAvatarId: id,
        assetId: 'EQ_AEG_POT_HELMET_SILVER_001',
        variantOf: null,
        statModifiers: stats,
        upgrade: null,
        upgradeStatus: 'BLOCKED_BY_DESIGN',
      },
      {
        equipmentId: 'EQ_AEG_POT_HELMET_GOLD_001',
        slot: 'headgear',
        nativeAvatarId: id,
        assetId: 'EQ_AEG_POT_HELMET_GOLD_001',
        variantOf: 'EQ_AEG_POT_HELMET_SILVER_001',
        statModifiers: stats,
        upgrade: null,
        upgradeStatus: 'BLOCKED_BY_DESIGN',
      },
    ],
  };
}

function productionManifest() {
  return {
    manifest_version: 1,
    project: 'Comedy Fantasy Card Game',
    assets: [
      { asset_id: 'CARD_AVT_AEG_001', path: 'assets/cards/aeg.png', type: 'card_art', owner: 'AVT_AEG_001', status: 'PROTOTYPE' },
      { asset_id: 'EQ_AEG_POT_HELMET_SILVER_001', path: 'assets/equipment/silver.png', type: 'equipment', owner: 'AVT_AEG_001', status: 'PROTOTYPE' },
      { asset_id: 'EQ_AEG_POT_HELMET_GOLD_001', path: 'assets/equipment/gold.png', type: 'equipment', owner: 'AVT_AEG_001', status: 'CONCEPT' },
    ],
  };
}

test('content tier follows the marker, then content/production, then content/', () => {
  assert.equal(contentTierFor('content/examples/starter-catalog.json', { avatars: [] }), 'draft');
  assert.equal(contentTierFor('content/templates/avatar.template.json', { templateId: 'avatar' }), 'draft');
  assert.equal(contentTierFor('content/production/roster.json', { avatars: [] }), 'production');
  assert.equal(contentTierFor('docs/ASSET_MANIFEST.json', { assets: [] }), 'runtime');
  assert.equal(contentTierFor('src/avatars/catalog.js', null), 'runtime');
  assert.equal(contentTierFor('notes/pack.json', { contentTier: 'draft', avatars: [] }), 'draft');
  assert.equal(contentTierFor('content/examples/promoted.json', { contentTier: 'production' }), 'production');
  assert.equal(contentTierFor('content/production/hold.json', { contentTier: 'draft' }), 'draft');
});

test('draft content may repeat the four existing avatar ids and still rejects a new duplicate', async () => {
  const repo = tempRepo();
  try {
    repo.write('src/avatars/catalog.js', catalogModule(STARTERS));
    repo.write('content/templates/avatar.template.json', JSON.stringify({
      templateId: 'avatar',
      kind: 'avatar',
      extends: 'tbd-stats',
    }));
    repo.write('content/examples/starter-catalog.json', JSON.stringify(authoringCatalog()));
    const ok = await validateData(repo.root);
    assert.deepEqual(ok.characterDuplicates, []);
    assert.deepEqual(ok.draftErrors, []);
    assert.deepEqual(ok.schemaErrors, []);
    assert.equal(ok.ok, true);
    assert.equal(ok.draftFiles >= 2, true);
    for (const id of ['AVT_AEG_001', 'AVT_PHA_001', 'AVT_CEL_001', 'AVT_SAN_001']) {
      assert.equal(ok.characterDuplicates.some((entry) => entry.id === id), false);
    }

    repo.write('content/examples/again.json', JSON.stringify({
      avatars: [{ extends: 'avatar', avatarId: 'AVT_AEG_099', nameEn: 'New', nameTh: 'ใหม่', factionId: 'FAC_AEG' }],
    }));
    repo.write('content/examples/again-too.json', JSON.stringify({
      avatars: [{ extends: 'avatar', avatarId: 'AVT_AEG_099', nameEn: 'New', nameTh: 'ใหม่', factionId: 'FAC_AEG' }],
    }));
    const duplicated = await validateData(repo.root);
    assert.equal(duplicated.ok, false);
    assert.equal(duplicated.characterDuplicates.some((entry) => entry.id === 'AVT_AEG_099'), true);
  } finally {
    repo.cleanup();
  }
});

test('draft template defaults are not schema-checked as records', async () => {
  const repo = tempRepo();
  try {
    repo.write('content/templates/action-card.template.json', JSON.stringify({
      templateId: 'action-card',
      kind: 'action_card',
      defaults: {
        cardKind: 'action_card',
        name: null,
        apCost: null,
        costStatus: 'TBD',
        effectId: null,
        rarity: null,
      },
    }));
    repo.write('content/templates/avatar-card.template.json', JSON.stringify({
      templateId: 'avatar-card',
      kind: 'avatar_card',
      extends: 'tbd-stats',
      defaults: { cardKind: 'avatar_card' },
    }));
    const result = await validateData(repo.root);
    assert.equal(result.ok, true, JSON.stringify(result.schemaErrors));
    assert.deepEqual(result.schemaErrors, []);
    assert.equal(result.draftFiles, 2);
  } finally {
    repo.cleanup();
  }
});

test('draft content fails when a required field is missing, the template is unknown, or a declared id repeats', async () => {
  const repo = tempRepo();
  try {
    repo.write('content/examples/partial.json', JSON.stringify({
      avatars: [{ extends: 'avatar', avatarId: 'AVT_AEG_099', nameTh: 'ใหม่', factionId: 'FAC_AEG' }],
      actionCards: [{ extends: 'action-card', cardId: 'ACT_BAD', actionType: 'ATTACK' }],
      equipment: [
        { extends: 'equipment', equipmentId: 'EQ_SWORD_BASIC_001', slot: 'main_hand' },
        { extends: 'equipment', equipmentId: 'EQ_SWORD_BASIC_001', slot: 'off_hand' },
      ],
    }));
    repo.write('content/examples/mystery.json', JSON.stringify({
      avatars: [{ extends: 'not-a-template', avatarId: 'AVT_PHA_099' }],
    }));
    const result = await validateData(repo.root);
    assert.equal(result.ok, false);
    assert.ok(result.draftErrors.some((error) => error.code === 'REQUIRED' && error.location.endsWith('nameEn')));
    assert.ok(result.draftErrors.some((error) => error.code === 'SCHEMA' && error.message.includes('ATK, DEF, or Skill')));
    assert.ok(result.draftErrors.some((error) => error.code === 'DUPLICATE' && error.message.includes('EQ_SWORD_BASIC_001')));
    assert.ok(result.draftErrors.some((error) => error.code === 'TEMPLATE' && error.message.includes('not-a-template')));
  } finally {
    repo.cleanup();
  }
});

test('production content checks schema, references, unique ids, and asset files', async () => {
  const repo = tempRepo();
  try {
    repo.write('assets/cards/aeg.png', 'card');
    repo.write('assets/equipment/silver.png', 'silver');
    repo.write('assets/equipment/gold.png', 'gold');
    repo.write('docs/ASSET_MANIFEST.json', JSON.stringify(productionManifest()));
    repo.write('content/production/roster.json', JSON.stringify(productionPack()));
    const ok = await validateData(repo.root);
    assert.equal(ok.ok, true, JSON.stringify({ schema: ok.schemaErrors, production: ok.productionErrors, duplicates: ok.characterDuplicates }));
    assert.equal(ok.productionFiles, 1);
    assert.deepEqual(ok.productionErrors, []);

    const broken = productionPack();
    broken.avatarCards.push({
      ...broken.avatarCards[0],
      cardId: 'AVC_AVT_PHA_001',
      avatarId: 'AVT_PHA_001',
    });
    broken.equipment.push({
      ...broken.equipment[0],
      equipmentId: 'EQ_MISSING_FILE',
      assetId: 'EQ_MISSING_FILE',
      variantOf: null,
    });
    repo.write('content/production/roster.json', JSON.stringify(broken));
    const bad = await validateData(repo.root);
    assert.equal(bad.ok, false);
    assert.ok(bad.productionErrors.some((error) => error.code === 'BROKEN_REF' && error.message.includes('AVT_PHA_001')));
    assert.ok(bad.productionErrors.some((error) => error.code === 'ASSET_FILE' && error.message.includes('EQ_MISSING_FILE')));

    repo.write('content/production/cards.json', JSON.stringify({
      actionCards: [
        { cardId: 'ACT_SCHEMA_ATK', cardKind: 'action_card', actionType: 'ATK', name: null, apCost: null, costStatus: 'TBD', effectId: null, rarity: null },
        { cardId: 'ACT_SCHEMA_ATK', cardKind: 'action_card', actionType: 'DEF', name: null, apCost: null, costStatus: 'TBD', effectId: null, rarity: null },
      ],
    }));
    repo.write('content/examples/promoted.json', JSON.stringify({
      contentTier: 'production',
      avatars: [{ extends: 'avatar', avatarId: 'AVT_AEG_099', nameEn: 'New', nameTh: 'ใหม่', factionId: 'FAC_AEG' }],
    }));
    const stricter = await validateData(repo.root);
    assert.equal(stricter.ok, false);
    assert.ok(stricter.productionErrors.some((error) => error.code === 'DUPLICATE' && error.message.includes('ACT_SCHEMA_ATK')));
    assert.ok(stricter.productionErrors.some((error) => error.code === 'PRODUCTION_SHAPE'));
  } finally {
    repo.cleanup();
  }
});

test('data validation CLI passes on this checkout', () => {
  const run = spawnSync(process.execPath, ['tools/ci/validate-data.mjs'], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  assert.match(run.stdout, /DATA_VALIDATION: PASS/);
  assert.match(run.stdout, /\*\*Result: PASS\*\*/);
  assert.match(run.stdout, /content\/production/);
});
