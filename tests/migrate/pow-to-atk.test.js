import assert from 'node:assert/strict';
import test from 'node:test';
import { SAMPLE_AVATARS } from '../../src/avatars/catalog.js';
import { OWNER_EVIDENCE_T253U } from '../../src/schema/constants.js';
import { validateAvatar } from '../../src/schema/validate.js';
import { migratePowToAtk } from '../../src/migrate/pow-to-atk.js';

test('POW maps to ATK 1:1, legacy.pow is kept, and the input is not mutated', () => {
  const input = { pow: 4, def: 2, spd: 0, valueStatus: 'SET' };
  const once = migratePowToAtk(input);
  assert.equal(input.pow, 4);
  assert.equal(input.atk, undefined);
  assert.equal(input.legacy, undefined);
  assert.equal(once.pow, 4);
  assert.equal(once.atk, 4);
  assert.equal(once.legacy.pow, 4);
  assert.equal(once.migration.mapping, '1:1');
  assert.equal(once.migration.status, 'LOCKED');
  assert.equal(once.migration.evidence, OWNER_EVIDENCE_T253U);
  assert.deepEqual(migratePowToAtk(once), once);
});

test('a second migration is a no-op and a replacement mapping is rejected', () => {
  const avatar = {
    avatarId: 'AVT_AEG_001',
    nameEn: 'Sir Potlid',
    nameTh: 'เซอร์ฝาหม้อ',
    factionId: 'FAC_AEG',
    role: 'Tank',
    stats: { pow: null, def: null, spd: null, valueStatus: 'TBD' },
    rarity: null,
  };
  const once = migratePowToAtk(avatar);
  assert.equal(once.schemaVersion, 'v05');
  assert.equal(once.stats.atk, null);
  assert.equal(once.stats.pow, null);
  assert.equal(once.stats.legacy.pow, null);
  assert.equal(avatar.stats.atk, undefined);
  assert.deepEqual(migratePowToAtk(once), once);
  assert.deepEqual(validateAvatar(once), []);
  assert.throws(() => migratePowToAtk(avatar, { mapping: 'double' }), /LOCKED to 1:1/);
});

test('disagreeing atk and pow are kept and the migration refuses to pick one', () => {
  assert.throws(
    () => migratePowToAtk({ pow: 2, atk: 9, def: 1, spd: 1, valueStatus: 'SET' }),
    /Neither value was deleted/,
  );
});

test('starter avatars stay on legacy pow until a caller migrates a copy', () => {
  for (const avatar of SAMPLE_AVATARS) {
    assert.equal(avatar.stats.pow, null);
    assert.equal(avatar.stats.atk, undefined);
    assert.equal(avatar.schemaVersion, undefined);
  }
});
