/**
 * Sport session (live wiring).
 *
 * Source of truth is the v0.5 web profile:
 *   - shared G: profile.currencyG and profile.currency.G (the existing wallet; serialize() saves it as currency.G)
 *   - sport save v3 payload: profile.sport = { roster, pity, ledger } (src/sport/save/migrate-v3.js shape)
 * A v1/v2 profile with no sport block migrates losslessly: an empty block is added and the PROPOSED
 * starter roster is seeded. A missing G balance receives one PROPOSED preview grant; an explicit 0 is left alone.
 * Every change writes back to the profile and calls the host persist hook, so Save/Load and reload keep sport state.
 * Lineups are session-only (rebuilt from the roster on load). PROPOSED.
 */

import {
  BANNERS,
  STARTER_OWNED,
  getCard,
  getTuning,
  emptyPity,
  grantG,
  pityView,
  previewGrant,
  pullSport,
  simulateSport,
  sportMeta,
  starterRosterEntry,
} from './live/index.js';
import { migrateSportV3 } from '../../src/sport/save/index.js';
import { buildDefaultLineups, flatRoles } from './lineup.js';

let state = null;
let profileRef = null;
let persistHook = null;
let seq = 0;

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

export function setPersistHook(fn) {
  persistHook = typeof fn === 'function' ? fn : null;
}

function writeBack() {
  if (!state) return;
  if (profileRef) {
    const sport = structuredClone(state.sport);
    delete sport.tuning;
    profileRef.sport = sport;
    writeSharedG(profileRef, state.currency.G);
  }
  try {
    persistHook?.(false);
  } catch {
    // Saving is best effort. The in-memory session stays correct.
  }
}

export function resetSession(profile) {
  profileRef = profile ?? null;
  const tuning = getTuning();
  const base = migrateSportV3({ sport: profileRef?.sport ?? null });
  let g = readSharedG(profileRef);
  let next = { currency: { G: g ?? 0 }, sport: base.sport };
  if (g == null) next = previewGrant(next, tuning.previewStartingG);
  if (Object.keys(next.sport.roster).length === 0) {
    for (const id of STARTER_OWNED) {
      const card = getCard(id);
      if (card) next.sport.roster[id] = starterRosterEntry(card);
    }
  }
  for (const bannerId of BANNERS) next.sport.pity[bannerId] ??= { epicCounter: 0, exCounter: 0, pulls: 0 };
  const owned = Object.keys(next.sport.roster).map((id) => getCard(id)).filter(Boolean);
  state = {
    currency: next.currency,
    sport: next.sport,
    lineups: buildDefaultLineups(owned),
    lastSim: null,
    rewardAppliedFor: null,
  };
  seq = 0;
  writeBack();
  return state;
}

export function ensureSession(profile) {
  if (!state || (profile && profile !== profileRef)) resetSession(profile ?? profileRef);
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
  const saved = state?.sport?.pity?.[bannerId];
  return saved ? pityView(saved) : emptyPity();
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
  const slots = lineup?.slots ?? [];
  const homeCards = slots.map((id) => getCard(id)).filter(Boolean);
  const coach = getCard(lineup?.coachId);
  seq += 1;
  const eventId = `SPORT_${sport.toUpperCase()}_L${state.sport.ledger.length}_S${seq}`;
  const result = simulateSport({
    sport,
    seed: eventId,
    eventId,
    home: homeCards,
    tactics: {
      formation: lineup?.formation,
      webRoles: sport === 'football' ? flatRoles(lineup?.formation ?? '4-3-3') : [],
      scheme: lineup?.scheme,
      pace: lineup?.pace,
      tyre: lineup?.tyre,
      setup: lineup?.setup,
      coachId: lineup?.coachId ?? null,
      coach,
      bench: athletes(sport).filter((card) => !slots.includes(card.id)),
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
  if (state.rewardAppliedFor === result.rewards.eventId) {
    return { duplicate: true, G: result.rewards.G, balance: state.currency.G };
  }
  const outcome = grantG(state, {
    id: result.rewards.claimId,
    G: result.rewards.G,
    reason: 'sport-reward',
    meta: { sport: result.sport, eventId: result.rewards.eventId, status: 'PROPOSED' },
  });
  state = { ...state, currency: outcome.state.currency, sport: outcome.state.sport };
  state.rewardAppliedFor = result.rewards.eventId;
  writeBack();
  return { duplicate: outcome.duplicate, G: result.rewards.G, balance: state.currency.G };
}

export function doPull(bannerId, count) {
  const outcome = pullSport(state, bannerId, count);
  if (!outcome.ok) return outcome;
  state = { ...state, currency: outcome.state.currency, sport: outcome.state.sport };
  writeBack();
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

export function rosterQty(id) {
  return state?.sport?.roster?.[id]?.qty ?? 0;
}

export function fieldPlayers(sport) {
  return athletes(sport);
}
