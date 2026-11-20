import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { isPlainObject, readJsonFile } from './common.mjs';

/** Documentation that this branch already treats as required, plus the CI guide. */
export const REQUIRED_DOCS = [
  'README.md',
  'docs/CI.md',
  'docs/DATA_SCHEMA.md',
  'docs/INTEGRATION_NOTES_FOR_MIRA.md',
  'docs/OPEN_DESIGN_DECISIONS.md',
  'docs/SYSTEMS_PROGRESS_REPORT.md',
  'docs/SYSTEMS_REPO_AUDIT.md',
];

export const REQUIRED_FILES = [
  ...REQUIRED_DOCS,
  'src/schema/constants.js',
  'src/schema/game.schema.json',
  'src/schema/validate.js',
  'tools/ci/protected-constants.json',
];

export const PROTECTED_KEYS = ['partySize', 'handSize', 'baseAp', 'factions', 'cardActionTypes', 'statuses'];

/**
 * Stable JSON for the approved values. Key order is PROTECTED_KEYS.
 * @param {Record<string, unknown>} values
 */
export function canonicalProtected(values) {
  const payload = {};
  for (const key of PROTECTED_KEYS) payload[key] = values[key];
  return JSON.stringify(payload);
}

/**
 * @param {Record<string, unknown>} values
 */
export function hashProtected(values) {
  return createHash('sha256').update(canonicalProtected(values)).digest('hex');
}

/**
 * @param {string} root
 * @param {string} relativeFile
 * @returns {'ok' | 'missing' | 'empty'}
 */
function fileState(root, relativeFile) {
  const full = join(root, relativeFile);
  if (!existsSync(full)) return 'missing';
  let info;
  try {
    info = statSync(full);
  } catch {
    return 'missing';
  }
  if (!info.isFile()) return 'missing';
  const text = readFileSync(full, 'utf8');
  return text.trim().length === 0 ? 'empty' : 'ok';
}

/**
 * @param {string} root
 */
export async function readRuntimeConstants(root) {
  const relativeFile = 'src/schema/constants.js';
  const file = join(root, relativeFile);
  if (!existsSync(file)) return { ok: false, message: `${relativeFile} is missing` };
  let loaded;
  try {
    loaded = await import(pathToFileURL(file).href);
  } catch (error) {
    return { ok: false, message: `${relativeFile}: ${error instanceof Error ? error.message : String(error)}` };
  }
  if (!Array.isArray(loaded.FACTION_RECORDS) || !Array.isArray(loaded.CARD_ACTION_TYPES) || !Array.isArray(loaded.ASSET_STATUSES)) {
    return { ok: false, message: `${relativeFile} must export FACTION_RECORDS, CARD_ACTION_TYPES, and ASSET_STATUSES` };
  }
  return {
    ok: true,
    values: {
      partySize: loaded.PARTY_SIZE,
      handSize: loaded.HAND_SIZE,
      baseAp: loaded.BASE_AP,
      factions: loaded.FACTION_RECORDS.map((row) => ({
        factionId: row.factionId,
        name: row.name,
        role: row.role,
      })),
      cardActionTypes: [...loaded.CARD_ACTION_TYPES],
      statuses: [...loaded.ASSET_STATUSES],
    },
  };
}

/**
 * @param {string} root
 */
export function readProtectedSnapshot(root) {
  const relativeFile = 'tools/ci/protected-constants.json';
  const parsed = readJsonFile(join(root, relativeFile));
  if (!parsed.ok) return { ok: false, message: `${relativeFile}: ${parsed.error}` };
  if (!isPlainObject(parsed.value)) return { ok: false, message: `${relativeFile} must be a JSON object` };
  const missing = PROTECTED_KEYS.filter((key) => !Object.prototype.hasOwnProperty.call(parsed.value, key));
  if (missing.length > 0) return { ok: false, message: `${relativeFile} is missing ${missing.join(', ')}` };
  if (typeof parsed.value.sha256 !== 'string' || parsed.value.sha256.length === 0) {
    return { ok: false, message: `${relativeFile} is missing sha256` };
  }
  const values = {};
  for (const key of PROTECTED_KEYS) values[key] = parsed.value[key];
  const hash = hashProtected(values);
  if (hash !== parsed.value.sha256) {
    return {
      ok: false,
      message: `${relativeFile} sha256 does not match the protected payload (file declares ${parsed.value.sha256}, payload hashes to ${hash})`,
      values,
      hash,
    };
  }
  return { ok: true, values, hash };
}

/**
 * Required docs, plus drift between runtime constants and tools/ci/protected-constants.json.
 * The snapshot covers only the approved constants. It does not invent deck size, damage, HP,
 * gacha rates, or upgrade formulas.
 * @param {string} root
 */
export async function validateRepository(root) {
  const fileRows = REQUIRED_FILES.map((relativeFile) => {
    const state = fileState(root, relativeFile);
    return [relativeFile, state === 'ok' ? 'PASS' : 'FAIL', state === 'ok' ? 'non-empty' : state];
  });
  const missingOrEmpty = fileRows.filter((row) => row[1] === 'FAIL');

  const snapshot = readProtectedSnapshot(root);
  const runtime = await readRuntimeConstants(root);
  /** @type {{ key: string, expected: unknown, actual: unknown }[]} */
  const diffs = [];
  if (snapshot.ok && runtime.ok) {
    for (const key of PROTECTED_KEYS) {
      if (!isDeepStrictEqual(runtime.values[key], snapshot.values[key])) {
        diffs.push({ key, expected: snapshot.values[key], actual: runtime.values[key] });
      }
    }
  }

  const constantsOk = Boolean(snapshot.ok && runtime.ok && diffs.length === 0);
  let constantsDetail = 'runtime constants match the snapshot and sha256';
  if (!snapshot.ok) constantsDetail = snapshot.message;
  else if (!runtime.ok) constantsDetail = runtime.message;
  else if (diffs.length > 0) constantsDetail = `drift in ${diffs.map((diff) => diff.key).join(', ')}`;

  const diffBody = diffs.map((diff) => [
    `- \`${diff.key}\``,
    `  - snapshot: \`${JSON.stringify(diff.expected)}\``,
    `  - runtime: \`${JSON.stringify(diff.actual)}\``,
  ].join('\n')).join('\n');

  return {
    ok: missingOrEmpty.length === 0 && constantsOk,
    notices: [
      'Protected constants are party size, hand size, base AP, the faction list, ATK/DEF/Skill, and the asset status vocabulary. Deck size, damage, HP, gacha rates, and upgrade formulas are not locked by this check.',
    ],
    sections: [
      {
        title: 'Required files',
        table: { headers: ['File', 'Result', 'Detail'], rows: fileRows },
      },
      {
        title: 'Protected gameplay constants',
        table: {
          headers: ['Check', 'Result', 'Detail'],
          rows: [[
            'src/schema/constants.js vs tools/ci/protected-constants.json',
            constantsOk ? 'PASS' : 'FAIL',
            constantsDetail,
          ]],
        },
        body: diffBody,
      },
    ],
    missingOrEmpty: missingOrEmpty.map((row) => row[0]),
    diffs,
    constantsOk,
  };
}
