import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
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
import { isPlainObject, readJsonFile, relativePosix, walkFiles } from './common.mjs';

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
 * Validate JSON parse, character-id uniqueness, and schema compatibility.
 * Validators are the repo's `src/schema/validate.js` functions. Numeric gameplay
 * rules that are still BLOCKED_BY_DESIGN are not filled in here.
 * @param {string} root
 */
export async function validateData(root) {
  const parseErrors = [];
  const schemaErrors = [];
  const loadErrors = [];
  const definitions = new Map();
  /** @type {Map<string, Map<string, string[]>>} */
  const characterIndexes = new Map();
  let jsonFiles = 0;
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

  function consider(value, location) {
    const kind = classify(value);
    if (!kind) return;
    recordsChecked += 1;
    if (kind.characterId) addDefinition(definitions, kind.characterId, location);
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
    walkJson(parsed.value, rel, (node) => {
      if (node.kind === 'characterIndex') {
        for (const id of Object.keys(node.value)) noteCharacterIndex(rel, id, node.pointer);
        return;
      }
      consider(node.value, node.pointer);
    });
  }

  const jsRecords = [];
  await loadJavaScriptRecords(root, jsRecords, loadErrors);
  for (const record of jsRecords) consider(record.value, record.location);

  const characterDuplicates = [];
  for (const [id, locations] of definitions) {
    if (locations.length > 1) characterDuplicates.push({ id, locations });
  }
  for (const [, byId] of characterIndexes) {
    for (const [id, locations] of byId) {
      if (locations.length > 1) characterDuplicates.push({ id, locations });
    }
  }
  characterDuplicates.sort((a, b) => a.id.localeCompare(b.id) || a.locations[0].localeCompare(b.locations[0]));

  const ok = parseErrors.length === 0 && schemaErrors.length === 0 && loadErrors.length === 0 && characterDuplicates.length === 0;
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
  ];

  return {
    ok,
    notices: [],
    sections,
    jsonFiles,
    parseErrors,
    characterDuplicates,
    schemaErrors,
    loadErrors,
    recordsChecked,
    characterCount: definitions.size,
  };
}
