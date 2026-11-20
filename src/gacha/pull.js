import { grantItem } from '../save/inventory.js';
import {
  COMPANION_EPIC_PITY_PULLS,
  EPIC_PITY_PULLS,
  OWNER_EVIDENCE_T253U,
  TOP_PITY_PULLS,
} from '../schema/constants.js';
import { mulberry32, pickUniform, pickWeighted } from './rng.js';

const POOLS = new Set(['avatar', 'action', 'companion']);

export function lockedPityPolicy() {
  return {
    status: 'LOCKED',
    evidence: OWNER_EVIDENCE_T253U,
    rule: 'GA-12',
    counterScope: 'banner',
    epicAndTopSeparate: true,
    epicHitResets: 'epic',
    topHitResets: ['epic', 'top'],
    companionEpicSeparate: true,
    companionTopPity: false,
  };
}

function fail(message, code) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

/**
 * @param {unknown} banner
 */
export function assertTestBanner(banner) {
  if (!banner || typeof banner !== 'object') fail('banner must be an object', 'BAD_BANNER');
  if (!POOLS.has(banner.pool)) fail('pool must be avatar, action, or companion', 'BAD_BANNER');
  if (typeof banner.bannerId !== 'string' || banner.bannerId.length === 0) fail('bannerId is required', 'BAD_BANNER');
  const labelled =
    banner.testOnly === true &&
    banner.rateStatus === 'TEST_ONLY_NOT_PRODUCTION' &&
    typeof banner.warning === 'string' &&
    banner.warning.includes('NOT_PRODUCTION') &&
    banner.warning.includes('NOT A DROP RATE');
  if (!labelled) {
    fail(
      'GA-11: production drop rates are not set. A banner can be pulled only when it is an explicit TEST config.',
      'GA11_RATES_PENDING',
    );
  }
  if (!Array.isArray(banner.entries) || banner.entries.length === 0) fail('banner entries are required', 'BAD_BANNER');
}

/**
 * @param {object} banner
 * @param {{ epicCounter?: number, topCounter?: number | null, pulls?: number }} [saved]
 */
export function createBannerState(banner, saved = {}) {
  assertTestBanner(banner);
  const epicCounter = saved.epicCounter ?? 0;
  if (!Number.isInteger(epicCounter) || epicCounter < 0) fail('epicCounter must be a non-negative integer', 'BAD_PITY');
  let topCounter = null;
  if (banner.pool === 'companion') {
    if (saved.topCounter !== undefined && saved.topCounter !== null) {
      fail('Companion has no top-tier counter (GA-10, GA-12).', 'COMPANION_HAS_NO_TOP_COUNTER');
    }
  } else {
    topCounter = saved.topCounter ?? 0;
    if (!Number.isInteger(topCounter) || topCounter < 0) fail('topCounter must be a non-negative integer', 'BAD_PITY');
  }
  const pulls = saved.pulls ?? 0;
  if (!Number.isInteger(pulls) || pulls < 0) fail('pulls must be a non-negative integer', 'BAD_PITY');
  return {
    bannerId: banner.bannerId,
    pool: banner.pool,
    epicCounter,
    topCounter,
    pulls,
    policy: lockedPityPolicy(),
    banner: structuredClone(banner),
  };
}

function hitTier(rarity, pool) {
  if (pool === 'companion') return rarity === 'Epic' ? 'epic' : 'other';
  if (pool === 'avatar' && rarity === 'EX') return 'top';
  if (pool === 'action' && (rarity === 'EX' || rarity === 'FAC')) return 'top';
  if (rarity === 'Epic') return 'epic';
  return 'other';
}

function forceTier(pool, epicCounter, topCounter) {
  if (pool !== 'companion' && topCounter >= TOP_PITY_PULLS) return 'top';
  const epicLine = pool === 'companion' ? COMPANION_EPIC_PITY_PULLS : EPIC_PITY_PULLS;
  if (epicCounter >= epicLine) return 'epic';
  return null;
}

function eligible(entries, forced, pool) {
  return entries.filter((entry) => {
    const tier = hitTier(entry.rarity, pool);
    if (forced === 'top') return tier === 'top';
    if (forced === 'epic') return tier === 'epic' || tier === 'top';
    return false;
  });
}

/**
 * Pull `count` times. Does not mutate `state` or `profile`.
 * Currency is spent only when the caller passes `costG`. Companion pulls never spend G.
 * @param {ReturnType<typeof createBannerState>} state
 * @param {{ seed: number, count?: number, profile?: object | null, costG?: number | null }} options
 */
export function pull(state, options = {}) {
  if (!state || !state.banner) fail('banner state is required', 'BAD_BANNER');
  assertTestBanner(state.banner);
  const count = options.count ?? 1;
  if (!Number.isInteger(count) || count < 1) fail('count must be a positive integer', 'BAD_PULL');
  if (!Number.isInteger(options.seed) || options.seed < 0) fail('seed must be a non-negative integer', 'BAD_PULL');
  if (options.costG != null && state.pool === 'companion') {
    fail('Companion currency is PENDING_OWNER (GA-02). Companion pulls do not spend G.', 'COMPANION_CURRENCY_PENDING');
  }
  if (options.costG != null && (!Number.isInteger(options.costG) || options.costG < 0)) {
    fail('costG must be a non-negative integer when the caller supplies a test price', 'BAD_COST');
  }
  if (options.costG != null && !options.profile) fail('costG requires a profile', 'BAD_COST');

  const rng = mulberry32(options.seed);
  let epicCounter = state.epicCounter;
  let topCounter = state.topCounter;
  let profile = options.profile ? structuredClone(options.profile) : null;
  const pulls = [];

  for (let index = 0; index < count; index += 1) {
    epicCounter += 1;
    if (topCounter !== null) topCounter += 1;
    const forced = forceTier(state.pool, epicCounter, topCounter);
    const entry = forced
      ? pickUniform(rng, eligible(state.banner.entries, forced, state.pool))
      : pickWeighted(rng, state.banner.entries);
    const tier = hitTier(entry.rarity, state.pool);
    if (tier === 'top') {
      epicCounter = 0;
      topCounter = 0;
    } else if (tier === 'epic') {
      epicCounter = 0;
    }
    pulls.push({
      index,
      id: entry.id,
      rarity: entry.rarity,
      forced,
      tier,
      epicCounter,
      topCounter,
      pityCardChoice: forced ? { status: 'PENDING_OWNER', rule: 'GA-11', method: 'UNIFORM_AMONG_ELIGIBLE' } : null,
    });
    if (profile) {
      profile = grantItem(profile, {
        kind: state.pool,
        catalogId: entry.id,
        quantity: 1,
        source: {
          kind: 'gacha',
          bannerId: state.bannerId,
          rateStatus: 'TEST_ONLY_NOT_PRODUCTION',
        },
      });
    }
  }

  let spent = null;
  if (options.costG != null) {
    const amount = options.costG * count;
    if (profile.currency.G < amount) fail('Not enough G', 'INSUFFICIENT_G');
    profile = {
      ...profile,
      currency: { ...profile.currency, G: profile.currency.G - amount },
    };
    spent = { currency: 'G', amount, costStatus: 'CALLER_SUPPLIED_TEST' };
  }

  if (profile) {
    profile = {
      ...profile,
      pity: {
        ...profile.pity,
        [state.bannerId]: { epicCounter, topCounter, pool: state.pool },
      },
    };
  }

  return {
    state: {
      ...state,
      epicCounter,
      topCounter,
      pulls: state.pulls + count,
      policy: lockedPityPolicy(),
    },
    pulls,
    profile,
    spent,
  };
}
