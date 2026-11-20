import { execFileSync } from 'node:child_process';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));

/** tools/research/monsters-qa/lib → repository root. */
export const REPO_ROOT = resolve(HERE, '../../../..');

export const QA_DIR = 'docs/research/monsters/qa';
export const TOOL_DIR = 'tools/research/monsters-qa';

/**
 * Agents 01–08. This tool reads their branches and never writes to them.
 * Agent 09 owns the schema and is out of scope. Agent 10 is this tool.
 */
export const AGENTS = Object.freeze([
  Object.freeze({ id: '01', branch: 'research/m01-classic-rpg', role: 'sources', prefix: 'docs/research/monsters/sources/01-classic-rpg' }),
  Object.freeze({ id: '02', branch: 'research/m02-western', role: 'sources', prefix: 'docs/research/monsters/sources/02-western' }),
  Object.freeze({ id: '03', branch: 'research/m03-eastern', role: 'sources', prefix: 'docs/research/monsters/sources/03-eastern' }),
  Object.freeze({ id: '04', branch: 'research/m04-world-myth', role: 'sources', prefix: 'docs/research/monsters/sources/04-world-myth' }),
  Object.freeze({ id: '05', branch: 'research/m05-anime-pop', role: 'sources', prefix: 'docs/research/monsters/sources/05-anime-pop' }),
  Object.freeze({ id: '06', branch: 'research/m06-parody', role: 'creative', prefix: 'docs/research/monsters/creative/parody' }),
  Object.freeze({ id: '07', branch: 'research/m07-boss', role: 'creative', prefix: 'docs/research/monsters/creative/bosses' }),
  Object.freeze({ id: '08', branch: 'research/m08-lore', role: 'lore', prefix: 'docs/research/monsters/lore' }),
]);

const REF_RE = /^[A-Za-z0-9._/-]+$/;

/**
 * @param {string} ref
 */
export function assertSafeRef(ref) {
  if (typeof ref !== 'string' || !REF_RE.test(ref) || ref.includes('..') || ref.startsWith('-') || ref.endsWith('/')) {
    throw new Error(`refusing git ref: ${ref}`);
  }
  return ref;
}

/**
 * @param {string} filePath
 */
export function assertSafeGitPath(filePath) {
  if (typeof filePath !== 'string' || filePath.length === 0 || filePath.startsWith('/') || filePath.includes('..') || filePath.includes('\\')) {
    throw new Error(`refusing git path: ${filePath}`);
  }
  return filePath;
}

/**
 * @param {string} absPath
 */
export function assertAllowedWrite(absPath) {
  const rel = relative(REPO_ROOT, resolve(absPath)).split(sep).join('/');
  if (rel.startsWith('..') || rel.startsWith('/')) return rel;
  const allowed = rel === QA_DIR
    || rel.startsWith(`${QA_DIR}/`)
    || rel === TOOL_DIR
    || rel.startsWith(`${TOOL_DIR}/`);
  if (!allowed) throw new Error(`refusing to write outside QA paths: ${rel}`);
  return rel;
}

/**
 * @param {string[]} args
 * @param {{ maxBuffer?: number, encoding?: string }} [options]
 */
function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: options.maxBuffer ?? 8 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/**
 * @param {string} ref
 * @returns {string | null}
 */
export function tryRev(ref) {
  assertSafeRef(ref);
  try {
    const sha = git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]).trim();
    return sha || null;
  } catch {
    return null;
  }
}

/**
 * @param {string} ref
 * @param {string} prefix
 * @returns {string[]}
 */
export function listFiles(ref, prefix) {
  assertSafeRef(ref);
  assertSafeGitPath(prefix);
  const out = git(['ls-tree', '-r', '--name-only', ref, '--', prefix]);
  return out.split('\n').map((line) => line.trim()).filter(Boolean);
}

/**
 * @param {string} ref
 * @param {string} filePath
 */
export function showFile(ref, filePath) {
  assertSafeRef(ref);
  assertSafeGitPath(filePath);
  return git(['show', `${ref}:${filePath}`]);
}

/**
 * Fetch one allowlisted research branch. Never fetches main or other branches.
 * A missing remote branch is a result, not a crash.
 * @param {string} branch
 */
export function fetchResearchBranch(branch) {
  if (!AGENTS.some((agent) => agent.branch === branch)) {
    throw new Error(`refusing to fetch ${branch}`);
  }
  try {
    git(['fetch', 'origin', branch]);
    return { branch, ok: true, message: '' };
  } catch (error) {
    const stderr = error && typeof error === 'object' && 'stderr' in error ? String(error.stderr) : '';
    return { branch, ok: false, message: (stderr || String(error.message || error)).trim().slice(0, 400) };
  }
}

/**
 * @param {typeof AGENTS[number]} agent
 */
export function resolveAgentRef(agent) {
  const remote = `origin/${agent.branch}`;
  const remoteSha = tryRev(remote);
  if (remoteSha) return { ref: remote, sha: remoteSha };
  const localSha = tryRev(agent.branch);
  if (localSha) return { ref: agent.branch, sha: localSha };
  return { ref: remote, sha: null };
}

export function currentBranch() {
  try {
    return git(['branch', '--show-current']).trim();
  } catch {
    return '';
  }
}
