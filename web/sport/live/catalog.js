/**
 * Live catalog for the Sport Complex web.
 * Source: web/sport/live/content.public.json, generated from content/v06/sport/index.json
 * by tools/sport-web/build-public-content.mjs. Parody fields only; `real` blocks never ship.
 * Status PROPOSED. Stats are BALANCE_PLACEHOLDER game numbers, not official stats.
 */
import content from './content.public.json' with { type: 'json' };
import { ADAPTER_TUNING } from './tuning.js';

export const CONTENT = content;

const ALL_CARDS = Object.freeze(
  Object.values(content.sports).flatMap((block) => block.cards).map((card) => Object.freeze(card)),
);
const BY_ID = new Map(ALL_CARDS.map((card) => [card.id, card]));

export const SPORTS = Object.freeze([
  Object.freeze({ id: 'football', label: 'Football', blurb: '11 vs 11, one keeper', bannerId: 'SPORT_FOOTBALL', venue: venueName('football', 'SPC_FOOTBALL_VEN_001') }),
  Object.freeze({ id: 'basket', label: 'Basketball', blurb: '5 on the court', bannerId: 'SPORT_BASKET', venue: venueName('basket', 'SPC_BASKET_VEN_001') }),
  Object.freeze({ id: 'car', label: 'Car Racing', blurb: '2 cars, one plan', bannerId: 'SPORT_CAR', venue: content.sports.car.tracks[0]?.parodyName ?? 'Track' }),
  Object.freeze({ id: 'moto', label: 'Motorcycle', blurb: '2 bikes, one plan', bannerId: 'SPORT_MOTO', venue: content.sports.moto.tracks[0]?.parodyName ?? 'Track' }),
]);

function venueName(sport, id) {
  return content.sports[sport].venues.find((row) => row.id === id)?.parodyName ?? 'Venue';
}

export const BANNER_INFO = Object.freeze(SPORTS.map((sport) => Object.freeze({
  id: sport.bannerId,
  sport: sport.id,
  label: sport.label,
})));

export const BANNERS = Object.freeze(BANNER_INFO.map((banner) => banner.id));

export function presentCard(card) {
  if (!card) return null;
  const passive = card.role === 'COACH' ? (ADAPTER_TUNING.coachPassive[card.id] ?? 'none') : null;
  return {
    id: card.id,
    sport: card.sport,
    role: card.role,
    roles: card.roles.slice(),
    roleLabel: card.roleLabel,
    parodyName: card.parodyName,
    vehicleName: card.vehicleName ?? null,
    rarity: card.rarity,
    team: card.team,
    teamId: card.teamId ?? null,
    stats: card.stats ? { ...card.stats } : null,
    balance: card.balance,
    status: card.status,
    art: { slot: 'portrait', subjectId: card.id, contentSlot: card.art?.slot ?? card.id, placeholder: true },
    passiveKey: passive,
    passive: passive ? `${ADAPTER_TUNING.coachPassiveLabel[passive] ?? ''} PROPOSED.`.trim() : null,
    fictional: card.fictional === true,
  };
}

export function listPublicCards() {
  return ALL_CARDS.map((card) => presentCard(card));
}

export function getCard(id) {
  return presentCard(BY_ID.get(id) ?? null);
}

export function cardsOfSport(sport) {
  return (content.sports[sport]?.cards ?? []).map((card) => presentCard(card));
}

export function teamsOf(sport) {
  return content.sports[sport]?.teams ?? [];
}

function starterIds() {
  const ids = [];
  const s = ADAPTER_TUNING.starter;
  for (const card of content.sports.football.cards) {
    if (card.role !== 'COACH' && s.football.teams.includes(card.team)) ids.push(card.id);
  }
  ids.push(...s.football.coachIds, ...s.basket.ids, ...s.basket.coachIds, ...s.car.ids, ...s.moto.ids);
  return ids.filter((id) => BY_ID.has(id));
}

export const STARTER_OWNED = Object.freeze(starterIds());

export const AWAY = Object.freeze({
  football: Object.freeze({ name: ADAPTER_TUNING.opponents.football.team, formation: ADAPTER_TUNING.opponents.football.formation }),
  basket: Object.freeze({ name: ADAPTER_TUNING.opponents.basket.team, scheme: ADAPTER_TUNING.opponents.basket.scheme }),
  car: Object.freeze({ name: 'The grid' }),
  moto: Object.freeze({ name: 'The grid' }),
});

/** Opponent cards for ball sports (original sides). Race fields are built from teams in simulate.js. */
export function opponentsFor(sport) {
  const team = ADAPTER_TUNING.opponents[sport]?.team;
  if (!team) return [];
  return cardsOfSport(sport).filter((card) => card.team === team);
}

export function poolForBanner(bannerId) {
  const sport = BANNER_INFO.find((banner) => banner.id === bannerId)?.sport;
  return cardsOfSport(sport);
}

export function sportMeta(sportId) {
  return SPORTS.find((sport) => sport.id === sportId) ?? null;
}

function tactic(sport, id) {
  return content.sports[sport].tactics.find((row) => row.id === id) ?? null;
}

function chip(label, summary) {
  return Object.freeze({ label, blurb: summary ? `${summary} PROPOSED.` : 'PROPOSED.' });
}

function buildDisplayTuning() {
  const banner = content.tuning.banners.SPORT_FOOTBALL;
  const cost = banner.pullCostG;
  const formations = {};
  for (const row of content.sports.football.formations) formations[row.shape] = chip(row.parodyName, row.summary);
  const schemes = content.sports.basket.schemes;
  const car = (id) => tactic('car', id);
  const moto = (id) => tactic('moto', id);
  return Object.freeze({
    status: 'PROPOSED',
    balance: 'BALANCE_PLACEHOLDER',
    previewStartingG: ADAPTER_TUNING.previewStartingG,
    pullCostG: cost,
    pull10CostG: cost * 10,
    pity: Object.freeze({ epic: banner.pity.Epic, ex: banner.pity.EX }),
    rewards: content.tuning.eventRewardsG,
    matchLengths: content.tuning.matchLengths,
    football: Object.freeze({ formations: Object.freeze(formations) }),
    basket: Object.freeze({
      schemes: Object.freeze({
        man: chip(schemes[0]?.parodyName ?? 'Man-to-man', schemes[0]?.summary),
        zone: chip(schemes[1]?.parodyName ?? 'Zone', schemes[1]?.summary),
        matchup: chip(schemes[2]?.parodyName ?? 'Matchup zone', schemes[2]?.summary),
      }),
      paces: Object.freeze({
        slow: chip('Slow', 'Fewer trips up the floor.'),
        even: chip('Even', 'A steady clock.'),
        fast: chip('Fast', 'More shots, more wheeze.'),
      }),
    }),
    car: Object.freeze({
      tyres: Object.freeze({
        soft: chip(car('SPC_CAR_TAC_001')?.parodyName ?? 'Soft', car('SPC_CAR_TAC_001')?.summary),
        medium: chip(car('SPC_CAR_TAC_002')?.parodyName ?? 'Medium', car('SPC_CAR_TAC_002')?.summary),
        hard: chip(car('SPC_CAR_TAC_003')?.parodyName ?? 'Hard', car('SPC_CAR_TAC_003')?.summary),
        inter: chip(car('SPC_CAR_TAC_004')?.parodyName ?? 'Inter', car('SPC_CAR_TAC_004')?.summary),
        wet: chip(car('SPC_CAR_TAC_005')?.parodyName ?? 'Wet', car('SPC_CAR_TAC_005')?.summary),
      }),
      setups: Object.freeze({
        speed: chip('Speed', 'Aero leans to the straights.'),
        balanced: chip('Balanced', 'No aero lean.'),
        handling: chip('Handling', 'Aero leans to the corners.'),
      }),
    }),
    moto: Object.freeze({
      tyres: Object.freeze({
        soft: chip(moto('SPC_MOTO_TAC_001')?.parodyName ?? 'Soft', moto('SPC_MOTO_TAC_001')?.summary),
        medium: chip(moto('SPC_MOTO_TAC_002')?.parodyName ?? 'Medium', moto('SPC_MOTO_TAC_002')?.summary),
        hard: chip(moto('SPC_MOTO_TAC_003')?.parodyName ?? 'Hard', moto('SPC_MOTO_TAC_003')?.summary),
        wet: chip(moto('SPC_MOTO_TAC_004')?.parodyName ?? 'Wet', moto('SPC_MOTO_TAC_004')?.summary),
      }),
      setups: Object.freeze({
        speed: chip(moto('SPC_MOTO_TAC_005')?.parodyName ?? 'Speed', moto('SPC_MOTO_TAC_005')?.summary),
        handling: chip(moto('SPC_MOTO_TAC_006')?.parodyName ?? 'Handling', moto('SPC_MOTO_TAC_006')?.summary),
        balanced: chip(moto('SPC_MOTO_TAC_007')?.parodyName ?? 'Balanced', moto('SPC_MOTO_TAC_007')?.summary),
        wet: chip(moto('SPC_MOTO_TAC_008')?.parodyName ?? 'Wet', moto('SPC_MOTO_TAC_008')?.summary),
      }),
    }),
  });
}

const DISPLAY_TUNING = buildDisplayTuning();

export function getTuning() {
  return DISPLAY_TUNING;
}
