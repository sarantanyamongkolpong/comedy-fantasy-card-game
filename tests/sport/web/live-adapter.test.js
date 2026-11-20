import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
// Integration (PROPOSED): the web stream's fixture adapters were removed because the fixture
// catalog carried real names. These checks now run against web/sport/live (content + src/sport).
import { BANNERS, STARTER_OWNED, getCard, listPublicCards, opponentsFor, sportMeta, getTuning } from '../../../web/sport/live/catalog.js';
import { buildDefaultLineups } from '../../../web/sport/lineup.js';
import { grantG, pullSport, emptyPity } from '../../../web/sport/live/economy.js';
import { simulateSport } from '../../../web/sport/live/simulate.js';
import { artManifest } from '../../../web/sport/art.js';
import { resetSession, runSim, doPull, gOf, finishReward } from '../../../web/sport/session.js';

/** Real-name provenance lives only in content/v06/sport. Tests read it there, never from web/. */
function privateRealNames() {
  const names = [];
  const dir = new URL('../../../content/v06/sport/', import.meta.url);
  for (const sport of ['football', 'basket', 'car', 'moto']) {
    for (const file of readdirSync(new URL(`${sport}/`, dir))) {
      const json = JSON.parse(readFileSync(new URL(`${sport}/${file}`, dir), 'utf8'));
      const walk = (value) => {
        if (Array.isArray(value)) return value.forEach(walk);
        if (!value || typeof value !== 'object') return;
        if (typeof value.real?.name === 'string') names.push(value.real.name);
        for (const id of value.real?.identities ?? []) names.push(id);
        for (const child of Object.values(value)) walk(child);
      };
      walk(json);
    }
  }
  return names;
}

function freshState() {
  const tuning = getTuning();
  const pity = {};
  for (const bannerId of BANNERS) pity[bannerId] = emptyPity();
  return {
    currency: { G: tuning.previewStartingG },
    sport: { roster: {}, pity, ledger: [] },
  };
}

test('each sport sim is deterministic and keeps real names out of the log', () => {
  const parodies = listPublicCards().map((card) => card.parodyName).join('\n');
  const forbidden = privateRealNames().filter((name) => name && name.length > 4 && !parodies.includes(name));
  assert.ok(forbidden.length > 50, 'real-name provenance was found in content');
  const hosts = ['uefa.com', 'fifa.com', 'nba.com', 'wnba.com', 'formula1.com', 'motogp.com'];
  for (const sport of ['football', 'basket', 'car', 'moto']) {
    const lineups = buildDefaultLineups(STARTER_OWNED.map((id) => getCard(id)));
    const home = lineups[sport].slots.map((id) => getCard(id));
    assert.ok(Array.isArray(opponentsFor(sport)));
    const input = {
      sport,
      seed: 7,
      home,
      tactics: { formation: '4-3-3', scheme: 'man', pace: 'even', tyre: 'soft', setup: 'speed', venue: sportMeta(sport).venue },
    };
    const first = simulateSport(input);
    const second = simulateSport(input);
    assert.deepEqual(first, second);
    assert.ok(first.events.length > 3);
    assert.equal(first.rewards.status, 'PROPOSED');
    assert.equal(first.events.every((event) => Number.isFinite(event.t) && event.type && event.text), true);
    const blob = JSON.stringify(first);
    for (const name of forbidden) assert.equal(blob.includes(name), false, `${sport} leaked ${name}`);
    for (const host of hosts) assert.equal(blob.includes(host), false, host);
    if (sport === 'football' || sport === 'basket') {
      assert.ok(first.result.score);
    } else {
      assert.ok(first.result.standings.length >= 20);
      assert.equal(first.result.standings.filter((row) => row.mine).length, 2);
    }
  }
});

test('pulls spend G per pull, isolate pity, and pay rewards once', () => {
  const tuning = getTuning();
  const state = freshState();
  const once = pullSport(state, 'SPORT_FOOTBALL', 1);
  assert.equal(once.ok, true);
  assert.equal(once.state.currency.G, tuning.previewStartingG - tuning.pullCostG);
  assert.equal(once.state.sport.pity.SPORT_BASKET.pulls, 0);
  assert.equal(once.state.sport.pity.SPORT_FOOTBALL.pulls, 1);
  assert.equal(once.results[0].sport, 'football');
  assert.equal('real' in once.results[0], false);
  const poor = structuredClone(once.state);
  poor.currency.G = 1;
  const denied = pullSport(poor, 'SPORT_CAR', 1);
  assert.equal(denied.ok, false);
  assert.equal(denied.state.currency.G, 1);
  const paid = grantG(once.state, { id: 'grant:demo', G: 50, reason: 'demo' });
  const paidAgain = grantG(paid.state, { id: 'grant:demo', G: 50, reason: 'demo' });
  assert.equal(paidAgain.duplicate, true);
  assert.equal(paidAgain.state.currency.G, paid.state.currency.G);
});

test('session reward is idempotent and the art manifest covers every card', () => {
  const profile = {};
  resetSession(profile);
  assert.equal(profile.currency.G, getTuning().previewStartingG);
  const before = gOf();
  runSim('football');
  const first = finishReward();
  const second = finishReward();
  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
  // Live wiring pays the real sim purse (PROPOSED), not the fixture reward table.
  assert.ok(Number.isInteger(first.G) && first.G >= 0);
  assert.equal(gOf(), before + first.G);
  const manifest = artManifest();
  const subjects = new Set(manifest.assets.map((asset) => `${asset.slot}:${asset.subjectId}`));
  for (const card of listPublicCards()) {
    assert.equal(subjects.has(`portrait:${card.id}`), true, card.id);
    assert.equal(getCard(card.id).art.placeholder, true);
  }
  for (const sport of ['football', 'basket', 'car', 'moto']) {
    assert.equal(subjects.has(`tile:${sport}`), true);
  }
  const pulled = doPull('SPORT_BASKET', 1);
  assert.equal(pulled.ok, true);
  assert.equal(pulled.results[0].sport, 'basket');
});

test('sport UI sources do not mark a finished status or print private fields', () => {
  const files = [
    'web/sport/screens/hub.js',
    'web/sport/screens/prep.js',
    'web/sport/screens/sim.js',
    'web/sport/screens/result.js',
    'web/sport/screens/gacha.js',
    'web/sport/screens/roster.js',
    'web/sport/shell.js',
    'web/sport/router.js',
    'web/sport/sport.css',
  ];
  for (const file of files) {
    const source = readFileSync(new URL(`../../../${file}`, import.meta.url), 'utf8');
    assert.equal(/\bLOCKED\b/.test(source), false, file);
    assert.equal(/PRODUCTION_READY/.test(source), false, file);
    assert.equal(/\.real\b/.test(source), false, file);
    assert.equal(/MotoGP|Formula 1|uefa\.com|nba\.com/.test(source), false, file);
  }
});
