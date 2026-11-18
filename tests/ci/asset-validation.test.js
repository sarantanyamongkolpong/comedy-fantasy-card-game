import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { validateAssets } from '../../tools/ci/lib/asset-validation.mjs';
import { tempRepo } from './temp-repo.js';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

function entry(id, path, status) {
  return { asset_id: id, path, type: 'metadata', owner: 'shared', status };
}

function manifest(assets) {
  return JSON.stringify({
    manifest_version: 1,
    project: 'Comedy Fantasy Card Game',
    status_legend: ['CONCEPT', 'PROTOTYPE', 'QA_PASSED', 'PRODUCTION_READY', 'INTEGRATED'],
    assets,
  });
}

test('systems-only checkout skips missing art and still checks fixture ids', () => {
  const result = validateAssets(repoRoot);
  assert.equal(result.ok, true);
  assert.equal(result.assetsPresent, false);
  assert.equal(result.pathCheckRan, false);
  assert.deepEqual(result.duplicates, []);
  assert.deepEqual(result.missingPaths, []);
  assert.match(result.notices.join('\n'), /Asset path checks skipped/);
  assert.match(result.notices.join('\n'), /feat\/card-art-prototype-mira/);
  assert.match(result.notices.join('\n'), /PRODUCTION_READY is not required/);
  assert.ok(result.manifests.some((item) => item.fixture && item.file === 'tests/fixtures/asset-manifest.snapshot.json'));
});

test('CONCEPT and PROTOTYPE paths pass without any PRODUCTION_READY asset', () => {
  const repo = tempRepo();
  try {
    repo.write('assets/frames/a.png', 'frame');
    repo.write('assets/emblems/b.png', 'emblem');
    repo.write('docs/ASSET_MANIFEST.json', manifest([
      entry('FRAME_A', 'assets/frames/a.png', 'PROTOTYPE'),
      entry('EMBLEM_A', 'assets/emblems/b.png', 'CONCEPT'),
    ]));
    const result = validateAssets(repo.root);
    assert.equal(result.ok, true);
    assert.equal(result.pathCheckRan, true);
    assert.deepEqual(result.missingPaths, []);
    assert.deepEqual(result.invalidStatuses, []);
  } finally {
    repo.cleanup();
  }
});

test('a live manifest path that is not in the checkout fails', () => {
  const repo = tempRepo();
  try {
    repo.write('assets/.gitkeep', '');
    repo.write('docs/ASSET_MANIFEST.json', manifest([
      entry('GONE', 'assets/gone.png', 'PROTOTYPE'),
    ]));
    const result = validateAssets(repo.root);
    assert.equal(result.ok, false);
    assert.equal(result.missingPaths.length, 1);
    assert.equal(result.missingPaths[0].id, 'GONE');
  } finally {
    repo.cleanup();
  }
});

test('missing assets directory skips path checks even if a manifest lists files', () => {
  const repo = tempRepo();
  try {
    repo.write('docs/ASSET_MANIFEST.json', manifest([
      entry('GONE', 'assets/gone.png', 'CONCEPT'),
    ]));
    const result = validateAssets(repo.root);
    assert.equal(result.ok, true);
    assert.equal(result.pathCheckRan, false);
    assert.match(result.notices.join('\n'), /Asset path checks skipped/);
  } finally {
    repo.cleanup();
  }
});

test('duplicate asset ids fail in a fixture and across live manifests', () => {
  const repo = tempRepo();
  try {
    repo.write('tests/fixtures/dup.json', manifest([
      entry('DUP', 'assets/a.png', 'PROTOTYPE'),
      entry('DUP', 'assets/b.png', 'CONCEPT'),
    ]));
    repo.write('docs/ASSET_MANIFEST.json', manifest([entry('SHARED', 'assets/a.png', 'PROTOTYPE')]));
    repo.write('content/second-manifest.json', manifest([entry('SHARED', 'assets/b.png', 'QA_PASSED')]));
    const result = validateAssets(repo.root);
    assert.equal(result.ok, false);
    assert.equal(result.pathCheckRan, false);
    assert.ok(result.duplicates.some((item) => item.id === 'DUP'));
    assert.ok(result.duplicates.some((item) => item.id === 'SHARED'));
    assert.deepEqual(result.missingPaths, []);
  } finally {
    repo.cleanup();
  }
});

test('a fixture manifest does not fail path checks when assets exist for other files', () => {
  const repo = tempRepo();
  try {
    repo.write('assets/present.txt', 'here');
    repo.write('tests/fixtures/partial.json', manifest([
      entry('PARTIAL', 'assets/not-copied/partial.png', 'CONCEPT'),
    ]));
    const result = validateAssets(repo.root);
    assert.equal(result.ok, true);
    assert.equal(result.pathCheckRan, false);
    assert.deepEqual(result.missingPaths, []);
  } finally {
    repo.cleanup();
  }
});

test('a live status outside the vocabulary fails, and a path that escapes the repo fails', () => {
  const repo = tempRepo();
  try {
    repo.write('assets/ok.png', 'ok');
    repo.write('docs/ASSET_MANIFEST.json', manifest([
      entry('ODD', 'assets/ok.png', 'WIP'),
      entry('ESCAPE', '../outside.png', 'PROTOTYPE'),
    ]));
    const result = validateAssets(repo.root);
    assert.equal(result.ok, false);
    assert.ok(result.invalidStatuses.some((item) => item.id === 'ODD' && item.status === 'WIP'));
    assert.ok(result.missingPaths.some((item) => item.id === 'ESCAPE'));
  } finally {
    repo.cleanup();
  }
});

test('asset validation CLI passes on this checkout', () => {
  const run = spawnSync(process.execPath, ['tools/ci/validate-assets.mjs'], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  assert.match(run.stdout, /ASSET_MANIFEST_VALIDATION: PASS/);
  assert.match(run.stdout, /Asset path checks skipped/);
});
