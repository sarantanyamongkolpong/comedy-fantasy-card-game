import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createProfile, deserialize, serialize } from '../../../src/save/index.js';
import { SPORT_SAVE_VERSION, migrateSportV3 } from '../../../src/sport/save/index.js';

const v1Url = new URL('../../migrate/fixtures/legacy-pow-save-v1.json', import.meta.url);
const v2Url = new URL('./fixtures/save-v2.json', import.meta.url);

function leaves(value, path, out) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => leaves(item, `${path}[${index}]`, out));
    return;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) leaves(value[key], `${path}.${key}`, out);
    return;
  }
  out.push([path, value]);
}

function readPath(root, path) {
  const parts = path.split('.').slice(1);
  let cursor = root;
  for (const part of parts) {
    const match = part.match(/^([^[\]]+)(?:\[(\d+)\])?$/);
    cursor = cursor[match[1]];
    if (match[2] != null) cursor = cursor[Number(match[2])];
  }
  return cursor;
}

test('version 1 and version 2 saves gain sport data without dropping G or avatar pity', () => {
  assert.equal(SPORT_SAVE_VERSION, 3);
  const v1Text = readFileSync(v1Url, 'utf8');
  const v1 = JSON.parse(v1Text);
  const loadedV1 = deserialize(v1);
  assert.equal(loadedV1.saveVersion, 2);
  assert.equal(loadedV1.currency.G, v1.profile.currency.G);
  assert.deepEqual(loadedV1.pity, v1.profile.pity);
  assert.deepEqual(loadedV1.rewardLedger, v1.profile.rewardLedger);
  assert.equal(loadedV1.inventory.avatars[0].record.stats.pow, 5);
  assert.equal(loadedV1.inventory.avatars[0].record.stats.atk, 5);
  assert.deepEqual(loadedV1.sport, { roster: {}, pity: {}, ledger: [] });
  assert.equal(readFileSync(v1Url, 'utf8'), v1Text);

  const v2Text = readFileSync(v2Url, 'utf8');
  const v2 = JSON.parse(v2Text);
  assert.equal(v2.saveVersion, 2);
  assert.equal(v2.profile.sport, undefined);
  const loadedV2 = deserialize(v2);
  const found = [];
  leaves(v2.profile, 'profile', found);
  for (const [path, value] of found) {
    if (path === 'profile.saveVersion') continue;
    assert.deepEqual(readPath(loadedV2, path), value, path);
  }
  assert.equal(loadedV2.currency.G, 42);
  assert.equal(loadedV2.pity.TEST_BANNER_AVATAR.epicCounter, 7);
  assert.equal(loadedV2.pity.TEST_BANNER_AVATAR.topCounter, 11);
  assert.equal(loadedV2.preferences.autoBattle, true);
  assert.deepEqual(loadedV2.sport, { roster: {}, pity: {}, ledger: [] });
  assert.equal(readFileSync(v2Url, 'utf8'), v2Text);

  loadedV2.sport.roster.KEPT = { qty: 2 };
  loadedV2.sport.pity.SPORT_CAR = { epicCounter: 4, exCounter: 8, pulls: 4 };
  loadedV2.sport.ledger.push({ seq: 1, txnId: 'keep', type: 'earn', amount: 3, balanceAfter: 45, reason: 'test', meta: null });
  loadedV2.currency.G = 45;
  const round = deserialize(serialize(loadedV2));
  assert.deepEqual(round.sport, loadedV2.sport);
  assert.equal(round.currency.G, 45);
  assert.deepEqual(round.pity, loadedV2.pity);
  assert.deepEqual(round.rewardLedger, loadedV2.rewardLedger);
  assert.deepEqual(migrateSportV3(round).sport, round.sport);
});

test('a sport schema 3 envelope round-trips and an empty profile migrates in place', () => {
  const profile = createProfile({ profileId: 'PLAYER_V3', currency: { G: 9 } });
  profile.saveVersion = 3;
  profile.sport.roster.NOTE = { qty: 1 };
  const raw = serialize(profile);
  assert.equal(JSON.parse(raw).saveVersion, 3);
  const back = deserialize(raw);
  assert.equal(back.saveVersion, 3);
  assert.equal(back.currency.G, 9);
  assert.deepEqual(back.sport.roster, { NOTE: { qty: 1 } });
  assert.deepEqual(back.pity, {});
  const extra = migrateSportV3({
    currency: { G: 4 },
    pity: { MAIN: { epicCounter: 1 } },
    sport: { roster: { a: 1 }, note: 'keep' },
  });
  assert.equal(extra.currency.G, 4);
  assert.deepEqual(extra.pity, { MAIN: { epicCounter: 1 } });
  assert.equal(extra.sport.note, 'keep');
  assert.deepEqual(extra.sport.ledger, []);
  assert.deepEqual(extra.sport.pity, {});
});
