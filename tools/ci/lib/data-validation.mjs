import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CARD_ACTION_TYPES, FACTION_RECORDS } from '../../../src/schema/constants.js';
import {
  validateActionCard,
  validateAssetManifest,
  validateAvatar,
  validateAvatarCard,
  validateEquipment,
  validateFaction,
  validateOwnership,
  validateVariant,
} from '../../../src/schema/validate.js';
import { isPlainObject, isUnder, readJsonFile, relativePosix, resolveInsideRepo, walkFiles } from './common.mjs';

/**
 * Draft authoring templates. These names are the `extends` values written by
 * the content authoring pipeline. `tbd-stats` is a parent of avatar templates,
 * not a record kind.
 */
const DRAFT_REQUIRED_FIELDS = Object.freeze({
  avatar: ['avatarId', 'nameEn', 'nameTh', 'factionId'],
  'avatar-card': ['avatarId'],
  'action-card': ['cardId', 'actionType'],
  equipment: ['equipmentId', 'slot'],
});

const RECORD_COLLECTIONS = ['avatars', 'avatarCards', 'actionCards', 'equipment', 'ownership', 'variants'];

const AVATAR_ID = /^AVT_[A-Z0-9_]+$/;

/**
 * @param {unknown} value
 */
function isAssetManifest(value) {
  if (!isPlainObject(value) || !Array.isArray(value.assets)) return false;
  if (value.manifest_version != null || value.status_legend || typeof value.project === 'string') return true;
  return value.assets.some((entry) => isPlainObject(entry) && typeof entry.asset_id === 'string' && 'path' in entry);
}

/**
 * @param {unknown} value
 */
function isAvatarRecord(value) {
  return isPlainObject(value)
    && typeof value.avatarId === 'string'
    && AVATAR_ID.test(value.avatarId)
    && (typeof value.nameEn === 'string' || typeof value.nameTh === 'string');
}

/**
 * @param {unknown} value
 */
function isNamedCharacterRecord(value) {
  if (!isPlainObject(value) || isAvatarRecord(value)) return false;
  const id = value.characterId ?? value.character_id;
  return typeof id === 'string'
    && id.length > 0
    && (typeof value.nameEn === 'string' || typeof value.nameTh === 'string' || typeof value.name === 'string');
}

/**
 * @param {unknown} value
 */
function isEquipmentRecord(value) {
  return isPlainObject(value)
    && typeof value.equipmentId === 'string'
    && typeof value.slot === 'string'
    && isPlainObject(value.statModifiers)
    && Object.prototype.hasOwnProperty.call(value, 'upgradeStatus');
}

/**
 * @param {unknown} value
 */
function isOwnershipRecord(value) {
  return isPlainObject(value)
    && typeof value.ownershipId === 'string'
    && typeof value.ownerId === 'string'
    && typeof value.subjectKind === 'string';
}

/**
 * @param {unknown} value
 */
function isVariantRecord(value) {
  return isPlainObject(value)
    && typeof value.variantId === 'string'
    && typeof value.baseId === 'string'
    && typeof value.subjectKind === 'string'
    && typeof value.assetId === 'string'
    && Object.prototype.hasOwnProperty.call(value, 'status');
}

/**
 * @param {unknown} value
 */
function isFactionRecord(value) {
  return isPlainObject(value)
    && typeof value.factionId === 'string'
    && typeof value.name === 'string'
    && typeof value.role === 'string'
    && value.avatarId === undefined
    && value.cardId === undefined;
}

/**
 * @param {unknown} value
 */
function classify(value) {
  if (!isPlainObject(value)) return null;
  if (isAssetManifest(value)) return { name: 'asset manifest', validate: validateAssetManifest };
  if (value.cardKind === 'avatar_card') return { name: 'avatar card', validate: validateAvatarCard };
  if (value.cardKind === 'action_card') return { name: 'action card', validate: validateActionCard };
  if (isAvatarRecord(value)) return { name: 'avatar', validate: validateAvatar, characterId: value.avatarId };
  if (isNamedCharacterRecord(value)) {
    return {
      name: 'character',
      validate: () => [],
      characterId: value.characterId ?? value.character_id,
    };
  }
  if (isEquipmentRecord(value)) return { name: 'equipment', validate: validateEquipment };
  if (isOwnershipRecord(value)) return { name: 'ownership', validate: validateOwnership };
  if (isVariantRecord(value)) return { name: 'variant', validate: validateVariant };
  if (isFactionRecord(value)) return { name: 'faction', validate: validateFaction };
  return null;
}

/**
 * Content tier. An explicit marker wins over the path.
 * 1. Top-level `contentTier` of `"draft"` or `"production"` on a JSON object.
 * 2. Otherwise `content/production/` is production content.
 * 3. Otherwise `content/` is draft content (authoring files, templates, examples).
 * 4. Otherwise the file is runtime data (catalog snapshots, docs, fixtures).
 * Runtime data keeps the original parse, schema, and character-id checks.
 * It is not the production pack, so asset files are not required there.
 * @param {string} relativeFile
 * @param {unknown} value
 * @returns {'draft' | 'production' | 'runtime'}
 */
export function contentTierFor(relativeFile, value) {
  if (isPlainObject(value) && (value.contentTier === 'draft' || value.contentTier === 'production')) {
    return value.contentTier;
  }
  const rel = relativeFile.replaceAll('\\', '/');
  if (rel === 'content/production' || rel.startsWith('content/production/')) return 'production';
  if (rel === 'content' || rel.startsWith('content/')) return 'draft';
  return 'runtime';
}

/**
 * @param {unknown} value
 * @param {string} file
 * @returns {{ record: Record<string, unknown>, location: string, collection: string | null }[]}
 */
function iterContentRecords(value, file) {
  /** @type {{ record: Record<string, unknown>, location: string, collection: string | null }[]} */
  const records = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (isPlainObject(item)) records.push({ record: item, location: `${file}[${index}]`, collection: null });
    });
    return records;
  }
  if (!isPlainObject(value)) return records;
  if (typeof value.templateId === 'string') return records;
  let found = false;
  for (const key of RECORD_COLLECTIONS) {
    if (!Array.isArray(value[key])) continue;
    found = true;
    value[key].forEach((item, index) => {
      if (isPlainObject(item)) records.push({ record: item, location: `${file}.${key}[${index}]`, collection: key });
    });
  }
  if (!found && (value.avatarId !== undefined || value.cardId !== undefined || value.cardKind !== undefined || value.equipmentId !== undefined || value.extends !== undefined || value.ownershipId !== undefined || value.variantId !== undefined)) {
    records.push({ record: value, location: file, collection: null });
  }
  return records;
}

/**
 * @param {unknown} value
 */
function nonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

/**
 * @param {Record<string, unknown>} record
 * @param {string} location
 * @param {{ location: string, message: string, code: string }[]} errors
 */
function checkDraftExtends(record, location, errors) {
  const template = record.extends;
  if (typeof template !== 'string' || template.length === 0) {
    errors.push({ location, code: 'TEMPLATE', message: 'extends must be a non-empty template id' });
    return;
  }
  const required = DRAFT_REQUIRED_FIELDS[template];
  if (!required) {
    errors.push({
      location,
      code: 'TEMPLATE',
      message: `unknown draft template "${template}". Expected one of ${Object.keys(DRAFT_REQUIRED_FIELDS).join(', ')}`,
    });
    return;
  }
  for (const field of required) {
    if (!nonEmptyString(record[field])) {
      errors.push({ location: `${location}.${field}`, code: 'REQUIRED', message: `${field} is required on a draft ${template} record` });
    }
  }
  if (template === 'avatar' || template === 'avatar-card') {
    if (nonEmptyString(record.avatarId) && !AVATAR_ID.test(record.avatarId)) {
      errors.push({ location: `${location}.avatarId`, code: 'SCHEMA', message: 'avatarId must look like AVT_AEG_001' });
    }
  }
  if (template === 'avatar' && nonEmptyString(record.factionId)) {
    if (!FACTION_RECORDS.some((faction) => faction.factionId === record.factionId)) {
      errors.push({ location: `${location}.factionId`, code: 'SCHEMA', message: 'unknown factionId' });
    }
  }
  if (template === 'action-card' && nonEmptyString(record.actionType) && !CARD_ACTION_TYPES.includes(record.actionType)) {
    errors.push({ location: `${location}.actionType`, code: 'SCHEMA', message: 'actionType must be ATK, DEF, or Skill' });
  }
}

/**
 * @param {string} root
 * @param {string} ref
 * @param {Map<string, { path: string }[]>} liveAssets
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
function assetReferenceExists(root, ref, liveAssets) {
  if (!nonEmptyString(ref)) return { ok: false, message: 'asset reference is empty' };
  const looksLikePath = ref.includes('/') || ref.startsWith('assets');
  if (looksLikePath) {
    const resolved = resolveInsideRepo(root, ref);
    if (!resolved.ok) return resolved;
    if (!existsSync(resolved.full) || !statSync(resolved.full).isFile()) {
      return { ok: false, message: 'asset file does not exist' };
    }
    return { ok: true };
  }
  const hits = liveAssets.get(ref) ?? [];
  if (hits.length === 0) return { ok: false, message: 'asset id is not in a live manifest' };
  for (const hit of hits) {
    const resolved = resolveInsideRepo(root, hit.path);
    if (!resolved.ok) continue;
    if (existsSync(resolved.full) && statSync(resolved.full).isFile()) return { ok: true };
  }
  return { ok: false, message: 'manifest path for this asset id is not a file' };
}

/**
 * @param {Record<string, unknown>} record
 * @returns {{ field: string, ref: string }[]}
 */
function assetRefsOf(record) {
  /** @type {{ field: string, ref: string }[]} */
  const refs = [];
  if (typeof record.assetId === 'string') refs.push({ field: 'assetId', ref: record.assetId });
  if (isPlainObject(record.assetIds)) {
    for (const [key, value] of Object.entries(record.assetIds)) {
      if (typeof value === 'string') refs.push({ field: `assetIds.${key}`, ref: value });
    }
  }
  return refs;
}

/**
 * @param {string} parent
 * @param {string} key
 */
function childPath(parent, key) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? `${parent}.${key}` : `${parent}[${JSON.stringify(key)}]`;
}

/**
 * @param {unknown} value
 * @param {string} pointer
 * @param {(node: { kind: string, value: unknown, pointer: string }) => void} visit
 */
function walkJson(value, pointer, visit) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkJson(item, `${pointer}[${index}]`, visit));
    return;
  }
  if (!isPlainObject(value)) return;
  visit({ kind: 'object', value, pointer });
  for (const [key, child] of Object.entries(value)) {
    const next = childPath(pointer, key);
    if (key === 'characters' && isPlainObject(child)) {
      visit({ kind: 'characterIndex', value: child, pointer: next });
    }
    walkJson(child, next, visit);
  }
}

/**
 * @param {Map<string, string[]>} definitions
 * @param {string} id
 * @param {string} location
 */
function addDefinition(definitions, id, location) {
  const list = definitions.get(id);
  if (list) list.push(location);
  else definitions.set(id, [location]);
}

/**
 * @param {string} root
 * @param {string} relativeFile
 */
async function loadModule(root, relativeFile) {
  const file = join(root, relativeFile);
  if (!existsSync(file)) return null;
  return import(pathToFileURL(file).href);
}

/**
 * @param {string} root
 * @param {{ location: string, value: unknown }[]} records
 * @param {string[]} loadErrors
 */
async function loadJavaScriptRecords(root, records, loadErrors) {
  const modules = [
    ['src/avatars/catalog.js', ['SAMPLE_AVATARS', 'FACTIONS', 'SAMPLE_EQUIPMENT', 'SAMPLE_VARIANTS']],
    ['src/cards/catalog.js', ['SAMPLE_AVATAR_CARDS', 'SAMPLE_ACTION_CARDS']],
    ['src/avatars/ownership.js', ['SAMPLE_OWNERSHIP']],
  ];
  for (const [relativeFile, exportNames] of modules) {
    let loaded;
    try {
      loaded = await loadModule(root, relativeFile);
    } catch (error) {
      loadErrors.push(`${relativeFile}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    if (!loaded) continue;
    for (const name of exportNames) {
      const value = loaded[name];
      if (value === undefined) continue;
      const list = Array.isArray(value) ? value : [value];
      list.forEach((record, index) => {
        records.push({ location: `${relativeFile}#${name}[${index}]`, value: record });
      });
    }
  }
}

/**
 * Validate JSON parse, character-id uniqueness, schema compatibility, and the
 * two content tiers. Validators are the repo's `src/schema/validate.js` functions.
 * Numeric gameplay rules that are still BLOCKED_BY_DESIGN are not filled in here.
 *
 * Draft content (authoring files) checks required fields and unique new ids.
 * An avatar id that already exists in the runtime catalog may appear again in
 * draft records and in reference fields. Production content checks the full
 * schema, referential integrity, unique ids, asset files, and the same runtime
 * validators. See `contentTierFor`.
 * @param {string} root
 */
export async function validateData(root) {
  const parseErrors = [];
  const schemaErrors = [];
  const loadErrors = [];
  const draftErrors = [];
  const productionErrors = [];
  const definitions = new Map();
  /** @type {Map<string, string[]>} */
  const draftCharacters = new Map();
  /** @type {Map<string, Map<string, string[]>>} */
  const characterIndexes = new Map();
  /** @type {Map<string, { path: string }[]>} */
  const liveAssets = new Map();
  /** @type {{ record: Record<string, unknown>, location: string, collection: string | null }[]} */
  const productionRecords = [];
  /** @type {{ id: string, location: string }[]} */
  const runtimeEquipment = [];
  const draftCardIds = new Map();
  const draftEquipmentIds = new Map();
  let jsonFiles = 0;
  let draftFiles = 0;
  let productionFiles = 0;
  let recordsChecked = 0;

  function noteCharacterIndex(file, id, location) {
    let byId = characterIndexes.get(file);
    if (!byId) {
      byId = new Map();
      characterIndexes.set(file, byId);
    }
    const locations = byId.get(id);
    if (locations) locations.push(location);
    else byId.set(id, [location]);
  }

  function noteDraftCharacter(id, location) {
    const list = draftCharacters.get(id);
    if (list) list.push(location);
    else draftCharacters.set(id, [location]);
  }

  function noteScopedId(map, id, location, label) {
    if (!nonEmptyString(id)) return;
    const previous = map.get(id);
    if (previous) {
      draftErrors.push({
        location,
        code: 'DUPLICATE',
        message: `Duplicate draft ${label} "${id}" (also at ${previous})`,
      });
      return;
    }
    map.set(id, location);
  }

  /**
   * @param {unknown} value
   * @param {string} location
   * @param {'draft' | 'production' | 'runtime'} tier
   */
  function consider(value, location, tier) {
    if (isPlainObject(value) && Object.prototype.hasOwnProperty.call(value, 'extends')) {
      if (tier === 'production') {
        productionErrors.push({
          location,
          code: 'PRODUCTION_SHAPE',
          message: 'production content must be a complete record without extends',
        });
      }
      return;
    }
    const kind = classify(value);
    if (!kind) return;
    recordsChecked += 1;
    if (kind.characterId) {
      if (tier === 'draft') noteDraftCharacter(kind.characterId, location);
      else addDefinition(definitions, kind.characterId, location);
    }
    let errors;
    try {
      errors = kind.validate(value);
    } catch (error) {
      schemaErrors.push({
        location,
        message: `${kind.name} validator threw: ${error instanceof Error ? error.message : String(error)}`,
      });
      return;
    }
    if (!Array.isArray(errors)) {
      schemaErrors.push({ location, message: `${kind.name} validator did not return an error list` });
      return;
    }
    for (const error of errors) {
      const path = error && typeof error.path === 'string' ? error.path : kind.name;
      const message = error && typeof error.message === 'string' ? error.message : 'invalid record';
      schemaErrors.push({ location: `${location} (${path})`, message });
    }
  }

  for (const file of walkFiles(root, '.json')) {
    jsonFiles += 1;
    const rel = relativePosix(root, file);
    const parsed = readJsonFile(file);
    if (!parsed.ok) {
      parseErrors.push({ file: rel, message: parsed.error });
      continue;
    }
    const tier = contentTierFor(rel, parsed.value);
    if (tier === 'draft') draftFiles += 1;
    if (tier === 'production') productionFiles += 1;

    if (tier !== 'draft' && !isUnder(root, file, 'tests') && isAssetManifest(parsed.value)) {
      for (const entry of parsed.value.assets) {
        if (!isPlainObject(entry) || !nonEmptyString(entry.asset_id) || typeof entry.path !== 'string') continue;
        const hits = liveAssets.get(entry.asset_id) ?? [];
        hits.push({ path: entry.path });
        liveAssets.set(entry.asset_id, hits);
      }
    }

    if (tier === 'draft') {
      for (const item of iterContentRecords(parsed.value, rel)) {
        if (Object.prototype.hasOwnProperty.call(item.record, 'extends')) {
          checkDraftExtends(item.record, item.location, draftErrors);
          if (item.record.extends === 'avatar' && nonEmptyString(item.record.avatarId)) {
            noteDraftCharacter(item.record.avatarId, item.location);
          }
        }
        const cardId = item.record.cardId;
        const equipmentId = item.record.equipmentId;
        const isCard = item.collection === 'avatarCards' || item.collection === 'actionCards' || item.record.cardKind === 'avatar_card' || item.record.cardKind === 'action_card' || item.record.extends === 'avatar-card' || item.record.extends === 'action-card';
        const isEquipment = item.collection === 'equipment' || item.record.equipmentId !== undefined || item.record.extends === 'equipment';
        if (isCard) noteScopedId(draftCardIds, cardId, item.location, 'cardId');
        if (isEquipment) noteScopedId(draftEquipmentIds, equipmentId, item.location, 'equipmentId');
      }
    }

    if (tier === 'production') {
      productionRecords.push(...iterContentRecords(parsed.value, rel));
    }

    const draftTemplate = tier === 'draft' && isPlainObject(parsed.value) && typeof parsed.value.templateId === 'string';
    if (draftTemplate) continue;

    walkJson(parsed.value, rel, (node) => {
      if (node.kind === 'characterIndex') {
        for (const id of Object.keys(node.value)) noteCharacterIndex(rel, id, node.pointer);
        return;
      }
      consider(node.value, node.pointer, tier);
    });
  }

  const jsRecords = [];
  await loadJavaScriptRecords(root, jsRecords, loadErrors);
  for (const record of jsRecords) {
    consider(record.value, record.location, 'runtime');
    if (record.location.includes('#SAMPLE_EQUIPMENT[') && isPlainObject(record.value) && nonEmptyString(record.value.equipmentId)) {
      runtimeEquipment.push({ id: record.value.equipmentId, location: record.location });
    }
  }

  const knownAvatars = new Set(definitions.keys());
  for (const [id, locations] of draftCharacters) {
    if (locations.length > 1) {
      // Declared twice inside draft content. Reported with the other character duplicates.
    } else if (!knownAvatars.has(id)) {
      addDefinition(definitions, id, locations[0]);
    }
  }

  const characterDuplicates = [];
  for (const [id, locations] of definitions) {
    if (locations.length > 1) characterDuplicates.push({ id, locations });
  }
  for (const [id, locations] of draftCharacters) {
    if (locations.length > 1) characterDuplicates.push({ id, locations });
  }
  for (const [, byId] of characterIndexes) {
    for (const [id, locations] of byId) {
      if (locations.length > 1) characterDuplicates.push({ id, locations });
    }
  }
  characterDuplicates.sort((a, b) => a.id.localeCompare(b.id) || a.locations[0].localeCompare(b.locations[0]));

  const knownEquipment = new Map(runtimeEquipment.map((entry) => [entry.id, entry.location]));
  const productionCardIds = new Map();
  for (const item of productionRecords) {
    if (Object.prototype.hasOwnProperty.call(item.record, 'extends')) continue;
    if (nonEmptyString(item.record.equipmentId)) {
      const previous = knownEquipment.get(item.record.equipmentId);
      if (previous) {
        productionErrors.push({
          location: item.location,
          code: 'DUPLICATE',
          message: `Duplicate equipmentId "${item.record.equipmentId}" (also at ${previous})`,
        });
      } else {
        knownEquipment.set(item.record.equipmentId, item.location);
      }
    }
    const isCard = item.collection === 'avatarCards'
      || item.collection === 'actionCards'
      || item.record.cardKind === 'avatar_card'
      || item.record.cardKind === 'action_card';
    if (isCard && nonEmptyString(item.record.cardId)) {
      const previous = productionCardIds.get(item.record.cardId);
      if (previous) {
        productionErrors.push({
          location: item.location,
          code: 'DUPLICATE',
          message: `Duplicate cardId "${item.record.cardId}" (also at ${previous})`,
        });
      } else {
        productionCardIds.set(item.record.cardId, item.location);
      }
    }
  }
  for (const item of productionRecords) {
    const { record, location, collection } = item;
    if (Object.prototype.hasOwnProperty.call(record, 'extends')) continue;
    if ((collection === 'avatarCards' || record.cardKind === 'avatar_card') && nonEmptyString(record.avatarId) && !knownAvatars.has(record.avatarId)) {
      productionErrors.push({
        location: `${location}.avatarId`,
        code: 'BROKEN_REF',
        message: `Avatar "${record.avatarId}" is not in the runtime catalog or this production content`,
      });
    }
    if ((collection === 'equipment' || record.equipmentId !== undefined) && nonEmptyString(record.nativeAvatarId) && !knownAvatars.has(record.nativeAvatarId)) {
      productionErrors.push({
        location: `${location}.nativeAvatarId`,
        code: 'BROKEN_REF',
        message: `Avatar "${record.nativeAvatarId}" is not in the runtime catalog or this production content`,
      });
    }
    if (nonEmptyString(record.variantOf)) {
      if (record.variantOf === record.equipmentId) {
        productionErrors.push({
          location: `${location}.variantOf`,
          code: 'BROKEN_REF',
          message: 'variantOf cannot point at the same equipment id',
        });
      } else if (!knownEquipment.has(record.variantOf)) {
        productionErrors.push({
          location: `${location}.variantOf`,
          code: 'BROKEN_REF',
          message: `variantOf "${record.variantOf}" is not an equipment id in the runtime catalog or this production content`,
        });
      }
    }
    if (record.subjectKind === 'avatar' && nonEmptyString(record.subjectId) && !knownAvatars.has(record.subjectId)) {
      productionErrors.push({
        location: `${location}.subjectId`,
        code: 'BROKEN_REF',
        message: `subjectId "${record.subjectId}" is not a known avatar`,
      });
    }
    if (record.subjectKind === 'equipment' && nonEmptyString(record.baseId) && !knownEquipment.has(record.baseId)) {
      productionErrors.push({
        location: `${location}.baseId`,
        code: 'BROKEN_REF',
        message: `baseId "${record.baseId}" is not a known equipment id`,
      });
    }
    for (const assetRef of assetRefsOf(record)) {
      const resolved = assetReferenceExists(root, assetRef.ref, liveAssets);
      if (!resolved.ok) {
        productionErrors.push({
          location: `${location}.${assetRef.field}`,
          code: 'ASSET_FILE',
          message: `Asset "${assetRef.ref}" ${resolved.message}`,
        });
      }
    }
  }

  const ok = parseErrors.length === 0
    && schemaErrors.length === 0
    && loadErrors.length === 0
    && characterDuplicates.length === 0
    && draftErrors.length === 0
    && productionErrors.length === 0;

  const tierNotice = 'Content tier: a top-level contentTier of "draft" or "production" wins. Otherwise content/production/ is production content and any other content/ path is draft content. Every other JSON file is runtime data. Draft checks required authoring fields and unique new ids; avatar ids already in the runtime catalog may be repeated by draft records and by reference fields. Production checks the schema, referential integrity, unique ids, real asset files, and the runtime validators in src/schema/validate.js. CONCEPT and PROTOTYPE stay valid. PRODUCTION_READY is not required.';

  const sections = [
    {
      title: 'JSON parse',
      table: {
        headers: ['Check', 'Result', 'Detail'],
        rows: [[
          'All JSON files parse',
          parseErrors.length === 0 ? 'PASS' : 'FAIL',
          parseErrors.length === 0
            ? `${jsonFiles} file${jsonFiles === 1 ? '' : 's'}`
            : `${parseErrors.length} file${parseErrors.length === 1 ? '' : 's'} failed to parse`,
        ]],
      },
      body: parseErrors.length === 0
        ? ''
        : parseErrors.slice(0, 30).map((error) => `- \`${error.file}\`: ${error.message}`).join('\n'),
    },
    {
      title: 'Character IDs',
      table: {
        headers: ['Check', 'Result', 'Detail'],
        rows: [[
          'Duplicate character IDs',
          characterDuplicates.length === 0 ? 'PASS' : 'FAIL',
          characterDuplicates.length === 0
            ? `${definitions.size} character record${definitions.size === 1 ? '' : 's'}; index keys unique within each file`
            : `${characterDuplicates.length} duplicated id${characterDuplicates.length === 1 ? '' : 's'}`,
        ]],
      },
      body: characterDuplicates.length === 0
        ? ''
        : characterDuplicates.slice(0, 30).map((entry) => `- \`${entry.id}\`: ${entry.locations.map((location) => `\`${location}\``).join(', ')}`).join('\n'),
    },
    {
      title: 'Schema compatibility',
      table: {
        headers: ['Check', 'Result', 'Detail'],
        rows: [[
          'Records match src/schema/validate.js',
          schemaErrors.length === 0 && loadErrors.length === 0 ? 'PASS' : 'FAIL',
          `${recordsChecked} record${recordsChecked === 1 ? '' : 's'} checked`,
        ]],
      },
      body: [...loadErrors.map((message) => `- ${message}`), ...schemaErrors.slice(0, 40).map((error) => `- \`${error.location}\`: ${error.message}`)].join('\n'),
    },
    {
      title: 'Draft content',
      table: {
        headers: ['Check', 'Result', 'Detail'],
        rows: [[
          'Draft authoring files',
          draftErrors.length === 0 ? 'PASS' : 'FAIL',
          draftErrors.length === 0
            ? `${draftFiles} file${draftFiles === 1 ? '' : 's'}; new ids unique; existing avatar ids may repeat`
            : `${draftErrors.length} error${draftErrors.length === 1 ? '' : 's'}`,
        ]],
      },
      body: draftErrors.slice(0, 30).map((error) => `- \`${error.location}\` (${error.code}): ${error.message}`).join('\n'),
    },
    {
      title: 'Production content',
      table: {
        headers: ['Check', 'Result', 'Detail'],
        rows: [[
          'Production content',
          productionErrors.length === 0 ? 'PASS' : 'FAIL',
          productionErrors.length === 0
            ? `${productionFiles} file${productionFiles === 1 ? '' : 's'}; schema, references, unique ids, and asset files`
            : `${productionErrors.length} error${productionErrors.length === 1 ? '' : 's'}`,
        ]],
      },
      body: productionErrors.slice(0, 30).map((error) => `- \`${error.location}\` (${error.code}): ${error.message}`).join('\n'),
    },
  ];

  return {
    ok,
    notices: [tierNotice],
    sections,
    jsonFiles,
    parseErrors,
    characterDuplicates,
    schemaErrors,
    loadErrors,
    draftErrors,
    productionErrors,
    draftFiles,
    productionFiles,
    recordsChecked,
    characterCount: definitions.size,
  };
}
