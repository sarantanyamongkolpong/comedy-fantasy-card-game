import { readFileSync } from 'node:fs';
import { AGENTS, listFiles, showFile } from './repo.mjs';

const TEXT_EXT = new Set(['.json', '.md', '.csv', '.txt']);

/**
 * @param {string} name
 */
function extensionOf(name) {
  const index = name.lastIndexOf('.');
  return index >= 0 ? name.slice(index).toLowerCase() : '';
}

/**
 * @param {unknown} value
 * @param {string[]} keys
 */
function pick(value, keys) {
  if (!value || typeof value !== 'object') return undefined;
  const record = /** @type {Record<string, unknown>} */ (value);
  const entries = Object.entries(record).map(([key, item]) => [key.toLowerCase().replace(/[^a-z0-9]/g, ''), item]);
  for (const wanted of keys) {
    const norm = wanted.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [key, item] of entries) {
      if (key === norm && item != null && item !== '') return item;
    }
  }
  return undefined;
}

/**
 * A flat sheet sometimes puts the citation in Source URL instead of a sources array.
 * @param {{ url: string, title: string, supports: string, accessed: string }[]} sources
 * @param {Record<string, unknown>} flat
 */
function withLooseUrl(sources, flat) {
  if (sources.length > 0) return sources;
  const url = asText(pick(flat, ['sourceUrl', 'sourceURL', 'url', 'href']));
  if (!/^https?:\/\//i.test(url)) return sources;
  return [{
    url,
    title: asText(pick(flat, ['sourceTitle', 'citationTitle'])),
    supports: asText(pick(flat, ['supports', 'claim'])) || asList(pick(flat, ['facts', 'fact'])).join(' '),
    accessed: asText(pick(flat, ['accessed', 'accessDate'])),
  }];
}

/**
 * @param {unknown} value
 */
function asText(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join('; ');
  return '';
}

/**
 * @param {unknown} value
 * @returns {boolean | undefined}
 */
function asBool(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return undefined;
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function asList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap((item) => asText(item) ? [asText(item)] : []);
  const text = asText(value);
  return text ? [text] : [];
}

/**
 * @param {unknown} value
 */
function sourceList(value) {
  if (!value) return [];
  const items = Array.isArray(value) ? value : [value];
  const sources = [];
  for (const item of items) {
    if (typeof item === 'string') {
      if (item.trim()) sources.push({ url: item.trim(), title: '', supports: '', accessed: '' });
      continue;
    }
    if (!item || typeof item !== 'object') continue;
    const url = asText(pick(item, ['url', 'href', 'link', 'sourceUrl', 'source']));
    if (!url) continue;
    sources.push({
      url,
      title: asText(pick(item, ['title', 'name', 'site', 'publisher'])),
      supports: asText(pick(item, ['supports', 'claim', 'fact', 'note', 'quote'])),
      accessed: asText(pick(item, ['accessed', 'accessDate', 'retrieved', 'date'])),
    });
  }
  return sources;
}

/**
 * Merge the brief's research/creative blocks with a flat record.
 * Creative naming fields win. Research sources win when creative has none.
 * @param {Record<string, unknown>} raw
 */
function flatten(raw) {
  const research = raw.research && typeof raw.research === 'object' && !Array.isArray(raw.research)
    ? /** @type {Record<string, unknown>} */ (raw.research) : {};
  const creative = raw.creative && typeof raw.creative === 'object' && !Array.isArray(raw.creative)
    ? /** @type {Record<string, unknown>} */ (raw.creative) : {};
  return {
    ...raw,
    ...research,
    ...creative,
    sources: creative.sources || research.sources || raw.sources,
    facts: research.facts || raw.facts || creative.facts,
  };
}

/**
 * @param {unknown} json
 */
function unwrapRecords(json) {
  if (Array.isArray(json)) return json;
  if (!json || typeof json !== 'object') return [];
  const obj = /** @type {Record<string, unknown>} */ (json);
  for (const key of ['inspirations', 'pitches', 'entries', 'samples', 'monsters', 'bosses', 'names', 'records', 'items', 'sources', 'data']) {
    if (Array.isArray(obj[key])) return obj[key];
  }
  if (obj.url || obj.parodyName || obj.name || obj.inspirationId || obj.monsterId) return [obj];
  return [];
}

/**
 * @param {string} path
 * @param {string} agentRole
 * @param {unknown} rawKind
 */
function inferKind(path, agentRole, rawKind, raw) {
  const kind = asText(rawKind).toLowerCase();
  if (kind === 'citation' || kind === 'source') return 'citation';
  if (kind === 'inspiration' || kind === 'research') return 'inspiration';
  if (kind === 'pitch' || kind === 'creative' || kind === 'sample' || kind === 'boss') return 'creative';
  const file = path.toLowerCase();
  if (file.endsWith('inspirations.json')) return 'inspiration';
  if (file.includes('pitch') || file.includes('/creative/')) return 'creative';
  if (agentRole === 'creative') return 'creative';
  if (raw && asText(pick(raw, ['parodyName', 'parodyNameEn', 'monsterName', 'cardName']))) return 'creative';
  if (agentRole === 'lore') return 'lore';
  return 'inspiration';
}

/**
 * @param {unknown} raw
 * @param {{ agent: string, role: string, ref: string, sha: string, path: string, index: number }} meta
 */
export function normalizeRecord(raw, meta) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      ...emptyRecord(meta),
      parseError: 'record is not an object',
    };
  }
  const flat = flatten(/** @type {Record<string, unknown>} */ (raw));
  const kind = inferKind(meta.path, meta.role, pick(flat, ['kind', 'recordKind', 'type']), flat);
  const role = kind === 'creative' ? 'creative' : (kind === 'lore' ? 'lore' : 'research');
  const originalName = asText(pick(flat, [
    'originalInspiration', 'originalName', 'original', 'inspirationName', 'sourceName', 'inspiredBy', 'basedOn',
    'originalInspirationSource', 'originalSource',
  ]));
  let parodyName = asText(pick(flat, [
    'parodyName', 'parodyNameEn', 'nameEn', 'displayName', 'monsterName', 'cardName',
  ]));
  const fallbackName = asText(pick(flat, ['name', 'title', 'en']));
  if (!parodyName && role === 'creative') {
    parodyName = fallbackName || asText(pick(flat, ['bossTitle', 'epithet', 'title']));
  }
  const resolvedOriginal = originalName || (role === 'research' ? fallbackName : '');
  const id = asText(pick(flat, role === 'creative'
    ? ['monsterId', 'bossId', 'pitchId', 'nameId', 'entryId', 'id', 'inspirationId']
    : ['inspirationId', 'id', 'entryId', 'monsterId', 'pitchId'])) || `${meta.agent}-${kind}-${meta.index + 1}`;
  return {
    agent: meta.agent,
    role,
    kind,
    ref: meta.ref,
    sha: meta.sha,
    path: meta.path,
    index: meta.index,
    id,
    parodyName,
    thaiName: asText(pick(flat, ['thaiName', 'nameTh', 'thai', 'nameThai'])),
    originalName: resolvedOriginal,
    origin: asText(pick(flat, ['origin', 'franchise', 'culture', 'sourceCulture', 'setting'])),
    category: asText(pick(flat, ['monsterCategory', 'category', 'tier', 'rank'])),
    creatureType: asText(pick(flat, ['creatureType', 'creature', 'species', 'type'])),
    visualIdentity: asText(pick(flat, ['visualIdentity', 'visual', 'appearance', 'look'])),
    artworkPrompt: asText(pick(flat, ['artworkPrompt', 'artworkPromptConcept', 'artPrompt', 'prompt'])),
    silhouette: asText(pick(flat, ['signatureSilhouette', 'silhouette'])),
    comedyConcept: asText(pick(flat, ['comedyConcept', 'comedy', 'joke', 'humor', 'concept'])),
    personality: asText(pick(flat, ['personality', 'motivation', 'personalityMotivation'])),
    signatureTrait: asText(pick(flat, ['signatureTrait', 'trait'])),
    ability: asText(pick(flat, ['signatureAbilityConcept', 'signatureAbility', 'ability', 'abilityName'])),
    mechanic: asText(pick(flat, ['signatureMechanic', 'mechanic'])),
    bossTitle: asText(pick(flat, role === 'creative'
      ? ['bossTitle', 'epithet', 'title']
      : ['bossTitle', 'epithet'])),
    entrance: asText(pick(flat, ['entranceConcept', 'entrance'])),
    lore: asText(pick(flat, ['loreSummary', 'lore', 'summary', 'backstory', 'hook'])),
    element: asText(pick(flat, ['element', 'attribute', 'elementAttribute'])),
    archetype: asText(pick(flat, ['combatArchetype', 'archetype'])),
    weakness: asText(pick(flat, ['weaknessConcept', 'weakness'])),
    facts: asList(pick(flat, ['facts', 'fact', 'researchFacts'])),
    archetypeTags: asList(pick(flat, ['archetypeTags', 'tags'])),
    sources: withLooseUrl(
      sourceList(pick(flat, ['sources', 'source', 'citations', 'urls'])),
      flat,
    ),
    protectedName: asBool(pick(flat, ['protectedName', 'protected'])),
    publicDomain: asBool(pick(flat, ['publicDomain', 'publicDomainStatus', 'publicDomainTradition'])),
    confidence: asText(pick(flat, ['confidence', 'researchConfidence'])),
    selfReportedRisk: asText(pick(flat, ['ipSimilarityRisk', 'ipRisk', 'risk'])).toLowerCase(),
    parodyPotential: asText(pick(flat, ['parodyPotential'])),
    parseError: '',
  };
}

/**
 * @param {{ agent: string, role: string, ref: string, sha: string, path: string, index: number }} meta
 */
function emptyRecord(meta) {
  return {
    agent: meta.agent,
    role: meta.role,
    kind: 'unknown',
    ref: meta.ref,
    sha: meta.sha,
    path: meta.path,
    index: meta.index,
    id: `${meta.agent}-bad-${meta.index + 1}`,
    parodyName: '',
    thaiName: '',
    originalName: '',
    origin: '',
    category: '',
    creatureType: '',
    visualIdentity: '',
    artworkPrompt: '',
    silhouette: '',
    comedyConcept: '',
    personality: '',
    signatureTrait: '',
    ability: '',
    mechanic: '',
    bossTitle: '',
    entrance: '',
    lore: '',
    element: '',
    archetype: '',
    weakness: '',
    facts: [],
    archetypeTags: [],
    sources: [],
    protectedName: undefined,
    publicDomain: undefined,
    confidence: '',
    selfReportedRisk: '',
    parodyPotential: '',
    parseError: '',
  };
}

/**
 * @param {string} text
 * @param {{ agent: string, role: string, ref: string, sha: string, path: string }} meta
 */
export function recordsFromText(text, meta) {
  const ext = extensionOf(meta.path);
  if (ext === '.md' || ext === '.txt') return recordsFromMarkdown(text, meta);
  if (ext === '.csv') return recordsFromCsv(text, meta);
  return recordsFromJson(text, meta);
}

/**
 * @param {string} text
 * @param {{ agent: string, role: string, ref: string, sha: string, path: string }} meta
 */
function recordsFromJson(text, meta) {
  const cleaned = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  let json;
  try {
    json = JSON.parse(cleaned);
  } catch (error) {
    const record = emptyRecord({ ...meta, index: 0 });
    record.parseError = `invalid JSON: ${error instanceof Error ? error.message : 'parse error'}`;
    record.kind = 'parse-error';
    return [record];
  }
  const fileRole = json && typeof json === 'object' && !Array.isArray(json)
    ? asText(pick(json, ['role', 'agentRole'])) : '';
  const fileAgent = json && typeof json === 'object' && !Array.isArray(json)
    ? asText(pick(json, ['agent'])) : '';
  const agentId = meta.lockAgent ? meta.agent : (fileAgent || meta.agent);
  const conflicts = conflictRecords(json, { ...meta, agent: agentId });
  const rows = unwrapRecords(json);
  if (rows.length === 0) {
    if (conflicts.length > 0) return conflicts;
    const note = emptyRecord({ ...meta, index: 0 });
    note.kind = 'empty-json';
    note.role = meta.role;
    note.id = `${meta.agent}-empty-${String(meta.path || 'json').split('/').pop()}`;
    note.parseError = '';
    return [note];
  }
  const records = rows.map((row, index) => normalizeRecord(row, {
    ...meta,
    agent: agentId,
    role: fileRole || meta.role,
    index,
  }));
  return [...records, ...conflicts];
}

/**
 * Open and resolved lore conflicts sit beside the entry list. They are notes, not monsters.
 * @param {unknown} json
 * @param {{ agent: string, role: string, ref: string, sha: string, path: string }} meta
 */
function conflictRecords(json, meta) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return [];
  const rows = /** @type {Record<string, unknown>} */ (json).conflicts;
  if (!Array.isArray(rows)) return [];
  return rows.filter((item) => item && typeof item === 'object' && !Array.isArray(item)).map((item, index) => {
    const row = /** @type {Record<string, unknown>} */ (item);
    const record = emptyRecord({ ...meta, index: 1000 + index });
    record.kind = 'lore-conflict';
    record.role = 'lore';
    record.id = asText(row.conflictId) || `${meta.agent}-conflict-${index + 1}`;
    record.lore = [asText(row.theirClaim), asText(row.lorePosition), asText(row.resolution)].filter(Boolean).join(' ');
    record.confidence = asText(row.status);
    record.category = asText(row.severity);
    record.origin = asText(row.canonImpact);
    return record;
  });
}

/**
 * @param {string} text
 * @param {{ agent: string, role: string, ref: string, sha: string, path: string }} meta
 */
/**
 * Keep parentheses that belong to the URL, and drop a markdown wrapper's extra closer.
 * @param {string} value
 */
function trimUrl(value) {
  let url = String(value || '');
  let previous = '';
  while (url && url !== previous) {
    previous = url;
    url = url.replace(/[.,;:'"`>]+$/g, '');
    const open = (url.match(/\(/g) || []).length;
    const close = (url.match(/\)/g) || []).length;
    if (url.endsWith(')') && close > open) url = url.slice(0, -1);
  }
  return url;
}

function recordsFromMarkdown(text, meta) {
  /** @type {ReturnType<typeof emptyRecord>[]} */
  const records = [];
  const fence = /```json\s*([\s\S]*?)```/gi;
  let match;
  let index = 0;
  while ((match = fence.exec(text))) {
    const body = match[1].trim();
    if (!body.startsWith('{') && !body.startsWith('[')) continue;
    records.push(...recordsFromJson(body, { ...meta, path: `${meta.path}#json-${index + 1}` })
      .map((record) => ({ ...record, index })));
    index += 1;
  }
  const prose = text.replace(/```[\s\S]*?```/g, ' ');
  const urlRe = /https?:\/\/[^\s<>\]"'`]+/g;
  const seen = new Set();
  while ((match = urlRe.exec(prose))) {
    const url = trimUrl(match[0]);
    if (seen.has(url)) continue;
    seen.add(url);
    const start = Math.max(0, match.index - 220);
    const end = Math.min(prose.length, match.index + url.length + 220);
    const around = prose.slice(start, end).replace(/\s+/g, ' ');
    const record = emptyRecord({ ...meta, index });
    record.kind = 'citation';
    record.role = 'research';
    record.looseContext = true;
    record.id = `${meta.agent}-md-${index + 1}`;
    record.sources = [{ url, title: '', supports: around, accessed: '' }];
    records.push(record);
    index += 1;
  }
  return records;
}

/**
 * Minimal CSV reader. Quoted commas are kept. Embedded newlines are not.
 * @param {string} text
 * @param {{ agent: string, role: string, ref: string, sha: string, path: string }} meta
 */
function recordsFromCsv(text, meta) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((cell) => cell.trim());
  return lines.slice(1).map((line, index) => {
    const cells = splitCsvLine(line);
    /** @type {Record<string, string>} */
    const row = {};
    headers.forEach((header, cellIndex) => {
      row[header] = cells[cellIndex] ?? '';
    });
    return normalizeRecord(row, { ...meta, index });
  });
}

/**
 * @param {string} line
 */
function splitCsvLine(line) {
  /** @type {string[]} */
  const cells = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const ch = line[index];
    if (quoted && ch === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === ',' && !quoted) {
      cells.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells;
}

/**
 * @param {typeof AGENTS[number]} agent
 * @param {{ ref: string, sha: string }} resolved
 */
export function loadAgent(agent, resolved) {
  if (!resolved.sha) {
    return {
      id: agent.id,
      branch: agent.branch,
      role: agent.role,
      prefix: agent.prefix,
      present: false,
      ref: resolved.ref,
      sha: null,
      files: [],
      records: [],
      error: '',
    };
  }
  let files = [];
  try {
    files = listFiles(resolved.ref, agent.prefix).filter((file) => TEXT_EXT.has(extensionOf(file)));
  } catch (error) {
    return {
      id: agent.id,
      branch: agent.branch,
      role: agent.role,
      prefix: agent.prefix,
      present: true,
      ref: resolved.ref,
      sha: resolved.sha,
      files: [],
      records: [],
      error: error instanceof Error ? error.message : 'ls-tree failed',
    };
  }
  /** @type {ReturnType<typeof emptyRecord>[]} */
  const records = [];
  const errors = [];
  for (const file of files) {
    if (file.endsWith('BRIEF.md')) continue;
    try {
      const text = showFile(resolved.ref, file);
      records.push(...recordsFromText(text, {
        agent: agent.id,
        role: agent.role,
        ref: resolved.ref,
        sha: resolved.sha,
        path: file,
        lockAgent: true,
      }));
    } catch (error) {
      errors.push(`${file}: ${error instanceof Error ? error.message : 'unreadable'}`);
    }
  }
  return {
    id: agent.id,
    branch: agent.branch,
    role: agent.role,
    prefix: agent.prefix,
    present: true,
    ref: resolved.ref,
    sha: resolved.sha,
    files,
    records,
    error: errors.join('; '),
  };
}

/**
 * @param {string} filePath
 * @param {string} [agent]
 * @param {string} [role]
 */
export function loadInputFile(filePath, agent = 'input', role = 'sources') {
  const text = readFileSync(filePath, 'utf8');
  const records = recordsFromText(text, {
    agent,
    role,
    ref: 'input',
    sha: '',
    path: filePath,
  });
  return {
    id: records[0]?.agent || agent,
    branch: '',
    role,
    prefix: filePath,
    present: true,
    ref: 'input',
    sha: '',
    files: [filePath],
    records,
    error: '',
  };
}

/**
 * Source claims the URL checker can fetch.
 * @param {ReturnType<typeof emptyRecord>} record
 */
export function claimsFromRecord(record) {
  if (record.parseError || record.sources.length === 0) return [];
  const requireName = record.kind === 'inspiration';
  return record.sources.map((source, index) => ({
    agent: record.agent,
    recordId: record.id,
    path: record.path,
    ref: record.ref,
    sha: record.sha,
    kind: record.kind,
    looseContext: record.looseContext === true,
    url: source.url,
    claimedTitle: source.title,
    supports: source.supports,
    facts: record.facts,
    name: record.originalName || record.parodyName,
    requireName,
    accessed: source.accessed,
    claimIndex: index,
  }));
}
