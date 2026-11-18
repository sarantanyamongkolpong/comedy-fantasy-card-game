import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FACTION_RECORDS } from '../../src/schema/constants.js';
import { factionIdFromAuthorValue } from './ids.js';

/**
 * @param {unknown} value
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Apply template defaults onto a record.
 * A null on the record is kept. A missing key takes the default.
 * Nested objects merge the same way, so an explicit null stat is not replaced.
 * @param {unknown} defaults
 * @param {unknown} record
 */
export function mergeDefaults(defaults, record) {
  if (record === null) return null;
  if (Array.isArray(defaults)) {
    return record === undefined ? structuredClone(defaults) : structuredClone(record);
  }
  if (isPlainObject(defaults)) {
    if (record !== undefined && !isPlainObject(record)) return structuredClone(record);
    const source = isPlainObject(record) ? record : {};
    const out = {};
    const keys = new Set([...Object.keys(defaults), ...Object.keys(source)]);
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(source, key)) {
        out[key] = structuredClone(defaults[key]);
      } else {
        out[key] = mergeDefaults(defaults[key], source[key]);
      }
    }
    return out;
  }
  return record === undefined ? structuredClone(defaults) : structuredClone(record);
}

/**
 * @param {object} step
 * @param {string} templateId
 */
function assertDeriveStep(step, templateId) {
  if (!step || typeof step !== 'object' || typeof step.field !== 'string' || step.field.length === 0) {
    throw new Error(`Template "${templateId}" has a derive step without a field`);
  }
  const sources = ['map', 'from', 'fromAvatar', 'template'].filter((key) => step[key] !== undefined);
  if (step.map) {
    if (step.map !== 'factionRole') {
      throw new Error(`Template "${templateId}" unknown derive map "${step.map}"`);
    }
    if (typeof step.from !== 'string' || sources.includes('fromAvatar') || sources.includes('template')) {
      throw new Error(`Template "${templateId}" factionRole derive needs "from" and no other source`);
    }
  } else if (sources.length !== 1) {
    throw new Error(
      `Template "${templateId}" derive for "${step.field}" needs exactly one of from, fromAvatar, or template`,
    );
  }
  if (step.when !== undefined && step.when !== 'missing') {
    throw new Error(`Template "${templateId}" derive.when must be "missing" so an explicit null is kept`);
  }
}

/**
 * @param {string} directory
 */
export function loadTemplates(directory) {
  const names = readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .sort();
  if (names.length === 0) throw new Error(`No templates in ${directory}`);
  const byId = new Map();
  for (const name of names) {
    const file = join(directory, name);
    let data;
    try {
      data = JSON.parse(readFileSync(file, 'utf8'));
    } catch (error) {
      throw new Error(`Cannot parse template ${file}: ${error.message}`);
    }
    if (!data || typeof data.templateId !== 'string' || data.templateId.length === 0) {
      throw new Error(`${file} is missing templateId`);
    }
    if (byId.has(data.templateId)) throw new Error(`Duplicate templateId "${data.templateId}"`);
    for (const step of data.derive ?? []) assertDeriveStep(step, data.templateId);
    byId.set(data.templateId, data);
  }
  const cache = new Map();
  return {
    byId,
    /**
     * @param {string} templateId
     */
    resolve(templateId) {
      return resolveTemplate(byId, cache, templateId, new Set());
    },
  };
}

/**
 * @param {Map<string, object>} byId
 * @param {Map<string, object>} cache
 * @param {string} templateId
 * @param {Set<string>} stack
 */
function resolveTemplate(byId, cache, templateId, stack) {
  const cached = cache.get(templateId);
  if (cached) return cached;
  if (stack.has(templateId)) throw new Error(`Template cycle at "${templateId}"`);
  const template = byId.get(templateId);
  if (!template) throw new Error(`Unknown template "${templateId}"`);
  stack.add(templateId);
  const parent = template.extends
    ? resolveTemplate(byId, cache, template.extends, stack)
    : { defaults: {}, derive: [], kind: null };
  stack.delete(templateId);
  const resolved = {
    templateId,
    kind: template.kind ?? parent.kind ?? null,
    defaults: mergeDefaults(parent.defaults, template.defaults ?? {}),
    derive: [...(parent.derive ?? []), ...(template.derive ?? [])],
  };
  cache.set(templateId, resolved);
  return resolved;
}

/**
 * @param {object} record
 * @param {string} path
 */
function getPath(record, path) {
  const parts = path.split('.');
  let cursor = record;
  for (const part of parts) {
    if (cursor === null || cursor === undefined || typeof cursor !== 'object') return undefined;
    if (!Object.prototype.hasOwnProperty.call(cursor, part)) return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

/**
 * @param {object} record
 * @param {string} path
 * @param {unknown} value
 * @returns {boolean} False when a null ancestor blocks the write. That null is left in place.
 */
function setPath(record, path, value) {
  const parts = path.split('.');
  let cursor = record;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (cursor[part] === undefined) cursor[part] = {};
    if (cursor[part] === null || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) return false;
    cursor = cursor[part];
  }
  cursor[parts[parts.length - 1]] = value;
  return true;
}

/**
 * @param {string} template
 * @param {object} record
 * @returns {string | null}
 */
function fillTemplate(template, record) {
  let failed = false;
  const filled = template.replace(/\$\{([^}]+)\}/g, (_match, key) => {
    const value = getPath(record, key);
    if (typeof value !== 'string' || value.length === 0) {
      failed = true;
      return '';
    }
    return value;
  });
  return failed ? null : filled;
}

/**
 * @param {object} record
 * @param {object[]} steps
 * @param {{ avatarsById?: Map<string, object> }} context
 */
function applyDerive(record, steps, context) {
  for (const step of steps) {
    if (getPath(record, step.field) !== undefined) continue;
    let value;
    if (step.map === 'factionRole') {
      const factionId = getPath(record, step.from);
      const faction = FACTION_RECORDS.find((item) => item.factionId === factionId);
      if (!faction) continue;
      value = faction.role;
    } else if (typeof step.fromAvatar === 'string') {
      const avatar = context.avatarsById?.get(record.avatarId);
      if (!avatar) continue;
      value = getPath(avatar, step.fromAvatar);
      if (value === undefined) continue;
    } else if (typeof step.template === 'string') {
      value = fillTemplate(step.template, record);
      if (value === null) continue;
    } else if (typeof step.from === 'string') {
      value = getPath(record, step.from);
      if (value === undefined) continue;
    } else {
      continue;
    }
    setPath(record, step.field, structuredClone(value));
  }
}

/**
 * @param {object} record
 */
function normalizeFactionId(record) {
  if (Object.prototype.hasOwnProperty.call(record, 'factionId')) {
    record.factionId = factionIdFromAuthorValue(record.factionId);
  }
}

/**
 * Materialize one record. Records without `extends` are cloned and not filled.
 * @param {unknown} record
 * @param {{ resolve: (id: string) => { defaults: object, derive: object[] } }} templates
 * @param {{ avatarsById?: Map<string, object> }} [context]
 */
export function materializeRecord(record, templates, context = {}) {
  if (!isPlainObject(record)) return record;
  let working;
  if (typeof record.extends === 'string' && record.extends.length > 0) {
    const template = templates.resolve(record.extends);
    working = mergeDefaults(template.defaults, record);
    delete working.extends;
    normalizeFactionId(working);
    applyDerive(working, template.derive, context);
  } else {
    working = structuredClone(record);
    delete working.extends;
    normalizeFactionId(working);
  }
  return working;
}

/**
 * Avatars are materialized first so avatar cards can copy identity from them.
 * @param {object} catalog
 * @param {{ resolve: (id: string) => object }} templates
 */
export function materializeCatalog(catalog, templates) {
  const avatars = (catalog.avatars ?? []).map((record) => materializeRecord(record, templates));
  const avatarsById = new Map();
  for (const avatar of avatars) {
    if (avatar && typeof avatar.avatarId === 'string' && !avatarsById.has(avatar.avatarId)) {
      avatarsById.set(avatar.avatarId, avatar);
    }
  }
  const context = { avatarsById };
  return {
    avatars,
    avatarCards: (catalog.avatarCards ?? []).map((record) => materializeRecord(record, templates, context)),
    actionCards: (catalog.actionCards ?? []).map((record) => materializeRecord(record, templates, context)),
    equipment: (catalog.equipment ?? []).map((record) => materializeRecord(record, templates, context)),
  };
}
