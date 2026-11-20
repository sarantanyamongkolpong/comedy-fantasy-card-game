/**
 * Sport v0.6 integration: web/sport reads real content and real src/sport modules.
 * Status PROPOSED. Numbers are BALANCE_PLACEHOLDER.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, test } from 'node:test';

import { renderPublicContent } from '../../../tools/sport-web/build-public-content.mjs';
import {
  BANNERS,
  CONTENT,
  STARTER_OWNED,
  getCard,
  listPublicCards,
  simulateSport,
  getTuning,
} from '../../../web/sport/live/index.js';
import { buildDefaultLineups, flatRoles } from '../../../web/sport/lineup.js';
import * as session from '../../../web/sport/session.js';
import { deserialize, serialize } from '../../../src/save/index.js';
import { loadGameApi } from '../../../web/js/game-api.js';
import { createStarterProfile } from '../../../web/js/profile.js';

const root = new URL('../../../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const SPORTS = ['football', 'basket', 'car', 'moto'];

function realTokens() {
  const tokens = new Set();
  const dir = new URL('content/v06/sport/', root);
  for (const sport of SPORTS) {
    for (const file of readdirSync(new URL(`${sport}/`, dir))) {
      const json = JSON.parse(readFileSync(new URL(`${sport}/${file}`, dir), 'utf8'));
      const rows = Object.values(json).find(Array.isArray) ?? [];
      for (const row of rows) {
        if (row.real?.name) tokens.add(row.real.name);
        if (row.real?.url) tokens.add(row.real.url);
        for (const id of row.real?.identities ?? []) tokens.add(id);
      }
    }
  }
  return [...tokens].filter((token) => token.length > 3);
}

function liveFiles() {
  const dir = new URL('web/sport/live/', root);
  return readdirSync(dir).map((name) => ({ name, text: readFileSync(new URL(name, dir), 'utf8') }));
}

function lineupInput(sport, owned) {
  const lineups = buildDefaultLineups(owned);
  const lineup = lineups[sport];
  const home = lineup.slots.map((id) => getCard(id));
  return {
    home,
    tactics: {
      ...lineup,
      coach: getCard(lineup.coachId),
      webRoles: sport === 'football' ? flatRoles(lineup.formation) : [],
      bench: owned.filter((card) => card.sport === sport && card.role !== 'COACH' && !lineup.slots.includes(card.id)),
    },
  };
}

describe('sport v0.6 live content', () => {
  test('content.public.json matches a fresh build from content/v06/sport/index.json', () => {
    assert.equal(read('web/sport/live/content.public.json'), renderPublicContent());
  });

  test('no real names, identities, or source URLs ship in web/sport/live', () => {
    const tokens = realTokens();
    assert.ok(tokens.length > 50, 'expected the data stream real blocks to be discoverable');
    for (const file of liveFiles()) {
      for (const token of tokens) assert.equal(file.text.includes(token), false, `${file.name} contains a private token`);
      assert.equal(/"real"\s*:/.test(file.text), false, `${file.name} carries a real block`);
    }
  });

  test('no LOCKED or PRODUCTION_READY status anywhere in the live adapter', () => {
    for (const file of liveFiles()) {
      assert.equal(/\bLOCKED\b|PRODUCTION_READY/.test(file.text.replace(/never LOCKED|not LOCKED|none of it is LOCKED/gi, '')), false, file.name);
    }
  });

  test('every content card is presented with parody fields and has a replaceable art slot', () => {
    const manifest = JSON.parse(read('web/sport/art-manifest.json'));
    const subjects = new Set(manifest.assets.map((asset) => asset.subjectId));
    const cards = listPublicCards();
    assert.equal(cards.length, CONTENT.sports.football.cards.length + CONTENT.sports.basket.cards.length + CONTENT.sports.car.cards.length + CONTENT.sports.moto.cards.length);
    for (const card of cards) {
      assert.ok(subjects.has(card.id), `${card.id} has no art slot`);
      assert.equal(card.status, 'PROPOSED');
      assert.equal(card.balance, 'BALANCE_PLACEHOLDER');
      assert.equal('real' in card, false);
      assert.ok(card.parodyName.length > 0);
    }
  });

  test('tuning comes from content tuning.json (pull cost, pity) and stays PROPOSED', () => {
    const tuning = getTuning();
    const banner = CONTENT.tuning.banners.SPORT_FOOTBALL;
    assert.equal(tuning.pullCostG, banner.pullCostG);
    assert.equal(tuning.pity.epic, banner.pity.Epic);
    assert.equal(tuning.pity.ex, banner.pity.EX);
    assert.equal(tuning.status, 'PROPOSED');
  });
});

describe('sport v0.6 live sims (real src/sport engines)', () => {
  const owned = STARTER_OWNED.map((id) => getCard(id));
  for (const sport of SPORTS) {
    test(`${sport}: deterministic per seed, parody-only text, PROPOSED reward`, () => {
      const input = lineupInput(sport, owned);
      const a = simulateSport({ sport, seed: `IT_${sport}_1`, eventId: `IT_${sport}_1`, ...input });
      const b = simulateSport({ sport, seed: `IT_${sport}_1`, eventId: `IT_${sport}_1`, ...input });
      assert.deepEqual(a, b);
      assert.equal(a.engine, 'src/sport');
      assert.ok(a.events.length > 5);
      assert.ok(a.fullEvents.length >= a.events.length);
      assert.equal(a.rewards.status, 'PROPOSED');
      assert.ok(Number.isInteger(a.rewards.G) && a.rewards.G >= 0);
      assert.ok(a.result.mvp?.parodyName);
      const tokens = realTokens();
      const text = JSON.stringify(a);
      for (const token of tokens) assert.equal(text.includes(token), false, `${sport} sim leaked a private token`);
      for (const event of a.events) {
        assert.equal(typeof event.clock, 'string');
        assert.ok(event.board);
      }
      if (sport === 'football' || sport === 'basket') {
        const last = a.fullEvents[a.fullEvents.length - 1];
        assert.deepEqual([last.board.home, last.board.away], [a.result.score.home, a.result.score.away]);
        const tallied = a.fullEvents[a.fullEvents.length - 2].board;
        assert.deepEqual([tallied.home, tallied.away], [a.result.score.home, a.result.score.away], 'running board tally matches the final score');
      } else {
        assert.ok(a.result.standings.length >= 20, 'race field fills from content teams');
        assert.equal(a.result.standings.filter((row) => row.mine).length, 2);
      }
    });
  }
  test('different seeds can change the outcome', () => {
    const input = lineupInput('football', owned);
    const scores = new Set();
    for (let i = 0; i < 6; i += 1) scores.add(JSON.stringify(simulateSport({ sport: 'football', seed: `S${i}`, ...input }).result.score));
    assert.ok(scores.size > 1);
  });
});

describe('sport v0.6 live session: wallet, gacha, save', () => {
  test('fresh profile: preview G once, starter roster, rewards idempotent, pulls spend shared G and move pity', () => {
    const profile = { team: [], deck: [] };
    let saves = 0;
    session.setPersistHook(() => { saves += 1; });
    session.resetSession(profile);
    assert.equal(profile.currencyG, getTuning().previewStartingG);
    assert.equal(profile.currency.G, profile.currencyG);
    assert.equal(Object.keys(profile.sport.roster).length, STARTER_OWNED.length);
    for (const sport of SPORTS) {
      const sim = session.runSim(sport);
      const first = session.finishReward();
      const again = session.finishReward();
      assert.equal(first.duplicate, false);
      assert.equal(again.duplicate, true);
      assert.equal(profile.sport.ledger.filter((row) => row.txnId === sim.rewards.claimId).length, 1);
    }
    const before = session.gOf();
    const pull = session.doPull('SPORT_FOOTBALL', 10);
    assert.equal(pull.ok, true);
    assert.equal(pull.chargedG, getTuning().pullCostG * 10);
    assert.equal(session.gOf(), before - pull.chargedG);
    assert.equal(profile.currencyG, session.gOf());
    assert.equal(session.pityOf('SPORT_FOOTBALL').pulls, 10);
    const pool = new Set(CONTENT.sports.football.cards.map((card) => card.id));
    for (const row of pull.results) assert.ok(pool.has(row.id), `${row.id} is not a content card`);
    assert.equal('tuning' in profile.sport, false, 'transient gacha tuning never reaches the save');
    assert.ok(saves > 0, 'persist hook fired');
    session.setPersistHook(null);
  });

  test('explicit 0 G is left alone and a pull fails without charging', () => {
    const profile = { team: [], deck: [], currencyG: 0 };
    session.resetSession(profile);
    assert.equal(session.gOf(), 0);
    const pull = session.doPull('SPORT_CAR', 1);
    assert.equal(pull.ok, false);
    assert.equal(pull.reason, 'INSUFFICIENT_G');
    assert.equal(session.gOf(), 0);
  });

  test('v1 and v2 saves still load, gain an empty sport block, and keep G, pity, and ledger', () => {
    for (const name of ['save-v1.json', 'save-v2.json']) {
      const raw = JSON.parse(read(`tests/sport/qa/fixtures/${name}`));
      const loaded = deserialize(JSON.stringify(raw));
      assert.ok(loaded.sport, `${name} gains profile.sport`);
      assert.deepEqual(Object.keys(loaded.sport).sort(), ['ledger', 'pity', 'roster']);
      assert.equal(loaded.currency.G, raw.profile.currency.G);
      assert.deepEqual(loaded.pity, raw.profile.pity);
      const again = deserialize(serialize(loaded));
      assert.deepEqual(again.sport, loaded.sport);
    }
  });

  test('web save round trip through the real engine-session keeps sport roster, pity, ledger, and shared G', async () => {
    const api = await loadGameApi();
    assert.equal(api.source, 'engine');
    const ui = createStarterProfile(api.catalog);
    session.resetSession(ui);
    session.runSim('car');
    session.finishReward();
    session.doPull('SPORT_MOTO', 10);
    const g = session.gOf();
    const roster = Object.keys(ui.sport.roster).sort();
    const pity = structuredClone(ui.sport.pity);
    const ledger = structuredClone(ui.sport.ledger);
    const text = api.serialize({ profile: ui, match: null, screen: 'map', battleUi: null });
    const top = JSON.parse(text).profile;
    assert.deepEqual(Object.keys(top.sport.roster).sort(), roster, 'saved profile.sport mirrors the roster');
    assert.equal(top.currency.G, g, 'shared G lands on the existing currency.G');
    const back = api.deserialize(text);
    assert.equal(back.profile.currencyG, g);
    assert.deepEqual(Object.keys(back.profile.sport.roster).sort(), roster);
    assert.deepEqual(back.profile.sport.pity, pity);
    assert.deepEqual(back.profile.sport.ledger, ledger);
    session.resetSession(back.profile);
    assert.equal(session.gOf(), g);
    assert.equal(session.pityOf('SPORT_MOTO').pulls, 10);
  });

  test('every sport banner is live', () => {
    assert.deepEqual([...BANNERS], ['SPORT_FOOTBALL', 'SPORT_BASKET', 'SPORT_CAR', 'SPORT_MOTO']);
  });
});
