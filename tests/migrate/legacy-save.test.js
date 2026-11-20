import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { migrateSavePow, reverseSavePow } from '../../src/migrate/save-pow.js';
import { deserialize, serialize } from '../../src/save/serialize.js';

const fixtureUrl = new URL('./fixtures/legacy-pow-save-v1.json', import.meta.url);

test('a version 1 save with pow migrates to atk, reverses, and keeps legacy.pow', () => {
  const originalText = readFileSync(fixtureUrl, 'utf8');
  const fixture = JSON.parse(originalText);
  const loaded = deserialize(fixture);
  const potlid = loaded.inventory.avatars[0].record;
  const laughs = loaded.inventory.avatars[1].record;

  assert.equal(loaded.saveVersion, 2);
  assert.equal(loaded.preferences.autoBattle, false);
  assert.equal(potlid.schemaVersion, 'v05');
  assert.equal(potlid.stats.pow, 5);
  assert.equal(potlid.stats.atk, 5);
  assert.equal(potlid.stats.legacy.pow, 5);
  assert.equal(laughs.stats.pow, null);
  assert.equal(laughs.stats.atk, null);
  assert.equal(laughs.stats.legacy.pow, null);
  assert.equal(fixture.profile.inventory.avatars[0].record.stats.atk, undefined);
  assert.equal(readFileSync(fixtureUrl, 'utf8'), originalText);

  const reversed = reverseSavePow(loaded);
  const restored = reversed.inventory.avatars[0].record;
  assert.equal(restored.stats.pow, 5);
  assert.equal(restored.stats.legacy.pow, 5);
  assert.equal(restored.stats.atk, undefined);
  assert.equal(restored.schemaVersion, undefined);
  assert.equal(restored.stats.migration, undefined);
  assert.equal(loaded.inventory.avatars[0].record.stats.atk, 5);

  const again = migrateSavePow(reversed);
  assert.equal(again.inventory.avatars[0].record.stats.atk, 5);
  assert.equal(again.inventory.avatars[0].record.stats.legacy.pow, 5);
  assert.equal(again.inventory.avatars[0].record.stats.pow, 5);
  assert.deepEqual(deserialize(serialize(loaded)).inventory.avatars[0].record.stats, potlid.stats);
});
