import { existsSync, statSync } from 'node:fs';
import { join, normalize, sep } from 'node:path';
import { ASSET_STATUSES } from '../../../src/schema/constants.js';
import { isPlainObject, isUnder, readJsonFile, relativePosix, walkFiles } from './common.mjs';

/**
 * @param {unknown} value
 */
function isAssetDefinition(value) {
  return isPlainObject(value)
    && typeof value.asset_id === 'string'
    && value.asset_id.length > 0
    && (typeof value.path === 'string' || typeof value.type === 'string' || typeof value.slot === 'string' || typeof value.file === 'string');
}

/**
 * @param {unknown} value
 */
function isAssetManifest(value) {
  if (!isPlainObject(value) || !Array.isArray(value.assets)) return false;
  if (value.manifest_version != null || value.status_legend || typeof value.project === 'string') return true;
  return value.assets.some((entry) => isPlainObject(entry) && typeof entry.asset_id === 'string' && 'path' in entry);
}

/**
 * @param {string} root
 * @param {string} relPath
 * @returns {{ ok: true, full: string } | { ok: false, message: string }}
 */
function resolveRepoPath(root, relPath) {
  if (typeof relPath !== 'string' || relPath.length === 0) return { ok: false, message: 'path is empty' };
  if (relPath.startsWith('/') || /^[A-Za-z]:[\\/]/.test(relPath)) return { ok: false, message: 'path must be repo-relative' };
  const full = normalize(join(root, relPath));
  const rootFull = normalize(root);
  if (full !== rootFull && !full.startsWith(rootFull + sep)) return { ok: false, message: 'path escapes the repository' };
  return { ok: true, full };
}

/**
 * @param {unknown[]} entries
 */
function duplicateIds(entries) {
  const seen = new Set();
  const duplicates = [];
  for (const entry of entries) {
    if (!isPlainObject(entry) || typeof entry.asset_id !== 'string' || entry.asset_id.length === 0) continue;
    if (seen.has(entry.asset_id)) duplicates.push(entry.asset_id);
    else seen.add(entry.asset_id);
  }
  return duplicates;
}

/**
 * Duplicate Asset IDs, and manifest path existence when art is checked out.
 * CONCEPT and PROTOTYPE are valid. PRODUCTION_READY is not required.
 * A systems-only checkout with no `assets/` directory skips path checks.
 * @param {string} root
 */
export function validateAssets(root) {
  const assetsPresent = existsSync(join(root, 'assets')) && statSync(join(root, 'assets')).isDirectory();
  const canonicalManifest = existsSync(join(root, 'docs', 'ASSET_MANIFEST.json'));
  const duplicates = [];
  const missingPaths = [];
  const invalidStatuses = [];
  const manifests = [];
  const statusCounts = new Map();
  const liveAssetIds = new Map();
  let fixtureAssets = 0;
  let liveAssets = 0;

  for (const file of walkFiles(root, '.json')) {
    const rel = relativePosix(root, file);
    const fixture = isUnder(root, file, 'tests');
    const parsed = readJsonFile(file);
    if (!parsed.ok) continue;

    const collections = [];
    collectCollections(parsed.value, rel, collections);
    for (const collection of collections) {
      for (const id of duplicateIds(collection.entries)) {
        duplicates.push({ id, location: `${rel} ${collection.pointer}` });
      }
    }

    if (!isAssetManifest(parsed.value)) continue;
    const assetCount = parsed.value.assets.length;
    manifests.push({ file: rel, fixture, assetCount });
    if (fixture) fixtureAssets += assetCount;
    else liveAssets += assetCount;

    parsed.value.assets.forEach((entry, index) => {
      if (!isPlainObject(entry)) return;
      const id = typeof entry.asset_id === 'string' ? entry.asset_id : `(missing id at assets[${index}])`;
      if (!fixture && typeof entry.asset_id === 'string' && entry.asset_id.length > 0) {
        const previous = liveAssetIds.get(entry.asset_id);
        if (previous && previous !== rel) duplicates.push({ id: entry.asset_id, location: `${previous} and ${rel}` });
        else liveAssetIds.set(entry.asset_id, rel);
      }
      if (fixture || !assetsPresent) return;
      const status = entry.status;
      if (typeof status !== 'string' || !ASSET_STATUSES.includes(status)) {
        invalidStatuses.push({ file: rel, id, status: status ?? '(missing)' });
      } else {
        statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
      }
      const resolved = resolveRepoPath(root, entry.path);
      if (!resolved.ok) {
        missingPaths.push({ file: rel, id, path: String(entry.path ?? ''), message: resolved.message });
        return;
      }
      if (!existsSync(resolved.full)) {
        missingPaths.push({ file: rel, id, path: String(entry.path), message: 'file does not exist' });
      }
    });
  }

  const uniqueDuplicates = [];
  const seenDuplicate = new Set();
  for (const entry of duplicates) {
    const key = `${entry.id}@@${entry.location}`;
    if (seenDuplicate.has(key)) continue;
    seenDuplicate.add(key);
    uniqueDuplicates.push(entry);
  }

  const notices = [];
  if (!assetsPresent) {
    notices.push(
      'Asset path checks skipped: `assets/` is not in this checkout'
      + `${canonicalManifest ? '' : ', and `docs/ASSET_MANIFEST.json` is not present'}. `
      + 'That is expected on a systems-only branch; art lives on `feat/card-art-prototype-mira` (PR #1). '
      + 'This job does not fail because those files are on another branch. '
      + 'CONCEPT and PROTOTYPE remain valid statuses. PRODUCTION_READY is not required. '
      + 'Duplicate Asset ID checks still ran on manifest-shaped JSON in this checkout, including test fixtures.',
    );
  } else if (!manifests.some((manifest) => !manifest.fixture)) {
    notices.push(
      '`assets/` is present, but no live manifest outside `tests/` was found (`docs/ASSET_MANIFEST.json` is the canonical file). '
      + 'Path checks were skipped. Duplicate Asset ID checks still ran. '
      + 'CONCEPT and PROTOTYPE are valid. PRODUCTION_READY is not required.',
    );
  } else {
    notices.push('CONCEPT and PROTOTYPE are valid asset statuses. PRODUCTION_READY is not required.');
  }

  const pathCheckRan = assetsPresent && manifests.some((manifest) => !manifest.fixture);
  const pathOk = !pathCheckRan || (missingPaths.length === 0 && invalidStatuses.length === 0);
  const ok = uniqueDuplicates.length === 0 && pathOk;

  const manifestRows = manifests.length === 0
    ? [['(none)', '—', '0']]
    : manifests.map((manifest) => [manifest.file, manifest.fixture ? 'fixture (ids only)' : 'live', String(manifest.assetCount)]);

  const statusRows = ASSET_STATUSES.map((status) => [status, String(statusCounts.get(status) ?? 0), status === 'CONCEPT' || status === 'PROTOTYPE' ? 'valid' : 'valid, not required']);

  return {
    ok,
    notices,
    sections: [
      {
        title: 'Manifests',
        table: { headers: ['File', 'Role', 'Assets'], rows: manifestRows },
      },
      {
        title: 'Duplicate Asset IDs',
        table: {
          headers: ['Check', 'Result', 'Detail'],
          rows: [[
            'Duplicate asset IDs',
            uniqueDuplicates.length === 0 ? 'PASS' : 'FAIL',
            uniqueDuplicates.length === 0
              ? `${fixtureAssets} fixture asset${fixtureAssets === 1 ? '' : 's'}, ${liveAssets} live asset${liveAssets === 1 ? '' : 's'}`
              : `${uniqueDuplicates.length} duplicate${uniqueDuplicates.length === 1 ? '' : 's'}`,
          ]],
        },
        body: uniqueDuplicates.slice(0, 30).map((entry) => `- \`${entry.id}\` in ${entry.location}`).join('\n'),
      },
      {
        title: 'Local asset paths',
        table: {
          headers: ['Check', 'Result', 'Detail'],
          rows: [
            [
              'Manifest paths exist',
              pathCheckRan ? (missingPaths.length === 0 ? 'PASS' : 'FAIL') : 'SKIP',
              pathCheckRan
                ? (missingPaths.length === 0 ? 'every live manifest path exists' : `${missingPaths.length} missing`)
                : 'skipped (see notice)',
            ],
            [
              'Status vocabulary on live manifest',
              pathCheckRan ? (invalidStatuses.length === 0 ? 'PASS' : 'FAIL') : 'SKIP',
              pathCheckRan
                ? (invalidStatuses.length === 0 ? 'every status is in the approved vocabulary' : `${invalidStatuses.length} invalid`)
                : 'skipped with path checks',
            ],
            ['PRODUCTION_READY required', 'PASS', 'no — CONCEPT and PROTOTYPE are valid'],
          ],
        },
        body: [
          ...missingPaths.slice(0, 30).map((entry) => `- \`${entry.id}\` \`${entry.path}\` (${entry.file}): ${entry.message}`),
          ...invalidStatuses.slice(0, 30).map((entry) => `- \`${entry.id}\` (${entry.file}): status ${entry.status} is outside the approved vocabulary`),
        ].join('\n'),
      },
      ...(pathCheckRan
        ? [{
          title: 'Live manifest status counts',
          table: { headers: ['Status', 'Count', 'Gate'], rows: statusRows },
        }]
        : []),
    ],
    duplicates: uniqueDuplicates,
    missingPaths,
    invalidStatuses,
    manifests,
    assetsPresent,
    pathCheckRan,
  };
}

/**
 * @param {unknown} value
 * @param {string} pointer
 * @param {{ pointer: string, entries: unknown[] }[]} collections
 */
function collectCollections(value, pointer, collections) {
  if (Array.isArray(value)) {
    if (value.some((entry) => isAssetDefinition(entry))) collections.push({ pointer, entries: value });
    value.forEach((entry, index) => collectCollections(entry, `${pointer}[${index}]`, collections));
    return;
  }
  if (!isPlainObject(value)) return;
  const values = Object.values(value);
  if (values.length > 0 && values.every((entry) => isPlainObject(entry)) && values.filter((entry) => isAssetDefinition(entry)).length >= 2) {
    collections.push({ pointer, entries: values });
  }
  for (const [key, child] of Object.entries(value)) {
    const next = /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? `${pointer}.${key}` : `${pointer}[${JSON.stringify(key)}]`;
    collectCollections(child, next, collections);
  }
}
