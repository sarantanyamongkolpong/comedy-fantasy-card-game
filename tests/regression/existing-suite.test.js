import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { repoPath } from '../acceptance/v05/helpers/load-api.js';

const BASELINE_PASS = 187;
const SKIP_TOP = new Set(['acceptance', 'e2e', 'regression']);

function collect(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (dir === repoPath('tests') && SKIP_TOP.has(name)) continue;
    const info = statSync(full);
    if (info.isDirectory()) collect(full, out);
    else if (/\.test\.(js|mjs)$/.test(name)) out.push(full);
  }
  return out;
}

test('regression existing suite stays green (187 pass on integration/v05-core-base, fail 0)', () => {
  const files = collect(repoPath('tests'));
  assert.ok(files.length > 0);
  const run = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], {
    cwd: repoPath(),
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      TMPDIR: process.env.TMPDIR,
      LANG: process.env.LANG || 'C.UTF-8',
    },
  });
  const output = `${run.stdout ?? ''}\n${run.stderr ?? ''}`;
  const pass = Number(output.match(/^# pass (\d+)$/m)?.[1] ?? -1);
  const fail = Number(output.match(/^# fail (\d+)$/m)?.[1] ?? -1);
  assert.equal(run.status, 0, output.slice(-4000));
  assert.equal(fail, 0);
  assert.ok(pass >= BASELINE_PASS, `expected at least ${BASELINE_PASS} passing tests, got ${pass}`);
});
