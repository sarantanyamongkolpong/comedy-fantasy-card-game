import { CAR_ROSTER } from '../car/roster.js';
import { MOTO_ROSTER } from '../moto/roster.js';

/**
 * Preview pools for the four sport banners.
 * Car and moto cards are one combined entry each (driver+car, rider+bike).
 * Football and basket cards are original stand-ins until the data stream lands.
 * `real` is private provenance. Pull results and the saved roster omit it.
 * Rarity placement is an arbitrary placeholder, not a ranking.
 */

const SNAPSHOT = '2026-11-20';
const SEASON = '2026';

function real(name, url) {
  return { name, url, season: SEASON, snapshotDate: SNAPSHOT };
}

function card(fields) {
  const { art: _art, ...rest } = fields;
  return {
    balance: 'BALANCE_PLACEHOLDER',
    status: 'PROPOSED',
    real: null,
    ...rest,
    art: { slot: fields.id, placeholder: true },
  };
}

const CAR_RARITY = ['N', 'R', 'N', 'Epic', 'N', 'R', 'EX', 'N', 'R', 'Epic', 'N', 'R'];
const CAR_REAL = [
  real('Lando Norris', 'https://www.formula1.com/en/drivers/lando-norris'),
  real('Oscar Piastri', 'https://www.formula1.com/en/drivers/oscar-piastri'),
  real('Charles Leclerc', 'https://www.formula1.com/en/drivers/charles-leclerc'),
  real('Lewis Hamilton', 'https://www.formula1.com/en/drivers/lewis-hamilton'),
  real('George Russell', 'https://www.formula1.com/en/drivers/george-russell'),
  real('Kimi Antonelli', 'https://www.formula1.com/en/drivers/kimi-antonelli'),
  real('Max Verstappen', 'https://www.formula1.com/en/drivers/max-verstappen'),
  real('Isack Hadjar', 'https://www.formula1.com/en/drivers/isack-hadjar'),
  real('Nico Hülkenberg', 'https://www.formula1.com/en/drivers/nico-hulkenberg'),
  real('Gabriel Bortoleto', 'https://www.formula1.com/en/drivers/gabriel-bortoleto'),
  real('Carlos Sainz', 'https://www.formula1.com/en/drivers/carlos-sainz'),
  real('Alexander Albon', 'https://www.formula1.com/en/drivers/alexander-albon'),
];

const MOTO_RARITY = ['N', 'R', 'Epic', 'N', 'EX', 'R', 'N', 'R', 'Epic', 'N'];
const MOTO_REAL = [
  real('Marc Márquez', 'https://www.motogp.com/en/riders/marc-marquez/23e50438-a657-4fb0-a190-3262b5472f29'),
  real('Francesco Bagnaia', 'https://www.motogp.com/en/riders/francesco-bagnaia/66b78301-5826-4986-b11e-fa68a7bd77a7'),
  real('Fabio Quartararo', 'https://www.motogp.com/en/riders/fabio-quartararo/bf95d959-6a60-44f1-84b5-ded861e62578'),
  real('Pedro Acosta', 'https://www.motogp.com/en/riders/pedro-acosta/ea39a0af-95d3-4a37-81a7-f332efdb9216'),
  real('Jorge Martín', 'https://www.motogp.com/en/riders/jorge-martin/5b9af34e-da94-4ca2-9c4c-6be0fc8b1bbc'),
  real('Brad Binder', 'https://www.motogp.com/en/riders/brad-binder/ade5ef32-01ea-487c-95ca-491544a668ed'),
  real('Marco Bezzecchi', 'https://www.motogp.com/en/riders/marco-bezzecchi/e622ec5b-5ccf-457c-a67f-ec028f0ddf6e'),
  real('Joan Mir', 'https://www.motogp.com/en/riders/joan-mir/f55f9c34-8621-437b-ae04-ae2418720204'),
  real('Toprak Razgatlıoğlu', 'https://www.motogp.com/en/riders/toprak-razgatlioglu/c883a3b8-17ce-419d-b71b-32c252f6fc7e'),
  real('Ai Ogura', 'https://www.motogp.com/en/riders/ai-ogura/244b6f51-ac33-40ee-876d-9401dc9d1346'),
];

function fromRoster(roster, sport, rarities, reals) {
  return roster.map((entry, index) => card({
    id: entry.id,
    sport,
    role: 'entry',
    parodyName: entry.parodyName,
    rarity: rarities[index],
    team: entry.teamName,
    stats: { ...entry.stats },
    real: reals[index],
  }));
}

function preview(id, sport, role, parodyName, rarity, team, stats) {
  return card({ id, sport, role, parodyName, rarity, team, stats, real: null });
}

const FOOTBALL_STATS = (power, def, speed, sta, acc) => ({ Power: power, Def: def, Speed: speed, Sta: sta, Acc: acc });
const BASKET_STATS = (shooting, def, spd, sta) => ({ Shooting: shooting, Def: def, Spd: spd, Sta: sta });

export const SPORT_BANNERS = Object.freeze(['SPORT_FOOTBALL', 'SPORT_BASKET', 'SPORT_CAR', 'SPORT_MOTO']);

export const SPORT_CATALOG = {
  SPORT_FOOTBALL: [
    preview('SPC_FOOTBALL_PREVIEW_001', 'football', 'athlete', 'Cleats McBagel', 'N', 'Bagel Athletic', FOOTBALL_STATS(60, 55, 62, 70, 58)),
    preview('SPC_FOOTBALL_PREVIEW_002', 'football', 'athlete', 'Whistle Pudding', 'N', 'Pudding Parish', FOOTBALL_STATS(58, 64, 60, 66, 63)),
    preview('SPC_FOOTBALL_PREVIEW_003', 'football', 'athlete', "Gloves O'Mittens", 'R', 'Mitten Town', FOOTBALL_STATS(52, 78, 57, 74, 70)),
    preview('SPC_FOOTBALL_PREVIEW_004', 'football', 'athlete', 'Bench Biscuit', 'R', 'Bagel Athletic', FOOTBALL_STATS(66, 60, 68, 64, 61)),
    preview('SPC_FOOTBALL_PREVIEW_005', 'football', 'coach', 'Tactics Teacup', 'Epic', 'Pudding Parish', FOOTBALL_STATS(70, 72, 65, 80, 75)),
    preview('SPC_FOOTBALL_PREVIEW_006', 'football', 'athlete', 'Captain Crumpet', 'EX', 'Mitten Town', FOOTBALL_STATS(84, 76, 80, 82, 79)),
  ],
  SPORT_BASKET: [
    preview('SPC_BASKET_PREVIEW_001', 'basket', 'athlete', 'Hoop Lemon', 'N', 'Lemon Baskets', BASKET_STATS(62, 58, 64, 70)),
    preview('SPC_BASKET_PREVIEW_002', 'basket', 'athlete', 'Dribble Donut', 'N', 'Donut Court', BASKET_STATS(60, 63, 66, 68)),
    preview('SPC_BASKET_PREVIEW_003', 'basket', 'athlete', 'Rim Ramen', 'R', 'Lemon Baskets', BASKET_STATS(74, 61, 70, 66)),
    preview('SPC_BASKET_PREVIEW_004', 'basket', 'athlete', 'Zone Zucchini', 'R', 'Zucchini Zone', BASKET_STATS(64, 77, 62, 73)),
    preview('SPC_BASKET_PREVIEW_005', 'basket', 'coach', 'Coach Cinnamon', 'Epic', 'Donut Court', BASKET_STATS(72, 75, 68, 80)),
    preview('SPC_BASKET_PREVIEW_006', 'basket', 'athlete', 'Poster Pretzel', 'EX', 'Zucchini Zone', BASKET_STATS(86, 74, 82, 78)),
  ],
  SPORT_CAR: fromRoster(CAR_ROSTER, 'car', CAR_RARITY, CAR_REAL),
  SPORT_MOTO: fromRoster(MOTO_ROSTER, 'moto', MOTO_RARITY, MOTO_REAL),
};

const STATS = {
  football: ['Power', 'Def', 'Speed', 'Sta', 'Acc'],
  basket: ['Shooting', 'Def', 'Spd', 'Sta'],
  car: ['TopSpeed', 'Accel', 'Handling'],
  moto: ['TopSpeed', 'Accel', 'Handling'],
};

const RARITIES = new Set(['N', 'R', 'Epic', 'EX']);

/**
 * @param {object[]} pool
 * @param {string} sport
 */
export function assertPool(pool, sport) {
  if (!Array.isArray(pool) || pool.length === 0) {
    const error = new Error('banner pool is empty');
    error.code = 'BAD_POOL';
    throw error;
  }
  const ids = new Set();
  for (const card of pool) {
    if (!card || typeof card.id !== 'string' || ids.has(card.id)) {
      const error = new Error('pool card id is missing or repeated');
      error.code = 'BAD_POOL';
      throw error;
    }
    ids.add(card.id);
    if (card.sport !== sport) {
      const error = new Error(`card ${card.id} is not on the ${sport} banner`);
      error.code = 'BAD_POOL';
      throw error;
    }
    if (!RARITIES.has(card.rarity)) {
      const error = new Error(`card ${card.id} rarity must be N, R, Epic, or EX`);
      error.code = 'BAD_POOL';
      throw error;
    }
    if (card.status === 'LOCKED' || card.status === 'PRODUCTION_READY') {
      const error = new Error(`card ${card.id} must stay PROPOSED`);
      error.code = 'BAD_POOL';
      throw error;
    }
    for (const key of STATS[sport]) {
      if (!Number.isInteger(card.stats?.[key])) {
        const error = new Error(`card ${card.id} is missing ${key}`);
        error.code = 'BAD_POOL';
        throw error;
      }
    }
  }
}

for (const bannerId of SPORT_BANNERS) {
  const sport = {
    SPORT_FOOTBALL: 'football',
    SPORT_BASKET: 'basket',
    SPORT_CAR: 'car',
    SPORT_MOTO: 'moto',
  }[bannerId];
  assertPool(SPORT_CATALOG[bannerId], sport);
}
