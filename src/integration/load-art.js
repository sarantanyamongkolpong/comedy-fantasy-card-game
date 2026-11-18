import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ART_COMMIT, ART_JSON, ART_REF } from './constants.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function git(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    maxBuffer: 16 * 1024 * 1024,
  });
}

function gitText(args, cwd) {
  return git(args, cwd).toString('utf8');
}

/**
 * @param {string} cwd
 * @param {string} ref
 */
function resolveArtCommit(cwd, ref) {
  let sha;
  try {
    sha = gitText(['rev-parse', ref], cwd).trim();
  } catch {
    gitText(['fetch', 'origin', 'feat/card-art-prototype-mira'], cwd);
    sha = gitText(['rev-parse', ref], cwd).trim();
  }
  if (sha !== ART_COMMIT) {
    throw new Error(
      `Art ref ${ref} is ${sha}. This audit is pinned to ${ART_COMMIT}.`,
    );
  }
  return sha;
}

function readJson(text, path) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON at ${path}: ${error.message}`);
  }
}

function hashBuffer(buffer) {
  return {
    sha256: createHash('sha256').update(buffer).digest('hex'),
    bytes: buffer.length,
  };
}

/**
 * Load the pinned art commit into memory.
 * `ART_ROOT` reads a worktree checkout. Otherwise blobs are read with `git show`.
 * Nothing is written into the systems branch.
 * @param {{ root?: string, ref?: string, repo?: string }} [options]
 */
export function loadArtBundle(options = {}) {
  const repo = options.repo ?? repoRoot;
  const root = options.root ?? process.env.ART_ROOT ?? null;
  const ref = options.ref ?? process.env.ART_REF ?? ART_REF;
  const cacheKey = `${repo}\0${root ?? ''}\0${ref}`;
  if (loadArtBundle.cache?.key === cacheKey) return loadArtBundle.cache.bundle;

  const artCommit = resolveArtCommit(repo, ref);
  const readText = (path) => {
    if (root) {
      const full = join(root, path);
      if (!existsSync(full)) throw new Error(`Missing art JSON in ART_ROOT: ${path}`);
      return readFileSync(full, 'utf8');
    }
    try {
      return gitText(['show', `${ref}:${path}`], repo);
    } catch {
      throw new Error(`Missing art JSON at ${ref}:${path}`);
    }
  };
  const readBytes = (path) => {
    if (root) {
      const full = join(root, path);
      if (!existsSync(full)) return null;
      return readFileSync(full);
    }
    try {
      return git(['show', `${ref}:${path}`], repo);
    } catch {
      return null;
    }
  };

  const manifest = readJson(readText(ART_JSON.manifest), ART_JSON.manifest);
  const bundle = {
    artCommit,
    artRef: ref,
    source: root ? 'filesystem' : 'git',
    artRoot: root,
    manifest,
    frameLayout: readJson(readText(ART_JSON.frameLayout), ART_JSON.frameLayout),
    rigFiles: ART_JSON.rigs.map((path) => ({ path, data: readJson(readText(path), path) })),
    itemFiles: ART_JSON.items.map((path) => ({ path, data: readJson(readText(path), path) })),
    animation: readJson(readText(ART_JSON.animation), ART_JSON.animation),
    vfx: readJson(readText(ART_JSON.vfx), ART_JSON.vfx),
    legacyReference: readJson(readText(ART_JSON.legacyReference), ART_JSON.legacyReference),
    files: {},
    missingPaths: [],
  };

  const paths = new Set();
  for (const entry of manifest.assets ?? []) {
    if (typeof entry?.path === 'string') paths.add(entry.path);
  }
  for (const path of paths) {
    const bytes = readBytes(path);
    if (!bytes) {
      bundle.missingPaths.push(path);
      continue;
    }
    bundle.files[path] = hashBuffer(bytes);
  }
  bundle.missingPaths.sort();

  loadArtBundle.cache = { key: cacheKey, bundle };
  return bundle;
}
