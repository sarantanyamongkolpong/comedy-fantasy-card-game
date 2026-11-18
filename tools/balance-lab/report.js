import { analyzeStatic } from './analyze.js';
import { DISCLAIMER, EVALUATOR_DEFINITIONS, FIXED_RULES, LAB_LABEL } from './vocabulary.js';

export const BATTLE_COLUMNS = Object.freeze([
  'scenarioId',
  'label',
  'repeatIndex',
  'seed',
  'seedConsumed',
  'policyA',
  'policyB',
  'stoppedReason',
  'winnerSideId',
  'loserSideId',
  'simultaneous',
  'turns',
  'rounds',
  'apSpentA',
  'apSpentB',
  'apRefreshedA',
  'apRefreshedB',
  'apLeftoverA',
  'apLeftoverB',
  'grantsA',
  'grantsB',
  'playsAtkA',
  'playsDefA',
  'playsSkillA',
  'playsAtkB',
  'playsDefB',
  'playsSkillB',
  'loopKind',
  'loopFirstTurn',
  'loopRepeatTurn',
]);

/**
 * @param {object} config
 * @param {object[]} battles
 */
export function buildScenarioReport(config, battles) {
  return {
    label: LAB_LABEL,
    implementationStatus: LAB_LABEL,
    disclaimer: DISCLAIMER,
    laboratory: 'tools/balance-lab',
    scenarioId: config.scenarioId,
    notes: config.notes,
    seed: config.seed,
    repeats: config.repeats,
    repeatSeedStep: config.repeatSeedStep,
    fixedRules: FIXED_RULES,
    evaluatorDefinitions: EVALUATOR_DEFINITIONS,
    parameters: config.parameters,
    policies: {
      sideA: config.policies.sideA,
      sideB: config.policies.sideB,
    },
    static: analyzeStatic(config),
    summary: summarizeBattles(battles),
    battles,
  };
}

/**
 * @param {object[]} battles
 */
export function summarizeBattles(battles) {
  const winsA = battles.filter((battle) => battle.winnerSideId === battle.sideIds.A).length;
  const winsB = battles.filter((battle) => battle.winnerSideId === battle.sideIds.B).length;
  const unresolved = battles.filter((battle) => battle.stoppedReason !== 'decided').length;
  const count = battles.length;
  const turns = battles.map((battle) => battle.turns);
  const stoppedReasons = { decided: 0, 'turn-cap': 0, 'repeated-state': 0 };
  for (const battle of battles) stoppedReasons[battle.stoppedReason] += 1;
  const playTotals = { ATK: 0, DEF: 0, Skill: 0 };
  for (const battle of battles) {
    for (const side of ['A', 'B']) {
      for (const actionType of Object.keys(playTotals)) {
        playTotals[actionType] += battle.plays[side][actionType];
      }
    }
  }
  return {
    battles: count,
    winsA,
    winsB,
    unresolved,
    winRateA: count === 0 ? null : winsA / count,
    winRateB: count === 0 ? null : winsB / count,
    unresolvedRate: count === 0 ? null : unresolved / count,
    averageTurns: mean(turns),
    minTurns: count === 0 ? null : Math.min(...turns),
    maxTurns: count === 0 ? null : Math.max(...turns),
    averageRounds: mean(battles.map((battle) => battle.rounds)),
    averageApSpentA: mean(battles.map((battle) => battle.ap.A.spent)),
    averageApSpentB: mean(battles.map((battle) => battle.ap.B.spent)),
    averageApSpentTotal: mean(battles.map((battle) => battle.ap.A.spent + battle.ap.B.spent)),
    stoppedReasons,
    simultaneousBattles: battles.filter((battle) => battle.simultaneous).length,
    neverPlayedAcrossBattles: ['ATK', 'DEF', 'Skill'].filter((actionType) => playTotals[actionType] === 0),
  };
}

/**
 * @param {object} report
 */
export function formatScenario(report) {
  const summary = report.summary;
  const impossible =
    report.static.impossibleAp.length === 0
      ? 'none'
      : report.static.impossibleAp
          .map((row) => `${row.actionType}${row.index === null ? '' : `#${row.index}`} cost ${row.cost} > ${row.maxPayableAp}`)
          .join('; ');
  const unreachable =
    report.static.unreachable.length === 0
      ? 'none'
      : report.static.unreachable.map((row) => `${row.actionType} (${row.reason})`).join('; ');
  return [
    'EXPERIMENTAL balance lab',
    `scenario: ${report.scenarioId}`,
    `notes: ${report.notes}`,
    `battles: ${summary.battles}`,
    `average turns: ${formatNumber(summary.averageTurns)} (min ${summary.minTurns}, max ${summary.maxTurns})`,
    `wins A/B/unresolved: ${summary.winsA}/${summary.winsB}/${summary.unresolved}`,
    `win rate A/B: ${formatNumber(summary.winRateA)}/${formatNumber(summary.winRateB)}`,
    `average AP spent A/B: ${formatNumber(summary.averageApSpentA)}/${formatNumber(summary.averageApSpentB)}`,
    `stops: decided ${summary.stoppedReasons.decided}, turn-cap ${summary.stoppedReasons['turn-cap']}, repeated-state ${summary.stoppedReasons['repeated-state']}`,
    `impossible AP: ${impossible}`,
    `unreachable: ${unreachable}`,
    `never played: ${summary.neverPlayedAcrossBattles.join(', ') || 'none'}`,
    `max spendable AP: ${report.static.maxSpendableAp}`,
    report.disclaimer,
  ].join('\n');
}

/**
 * @param {object} report
 */
export function formatCompare(report) {
  const lines = [
    'EXPERIMENTAL balance lab compare',
    `left: ${report.left.scenarioId} average turns ${formatNumber(report.left.summary.averageTurns)} win rate A ${formatNumber(report.left.summary.winRateA)}`,
    `right: ${report.right.scenarioId} average turns ${formatNumber(report.right.summary.averageTurns)} win rate A ${formatNumber(report.right.summary.winRateA)}`,
    `delta average turns (left - right): ${formatNumber(report.deltas.averageTurns)}`,
    `delta win rate A (left - right): ${formatNumber(report.deltas.winRateA)}`,
    `delta average AP spent total (left - right): ${formatNumber(report.deltas.averageApSpentTotal)}`,
    report.note,
    report.disclaimer,
  ];
  return lines.join('\n');
}

/**
 * @param {object} report
 */
export function formatSweep(report) {
  const lines = [
    'EXPERIMENTAL balance lab sweep',
    `scenario: ${report.scenarioId}`,
    'policyA, policyB, winsA, winsB, unresolved, averageTurns',
  ];
  for (const cell of report.cells) {
    lines.push(
      `${cell.policyA}, ${cell.policyB}, ${cell.winsA}, ${cell.winsB}, ${cell.unresolved}, ${formatNumber(cell.averageTurns)}`,
    );
  }
  lines.push(
    `seat A experimental dominant policy: ${report.observation.sideA.experimentalDominantPolicy ?? 'none (tie)'}`,
  );
  lines.push(
    `seat B experimental dominant policy: ${report.observation.sideB.experimentalDominantPolicy ?? 'none (tie)'}`,
  );
  lines.push(report.observation.note);
  lines.push(report.disclaimer);
  return lines.join('\n');
}

/**
 * @param {object} battle
 */
export function battleRow(battle) {
  return {
    scenarioId: battle.scenarioId,
    label: battle.label,
    repeatIndex: battle.repeatIndex,
    seed: battle.seed,
    seedConsumed: battle.seedConsumed,
    policyA: battle.policyA,
    policyB: battle.policyB,
    stoppedReason: battle.stoppedReason,
    winnerSideId: battle.winnerSideId,
    loserSideId: battle.loserSideId,
    simultaneous: battle.simultaneous,
    turns: battle.turns,
    rounds: battle.rounds,
    apSpentA: battle.ap.A.spent,
    apSpentB: battle.ap.B.spent,
    apRefreshedA: battle.ap.A.refreshed,
    apRefreshedB: battle.ap.B.refreshed,
    apLeftoverA: battle.ap.A.leftover,
    apLeftoverB: battle.ap.B.leftover,
    grantsA: battle.ap.A.grants,
    grantsB: battle.ap.B.grants,
    playsAtkA: battle.plays.A.ATK,
    playsDefA: battle.plays.A.DEF,
    playsSkillA: battle.plays.A.Skill,
    playsAtkB: battle.plays.B.ATK,
    playsDefB: battle.plays.B.DEF,
    playsSkillB: battle.plays.B.Skill,
    loopKind: battle.loop?.kind ?? '',
    loopFirstTurn: battle.loop?.firstTurn ?? '',
    loopRepeatTurn: battle.loop?.repeatTurn ?? '',
  };
}

/**
 * @param {object[]} rows
 * @param {readonly string[]} [columns]
 */
export function toCsv(rows, columns = BATTLE_COLUMNS) {
  const header = columns.join(',');
  const body = rows.map((row) => columns.map((column) => csvCell(row[column])).join(','));
  return `${[header, ...body].join('\n')}\n`;
}

function csvCell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function mean(values) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatNumber(value) {
  if (value === null || value === undefined) return 'n/a';
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 1000) / 1000);
}
