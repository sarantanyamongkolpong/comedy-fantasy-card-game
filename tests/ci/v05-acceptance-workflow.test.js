import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('v0.5 acceptance workflow keeps the four quality gates and runs Node 20 and 22', () => {
  const gates = readFileSync(new URL('../../.github/workflows/quality-gates.yml', import.meta.url), 'utf8');
  const acceptance = readFileSync(new URL('../../.github/workflows/v05-acceptance.yml', import.meta.url), 'utf8');
  for (const name of ['SYSTEMS_TEST', 'DATA_VALIDATION', 'ASSET_MANIFEST_VALIDATION', 'REPOSITORY_STRUCTURE']) {
    assert.match(gates, new RegExp(`^  ${name}:$`, 'm'));
  }
  assert.match(gates, /node-version: '20'/);
  assert.match(gates, /node-version: '22'/);
  assert.match(gates, /node tools\/ci\/validate-data\.mjs/);
  assert.match(acceptance, /integration\/v05-core-base/);
  assert.match(acceptance, /integration\/v05-final/);
  assert.match(acceptance, /core\/v05-\*/);
  assert.match(acceptance, /final\/\*/);
  assert.match(acceptance, /node: \['20', '22'\]/);
  assert.match(acceptance, /npm run test:acceptance/);
  assert.equal(/npm run test:acceptance\s*\|/.test(acceptance), false);
  const statusTool = readFileSync(new URL('../../tools/ci/acceptance-status.mjs', import.meta.url), 'utf8');
  assert.match(statusTool, /spawnSync\(process\.execPath/);
  assert.match(statusTool, /if \(status === 'FAIL' \|\| run\.status !== 0\) process\.exit\(1\)/);
  assert.equal(/\|\s*tee|\|\s*cat/.test(statusTool), false);
  assert.equal(acceptance.includes('hunter-life'), false);
  const uses = [...acceptance.matchAll(/^\s*uses:\s*(\S+)/gm)].map((match) => match[1]);
  assert.deepEqual([...new Set(uses)].sort(), ['actions/checkout@v4', 'actions/setup-node@v4']);
});
