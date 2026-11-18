#!/usr/bin/env node
/**
 * Fetch the pinned Mira art commit, merge it with --no-commit into a
 * temporary worktree, run the test suite against those files, then abort
 * the merge and delete the worktree. Nothing is committed or pushed.
 *
 * When ART_ROOT is set, tests read that checkout instead of creating a
 * worktree. The art ref is still pinned to ART_COMMIT.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ART_BRANCH, ART_COMMIT, ART_JSON, ART_REF } from '../../src/integration/constants.js';
import { auditArtBundle } from '../../src/integration/audit.js';
import { loadArtBundle } from '../../src/integration/load-art.js';
import { formatAudit } from '../../src/integration/report.js';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const allowedConflicts = new Set(['README.md', 'tests/README.md']);

function git(args, cwd = repo) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

const dirty = git(['status', '--porcelain']);
if (dirty) {
  fail('Working tree is dirty. Commit or stash before the isolated art merge.');
  process.exit(1);
}

git(['fetch', 'origin', ART_BRANCH]);
const sha = git(['rev-parse', ART_REF]);
if (sha !== ART_COMMIT) {
  fail(`Art ref ${ART_REF} is ${sha}. This audit is pinned to ${ART_COMMIT}.`);
  process.exit(1);
}

const artRootOverride = process.env.ART_ROOT;
if (artRootOverride) {
  if (!existsSync(artRootOverride)) {
    fail(`ART_ROOT does not exist: ${artRootOverride}`);
    process.exit(1);
  }
  if (!existsSync(join(artRootOverride, ART_JSON.manifest))) {
    fail(`ART_ROOT is missing ${ART_JSON.manifest}.`);
    process.exit(1);
  }
  console.log(`ART_ROOT override: ${artRootOverride}`);
  console.log(`Art ref remains pinned to ${ART_COMMIT}.`);
  const bundle = loadArtBundle({ repo, root: artRootOverride, ref: ART_REF });
  console.log(formatAudit(auditArtBundle(bundle)));
  console.log('');
  const test = spawnSync(process.execPath, ['--test', '--test-reporter', 'spec'], {
    cwd: repo,
    env: { ...process.env, ART_ROOT: artRootOverride, ART_REF },
    stdio: 'inherit',
  });
  process.exit(test.status ?? 1);
}

const parent = mkdtempSync(join(tmpdir(), 'art-systems-contract-'));
const worktree = join(parent, 'worktree');
let exitCode = 0;

try {
  git(['worktree', 'add', '--detach', worktree, 'HEAD']);
  const merge = spawnSync('git', ['merge', '--no-commit', '--no-ff', ART_REF], {
    cwd: worktree,
    encoding: 'utf8',
  });
  console.log(merge.stdout);
  if (merge.stderr) console.error(merge.stderr);
  const unmerged = git(['diff', '--name-only', '--diff-filter=U'], worktree)
    .split('\n')
    .filter(Boolean);
  const unexpected = unmerged.filter((path) => !allowedConflicts.has(path));
  if (unexpected.length > 0) {
    fail(`Unexpected merge conflicts: ${unexpected.join(', ')}`);
    exitCode = 1;
  } else if (!existsSync(join(worktree, 'docs/ASSET_MANIFEST.json'))) {
    fail('Art manifest was not checked out into the worktree.');
    exitCode = 1;
  } else if (!existsSync(join(worktree, 'src/assets/loader.js'))) {
    fail('Systems loader is missing from the worktree.');
    exitCode = 1;
  } else {
    console.log(unmerged.length > 0 ? `Merge stopped with conflicts: ${unmerged.join(', ')}` : 'Merge applied with no conflicts.');
    console.log('Merge was not committed.');
    const bundle = loadArtBundle({ repo, root: worktree, ref: ART_REF });
    console.log(formatAudit(auditArtBundle(bundle)));
    console.log('');
    const test = spawnSync(process.execPath, ['--test', '--test-reporter', 'spec'], {
      cwd: worktree,
      env: { ...process.env, ART_ROOT: worktree, ART_REF },
      stdio: 'inherit',
    });
    exitCode = test.status ?? 1;
  }
} finally {
  spawnSync('git', ['merge', '--abort'], { cwd: worktree, encoding: 'utf8' });
  let left = '';
  if (existsSync(worktree)) {
    const status = spawnSync('git', ['status', '--porcelain'], { cwd: worktree, encoding: 'utf8' });
    left = (status.stdout ?? '').trim();
  }
  spawnSync('git', ['worktree', 'remove', '--force', worktree], { cwd: repo, encoding: 'utf8' });
  spawnSync('git', ['worktree', 'prune'], { cwd: repo, encoding: 'utf8' });
  rmSync(parent, { recursive: true, force: true });
  if (left) {
    console.error('Worktree was not clean after abort:');
    console.error(left);
    exitCode = 1;
  } else {
    console.log('Isolation: merge aborted and worktree removed.');
  }
}

process.exit(exitCode);
