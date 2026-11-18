#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  describeRuleset,
  diffValues,
  formatBattleLog,
  formatDiff,
  formatReport,
  recordScenario,
  replayLog,
  stringifyLog,
} from '../../src/debug/index.js';
import { getRuleset } from './examples/rulesets.js';
import { assertFixtureRuleset } from './guard.js';

const HELP = `Battle replay tool. Observes the public battle API. No game rules are added here.

Usage:
  node tools/replay/cli.js run <scenario.json> [--out <log.json>]
  node tools/replay/cli.js record <scenario.json> --out <log.json>
  node tools/replay/cli.js replay <log.json> [--ruleset <id-or-module.js>] [--print]
  node tools/replay/cli.js diff <left.json> <right.json>
  node tools/replay/cli.js print <log.json>

Fixture rulesets live in tools/replay/examples/rulesets.js and are labelled TEST-ONLY.
Exit 0: success, consistent replay, or equal diff.
Exit 1: inconsistent replay or unequal diff.
Exit 2: usage or unreadable input.
`;

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const positionals = [];
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') flags.help = true;
    else if (arg === '--print') flags.print = true;
    else if (arg === '--out' || arg === '--ruleset') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${arg} needs a value`);
      flags[arg.slice(2)] = value;
      index += 1;
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option ${arg}`);
    } else {
      positionals.push(arg);
    }
  }
  return { positionals, flags };
}

/**
 * @param {string} file
 */
function readJson(file) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (error) {
    throw new Error(`Cannot read ${file}: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON in ${file}: ${error.message}`);
  }
}

/**
 * @param {string | undefined} spec
 * @param {string | undefined} fallbackId
 */
async function loadRuleset(spec, fallbackId) {
  const requested = spec ?? fallbackId;
  if (!requested) throw new Error('A ruleset id or module path is required');
  if (requested.endsWith('.js') || requested.endsWith('.mjs')) {
    const href = pathToFileURL(path.resolve(requested)).href;
    const loaded = await import(href);
    const ruleset = loaded.ruleset ?? loaded.default;
    if (!ruleset || typeof ruleset.id !== 'string') {
      throw new Error(`${requested} must export ruleset { id, label, parameters, rules }`);
    }
    return ruleset;
  }
  return getRuleset(requested);
}

/**
 * @param {object} scenario
 * @param {object} ruleset
 */
function recordChecked(scenario, ruleset) {
  const described = describeRuleset(ruleset);
  assertFixtureRuleset(ruleset, described);
  return recordScenario(scenario, ruleset);
}

/**
 * @param {string[]} argv
 */
async function main(argv) {
  const { positionals, flags } = parseArgs(argv);
  const [command, ...rest] = positionals;
  if (flags.help || !command) {
    process.stdout.write(HELP);
    return 0;
  }

  if (command === 'run' || command === 'record') {
    const [file] = rest;
    if (!file) throw new Error(`${command} needs a scenario file`);
    const scenario = readJson(file);
    const ruleset = await loadRuleset(flags.ruleset, scenario.rulesetId);
    const log = recordChecked(scenario, ruleset);
    if (command === 'record' && !flags.out) throw new Error('record needs --out <log.json>');
    if (flags.out) writeFileSync(flags.out, stringifyLog(log));
    if (command === 'run') {
      process.stdout.write(formatBattleLog(log));
      const report = replayLog(log, ruleset);
      process.stdout.write('---\n');
      process.stdout.write(formatReport(report));
      return report.consistent ? 0 : 1;
    }
    process.stdout.write(
      `wrote ${flags.out}\nevents: ${log.events.length}\nruleset: ${log.ruleset.id}\nhash: ${log.ruleset.hash}\n`,
    );
    return 0;
  }

  if (command === 'replay') {
    const [file] = rest;
    if (!file) throw new Error('replay needs a log file');
    const log = readJson(file);
    const ruleset = await loadRuleset(flags.ruleset, log.ruleset?.id);
    assertFixtureRuleset(ruleset, describeRuleset(ruleset));
    const report = replayLog(log, ruleset);
    if (flags.print) process.stdout.write(formatBattleLog(log));
    process.stdout.write(formatReport(report));
    return report.consistent ? 0 : 1;
  }

  if (command === 'print') {
    const [file] = rest;
    if (!file) throw new Error('print needs a log file');
    const log = readJson(file);
    process.stdout.write(formatBattleLog(log));
    return 0;
  }

  if (command === 'diff') {
    const [leftFile, rightFile] = rest;
    if (!leftFile || !rightFile) throw new Error('diff needs two JSON files');
    const diff = diffValues(readJson(leftFile), readJson(rightFile));
    process.stdout.write(formatDiff(diff));
    return diff.equal ? 0 : 1;
  }

  throw new Error(`Unknown command ${command}`);
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  });
