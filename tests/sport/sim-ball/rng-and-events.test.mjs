import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  EVENT_KEYS,
  createRng,
  hashSeed,
  makeEvent,
  pickWeighted,
  sportError,
} from '../../../src/sport/common/rng-and-events.mjs';

test('hashSeed accepts uint32 and strings and rejects everything else', () => {
  assert.equal(hashSeed(0), 0);
  assert.equal(hashSeed(42), 42);
  assert.equal(hashSeed(0xffffffff), 0xffffffff);
  assert.equal(hashSeed('parade'), hashSeed('parade'));
  assert.notEqual(hashSeed('parade'), hashSeed('parade-2'));
  assert.notEqual(hashSeed(7), hashSeed('7'));
  for (const bad of [-1, 1.5, 0x100000000, '', null, undefined, {}]) {
    assert.throws(() => hashSeed(bad), (error) => error.code === 'BAD_SEED');
  }
});

test('createRng is deterministic and does not touch Math.random', () => {
  const first = createRng(99);
  const second = createRng(99);
  const draws = Array.from({ length: 8 }, () => first.next());
  assert.deepEqual(draws, Array.from({ length: 8 }, () => second.next()));
  assert.ok(draws.every((value) => value >= 0 && value < 1));
  assert.equal(createRng(5).nextInt(4), createRng(5).nextInt(4));
  assert.throws(() => createRng(1).nextInt(0), (error) => error.code === 'BAD_RANGE');
  const rng = createRng(3);
  assert.equal(rng.chance(0), false);
  assert.equal(rng.chance(1), true);
  assert.equal(rng.getState() >>> 0, rng.getState());
});

test('pickWeighted respects weights and makeEvent keeps the contract shape', () => {
  const rng = createRng(8);
  const counts = { a: 0, b: 0 };
  for (let index = 0; index < 400; index += 1) {
    const picked = pickWeighted(rng, ['a', 'b'], (item) => (item === 'a' ? 3 : 1));
    counts[picked] += 1;
  }
  assert.ok(counts.a > counts.b);

  const event = makeEvent({ t: 12, type: 'goal', actors: ['Noodle Keeper'], text: '12\' a practice whistle.' });
  assert.deepEqual(Object.keys(event), [...EVENT_KEYS]);
  assert.throws(() => makeEvent({ t: -1, type: 'goal', text: 'nope' }), (error) => error.code === 'BAD_EVENT');
  assert.throws(() => makeEvent({ t: 0, type: '', text: 'nope' }), (error) => error.code === 'BAD_EVENT');
  assert.equal(sportError('BAD_SEED', 'nope').code, 'BAD_SEED');
});

test('ball sim sources do not pull the card engine or an unseeded clock', () => {
  const files = [
    'src/sport/common/rng-and-events.mjs',
    'src/sport/football/simulate.mjs',
    'src/sport/football/formations.mjs',
    'src/sport/football/commentary.mjs',
    'src/sport/football/tuning.mjs',
    'src/sport/basket/simulate.mjs',
    'src/sport/basket/schemes.mjs',
    'src/sport/basket/commentary.mjs',
    'src/sport/basket/tuning.mjs',
  ];
  for (const file of files) {
    const source = readFileSync(new URL(`../../../${file}`, import.meta.url), 'utf8');
    assert.equal(/from\s+['"][^'"]*(?:engine|gacha)/.test(source), false, file);
    assert.equal(source.includes('Math.random('), false, file);
    assert.equal(source.includes('Date.now('), false, file);
    assert.equal(source.includes('PRODUCTION_READY'), false, file);
  }
});
