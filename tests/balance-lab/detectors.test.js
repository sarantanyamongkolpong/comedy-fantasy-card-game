import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeStatic } from '../../tools/balance-lab/analyze.js';
import { loadScenario } from '../../tools/balance-lab/load.js';
import { sweepPolicies } from '../../tools/balance-lab/run-set.js';
import { runBattle, runScenario } from '../../tools/balance-lab/simulate.js';
import { experimentalConfig, flat, policy } from './fixture.js';

test('zero damage is reported as a repeated state and not as a winner', () => {
  const battle = runBattle(
    experimentalConfig({
      scenarioId: 'EXPERIMENTAL_zero',
      parameters: { damage: { atk: flat(0) }, turnCap: { maxTurns: 20, atCap: 'unresolved' } },
    }),
    1,
  );
  assert.equal(battle.stoppedReason, 'repeated-state');
  assert.equal(battle.loop.kind, 'repeated-state');
  assert.ok(battle.loop.repeatTurn > battle.loop.firstTurn);
  assert.ok(battle.turns < 20);
  assert.equal(battle.winnerSideId, null);
  assert.equal(battle.outcome.status, 'unresolved');
  assert.equal(battle.outcome.verdict, null);
});

test('a growing bonus that never repeats is reported at the turn cap', () => {
  const battle = runBattle(
    experimentalConfig({
      scenarioId: 'EXPERIMENTAL_grow',
      parameters: {
        damage: { atk: flat(0) },
        skill: { kind: 'buffStat', amount: flat(1), grantsAp: 0, stat: 'pow', duration: 'battle', stacks: 'add' },
        targeting: { skill: 'firstLivingAlly' },
        deck: {
          size: 8,
          composition: [
            { actionType: 'ATK', count: 0 },
            { actionType: 'DEF', count: 0 },
            { actionType: 'Skill', count: 8 },
          ],
        },
        draw: {
          openingCount: 5,
          eachTurnCount: 1,
          timing: 'turnStart',
          openingIncludesFirstTurn: true,
          emptyDeck: 'reshuffleDiscard',
          handFull: 'skipCard',
          order: 'listed',
        },
        discard: { playedCardsGoTo: 'discardPile' },
        actionLimit: { mode: 'maxPlays', maxPlays: 1, maxByType: { ATK: null, DEF: null, Skill: null } },
        turnCap: { maxTurns: 8, atCap: 'unresolved' },
      },
      policies: { sideA: policy('always-Skill', ['Skill']), sideB: policy('always-Skill', ['Skill']) },
    }),
    1,
  );
  assert.equal(battle.stoppedReason, 'turn-cap');
  assert.equal(battle.loop, null);
  assert.equal(battle.winnerSideId, null);
  assert.equal(battle.turns, 8);
  assert.equal(battle.outcome.status, 'unresolved');
});

test('a draw that recycles into a full hand is reported as a draw loop', () => {
  const battle = runBattle(
    experimentalConfig({
      scenarioId: 'EXPERIMENTAL_drawloop',
      parameters: {
        apCost: { byActionType: { ATK: 6, DEF: 1, Skill: 1 } },
        deck: {
          size: 6,
          composition: [
            { actionType: 'ATK', count: 6 },
            { actionType: 'DEF', count: 0 },
            { actionType: 'Skill', count: 0 },
          ],
        },
        draw: {
          openingCount: 5,
          eachTurnCount: 5,
          timing: 'turnStart',
          openingIncludesFirstTurn: true,
          emptyDeck: 'reshuffleDiscard',
          handFull: 'discardDrawn',
          order: 'listed',
        },
        discard: { playedCardsGoTo: 'discardPile' },
        turnCap: { maxTurns: 6, atCap: 'unresolved' },
      },
    }),
    1,
  );
  assert.equal(battle.stoppedReason, 'repeated-state');
  assert.equal(battle.loop.kind, 'draw-loop');
  assert.equal(battle.winnerSideId, null);
});

test('cards that cost more than the AP a turn can spend are flagged, including helper grants', () => {
  const costly = analyzeStatic(
    experimentalConfig({
      scenarioId: 'EXPERIMENTAL_costly',
      parameters: {
        apCost: { byActionType: { ATK: 1, DEF: 1, Skill: 8 } },
        deck: {
          size: 8,
          composition: [
            { actionType: 'ATK', count: 0 },
            { actionType: 'DEF', count: 0 },
            { actionType: 'Skill', count: 8 },
          ],
        },
      },
    }),
  );
  assert.equal(costly.maxSpendableAp, 5);
  assert.equal(costly.impossibleAp.length, 8);
  assert.ok(costly.impossibleAp.every((row) => row.actionType === 'Skill' && row.inDeck && row.cost === 8));
  assert.ok(costly.unreachable.some((row) => row.actionType === 'Skill' && row.reason === 'impossibleApCost'));

  const helped = analyzeStatic(
    experimentalConfig({
      scenarioId: 'EXPERIMENTAL_helped',
      parameters: {
        skill: { kind: 'noEffect', amount: null, grantsAp: 4, stat: null, duration: null, stacks: null },
        apCost: { byActionType: { ATK: 9, DEF: 1, Skill: 1 } },
        deck: {
          size: 8,
          composition: [
            { actionType: 'ATK', count: 2 },
            { actionType: 'DEF', count: 0 },
            { actionType: 'Skill', count: 6 },
          ],
        },
      },
    }),
  );
  assert.equal(helped.impossibleAp.length, 0);
  assert.ok(helped.maxSpendableAp >= 9);

  const onePlay = analyzeStatic(
    experimentalConfig({
      scenarioId: 'EXPERIMENTAL_one_play',
      parameters: {
        skill: { kind: 'noEffect', amount: null, grantsAp: 4, stat: null, duration: null, stacks: null },
        apCost: { byActionType: { ATK: 9, DEF: 1, Skill: 1 } },
        actionLimit: { mode: 'maxPlays', maxPlays: 1, maxByType: { ATK: null, DEF: null, Skill: null } },
        deck: {
          size: 8,
          composition: [
            { actionType: 'ATK', count: 2 },
            { actionType: 'DEF', count: 0 },
            { actionType: 'Skill', count: 6 },
          ],
        },
      },
    }),
  );
  assert.ok(onePlay.impossibleAp.some((row) => row.actionType === 'ATK' && row.cost === 9));
});

test('a type missing from the deck or capped at zero is unreachable', () => {
  const analysis = analyzeStatic(
    experimentalConfig({
      scenarioId: 'EXPERIMENTAL_missing_def',
      parameters: {
        deck: {
          size: 8,
          composition: [
            { actionType: 'ATK', count: 8 },
            { actionType: 'DEF', count: 0 },
            { actionType: 'Skill', count: 0 },
          ],
        },
        actionLimit: {
          mode: 'maxByType',
          maxPlays: null,
          maxByType: { ATK: 5, DEF: 0, Skill: 1 },
        },
      },
    }),
  );
  assert.ok(analysis.unreachable.some((row) => row.actionType === 'DEF' && row.reason === 'notInDeck'));
  assert.ok(analysis.unreachable.some((row) => row.actionType === 'DEF' && row.reason === 'forbiddenByActionLimit'));
  assert.ok(analysis.unreachable.some((row) => row.actionType === 'Skill' && row.reason === 'notInDeck'));
  assert.deepEqual(analysis.policyOmitted.sideA, ['DEF', 'Skill']);
});

test('the unreachable sample still finishes and keeps both findings', () => {
  const config = loadScenario(new URL('../../tools/balance-lab/scenarios/EXPERIMENTAL_unreachable.json', import.meta.url));
  const report = runScenario(config);
  assert.equal(report.battles[0].winnerSideId, 'LAB_SIDE_A');
  assert.ok(report.static.impossibleAp.some((row) => row.actionType === 'Skill' && row.cost === 8 && row.inDeck));
  assert.ok(report.static.unreachable.some((row) => row.actionType === 'DEF' && row.reason === 'notInDeck'));
  assert.ok(report.summary.neverPlayedAcrossBattles.includes('Skill'));
  assert.ok(report.summary.neverPlayedAcrossBattles.includes('DEF'));
});

test('the stalemate sample stops on a repeated state inside the cap', () => {
  const report = runScenario(
    loadScenario(new URL('../../tools/balance-lab/scenarios/EXPERIMENTAL_stalemate.json', import.meta.url)),
  );
  const battle = report.battles[0];
  assert.equal(battle.stoppedReason, 'repeated-state');
  assert.equal(battle.winnerSideId, null);
  assert.equal(report.summary.unresolved, 1);
  assert.equal(report.summary.winsA, 0);
});

test('an EXPERIMENTAL policy sweep names a strictly higher win rate per seat', () => {
  const config = loadScenario(new URL('../../tools/balance-lab/scenarios/EXPERIMENTAL_burst.json', import.meta.url));
  const sweep = sweepPolicies(config);
  assert.equal(sweep.label, 'EXPERIMENTAL');
  assert.equal(sweep.cells.length, 9);
  assert.equal(sweep.observation.sideA.experimentalDominantPolicy, 'always-ATK');
  assert.equal(sweep.observation.sideB.experimentalDominantPolicy, 'always-ATK');
  assert.match(sweep.observation.note, /Not a balance recommendation/);
  const mirror = sweep.cells.find((cell) => cell.policyA === 'always-ATK' && cell.policyB === 'always-ATK');
  assert.equal(mirror.winsA, 3);
  assert.equal(mirror.winsB, 0);
  const stalled = sweep.cells.find((cell) => cell.policyA === 'always-DEF' && cell.policyB === 'always-DEF');
  assert.equal(stalled.unresolved, 3);
  assert.equal(stalled.winsA, 0);
});
