import assert from 'node:assert/strict';
import test from 'node:test';
import { CAR_ROSTER, carTeams, simulateCar } from '../../../src/sport/car/index.js';
import { MOTO_ROSTER, motoTeams, simulateMoto } from '../../../src/sport/moto/index.js';
import { claimReward } from '../../../src/sport/wallet/index.js';

const quiet = {
  noiseAmp: 0,
  dnfPerMil: 0,
  dnfSplit: 0,
  safetyPerMil: 0,
  riskStepPerMil: 0,
  wearGripLoss: 0,
};

const dry = { weather: 'dry', weatherFlip: false, fillField: false, sprint: false };

function teamOf(list, teamId) {
  const team = list().find((row) => row.teamId === teamId);
  return {
    teamId: team.teamId,
    parodyName: team.parodyName,
    entries: team.entries.map((entry) => structuredClone(entry)),
  };
}

function withPlan(team, plan) {
  return {
    ...team,
    entries: team.entries.map((entry) => ({ ...entry, strategy: { ...plan } })),
  };
}

test('car weekend is deterministic, uses both cars, and does not read stamina as a stat', () => {
  const home = teamOf(carTeams, 'CAR_PAPAYA_PEEL');
  const field = [teamOf(carTeams, 'CAR_THUNDER_MOO')];
  const input = { seed: 7, home, field, tactics: { ...dry, sprint: true }, tuning: quiet };
  const first = simulateCar(input);
  const second = simulateCar(structuredClone(input));
  assert.deepEqual(first, second);
  assert.equal(first.result.sprint.grid.join(), first.result.gp.grid.join());
  assert.equal(first.result.quali.map((row) => row.id).join(), first.result.gp.grid.join());
  for (const team of first.result.standings.teams) {
    assert.equal(team.drivers.length, 2);
    assert.equal(team.forfeit, false);
    const members = first.result.standings.drivers.filter((driver) => driver.teamId === team.teamId);
    assert.equal(team.points, members.reduce((sum, driver) => sum + driver.points, 0));
  }
  const dirt = teamOf(carTeams, 'CAR_PAPAYA_PEEL');
  dirt.entries[0].stats.Sta = 1;
  dirt.entries[1].stats.Sta = 100;
  const changed = simulateCar({ seed: 7, home: dirt, field, tactics: { ...dry, sprint: true }, tuning: quiet });
  assert.deepEqual(changed, first);
  assert.equal(first.rewards.status, 'PROPOSED');
  assert.equal(first.rewards.balance, 'BALANCE_PLACEHOLDER');
  assert.equal(Number.isInteger(first.rewards.G), true);
  assert.equal(first.meta.status, 'PROPOSED');
});

test('tyre compound and pit count are chosen before the race and are not fixed', () => {
  const soft = withPlan(teamOf(carTeams, 'CAR_PAPAYA_PEEL'), { tyre: 'S', pitPlan: [], pitTyres: [] });
  const hard = withPlan(teamOf(carTeams, 'CAR_THUNDER_MOO'), { tyre: 'H', pitPlan: [], pitTyres: [] });
  const slick = simulateCar({
    seed: 3,
    home: soft,
    field: [hard],
    tactics: dry,
    tuning: quiet,
  });
  const softIds = new Set(soft.entries.map((entry) => entry.id));
  const topTwo = slick.result.gp.order.filter((row) => row.status === 'FIN').slice(0, 2).map((row) => row.id);
  assert.equal(topTwo.every((id) => softIds.has(id)), true);

  const wet = withPlan(teamOf(carTeams, 'CAR_THUNDER_MOO'), { tyre: 'Wet', pitPlan: [], pitTyres: [] });
  const soaked = simulateCar({ seed: 3, home: soft, field: [wet], tactics: dry, tuning: quiet });
  const wetIds = new Set(wet.entries.map((entry) => entry.id));
  assert.equal(soaked.result.gp.order.find((row) => wetIds.has(row.id)).position > 2, true);

  const planned = withPlan(teamOf(carTeams, 'CAR_PAPAYA_PEEL'), { tyre: 'M', pitPlan: [4, 8], pitTyres: ['H', 'S'] });
  const stayed = withPlan(teamOf(carTeams, 'CAR_SILVER_SPOON'), { tyre: 'M', pitPlan: [], pitTyres: [] });
  const pits = simulateCar({ seed: 5, home: planned, field: [stayed], tactics: dry, tuning: quiet });
  for (const entry of planned.entries) {
    const stops = pits.events.filter((event) => event.type === 'pit' && event.actors.includes(entry.id));
    assert.equal(stops.length, 2);
    assert.equal(stops.every((event) => event.text.includes('Grand Prix')), true);
  }
  for (const entry of stayed.entries) {
    assert.equal(pits.events.some((event) => event.type === 'pit' && event.actors.includes(entry.id)), false);
  }
  assert.equal(pits.result.sprint, null);
});

test('one car can retire without forfeiting the teammate', () => {
  const home = teamOf(carTeams, 'CAR_PAPAYA_PEEL');
  home.entries[0] = { ...home.entries[0], strategy: { tyre: 'M', pitPlan: [], risk: 1 } };
  home.entries[1] = { ...home.entries[1], strategy: { tyre: 'M', pitPlan: [], risk: 0 } };
  const race = simulateCar({
    seed: 11,
    home,
    tactics: dry,
    tuning: { ...quiet, dnfSplit: 100, riskStepPerMil: 1000 },
  });
  const gone = race.result.standings.drivers.find((driver) => driver.id === home.entries[0].id);
  const stayed = race.result.standings.drivers.find((driver) => driver.id === home.entries[1].id);
  assert.equal(gone.dnf, true);
  assert.equal(gone.points, 0);
  assert.equal(stayed.status, 'FIN');
  assert.ok(stayed.points > 0);
  const team = race.result.standings.teams.find((row) => row.teamId === home.teamId);
  assert.equal(team.forfeit, false);
  assert.equal(team.points, stayed.points);
  assert.equal(race.result.forfeit, false);
  assert.equal(race.events.some((event) => event.type === 'dnf' && event.actors.includes(gone.id)), true);
});

test('a repeated sport claim pays the car reward once', () => {
  const race = simulateCar({ seed: 2, home: teamOf(carTeams, 'CAR_NOODLE_TORQUE'), tactics: dry, tuning: quiet });
  const start = { currency: { G: 0 }, pity: { TEST_BANNER_AVATAR: { epicCounter: 1, topCounter: 2 } }, rewardLedger: {} };
  const first = claimReward(start, { txnId: race.rewards.claimId, amount: race.rewards.G, reason: 'sport-car' });
  const second = claimReward(first.state, {
    txnId: race.rewards.claimId,
    amount: race.rewards.G + 50,
    reason: 'sport-car',
  });
  assert.equal(first.applied, true);
  assert.equal(second.applied, false);
  assert.equal(second.state, first.state);
  assert.equal(first.state.currency.G, race.rewards.G);
  assert.deepEqual(first.state.pity, start.pity);
  assert.equal(start.currency.G, 0);
  assert.equal(CAR_ROSTER.length, 12);
});

test('moto uses one qualifying grid for sprint and grand prix and tracks stamina apart from card stats', () => {
  const home = teamOf(motoTeams, 'MOTO_RED_QUACK');
  home.entries[0].setup = 'Speed';
  home.entries[1].setup = 'Handling';
  const input = { seed: 8, home, tactics: { ...dry, sprint: false }, tuning: quiet };
  const race = simulateMoto(input);
  assert.deepEqual(race, simulateMoto(input));
  assert.deepEqual(race.result.sprint.grid, race.result.gp.grid);
  assert.deepEqual(race.result.sprint.grid, race.result.quali.map((row) => row.id));
  assert.equal(race.meta.sessions.join(), 'quali,sprint,gp');
  for (const driver of race.result.standings.drivers) {
    assert.equal(Object.hasOwn(driver, 'stamina'), true);
    assert.equal(driver.stamina, 100 - 12 * 4);
    assert.equal(Object.hasOwn(driver, 'Sta'), false);
  }
  const tired = teamOf(motoTeams, 'MOTO_RED_QUACK');
  tired.entries[0].stamina = 20;
  tired.entries[1].stamina = 20;
  const fresh = teamOf(motoTeams, 'MOTO_RED_QUACK');
  fresh.teamId = 'MOTO_FRESH';
  fresh.entries = fresh.entries.map((entry) => ({ ...entry, id: `${entry.id}_F`, teamId: 'MOTO_FRESH', stamina: 100 }));
  tired.teamId = 'MOTO_TIRED';
  tired.entries = tired.entries.map((entry) => ({ ...entry, id: `${entry.id}_T`, teamId: 'MOTO_TIRED', stamina: 20 }));
  const compared = simulateMoto({
    seed: 1,
    home: fresh,
    field: [tired],
    tactics: { ...dry, trackId: 'MUSHGELLO_VALLEY' },
    tuning: quiet,
  });
  const freshPos = compared.result.gp.order.filter((row) => row.id.endsWith('_F')).map((row) => row.position);
  const tiredPos = compared.result.gp.order.filter((row) => row.id.endsWith('_T')).map((row) => row.position);
  assert.ok(Math.max(...freshPos) < Math.min(...tiredPos));
  assert.equal(MOTO_ROSTER.length, 10);
  assert.equal(motoTeams().every((team) => team.entries.length === 2), true);
});

test('moto setup and tyre rules stay inside the pre-race choices', () => {
  const base = teamOf(motoTeams, 'MOTO_ORANGE_ANVIL');
  const speed = {
    teamId: 'MOTO_SPEED',
    parodyName: 'Speed',
    entries: base.entries.map((entry) => ({ ...entry, id: `${entry.id}_S`, teamId: 'MOTO_SPEED', setup: 'Speed' })),
  };
  const handling = {
    teamId: 'MOTO_HANDLE',
    parodyName: 'Handling',
    entries: base.entries.map((entry) => ({ ...entry, id: `${entry.id}_H`, teamId: 'MOTO_HANDLE', setup: 'Handling' })),
  };
  const race = simulateMoto({
    seed: 4,
    home: speed,
    field: [handling],
    tactics: { ...dry, trackId: 'MUSHGELLO_VALLEY' },
    tuning: quiet,
  });
  const speedPos = race.result.gp.order.filter((row) => row.teamId === 'MOTO_SPEED').map((row) => row.position);
  const handlePos = race.result.gp.order.filter((row) => row.teamId === 'MOTO_HANDLE').map((row) => row.position);
  assert.ok(Math.max(...speedPos) < Math.min(...handlePos));

  const illegal = teamOf(motoTeams, 'MOTO_RED_QUACK');
  illegal.entries[0].strategy = { tyre: 'Inter' };
  assert.throws(
    () => simulateMoto({ seed: 1, home: illegal, tactics: dry }),
    (error) => error.code === 'BAD_STRATEGY',
  );
  assert.throws(() => simulateCar({ seed: -1, home: teamOf(carTeams, 'CAR_PAPAYA_PEEL') }), (error) => error.code === 'BAD_SEED');
  assert.throws(() => simulateMoto({ seed: 1.2, home: teamOf(motoTeams, 'MOTO_RED_QUACK') }), (error) => error.code === 'BAD_SEED');
});
