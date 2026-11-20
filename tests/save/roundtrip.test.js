import assert from 'node:assert/strict';
import test from 'node:test';
import { createBannerState, pull, testBanner } from '../../src/gacha/index.js';
import { acquireTier, installFurniture } from '../../src/schema/hideout.js';
import {
  createLocalStorageAdapter,
  createMemoryAdapter,
  createProfile,
  deserialize,
  grantItem,
  serialize,
} from '../../src/save/index.js';

test('serialize and deserialize round-trip inventory, decks, currency, pity, and house', () => {
  let profile = createProfile({ profileId: 'PLAYER_DEMO', currency: { G: 12 } });
  profile = grantItem(profile, { kind: 'avatar', catalogId: 'AVT_AEG_002', quantity: 1 });
  profile = grantItem(profile, { kind: 'action', catalogId: 'ACT_GEN_ATK_001', quantity: 3 });
  profile.decks = [{ deckId: 'DECK_DEMO_MIXED_001', cardIds: ['ACT_GEN_ATK_001'] }];
  const banner = testBanner({
    bannerId: 'TEST_BANNER_AVATAR',
    pool: 'avatar',
    entries: [{ id: 'TEST_N', rarity: 'N', weight: 1 }],
  });
  const pulled = pull(createBannerState(banner, { epicCounter: 3, topCounter: 4 }), {
    seed: 9,
    count: 1,
    profile,
  });
  profile = pulled.profile;
  profile.house = installFurniture(acquireTier(profile.house, 'loft'), {
    furnitureId: 'FUR_REF_LOFT_TALL_CABINET',
    name: 'Tall Cabinet',
    capacity: 100,
  });

  const raw = serialize(profile);
  const back = deserialize(raw);
  assert.deepEqual(back, profile);
  assert.equal(back.currency.G, profile.currency.G);
  assert.equal(back.pity.TEST_BANNER_AVATAR.epicCounter, pulled.state.epicCounter);
  assert.equal(back.house.displayTier, 'loft');
  assert.equal(back.house.installedFurniture[0].capacity, 100);
  assert.throws(() => deserialize('{"saveVersion":99,"profile":{}}'), /Unsupported saveVersion/);
});

test('memory and localStorage-like adapters load the same profile', () => {
  const profile = grantItem(createProfile({ currency: { G: 2 } }), {
    kind: 'companion',
    catalogId: 'TEST_POOL_N',
    quantity: 1,
  });
  const memory = createMemoryAdapter();
  memory.save(profile);
  assert.deepEqual(memory.load(), profile);
  memory.clear();
  assert.equal(memory.load(), null);

  const local = createLocalStorageAdapter({
    getItem(key) {
      return this.map.get(key) ?? null;
    },
    setItem(key, value) {
      this.map.set(key, value);
    },
    removeItem(key) {
      this.map.delete(key);
    },
    map: new Map(),
  });
  local.save(profile);
  assert.deepEqual(local.load(), profile);
  assert.throws(() => createLocalStorageAdapter(null), /localStorage is not available/);
});
