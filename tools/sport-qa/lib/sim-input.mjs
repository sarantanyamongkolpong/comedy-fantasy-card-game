import { STAT_KEYS } from './discover.mjs';

const FOOTBALL_XI = ['GK', 'RB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CM', 'RW', 'ST', 'LW'];
const BASKET_FIVE = ['PG', 'SG', 'SF', 'PF', 'C'];

function players(sport, prefix, roles) {
  return roles.map((role, index) => ({
    id: `${prefix}_${index + 1}`,
    sport,
    role,
    position: role,
    parodyName: `Placeholder ${prefix} ${index + 1}`,
    rarity: 'N',
    team: 'Placeholder XI',
    stats: Object.fromEntries(STAT_KEYS[sport].map((key) => [key, 40 + index])),
    balance: 'BALANCE_PLACEHOLDER',
    status: 'PROPOSED',
  }));
}

function ballSide(sport, prefix, roles) {
  const squad = players(sport, prefix, roles);
  return {
    id: `${sport}_${prefix}`,
    parodyName: `Placeholder ${prefix}`,
    players: squad,
    coach: null,
    lineupIds: squad.map((player) => player.id),
  };
}

function raceSide(sport, prefix) {
  return {
    teamId: `${sport}_${prefix}`,
    parodyName: `Placeholder ${prefix}`,
    entries: [0, 1].map((index) => ({
      id: `${sport}_${prefix}_${index + 1}`,
      parodyName: `Placeholder ${prefix} ${index + 1}`,
      stats: Object.fromEntries(STAT_KEYS[sport].map((key) => [key, 50 + index])),
      balance: 'BALANCE_PLACEHOLDER',
      status: 'PROPOSED',
    })),
  };
}

/**
 * Input that matches both the contract and the landed sim readers.
 * Ball sims read `players` plus per-side tactics. Race sims read `teamId` and two `entries`.
 * @param {'football'|'basket'|'car'|'moto'} sport
 * @param {number} seed
 */
export function simInput(sport, seed) {
  const tuning = { balance: 'BALANCE_PLACEHOLDER', status: 'PROPOSED' };
  if (sport === 'car' || sport === 'moto') {
    return { seed, home: raceSide(sport, 'home'), tactics: {}, tuning };
  }
  const roles = sport === 'football' ? FOOTBALL_XI : BASKET_FIVE;
  const home = ballSide(sport, 'H', roles);
  const away = ballSide(sport, 'A', roles);
  const tactics = sport === 'football'
    ? {
      home: { formation: '4-3-3', lineup: home.lineupIds },
      away: { formation: '4-3-3', lineup: away.lineupIds },
    }
    : {
      home: { scheme: 'man-to-man', pace: 'balanced', lineup: home.lineupIds },
      away: { scheme: 'man-to-man', pace: 'balanced', lineup: away.lineupIds },
    };
  return { seed, home, away, tactics, tuning };
}
