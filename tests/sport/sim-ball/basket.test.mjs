import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { SCHEME_IDS, basketContest, simulateBasket } from '../../../src/sport/basket/index.mjs';
import { SCHEMES } from '../../../src/sport/basket/schemes.mjs';
import { BASKET_TUNING } from '../../../src/sport/basket/tuning.mjs';
import { EVENT_KEYS } from '../../../src/sport/common/rng-and-events.mjs';
import { REAL_NAME_TOKENS, basketMatchInput, basketSide } from './fixtures.mjs';

function play(seed, homeRating, awayRating, extra = {}) {
  return simulateBasket(basketMatchInput(
    seed,
    {
      name: 'Wafflers',
      rating: homeRating,
      scheme: extra.homeScheme,
      pace: extra.homePace,
      bench: extra.bench,
      coach: extra.homeCoach,
      stamina: extra.homeSta,
    },
    {
      name: 'Dino Bowl',
      rating: awayRating,
      scheme: extra.awayScheme,
      pace: extra.awayPace,
      bench: extra.bench,
      coach: extra.awayCoach,
      stamina: extra.awaySta,
    },
    extra,
  ));
}

function namesOf(input) {
  const names = new Map();
  for (const side of [input.home, input.away]) {
    names.set(side.parodyName, side.id);
    for (const player of [...side.players, ...side.bench]) names.set(player.parodyName, player.id);
  }
  return names;
}

function pointsFrom(events, names, homeName, awayName) {
  const totals = { home: 0, away: 0 };
  for (const event of events) {
    let points = 0;
    if (event.type === 'make2') points = 2;
    else if (event.type === 'make3') points = 3;
    else if (event.type === 'free_throw_make' || event.type === 'ot_safety') points = 1;
    if (points === 0) continue;
    const scorer = names.get(event.actors[0]);
    assert.ok(scorer, event.actors[0]);
    if (event.actors[0].startsWith(homeName)) totals.home += points;
    else if (event.actors[0].startsWith(awayName)) totals.away += points;
    else assert.fail(`scorer ${event.actors[0]}`);
  }
  return totals;
}

function assertSamples(game) {
  let previous = -1;
  for (const sample of game.result.lineupSamples) {
    assert.equal(sample.home.length, 5);
    assert.equal(sample.away.length, 5);
    assert.equal(new Set(sample.home).size, 5);
    assert.equal(new Set(sample.away).size, 5);
    assert.ok(sample.t >= previous);
    previous = sample.t;
  }
  assert.equal(game.result.closingLineup.home.length, 5);
  assert.equal(game.result.closingLineup.away.length, 5);
}

test('basketball sim is pure and reads the reward purse from tuning', () => {
  const input = basketMatchInput(12345, { name: 'Wafflers', rating: 70 }, { name: 'Dino Bowl', rating: 55 });
  const frozen = JSON.stringify(input);
  const first = simulateBasket(input);
  const second = simulateBasket(JSON.parse(frozen));
  assert.equal(JSON.stringify(input), frozen);
  assert.deepEqual(first, second);
  assert.deepEqual(first.result.score, { home: 72, away: 66 });
  assert.equal(first.result.winner, 'home');
  assert.equal(first.result.overtimePeriods, 0);
  assert.equal(first.rewards.G, BASKET_TUNING.rewards.G);
  assert.equal(first.rewards.status, 'PROPOSED');
  assert.equal(first.rewards.balance, 'BALANCE_PLACEHOLDER');
  assert.equal(first.result.safetyUsed, false);
  assert.equal(first.result.clock.elapsed, 2400);
  const custom = simulateBasket(basketMatchInput(
    4,
    { name: 'Wafflers', rating: 60 },
    { name: 'Dino Bowl', rating: 60 },
    { tuning: { rewards: { G: 3, status: 'QA_PASSED' } } },
  ));
  assert.equal(custom.rewards.G, 3);
  assert.equal(custom.rewards.status, 'PROPOSED');
});

test('basketball stays at five, pays a 24-second clock, and logs parody names only', () => {
  const input = basketMatchInput(8, { name: 'Wafflers', rating: 62 }, { name: 'Dino Bowl', rating: 57 });
  const game = simulateBasket(input);
  assertSamples(game);
  let previous = -1;
  const allowed = new Set(namesOf(input).keys());
  for (const event of game.events) {
    assert.deepEqual(Object.keys(event), [...EVENT_KEYS]);
    assert.ok(event.t >= previous);
    previous = event.t;
    for (const actor of event.actors) assert.ok(allowed.has(actor), actor);
    for (const token of REAL_NAME_TOKENS) assert.equal(event.text.includes(token), false);
  }
  const fromLog = pointsFrom(game.events, namesOf(input), 'Wafflers', 'Dino Bowl');
  assert.deepEqual(fromLog, game.result.score);
  assert.equal(game.result.rules.onCourt, 5);
  assert.equal(game.result.rules.shotClockSeconds, 24);
  assert.equal(game.result.rules.foulOut, 5);
  assert.equal(game.result.rules.quarterSeconds, 600);
  assert.ok(game.events.some((event) => event.type === 'tip'));
  assert.ok(game.events.filter((event) => event.type === 'period_start').length >= 4);
  assert.equal(game.result.mvp.status, 'PROPOSED');
  assert.equal(game.result.mvp.balance, 'BALANCE_PLACEHOLDER');
  for (const row of [...game.result.box.home, ...game.result.box.away]) {
    assert.ok(row.fouls <= 5);
    assert.equal(Object.hasOwn(row, 'Shooting'), false);
  }
});

test('foul-out removes a player when a sub exists and never fields 4 or 6', () => {
  const withBench = play(3, 60, 60, { bench: 5, tuning: { foulBase: 0.45 } });
  assertSamples(withBench);
  const foulOuts = withBench.events.filter((event) => event.type === 'foul_out');
  assert.ok(foulOuts.length >= 1);
  assert.equal(withBench.events.some((event) => event.type === 'foul_out_held'), false);
  const names = namesOf(basketMatchInput(3, { name: 'Wafflers', rating: 60, bench: 5 }, { name: 'Dino Bowl', rating: 60, bench: 5 }));
  for (const event of foulOuts) {
    assert.equal(event.actors.length, 2);
    const outId = names.get(event.actors[0]);
    const innId = names.get(event.actors[1]);
    assert.ok(outId && innId);
    assert.equal(withBench.result.closingLineup.home.includes(outId), false);
    assert.equal(withBench.result.closingLineup.away.includes(outId), false);
    const back = [...withBench.result.closingLineup.home, ...withBench.result.closingLineup.away];
    assert.ok(back.includes(innId) || withBench.result.box.home.concat(withBench.result.box.away).some((row) => row.id === innId && row.seconds > 0));
  }
  for (const row of [...withBench.result.box.home, ...withBench.result.box.away]) {
    assert.ok(row.fouls <= 5);
    if (row.fouls >= 5) {
      assert.equal(withBench.result.closingLineup.home.includes(row.id) || withBench.result.closingLineup.away.includes(row.id), false);
    }
  }

  const short = play(3, 60, 60, { bench: 0, tuning: { foulBase: 0.85 } });
  assertSamples(short);
  assert.ok(short.events.some((event) => event.type === 'foul_out_held'));
  assert.equal(short.result.closingLineup.home.length, 5);
  for (const row of [...short.result.box.home, ...short.result.box.away]) assert.ok(row.fouls <= 5);
});

test('overtime breaks a tie, pace changes trip count, and schemes stay bounded', () => {
  let overtime = 0;
  for (let seed = 1; seed <= 400; seed += 1) {
    const game = play(seed, 58, 58);
    assert.notEqual(game.result.winner, 'draw');
    assert.equal(game.result.safetyUsed, false);
    assert.equal(game.result.clock.elapsed, 2400 + game.result.overtimePeriods * 300);
    if (game.result.overtimePeriods > 0) {
      overtime += 1;
      assert.notEqual(game.result.score.home, game.result.score.away);
      assert.ok(game.events.some((event) => event.type === 'overtime'));
    }
    assert.ok(game.result.score.home >= 20 && game.result.score.home <= 140);
    assert.ok(game.result.score.away >= 20 && game.result.score.away <= 140);
  }
  assert.ok(overtime >= 1, 'expected at least one regulation tie to reach overtime');

  const push = play(5, 58, 58, { homePace: 'push', awayPace: 'push' });
  const grind = play(5, 58, 58, { homePace: 'grind', awayPace: 'grind' });
  assert.ok(push.result.possessions > grind.result.possessions);

  for (const scheme of SCHEME_IDS) {
    const game = play(6, 60, 60, { homeScheme: scheme, awayScheme: 'man-to-man' });
    assert.equal(game.result.schemes.home, scheme);
  }
  const contests = [];
  for (const scheme of Object.values(SCHEMES)) {
    for (const kind of ['two', 'three']) {
      const value = basketContest({
        kind,
        scheme,
        shooterIsStar: true,
        defSpread: 0.05,
        fatigue: 0.2,
        tuning: BASKET_TUNING,
      });
      contests.push(value);
      assert.ok(value >= 0.15 && value <= 0.9);
    }
  }
  assert.ok(Math.max(...contests) - Math.min(...contests) < 0.6);
});

test('coach passive changes basketball events and a stronger side wins more often but not always', { timeout: 120_000 }, () => {
  let differ = 0;
  for (let seed = 1; seed <= 12; seed += 1) {
    const plain = play(seed, 60, 60);
    const coached = play(seed, 60, 60, { homeCoach: { id: 'c', parodyName: 'Chef Stevie Stir', passive: 'movement' } });
    if (JSON.stringify(plain.events) !== JSON.stringify(coached.events)) differ += 1;
  }
  assert.ok(differ >= 6);

  let homeWins = 0;
  let awayWins = 0;
  let homePoints = 0;
  let awayPoints = 0;
  for (let seed = 1; seed <= 400; seed += 1) {
    const game = play(seed, 82, 48);
    homePoints += game.result.score.home;
    awayPoints += game.result.score.away;
    assert.notEqual(game.result.score.home, game.result.score.away);
    if (game.result.winner === 'home') homeWins += 1;
    else awayWins += 1;
    assert.equal(game.result.safetyUsed, false);
  }
  assert.ok(homeWins / 400 > 0.7 && homeWins / 400 < 0.97);
  assert.ok(awayWins >= 1);
  assert.ok(homePoints > awayPoints);
});

test('every scheme pairing still lets the stronger basketball side win more often', { timeout: 120_000 }, () => {
  for (const homeScheme of SCHEME_IDS) {
    for (const awayScheme of SCHEME_IDS) {
      let homeWins = 0;
      let awayWins = 0;
      for (let seed = 1; seed <= 24; seed += 1) {
        const game = play(seed, 82, 48, { homeScheme, awayScheme });
        if (game.result.winner === 'home') homeWins += 1;
        else if (game.result.winner === 'away') awayWins += 1;
      }
      assert.ok(homeWins > awayWins, `${homeScheme} vs ${awayScheme}: ${homeWins}-${awayWins}`);
    }
  }
});

test('a basketball match sims well under 200 ms', () => {
  play(1, 60, 60);
  const start = performance.now();
  play(44, 66, 61);
  const elapsed = performance.now() - start;
  assert.ok(elapsed < 200, `basketball sim took ${elapsed}ms`);
});

test('basketball pre-match choices are required and positions must cover PG through C', () => {
  const home = basketSide({ name: 'Wafflers' });
  const away = basketSide({ name: 'Dino Bowl' });
  assert.throws(
    () => simulateBasket({ seed: 1, home, away, tactics: { home: { scheme: 'box-and-one', pace: 'balanced' }, away: away.tactics } }),
    (error) => error.code === 'BAD_SCHEME',
  );
  const duplicated = structuredClone(home);
  duplicated.players[4].position = 'PF';
  duplicated.tactics.lineup = duplicated.players.map((player) => player.id);
  assert.throws(
    () => simulateBasket({ seed: 1, home: duplicated, away, tactics: { home: duplicated.tactics, away: away.tactics } }),
    (error) => error.code === 'BASKET_POSITIONS',
  );
  const short = structuredClone(home);
  short.tactics.lineup = short.tactics.lineup.slice(0, 4);
  assert.throws(
    () => simulateBasket({ seed: 1, home: short, away, tactics: { home: short.tactics, away: away.tactics } }),
    (error) => error.code === 'BASKET_LINEUP',
  );
});

test('basketball commentary does not contain real athlete names', () => {
  const source = readFileSync(new URL('../../../src/sport/basket/commentary.mjs', import.meta.url), 'utf8');
  for (const token of REAL_NAME_TOKENS) assert.equal(source.includes(token), false, token);
});
