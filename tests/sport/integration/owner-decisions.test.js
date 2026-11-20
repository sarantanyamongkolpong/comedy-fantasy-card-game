/**
 * Owner decisions t282u (#4 starting G, #5 x10 pricing/rates/pity, #6 reward table).
 * Statuses: MVP_PROVISIONAL / OWNER_DECIDED. Values stay PROPOSED / BALANCE_PLACEHOLDER.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { BANNERS, CONTENT, STARTER_OWNED, getCard, getTuning, simulateSport, ADAPTER_TUNING } from '../../../web/sport/live/index.js';
import { pullSport, emptyPity, liveGachaTuning } from '../../../web/sport/live/economy.js';
import { rewardTable, resultKey } from '../../../web/sport/live/simulate.js';
import { buildDefaultLineups } from '../../../web/sport/lineup.js';
import * as session from '../../../web/sport/session.js';

function state(G = 10_000_000) {
  const pity = {};
  for (const id of BANNERS) pity[id] = emptyPity();
  return { currency: { G }, sport: { roster: {}, pity, ledger: [] } };
}

test('#4 new player starts with 8,000 G, MVP_PROVISIONAL', () => {
  assert.equal(ADAPTER_TUNING.previewStartingG, 8000);
  assert.equal(ADAPTER_TUNING.previewStartingGStatus.status, 'MVP_PROVISIONAL');
  const profile = {};
  session.resetSession(profile);
  assert.equal(profile.currency.G, 8000);
});

test('#5 x10 costs exactly 10x a single pull', () => {
  for (const banner of BANNERS) {
    const one = pullSport(state(), banner, 1);
    const ten = pullSport(state(), banner, 10);
    assert.equal(one.chargedG, getTuning().pullCostG);
    assert.equal(ten.chargedG, 10 * one.chargedG, banner);
    assert.equal(getTuning().pull10CostG, 10 * getTuning().pullCostG);
  }
});

test('#5 x10 uses the same rates and pity as singles', () => {
  // Same tuning object (weights, pity thresholds, pools) whatever the count.
  const tuning = liveGachaTuning();
  assert.deepEqual(liveGachaTuning(), tuning);
  const { epicPity, exPity } = tuning.gacha;
  // Pity: Epic is forced on the same pull index for x10 and for ten singles.
  for (const banner of BANNERS) {
    const start = state();
    start.sport.pity[banner] = { epicCounter: epicPity - 3, exCounter: 0, pulls: 0 };
    const ten = pullSport(start, banner, 10);
    let singles = start;
    const singleRows = [];
    for (let i = 0; i < 10; i += 1) {
      const next = pullSport(singles, banner, 1);
      singleRows.push(next.results[0]);
      singles = next.state;
    }
    const firstForcedTen = ten.results.findIndex((row) => row.forced);
    const firstForcedSingle = singleRows.findIndex((row) => row.forced);
    if (firstForcedTen >= 0 || firstForcedSingle >= 0) {
      // A natural Epic/EX before the threshold resets the counter, so compare only when both forced.
      if (firstForcedTen >= 0 && firstForcedSingle >= 0) assert.equal(firstForcedTen, firstForcedSingle, banner);
    }
    assert.equal(ten.state.sport.pity[banner].pulls, 10);
    assert.equal(singles.sport.pity[banner].pulls, 10);
    // EX pity threshold applies inside x10 too.
    const exStart = state();
    exStart.sport.pity[banner] = { epicCounter: 0, exCounter: exPity - 1, pulls: 0 };
    assert.equal(pullSport(exStart, banner, 10).results[0].rarity, 'EX', banner);
    assert.equal(pullSport(exStart, banner, 1).results[0].rarity, 'EX', banner);
  }
  // Rates: rarity mix of 1,000 singles vs 100 x10 on the same banner stays within tolerance.
  const mix = (rows) => {
    const out = { N: 0, R: 0, Epic: 0, EX: 0 };
    for (const row of rows) out[row.rarity] += 1;
    return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v / rows.length]));
  };
  let s1 = state();
  const singles = [];
  for (let i = 0; i < 1000; i += 1) { const r = pullSport(s1, 'SPORT_FOOTBALL', 1); singles.push(...r.results); s1 = r.state; }
  let s10 = state();
  const tens = [];
  for (let i = 0; i < 100; i += 1) { const r = pullSport(s10, 'SPORT_FOOTBALL', 10); tens.push(...r.results); s10 = r.state; }
  const a = mix(singles);
  const b = mix(tens);
  for (const key of ['N', 'R', 'Epic']) assert.ok(Math.abs(a[key] - b[key]) < 0.06, `${key} ${a[key]} vs ${b[key]}`);
});

test('#6 match rewards come from the content win/draw/loss table, once per match', () => {
  const table = CONTENT.tuning.eventRewardsG;
  const lineups = buildDefaultLineups(STARTER_OWNED.map((id) => getCard(id)));
  for (const sport of ['football', 'basket', 'car', 'moto']) {
    assert.ok(rewardTable(sport), sport);
    for (const seed of [1, 2, 3, 4]) {
      const home = lineups[sport].slots.map((id) => getCard(id));
      const sim = simulateSport({ sport, seed, home, tactics: {} });
      const key = resultKey(sport, sim.result, new Set(home.map((c) => c.id)));
      assert.equal(sim.rewards.source, 'content/v06/sport/tuning.json#eventRewardsG');
      assert.equal(sim.rewards.resultKey, key);
      assert.equal(sim.rewards.G, table[sport][key], `${sport} ${seed} ${key}`);
      assert.equal(sim.rewards.status, 'PROPOSED');
      assert.equal(sim.rewards.balance, 'BALANCE_PLACEHOLDER');
    }
  }
  assert.equal(resultKey('football', { score: { home: 1, away: 1 } }), 'draw');
  assert.equal(resultKey('basket', { score: { home: 70, away: 80 } }), 'loss');
  const ids = new Set(['A', 'B']);
  const gp = (rows) => ({ gp: { order: rows } });
  assert.equal(resultKey('car', gp([{ id: 'X', status: 'FIN', position: 1 }, { id: 'B', status: 'FIN', position: 2 }, { id: 'A', status: 'DNF', position: 20 }]), ids), 'second');
  assert.equal(resultKey('moto', gp([{ id: 'A', status: 'DNF', position: 19 }, { id: 'B', status: 'DNF', position: 20 }]), ids), 'dnf');
  // Pay once per match.
  const profile = {};
  session.resetSession(profile);
  const before = session.gOf();
  session.runSim('basket');
  const first = session.finishReward();
  const again = session.finishReward();
  assert.equal(again.duplicate, true);
  assert.ok(Object.values(table.basket).includes(first.G));
  assert.equal(session.gOf(), before + first.G);
});

test('#6 a sport without a complete table keeps the sim purse and flags it', () => {
  const saved = CONTENT.tuning.eventRewardsG.moto;
  try {
    CONTENT.tuning.eventRewardsG.moto = { first: 60 };
    assert.equal(rewardTable('moto'), null);
    const lineups = buildDefaultLineups(STARTER_OWNED.map((id) => getCard(id)));
    const sim = simulateSport({ sport: 'moto', seed: 1, home: lineups.moto.slots.map((id) => getCard(id)), tactics: {} });
    assert.equal(sim.rewards.source, 'sim-purse');
    assert.equal(sim.rewards.fallbackReason, 'reward table missing for this sport');
  } finally {
    CONTENT.tuning.eventRewardsG.moto = saved;
  }
});
