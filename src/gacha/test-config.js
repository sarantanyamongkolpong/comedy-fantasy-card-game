const WARNING =
  'TEST_ONLY_NOT_PRODUCTION. These weights are fixtures for the pity engine. NOT A DROP RATE. GA-11 remains PENDING_OWNER.';

/**
 * @param {object} fields
 */
export function testBanner(fields) {
  return {
    testOnly: true,
    rateStatus: 'TEST_ONLY_NOT_PRODUCTION',
    warning: WARNING,
    costG: null,
    costStatus: 'PENDING_OWNER',
    bannerId: fields.bannerId,
    pool: fields.pool,
    entries: fields.entries,
  };
}

/** Example TEST banners committed under content/v05/gacha. Not production odds. */
export function exampleTestBanners() {
  return {
    contentTier: 'draft',
    warning: WARNING,
    banners: [
      testBanner({
        bannerId: 'TEST_BANNER_AVATAR',
        pool: 'avatar',
        entries: [
          { id: 'TEST_POOL_N', rarity: 'N', weight: 100 },
          { id: 'TEST_POOL_EPIC', rarity: 'Epic', weight: 0 },
          { id: 'TEST_POOL_EX', rarity: 'EX', weight: 0 },
        ],
      }),
      testBanner({
        bannerId: 'TEST_BANNER_ACTION',
        pool: 'action',
        entries: [
          { id: 'TEST_POOL_N', rarity: 'N', weight: 100 },
          { id: 'TEST_POOL_EPIC', rarity: 'Epic', weight: 0 },
          { id: 'TEST_POOL_FAC', rarity: 'FAC', weight: 0 },
        ],
      }),
      testBanner({
        bannerId: 'TEST_BANNER_COMPANION',
        pool: 'companion',
        entries: [
          { id: 'TEST_POOL_N', rarity: 'N', weight: 100 },
          { id: 'TEST_POOL_EPIC', rarity: 'Epic', weight: 0 },
        ],
      }),
    ],
  };
}
