import assert from 'node:assert/strict';
import test from 'node:test';
import { SAMPLE_ACTION_CARDS, SAMPLE_AVATARS } from '../../src/index.js';
import { BASE_AP } from '../../src/schema/constants.js';
import { evaluateOutcome } from '../../src/battle/battle.js';
import { ConfigError } from '../../tools/balance-lab/errors.js';
import { loadScenario } from '../../tools/balance-lab/load.js';
import { compareConfigs } from '../../tools/balance-lab/run-set.js';
import { openBattle, runBattle, runScenario } from '../../tools/balance-lab/simulate.js';
import { experimentalConfig, flat, policy } from './fixture.js';

const catalogBefore = JSON.stringify({ SAMPLE_AVATARS, SAMPLE_ACTION_CARDS });

test('the same scenario and seed produce the same report', () => {
  const config = experimentalConfig({ repeats: 2, seed: 4, repeatSeedStep: 3 });
  assert.deepEqual(runScenario(config), runScenario(config));
});

test('a one-hit fight records the engine winner, turns, and AP from the play log', () => {
  const report = runScenario(experimentalConfig());
  const battle = report.battles[0];
  assert.equal(report.implementationStatus, 'EXPERIMENTAL');
  assert.match(report.disclaimer, /not PRODUCTION_READY/);
  assert.equal(report.fixedRules.baseAp, BASE_AP);
  assert.equal(battle.stoppedReason, 'decided');
  assert.equal(battle.winnerSideId, 'LAB_SIDE_A');
  assert.equal(battle.loserSideId, 'LAB_SIDE_B');
  assert.equal(battle.outcome.verdict.LAB_SIDE_A, 'victory');
  assert.equal(battle.turns, 1);
  assert.equal(battle.ap.A.spent, 4);
  assert.equal(battle.ap.A.refreshed, BASE_AP);
  assert.equal(battle.ap.A.refreshed + battle.ap.A.grants - battle.ap.A.spent, battle.ap.A.leftover);
  assert.equal(battle.plays.A.ATK, 4);
  assert.equal(battle.seedConsumed, false);
  assert.equal(report.summary.averageTurns, 1);
  assert.equal(report.summary.winRateA, 1);
});

test('repeats average turns and keep each battle seed', () => {
  const report = runScenario(experimentalConfig({ repeats: 3, seed: 10, repeatSeedStep: 2 }));
  assert.deepEqual(
    report.battles.map((battle) => battle.seed),
    [10, 12, 14],
  );
  assert.equal(report.summary.averageTurns, 1);
  assert.equal(report.summary.battles, 3);
});

test('team SPD aggregation is the supplied rule, including when side B is faster', () => {
  const sides = {
    A: {
      sideId: 'LAB_SIDE_A',
      members: [
        { avatarId: 'LAB_A1', pow: 1, def: 0, spd: 10 },
        { avatarId: 'LAB_A2', pow: 1, def: 0, spd: 0 },
        { avatarId: 'LAB_A3', pow: 1, def: 0, spd: 0 },
        { avatarId: 'LAB_A4', pow: 1, def: 0, spd: 0 },
      ],
    },
    B: {
      sideId: 'LAB_SIDE_B',
      members: [
        { avatarId: 'LAB_B1', pow: 1, def: 0, spd: 4 },
        { avatarId: 'LAB_B2', pow: 1, def: 0, spd: 4 },
        { avatarId: 'LAB_B3', pow: 1, def: 0, spd: 4 },
        { avatarId: 'LAB_B4', pow: 1, def: 0, spd: 4 },
      ],
    },
  };
  const summed = runBattle(experimentalConfig({ scenarioId: 'EXPERIMENTAL_sum', sides }), 1);
  const maxed = runBattle(
    experimentalConfig({
      scenarioId: 'EXPERIMENTAL_max',
      sides,
      parameters: { teamSpd: { aggregation: 'max', rounding: 'none' } },
    }),
    1,
  );
  assert.equal(summed.startingSideId, 'LAB_SIDE_B');
  assert.equal(summed.teamSpd.LAB_SIDE_B, 16);
  assert.equal(maxed.startingSideId, 'LAB_SIDE_A');
  assert.equal(maxed.teamSpd.LAB_SIDE_A, 10);
  assert.equal(summed.winnerSideId, 'LAB_SIDE_B');
  assert.equal(maxed.winnerSideId, 'LAB_SIDE_A');
});

test('a seeded SPD tie-break is deterministic and can name either side', () => {
  const tied = {
    A: {
      sideId: 'LAB_SIDE_A',
      members: [1, 2, 3, 4].map((n) => ({ avatarId: `LAB_A${n}`, pow: 1, def: 0, spd: 2 })),
    },
    B: {
      sideId: 'LAB_SIDE_B',
      members: [1, 2, 3, 4].map((n) => ({ avatarId: `LAB_B${n}`, pow: 1, def: 0, spd: 2 })),
    },
  };
  const config = experimentalConfig({
    scenarioId: 'EXPERIMENTAL_tie',
    parameters: { spdTieBreak: { method: 'seeded' } },
    sides: tied,
  });
  assert.equal(runBattle(config, 3).startingSideId, runBattle(config, 3).startingSideId);
  const starters = new Set();
  for (let seed = 1; seed <= 30; seed += 1) starters.add(runBattle(config, seed).startingSideId);
  assert.equal(starters.size, 2);
  assert.equal(runBattle(config, 1).seedConsumed, true);
});

test('an injected action cap stops a second play in the same turn', () => {
  const battle = runBattle(
    experimentalConfig({
      scenarioId: 'EXPERIMENTAL_cap',
      parameters: {
        actionLimit: { mode: 'maxPlays', maxPlays: 1, maxByType: { ATK: null, DEF: null, Skill: null } },
      },
    }),
    1,
  );
  assert.equal(battle.winnerSideId, 'LAB_SIDE_A');
  assert.equal(battle.plays.A.ATK, 4);
  assert.equal(battle.turns, 7);
  assert.equal(battle.ap.A.spent, 4);
});

test('resolveEffect is how damage lands, and a simultaneous rule can name side B', () => {
  const opened = openBattle(
    experimentalConfig({
      scenarioId: 'EXPERIMENTAL_simul',
      parameters: { simultaneousDefeat: { method: 'sideB', whenTeamSpdTied: null } },
    }),
    1,
  );
  const battle = opened.session.battle;
  assert.equal(battle.sideB.members[0].markers.hp, 10);
  for (const member of [...battle.sideA.members, ...battle.sideB.members]) member.markers.hp = 0;
  const outcome = evaluateOutcome(battle);
  assert.equal(outcome.winnerSideId, 'LAB_SIDE_B');
  assert.equal(outcome.verdict.LAB_SIDE_A, 'defeat');
});

test('a shield absorbs damage before HP when the scenario says so', () => {
  const battle = runBattle(
    experimentalConfig({
      scenarioId: 'EXPERIMENTAL_shield',
      parameters: {
        damage: {
          atk: flat(5),
          defCard: { kind: 'shield', amount: flat(3), stacks: 'add' },
          incoming: { order: ['shield'], shieldUnused: 'persist', zeroAmountConsumes: false },
        },
        targeting: { atk: 'firstLivingEnemy', def: 'firstLivingAlly' },
        deck: {
          size: 8,
          composition: [
            { actionType: 'DEF', count: 1 },
            { actionType: 'ATK', count: 7 },
            { actionType: 'Skill', count: 0 },
          ],
        },
        actionLimit: { mode: 'maxPlays', maxPlays: 1, maxByType: { ATK: null, DEF: null, Skill: null } },
        turnCap: { maxTurns: 8, atCap: 'unresolved' },
      },
      policies: { sideA: policy('always-ATK', ['ATK']), sideB: policy('always-DEF', ['DEF']) },
    }),
    1,
  );
  const absorbed = battle.effects.find(
    (effect) => effect.kind === 'damage' && effect.applications.some((row) => row.shieldBefore === 3),
  );
  assert.ok(absorbed);
  const hit = absorbed.applications.find((row) => row.shieldBefore === 3);
  assert.equal(hit.rawAmount, 5);
  assert.equal(hit.shieldAfter, 0);
  assert.equal(hit.hpBefore - hit.hpAfter, 2);
});

test('revive lets a heal select a defeated ally when the scenario asks for it', () => {
  const battle = runBattle(
    experimentalConfig({
      scenarioId: 'EXPERIMENTAL_revive',
      parameters: {
        hp: { revive: true },
        actionLimit: { mode: 'maxPlays', maxPlays: 1, maxByType: { ATK: null, DEF: null, Skill: null } },
        skill: { kind: 'heal', amount: flat(10), grantsAp: 0, stat: null, duration: null, stacks: null },
        targeting: { skill: 'lowestHpAlly' },
        deck: {
          size: 8,
          composition: [
            { actionType: 'Skill', count: 1 },
            { actionType: 'ATK', count: 7 },
            { actionType: 'DEF', count: 0 },
          ],
        },
        turnCap: { maxTurns: 6, atCap: 'unresolved' },
      },
      policies: { sideA: policy('always-ATK', ['ATK']), sideB: policy('heal-first', ['Skill', 'ATK']) },
    }),
    1,
  );
  const heal = battle.effects.find((effect) => effect.kind === 'heal');
  assert.ok(heal);
  assert.equal(heal.applications[0].hpBefore, 0);
  assert.equal(heal.applications[0].hpAfter, 10);
});

test('a non-positive starting HP is rejected instead of starting a decided battle', () => {
  assert.throws(
    () => runBattle(experimentalConfig({ scenarioId: 'EXPERIMENTAL_zero_hp', parameters: { hp: { pool: flat(0) } } }), 1),
    (error) => error instanceof ConfigError && error.errors.some((item) => item.questionId === 'Q-HP'),
  );
});

test('comparing two supplied scenarios reports deltas and does not recommend one', () => {
  const compared = compareConfigs(
    loadScenario(new URL('../../tools/balance-lab/scenarios/EXPERIMENTAL_attrition.json', import.meta.url)),
    loadScenario(new URL('../../tools/balance-lab/scenarios/EXPERIMENTAL_burst.json', import.meta.url)),
  );
  assert.ok(compared.deltas.averageTurns > 10);
  assert.equal(compared.left.summary.winRateA, 1);
  assert.equal(compared.right.summary.averageTurns, 1);
  assert.equal(compared.recommendedConfig, undefined);
  assert.match(compared.note, /not a balance recommendation/);
  assert.match(compared.disclaimer, /not PRODUCTION_READY/);
});

test('scenario files stay labelled EXPERIMENTAL and the catalog objects are unchanged', () => {
  for (const name of ['EXPERIMENTAL_attrition', 'EXPERIMENTAL_burst', 'EXPERIMENTAL_stalemate', 'EXPERIMENTAL_unreachable']) {
    const config = loadScenario(new URL(`../../tools/balance-lab/scenarios/${name}.json`, import.meta.url));
    assert.equal(config.label, 'EXPERIMENTAL');
    assert.equal(config.scenarioId, name);
  }
  assert.equal(JSON.stringify({ SAMPLE_AVATARS, SAMPLE_ACTION_CARDS }), catalogBefore);
});
