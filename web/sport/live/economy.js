/**
 * Live sport wallet + gacha. Uses the real src/sport ledger and pullSport.
 * G is the existing shared wallet (state.currency.G, mirrored to profile.currencyG / profile.currency.G).
 * Pools, cost, odds, and pity come from content/v06/sport/tuning.json via content.public.json.
 * All values PROPOSED / BALANCE_PLACEHOLDER.
 */
import { pullSport as realPullSport } from '../../../src/sport/gacha/index.js';
import { claimReward, earn } from '../../../src/sport/wallet/index.js';
import { migrateSportV3 } from '../../../src/sport/save/index.js';
import { toPublicCard } from '../../../src/sport/gacha/pull-sport.js';
import { hashSeed } from '../../../src/sport/common/rng-and-events.mjs';
import { BANNER_INFO, CONTENT, getCard, poolForBanner } from './catalog.js';

function poolRecord(card) {
  return {
    id: card.id,
    sport: card.sport,
    role: card.role,
    parodyName: card.parodyName,
    rarity: card.rarity,
    team: card.team,
    stats: { ...card.stats },
    balance: 'BALANCE_PLACEHOLDER',
    status: 'PROPOSED',
    art: { slot: card.art.contentSlot ?? card.id, placeholder: true },
  };
}

/** Transient tuning override for pullSport. Never written to the save. */
export function liveGachaTuning() {
  const banner = CONTENT.tuning.banners.SPORT_FOOTBALL;
  const pools = {};
  for (const info of BANNER_INFO) pools[info.id] = poolForBanner(info.id).map(poolRecord);
  return {
    gacha: {
      costG: banner.pullCostG,
      epicPity: banner.pity.Epic,
      exPity: banner.pity.EX,
      weights: { N: banner.odds.N, R: banner.odds.R, Epic: banner.odds.Epic, EX: banner.odds.EX },
    },
    pools,
  };
}

function withoutTuning(state) {
  const next = migrateSportV3(state);
  delete next.sport.tuning;
  return next;
}

export function emptyPity() {
  return { epic: 0, ex: 0, pulls: 0 };
}

/** Web view of the saved pity ({epicCounter, exCounter, pulls} -> {epic, ex, pulls}). */
export function pityView(saved) {
  return { epic: saved?.epicCounter ?? 0, ex: saved?.exCounter ?? 0, pulls: saved?.pulls ?? 0 };
}

export function starterRosterEntry(card) {
  return { ...toPublicCard(poolRecord(card)), qty: 1 };
}

/**
 * pullSport(state, bannerId, count) -> { ok, state, results, chargedG } | { ok:false, reason }
 * Seed is derived from banner pity pulls + ledger length, so a reload does not repeat a txn id.
 */
export function pullSport(state, bannerId, count) {
  const pulls = state.sport?.pity?.[bannerId]?.pulls ?? 0;
  const seed = hashSeed(`sport-gacha:${bannerId}:${pulls}:${state.sport?.ledger?.length ?? 0}`);
  const ownedBefore = new Set(Object.keys(state.sport?.roster ?? {}));
  const input = { ...state, sport: { ...state.sport, tuning: liveGachaTuning() } };
  let outcome;
  try {
    outcome = realPullSport(input, bannerId, count, seed);
  } catch (error) {
    return { ok: false, reason: error?.code ?? 'PULL_FAILED', state };
  }
  const next = withoutTuning(outcome.state);
  const seen = new Set(ownedBefore);
  const results = outcome.pulls.map((row) => {
    const card = getCard(row.id);
    const duplicate = seen.has(row.id);
    seen.add(row.id);
    return {
      id: row.id,
      parodyName: card?.parodyName ?? row.parodyName,
      vehicleName: card?.vehicleName ?? null,
      rarity: row.rarity,
      sport: row.sport,
      role: card?.role ?? null,
      team: card?.team ?? '',
      forced: row.forced,
      balance: 'BALANCE_PLACEHOLDER',
      status: 'PROPOSED',
      duplicate,
    };
  });
  return { ok: true, applied: outcome.applied, state: next, results, chargedG: outcome.applied ? outcome.spent.amount : 0 };
}

/** Idempotent reward claim through the wallet ledger. */
export function grantG(state, { id, G, reason, meta }) {
  const outcome = claimReward(state, { txnId: id, amount: G, reason: reason ?? 'sport-reward', meta: meta ?? null });
  return { state: outcome.state, duplicate: !outcome.applied, G: outcome.applied ? G : 0 };
}

/** One-time preview balance (PROPOSED) for a profile that has no G field at all. */
export function previewGrant(state, amount) {
  const outcome = earn(state, { txnId: 'SPORT_PREVIEW_GRANT', amount, reason: 'preview-starting-balance', meta: { status: 'PROPOSED' } });
  return outcome.state;
}
