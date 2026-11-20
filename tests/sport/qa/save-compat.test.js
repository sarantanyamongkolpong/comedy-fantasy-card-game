import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createProfile, deserialize } from '../../../src/save/index.js';
import { SAVE_VERSION } from '../../../src/schema/constants.js';
import { firstFunction, importFirst, saveV3Candidates } from '../../../tools/sport-qa/lib/discover.mjs';

function loadFixture(name) {
  return JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
}

function kept(profile, fixture) {
  assert.equal(profile.profileId, fixture.profileId);
  assert.deepEqual(profile.inventory, fixture.inventory);
  assert.deepEqual(profile.decks, fixture.decks);
  assert.equal(profile.currency.G, fixture.currency.G);
  assert.deepEqual(Object.keys(profile.currency), ['G']);
  assert.deepEqual(profile.pity, fixture.pity);
  assert.equal(profile.house.displayTier, fixture.house.displayTier);
  assert.deepEqual(profile.rewardLedger, fixture.rewardLedger);
}

test('a version 1 fixture still loads and keeps the shared G wallet', () => {
  const fixture = loadFixture('save-v1.json');
  const profile = deserialize(fixture);
  kept(profile, fixture.profile);
  assert.equal(profile.preferences.autoBattle, false);
  assert.ok(profile.saveVersion >= fixture.saveVersion);

  const explicit = deserialize({
    saveVersion: 1,
    profile: {
      ...fixture.profile,
      preferences: { autoBattle: true },
    },
  });
  assert.equal(explicit.preferences.autoBattle, true);
  assert.equal(explicit.currency.G, 17);
});

test('a version 2 fixture still loads and keeps AUTO preference', () => {
  const fixture = loadFixture('save-v2.json');
  const profile = deserialize(fixture);
  kept(profile, fixture.profile);
  assert.equal(profile.preferences.autoBattle, true);
  assert.ok(profile.saveVersion >= 2);
});

const v3Module = await importFirst(saveV3Candidates());
const v3Present = Boolean(v3Module.file) || SAVE_VERSION >= 3;

test('version 3 sport state round-trips', {
  skip: v3Present ? false : 'save v3 module is absent and SAVE_VERSION is still 2',
}, async () => {
  if (v3Module.error) {
    throw new Error(`${v3Module.file} failed to load: ${v3Module.error.message}`);
  }
  const { serialize } = await import('../../../src/save/index.js');
  const profile = createProfile({ profileId: 'QA_SPORT_V3', currency: { G: 25 } });
  profile.sport = {
    roster: { football: ['QA_FB_1'] },
    pity: {
      SPORT_FOOTBALL: { epic: 3, ex: 1 },
      SPORT_BASKET: { epic: 0, ex: 0 },
      SPORT_CAR: { epic: 0, ex: 0 },
      SPORT_MOTO: { epic: 0, ex: 0 },
    },
    ledger: [{ id: 'qa-txn-1', G: 25 }],
  };

  if (SAVE_VERSION >= 3) {
    const raw = serialize(profile);
    const parsed = JSON.parse(raw);
    const back = deserialize(raw);
    assert.equal(parsed.saveVersion, 3);
    assert.equal(back.currency.G, 25);
    assert.deepEqual(Object.keys(back.currency), ['G']);
    assert.deepEqual(back.sport, profile.sport);
    const v1 = deserialize(loadFixture('save-v1.json'));
    assert.equal(v1.currency.G, 17);
    assert.equal(v1.profileId, 'QA_SPORT_V1');
    return;
  }

  const migrate = firstFunction(v3Module.mod, [
    'migrateSportV3',
    'migrateV3',
    'migrateToV3',
    'migrateV2ToV3',
    'upgradeSave',
    'migrate',
  ]);
  assert.ok(
    migrate,
    `${v3Module.file} exports ${Object.keys(v3Module.mod ?? {}).join(', ')}; none migrate a v2 profile`,
  );
  const v2 = loadFixture('save-v2.json');
  const migrated = await migrate.fn(structuredClone(v2.profile));
  const bag = migrated?.sport ?? migrated?.profile?.sport;
  assert.ok(bag && typeof bag === 'object', 'v2 migration did not add a sport bag');
  assert.equal((migrated.currency ?? migrated.profile?.currency).G, 40);

  const raw = serialize(profile);
  const back = deserialize(raw);
  assert.equal(back.currency.G, 25);
  assert.deepEqual(back.sport, profile.sport);
});
