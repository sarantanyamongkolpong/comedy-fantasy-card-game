#!/usr/bin/env node
/**
 * Sport QA harness. Missing sport modules skip. This does not run the v0.5 suite.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from './lib/paths.mjs';
import { parseTap } from './lib/tap.mjs';

const FILES = [
  'tests/sport/qa/provenance.test.js',
  'tests/sport/qa/save-compat.test.js',
  'tests/sport/qa/wallet-gacha.test.js',
  'tests/sport/qa/sim-determinism.test.js',
  'tests/e2e/sport/viewport-buttons.test.js',
];

const root = repoRoot();

function arg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
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
      resolve({
        file,
        timeoutS,
        elapsedMs: Date.now() - started,
        code,
        signal: signal ?? null,
        hung: signal === 'SIGTERM' || signal === 'SIGKILL',
        ...parseTap(output),
      });
    };
    const timer = setTimeout(() => {
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch {
        child.kill('SIGTERM');
      }
    }, timeoutS * 1000);
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

const totals = { tests: 0, pass: 0, fail: 0, cancelled: 0, skipped: 0, todo: 0 };
const failures = [];
const hangs = [];
const files = [];

for (const file of FILES) {
  const timeoutS = file.includes('/e2e/') ? 300 : 120;
  process.stdout.write(`RUN ${file}\n`);
  const row = await runFile(file, timeoutS);
  files.push({
    file,
    elapsedMs: row.elapsedMs,
    code: row.code,
    hung: row.hung,
    summary: row.summary,
    failures: row.failures,
  });
  if (row.hung) {
    hangs.push({ file, timeoutS, elapsedMs: row.elapsedMs });
    process.stdout.write(`HANG ${file}\n`);
    continue;
  }
  for (const key of Object.keys(totals)) totals[key] += row.summary[key] ?? 0;
  for (const failure of row.failures) failures.push({ file, ...failure });
  process.stdout.write(
    `DONE ${file} pass=${row.summary.pass} fail=${row.summary.fail} skip=${row.summary.skipped} todo=${row.summary.todo}\n`,
  );
}

const report = { node: process.version, totals, hangs, failures, files };
const out = arg('--out');
if (out) {
  const dest = out.startsWith('/') ? out : join(root, out);
  mkdirSync(join(dest, '..'), { recursive: true });
  writeFileSync(dest, `${JSON.stringify(report, null, 2)}\n`);
}
process.stdout.write(
  `HARNESS node ${process.version} pass=${totals.pass} fail=${totals.fail} skip=${totals.skipped} todo=${totals.todo} hangs=${hangs.length}\n`,
);
process.exit(hangs.length > 0 || totals.fail > 0 ? 1 : 0);
