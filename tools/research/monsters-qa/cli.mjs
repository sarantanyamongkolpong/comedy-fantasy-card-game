#!/usr/bin/env node
/**
 * Research QA for the monster parody project.
 *
 *   node tools/research/monsters-qa/cli.mjs run --fetch
 *   node tools/research/monsters-qa/cli.mjs check-sources --fetch
 *   node tools/research/monsters-qa/cli.mjs dedupe
 *   node tools/research/monsters-qa/cli.mjs ip-check
 *   node tools/research/monsters-qa/cli.mjs sensitivity
 *
 * Reads agents 01–08 via git show. Does not checkout, commit, or merge their branches.
 * Writes only under docs/research/monsters/qa and tools/research/monsters-qa.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { auditSources } from './lib/check-sources.mjs';
import { dedupeRecords } from './lib/dedupe.mjs';
import { assessAllIp, RISK_THRESHOLDS } from './lib/ip-check.mjs';
import { claimsFromRecord, loadAgent, loadInputFile } from './lib/load.mjs';
import { buildArtifacts, writeArtifacts } from './lib/report.mjs';
import { AGENTS, REPO_ROOT, assertAllowedWrite, currentBranch, fetchResearchBranch, resolveAgentRef } from './lib/repo.mjs';
import { assessAllSensitivity } from './lib/sensitivity.mjs';

const USAGE = `Usage:
  node tools/research/monsters-qa/cli.mjs run [--fetch] [--refresh] [--agents 01,06] [--input file.json] [--out-dir docs/research/monsters/qa]
  node tools/research/monsters-qa/cli.mjs check-sources [--fetch] [--input file.json] [--out file.json]
  node tools/research/monsters-qa/cli.mjs dedupe [--fetch] [--out file.json]
  node tools/research/monsters-qa/cli.mjs ip-check [--fetch] [--out file.json]
  node tools/research/monsters-qa/cli.mjs sensitivity [--fetch] [--out file.json]

--fetch             git fetch only the eight research branches (never main)
--only-input        do not read agent branches
--skip-network      do not fetch URLs (IP, dedupe, and sensitivity still run)
--refresh           ignore the fetch cache
--agents 01,08      limit which agents are read
--input file.json   extra records, repeatable
--out-dir dir       run writes QA_REPORT.md, source_audit.json, ip_audit.json, dedupe_audit.json, sensitivity_audit.json
--out file.json     single-command output
`;

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const args = {
    command: argv[0] || 'run',
    fetch: false,
    refresh: false,
    skipNetwork: false,
    onlyInput: false,
    help: false,
    agents: null,
    input: [],
    outDir: 'docs/research/monsters/qa',
    out: '',
    timeoutMs: 15000,
    delayMs: 120,
  };
  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--help' || token === '-h') args.help = true;
    else if (token === '--fetch') args.fetch = true;
    else if (token === '--refresh') args.refresh = true;
    else if (token === '--skip-network') args.skipNetwork = true;
    else if (token === '--only-input') args.onlyInput = true;
    else if (token === '--agents') args.agents = (argv[++index] || '').split(',').map((item) => item.trim()).filter(Boolean);
    else if (token === '--input') args.input.push(argv[++index]);
    else if (token === '--out-dir') args.outDir = argv[++index];
    else if (token === '--out') args.out = argv[++index];
    else if (token === '--timeout-ms') args.timeoutMs = Number(argv[++index]);
    else throw new Error(`unknown argument: ${token}`);
  }
  return args;
}

/**
 * @param {ReturnType<typeof parseArgs>} args
 */
function loadBundles(args) {
  /** @type {ReturnType<typeof loadAgent>[]} */
  const bundles = [];
  if (!args.onlyInput) {
    const selected = args.agents ? AGENTS.filter((agent) => args.agents.includes(agent.id)) : [...AGENTS];
    for (const agent of selected) {
      if (args.fetch) {
        const fetched = fetchResearchBranch(agent.branch);
        if (!fetched.ok) process.stderr.write(`fetch ${agent.branch}: ${fetched.message}\n`);
      }
      bundles.push(loadAgent(agent, resolveAgentRef(agent)));
    }
  }
  for (const file of args.input) {
    bundles.push(loadInputFile(resolve(file)));
  }
  return bundles;
}

/**
 * @param {string} target
 */
function guardRepoWrite(target) {
  const rel = relative(REPO_ROOT, resolve(target)).split(sep).join('/');
  if (rel.startsWith('..') || rel.startsWith('/')) return;
  const branch = currentBranch();
  if (branch !== 'research/m10-qa') {
    throw new Error(`refusing to write ${rel} from branch ${branch || 'detached'}`);
  }
}

/**
 * @param {string} file
 * @param {unknown} value
 */
function writeJson(file, value) {
  const full = resolve(file);
  guardRepoWrite(full);
  assertAllowedWrite(full);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, `${JSON.stringify(value, null, 2)}\n`);
}

/**
 * @param {ReturnType<typeof parseArgs>} args
 */
async function main(args) {
  if (args.help || args.command === '--help') {
    process.stdout.write(USAGE);
    return;
  }
  const known = new Set(['run', 'check-sources', 'dedupe', 'ip-check', 'sensitivity']);
  if (!known.has(args.command)) throw new Error(`unknown command ${args.command}\n${USAGE}`);
  const bundles = loadBundles(args);
  const records = bundles.flatMap((bundle) => bundle.records);
  const claims = records.flatMap(claimsFromRecord);
  const sources = args.command === 'dedupe' || args.command === 'ip-check' || args.command === 'sensitivity' || args.skipNetwork
    ? []
    : await auditSources(claims, {
      timeoutMs: args.timeoutMs,
      delayMs: args.delayMs,
      refresh: args.refresh,
      skipNetwork: args.skipNetwork,
      cachePath: resolve(REPO_ROOT, 'tools/research/monsters-qa/.cache/fetches.json'),
    });
  const dedupe = args.command === 'check-sources' ? [] : dedupeRecords(records);
  const ip = args.command === 'check-sources' || args.command === 'dedupe' || args.command === 'sensitivity' ? [] : assessAllIp(records);
  const sensitivity = args.command === 'check-sources' || args.command === 'dedupe' || args.command === 'ip-check'
    ? []
    : assessAllSensitivity(records);
  const artifacts = buildArtifacts({
    agents: bundles,
    sources,
    dedupe,
    ip,
    sensitivity,
    thresholds: RISK_THRESHOLDS,
  });
  if (args.command === 'run') {
    guardRepoWrite(args.outDir);
    writeArtifacts(args.outDir, artifacts);
  } else if (args.out) {
    const payload = {
      'check-sources': artifacts.sourceAudit,
      dedupe: artifacts.dedupeAudit,
      'ip-check': artifacts.ipAudit,
      sensitivity: artifacts.sensitivityAudit,
    }[args.command];
    writeJson(args.out, payload);
  }
  const p0 = artifacts.findings.filter((item) => item.priority === 'P0').length;
  const p1 = artifacts.findings.filter((item) => item.priority === 'P1').length;
  const verified = artifacts.sourceAudit.summary.verified;
  const urls = artifacts.sourceAudit.summary.urls;
  process.stdout.write(`${args.command}: urls ${urls}, verified ${verified}, samples ${artifacts.ipAudit.summary.samples}, P0 ${p0}, P1 ${p1}\n`);
  process.exitCode = p0 > 0 ? 1 : 0;
}

try {
  const args = parseArgs(process.argv.slice(2));
  await main(args);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
}
