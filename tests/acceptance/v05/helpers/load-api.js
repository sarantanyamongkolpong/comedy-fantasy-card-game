import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));

/**
 * @param {string} relativeFile repo-relative POSIX path
 */
export async function tryImport(relativeFile) {
  const absolute = join(repoRoot, relativeFile);
  if (!existsSync(absolute)) return null;
  try {
    return await import(pathToFileURL(absolute).href);
  } catch (error) {
    if (error && error.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw error;
  }
}

/**
 * Load the first existing module. A missing file is "not landed".
 * A file that exists without the required functions is a broken contract:
 * callers fail that case instead of skipping it.
 * @param {string[]} relativeFiles
 * @param {string[]} names
 * @param {string} label
 */
export async function loadNamed(relativeFiles, names, label) {
  const files = Array.isArray(relativeFiles) ? relativeFiles : [relativeFiles];
  let found = null;
  for (const relativeFile of files) {
    const mod = await tryImport(relativeFile);
    if (mod) {
      found = { mod, relativeFile };
      break;
    }
  }
  if (!found) {
    return {
      mod: null,
      file: null,
      missing: [...names],
      reason: `${files.join(' or ')} not landed (${label})`,
    };
  }
  const missing = names.filter((name) => typeof found.mod[name] !== 'function');
  if (missing.length > 0) {
    return {
      mod: found.mod,
      file: found.relativeFile,
      missing,
      reason: `${found.relativeFile} is missing exports: ${missing.join(', ')}`,
    };
  }
  return { mod: found.mod, file: found.relativeFile, missing: [], reason: null };
}

/**
 * Register cases against an API.
 * Missing module -> todo (not a pass).
 * Module present but exports missing -> one real failure, other cases todo.
 * @param {Awaited<ReturnType<typeof loadNamed>>} loaded
 * @param {{ name: string, fn: (mod: Record<string, Function>) => void | Promise<void> }[]} cases
 */
export function bindApi(loaded, cases) {
  if (!loaded.mod) {
    for (const entry of cases) test.todo(`${entry.name} — ${loaded.reason}`);
    return;
  }
  if (loaded.missing.length > 0) {
    test(`contract ${loaded.file}`, () => {
      const error = new Error(loaded.reason);
      error.missing = loaded.missing;
      throw error;
    });
    for (const entry of cases) test.todo(`${entry.name} — ${loaded.reason}`);
    return;
  }
  for (const entry of cases) test(entry.name, () => entry.fn(loaded.mod));
}

export const ENGINE_FILES = ['src/engine/index.js'];
export const CONFIG_FILES = ['src/config/index.js'];
export const GACHA_FILES = ['src/gacha/index.js'];
export const SAVE_FILES = ['src/save/index.js'];
export const MIGRATE_FILES = ['src/migrate/index.js'];
export const HIDEOUT_FILES = ['src/hideout/index.js', 'src/home/index.js'];
export const PROGRESSION_FILES = ['src/progression/index.js'];
export const MAP_FILES = [
  'web/src/map/layout.js',
  'web/src/map/world-map.js',
  'web/src/index.js',
];

export const ENGINE_EXPORTS = [
  'createMatch',
  'startTurn',
  'playAction',
  'discardVoluntary',
  'endTurn',
  'resolveEndOfRoundDiscard',
  'getZones',
  'getOutcome',
];

export function repoPath(...parts) {
  return join(repoRoot, ...parts);
}

export function repoDir() {
  return repoRoot;
}

export function thisDir(importMetaUrl) {
  return dirname(fileURLToPath(importMetaUrl));
}
