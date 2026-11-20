import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { defaultTemplatesDir } from '../../tools/authoring/paths.js';
import { loadTemplates, materializeRecord, mergeDefaults } from '../../tools/authoring/templates.js';

const templates = loadTemplates(defaultTemplatesDir);

test('omitted stats take the null TBD default and an explicit null is kept', () => {
  const filled = materializeRecord(
    {
      extends: 'action-card',
      cardId: 'ACT_SCHEMA_ATK',
      actionType: 'ATK',
    },
    templates,
  );
  assert.equal(filled.apCost, null);
  assert.equal(filled.costStatus, 'TBD');
  assert.equal(filled.name, null);
  assert.equal(filled.effectId, null);
  assert.equal(filled.rarity, null);
  assert.equal(filled.extends, undefined);

  const explicit = materializeRecord(
    {
      extends: 'action-card',
      cardId: 'ACT_SCHEMA_ATK',
      actionType: 'ATK',
      name: null,
      apCost: null,
      effectId: null,
      rarity: null,
      costStatus: 'TBD',
    },
    templates,
  );
  assert.equal(explicit.apCost, null);
  assert.equal(explicit.name, null);
  assert.notEqual(explicit.apCost, 0);
});

test('a null field is not replaced by a numeric or string default', () => {
  const custom = {
    resolve() {
      return {
        defaults: {
          apCost: 0,
          name: 'filled',
          stats: { pow: 3, def: 3, spd: 3, valueStatus: 'SET' },
        },
        derive: [{ field: 'assetId', from: 'equipmentId', when: 'missing' }],
      };
    },
  };
  const record = materializeRecord(
    {
      extends: 'custom',
      apCost: null,
      name: null,
      equipmentId: 'EQ_SWORD_BASIC_001',
      assetId: null,
      stats: { pow: null },
    },
    custom,
  );
  assert.equal(record.apCost, null);
  assert.equal(record.name, null);
  assert.equal(record.assetId, null);
  assert.equal(record.stats.pow, null);
  assert.equal(record.stats.def, 3);
  assert.equal(record.stats.valueStatus, 'SET');
});

test('mergeDefaults keeps a child null over a parent number', () => {
  const merged = mergeDefaults({ apCost: 4, rarity: 'rare' }, { apCost: null });
  assert.equal(merged.apCost, null);
  assert.equal(merged.rarity, 'rare');
});

test('avatar card copies identity from the avatar instead of repeating it', () => {
  const avatar = materializeRecord(
    {
      extends: 'avatar',
      avatarId: 'AVT_AEG_001',
      nameEn: 'Sir Potlid',
      nameTh: 'เซอร์ฝาหม้อ',
      factionId: 'Aegis Dominion',
      rigId: 'humanoid_heavy',
    },
    templates,
  );
  assert.equal(avatar.factionId, 'FAC_AEG');
  assert.equal(avatar.role, 'Tank');
  assert.equal(avatar.assetIds.cardArt, 'CARD_AVT_AEG_001_card_v1');
  assert.deepEqual(avatar.stats, { pow: null, def: null, spd: null, valueStatus: 'TBD' });

  const card = materializeRecord({ extends: 'avatar-card', avatarId: 'AVT_AEG_001' }, templates, {
    avatarsById: new Map([[avatar.avatarId, avatar]]),
  });
  assert.equal(card.nameTh, 'เซอร์ฝาหม้อ');
  assert.equal(card.cardId, 'AVC_AVT_AEG_001');
  assert.equal(card.assetId, 'CARD_AVT_AEG_001_card_v1');
  assert.equal(card.rarity, null);
});

test('explicit null assetIds is not replaced by the cardArt derivation', () => {
  const avatar = materializeRecord(
    {
      extends: 'avatar',
      avatarId: 'AVT_SAN_001',
      nameEn: 'Sister Plaster',
      nameTh: 'ซิสเตอร์พลาสเตอร์',
      factionId: 'FAC_SAN',
      rigId: 'humanoid_standard',
      assetIds: null,
    },
    templates,
  );
  assert.equal(avatar.assetIds, null);
  assert.equal(avatar.role, 'Support');
});

test('template cycles and unknown ids are reported instead of looping', () => {
  const directory = mkdtempSync(join(tmpdir(), 'authoring-templates-'));
  writeFileSync(
    join(directory, 'a.template.json'),
    JSON.stringify({ templateId: 'loop-a', extends: 'loop-b', defaults: {} }),
  );
  writeFileSync(
    join(directory, 'b.template.json'),
    JSON.stringify({ templateId: 'loop-b', extends: 'loop-a', defaults: {} }),
  );
  const looping = loadTemplates(directory);
  assert.throws(() => looping.resolve('loop-a'), /cycle/i);
  assert.throws(() => templates.resolve('missing-template'), /Unknown template/);
});

test('shipped templates do not default a stat, rarity, or AP cost to a number', () => {
  for (const id of ['tbd-stats', 'avatar', 'avatar-card', 'action-card', 'equipment']) {
    const resolved = templates.resolve(id);
    const blob = JSON.stringify(resolved.defaults);
    assert.equal(blob.includes(':0'), false, id);
    assert.doesNotMatch(blob, /"pow":\d|"def":\d|"spd":\d|"apCost":\d/);
  }
  const equipment = templates.resolve('equipment');
  assert.equal(equipment.defaults.upgrade, null);
  assert.equal(equipment.defaults.upgradeStatus, 'BLOCKED_BY_DESIGN');
  assert.equal(equipment.defaults.statModifiers.valueStatus, 'TBD');
  const action = templates.resolve('action-card');
  assert.equal(action.defaults.apCost, null);
  assert.equal(action.defaults.costStatus, 'TBD');
});
