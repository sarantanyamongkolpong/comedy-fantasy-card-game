import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  FORMATION_IDS,
  FORMATIONS,
  footballContext,
  simulateFootball,
} from '../../../src/sport/football/index.mjs';
import { FOOTBALL_TUNING } from '../../../src/sport/football/tuning.mjs';
import { EVENT_KEYS } from '../../../src/sport/common/rng-and-events.mjs';
import { REAL_NAME_TOKENS, footballMatchInput, footballSide } from './fixtures.mjs';

function play(seed, homeRating, awayRating, extra = {}) {
  return simulateFootball(footballMatchInput(
    seed,
    { name: 'Royal Meringue', rating: homeRating, formation: extra.homeFormation, stamina: extra.homeSta, bench: extra.bench, coach: extra.homeCoach },
    { name: 'Coffee Club', rating: awayRating, formation: extra.awayFormation, stamina: extra.awaySta, bench: extra.bench, coach: extra.awayCoach },
    extra,
  ));
}

function assertEventContract(events) {
  let previous = -1;
  for (const event of events) {
    assert.deepEqual(Object.keys(event), [...EVENT_KEYS]);
    assert.equal(typeof event.text, 'string');
    assert.ok(event.text.length > 0);
    assert.ok(Array.isArray(event.actors));
    assert.ok(event.t >= previous);
    previous = event.t;
    for (const token of REAL_NAME_TOKENS) assert.equal(event.text.includes(token), false, token);
  }
}

function assertPitch(game, squad) {
  const roles = new Map(squad.map((player) => [player.id, player.role]));
  const seenOff = { home: new Set(), away: new Set() };
  for (const snap of game.result.pitchLog) {
    for (const side of ['home', 'away']) {
      assert.equal(snap[side].length, 11);
      assert.equal(new Set(snap[side]).size, 11);
      const gkId = snap[`${side}Gk`];
      assert.ok(snap[side].includes(gkId));
      assert.equal(roles.get(gkId), 'GK');
    }
  }
  let previous = game.result.pitchLog[0];
  for (const snap of game.result.pitchLog.slice(1)) {
    for (const side of ['home', 'away']) {
      const before = new Set(previous[side]);
      const after = new Set(snap[side]);
      const outgoing = [...before].filter((id) => !after.has(id));
      const incoming = [...after].filter((id) => !before.has(id));
      assert.equal(outgoing.length, incoming.length);
      assert.ok(outgoing.length <= 1);
      for (const id of outgoing) {
        assert.equal(seenOff[side].has(id), false);
        seenOff[side].add(id);
      }
      for (const id of incoming) assert.equal(seenOff[side].has(id), false);
    }
    previous = snap;
  }
}

test('football sim is pure for a seed and pays the tuning purse', () => {
  const input = footballMatchInput(12345, { name: 'Royal Meringue', rating: 70 }, { name: 'Coffee Club', rating: 55 });
  const frozen = JSON.stringify(input);
  const first = simulateFootball(input);
  const second = simulateFootball(input);
  assert.equal(JSON.stringify(input), frozen);
  assert.deepEqual(first, second);
  assert.deepEqual(first.result.score, { home: 2, away: 1 });
  assert.equal(first.result.winner, 'home');
  assert.equal(first.rewards.G, 24);
  assert.equal(first.rewards.status, 'PROPOSED');
  assert.equal(first.rewards.balance, 'BALANCE_PLACEHOLDER');
  assert.equal(first.result.status, 'PROPOSED');
  assert.equal(first.result.minutes, 90);
  assert.equal(first.result.extraTime, false);

  const custom = simulateFootball(footballMatchInput(
    12345,
    { name: 'Royal Meringue', rating: 70 },
    { name: 'Coffee Club', rating: 55 },
    { tuning: { rewards: { G: 7, status: 'QA_PASSED' } } },
  ));
  assert.equal(custom.rewards.G, 7);
  assert.equal(custom.rewards.status, 'PROPOSED');
  assert.deepEqual(simulateFootball(footballMatchInput('parade-seed', { name: 'Royal Meringue', rating: 60 }, { name: 'Coffee Club', rating: 60 })), simulateFootball(footballMatchInput('parade-seed', { name: 'Royal Meringue', rating: 60 }, { name: 'Coffee Club', rating: 60 })));
});

test('football keeps 11 including a GK, substitutes one-for-one, and speaks in parody names', () => {
  const input = footballMatchInput(4, { name: 'Royal Meringue', rating: 64 }, { name: 'Coffee Club', rating: 60 });
  const game = simulateFootball(input);
  assertEventContract(game.events);
  assertPitch(game, [...input.home.players, ...input.home.bench, ...input.away.players, ...input.away.bench]);
  assert.equal(game.result.pitchLog[0].minute, 0);
  assert.equal(game.result.pitchLog.at(-1).minute, 90);
  assert.ok(game.result.subs.home + game.result.subs.away > 0);
  assert.ok(game.result.subs.home <= 5 && game.result.subs.away <= 5);
  const goals = game.events.filter((event) => event.type === 'goal');
  assert.equal(goals.length, game.result.score.home + game.result.score.away);
  const names = new Set();
  for (const side of [input.home, input.away]) {
    names.add(side.parodyName);
    for (const player of [...side.players, ...side.bench]) names.add(player.parodyName);
  }
  for (const event of game.events) {
    for (const actor of event.actors) assert.ok(names.has(actor), actor);
  }
  assert.ok(game.events.some((event) => event.type === 'kickoff'));
  assert.ok(game.events.some((event) => event.type === 'half_time'));
  assert.ok(game.events.some((event) => event.type === 'full_time'));
  assert.equal(game.result.rules.playersOnPitch, 11);
  assert.equal(game.result.rules.dismissals, false);
  assert.equal(game.result.mvp.balance, 'BALANCE_PLACEHOLDER');
  assert.equal(game.result.mvp.status, 'PROPOSED');
  assert.ok(names.has(game.result.mvp.parodyName));
});

test('football rejects an illegal pre-match lineup and a missing stat', () => {
  const home = footballSide({ name: 'Royal Meringue', rating: 50 });
  const away = footballSide({ name: 'Coffee Club', rating: 50 });
  assert.throws(
    () => simulateFootball({ seed: 1, home, away, tactics: { home: { formation: '4-1-5' }, away: away.tactics } }),
    (error) => error.code === 'BAD_FORMATION',
  );
  const noGk = structuredClone(home);
  noGk.players[0].role = 'CB';
  noGk.tactics.lineup = noGk.players.map((player) => player.id);
  assert.throws(
    () => simulateFootball({ seed: 1, home: noGk, away, tactics: { home: noGk.tactics, away: away.tactics } }),
    (error) => error.code === 'FOOTBALL_GK',
  );
  const missing = structuredClone(home);
  delete missing.players[5].stats.Acc;
  assert.throws(
    () => simulateFootball({ seed: 1, home: missing, away, tactics: { home: missing.tactics, away: away.tactics } }),
    (error) => error.code === 'DATA_MISSING',
  );
  assert.throws(() => simulateFootball({ seed: -3, home, away, tactics: { home: home.tactics, away: away.tactics } }), (error) => error.code === 'BAD_SEED');
});

test('all five formations field 11 and stay a small context modifier', () => {
  for (const formation of FORMATION_IDS) {
    assert.equal(FORMATIONS[formation].slots.length, 11);
    assert.equal(FORMATIONS[formation].slots.filter((slot) => slot.role === 'GK').length, 1);
    const game = play(9, 60, 57, { homeFormation: formation, awayFormation: '4-4-2' });
    assert.equal(game.result.formations.home, formation);
    assert.equal(game.result.pitchLog[0].home.length, 11);
  }
  const multipliers = [];
  for (const attack of FORMATION_IDS) {
    for (const defense of FORMATION_IDS) {
      const value = footballContext({
        attack: FORMATIONS[attack].profile,
        defense: FORMATIONS[defense].profile,
        wingbackFatigue: 0,
        tuning: FOOTBALL_TUNING,
      });
      multipliers.push(value);
      assert.ok(value >= FOOTBALL_TUNING.contextMin && value <= FOOTBALL_TUNING.contextMax);
    }
  }
  const spread = Math.max(...multipliers) - Math.min(...multipliers);
  assert.ok(spread < 0.2, `shape spread ${spread} is wide enough to behave like a counter table`);
});

test('coach passive and stamina change the match, and extra time follows a draw', () => {
  let coachDiff = 0;
  for (let seed = 1; seed <= 20; seed += 1) {
    const plain = play(seed, 60, 60);
    const coached = play(seed, 60, 60, { homeCoach: { id: 'c1', parodyName: 'Hansy Flicker', passive: 'highline' } });
    if (JSON.stringify(plain.events) !== JSON.stringify(coached.events)) coachDiff += 1;
  }
  assert.ok(coachDiff >= 10);

  let homeWins = 0;
  let awayWins = 0;
  let homeGoals = 0;
  let awayGoals = 0;
  for (let seed = 1; seed <= 300; seed += 1) {
    const game = play(seed, 60, 60, { homeSta: 92, awaySta: 20, bench: 2 });
    homeGoals += game.result.score.home;
    awayGoals += game.result.score.away;
    if (game.result.winner === 'home') homeWins += 1;
    if (game.result.winner === 'away') awayWins += 1;
  }
  assert.ok(homeWins > awayWins);
  assert.ok(homeGoals > awayGoals);

  let extra = null;
  for (let seed = 1; seed <= 80 && !extra; seed += 1) {
    const game = play(seed, 58, 58);
    if (game.result.winner === 'draw') {
      extra = play(seed, 58, 58, { extraTime: true });
    }
  }
  assert.ok(extra, 'expected a regulation draw within 80 seeds');
  assert.equal(extra.result.extraTime, true);
  assert.equal(extra.result.minutes, 120);
  assert.ok(extra.events.some((event) => event.type === 'extra_time_start'));
  assert.equal(extra.result.pitchLog.at(-1).home.length, 11);
  assert.ok(extra.events.some((event) => event.text.includes('not in this log') || event.type === 'extra_time_end'));
});

test('a tired squad uses at most five substitutes', () => {
  const game = play(2, 55, 55, {
    bench: 7,
    tuning: { drainPerMinute: 6, subMinute: 1, subStamina: 0.99, urgentStamina: 0.99, maxSubs: 5 },
  });
  assert.equal(game.result.subs.home, 5);
  assert.equal(game.result.subs.away, 5);
  assertPitch(game, [
    ...footballMatchInput(2, { name: 'Royal Meringue', rating: 55, bench: 7 }, { name: 'Coffee Club', rating: 55, bench: 7 }).home.players,
    ...footballMatchInput(2, { name: 'Royal Meringue', rating: 55, bench: 7 }, { name: 'Coffee Club', rating: 55, bench: 7 }).home.bench,
    ...footballMatchInput(2, { name: 'Royal Meringue', rating: 55, bench: 7 }, { name: 'Coffee Club', rating: 55, bench: 7 }).away.players,
    ...footballMatchInput(2, { name: 'Royal Meringue', rating: 55, bench: 7 }, { name: 'Coffee Club', rating: 55, bench: 7 }).away.bench,
  ]);
});

test('football score sanity, determinism pressure, and upset rate over 500 seeds', { timeout: 120_000 }, () => {
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;
  let goals = 0;
  for (let seed = 1; seed <= 500; seed += 1) {
    const even = play(seed, 58, 58);
    goals += even.result.score.home + even.result.score.away;
    assert.ok(even.result.score.home >= 0 && even.result.score.home <= 12);
    assert.ok(even.result.score.away >= 0 && even.result.score.away <= 12);
    assert.equal(even.events.filter((event) => event.type === 'goal').length, even.result.score.home + even.result.score.away);
    assert.equal(even.result.pitchLog.every((snap) => snap.home.length === 11 && snap.away.length === 11), true);

    const strong = play(seed, 82, 48);
    assert.ok(strong.result.score.home <= 12 && strong.result.score.away <= 12);
    if (strong.result.winner === 'home') homeWins += 1;
    else if (strong.result.winner === 'away') awayWins += 1;
    else draws += 1;
  }
  const meanGoals = goals / 500;
  assert.ok(meanGoals > 1.8 && meanGoals < 4.5, `mean goals ${meanGoals}`);
  assert.ok(homeWins / 500 > 0.7 && homeWins / 500 < 0.96, `home win rate ${homeWins / 500}`);
  assert.ok(awayWins >= 1);
  assert.ok(draws >= 1);
});

test('a football match sims well under 200 ms', () => {
  play(1, 60, 60);
  const start = performance.now();
  play(99, 64, 58);
  const elapsed = performance.now() - start;
  assert.ok(elapsed < 200, `football sim took ${elapsed}ms`);
});

test('every formation pairing still lets the stronger side win more often', { timeout: 120_000 }, () => {
  for (const homeFormation of FORMATION_IDS) {
    for (const awayFormation of FORMATION_IDS) {
      let homeWins = 0;
      let awayWins = 0;
      for (let seed = 1; seed <= 24; seed += 1) {
        const game = play(seed, 82, 48, { homeFormation, awayFormation });
        if (game.result.winner === 'home') homeWins += 1;
        else if (game.result.winner === 'away') awayWins += 1;
      }
      assert.ok(homeWins > awayWins, `${homeFormation} vs ${awayFormation}: ${homeWins}-${awayWins}`);
    }
  }
});

test('commentary banks do not contain real athlete names', () => {
  const source = readFileSync(new URL('../../../src/sport/football/commentary.mjs', import.meta.url), 'utf8');
  for (const token of REAL_NAME_TOKENS) assert.equal(source.includes(token), false, token);
});
