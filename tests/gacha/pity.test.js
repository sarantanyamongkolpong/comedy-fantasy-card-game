import assert from 'node:assert/strict';
import test from 'node:test';
import { createProfile } from '../../src/save/inventory.js';
import { createBannerState, pull, testBanner } from '../../src/gacha/index.js';
import { EPIC_PITY_PULLS, TOP_PITY_PULLS } from '../../src/schema/constants.js';

function banner(fields) {
  return testBanner(fields);
}

const avatarBanner = () =>
  banner({
    bannerId: 'TEST_BANNER_AVATAR',
    pool: 'avatar',
    entries: [
      { id: 'TEST_N', rarity: 'N', weight: 100 },
      { id: 'TEST_EPIC', rarity: 'Epic', weight: 0 },
      { id: 'TEST_EX', rarity: 'EX', weight: 0 },
    ],
  });

test('a banner without the TEST label cannot be pulled', () => {
  assert.throws(
    () => createBannerState({ bannerId: 'LIVE', pool: 'avatar', entries: [{ id: 'X', rarity: 'N', weight: 1 }] }),
    (error) => error.code === 'GA11_RATES_PENDING',
  );
});

test('natural Epic resets only the Epic counter', () => {
  const state = createBannerState(
    banner({
      bannerId: 'TEST_EPIC_ONLY',
      pool: 'avatar',
      entries: [{ id: 'ONLY_EPIC', rarity: 'Epic', weight: 1 }],
    }),
    { epicCounter: 4, topCounter: 40 },
  );
  const result = pull(state, { seed: 1, count: 1 });
  assert.equal(result.pulls[0].rarity, 'Epic');
  assert.equal(result.state.epicCounter, 0);
  assert.equal(result.state.topCounter, 41);
  assert.equal(state.epicCounter, 4);
  assert.equal(state.topCounter, 40);
});

test('EX and FAC reset both counters', () => {
  const ex = pull(
    createBannerState(
      banner({
        bannerId: 'TEST_EX',
        pool: 'avatar',
        entries: [{ id: 'ONLY_EX', rarity: 'EX', weight: 1 }],
      }),
      { epicCounter: 7, topCounter: 9 },
    ),
    { seed: 2, count: 1 },
  );
  assert.equal(ex.pulls[0].tier, 'top');
  assert.equal(ex.state.epicCounter, 0);
  assert.equal(ex.state.topCounter, 0);

  const fac = pull(
    createBannerState(
      banner({
        bannerId: 'TEST_FAC',
        pool: 'action',
        entries: [{ id: 'ONLY_FAC', rarity: 'FAC', weight: 1 }],
      }),
      { epicCounter: 3, topCounter: 8 },
    ),
    { seed: 3, count: 1 },
  );
  assert.equal(fac.pulls[0].rarity, 'FAC');
  assert.equal(fac.state.epicCounter, 0);
  assert.equal(fac.state.topCounter, 0);
});

test('the 100th avatar pull guarantees Epic or higher even when weights are all N', () => {
  const state = createBannerState(avatarBanner(), { epicCounter: EPIC_PITY_PULLS - 1, topCounter: 10 });
  const result = pull(state, { seed: 4, count: 1 });
  assert.ok(result.pulls[0].rarity === 'Epic' || result.pulls[0].rarity === 'EX');
  assert.equal(result.pulls[0].forced, 'epic');
  assert.notEqual(result.state.epicCounter, EPIC_PITY_PULLS);
});

test('the 200th action pull guarantees EX or FAC and resets both counters', () => {
  const state = createBannerState(
    banner({
      bannerId: 'TEST_ACTION_TOP',
      pool: 'action',
      entries: [
        { id: 'TEST_N', rarity: 'N', weight: 50 },
        { id: 'TEST_FAC', rarity: 'FAC', weight: 0 },
      ],
    }),
    { epicCounter: 10, topCounter: TOP_PITY_PULLS - 1 },
  );
  const result = pull(state, { seed: 5, count: 1 });
  assert.equal(result.pulls[0].rarity, 'FAC');
  assert.equal(result.pulls[0].forced, 'top');
  assert.equal(result.state.epicCounter, 0);
  assert.equal(result.state.topCounter, 0);
});

test('counters are per banner and companion pity is its own epic counter', () => {
  const avatar = createBannerState(avatarBanner(), { epicCounter: 12, topCounter: 12 });
  const other = createBannerState(
    banner({
      bannerId: 'TEST_BANNER_AVATAR_B',
      pool: 'avatar',
      entries: avatarBanner().entries,
    }),
    { epicCounter: 1, topCounter: 1 },
  );
  const companion = createBannerState(
    banner({
      bannerId: 'TEST_BANNER_COMPANION',
      pool: 'companion',
      entries: [
        { id: 'C_N', rarity: 'N', weight: 10 },
        { id: 'C_EPIC', rarity: 'Epic', weight: 0 },
      ],
    }),
    { epicCounter: EPIC_PITY_PULLS - 1 },
  );
  const avatarPull = pull(avatar, { seed: 6, count: 1 });
  assert.equal(other.epicCounter, 1);
  assert.equal(companion.epicCounter, EPIC_PITY_PULLS - 1);
  assert.equal(avatarPull.state.bannerId, 'TEST_BANNER_AVATAR');

  const companionPull = pull(companion, { seed: 7, count: 1 });
  assert.equal(companionPull.pulls[0].rarity, 'Epic');
  assert.equal(companionPull.state.epicCounter, 0);
  assert.equal(companionPull.state.topCounter, null);
  assert.throws(
    () => createBannerState(companion.banner, { topCounter: 10 }),
    (error) => error.code === 'COMPANION_HAS_NO_TOP_COUNTER',
  );
});

test('shared G is spent only when the caller supplies a test price', () => {
  const profile = createProfile({ currency: { G: 5 } });
  const state = createBannerState(avatarBanner());
  const free = pull(state, { seed: 8, count: 1, profile });
  assert.equal(free.spent, null);
  assert.equal(free.profile.currency.G, 5);
  assert.equal(profile.currency.G, 5);
  assert.equal(profile.inventory.avatars.length, 0);
  assert.equal(free.profile.inventory.avatars[0].quantity, 1);

  const paid = pull(state, { seed: 8, count: 2, profile, costG: 2 });
  assert.equal(paid.spent.currency, 'G');
  assert.equal(paid.spent.amount, 4);
  assert.equal(paid.profile.currency.G, 1);
  assert.equal(profile.currency.G, 5);

  const companion = createBannerState(
    banner({
      bannerId: 'TEST_BANNER_COMPANION',
      pool: 'companion',
      entries: [{ id: 'C_N', rarity: 'N', weight: 1 }],
    }),
  );
  assert.throws(() => pull(companion, { seed: 1, count: 1, profile, costG: 1 }), (error) => error.code === 'COMPANION_CURRENCY_PENDING');
});
