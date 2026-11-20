#!/usr/bin/env node
/**
 * v0.5 regression baseline.
 * Runs each existing *.test.js in its own process so one stuck file cannot hide the rest.
 * Sport harness files are excluded: this command measures the tree the harness was added to,
 * not the harness itself.
 */
import { spawn } from 'node:child_process';
import { readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { repoRoot } from './lib/paths.mjs';
import { parseTap } from './lib/tap.mjs';

const DEFAULT_TIMEOUT_S = 180;
const TIMEOUT_S = {
  'practice-auto.test.js': 600,
  'existing-suite.test.js': 900,
  'battle-engine.stress.test.js': 300,
  'data-edges.stress.test.js': 300,
  'v05-full-loop.playwright.test.js': 600,
  'auto-battle.playwright.test.js': 240,
};

const root = repoRoot();

function collect(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(root, full);
    if (rel === 'tests/sport' || rel.startsWith('tests/sport/') || rel === 'tests/e2e/sport' || rel.startsWith('tests/e2e/sport/')) {
      continue;
    }
    const info = statSync(full);
    if (info.isDirectory()) collect(full, out);
    else if (/\.test\.(js|mjs)$/.test(name)) out.push(rel);
  }
  return out;
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function stopTree(child) {
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
  setTimeout(() => {
    try {
      process.kill(-child.pid, 'SIGKILL');
    } catch {
      child.kill('SIGKILL');
    }
  }, 5000).unref();
}

function runFile(file, timeoutS) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, ['--test', '--test-reporter=tap', file], {
      cwd: root,
      env: process.env,
      detached: true,
    });
    let output = '';
    let settled = false;
    const finish = (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const elapsedMs = Date.now() - started;
      const hung = signal === 'SIGTERM' || signal === 'SIGKILL';
      resolve({
        file,
        timeoutS,
        elapsedMs,
        code,
        signal: signal ?? null,
        hung,
        ...parseTap(output),
        outputTail: output.slice(-2500),
      });
    };
    const timer = setTimeout(() => stopTree(child), timeoutS * 1000);
    child.stdout.on('data', (chunk) => {
      output += chunk;
    });
    child.stderr.on('data', (chunk) => {
      output += chunk;
    });
    child.on('error', (error) => {
      output += `\n${error.message}\n`;
      finish(1, null);
    });
    child.on('close', (code, signal) => finish(code, signal));
  });
}

const files = collect(join(root, 'tests')).sort();
const results = [];
const totals = { tests: 0, pass: 0, fail: 0, cancelled: 0, skipped: 0, todo: 0 };
const failures = [];
const hangs = [];

process.stdout.write(`node ${process.version} files ${files.length}\n`);

for (const file of files) {
  const base = file.split('/').pop();
  const timeoutS = TIMEOUT_S[base] ?? DEFAULT_TIMEOUT_S;
  process.stdout.write(`RUN ${file} (timeout ${timeoutS}s)\n`);
  const row = await runFile(file, timeoutS);
  results.push({
    file: row.file,
    elapsedMs: row.elapsedMs,
    code: row.code,
    signal: row.signal,
    hung: row.hung,
    timeoutS: row.timeoutS,
    summary: row.summary,
    failures: row.failures,
  });
  if (row.hung) {
    hangs.push({ file, timeoutS, elapsedMs: row.elapsedMs, signal: row.signal });
    process.stdout.write(`HANG ${file} after ${row.elapsedMs}ms\n`);
    continue;
  }
  for (const key of Object.keys(totals)) totals[key] += row.summary[key] ?? 0;
  for (const failure of row.failures) {
    failures.push({ file, name: failure.name, error: failure.error });
  }
  process.stdout.write(
    `DONE ${file} pass=${row.summary.pass} fail=${row.summary.fail} todo=${row.summary.todo} skip=${row.summary.skipped} ${row.elapsedMs}ms\n`,
  );
}

const report = {
  node: process.version,
  execPath: process.execPath,
  root,
  startedFrom: 'sport/v06-base suite excluding tests/sport and tests/e2e/sport',
  defaultTimeoutS: DEFAULT_TIMEOUT_S,
  totals,
  hangs,
  failures,
  files: results,
};

const out = arg('--out');
if (out) {
  mkdirSync(join(root, 'tools/sport-qa/baselines'), { recursive: true });
  const dest = out.startsWith('/') ? out : join(root, out);
  writeFileSync(dest, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`WROTE ${dest}\n`);
}

process.stdout.write(
  `TOTAL node ${process.version} pass=${totals.pass} fail=${totals.fail} todo=${totals.todo} skip=${totals.skipped} cancelled=${totals.cancelled} tests=${totals.tests} hangs=${hangs.length}\n`,
);
process.exit(hangs.length > 0 || totals.fail > 0 ? 1 : 0);
