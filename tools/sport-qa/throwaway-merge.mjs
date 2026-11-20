#!/usr/bin/env node
/**
 * Fetch the four product streams and merge them onto sport/v06-base in a
 * detached worktree. The merge is never committed to a published branch and
 * never pushed. The QA harness is copied in only so it can import the merged tree.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const STREAMS = [
  'sport/v06-data',
  'sport/v06-sim-ball',
  'sport/v06-sim-race',
  'sport/v06-web',
];

const qaRoot = fileURLToPath(new URL('../../', import.meta.url));

function git(args, cwd = qaRoot) {
  return spawnSync('git', args, { cwd, encoding: 'utf8' });
}

function tip(ref) {
  const show = git(['log', '-1', '--format=%H%x09%s', ref]);
  if (show.status !== 0) return null;
  const [sha, subject] = show.stdout.trim().split('\t');
  return { sha, subject };
}

const fetchResults = ['sport/v06-base', ...STREAMS].map((branch) => {
  const result = git(['fetch', 'origin', branch]);
  return { branch, status: result.status, error: (result.stderr || '').slice(-400) };
});
const streams = STREAMS.map((branch) => {
  const ref = `origin/${branch}`;
  const have = git(['rev-parse', '--verify', '--quiet', ref]);
  const info = have.status === 0 ? tip(ref) : null;
  const subject = info?.subject ?? '';
  return {
    branch,
    present: have.status === 0,
    sha: info?.sha ?? null,
    subject,
    featureComplete: /feature[ -]?complete/i.test(subject),
  };
});

const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const dir = `/tmp/sport-v06-merge-${stamp}`;
const base = tip('origin/sport/v06-base');
const added = git(['worktree', 'add', '--detach', dir, 'origin/sport/v06-base']);
if (added.status !== 0) {
  console.log(JSON.stringify({
    ok: false,
    error: added.stderr || added.stdout,
    fetchResults,
    streams,
    base,
  }, null, 2));
  process.exit(1);
}

const merges = [];
for (const stream of streams) {
  if (!stream.present) {
    merges.push({ branch: stream.branch, status: 'absent' });
    continue;
  }
  const merge = git(['merge', '--no-ff', '--no-edit', `origin/${stream.branch}`], dir);
  if (merge.status === 0) {
    merges.push({ branch: stream.branch, status: 'merged', sha: stream.sha });
    continue;
  }
  const conflicts = git(['diff', '--name-only', '--diff-filter=U'], dir).stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  git(['merge', '--abort'], dir);
  merges.push({
    branch: stream.branch,
    status: 'conflict',
    sha: stream.sha,
    conflicts,
    error: (merge.stderr || merge.stdout).slice(-1500),
  });
}

mkdirSync(join(dir, 'tests/sport'), { recursive: true });
mkdirSync(join(dir, 'tests/e2e'), { recursive: true });
mkdirSync(join(dir, 'tools'), { recursive: true });
cpSync(join(qaRoot, 'tests/sport/qa'), join(dir, 'tests/sport/qa'), { recursive: true });
cpSync(join(qaRoot, 'tests/e2e/sport'), join(dir, 'tests/e2e/sport'), { recursive: true });
cpSync(join(qaRoot, 'tools/sport-qa'), join(dir, 'tools/sport-qa'), { recursive: true });

const shotDir = join(qaRoot, 'tests/e2e/sport/screenshots', stamp);
mkdirSync(shotDir, { recursive: true });
const node = process.env.SPORT_QA_NODE || process.execPath;
const harness = spawnSync(node, ['tools/sport-qa/run-harness.mjs', '--out', join(qaRoot, 'tools/sport-qa/baselines', `harness-${stamp}.json`)], {
  cwd: dir,
  encoding: 'utf8',
  env: { ...process.env, SPORT_QA_SCREENSHOTS: shotDir },
});

const head = git(['rev-parse', 'HEAD'], dir).stdout.trim();
const report = {
  ok: harness.status === 0,
  stamp,
  worktree: dir,
  base,
  head,
  fetchResults,
  streams,
  merges,
  featureComplete: streams.every((stream) => stream.present && stream.featureComplete),
  harnessStatus: harness.status,
  harnessStdout: harness.stdout,
  harnessStderr: harness.stderr?.slice(-2000) ?? '',
  screenshots: shotDir,
};

if (!process.argv.includes('--keep')) {
  git(['worktree', 'remove', '--force', dir]);
  rmSync(dir, { recursive: true, force: true });
  report.worktree = null;
}

mkdirSync(join(qaRoot, 'tools/sport-qa/baselines'), { recursive: true });
const dest = join(qaRoot, 'tools/sport-qa/baselines', `merge-${stamp}.json`);
writeFileSync(dest, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ dest, featureComplete: report.featureComplete, merges, harnessStatus: harness.status }, null, 2));
process.exit(harness.status === 0 ? 0 : 2);
