import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { repoPath } from '../acceptance/v05/helpers/load-api.js';

const web = existsSync(repoPath('web', 'index.html'));
let playwright = false;
try {
  createRequire(import.meta.url).resolve('@playwright/test');
  playwright = true;
} catch {
  playwright = false;
}

if (!web) {
  test.todo('QA-10 e2e smoke Deck Battle Rewards — web/ not present (stream C)');
} else if (!playwright) {
  test.todo('QA-10 e2e smoke Deck Battle Rewards — Playwright is not installed; see tests/e2e/README.md');
} else {
  test('QA-10 e2e smoke Deck Battle Rewards', () => {
    const run = spawnSync(process.execPath, [repoPath('tools', 'ci', 'e2e-smoke.mjs')], {
      cwd: repoPath(),
      encoding: 'utf8',
    });
    if (run.status !== 0) {
      throw new Error(`${run.stdout ?? ''}\n${run.stderr ?? ''}`);
    }
  });
}
