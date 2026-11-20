/**
 * Throwaway local merge of the production streams onto this QA checkout.
 * Never pushes, never checks out those branches in the main worktree, and
 * never merges into prod/wave-base or main. The merged tree is /tmp/qa-merge.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { artifactDir, repoRoot } from './lib/repo.mjs';

export const STREAMS = [
  ['A', 'prod/a-card-art', 'art-src/cards web/assets/cards web/manifests/cards.json tools/art/cards tests/prod/a'],
  ['B', 'prod/b-hideout', 'art-src/hideout web/assets/hideout web/manifests/hideout.json content/prod/hideout tests/prod/b'],
  ['C', 'prod/c-inventory', 'web/js/collection web/css/collection.css tests/prod/c tests/e2e/prod/c'],
  ['D', 'prod/d-gacha', 'web/js/gacha-fx web/css/gacha-fx.css art-src/gacha web/assets/gacha web/manifests/gacha.json tests/prod/d'],
  ['E', 'prod/e-battle-polish', 'web/css/battle-polish.css web/js/battle-fx art-src/battle-ui web/assets/battle-ui web/manifests/battle-ui.json tests/prod/e'],
  ['F', 'prod/f-sport-art', 'art-src/sport web/assets/sport web/manifests/sport.json tests/prod/f'],
  ['G', 'prod/g-world-content', 'content/prod/world docs/production/world tools/content/world tests/prod/g'],
];

function git(args, cwd = repoRoot) {
  const run = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return {
    status: run.status ?? 1,
    stdout: run.stdout ?? '',
    stderr: run.stderr ?? '',
  };
}

function ensureWorktree(dir) {
  git(['worktree', 'remove', '--force', dir]);
  const added = git(['worktree', 'add', '--detach', dir, 'HEAD']);
  if (added.status !== 0) {
    throw new Error(`worktree add failed\n${added.stderr}`);
  }
}

function mergeOne(dir, branch) {
  const ref = `origin/${branch}`;
  const tip = git(['rev-parse', ref]);
  if (tip.status !== 0) {
    return { branch, present: false, merged: false, sha: null, commits: [], error: tip.stderr.trim() };
  }
  const sha = tip.stdout.trim();
  const log = git(['log', '--oneline', `HEAD..${ref}`]);
  const commits = log.stdout.trim().split('\n').filter(Boolean);
  const base = git(['merge-base', 'HEAD', ref]);
  const aheadOfWave = git(['log', '--oneline', `origin/prod/wave-base..${ref}`]);
  const merge = git(['merge', '--no-edit', '--no-commit', ref], dir);
  if (merge.status !== 0) {
    const conflicted = git(['diff', '--name-only', '--diff-filter=U'], dir);
    git(['merge', '--abort'], dir);
    return {
      branch,
      present: true,
      merged: false,
      sha,
      commits,
      commitsBeyondWaveBase: aheadOfWave.stdout.trim().split('\n').filter(Boolean),
      mergeBase: base.stdout.trim(),
      conflicts: conflicted.stdout.trim().split('\n').filter(Boolean),
      error: `${merge.stdout}\n${merge.stderr}`.trim(),
    };
  }
  const staged = git(['diff', '--cached', '--name-only'], dir);
  if (staged.stdout.trim()) {
    const committed = git([
      '-c', 'user.name=Mira (Grok Bot)',
      '-c', 'user.email=mira-bot@users.noreply.github.com',
      'commit', '-m', `qa throwaway: merge ${branch}`,
    ], dir);
    if (committed.status !== 0) {
      return {
        branch,
        present: true,
        merged: false,
        sha,
        commits,
        commitsBeyondWaveBase: aheadOfWave.stdout.trim().split('\n').filter(Boolean),
        mergeBase: base.stdout.trim(),
        conflicts: [],
        error: `local throwaway commit failed\n${committed.stderr}`,
      };
    }
  }
  return {
    branch,
    present: true,
    merged: true,
    sha,
    commits,
    commitsBeyondWaveBase: aheadOfWave.stdout.trim().split('\n').filter(Boolean),
    mergeBase: base.stdout.trim(),
    conflicts: [],
    throwawayCommit: git(['rev-parse', '--short', 'HEAD'], dir).stdout.trim(),
  };
}

export function throwawayMerge(dir = '/tmp/qa-merge') {
  const fetched = git(['fetch', 'origin', 'prod/wave-base', ...STREAMS.map((row) => row[1])]);
  if (fetched.status !== 0) {
    throw new Error(`git fetch failed\n${fetched.stderr}`);
  }
  ensureWorktree(dir);
  const wave = git(['rev-parse', 'origin/prod/wave-base']);
  const head = git(['rev-parse', 'HEAD'], dir);
  const streams = [];
  for (const [id, branch, owns] of STREAMS) {
    const result = mergeOne(dir, branch);
    streams.push({ id, owns, ...result });
  }
  const status = git(['status', '--short'], dir);
  return {
    generatedAt: new Date().toISOString(),
    worktree: dir,
    head: head.stdout.trim(),
    originWaveBase: wave.stdout.trim(),
    fetchStatus: fetched.status,
    streams,
    dirtySummary: status.stdout.trim().split('\n').filter(Boolean).length,
    pushed: false,
  };
}

function main() {
  const report = throwawayMerge(process.env.QA_MERGE_DIR || '/tmp/qa-merge');
  const dir = artifactDir();
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'phase2-merge.json');
  writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({
    file,
    head: report.head,
    streams: report.streams.map((stream) => ({
      id: stream.id,
      branch: stream.branch,
      present: stream.present,
      merged: stream.merged,
      sha: stream.sha,
      commits: stream.commits?.length ?? 0,
      conflicts: stream.conflicts?.length ?? 0,
    })),
  }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
