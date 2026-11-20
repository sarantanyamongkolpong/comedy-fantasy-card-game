import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const index = join(root, 'web', 'index.html');

if (!existsSync(index)) {
  process.stdout.write('SKIP QA-10 e2e: web/index.html is not present (stream C).\n');
  process.exit(0);
}

let playwright;
try {
  playwright = createRequire(import.meta.url).resolve('@playwright/test/cli');
} catch {
  process.stdout.write('SKIP QA-10 e2e: Playwright is not installed. See tests/e2e/README.md. This is not a pass.\n');
  process.exit(0);
}

const run = spawnSync(process.execPath, [playwright, 'test', join(root, 'tests', 'e2e', 'v05-loop.smoke.spec.js')], {
  cwd: root,
  stdio: 'inherit',
});
process.exit(run.status ?? 1);
