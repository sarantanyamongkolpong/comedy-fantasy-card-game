#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ConfigError } from './errors.js';
import { loadScenario } from './load.js';
import { battleRow, formatCompare, formatScenario, formatSweep, toCsv } from './report.js';
import { compareConfigs, runDirectory, sweepPolicies } from './run-set.js';
import { runScenario } from './simulate.js';

/**
 * @param {string[]} argv
 * @param {{ stdout?: { write: (chunk: string) => void }, stderr?: { write: (chunk: string) => void } }} [io]
 */
export function main(argv, io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  try {
    return execute(argv, stdout);
  } catch (error) {
    if (error instanceof ConfigError) {
      stderr.write(`${error.message}\n`);
      return 1;
    }
    stderr.write(`${error.stack ?? error.message}\n`);
    return 1;
  }
}

/**
 * @param {string[]} argv
 * @param {{ write: (chunk: string) => void }} stdout
 */
function execute(argv, stdout) {
  const [command, ...rest] = argv;
  if (!command || command === 'help' || command === '--help') {
    stdout.write(`${usage()}\n`);
    return command ? 0 : 2;
  }
  if (command === 'validate') {
    const file = rest[0];
    if (!file) return usageError(stdout);
    loadScenario(file);
    stdout.write(`EXPERIMENTAL config ok: ${file}\n`);
    return 0;
  }
  if (command === 'run') {
    const file = rest[0];
    const out = option(rest, '--out');
    if (!file || !out) return usageError(stdout);
    const report = runScenario(loadScenario(file));
    writeScenario(out, report);
    stdout.write(`${formatScenario(report)}\n`);
    return 0;
  }
  if (command === 'compare') {
    const out = option(rest, '--out');
    const files = rest.filter((token) => token !== '--out' && token !== out);
    if (files.length !== 2 || !out) return usageError(stdout);
    const compared = compareConfigs(loadScenario(files[0]), loadScenario(files[1]));
    writeScenario(out, compared.leftReport);
    writeScenario(out, compared.rightReport);
    const name = `EXPERIMENTAL_compare_${slug(compared.left.scenarioId)}_vs_${slug(compared.right.scenarioId)}`;
    writeJson(out, `${name}.report.json`, withoutFull(compared));
    stdout.write(`${formatCompare(compared)}\n`);
    return 0;
  }
  if (command === 'sweep') {
    const file = rest[0];
    const out = option(rest, '--out');
    if (!file || !out) return usageError(stdout);
    const report = sweepPolicies(loadScenario(file));
    writeJson(out, `${report.scenarioId}.sweep.report.json`, report);
    writeFileSync(join(out, `${report.scenarioId}.sweep.csv`), toCsv(report.cells, SWEEP_COLUMNS));
    stdout.write(`${formatSweep(report)}\n`);
    return 0;
  }
  if (command === 'batch') {
    const directory = rest[0];
    const out = option(rest, '--out');
    if (!directory || !out) return usageError(stdout);
    const results = runDirectory(directory);
    for (const result of results) writeScenario(out, result.report);
    stdout.write(
      `EXPERIMENTAL batch wrote ${results.length} scenario report(s): ${results.map((result) => result.file).join(', ')}\n`,
    );
    return 0;
  }
  stdout.write(`Unknown command "${command}".\n${usage()}\n`);
  return 2;
}

const SWEEP_COLUMNS = Object.freeze([
  'label',
  'policyA',
  'policyB',
  'battles',
  'winsA',
  'winsB',
  'unresolved',
  'averageTurns',
  'averageApSpentTotal',
]);

function writeScenario(directory, report) {
  writeJson(directory, `${report.scenarioId}.report.json`, report);
  writeFileSync(join(directory, `${report.scenarioId}.battles.csv`), toCsv(report.battles.map(battleRow)));
}

function writeJson(directory, name, value) {
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, name), `${JSON.stringify(value, null, 2)}\n`);
}

function withoutFull(compared) {
  const { leftReport, rightReport, ...rest } = compared;
  return {
    ...rest,
    fullReports: [`${leftReport.scenarioId}.report.json`, `${rightReport.scenarioId}.report.json`],
  };
}

function slug(scenarioId) {
  return scenarioId.replace(/^EXPERIMENTAL_/, '');
}

function option(argv, name) {
  const index = argv.indexOf(name);
  if (index < 0) return null;
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) return null;
  return value;
}

function usageError(stdout) {
  stdout.write(`${usage()}\n`);
  return 2;
}

function usage() {
  return [
    'EXPERIMENTAL battle balance laboratory',
    'node tools/balance-lab/cli.js validate <scenario.json>',
    'node tools/balance-lab/cli.js run <scenario.json> --out <dir>',
    'node tools/balance-lab/cli.js compare <left.json> <right.json> --out <dir>',
    'node tools/balance-lab/cli.js sweep <scenario.json> --out <dir>',
    'node tools/balance-lab/cli.js batch <scenarios-dir> --out <dir>',
  ].join('\n');
}

const invokedPath = process.argv[1] ? process.argv[1].replaceAll('\\', '/') : '';
if (invokedPath.endsWith('/tools/balance-lab/cli.js')) {
  process.exitCode = main(process.argv.slice(2));
}
