/**
 * Load agent files, adapt them, join lore / QA / inspirations, then validate.
 * Precedence: monster files create the record, inspirations fill empty research
 * fields, lore overwrites the three lore fields, QA overwrites status, ipRisk,
 * and confidence.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { adaptDocument } from './adapt.mjs';
import { auditRecords } from './audit.mjs';
import { compactName } from './normalize.mjs';
import { loadSchema, validateMonster } from './schema-check.mjs';

const FORBIDDEN_KEY = /^(hp|maxhp|hpmax|atk|def|spd|pow|damage|dmg|attack|defense|speed|crit|critrate|accuracy|evasion|armor|exp|xp|weight|weights|rate|rates|pity|droprate|baseatk|basedef|basespd)$/i;

/**
 * @param {{
 *   inputs?: string[],
 *   lore?: string[],
 *   qa?: string[],
 *   inspirations?: string[],
 *   schemaPath: string,
 *   strict?: boolean,
 * }} options
 */
export function assemble(options) {
  const schema = loadSchema(options.schemaPath);
  /** @type {object[]} */
  const errors = [];
  /** @type {object[]} */
  const warnings = [];
  /** @type {object[]} */
  const notes = [];
  /** @type {string[]} */
  const sourceFiles = [];
  /** @type {{ record: object, source: string, index: number }[]} */
  const adapted = [];
  /** @type {object[]} */
  const lore = [];
  /** @type {object[]} */
  const qa = [];
  /** @type {object[]} */
  const inspirations = [];

  const files = [
    ...(options.inputs ?? []).map((file) => ({ file, hint: 'auto' })),
    ...(options.lore ?? []).map((file) => ({ file, hint: 'lore' })),
    ...(options.qa ?? []).map((file) => ({ file, hint: 'qa' })),
    ...(options.inspirations ?? []).map((file) => ({ file, hint: 'inspirations' })),
  ];

  for (const entry of files) {
    const file = resolve(entry.file);
    sourceFiles.push(entry.file);
    const loaded = readJson(entry.file);
    if (!loaded.ok) {
      errors.push(finding('error', loaded.code, entry.file, loaded.message));
      if (loaded.code === 'NOT_FOUND' || loaded.code === 'NOT_A_FILE') {
        return finish({ errors, warnings, notes, sourceFiles, records: [], schema, strict: options.strict, exitCode: 2 });
      }
      continue;
    }
    const doc = adaptDocument(loaded.value, entry.file);
    if (entry.hint === 'lore' && doc.lore.length === 0) {
      const message = doc.emptyLoreDocument
        ? 'Lore file is a framework document with an empty entries list. No links were applied.'
        : 'Lore file has no links. Expected a links array, an entries array of lore links, or one lore object.';
      const item = finding(doc.emptyLoreDocument ? 'warning' : 'error', 'LORE_EMPTY', entry.file, message);
      if (doc.emptyLoreDocument) warnings.push(item);
      else errors.push(item);
    }
    if (entry.hint === 'qa' && doc.qa.length === 0) {
      errors.push(finding('error', 'QA_EMPTY', entry.file, 'QA file has no reviews. Expected a reviews array.'));
    }
    if (entry.hint === 'inspirations' && doc.inspirations.length === 0) {
      errors.push(finding('error', 'INSPIRATIONS_EMPTY', entry.file, 'Inspirations file has no inspiration records.'));
    }
    for (const row of doc.records) {
      adapted.push(row);
      warnings.push(...row.warnings);
      errors.push(...row.errors);
    }
    lore.push(...doc.lore);
    qa.push(...doc.qa);
    inspirations.push(...doc.inspirations);
    warnings.push(...doc.warnings);
    errors.push(...doc.errors);
  }

  /** @type {object[]} */
  const records = [];
  const seenIds = new Map();
  for (const row of adapted) {
    const id = row.record?.monsterId;
    if (typeof id === 'string' && id.length > 0) {
      const previous = seenIds.get(id);
      if (previous) {
        errors.push(finding(
          'error',
          'DUPLICATE_ID',
          id,
          `${id} appears in ${previous} and ${row.source}. The first copy is kept.`,
          id,
        ));
        continue;
      }
      seenIds.set(id, row.source);
    }
    records.push(row.record);
  }

  fillInspirations(records, inspirations, errors, warnings, (options.inspirations ?? []).length > 0 || inspirations.length > 0);
  applyLore(records, lore, errors, warnings);
  applyQa(records, qa, errors, notes);

  for (const record of records) {
    for (const error of validateMonster(schema, record)) {
      if (error.keyword === 'additionalProperties' && error.key && FORBIDDEN_KEY.test(error.key)) continue;
      const id = typeof record.monsterId === 'string' ? record.monsterId : null;
      errors.push(finding('error', 'SCHEMA', id ? `${id}${error.path === '/' ? '' : error.path}` : error.path, error.message, id));
    }
  }

  for (const item of auditRecords(records)) {
    if (item.severity === 'warning') warnings.push(item);
    else errors.push(item);
  }

  records.sort((left, right) => String(left.monsterId ?? '').localeCompare(String(right.monsterId ?? '')));
  if (records.length === 0 && !errors.some((item) => item.code === 'NOT_FOUND' || item.code === 'NOT_A_FILE')) {
    errors.push(finding('error', 'NO_RECORDS', '/', 'No monster records were found in the input files.'));
  }

  return finish({ errors, warnings, notes, sourceFiles, records, schema, strict: options.strict, exitCode: null });
}

function finish({ errors, warnings, notes, sourceFiles, records, schema, strict, exitCode }) {
  const ok = errors.length === 0 && !(strict && warnings.length > 0);
  let code = exitCode;
  if (code == null) code = ok ? 0 : 1;
  return { ok, exitCode: code, records, errors, warnings, notes, sourceFiles, schema };
}

/**
 * @param {object[]} records
 * @param {object[]} inspirations
 * @param {object[]} errors
 * @param {object[]} warnings
 * @param {boolean} provided
 */
function fillInspirations(records, inspirations, errors, warnings, provided) {
  const byId = new Map();
  for (const inspiration of inspirations) {
    const id = inspiration?.inspirationId;
    if (typeof id !== 'string' || id.length === 0) continue;
    if (byId.has(id)) {
      warnings.push(finding('warning', 'DUPLICATE_INSPIRATION', id, `Inspiration ${id} appears more than once. The first copy is kept.`));
      continue;
    }
    byId.set(id, inspiration);
  }
  if (!provided && byId.size === 0) return;
  for (const record of records) {
    const id = record.research?.inspirationId;
    if (typeof id !== 'string' || id.length === 0) continue;
    const inspiration = byId.get(id);
    if (!inspiration) {
      if (provided) {
        errors.push(finding('error', 'UNKNOWN_INSPIRATION', `${record.monsterId ?? id}/research/inspirationId`, `No inspiration with id ${id} was loaded.`, record.monsterId ?? null));
      }
      continue;
    }
    const research = record.research;
    if (blank(research.originalInspiration) && inspiration.name) research.originalInspiration = inspiration.name;
    if (blank(research.origin) && inspiration.origin) research.origin = inspiration.origin;
    if (blank(research.kind) && inspiration.kind) research.kind = inspiration.kind;
    if (blank(research.facts) && Array.isArray(inspiration.facts) && inspiration.facts.length > 0) {
      research.facts = inspiration.facts.slice();
    }
    if (blank(research.sources) && Array.isArray(inspiration.sources) && inspiration.sources.length > 0) {
      research.sources = inspiration.sources.map((source) => ({ ...source }));
    }
    if (blank(research.sourceUrl) && research.sources?.[0]?.url) research.sourceUrl = research.sources[0].url;
    if (research.protectedName == null && typeof inspiration.protectedName === 'boolean') research.protectedName = inspiration.protectedName;
    if (research.publicDomain == null && typeof inspiration.publicDomain === 'boolean') research.publicDomain = inspiration.publicDomain;
    if (blank(research.confidence) && inspiration.confidence) research.confidence = inspiration.confidence;
    if (blank(research.archetypeTags) && Array.isArray(inspiration.archetypeTags) && inspiration.archetypeTags.length > 0) {
      research.archetypeTags = inspiration.archetypeTags.slice();
    }
    if (research.protectedName === false && inspiration.protectedName === true) {
      warnings.push(finding('warning', 'IP_FLAG_CONFLICT', `${record.monsterId ?? id}/research/protectedName`, `${record.monsterId ?? id} says the inspiration is not a protected name, but ${id} says it is.`, record.monsterId ?? null));
    }
  }
}

function applyLore(records, links, errors, warnings) {
  for (const link of links) {
    const hits = match(records, link);
    if (hits.length === 0) {
      errors.push(finding('error', 'LORE_UNMATCHED', link.monsterId ?? link.nameEn ?? link.source, `Lore link in ${link.source} did not match a monster.`, link.monsterId ?? null));
      continue;
    }
    if (hits.length > 1) {
      errors.push(finding('error', 'LORE_AMBIGUOUS', link.monsterId ?? link.nameEn ?? link.source, `Lore link in ${link.source} matched more than one monster.`, link.monsterId ?? null));
      continue;
    }
    const creative = hits[0].creative ?? (hits[0].creative = {});
    if (Object.hasOwn(link, 'factionAffiliation')) creative.factionAffiliation = link.factionAffiliation;
    // Phase-1 integration (Mira): never overwrite the creative agent's lore. Append the agent 08 hook.
    if (typeof link.loreSummary === 'string') {
      const own = typeof creative.loreSummary === 'string' ? creative.loreSummary.trim() : '';
      creative.loreSummary = own && own !== link.loreSummary.trim()
        ? `${own}\n\nLore link (agent 08, PROPOSED): ${link.loreSummary.trim()}`
        : link.loreSummary;
    }
    if (typeof link.suggestedTowerEnvironment === 'string' && !creative.suggestedTowerEnvironment) creative.suggestedTowerEnvironment = link.suggestedTowerEnvironment;
    if (link.ignoredStatus != null) {
      warnings.push(finding('warning', 'LORE_IGNORED_STATUS', link.monsterId ?? link.source, `Lore file tried to set status "${link.ignoredStatus}". Status comes from the monster record or QA.`, link.monsterId ?? null));
    }
  }
}

function applyQa(records, reviews, errors, notes) {
  for (const review of reviews) {
    const hits = match(records, review);
    if (hits.length === 0) {
      errors.push(finding('error', 'QA_UNMATCHED', review.monsterId ?? review.nameEn ?? review.source, `QA review in ${review.source} did not match a monster.`, review.monsterId ?? null));
      continue;
    }
    if (hits.length > 1) {
      errors.push(finding('error', 'QA_AMBIGUOUS', review.monsterId ?? review.source, `QA review in ${review.source} matched more than one monster.`, review.monsterId ?? null));
      continue;
    }
    const record = hits[0];
    if (review.status != null) {
      if (review.status === 'LOCKED' || review.status === 'OWNER_APPROVED') {
        errors.push(finding('error', 'STATUS_FORBIDDEN', `${record.monsterId ?? review.source}/status`, `${review.status} is not a research status. QA cannot set it.`, record.monsterId ?? null));
      } else {
        record.status = review.status;
      }
    }
    if (review.ipRisk != null) record.ipRisk = review.ipRisk;
    if (review.confidence != null) {
      record.research = record.research ?? {};
      record.research.confidence = review.confidence;
    }
    if (typeof review.notes === 'string' && review.notes.trim() !== '') {
      notes.push(finding('info', 'QA_NOTE', record.monsterId ?? review.source, review.notes.trim(), record.monsterId ?? null));
    }
  }
}

function match(records, link) {
  if (typeof link.monsterId === 'string' && link.monsterId.length > 0) {
    return records.filter((record) => record.monsterId === link.monsterId);
  }
  if (typeof link.nameEn === 'string' && link.nameEn.length > 0) {
    const key = compactName(link.nameEn);
    return records.filter((record) => compactName(record.creative?.nameEn) === key);
  }
  return [];
}

function blank(value) {
  return value == null || value === '' || (Array.isArray(value) && value.length === 0);
}

/**
 * @param {string} file
 */
export function readJson(file) {
  if (!existsSync(file)) return { ok: false, code: 'NOT_FOUND', message: `Input not found: ${file}` };
  if (!statSync(file).isFile()) return { ok: false, code: 'NOT_A_FILE', message: `Input is not a file: ${file}` };
  const text = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, code: 'PARSE', message: `Could not parse ${file}: ${message}` };
  }
}

function finding(severity, code, path, message, monsterId = null) {
  return {
    severity,
    code,
    path,
    message,
    monsterId,
    otherMonsterId: null,
    score: null,
  };
}
