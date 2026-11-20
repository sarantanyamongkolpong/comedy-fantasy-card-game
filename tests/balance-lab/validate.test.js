import assert from 'node:assert/strict';
import test from 'node:test';
import { PARAMETER_QUESTIONS } from '../../tools/balance-lab/vocabulary.js';
import { validateConfig } from '../../tools/balance-lab/validate-config.js';
import { experimentalConfig, flat } from './fixture.js';

test('a complete EXPERIMENTAL scenario is accepted', () => {
  const result = validateConfig(experimentalConfig());
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});

test('every missing undecided parameter is a hard error with its question id', () => {
  const empty = experimentalConfig();
  empty.parameters = {};
  const result = validateConfig(empty);
  assert.equal(result.ok, false);
  for (const [key, questionId] of Object.entries(PARAMETER_QUESTIONS)) {
    const match = result.errors.find((error) => error.path === `parameters.${key}`);
    assert.ok(match, key);
    assert.equal(match.questionId, questionId);
  }
});

test('a missing section names that question and does not invent a value', () => {
  for (const [key, questionId] of Object.entries(PARAMETER_QUESTIONS)) {
    const config = experimentalConfig();
    delete config.parameters[key];
    const result = validateConfig(config);
    assert.equal(result.ok, false, key);
    assert.ok(
      result.errors.some((error) => error.path === `parameters.${key}` && error.questionId === questionId),
      key,
    );
  }
});

test('POW, DEF, and SPD must be supplied on every avatar', () => {
  for (const stat of ['pow', 'def', 'spd']) {
    const config = experimentalConfig();
    delete config.sides.A.members[0][stat];
    const result = validateConfig(config);
    assert.equal(result.ok, false, stat);
    assert.ok(result.errors.some((error) => error.path === `sides.A.members[0].${stat}`), stat);
  }
});

test('unknown fields, fixed rules, and out-of-scope questions are rejected', () => {
  const config = experimentalConfig();
  config.parameters.baseAp = 9;
  config.parameters.apLeftover = 'bank';
  config.parameters.gachaRate = 0.1;
  config.extra = true;
  const result = validateConfig(config);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.path === 'parameters.baseAp' && /fixed rule/.test(error.message)));
  assert.ok(result.errors.some((error) => error.path === 'parameters.apLeftover' && /Q-AP-LEFTOVER/.test(error.message)));
  assert.ok(result.errors.some((error) => error.path === 'parameters.gachaRate' && /Q-GACHA/.test(error.message)));
  assert.ok(result.errors.some((error) => error.path === '$.extra'));
});

test('the turn cap cannot be turned into a winner', () => {
  const config = experimentalConfig({ parameters: { turnCap: { maxTurns: 4, atCap: 'sideAWins' } } });
  const result = validateConfig(config);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.questionId === 'Q-TURN-LIMIT' && error.path === 'parameters.turnCap.atCap'));
});

test('production ids, a bad label, and a named damage preset are rejected', () => {
  const ids = experimentalConfig();
  ids.sides.A.members[0].avatarId = 'AVT_AEG_001';
  assert.equal(validateConfig(ids).ok, false);

  const label = experimentalConfig();
  label.label = 'PRODUCTION_READY';
  assert.equal(validateConfig(label).ok, false);

  const preset = experimentalConfig({
    parameters: { damage: { atk: { ...flat(1), kind: 'powMinusDef' } } },
  });
  const result = validateConfig(preset);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.questionId === 'Q-DAMAGE' && /linear/.test(error.message)));
});

test('an action-limit mode cannot hide a number that it does not use', () => {
  const config = experimentalConfig({
    parameters: { actionLimit: { mode: 'apOnly', maxPlays: 1, maxByType: { ATK: null, DEF: null, Skill: null } } },
  });
  const result = validateConfig(config);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.questionId === 'Q-ACTION-LIMIT'));
});

test('deck composition must list a count for every action type', () => {
  const config = experimentalConfig();
  config.parameters.deck.composition = [{ actionType: 'ATK', count: 8 }];
  config.parameters.deck.size = 8;
  const result = validateConfig(config);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.questionId === 'Q-DECK-SIZE'));
});
