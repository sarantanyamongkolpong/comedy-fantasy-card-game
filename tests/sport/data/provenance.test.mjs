import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { SAVE_VERSION } from '../../../src/schema/constants.js';
import {
  BANNERS,
  SPORT_RARITIES,
  STAT_KEYS,
  containsRealName,
  loadSportBundle,
  validateSportBundle,
} from '../../../tools/validate-sport-provenance.mjs';

const repoRoot = new URL('../../..', import.meta.url);
const bundle = loadSportBundle(repoRoot.pathname);

function athletes(sport) {
  return bundle.docs[`${sport}/athletes.json`].athletes;
}

function failCopy(mutate) {
  const copy = structuredClone(bundle);
  mutate(copy);
  return validateSportBundle(copy);
}

test('the sport pack passes provenance checks', () => {
  const result = validateSportBundle(bundle);
  assert.equal(result.ok, true, result.errors.slice(0, 8).map((error) => `${error.code} ${error.path}: ${error.message}`).join('\n'));
  assert.equal(result.cardCount, 104);
});

test('a player-facing field that repeats a real name fails', () => {
  const result = failCopy((copy) => {
    const card = copy.docs['football/athletes.json'].athletes[0];
    card.parodyName = card.real.name;
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === 'REAL_NAME_LEAK'));
});

test('a wrong football stat key fails', () => {
  const result = failCopy((copy) => {
    const stats = copy.docs['football/athletes.json'].athletes[0].stats;
    delete stats.Acc;
    stats.Luck = { value: 40, balance: 'BALANCE_PLACEHOLDER', status: 'PROPOSED' };
  });
  assert.ok(result.errors.some((error) => error.code === 'STAT_KEYS'));
});

test('a stamina key on a racing card fails', () => {
  const result = failCopy((copy) => {
    const stats = copy.docs['car/athletes.json'].athletes[0].stats;
    stats.Sta = { value: 40, balance: 'BALANCE_PLACEHOLDER', status: 'PROPOSED' };
  });
  assert.ok(result.errors.some((error) => error.code === 'STAT_KEYS'));
});

test('a rarity outside N/R/Epic/EX fails', () => {
  const result = failCopy((copy) => {
    copy.docs['basket/athletes.json'].athletes[0].rarity = 'UR';
  });
  assert.ok(result.errors.some((error) => error.code === 'RARITY'));
});

test('an untagged placeholder number fails', () => {
  const result = failCopy((copy) => {
    copy.docs['tuning.json'].banners.SPORT_FOOTBALL.pullCostG = 100;
  });
  assert.ok(result.errors.some((error) => error.code === 'UNTAGGED_NUMBER'));
});

test('a moto H/M/L trait stored on a real block fails', () => {
  const result = failCopy((copy) => {
    copy.docs['moto/athletes.json'].athletes[0].real.handling = 'H';
  });
  assert.ok(result.errors.some((error) => error.code === 'MOTO_TRAIT'));
});

test('cards use the locked stat keys, allowed rarities, and placeholder tags', () => {
  const tuning = bundle.docs['tuning.json'];
  for (const sport of ['football', 'basket', 'car', 'moto']) {
    for (const card of athletes(sport)) {
      assert.deepEqual(Object.keys(card.stats), [...STAT_KEYS[sport]], card.id);
      assert.ok(SPORT_RARITIES.includes(card.rarity), card.id);
      assert.equal(card.balance, 'BALANCE_PLACEHOLDER', card.id);
      assert.equal(card.status, 'PROPOSED', card.id);
      assert.equal(card.art.placeholder, true, card.id);
      assert.equal(tuning.rarityByCardId[card.id].rarity, card.rarity, card.id);
      for (const key of STAT_KEYS[sport]) {
        const stat = card.stats[key];
        assert.equal(stat.balance, 'BALANCE_PLACEHOLDER', `${card.id}.${key}`);
        assert.equal(stat.status, 'PROPOSED', `${card.id}.${key}`);
        assert.equal(typeof stat.value, 'number', `${card.id}.${key}`);
        assert.equal(tuning.statsByCardId[card.id][key].value, stat.value);
      }
    }
  }
  for (const card of [...athletes('car'), ...athletes('moto')]) {
    assert.equal(card.combined, true, card.id);
    assert.equal(card.role, 'entry', card.id);
    assert.equal(typeof card.vehicleParodyName, 'string', card.id);
  }
  for (const card of athletes('moto')) {
    assert.equal(card.gameTraits.gameOnly, true, card.id);
    assert.equal(card.real?.handling, undefined, card.id);
  }
});

test('football can field 11v11 with a goalkeeper and a small bench', () => {
  const lineups = bundle.docs['football/teams.json'].lineups;
  const byId = new Map(athletes('football').map((card) => [card.id, card]));
  for (const side of ['home', 'away']) {
    const lineup = lineups.find((row) => row.side === side);
    assert.equal(lineup.starters.length, 11, side);
    assert.ok(lineup.bench.length >= 2, side);
    const keepers = lineup.starters.filter((id) => byId.get(id).role === 'GK');
    assert.equal(keepers.length, 1, side);
  }
  assert.ok(athletes('football').some((card) => card.fictional === true && card.team === 'Gherkin Rovers'));
});

test('basketball can field 5v5 with a bench', () => {
  const lineups = bundle.docs['basket/teams.json'].lineups;
  for (const side of ['home', 'away']) {
    const lineup = lineups.find((row) => row.side === side);
    assert.equal(lineup.starters.length, 5, side);
    assert.ok(lineup.bench.length >= 2, side);
  }
  assert.ok(athletes('basket').some((card) => card.fictional === true && card.team === 'Gravy Garden'));
});

test('car and moto grids give every team two combined entries', () => {
  for (const sport of ['car', 'moto']) {
    const teams = bundle.docs[`${sport}/teams.json`].teams;
    const grid = bundle.docs[`${sport}/teams.json`].grids[0].entryIds;
    assert.equal(teams.length, 11, sport);
    for (const team of teams) assert.equal(team.entryIds.length, 2, team.parodyName);
    assert.equal(grid.length, 22, sport);
    assert.ok(teams.some((team) => team.fictional === true), sport);
  }
});

test('tuning keeps four banners, pity 100/200, costs, rewards, and lengths', () => {
  const tuning = bundle.docs['tuning.json'];
  assert.deepEqual(Object.keys(tuning.banners), [...BANNERS]);
  for (const bannerId of BANNERS) {
    const banner = tuning.banners[bannerId];
    assert.equal(banner.pity.Epic.value, 100, bannerId);
    assert.equal(banner.pity.EX.value, 200, bannerId);
    assert.equal(banner.pity.Epic.balance, 'BALANCE_PLACEHOLDER');
    assert.equal(banner.pullCostG.status, 'PROPOSED');
    const weights = SPORT_RARITIES.map((rarity) => banner.odds[rarity].value);
    assert.equal(weights.reduce((sum, value) => sum + value, 0), banner.odds.weightPer.value);
  }
  assert.equal(tuning.matchLengths.football.simMinutes.value, 90);
  assert.equal(tuning.matchLengths.basket.quarters.value, 4);
  assert.equal(tuning.matchLengths.car.grandPrixLaps.value, 12);
  assert.equal(tuning.matchLengths.moto.sprintLaps.value, 6);
  assert.equal(typeof tuning.eventRewardsG.football.win.value, 'number');
  assert.equal(tuning.eventRewardsG.car.dnf.balance, 'BALANCE_PLACEHOLDER');
});

test('every sourced identity has a url, season, and snapshot in sources.json', () => {
  const rows = bundle.docs['sources.json'].sources;
  const keyed = new Set(rows.map((row) => `${row.url}|${row.season}|${row.snapshotDate}|${row.real.name}`));
  assert.ok(rows.length > 100);
  for (const row of rows) {
    assert.match(row.url, /^https:\/\//, row.id);
    assert.match(row.snapshotDate, /^\d{4}-\d{2}-\d{2}$/, row.id);
    assert.ok(row.season.trim().length > 0, row.id);
  }
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (value.fictional !== true && value.real?.url) {
      const key = `${value.real.url}|${value.real.season}|${value.real.snapshotDate}|${value.real.name}`;
      assert.equal(keyed.has(key), true, value.id ?? value.real.name);
    }
    for (const child of Object.values(value)) visit(child);
  };
  for (const [file, doc] of Object.entries(bundle.docs)) {
    if (file !== 'sources.json') visit(doc);
  }
});

test('close parody names are listed for review and renamed strings are not the shipped name', () => {
  const items = bundle.docs['ipReview.json'].items;
  const byName = new Map(items.map((item) => [item.parodyName, item]));
  assert.equal(byName.get('Lion Messo').closeness, 'HIGH');
  assert.equal(byName.get('Carousel Six').closeness, 'RENAMED');
  assert.equal(byName.get('Horizon Mirage').real.workbookParody, 'Joan Mirage');
  for (const item of items) {
    if (item.closeness !== 'RENAMED') continue;
    assert.equal(containsRealName(item.parodyName, item.real.name), false, item.parodyName);
    assert.notEqual(item.parodyName, item.real.workbookParody);
  }
});

test('the artist sheet stays free of real identities', () => {
  const sheet = readFileSync(new URL('../../../docs/sport_v06/PARODY_NAMES.md', import.meta.url), 'utf8');
  const chunks = [];
  for (const line of sheet.split('\n')) {
    if (line.startsWith('|') && !line.startsWith('| ---')) chunks.push(...line.split('|').slice(1, -1));
    else if (line.trim()) chunks.push(line);
  }
  const names = [];
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (typeof value.real?.name === 'string') names.push(value.real.name);
    if (Array.isArray(value.real?.identities)) names.push(...value.real.identities);
    for (const child of Object.values(value)) visit(child);
  };
  visit(bundle.docs);
  for (const name of new Set(names)) {
    for (const chunk of chunks) assert.equal(containsRealName(chunk, name), false, name);
  }
  assert.equal(sheet.includes('http'), false);
  assert.equal(sheet.includes('Lionel Messi'), false);
});

test('sport data does not bump the v0.5 save version', () => {
  assert.equal(SAVE_VERSION, 2);
});
