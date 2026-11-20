import assert from 'node:assert/strict';
import test from 'node:test';
import { carTeams, simulateCar } from '../../../src/sport/car/index.js';
import { motoTeams, simulateMoto } from '../../../src/sport/moto/index.js';

const BANNED = [
  'Lando Norris', 'Oscar Piastri', 'Charles Leclerc', 'Lewis Hamilton', 'George Russell',
  'Kimi Antonelli', 'Max Verstappen', 'Isack Hadjar', 'Nico Hülkenberg', 'Nico Hulkenberg',
  'Gabriel Bortoleto', 'Carlos Sainz', 'Alexander Albon', 'Marc Márquez', 'Marc Marquez',
  'Francesco Bagnaia', 'Fabio Quartararo', 'Pedro Acosta', 'Jorge Martín', 'Jorge Martin',
  'Brad Binder', 'Marco Bezzecchi', 'Joan Mir', 'Toprak Razgatlıoğlu', 'Toprak Razgatlioglu',
  'Ai Ogura', 'McLaren', 'Ferrari', 'Mercedes', 'Red Bull', 'Williams', 'Ducati', 'Aprilia',
  'Yamaha', 'Honda', 'KTM', 'Mugello', 'Sachsenring', 'Silverstone', 'Suzuka', 'Monaco', 'Monza',
];

function mentions(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^\\p{L}])${escaped}(?:$|[^\\p{L}])`, 'u').test(text);
}

function teamOf(list, teamId) {
  const team = list().find((row) => row.teamId === teamId);
  return { teamId: team.teamId, parodyName: team.parodyName, entries: team.entries };
}

function check(result, sport) {
  assert.equal(result.rewards.status, 'PROPOSED');
  assert.equal(result.rewards.balance, 'BALANCE_PLACEHOLDER');
  assert.equal(result.meta.status, 'PROPOSED');
  assert.equal(result.meta.balance, 'BALANCE_PLACEHOLDER');
  assert.equal(Number.isInteger(result.rewards.G) && result.rewards.G >= 0, true);
  assert.equal(result.result.forfeit, false);
  assert.ok(result.events.length > 0);
  let previous = -1;
  const blob = [];
  for (const event of result.events) {
    assert.equal(Number.isInteger(event.t) && event.t >= previous, true);
    previous = event.t;
    assert.equal(typeof event.type, 'string');
    assert.equal(Array.isArray(event.actors), true);
    assert.equal(typeof event.text, 'string');
    assert.ok(event.text.length > 0);
    blob.push(event.text);
  }
  const drivers = result.result.standings.drivers;
  const teams = result.result.standings.teams;
  assert.equal(drivers.length, teams.length * 2);
  const seen = new Set();
  for (const team of teams) {
    assert.equal(team.drivers.length, 2);
    assert.equal(team.forfeit, false);
    const members = team.drivers.map((id) => drivers.find((driver) => driver.id === id));
    assert.equal(team.points, members.reduce((sum, driver) => sum + driver.points, 0));
    assert.equal(team.points, team.sprintPoints + team.gpPoints);
    for (const driver of members) {
      assert.equal(seen.has(driver.id), false);
      seen.add(driver.id);
      assert.equal(driver.points, driver.sprintPoints + driver.gpPoints);
      assert.equal(driver.points >= 0, true);
      blob.push(driver.parodyName);
      if (sport === 'moto') {
        assert.equal(Number.isInteger(driver.stamina) && driver.stamina >= 0 && driver.stamina <= 100, true);
      } else {
        assert.equal(Object.hasOwn(driver, 'stamina'), false);
      }
      assert.equal(Object.hasOwn(driver, 'Sta'), false);
    }
  }
  const text = blob.join('\n');
  for (const name of BANNED) assert.equal(mentions(text, name), false, name);

  const qualiIds = result.result.quali.map((row) => row.id);
  assert.equal(new Set(qualiIds).size, drivers.length);
  assert.deepEqual(result.result.gp.grid, qualiIds);
  if (sport === 'moto' || result.result.sprint) assert.deepEqual(result.result.sprint.grid, qualiIds);
  for (const session of [result.result.gp, result.result.sprint].filter(Boolean)) {
    const finishers = session.order.filter((row) => row.status === 'FIN');
    const retired = session.order.filter((row) => row.status === 'DNF');
    assert.deepEqual(session.order.map((row) => row.status), [...finishers, ...retired].map((row) => row.status));
    for (let index = 1; index < finishers.length; index += 1) {
      assert.ok(finishers[index].timeMs >= finishers[index - 1].timeMs);
      assert.ok(finishers[index].timeMs > 0);
    }
    session.order.forEach((row, index) => {
      assert.equal(row.position, index + 1);
      const table = session === result.result.gp ? result.result.points.gp : result.result.points.sprint;
      const expected = row.status === 'FIN' ? (table[index] ?? 0) : 0;
      assert.equal(row.points, expected);
    });
  }
  if (result.result.winner) {
    assert.equal(result.result.mvp.id, result.result.winner.id);
    assert.equal(result.result.mvp.reason.includes('PROPOSED'), true);
  } else {
    assert.equal(result.result.mvp, null);
  }
}

test('car and moto invariants hold across 500 seeds and each race stays under 200ms', () => {
  const carHome = teamOf(carTeams, 'CAR_PAPAYA_PEEL');
  const motoHome = teamOf(motoTeams, 'MOTO_RED_QUACK');
  simulateCar({ seed: 0, home: carHome });
  simulateMoto({ seed: 0, home: motoHome });
  let worst = 0;
  const saw = { carDnf: false, carClean: false, carSafety: false, motoDnf: false, motoSplit: false, motoLowStamina: false };
  for (let seed = 0; seed < 500; seed += 1) {
    const carInput = { seed, home: carHome, tactics: { sprint: seed % 2 === 0 } };
    const carStarted = performance.now();
    const car = simulateCar(carInput);
    worst = Math.max(worst, performance.now() - carStarted);
    assert.deepEqual(car, simulateCar(carInput));
    check(car, 'car');
    const carDnf = car.result.gp.order.some((row) => row.status === 'DNF');
    if (carDnf) saw.carDnf = true;
    else saw.carClean = true;
    if (car.result.gp.safetyCar || car.result.sprint?.safetyCar) saw.carSafety = true;

    const motoInput = { seed, home: motoHome };
    const motoStarted = performance.now();
    const moto = simulateMoto(motoInput);
    worst = Math.max(worst, performance.now() - motoStarted);
    assert.deepEqual(moto, simulateMoto(motoInput));
    check(moto, 'moto');
    if (moto.result.gp.order.some((row) => row.status === 'DNF')) saw.motoDnf = true;
    if (moto.result.standings.drivers.some((driver) => driver.stamina < 100)) saw.motoLowStamina = true;
    for (const team of moto.result.standings.teams) {
      const members = team.drivers.map((id) => moto.result.standings.drivers.find((driver) => driver.id === id));
      if (members.filter((driver) => driver.dnf).length === 1) saw.motoSplit = true;
    }
  }
  assert.ok(worst < 200, `slowest race ${worst.toFixed(1)}ms`);
  assert.equal(saw.carDnf, true);
  assert.equal(saw.carClean, true);
  assert.equal(saw.carSafety, true);
  assert.equal(saw.motoDnf, true);
  assert.equal(saw.motoSplit, true);
  assert.equal(saw.motoLowStamina, true);
  const alternate = simulateCar({ seed: 1, home: carHome });
  const baseline = simulateCar({ seed: 0, home: carHome });
  assert.notDeepEqual(alternate.result.gp.order.map((row) => row.timeMs), baseline.result.gp.order.map((row) => row.timeMs));
});
