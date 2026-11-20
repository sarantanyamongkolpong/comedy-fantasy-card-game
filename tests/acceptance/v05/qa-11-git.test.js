import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { repoPath } from './helpers/load-api.js';

function text(relativeFile) {
  return readFileSync(repoPath(...relativeFile.split('/')), 'utf8');
}

test('QA-11 workflows do not deploy, force-push, or mention hunter-life', () => {
  const gates = text('.github/workflows/quality-gates.yml');
  const acceptance = text('.github/workflows/v05-acceptance.yml');
  for (const yaml of [gates, acceptance]) {
    assert.equal(yaml.includes('hunter-life'), false);
    assert.equal(/force-push|git push[^\n]*--force|npm run deploy|wrangler deploy/i.test(yaml), false);
  }
  assert.match(gates, /^ {2}SYSTEMS_TEST:$/m);
  assert.match(gates, /^ {2}DATA_VALIDATION:$/m);
  assert.match(gates, /^ {2}ASSET_MANIFEST_VALIDATION:$/m);
  assert.match(gates, /^ {2}REPOSITORY_STRUCTURE:$/m);
  assert.match(acceptance, /node: \['20', '22'\]/);
  assert.match(acceptance, /integration\/v05-core-base/);
  assert.match(acceptance, /core\/v05-\*/);
});

test('QA-11 acceptance status is not labelled PRODUCTION_READY', () => {
  const source = text('tools/ci/acceptance-status.mjs');
  assert.equal(source.includes('PRODUCTION_READY'), false);
  const reporter = text('tools/ci/lib/acceptance-report.mjs');
  assert.match(reporter, /INCOMPLETE/);
  assert.equal(reporter.includes('PRODUCTION_READY'), false);
});
