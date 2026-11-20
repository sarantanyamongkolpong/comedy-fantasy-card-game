import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { COLLECTION_BY_KIND, normalizeKind } from './columns.js';

const COLLECTIONS = ['avatars', 'avatarCards', 'actionCards', 'equipment'];

/**
 * @returns {{ avatars: object[], avatarCards: object[], actionCards: object[], equipment: object[], sources: string[], hasAvatars: boolean }}
 */
function emptyCatalog() {
  return {
    avatars: [],
    avatarCards: [],
    actionCards: [],
    equipment: [],
    sources: [],
    hasAvatars: false,
  };
}

/**
 * @param {object} data
 * @param {string} source
 * @param {ReturnType<typeof emptyCatalog>} catalog
 */
function appendDocument(data, source, catalog) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`${source} must be a JSON object`);
  }
  if (typeof data.kind === 'string' && Array.isArray(data.records)) {
    const kind = normalizeKind(data.kind);
    const collection = COLLECTION_BY_KIND[kind];
    catalog[collection].push(...data.records);
    if (collection === 'avatars') catalog.hasAvatars = true;
    catalog.sources.push(source);
    return;
  }
  let used = false;
  for (const collection of COLLECTIONS) {
    if (!Object.prototype.hasOwnProperty.call(data, collection)) continue;
    if (!Array.isArray(data[collection])) throw new Error(`${source} field "${collection}" must be an array`);
    catalog[collection].push(...data[collection]);
    if (collection === 'avatars') catalog.hasAvatars = true;
    used = true;
  }
  if (!used) throw new Error(`${source} has no avatars, avatarCards, actionCards, or equipment`);
  catalog.sources.push(source);
}

/**
 * @param {string} file
 * @param {ReturnType<typeof emptyCatalog>} catalog
 */
function loadJsonFile(file, catalog) {
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot parse ${file}: ${error.message}`);
  }
  appendDocument(data, file, catalog);
}

/**
 * Load a catalog JSON file or every JSON file in a directory (not recursive).
 * CSV files are ignored here; import them with the import command.
 * @param {string} target
 */
export function loadCatalog(target) {
  const catalog = emptyCatalog();
  let entries;
  try {
    entries = readdirSync(target, { withFileTypes: true });
  } catch (error) {
    if (error.code !== 'ENOTDIR') throw error;
    loadJsonFile(target, catalog);
    return catalog;
  }
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort();
  if (files.length === 0) throw new Error(`No catalog JSON in ${target}`);
  for (const name of files) loadJsonFile(join(target, name), catalog);
  return catalog;
}

/**
 * @param {string[]} targets
 */
export function loadCatalogs(targets) {
  const catalog = emptyCatalog();
  for (const target of targets) {
    const loaded = loadCatalog(target);
    for (const collection of COLLECTIONS) catalog[collection].push(...loaded[collection]);
    catalog.sources.push(...loaded.sources);
    catalog.hasAvatars = catalog.hasAvatars || loaded.hasAvatars;
  }
  return catalog;
}
