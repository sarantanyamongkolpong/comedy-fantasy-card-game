/**
 * Sport session. Separate from the v0.5 save blob.
 * Shared G is read from and written to profile.currency.G and profile.currencyG
 * so the existing wallet field stays the one balance. A missing balance receives
 * one PROPOSED preview grant. An explicit 0 is left alone.
 * Roster, pity, and ledger live on state.sport until the sim stream's save v3 lands.
 */

import {
  BANNERS,
  STARTER_OWNED,
  getCard,
  getTuning,
  emptyPity,
  grantG,
  opponentsFor,
  pullSport,
  simulateSport,
  sportMeta,
} from './fixtures/index.js';
import { buildDefaultLineups } from './lineup.js';

let state = null;
let profileRef = null;
let seq = 1;

function readSharedG(profile) {
  if (profile && Number.isInteger(profile.currencyG)) return profile.currencyG;
  if (profile?.currency && Number.isInteger(profile.currency.G)) return profile.currency.G;
  return null;
}

export function writeSharedG(profile, value) {
  if (!profile || !Number.isInteger(value)) return;
  profile.currencyG = value;
  const current = profile.currency && typeof profile.currency === 'object' ? profile.currency : {};
  profile.currency = { ...current, G: value };
}

export function resetSession(profile) {
  profileRef = profile ?? null;
  const tuning = getTuning();
  let g = readSharedG(profileRef);
  const ledger = [];
  if (g == null) {
    g = tuning.previewStartingG;
    ledger.push({
      id: 'SPORT_PREVIEW_GRANT',
      type: 'grant',
      G: g,
      reason: 'preview-starting-balance',
      status: 'PROPOSED',
    });
    writeSharedG(profileRef, g);
  }
  const owned = STARTER_OWNED.map((id) => getCard(id)).filter(Boolean);
  const pity = {};
  for (const bannerId of BANNERS) pity[bannerId] = emptyPity();
  state = {
    currency: { G: g },
    sport: {
      roster: Object.fromEntries(STARTER_OWNED.map((id) => [id, { count: 1 }])),
      pity,
      ledger,
    },
    lineups: buildDefaultLineups(owned),
    lastSim: null,
    rewardAppliedFor: null,
  };
  seq = 1;
  return state;
}

export function ensureSession(profile) {
  if (!state) resetSession(profile);
  else if (profile) profileRef = profile;
  return state;
}

export function snapshot() {
  return state;
}

export function gOf() {
  return state?.currency?.G ?? 0;
}

export function ownedCards() {
  if (!state) return [];
  return Object.keys(state.sport.roster)
    .map((id) => getCard(id))
    .filter(Boolean);
}

export function pityOf(bannerId) {
  return state?.sport?.pity?.[bannerId] ?? emptyPity();
}

export function lineupOf(sport) {
  return state?.lineups?.[sport] ?? null;
}

export function updateLineup(sport, recipe) {
  const current = state.lineups[sport];
  state.lineups[sport] = recipe(current);
  return state.lineups[sport];
}

export function cardById(id) {
  return getCard(id);
}

function athletes(sport) {
  return ownedCards().filter((card) => card.sport === sport && card.role !== 'COACH');
}

export function coaches(sport) {
  return ownedCards().filter((card) => card.sport === sport && card.role === 'COACH');
}

export function entries(sport) {
  return ownedCards().filter((card) => card.sport === sport && card.role === 'ENTRY');
}

export function runSim(sport) {
  const meta = sportMeta(sport);
  const lineup = lineupOf(sport);
  const homeCards = (lineup?.slots ?? []).map((id) => getCard(id)).filter(Boolean);
  const coach = getCard(lineup?.coachId);
  const away = opponentsFor(sport);
  seq += 1;
  const eventId = `SPORT_${sport.toUpperCase()}_${seq}`;
  const result = simulateSport({
    sport,
    seed: eventId,
    eventId,
    home: homeCards,
    away,
    tactics: {
      formation: lineup?.formation,
      scheme: lineup?.scheme,
      pace: lineup?.pace,
      tyre: lineup?.tyre,
      setup: lineup?.setup,
      coachId: lineup?.coachId ?? null,
      coach,
      venue: meta?.venue,
    },
  });
  state.lastSim = result;
  state.rewardAppliedFor = null;
  return result;
}

export function finishReward() {
  const result = state?.lastSim;
  if (!result) return { duplicate: true, G: 0 };
  const txnId = `grant:${result.rewards.eventId}`;
  if (state.rewardAppliedFor === result.rewards.eventId) {
    return { duplicate: true, G: result.rewards.G };
  }
  const outcome = grantG(state, {
    id: txnId,
    G: result.rewards.G,
    reason: result.rewards.eventId,
  });
  state = outcome.state;
  state.rewardAppliedFor = result.rewards.eventId;
  writeSharedG(profileRef, state.currency.G);
  return { duplicate: outcome.duplicate, G: result.rewards.G, balance: state.currency.G };
}

export function doPull(bannerId, count) {
  seq += 1;
  const seed = `sport-gacha:${bannerId}:${seq}`;
  const outcome = pullSport(state, bannerId, count, seed);
  if (!outcome.ok) return outcome;
  state = outcome.state;
  writeSharedG(profileRef, state.currency.G);
  return outcome;
}

export function rosterPage(sport, page, size) {
  const cards = ownedCards().filter((card) => card.sport === sport);
  const pages = Math.max(1, Math.ceil(cards.length / size));
  const safe = Math.min(Math.max(0, page), pages - 1);
  return {
    cards: cards.slice(safe * size, safe * size + size),
    page: safe,
    pages,
    total: cards.length,
  };
}

export function fieldPlayers(sport) {
  return athletes(sport);
}
