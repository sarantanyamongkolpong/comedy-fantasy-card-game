import { assertSeed, createRng } from '../racing/rng.js';
import { resolveTuning } from '../racing/tuning.js';
import { migrateSportV3 } from '../save/migrate-v3.js';
import { spend } from '../wallet/ledger.js';
import { SPORT_BANNERS, SPORT_CATALOG, assertPool } from './catalog.js';

const SPORT_OF = {
  SPORT_FOOTBALL: 'football',
  SPORT_BASKET: 'basket',
  SPORT_CAR: 'car',
  SPORT_MOTO: 'moto',
};

const RARITY_ORDER = ['N', 'R', 'Epic', 'EX'];

function fail(message, code) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

/**
 * @param {string} bannerId
 * @param {number} pullsBefore
 * @param {number} seed
 * @param {number} count
 */
export function sportPullTxnId(bannerId, pullsBefore, seed, count) {
  return `sport-pull:${bannerId}:${pullsBefore}:${seed}:${count}`;
}

/**
 * Saved roster cards are player-facing: no `real` block.
 * @param {object} card
 */
export function toPublicCard(card) {
  return {
    id: card.id,
    sport: card.sport,
    role: card.role ?? 'entry',
    parodyName: card.parodyName,
    rarity: card.rarity,
    team: card.team ?? '',
    stats: { ...card.stats },
    balance: 'BALANCE_PLACEHOLDER',
    status: 'PROPOSED',
    art: { slot: card.art?.slot ?? card.id, placeholder: true },
  };
}

function poolFor(bannerId, sport, tuning) {
  const override = tuning.pools?.[bannerId];
  const pool = override ?? SPORT_CATALOG[bannerId];
  assertPool(pool, sport);
  return pool;
}

function readPity(sport, bannerId) {
  const saved = sport.pity?.[bannerId] ?? {};
  const pity = {
    epicCounter: saved.epicCounter ?? 0,
    exCounter: saved.exCounter ?? 0,
    pulls: saved.pulls ?? 0,
  };
  for (const key of ['epicCounter', 'exCounter', 'pulls']) {
    if (!Number.isInteger(pity[key]) || pity[key] < 0) fail(`${key} must be a non-negative integer`, 'BAD_PITY');
  }
  return pity;
}

function groups(pool) {
  const map = new Map();
  for (const card of pool) {
    const list = map.get(card.rarity) ?? [];
    list.push(card);
    map.set(card.rarity, list);
  }
  return map;
}

function uniform(rng, list, label) {
  if (!list || list.length === 0) fail(`pity fired but no ${label} card is in the pool`, 'NO_PITY_CANDIDATE');
  return list[rng.int(list.length)];
}

function weighted(rng, pool, weights) {
  const byRarity = groups(pool);
  const rarities = RARITY_ORDER.filter((rarity) => (weights[rarity] ?? 0) > 0 && byRarity.has(rarity));
  const total = rarities.reduce((sum, rarity) => sum + weights[rarity], 0);
  if (!Number.isInteger(total) || total < 1) fail('gacha weights need a positive integer total', 'BAD_POOL');
  let roll = rng.int(total);
  let chosen = rarities[rarities.length - 1];
  for (const rarity of rarities) {
    if (roll < weights[rarity]) {
      chosen = rarity;
      break;
    }
    roll -= weights[rarity];
  }
  return uniform(rng, byRarity.get(chosen), chosen);
}

function grant(roster, card) {
  const previous = roster[card.id]?.qty ?? 0;
  roster[card.id] = { ...toPublicCard(card), qty: previous + 1 };
}

/**
 * Pull x1 or x10 on one sport banner. Pity is per banner and lives on `state.sport.pity`.
 * G is spent once, through the wallet ledger. Avatar pity is not used and not changed.
 * Thresholds, weights, and cost come from the racing tuning file (PROPOSED).
 * @param {object} state
 * @param {string} bannerId
 * @param {number} count
 * @param {number} seed
 */
export function pullSport(state, bannerId, count, seed) {
  const safeSeed = assertSeed(seed);
  if (!SPORT_BANNERS.includes(bannerId)) fail('bannerId must be a sport banner', 'BAD_BANNER');
  if (count !== 1 && count !== 10) fail('count must be 1 or 10', 'BAD_COUNT');
  if (!Number.isSafeInteger(state?.currency?.G)) fail('currency.G must be an integer', 'BAD_WALLET');

  const sportName = SPORT_OF[bannerId];
  const tuning = resolveTuning(state.sport?.tuning);
  const pool = poolFor(bannerId, sportName, tuning);
  if (!Number.isInteger(tuning.gacha.costG) || tuning.gacha.costG < 1) fail('costG must be an integer >= 1', 'BAD_COST');
  if (!Number.isInteger(tuning.gacha.epicPity) || tuning.gacha.epicPity < 1) fail('epicPity must be an integer >= 1', 'BAD_PITY');
  if (!Number.isInteger(tuning.gacha.exPity) || tuning.gacha.exPity < 1) fail('exPity must be an integer >= 1', 'BAD_PITY');

  const pity = readPity(state.sport ?? {}, bannerId);
  const txnId = sportPullTxnId(bannerId, pity.pulls, safeSeed, count);
  const prior = state.sport?.ledger?.find((row) => row.txnId === txnId);
  if (prior) {
    return {
      state,
      applied: false,
      reason: 'ALREADY_APPLIED',
      pulls: prior.meta?.cards ?? [],
      pity: { ...pity },
      spent: prior,
    };
  }

  const cost = tuning.gacha.costG * count;
  if (state.currency.G < cost) fail('Not enough G', 'INSUFFICIENT_G');

  const byRarity = groups(pool);
  const rng = createRng(safeSeed);
  const draft = migrateSportV3(state);
  let epicCounter = pity.epicCounter;
  let exCounter = pity.exCounter;
  const pulls = [];
  for (let index = 0; index < count; index += 1) {
    epicCounter += 1;
    exCounter += 1;
    let forced = null;
    let picked;
    if (exCounter >= tuning.gacha.exPity) {
      forced = 'EX';
      picked = uniform(rng, byRarity.get('EX'), 'EX');
    } else if (epicCounter >= tuning.gacha.epicPity) {
      forced = 'epic';
      picked = uniform(rng, [...(byRarity.get('Epic') ?? []), ...(byRarity.get('EX') ?? [])], 'Epic');
    } else {
      picked = weighted(rng, pool, tuning.gacha.weights);
    }
    if (picked.rarity === 'EX') {
      epicCounter = 0;
      exCounter = 0;
    } else if (picked.rarity === 'Epic') {
      epicCounter = 0;
    }
    grant(draft.sport.roster, picked);
    pulls.push({
      index,
      id: picked.id,
      rarity: picked.rarity,
      sport: picked.sport,
      parodyName: picked.parodyName,
      forced,
      epicCounter,
      exCounter,
    });
  }
  draft.sport.pity = {
    ...draft.sport.pity,
    [bannerId]: { epicCounter, exCounter, pulls: pity.pulls + count },
  };
  const paid = spend(draft, {
    txnId,
    amount: cost,
    reason: 'sport-gacha',
    meta: { bannerId, seed: safeSeed, count, cards: pulls },
  });
  return {
    state: paid.state,
    applied: true,
    pulls,
    pity: paid.state.sport.pity[bannerId],
    spent: paid.entry,
  };
}
