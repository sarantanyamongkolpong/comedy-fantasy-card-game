/**
 * Sim-ball fixtures. Stats are BALANCE_PLACEHOLDER values for tests only.
 * Names are parody labels. Real athlete names are not stored here.
 */
import { FORMATIONS } from '../../../src/sport/football/formations.mjs';
import { POSITIONS } from '../../../src/sport/basket/schemes.mjs';

const FOOTBALL_KEYS = ['Power', 'Def', 'Speed', 'Sta', 'Acc'];

export function footballStats(rating, stamina = rating) {
  return {
    Power: rating,
    Def: rating,
    Speed: rating,
    Sta: stamina,
    Acc: rating,
    balance: 'BALANCE_PLACEHOLDER',
  };
}

export function basketballStats(rating, stamina = rating) {
  return {
    Shooting: rating,
    Def: rating,
    Spd: rating,
    Sta: stamina,
    balance: 'BALANCE_PLACEHOLDER',
  };
}

function footballPlayer(id, parodyName, role, rating, stamina) {
  const stats = footballStats(rating, stamina);
  delete stats.balance;
  return {
    id,
    parodyName,
    role,
    stats,
    balance: 'BALANCE_PLACEHOLDER',
  };
}

function basketPlayer(id, parodyName, position, rating, stamina) {
  const stats = basketballStats(rating, stamina);
  delete stats.balance;
  return {
    id,
    parodyName,
    position,
    stats,
    balance: 'BALANCE_PLACEHOLDER',
  };
}

/**
 * @param {{ name: string, formation?: string, rating?: number, stamina?: number, bench?: number, coach?: object }} options
 */
export function footballSide(options) {
  const formation = options.formation ?? '4-3-3';
  const rating = options.rating ?? 58;
  const stamina = options.stamina ?? rating;
  const benchCount = options.bench ?? 3;
  const roles = FORMATIONS[formation].slots.map((slot) => slot.role);
  const players = roles.map((role, index) => footballPlayer(
    `${options.name}-${index}`,
    `${options.name} ${role} ${index}`,
    role,
    rating,
    stamina,
  ));
  const bench = [];
  for (let index = 0; index < benchCount; index += 1) {
    const role = index === 0 ? 'GK' : roles[(index % (roles.length - 1)) + 1];
    bench.push(footballPlayer(
      `${options.name}-b${index}`,
      `${options.name} bench ${index}`,
      role,
      rating,
      stamina,
    ));
  }
  return {
    id: options.name,
    parodyName: options.name,
    coach: options.coach ?? null,
    players,
    bench,
    tactics: { formation, lineup: players.map((player) => player.id) },
  };
}

/**
 * @param {{ name: string, rating?: number, stamina?: number, bench?: number, scheme?: string, pace?: string, coach?: object }} options
 */
export function basketSide(options) {
  const rating = options.rating ?? 58;
  const stamina = options.stamina ?? rating;
  const benchCount = options.bench ?? 3;
  const players = POSITIONS.map((position) => basketPlayer(
    `${options.name}-${position}`,
    `${options.name} ${position}`,
    position,
    rating,
    stamina,
  ));
  const bench = [];
  for (let index = 0; index < benchCount; index += 1) {
    const position = POSITIONS[index % POSITIONS.length];
    bench.push(basketPlayer(
      `${options.name}-b${index}`,
      `${options.name} bench ${index}`,
      position,
      rating,
      stamina,
    ));
  }
  return {
    id: options.name,
    parodyName: options.name,
    coach: options.coach ?? null,
    players,
    bench,
    tactics: {
      scheme: options.scheme ?? 'man-to-man',
      pace: options.pace ?? 'balanced',
      lineup: players.map((player) => player.id),
    },
  };
}

export function footballMatchInput(seed, homeOptions, awayOptions, extra = {}) {
  const home = footballSide(homeOptions);
  const away = footballSide(awayOptions);
  return {
    seed,
    home,
    away,
    tactics: {
      home: home.tactics,
      away: away.tactics,
      extraTime: extra.extraTime === true,
    },
    tuning: extra.tuning,
  };
}

export function basketMatchInput(seed, homeOptions, awayOptions, extra = {}) {
  const home = basketSide(homeOptions);
  const away = basketSide(awayOptions);
  return {
    seed,
    home,
    away,
    tactics: { home: home.tactics, away: away.tactics },
    tuning: extra.tuning,
  };
}

export function statKeysFootball() {
  return FOOTBALL_KEYS.slice();
}

/** Real-world names the sim must not invent. Parody inputs are the caller's. */
export const REAL_NAME_TOKENS = [
  'Messi',
  'Haaland',
  'Mbappe',
  'Mbappé',
  'Courtois',
  'Bellingham',
  'Vinicius',
  'Vinícius',
  'Yamal',
  'Guardiola',
  'Ancelotti',
  'Wembanyama',
  'Jokic',
  'Jokić',
  'Antetokounmpo',
  'Gilgeous',
  'Popovich',
  'LeBron',
];
