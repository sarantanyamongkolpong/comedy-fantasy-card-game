import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { BANNERS, getCard, listPublicCards, opponentsFor, privateRealNames, sportMeta } from '../../../web/sport/fixtures/catalog.js';
import { grantG, pullSport } from '../../../web/sport/fixtures/gacha.js';
import { simulateSport } from '../../../web/sport/fixtures/simulate.js';
import { getTuning } from '../../../web/sport/fixtures/tuning.js';
import { artManifest } from '../../../web/sport/art.js';
import { resetSession, runSim, doPull, gOf, finishReward } from '../../../web/sport/session.js';

function freshState() {
  const tuning = getTuning();
  const pity = {};
  for (const bannerId of BANNERS) pity[bannerId] = { epic: 0, ex: 0, pulls: 0 };
  return {
    currency: { G: tuning.previewStartingG },
    sport: { roster: {}, pity, ledger: [] },
  };
}

test('each sport sim is deterministic and keeps real names out of the log', () => {
    const parodies = listPublicCards().map((card) => card.parodyName).join('\n');
    const forbidden = privateRealNames().filter((name) => name && name.length > 4 && !parodies.includes(name));
  const hosts = ['uefa.com', 'fifa.com', 'nba.com', 'wnba.com', 'formula1.com', 'motogp.com'];
  for (const sport of ['football', 'basket', 'car', 'moto']) {
    const home = listPublicCards().filter((card) => card.sport === sport && card.role !== 'COACH').slice(0, sport === 'basket' ? 5 : sport === 'football' ? 11 : 2);
    const away = opponentsFor(sport);
    const input = {
      sport,
      seed: 'qa-seed',
      home,
      away,
      tactics: { formation: '4-3-3', scheme: 'man', pace: 'even', tyre: 'soft', setup: 'speed', venue: sportMeta(sport).venue },
    };
    const first = simulateSport(input);
    const second = simulateSport(input);
    assert.deepEqual(first, second);
    assert.ok(first.events.length > 3);
    assert.equal(first.rewards.status, 'PROPOSED');
    assert.equal(first.events.every((event) => Number.isFinite(event.t) && event.type && Array.isArray(event.actors) && event.text), true);
    const blob = JSON.stringify(first);
    for (const name of forbidden) assert.equal(blob.includes(name), false, `${sport} leaked ${name}`);
    for (const host of hosts) assert.equal(blob.includes(host), false, host);
    if (sport === 'football' || sport === 'basket') {
      assert.ok(first.result.score);
      assert.ok(first.result.mvp?.parodyName);
    } else {
      assert.equal(first.result.standings.length, 4);
      assert.ok(first.result.standings.filter((row) => row.side === 'home').length === 2);
    }
  }
});

test('pulls spend G once, isolate pity, and can force EX', () => {
  const tuning = getTuning();
  const state = freshState();
  const once = pullSport(state, 'SPORT_FOOTBALL', 1, 'seed-a');
  assert.equal(once.ok, true);
  assert.equal(once.state.currency.G, tuning.previewStartingG - tuning.pullCostG);
  assert.equal(once.state.sport.pity.SPORT_BASKET.pulls, 0);
  assert.equal(once.state.sport.pity.SPORT_FOOTBALL.pulls, 1);
  assert.equal(once.results[0].sport, 'football');
  assert.equal('real' in once.results[0], false);
  const again = pullSport(once.state, 'SPORT_FOOTBALL', 1, 'seed-a');
  assert.equal(again.duplicate, true);
  assert.equal(again.state.currency.G, once.state.currency.G);
  const broke = pullSport(once.state, 'SPORT_CAR', 10, 'too-poor');
  const poor = structuredClone(once.state);
  poor.currency.G = 1;
  const denied = pullSport(poor, 'SPORT_CAR', 1, 'nope');
  assert.equal(denied.ok, false);
  assert.equal(denied.state.currency.G, 1);
  assert.equal(denied.state.sport.ledger.length, once.state.sport.ledger.length);
  const pityState = freshState();
  pityState.sport.pity.SPORT_MOTO.ex = tuning.pity.ex - 1;
  const forced = pullSport(pityState, 'SPORT_MOTO', 1, 'pity-ex');
  assert.equal(forced.results[0].rarity, 'EX');
  assert.equal(forced.state.sport.pity.SPORT_MOTO.ex, 0);
  assert.equal(forced.state.sport.pity.SPORT_FOOTBALL.ex, 0);
  const paid = grantG(forced.state, { id: 'grant:demo', G: 50, reason: 'demo' });
  const paidAgain = grantG(paid.state, { id: 'grant:demo', G: 50, reason: 'demo' });
  assert.equal(paidAgain.duplicate, true);
  assert.equal(paidAgain.state.currency.G, paid.state.currency.G);
  assert.ok(broke.state.currency.G < once.state.currency.G);
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
  assert.equal(gOf(), before + getTuning().rewards.football);
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
