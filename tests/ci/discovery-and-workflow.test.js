import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { tempRepo } from './temp-repo.js';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

test('node --test discovers new folders without a file list and skips helpers', () => {
  const repo = tempRepo();
  const folders = [
    'tests/stress/party.test.js',
    'tests/debug/log.test.js',
    'tests/balance-lab/math.test.js',
    'tests/authoring/cards.test.js',
    'tests/integration/flow.test.js',
    'content/roster.test.js',
    'tools/replay/round.test.js',
  ];
  try {
    for (const file of folders) {
      const name = file.replaceAll('/', ' ');
      repo.write(file, `import test from 'node:test';\ntest(${JSON.stringify(name)}, () => {});\n`);
    }
    repo.write('tests/stress/helper.js', 'throw new Error("helper files must not be executed by node --test");\n');
    const env = { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR, LANG: process.env.LANG || 'C.UTF-8' };
    const run = spawnSync(process.execPath, ['--test', '--test-reporter=spec'], {
      cwd: repo.root,
      encoding: 'utf8',
      env,
    });
    assert.equal(run.status, 0, run.stdout + run.stderr);
    for (const file of folders) assert.match(run.stdout, new RegExp(file.replaceAll('/', ' ')));
    assert.doesNotMatch(`${run.stdout}\n${run.stderr}`, /helper files must not be executed/);
  } finally {
    repo.cleanup();
  }
});

test('the workflow names the four checks and does not pin test folders', () => {
  const yaml = readFileSync(new URL('../../.github/workflows/quality-gates.yml', import.meta.url), 'utf8');
  for (const name of ['SYSTEMS_TEST', 'DATA_VALIDATION', 'ASSET_MANIFEST_VALIDATION', 'REPOSITORY_STRUCTURE']) {
    assert.match(yaml, new RegExp(`^  ${name}:$`, 'm'));
    assert.match(yaml, new RegExp(`^    name: ${name}$`, 'm'));
  }
  assert.match(yaml, /^on:\n {2}pull_request:\n {2}push:\n {4}branches-ignore:\n {6}- main$/m);
  assert.match(yaml, /runs-on: ubuntu-latest/);
  assert.match(yaml, /node-version: '20'/);
  assert.match(yaml, /node-version: '22'/);
  assert.match(yaml, /node --test --test-reporter=spec/);
  assert.doesNotMatch(yaml, /node --test tests\//);
  for (const folder of ['tests/stress', 'tests/debug', 'tests/balance-lab', 'tests/authoring', 'tests/integration', 'content/', 'tools/replay']) {
    assert.equal(yaml.includes(folder), false, folder);
  }
  const uses = [...yaml.matchAll(/^\s*uses:\s*(\S+)/gm)].map((match) => match[1]);
  assert.deepEqual([...new Set(uses)].sort(), ['actions/checkout@v4', 'actions/setup-node@v4']);
  assert.equal(yaml.includes('hunter-life'), false);
});

test('CI docs name the four checks and the skip rule for missing art', () => {
  const doc = readFileSync(new URL('../../docs/CI.md', import.meta.url), 'utf8');
  for (const name of ['SYSTEMS_TEST', 'DATA_VALIDATION', 'ASSET_MANIFEST_VALIDATION', 'REPOSITORY_STRUCTURE']) {
    assert.ok(doc.includes(name));
  }
  assert.match(doc, /node --test/);
  assert.match(doc, /PRODUCTION_READY is not required|None of them is required/);
  assert.match(doc, /feat\/card-art-prototype-mira/);
});
