import { STAT_KEYS } from './discover.mjs';

const ROLES = {
  football: ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'],
  basket: ['PG', 'SG', 'SF', 'PF', 'C'],
  car: ['A', 'B'],
  moto: ['A', 'B'],
};

/**
 * @param {'football'|'basket'|'car'|'moto'} sport
 * @param {string} prefix
 */
export function lineup(sport, prefix) {
  return ROLES[sport].map((role, index) => ({
    id: `${prefix}_${index + 1}`,
    sport,
    role,
    parodyName: `Placeholder ${prefix} ${index + 1}`,
    rarity: 'N',
    team: 'Placeholder XI',
    stats: Object.fromEntries(STAT_KEYS[sport].map((key) => [key, 40 + index])),
    balance: 'BALANCE_PLACEHOLDER',
    status: 'PROPOSED',
  }));
}

/**
 * Contract input: simulate({ seed, home, away|field, tactics, tuning }).
 * @param {'football'|'basket'|'car'|'moto'} sport
 * @param {number} seed
 */
export function simInput(sport, seed) {
  const home = {
    id: `${sport}_home`,
    formation: sport === 'football' ? '4-3-3' : null,
    lineup: lineup(sport, 'H'),
    coach: null,
  };
  const away = {
    id: `${sport}_away`,
    formation: home.formation,
    lineup: lineup(sport, 'A'),
    coach: null,
  };
  return {
    seed,
    home,
    away,
    field: [home, away],
    tactics: {},
    tuning: { balance: 'BALANCE_PLACEHOLDER', status: 'PROPOSED' },
  };
}
