import assert from 'node:assert/strict';
import test from 'node:test';
import { firstFunction, importFirst, simCandidates } from '../../../tools/sport-qa/lib/discover.mjs';
import { simInput } from '../../../tools/sport-qa/lib/sim-input.mjs';

const SIM_NAMES = ['simulate', 'simulateFootball', 'simulateBasket', 'simulateCar', 'simulateMoto', 'simulateRace', 'default'];

async function assertDeterministic(loaded, sport) {
  if (loaded.error) throw new Error(`${loaded.file} failed to load: ${loaded.error.message}`);
  const found = firstFunction(loaded.mod, SIM_NAMES);
  assert.ok(found, `${loaded.file} exports ${Object.keys(loaded.mod ?? {}).join(', ')}; simulate is missing`);
  const input = simInput(sport, 1);
  const snapshot = structuredClone(input);
  const first = await found.fn(input);
  assert.deepEqual(input, snapshot, 'simulate mutated its input');
  const second = await found.fn(simInput(sport, 1));
  assert.deepEqual(second, first, 'the same seed produced two different results');
  assert.ok(first && typeof first === 'object', 'simulate did not return an object');
  assert.ok(Array.isArray(first.events), 'simulate result has no events array');
  assert.ok(first.events.length > 0, 'simulate returned an empty event log');
  assert.ok(first.result && typeof first.result === 'object', 'simulate result has no result object');
  const other = await found.fn(simInput(sport, 2));
  assert.notDeepEqual(other, first, 'a different seed produced the same event log');
  if (first.rewards && Object.prototype.hasOwnProperty.call(first.rewards, 'G')) {
    const tag = `${first.rewards.status ?? ''} ${first.rewards.balance ?? ''}`;
    assert.match(tag, /PROPOSED|BALANCE_PLACEHOLDER/);
  }
}

for (const sport of ['football', 'basket', 'car', 'moto']) {
  const loaded = await importFirst(simCandidates(sport));
  test(`${sport} sim is deterministic`, {
    skip: loaded.file ? false : `${sport} sim module is absent`,
  }, async () => {
    await assertDeterministic(loaded, sport);
  });
}

const racing = await importFirst([
  'src/sport/racing/sim.js',
  'src/sport/racing/index.js',
  'src/sport/racing/shared.js',
]);
const racingFn = racing.mod ? firstFunction(racing.mod, SIM_NAMES) : null;

test('racing core sim is deterministic', {
  skip: racing.file
    ? (racingFn ? false : `${racing.file} has no simulate export`)
    : 'racing core is absent',
}, async () => {
  await assertDeterministic(racing, 'car');
});
