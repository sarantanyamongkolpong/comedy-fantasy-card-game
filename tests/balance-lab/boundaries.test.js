import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { CARD_ACTION_TYPES } from '../../src/schema/constants.js';
import { ACTION_TYPES, EVALUATOR_DEFINITIONS } from '../../tools/balance-lab/vocabulary.js';

test('laboratory action types stay the engine list, and reports name the evaluator', () => {
  assert.deepEqual(ACTION_TYPES, [...CARD_ACTION_TYPES]);
  for (const key of [
    'formulaClamp',
    'repeatSeed',
    'rng',
    'fingerprintExcludes',
    'dominanceDenominator',
    'maxSpendableAp',
    'teamSpdReadsBase',
    'playThenResolve',
  ]) {
    assert.equal(typeof EVALUATOR_DEFINITIONS[key], 'string', key);
  }
});

test('the laboratory does not import production catalogs, test stubs, or its own RNG substitute', () => {
  const root = new URL('../../tools/balance-lab/', import.meta.url).pathname;
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name.endsWith('.js')) files.push(path);
    }
  };
  walk(root);
  assert.ok(files.length > 5);
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    assert.equal(source.includes('SAMPLE_AVATARS'), false, file);
    assert.equal(source.includes('SAMPLE_ACTION_CARDS'), false, file);
    assert.equal(source.includes('stub-rules'), false, file);
    assert.equal(source.includes('Math.random'), false, file);
    assert.equal(source.includes('Date.now'), false, file);
    assert.equal(source.includes("from '../../src/avatars/"), false, file);
    assert.equal(source.includes("from '../../src/cards/catalog"), false, file);
  }
});
