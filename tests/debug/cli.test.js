import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../..', import.meta.url));

function runCli(args) {
  return spawnSync(process.execPath, ['tools/replay/cli.js', ...args], {
    cwd: root,
    encoding: 'utf8',
  });
}

test('help exits 0', () => {
  const result = runCli(['--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /node tools\/replay\/cli\.js run/);
});

test('run prints the damage block and a consistent replay', () => {
  const result = runCli(['run', 'tools/replay/examples/blocked-damage.scenario.json']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Reason: DAMAGE_FORMULA_TBD/);
  assert.match(result.stdout, /Active Avatars: AVT_AEG_001, AVT_PHA_001, AVT_CEL_001, AVT_SAN_001/);
  assert.match(result.stdout, /REPLAY|CONSISTENT/);
  assert.match(result.stdout, /^CONSISTENT$/m);
  assert.equal(result.stdout.includes('findings: 0'), true);
});

test('replay of the shipped logs is consistent', () => {
  for (const name of ['blocked-damage', 'ap-and-turns', 'ko-outcome']) {
    const result = runCli(['replay', `tools/replay/examples/${name}.log.json`]);
    assert.equal(result.status, 0, `${name}\n${result.stderr}\n${result.stdout}`);
    assert.match(result.stdout, /^CONSISTENT$/m);
  }
});

test('print matches the recorded blocked-damage transcript', () => {
  const result = runCli(['print', 'tools/replay/examples/blocked-damage.log.json']);
  assert.equal(result.status, 0, result.stderr);
  const doc = readFileSync(path.join(root, 'docs/REPLAY_TOOL.md'), 'utf8');
  assert.equal(doc.includes(result.stdout.trimEnd()), true);
});

test('a tampered log is an inconsistent replay', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'replay-cli-'));
  try {
    const source = path.join(root, 'tools/replay/examples/blocked-damage.log.json');
    const log = JSON.parse(readFileSync(source, 'utf8'));
    log.events[0].result.reason = 'TAMPERED';
    const file = path.join(dir, 'tampered.log.json');
    writeFileSync(file, JSON.stringify(log));
    const result = runCli(['replay', file]);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stdout, /INCONSISTENT/);
    assert.match(result.stdout, /INTEGRITY_MISMATCH/);
    assert.match(result.stdout, /RESULT_MISMATCH/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('diff exit codes follow equality', () => {
  const same = runCli([
    'diff',
    'tools/replay/examples/ko-outcome.log.json',
    'tools/replay/examples/ko-outcome.log.json',
  ]);
  assert.equal(same.status, 0, same.stderr);
  assert.match(same.stdout, /^EQUAL$/m);

  const different = runCli([
    'diff',
    'tools/replay/examples/blocked-damage.log.json',
    'tools/replay/examples/ap-and-turns.log.json',
  ]);
  assert.equal(different.status, 1);
  assert.match(different.stdout, /^DIFFERENT$/m);
  assert.match(different.stdout, /battleId/);
});

test('record writes a log that replays', () => {
  const dir = mkdtempSync(path.join(root, '.tmp-replay-'));
  try {
    const out = path.join(dir, 'again.log.json');
    const recorded = runCli([
      'record',
      'tools/replay/examples/ko-outcome.scenario.json',
      '--out',
      out,
    ]);
    assert.equal(recorded.status, 0, recorded.stderr);
    assert.match(recorded.stdout, /ruleset: test-only-sum-spd-ko/);
    const replayed = runCli(['replay', out, '--print']);
    assert.equal(replayed.status, 0, replayed.stderr);
    assert.match(replayed.stdout, /OUTCOME decided/);
    assert.match(replayed.stdout, /Winner: PLAYER/);
    assert.match(replayed.stdout, /^CONSISTENT$/m);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the CLI refuses an unlabelled ruleset', () => {
  const dir = mkdtempSync(path.join(root, '.tmp-replay-'));
  try {
    const modulePath = path.join(dir, 'ruleset.js');
    writeFileSync(
      modulePath,
      `export const ruleset = { id: 'test-only-sum-spd-ko', label: 'official', parameters: {}, rules: {} };\n`,
    );
    const out = path.join(dir, 'nope.log.json');
    const result = runCli([
      'record',
      'tools/replay/examples/blocked-damage.scenario.json',
      '--out',
      out,
      '--ruleset',
      modulePath,
    ]);
    assert.equal(result.status, 2, result.stdout);
    assert.match(result.stderr, /TEST-ONLY/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a missing scenario is a usage error', () => {
  const result = runCli(['run', 'tools/replay/examples/missing.scenario.json']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Cannot read/);
});
