/**
 * Fixture gacha and wallet ledger.
 * pullSport(state, bannerId, count, seed) spends G atomically and
 * updates state.sport.pity[bannerId] only.
 */

import { BANNERS, poolForBanner } from './catalog.js';
import { getTuning } from './tuning.js';
import { hashSeed, mulberry32 } from './rng.js';

const BANNER_SET = new Set(BANNERS);

function clone(state) {
  return structuredClone(state);
}

function drawRarity(rng, pity, tuning) {
  let rarity;
  if (pity.ex + 1 >= tuning.pity.ex) rarity = 'EX';
  else if (pity.epic + 1 >= tuning.pity.epic) rarity = 'Epic';
  else {
    const weights = tuning.weights;
    const total = weights.reduce((sum, row) => sum + row.weight, 0);
    let roll = rng() * total;
    rarity = weights[weights.length - 1].rarity;
    for (const row of weights) {
      roll -= row.weight;
      if (roll <= 0) {
        rarity = row.rarity;
        break;
      }
    }
  }
  pity.pulls += 1;
  pity.epic += 1;
  pity.ex += 1;
  if (rarity === 'EX') {
    pity.epic = 0;
    pity.ex = 0;
  } else if (rarity === 'Epic') {
    pity.epic = 0;
  }
  return rarity;
}

export function pullSport(state, bannerId, count, seed) {
  const tuning = getTuning();
  const pulls = count === 10 ? 10 : count === 1 ? 1 : 0;
  if (!BANNER_SET.has(bannerId)) return { ok: false, reason: 'UNKNOWN_BANNER', state };
  if (!pulls) return { ok: false, reason: 'BAD_COUNT', state };
  const cost = pulls === 10 ? tuning.pull10CostG : tuning.pullCostG * pulls;
  const txnId = `pull:${bannerId}:${seed}:${pulls}`;
  const existing = state.sport.ledger.find((row) => row.id === txnId);
  if (existing) {
    return { ok: true, duplicate: true, state, results: existing.results ?? [], chargedG: 0 };
  }
  if (state.currency.G < cost) return { ok: false, reason: 'NOT_ENOUGH_G', state, cost };
  const pool = poolForBanner(bannerId);
  if (pool.length === 0) return { ok: false, reason: 'EMPTY_POOL', state };
  const next = clone(state);
  next.currency.G -= cost;
  const pity = next.sport.pity[bannerId];
  const rng = mulberry32(hashSeed(`${bannerId}:${seed}:${pulls}`));
  const results = [];
  for (let index = 0; index < pulls; index += 1) {
    const rarity = drawRarity(rng, pity, tuning);
    const options = pool.filter((card) => card.rarity === rarity);
    const bucket = options.length > 0 ? options : pool;
    const card = bucket[Math.floor(rng() * bucket.length)];
    const owned = next.sport.roster[card.id];
    if (owned) owned.count += 1;
    else next.sport.roster[card.id] = { count: 1 };
    results.push({
      id: card.id,
      parodyName: card.parodyName,
      vehicleName: card.vehicleName,
      rarity: card.rarity,
      sport: card.sport,
      role: card.role,
      team: card.team,
      art: card.art,
      balance: card.balance,
      status: 'PROPOSED',
      duplicate: Boolean(owned),
    });
  }
  next.sport.ledger.push({
    id: txnId,
    type: 'spend',
    G: -cost,
    bannerId,
    status: 'PROPOSED',
    results,
  });
  return { ok: true, duplicate: false, state: next, results, chargedG: cost };
}

export function grantG(state, { id, G, reason }) {
  const existing = state.sport.ledger.find((row) => row.id === id);
  if (existing) return { state, duplicate: true, G: 0 };
  const next = clone(state);
  next.currency.G += G;
  next.sport.ledger.push({
    id,
    type: 'grant',
    G,
    reason,
    status: 'PROPOSED',
  });
  return { state: next, duplicate: false, G };
}

export function emptyPity() {
  return { epic: 0, ex: 0, pulls: 0 };
}
