import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { analyzeStatic } from './analyze.js';
import { ConfigError } from './errors.js';
import { loadScenario } from './load.js';
import { runScenario } from './simulate.js';
import { DISCLAIMER, EVALUATOR_DEFINITIONS, LAB_LABEL } from './vocabulary.js';

const DELTA_FIELDS = Object.freeze([
  'averageTurns',
  'averageRounds',
  'winRateA',
  'winRateB',
  'unresolvedRate',
  'averageApSpentA',
  'averageApSpentB',
  'averageApSpentTotal',
]);

/**
 * Run two supplied scenarios and subtract right from left. Does not rank them.
 * @param {object} left
 * @param {object} right
 */
export function compareConfigs(left, right) {
  const leftReport = runScenario(left);
  const rightReport = runScenario(right);
  const deltas = {};
  for (const field of DELTA_FIELDS) {
    const a = leftReport.summary[field];
    const b = rightReport.summary[field];
    deltas[field] = a === null || b === null ? null : a - b;
  }
  return {
    label: LAB_LABEL,
    implementationStatus: LAB_LABEL,
    disclaimer: DISCLAIMER,
    note: 'Deltas are left minus right under each scenario\'s own supplied parameters. They are not a balance recommendation.',
    evaluatorDefinitions: EVALUATOR_DEFINITIONS,
    left: brief(leftReport),
    right: brief(rightReport),
    deltas,
    leftReport,
    rightReport,
  };
}

/**
 * Cross the supplied policySweep with itself. Policies stay labelled EXPERIMENTAL.
 * @param {object} config
 */
export function sweepPolicies(config) {
  if (!Array.isArray(config.policySweep) || config.policySweep.length === 0) {
    throw new ConfigError([
      {
        path: 'policySweep',
        message: 'sweep needs a non-empty policySweep array of EXPERIMENTAL policies',
        questionId: null,
      },
    ]);
  }
  const cells = [];
  for (const policyA of config.policySweep) {
    for (const policyB of config.policySweep) {
      const variant = structuredClone(config);
      variant.policies = { sideA: structuredClone(policyA), sideB: structuredClone(policyB) };
      const report = runScenario(variant);
      cells.push({
        label: LAB_LABEL,
        policyA: policyA.id,
        policyB: policyB.id,
        battles: report.summary.battles,
        winsA: report.summary.winsA,
        winsB: report.summary.winsB,
        unresolved: report.summary.unresolved,
        averageTurns: report.summary.averageTurns,
        averageApSpentTotal: report.summary.averageApSpentTotal,
      });
    }
  }
  return {
    label: LAB_LABEL,
    implementationStatus: LAB_LABEL,
    disclaimer: DISCLAIMER,
    scenarioId: config.scenarioId,
    notes: config.notes,
    evaluatorDefinitions: EVALUATOR_DEFINITIONS,
    parameters: config.parameters,
    static: analyzeStatic(config),
    cells,
    observation: observeDominance(cells),
  };
}

/**
 * @param {string} directory
 */
export function runDirectory(directory) {
  const files = readdirSync(directory)
    .filter((name) => name.startsWith('EXPERIMENTAL_') && name.endsWith('.json'))
    .sort();
  if (files.length === 0) {
    throw new ConfigError([
      { path: directory, message: 'no EXPERIMENTAL_*.json scenarios', questionId: null },
    ]);
  }
  return files.map((name) => ({
    file: name,
    report: runScenario(loadScenario(join(directory, name))),
  }));
}

function brief(report) {
  return {
    scenarioId: report.scenarioId,
    notes: report.notes,
    policies: report.policies,
    summary: report.summary,
    impossibleAp: report.static.impossibleAp,
    unreachable: report.static.unreachable,
    maxSpendableAp: report.static.maxSpendableAp,
  };
}

/**
 * Highest win rate per seat. A tie leaves experimentalDominantPolicy null.
 * @param {object[]} cells
 */
export function observeDominance(cells) {
  return {
    sideA: seatObservation(cells, 'A'),
    sideB: seatObservation(cells, 'B'),
    note: 'EXPERIMENTAL observation under the supplied assumptions and seat. Mirror pairings are included. Not a balance recommendation.',
  };
}

function seatObservation(cells, seat) {
  const key = seat === 'A' ? 'policyA' : 'policyB';
  const winKey = seat === 'A' ? 'winsA' : 'winsB';
  const policies = [...new Set(cells.map((cell) => cell[key]))];
  const rates = policies.map((policy) => {
    const rows = cells.filter((cell) => cell[key] === policy);
    const wins = rows.reduce((sum, row) => sum + row[winKey], 0);
    const battles = rows.reduce((sum, row) => sum + row.battles, 0);
    return { policy, wins, battles, winRate: battles === 0 ? null : wins / battles };
  });
  const finite = rates.filter((row) => row.winRate !== null);
  const best = finite.length === 0 ? null : Math.max(...finite.map((row) => row.winRate));
  const leaders = finite.filter((row) => row.winRate === best);
  return {
    rates,
    experimentalDominantPolicy: leaders.length === 1 ? leaders[0].policy : null,
    tied: leaders.length !== 1,
    tiedPolicyIds: leaders.map((row) => row.policy),
  };
}
