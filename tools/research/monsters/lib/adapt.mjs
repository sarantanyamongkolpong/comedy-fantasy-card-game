/**
 * Adapts agent files into canonical monster records.
 *
 * research/m06-parody (watched 2026-11-20) writes entries that already split
 * research and creative, but uses M06-N-001 ids, "Normal Monster" categories,
 * parodyNameEn / thaiName, an element object, a towerEnvironment object, and
 * originId instead of the brief's affiliation string. Those are rewritten
 * onto the canonical record. research/m07-boss was not on origin.
 * Unmapped keys are dropped and reported.
 */

import {
  AFFILIATIONS,
  BOSS_CATEGORIES,
  CONFIDENCE,
  FACTIONS,
  GACHA_POOLS,
  HUMOR_TYPES,
  INSPIRATION_KINDS,
  IP_RISKS,
  RARITIES,
  ROLES,
  STATUSES,
} from './constants.mjs';

const FORBIDDEN_KEY = /^(hp|maxhp|hpmax|atk|def|spd|pow|damage|dmg|attack|defense|speed|crit|critrate|accuracy|evasion|armor|exp|xp|weight|weights|rate|rates|pity|droprate|baseatk|basedef|basespd)$/i;

const LIST_KEYS = ['records', 'entries', 'monsters', 'bosses', 'pitches', 'samples'];
const RESERVED_ARRAYS = new Set([
  ...LIST_KEYS,
  'inspirations',
  'links',
  'lore',
  'reviews',
  'qa',
  'audits',
  'results',
  'sources',
  'facts',
  'archetypeTags',
  'errors',
  'warnings',
  'notes',
]);
const WRAPPER_META = new Set([
  'schemaVersion',
  'contentTier',
  'agent',
  'kind',
  'note',
  'notes',
  'warning',
  'description',
  'title',
  'generatedAt',
  'comment',
  'comments',
  'documentId',
  'status',
  'canon',
  'scope',
  'counts',
  'loreAlignment',
  'sourcesRead',
  'recheck',
  'selfVerified',
  'selfVerifiedFile',
  'schemaNote',
  'spread',
  'accessed',
  'framework',
  'expectedSample',
  'watches',
  'crosswalkStatus',
  'unmappedEnvironments',
  'environmentCrosswalk',
  'elementCrosswalk',
  'conflicts',
]);

/** Agent 06/08 origin ids. These are not faction ids. */
const ORIGIN_AFFILIATION = Object.freeze({
  'ORG-WILD': 'Wild Creature',
  'ORG-ECHO': 'Corrupted Echo',
  'ORG-GUARD': 'Tower Guardian',
  'ORG-ANOM': 'Tower Anomaly',
});

/** M06-N-001 style ids. The letter is the category, the number is the sequence. */
const AGENT_ID_PREFIX = Object.freeze({
  N: 'NRM',
  E: 'ELT',
  EL: 'ELT',
  M: 'MNB',
  MN: 'MNB',
  MB: 'MNB',
  MNB: 'MNB',
  B: 'MJB',
  MJ: 'MJB',
  MJB: 'MJB',
  W: 'WLB',
  WB: 'WLB',
  WLB: 'WLB',
  S: 'SCB',
  SC: 'SCB',
  SCB: 'SCB',
});

const CATEGORY_ALIASES = new Map([
  ['normal', 'Normal'],
  ['normal monster', 'Normal'],
  ['normals', 'Normal'],
  ['elite', 'Elite'],
  ['elite monster', 'Elite'],
  ['elites', 'Elite'],
  ['mini boss', 'Mini Boss'],
  ['mini bosses', 'Mini Boss'],
  ['miniboss', 'Mini Boss'],
  ['main boss', 'Main Boss'],
  ['main bosses', 'Main Boss'],
  ['mainboss', 'Main Boss'],
  ['world boss', 'World Boss'],
  ['world bosses', 'World Boss'],
  ['worldboss', 'World Boss'],
  ['secret boss', 'Secret Boss'],
  ['secret bosses', 'Secret Boss'],
  ['secret', 'Secret Boss'],
  ['secret comedy boss', 'Secret Boss'],
  ['comedy boss', 'Secret Boss'],
]);

const FIELD_ALIASES = {
  monsterId: ['monsterId', 'monster_id', 'Monster ID'],
  category: ['category', 'monsterCategory', 'monster_category', 'Monster Category'],
  nameEn: ['nameEn', 'parodyName', 'parodyNameEn', 'parody_name', 'Parody Name (EN)', 'Parody Name', 'name'],
  nameTh: ['nameTh', 'thaiName', 'parodyNameTh', 'thai_name', 'Thai name', 'Thai Name'],
  originalInspiration: ['originalInspiration', 'inspiration', 'inspirationName', 'originalSource', 'Original Inspiration/Source', 'Original Inspiration'],
  sourceUrl: ['sourceUrl', 'source_url', 'Source URL'],
  creatureType: ['creatureType', 'creature_type', 'Creature Type'],
  visualIdentity: ['visualIdentity', 'visual', 'Visual Identity'],
  personality: ['personality', 'Personality'],
  signatureTrait: ['signatureTrait', 'trait', 'Signature Trait'],
  comedyConcept: ['comedyConcept', 'comedy', 'Comedy Concept'],
  element: ['element', 'attribute', 'Element/Attribute', 'Element'],
  combatArchetype: ['combatArchetype', 'archetype', 'Combat Archetype'],
  signatureAbilityConcept: ['signatureAbilityConcept', 'abilityConcept', 'Signature Ability Concept'],
  weaknessConcept: ['weaknessConcept', 'weakness', 'Weakness Concept'],
  loreSummary: ['loreSummary', 'lore', 'Lore Summary'],
  factionAffiliation: ['factionAffiliation', 'faction', 'Faction Affiliation', 'Faction Affiliation (optional)'],
  suggestedRarity: ['suggestedRarity', 'rarity', 'Suggested Rarity'],
  suggestedTowerEnvironment: ['suggestedTowerEnvironment', 'towerEnvironment', 'environment', 'Suggested Tower Environment'],
  artworkPromptConcept: ['artworkPromptConcept', 'artPrompt', 'artworkPrompt', 'Artwork Prompt Concept'],
  ipRisk: ['ipRisk', 'ipSimilarityRisk', 'ip_risk', 'IP Similarity Risk'],
  confidence: ['confidence', 'researchConfidence', 'Research Confidence'],
  status: ['status', 'Status'],
  humorType: ['humorType', 'humor', 'Humor Type'],
  inspirationId: ['inspirationId', 'inspiration_id', 'Inspiration ID'],
  facts: ['facts', 'researchFacts'],
  sources: ['sources'],
  protectedName: ['protectedName', 'protected_name', 'Protected Name'],
  publicDomain: ['publicDomain', 'public_domain', 'Public Domain'],
  origin: ['origin', 'Origin'],
  kind: ['inspirationKind', 'kind'],
  archetypeTags: ['archetypeTags', 'tags'],
  bossTitle: ['bossTitle', 'Boss Title'],
  entranceConcept: ['entranceConcept', 'Entrance Concept'],
  signatureSilhouette: ['signatureSilhouette', 'Signature Silhouette', 'silhouette'],
  personalityMotivation: ['personalityMotivation', 'Personality/Motivation', 'bossPersonality'],
  signatureMechanic: ['signatureMechanic', 'Signature Mechanic', 'mechanic'],
  phaseTransformationConcept: ['phaseTransformationConcept', 'Phase Transformation Concept'],
  defeatAnimationConcept: ['defeatAnimationConcept', 'Defeat Animation Concept'],
  uniqueLootTheme: ['uniqueLootTheme', 'Unique Loot Theme', 'lootTheme'],
  enemyId: ['enemyId', 'enemy_id'],
  cardId: ['cardId', 'card_id'],
  role: ['role', 'battleRole'],
  factionId: ['factionId', 'faction_id'],
  gachaPool: ['gachaPool', 'pool'],
  hookRarity: ['hookRarity', 'Hook rarity'],
};

const BOSS_FIELDS = [
  'bossTitle',
  'entranceConcept',
  'signatureSilhouette',
  'personalityMotivation',
  'signatureMechanic',
  'phaseTransformationConcept',
  'defeatAnimationConcept',
  'uniqueLootTheme',
];

const CREATIVE_SIGNAL = [
  'creative',
  'comedyConcept',
  'creatureType',
  'visualIdentity',
  'signatureTrait',
  'Comedy Concept',
  'Creature Type',
  'parodyName',
  'parodyNameEn',
  'Parody Name (EN)',
  'signatureAbilityConcept',
];

const IGNORED_ROW_KEYS = new Set([
  'agent',
  'agentCreated',
  'pitchId',
  'note',
  'notes',
  'parodyPotential',
  'schemaVersion',
  'contentTier',
  'comment',
  'comments',
  'description',
  'title',
  'warning',
]);

/**
 * @param {unknown} json
 * @param {string} source
 */
export function adaptDocument(json, source) {
  const split = splitPayload(json);
  const records = [];
  split.rows.forEach((entry, index) => {
    records.push(adaptRow(entry.row, { source, index, category: entry.category }));
  });
  return {
    records,
    lore: split.lore.map((row, index) => adaptLore(row, source, index)),
    qa: split.qa.map((row, index) => adaptQa(row, source, index)),
    inspirations: split.inspirations.map((row) => cleanInspiration(row)).filter(Boolean),
    warnings: split.warnings,
    errors: split.errors,
    emptyLoreDocument: Boolean(split.emptyLoreDocument),
  };
}

/**
 * @param {unknown} json
 */
export function splitPayload(json) {
  const out = {
    rows: /** @type {{ row: object, category: string | null }[]} */ ([]),
    lore: /** @type {object[]} */ ([]),
    qa: /** @type {object[]} */ ([]),
    inspirations: /** @type {object[]} */ ([]),
    warnings: /** @type {object[]} */ ([]),
    errors: /** @type {object[]} */ ([]),
    emptyLoreDocument: false,
  };
  if (Array.isArray(json)) {
    classifyArray(json, out);
    return out;
  }
  if (!isPlainObject(json)) {
    out.errors.push(bare('error', 'PARSE', '/', 'JSON root must be an object or an array'));
    return out;
  }

  if (Array.isArray(json.inspirations)) out.inspirations.push(...json.inspirations.filter(isPlainObject));
  for (const key of ['links', 'lore']) {
    if (Array.isArray(json[key])) out.lore.push(...json[key].filter(isPlainObject));
  }
  // Agent 08 lore document with an entries list of links (Phase-1 integration).
  if (isLoreDocument(json) && Array.isArray(json.entries) && json.entries.length > 0 && json.entries.every(isLoreLink)) {
    out.lore.push(...json.entries);
    return out;
  }
  for (const key of ['reviews', 'qa', 'audits']) {
    if (Array.isArray(json[key])) out.qa.push(...json[key].filter(isPlainObject));
  }
  if (Array.isArray(json.results) && json.results.length > 0 && json.results.every(isQaReview)) {
    out.qa.push(...json.results);
  }

  let foundList = false;
  for (const key of LIST_KEYS) {
    if (!Array.isArray(json[key])) continue;
    foundList = true;
    for (const row of json[key]) {
      if (isPlainObject(row)) out.rows.push({ row, category: null });
    }
  }
  for (const [key, value] of Object.entries(json)) {
    if (!Array.isArray(value) || RESERVED_ARRAYS.has(key)) continue;
    const category = normalizeCategory(key);
    if (typeof category === 'string' && CATEGORY_ALIASES.has(categoryKey(key)) && value.every(isPlainObject)) {
      foundList = true;
      for (const row of value) out.rows.push({ row, category });
    }
  }

  if (!foundList && looksLikeMonster(json)) {
    out.rows.push({ row: json, category: null });
    return out;
  }

  if (!foundList && out.lore.length === 0 && out.qa.length === 0 && out.inspirations.length === 0 && isLoreLink(json)) {
    out.lore.push(json);
    return out;
  }
  if (!foundList && out.lore.length === 0 && out.qa.length === 0 && out.inspirations.length === 0 && isQaReview(json)) {
    out.qa.push(json);
    return out;
  }
  if (!foundList && out.rows.length === 0 && out.lore.length === 0 && out.qa.length === 0 && isInspiration(json)) {
    out.inspirations.push(json);
    return out;
  }

  if (isLoreDocument(json)) {
    if (out.rows.length > 0 && out.rows.every((entry) => isLoreLink(entry.row))) {
      for (const entry of out.rows) out.lore.push(entry.row);
      out.rows = [];
    }
    if (out.rows.length === 0 && out.lore.length === 0) out.emptyLoreDocument = true;
  }

  const consumed = new Set([
    ...WRAPPER_META,
    ...RESERVED_ARRAYS,
  ]);
  for (const key of Object.keys(json)) {
    if (consumed.has(key)) continue;
    if (Array.isArray(json[key]) && CATEGORY_ALIASES.has(categoryKey(key))) continue;
    if (foundList || out.lore.length || out.qa.length || out.inspirations.length) {
      out.warnings.push(bare('warning', 'UNKNOWN_FIELD', key, `Unrecognized wrapper field "${key}" was ignored.`));
    }
  }
  if (!out.emptyLoreDocument && out.rows.length === 0 && out.lore.length === 0 && out.qa.length === 0 && out.inspirations.length === 0) {
    out.errors.push(bare('error', 'UNRECOGNIZED_FILE', '/', 'File is not a monster list, lore link list, QA review list, or inspiration list.'));
  }
  return out;
}

/**
 * @param {object} row
 * @param {{ source: string, index: number, category: string | null }} where
 */
export function adaptRow(row, where) {
  const bag = { warnings: /** @type {object[]} */ ([]), errors: /** @type {object[]} */ ([]) };
  if (isCanonical(row) && needsRewrite(row)) {
    scanRaw(row, where, bag);
    const record = rewriteAgentRecord(row, bag, where);
    if (where.category && record.category == null) record.category = where.category;
    return { record, source: where.source, index: where.index, warnings: bag.warnings, errors: bag.errors };
  }

  if (isCanonical(row)) {
    const record = structuredClone(row);
    if (where.category && record.category == null) record.category = where.category;
    if (typeof record.category === 'string') record.category = normalizeCategory(record.category);
    return { record, source: where.source, index: where.index, warnings: bag.warnings, errors: bag.errors };
  }

  scanRaw(row, where, bag);
  const used = new Set();
  const keyIndex = indexKeys(row);
  const take = (field) => pick(row, keyIndex, FIELD_ALIASES[field], used);

  const record = {};
  const monsterId = firstString(take('monsterId'), monsterIdFromPitch(row));
  assign(record, 'monsterId', monsterId);
  if (row.pitchId != null) used.add(actualKey(row, keyIndex, 'pitchId'));

  const category = normalizeCategory(take('category') ?? where.category);
  assign(record, 'category', category);
  assign(record, 'status', normalizeStatus(take('status')));
  assign(record, 'ipRisk', normalizeIp(take('ipRisk')));

  const research = {};
  if (isPlainObject(row.research)) {
    used.add(actualKey(row, keyIndex, 'research'));
    copyKnown(research, row.research, [
      'inspirationId', 'originalInspiration', 'origin', 'kind', 'facts', 'sources',
      'sourceUrl', 'protectedName', 'publicDomain', 'confidence', 'archetypeTags',
    ]);
  }
  assign(research, 'inspirationId', take('inspirationId') ?? research.inspirationId);
  if (research.inspirationId == null && Array.isArray(row.inspiredByInspirationIds)) {
    used.add(actualKey(row, keyIndex, 'inspiredByInspirationIds'));
    const ids = row.inspiredByInspirationIds.filter((item) => typeof item === 'string' && item.trim() !== '');
    if (ids.length > 0) research.inspirationId = ids[0];
    if (ids.length > 1) {
      bag.warnings.push(bare(
        'warning',
        'EXTRA_INSPIRATIONS',
        `${where.source}[${where.index}].inspiredByInspirationIds`,
        `Only ${ids[0]} is stored on research.inspirationId. Also listed: ${ids.slice(1).join(', ')}.`,
        record.monsterId ?? null,
      ));
    }
  }
  assign(research, 'originalInspiration', take('originalInspiration') ?? research.originalInspiration);
  assign(research, 'origin', take('origin') ?? research.origin);
  const kind = take('kind');
  if (typeof kind === 'string' && INSPIRATION_KINDS.includes(kind)) assign(research, 'kind', kind);
  if (research.kind != null && !INSPIRATION_KINDS.includes(research.kind)) delete research.kind;
  const facts = asFacts(take('facts') ?? research.facts);
  if (facts) research.facts = facts;
  const sources = asSources(take('sources') ?? research.sources);
  if (sources) research.sources = sources;
  assign(research, 'sourceUrl', take('sourceUrl') ?? research.sourceUrl);
  const protectedName = asBool(take('protectedName') ?? research.protectedName);
  if (typeof protectedName === 'boolean') research.protectedName = protectedName;
  const publicDomain = asBool(take('publicDomain') ?? research.publicDomain);
  if (typeof publicDomain === 'boolean') research.publicDomain = publicDomain;
  const confidence = normalizeConfidence(take('confidence') ?? research.confidence);
  assign(research, 'confidence', confidence);
  const tags = asTags(take('archetypeTags') ?? research.archetypeTags);
  if (tags) research.archetypeTags = tags;
  record.research = research;

  const creative = {};
  const creativeFields = [
    'nameEn', 'nameTh', 'creatureType', 'visualIdentity', 'personality', 'signatureTrait',
    'comedyConcept', 'element', 'combatArchetype', 'signatureAbilityConcept', 'weaknessConcept',
    'loreSummary', 'artworkPromptConcept', 'suggestedTowerEnvironment', 'humorType',
    'factionAffiliation', 'suggestedRarity',
  ];
  if (isPlainObject(row.creative)) {
    used.add(actualKey(row, keyIndex, 'creative'));
    for (const key of creativeFields) {
      if (row.creative[key] !== undefined) creative[key] = row.creative[key];
    }
  }
  for (const field of creativeFields) {
    if (field === 'humorType' || field === 'factionAffiliation' || field === 'suggestedRarity') continue;
    const value = take(field);
    if (typeof value === 'string') creative[field] = value;
  }
  const humor = normalizeHumor(take('humorType') ?? creative.humorType);
  assign(creative, 'humorType', humor);
  const affiliation = take('factionAffiliation');
  if (affiliation !== undefined) creative.factionAffiliation = normalizeAffiliation(affiliation);
  else if (Object.hasOwn(creative, 'factionAffiliation')) creative.factionAffiliation = normalizeAffiliation(creative.factionAffiliation);
  const rarity = take('suggestedRarity');
  if (rarity !== undefined) creative.suggestedRarity = normalizeRarity(rarity);
  else if (Object.hasOwn(creative, 'suggestedRarity')) creative.suggestedRarity = normalizeRarity(creative.suggestedRarity);
  record.creative = creative;

  const boss = {};
  if (isPlainObject(row.boss)) {
    used.add(actualKey(row, keyIndex, 'boss'));
    for (const field of BOSS_FIELDS) {
      if (row.boss[field] != null) boss[field] = row.boss[field];
      const labelled = labelledBoss(row.boss, field);
      if (labelled != null) boss[field] = labelled;
    }
  }
  for (const field of BOSS_FIELDS) {
    const value = take(field);
    if (typeof value === 'string') boss[field] = value;
  }
  const bossCategory = typeof record.category === 'string' && BOSS_CATEGORIES.includes(record.category);
  if (Object.keys(boss).length > 0) record.boss = boss;
  else if (!bossCategory) record.boss = null;

  const hooks = {};
  if (isPlainObject(row.hooks)) {
    used.add(actualKey(row, keyIndex, 'hooks'));
    Object.assign(hooks, row.hooks);
  }
  const enemyId = take('enemyId');
  if (enemyId != null && enemyId !== '') hooks.enemyId = enemyId;
  const cardId = take('cardId');
  if (cardId != null && cardId !== '') hooks.cardId = cardId;
  const rawRole = take('role');
  const role = normalizeRole(rawRole);
  if (role) hooks.role = role;
  else if (typeof rawRole === 'string' && rawRole.trim() !== '') {
    if (typeof creative.combatArchetype !== 'string') creative.combatArchetype = rawRole.trim();
    else {
      bag.warnings.push(bare(
        'warning',
        'UNKNOWN_FIELD',
        `${where.source}[${where.index}].role`,
        `role "${rawRole}" is not Tank, DPS, Magic, or Support, so it was not copied onto hooks.role.`,
        record.monsterId ?? null,
      ));
    }
  }
  const factionId = take('factionId');
  if (typeof factionId === 'string' && factionId !== '') hooks.factionId = factionId;
  else if (factionId === null || factionId === '') hooks.factionId = null;
  const pool = take('gachaPool');
  if (pool != null && pool !== '') hooks.gachaPool = normalizePool(pool);
  const hookRarity = take('hookRarity');
  if (hookRarity != null && hookRarity !== '') hooks.rarity = normalizeRarity(hookRarity);
  else if (hooks.rarity != null) hooks.rarity = normalizeRarity(hooks.rarity);
  for (const key of ['enemyId', 'cardId', 'factionId', 'gachaPool']) {
    if (hooks[key] === '') hooks[key] = null;
  }
  if (Object.keys(hooks).length > 0) record.hooks = hooks;

  for (const key of Object.keys(row)) {
    if (used.has(key) || IGNORED_ROW_KEYS.has(key)) continue;
    if (FORBIDDEN_KEY.test(key)) continue;
    bag.warnings.push(bare(
      'warning',
      'UNKNOWN_FIELD',
      `${where.source}[${where.index}].${key}`,
      `Unmapped field "${key}" was ignored. Add an alias in adapt.mjs if agents 06–10 emit it.`,
      record.monsterId ?? null,
    ));
  }

  return { record, source: where.source, index: where.index, warnings: bag.warnings, errors: bag.errors };
}

/**
 * @param {object} row
 * @param {string} source
 * @param {number} index
 */
export function adaptLore(row, source, index) {
  const monsterId = canonicalMonsterId(firstString(row.monsterId, row['Monster ID'], row.id));
  const nameEn = firstString(row.nameEn, row.parodyNameEn, row['Parody Name (EN)'], row.name);
  const link = {
    monsterId: typeof monsterId === 'string' ? monsterId : null,
    nameEn: nameEn ?? null,
    source,
    index,
  };
  if (Object.hasOwn(row, 'factionAffiliation') || Object.hasOwn(row, 'faction') || Object.hasOwn(row, 'Faction Affiliation')) {
    link.factionAffiliation = affiliationFrom({
      factionAffiliation: row.factionAffiliation ?? row.faction ?? row['Faction Affiliation'],
      originId: row.originId,
      originName: row.originName,
    });
  } else if (row.originId || row.originName || row.factionId) {
    link.factionAffiliation = affiliationFrom({
      factionAffiliation: row.factionId ?? null,
      originId: row.originId,
      originName: row.originName,
    });
  }
  const lore = row.loreSummary ?? row.lore ?? row.hook ?? row.loreHook ?? row['Lore Summary'];
  if (typeof lore === 'string') link.loreSummary = lore;
  const environment = row.suggestedTowerEnvironment ?? row.towerEnvironment ?? row.environment ?? row['Suggested Tower Environment']
    ?? (row.environmentId ? [row.environmentId, row.environmentName].filter(Boolean).join(' ') : undefined);
  const place = flattenPlace(environment);
  if (typeof place === 'string') link.suggestedTowerEnvironment = place;
  if (row.status != null && normalizeStatus(row.status) !== 'PROPOSED') link.ignoredStatus = row.status;
  return link;
}

/**
 * M06-N-001 becomes MON-NRM-0001. Canonical ids pass through.
 * An unrecognized id is returned unchanged so the schema can reject it.
 *
 * @param {unknown} value
 */
export function canonicalMonsterId(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (/^MON-(NRM|ELT|MNB|MJB|WLB|SCB)-[0-9]{4}$/.test(trimmed)) return trimmed;
  // Agent 07 boss ids (BOS-MIN-01 etc.). Added at Phase-1 integration by Mira.
  const boss = trimmed.match(/^BOS-(MIN|MAIN|WORLD|SECRET)-(\d{1,4})$/);
  if (boss) {
    const bossPrefix = { MIN: 'MNB', MAIN: 'MJB', WORLD: 'WLB', SECRET: 'SCB' }[boss[1]];
    return `MON-${bossPrefix}-${boss[2].padStart(4, '0')}`;
  }
  const match = trimmed.match(/^M\d{2}-([A-Z]{1,3})-(\d{1,4})$/);
  if (!match) return trimmed;
  const prefix = AGENT_ID_PREFIX[match[1]];
  if (!prefix) return trimmed;
  const number = match[2].padStart(4, '0');
  if (number.length !== 4) return trimmed;
  return `MON-${prefix}-${number}`;
}

/**
 * @param {object} row
 * @param {string} source
 * @param {number} index
 */
export function adaptQa(row, source, index) {
  return {
    monsterId: firstString(row.monsterId, row['Monster ID'], row.id) ?? null,
    nameEn: firstString(row.nameEn, row.parodyNameEn, row['Parody Name (EN)']) ?? null,
    status: row.status != null ? normalizeStatus(row.status) : undefined,
    ipRisk: row.ipRisk != null || row.ipSimilarityRisk != null ? normalizeIp(row.ipRisk ?? row.ipSimilarityRisk) : undefined,
    confidence: row.confidence != null || row.researchConfidence != null
      ? normalizeConfidence(row.confidence ?? row.researchConfidence)
      : undefined,
    notes: typeof row.notes === 'string' ? row.notes : (typeof row.note === 'string' ? row.note : undefined),
    source,
    index,
  };
}

/**
 * @param {object} row
 */
export function cleanInspiration(row) {
  if (!isPlainObject(row)) return null;
  const inspiration = {};
  assign(inspiration, 'inspirationId', typeof row.inspirationId === 'string' ? row.inspirationId : undefined);
  assign(inspiration, 'name', typeof row.name === 'string' ? row.name : undefined);
  assign(inspiration, 'origin', typeof row.origin === 'string' ? row.origin : undefined);
  if (typeof row.kind === 'string' && INSPIRATION_KINDS.includes(row.kind)) inspiration.kind = row.kind;
  if (Array.isArray(row.facts)) inspiration.facts = row.facts.filter((fact) => typeof fact === 'string');
  if (Array.isArray(row.sources)) inspiration.sources = row.sources.filter(isPlainObject).map(cleanSource);
  if (typeof row.protectedName === 'boolean' || typeof row.protectedName === 'string') {
    const value = asBool(row.protectedName);
    if (typeof value === 'boolean') inspiration.protectedName = value;
  }
  if (typeof row.publicDomain === 'boolean' || typeof row.publicDomain === 'string') {
    const value = asBool(row.publicDomain);
    if (typeof value === 'boolean') inspiration.publicDomain = value;
  }
  const confidence = normalizeConfidence(row.confidence);
  assign(inspiration, 'confidence', confidence);
  if (Array.isArray(row.archetypeTags)) inspiration.archetypeTags = row.archetypeTags.filter((tag) => typeof tag === 'string');
  return inspiration;
}

/** @param {unknown} value */
export function normalizeCategory(value) {
  if (typeof value !== 'string') return value ?? undefined;
  const key = categoryKey(value);
  return CATEGORY_ALIASES.get(key) ?? value.trim();
}

/** @param {unknown} value */
export function normalizeStatus(value) {
  if (typeof value !== 'string') return value ?? undefined;
  const key = value.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (key === 'QAPASSED') return 'QA_PASSED';
  if (STATUSES.includes(key) || key === 'LOCKED' || key === 'OWNER_APPROVED') return key;
  return value.trim();
}

/** @param {unknown} value */
export function normalizeIp(value) {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'string') return value;
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (IP_RISKS.includes(key)) return key;
  if (key === 'med') return 'medium';
  if (['reject', 'do_not_use', 'donotuse', 'blocked'].includes(key)) return 'blocked';
  return value.trim();
}

/** @param {unknown} value */
export function normalizeConfidence(value) {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'string') return value;
  const key = value.trim().toLowerCase();
  if (key === 'med') return 'medium';
  if (CONFIDENCE.includes(key)) return key;
  return value.trim();
}

/** @param {unknown} value */
export function normalizeRarity(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return value;
  const key = value.trim();
  if (key === 'n' || key === 'N') return 'N';
  if (key === 'r' || key === 'R') return 'R';
  if (key.toLowerCase() === 'epic') return 'Epic';
  if (key.toLowerCase() === 'ex') return 'EX';
  if (RARITIES.includes(key)) return key;
  return key;
}

/** @param {unknown} value */
export function normalizeAffiliation(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return value;
  const key = value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (['none', 'unaffiliated', 'null'].includes(key)) return null;
  const named = AFFILIATIONS.find((name) => name.toLowerCase() === key);
  if (named) return named;
  const byId = FACTIONS.find((row) => row.factionId.toLowerCase() === value.trim().toLowerCase());
  if (byId) return byId.name;
  const short = {
    aegis: 'Aegis Dominion',
    phantom: 'Phantom Blades',
    celestial: 'Celestial Nexus',
    sanctuary: 'Sanctuary Order',
    wild: 'Wild Creature',
    'tower anomaly': 'Tower Anomaly',
    'tower-anomaly': 'Tower Anomaly',
    'tower anomaly creature': 'Tower Anomaly',
  };
  return short[key] ?? value.trim();
}

/** @param {unknown} value */
function normalizeRole(value) {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const key = value.trim().toLowerCase();
  const match = ROLES.find((role) => role.toLowerCase() === key);
  return match;
}

/** @param {unknown} value */
function normalizePool(value) {
  if (typeof value !== 'string') return value;
  const key = value.trim().toLowerCase();
  return GACHA_POOLS.includes(key) ? key : value.trim();
}

/** @param {unknown} value */
function normalizeHumor(value) {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'string') return value;
  const match = HUMOR_TYPES.find((item) => item.toLowerCase() === value.trim().toLowerCase());
  return match ?? value.trim();
}

function classifyArray(json, out) {
  if (json.length === 0) {
    out.errors.push(bare('error', 'UNRECOGNIZED_FILE', '/', 'JSON array is empty.'));
    return;
  }
  if (json.every(isInspiration)) {
    out.inspirations.push(...json);
    return;
  }
  if (json.every(isQaReview)) {
    out.qa.push(...json);
    return;
  }
  if (json.every(isLoreLink)) {
    out.lore.push(...json);
    return;
  }
  json.forEach((row) => {
    if (isPlainObject(row)) out.rows.push({ row, category: null });
  });
}

/** @param {object} row */
function isCanonical(row) {
  return isPlainObject(row) && isPlainObject(row.research) && isPlainObject(row.creative);
}

/** @param {object} json */
function isLoreDocument(json) {
  if (!isPlainObject(json)) return false;
  if (json.environmentCrosswalk || json.elementCrosswalk || json.framework) return true;
  return typeof json.documentId === 'string' && /lore/i.test(json.documentId);
}

/**
 * Agent 06's record is already split into research and creative, but several
 * fields use that agent's names. A canonical example does not need a rewrite.
 *
 * @param {object} row
 */
function needsRewrite(row) {
  const id = row.monsterId;
  if (typeof id === 'string' && !/^MON-(NRM|ELT|MNB|MJB|WLB|SCB)-[0-9]{4}$/.test(id.trim())) return true;
  if (row.ipRisk == null && row.ipSimilarityRisk != null) return true;
  if (row.boss === undefined) return true;
  if (typeof row.category === 'string' && normalizeCategory(row.category) !== row.category.trim()) return true;
  const research = row.research;
  if (research.sourceUrl == null && Array.isArray(research.sources)) return true;
  if (research.domain != null || research.copiedFrom != null) return true;
  const creative = row.creative;
  if (creative.nameEn == null && (creative.parodyNameEn != null || creative.name != null)) return true;
  if (creative.nameTh == null && (creative.thaiName != null || creative.parodyNameTh != null)) return true;
  if (creative.element != null && typeof creative.element !== 'string') return true;
  if (creative.suggestedTowerEnvironment == null && creative.towerEnvironment != null) return true;
  if (creative.suggestedTowerEnvironment != null && typeof creative.suggestedTowerEnvironment !== 'string') return true;
  if (creative.originId != null || creative.originName != null) return true;
  if (creative.factionAffiliation != null && typeof creative.factionAffiliation !== 'string') return true;
  return false;
}

/**
 * @param {object} row
 * @param {{ warnings: object[], errors: object[] }} bag
 * @param {{ source: string, index: number }} where
 */
function rewriteAgentRecord(row, bag, where) {
  const record = {};
  const monsterId = canonicalMonsterId(row.monsterId);
  if (typeof monsterId === 'string') record.monsterId = monsterId;
  const category = normalizeCategory(row.category ?? row.creative?.monsterCategory);
  if (category !== undefined) record.category = category;
  const status = normalizeStatus(row.status);
  if (status !== undefined) record.status = status;
  const ipRisk = normalizeIp(row.ipRisk ?? row.ipSimilarityRisk ?? row.creative?.ipSimilarityRisk);
  if (ipRisk !== undefined) record.ipRisk = ipRisk;

  const rawResearch = row.research;
  const research = {};
  copyKnown(research, rawResearch, [
    'inspirationId', 'originalInspiration', 'origin', 'kind', 'facts', 'sources',
    'sourceUrl', 'protectedName', 'publicDomain', 'confidence', 'archetypeTags',
  ]);
  if (research.kind != null && !INSPIRATION_KINDS.includes(research.kind)) delete research.kind;
  // Agent 07 field names (Phase-1 integration).
  if (research.inspirationId == null) delete research.inspirationId;
  if (research.confidence == null && rawResearch.researchConfidence != null) research.confidence = normalizeConfidence(rawResearch.researchConfidence);
  if (research.publicDomain == null && typeof rawResearch.publicDomainTradition === 'boolean') research.publicDomain = rawResearch.publicDomainTradition;
  const sources = asSources(research.sources);
  if (sources) research.sources = sources;
  if (typeof research.sourceUrl !== 'string' && typeof research.sources?.[0]?.url === 'string') {
    research.sourceUrl = research.sources[0].url;
  }
  record.research = research;
  warnUnknown(rawResearch, new Set([
    'inspirationId', 'originalInspiration', 'origin', 'kind', 'facts', 'sources',
    'sourceUrl', 'protectedName', 'publicDomain', 'confidence', 'archetypeTags',
    'domain', 'copiedFrom', 'sensitivity', 'sensitivityNote',
    'researchConfidence', 'publicDomainTradition', 'alignmentNote', 'protectedNameNote', 'sibling',
  ]), bag, where, record.monsterId ?? null, 'research');

  const rawCreative = row.creative;
  const creative = {};
  assign(creative, 'nameEn', firstString(rawCreative.nameEn, rawCreative.parodyNameEn, rawCreative.name));
  assign(creative, 'nameTh', firstString(rawCreative.nameTh, rawCreative.thaiName, rawCreative.parodyNameTh));
  for (const field of [
    'creatureType', 'visualIdentity', 'personality', 'signatureTrait', 'comedyConcept',
    'combatArchetype', 'signatureAbilityConcept', 'weaknessConcept', 'loreSummary', 'artworkPromptConcept',
  ]) {
    if (typeof rawCreative[field] === 'string') creative[field] = rawCreative[field];
  }
  const element = flattenLabel(rawCreative.element ?? rawCreative.elementAttribute);
  if (typeof element === 'string') creative.element = element;
  const place = flattenPlace(rawCreative.suggestedTowerEnvironment ?? rawCreative.towerEnvironment);
  if (typeof place === 'string') creative.suggestedTowerEnvironment = place;
  const humor = normalizeHumor(rawCreative.humorType);
  if (humor !== undefined) creative.humorType = humor;
  creative.factionAffiliation = affiliationFrom(rawCreative);
  if (Object.hasOwn(rawCreative, 'suggestedRarity')) creative.suggestedRarity = normalizeRarity(rawCreative.suggestedRarity);
  record.creative = creative;
  warnUnknown(rawCreative, new Set([
    'nameEn', 'nameTh', 'parodyNameEn', 'parodyNameTh', 'thaiName', 'name', 'punLanguage',
    'humorType', 'creatureType', 'visualIdentity', 'personality', 'signatureTrait', 'comedyConcept',
    'element', 'combatArchetype', 'signatureAbilityConcept', 'weaknessConcept', 'loreSummary',
    'originId', 'originName', 'factionAffiliation', 'suggestedRarity', 'towerEnvironment',
    'suggestedTowerEnvironment', 'artworkPromptConcept', 'creativeBoundary',
    'monsterCategory', 'elementAttribute', 'ipSimilarityRisk', 'ipRiskReason', ...BOSS_FIELDS,
  ]), bag, where, record.monsterId ?? null, 'creative');

  const hooks = {};
  if (isPlainObject(rawCreative.factionAffiliation)) {
    const faction = rawCreative.factionAffiliation;
    if (typeof faction.factionId === 'string' && faction.factionId !== '') hooks.factionId = faction.factionId;
    const role = normalizeRole(faction.role);
    if (role) hooks.role = role;
  }
  if (isPlainObject(row.hooks)) Object.assign(hooks, row.hooks);
  if (Object.keys(hooks).length > 0) record.hooks = hooks;

  const boss = {};
  if (isPlainObject(row.boss)) {
    for (const field of BOSS_FIELDS) {
      if (typeof row.boss[field] === 'string') boss[field] = row.boss[field];
    }
  }
  // Agent 07 keeps the 8 boss fields inside creative.
  for (const field of BOSS_FIELDS) {
    if (boss[field] == null && typeof rawCreative[field] === 'string') boss[field] = rawCreative[field];
  }
  const bossCategory = typeof record.category === 'string' && BOSS_CATEGORIES.includes(record.category);
  if (Object.keys(boss).length > 0) record.boss = boss;
  else if (!bossCategory) record.boss = null;

  warnUnknown(row, new Set([
    'monsterId', 'status', 'category', 'research', 'creative', 'boss', 'hooks',
    'ipRisk', 'ipSimilarityRisk', 'ipSimilarityReason', 'notes',
  ]), bag, where, record.monsterId ?? null, '');
  return record;
}

/**
 * @param {object} creative
 */
function affiliationFrom(creative) {
  const raw = creative.factionAffiliation;
  if (isPlainObject(raw)) {
    const named = raw.name ?? raw.factionId ?? null;
    return named == null || named === '' ? null : normalizeAffiliation(named);
  }
  if (typeof raw === 'string' && raw.trim() !== '') return normalizeAffiliation(raw);
  if (raw != null && raw !== '') return normalizeAffiliation(raw);
  if (typeof creative.originId === 'string' && ORIGIN_AFFILIATION[creative.originId]) {
    return ORIGIN_AFFILIATION[creative.originId];
  }
  if (typeof creative.originName === 'string' && creative.originName.trim() !== '') {
    return normalizeAffiliation(creative.originName);
  }
  return null;
}

/** @param {unknown} value */
function flattenLabel(value) {
  if (typeof value === 'string') return value;
  if (!isPlainObject(value)) return undefined;
  return firstString(value.name, value.attributeId, value.id);
}

/** @param {unknown} value */
function flattenPlace(value) {
  if (typeof value === 'string') return value;
  if (!isPlainObject(value)) return undefined;
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const note = typeof value.note === 'string' ? value.note.trim() : '';
  if (name.length >= 12) return name;
  if (name && note) return `${name}. ${note}`;
  return name || note || undefined;
}

/**
 * @param {object} source
 * @param {Set<string>} allowed
 * @param {{ warnings: object[], errors: object[] }} bag
 * @param {{ source: string, index: number }} where
 * @param {string | null} monsterId
 * @param {string} prefix
 */
function warnUnknown(source, allowed, bag, where, monsterId, prefix) {
  for (const key of Object.keys(source)) {
    if (allowed.has(key) || FORBIDDEN_KEY.test(key)) continue;
    const path = prefix ? `${where.source}[${where.index}].${prefix}.${key}` : `${where.source}[${where.index}].${key}`;
    bag.warnings.push(bare('warning', 'UNKNOWN_FIELD', path, `Unmapped field "${key}" was ignored. Add an alias in adapt.mjs if agents 06–10 emit it.`, monsterId));
  }
}

/** @param {object} row */
function looksLikeMonster(row) {
  if (!isPlainObject(row) || isInspiration(row) || isQaReview(row) || isLoreLink(row)) return false;
  if (CREATIVE_SIGNAL.some((key) => row[key] != null)) return true;
  if (isPlainObject(row.research) && isPlainObject(row.creative)) return true;
  return Boolean(row.category && (row.monsterId || row['Monster ID']));
}

/** @param {object} row */
function isInspiration(row) {
  return isPlainObject(row)
    && typeof row.inspirationId === 'string'
    && Array.isArray(row.facts)
    && row.monsterId == null
    && !isPlainObject(row.creative)
    && !CREATIVE_SIGNAL.some((key) => row[key] != null);
}

/** @param {object} row */
function isQaReview(row) {
  if (!isPlainObject(row) || CREATIVE_SIGNAL.some((key) => row[key] != null) || row.research || row.category) return false;
  const id = row.monsterId || row['Monster ID'] || row.id;
  if (typeof id !== 'string' || id.length === 0) return false;
  return row.status != null || row.ipRisk != null || row.ipSimilarityRisk != null || row.notes != null || row.note != null || row.confidence != null;
}

/** @param {object} row */
function isLoreLink(row) {
  if (!isPlainObject(row) || CREATIVE_SIGNAL.some((key) => row[key] != null) || row.research || row.category) return false;
  const ref = row.monsterId || row.nameEn || row.parodyNameEn || row['Parody Name (EN)'] || row.name;
  const lore = row.loreSummary != null || row.lore != null || row.factionAffiliation != null || row.faction != null
    || row.suggestedTowerEnvironment != null || row['Lore Summary'] != null
    || row.hook != null || row.environmentId != null || row.originId != null;
  return Boolean(ref && lore);
}

function monsterIdFromPitch(row) {
  const pitchId = typeof row.pitchId === 'string' ? row.pitchId : '';
  return /^MON-(NRM|ELT|MNB|MJB|WLB|SCB)-[0-9]{4}$/.test(pitchId) ? pitchId : undefined;
}

/**
 * @param {object} row
 * @param {Map<string, string>} keyIndex
 * @param {string[]} aliases
 * @param {Set<string>} used
 */
function pick(row, keyIndex, aliases, used) {
  const hit = peekUsed(row, keyIndex, aliases, used);
  return hit.hit ? hit.value : undefined;
}

function peekUsed(row, keyIndex, aliases, used) {
  let value;
  let hit = false;
  for (const alias of aliases) {
    const actual = resolveKey(row, keyIndex, alias);
    if (!actual || used.has(actual)) continue;
    if (!hit) {
      value = row[actual];
      hit = true;
    }
    used.add(actual);
  }
  return { hit, value };
}

function resolveKey(row, keyIndex, alias) {
  if (Object.hasOwn(row, alias)) return alias;
  return keyIndex.get(alias.toLowerCase()) ?? null;
}

function actualKey(row, keyIndex, alias) {
  return resolveKey(row, keyIndex, alias) ?? alias;
}

function indexKeys(row) {
  const map = new Map();
  for (const key of Object.keys(row)) map.set(key.toLowerCase(), key);
  return map;
}

function copyKnown(target, source, keys) {
  for (const key of keys) {
    if (source[key] !== undefined) target[key] = source[key];
  }
}

function labelledBoss(boss, field) {
  const aliases = FIELD_ALIASES[field] ?? [];
  for (const alias of aliases) {
    if (boss[alias] != null) return boss[alias];
  }
  return null;
}

function asFacts(value) {
  if (value == null) return undefined;
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value;
  return undefined;
}

function asSources(value) {
  if (value == null) return undefined;
  const list = Array.isArray(value) ? value : [value];
  return list.map((item) => {
    if (typeof item === 'string') return { url: item };
    if (!isPlainObject(item)) return item;
    return cleanSource(item);
  });
}

function cleanSource(source) {
  const out = {};
  const url = source.url ?? source.href ?? source.link;
  const title = source.title ?? source.name;
  const accessed = source.accessed ?? source.accessDate ?? source.retrieved ?? source.date;
  const supports = source.supports ?? source.support ?? source.fact ?? source.claim;
  if (typeof url === 'string') out.url = url;
  if (typeof title === 'string') out.title = title;
  if (typeof accessed === 'string') out.accessed = accessed;
  if (typeof supports === 'string') out.supports = supports;
  return out;
}

function asTags(value) {
  if (value == null) return undefined;
  if (typeof value === 'string') return value.split(',').map((tag) => tag.trim()).filter(Boolean);
  if (Array.isArray(value)) return value;
  return undefined;
}

function asBool(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return value;
  const key = value.trim().toLowerCase();
  if (['true', 'yes'].includes(key)) return true;
  if (['false', 'no'].includes(key)) return false;
  return value;
}

function assign(target, key, value) {
  if (value !== undefined) target[key] = value;
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return undefined;
}

function categoryKey(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[_/-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function scanRaw(value, where, bag, path = '') {
  if (typeof value === 'number') {
    bag.errors.push(bare('error', 'STAT_NUMBER', `${where.source}[${where.index}]${path}`, `${path || '/'} is a number. Combat stats and rates are not accepted.`, null));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanRaw(item, where, bag, `${path}/${index}`));
    return;
  }
  if (!isPlainObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEY.test(key)) {
      bag.errors.push(bare(
        'error',
        'FORBIDDEN_FIELD',
        `${where.source}[${where.index}]${path}/${key}`,
        `${key} is a combat or gacha field. Leave it out of the research record.`,
        null,
      ));
      if (typeof child === 'number') continue;
    }
    scanRaw(child, where, bag, `${path}/${key}`);
  }
}

function bare(severity, code, path, message, monsterId = null) {
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

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
