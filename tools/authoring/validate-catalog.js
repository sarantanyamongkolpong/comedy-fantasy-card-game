import { readFileSync } from 'node:fs';
import { FACTION_RECORDS } from '../../src/schema/constants.js';
import {
  validateActionCard,
  validateAssetManifest,
  validateAvatar,
  validateAvatarCard,
  validateEquipment,
} from '../../src/schema/validate.js';
import {
  ACTION_CARD_ID_PATTERN,
  AVATAR_CARD_ID_PATTERN,
  EQUIPMENT_ID_PATTERN,
  OFFICIAL_FACTION_NAMES,
  equipmentFactionCode,
  parseAvatarId,
} from './ids.js';
import { materializeCatalog } from './templates.js';

const FACTION_LIST = `${OFFICIAL_FACTION_NAMES.join(', ')} (${FACTION_RECORDS.map((record) => record.factionId).join(', ')})`;

/**
 * @param {string} code
 * @param {string} path
 * @param {string} message
 * @param {'error' | 'warning'} [severity]
 */
function issue(code, path, message, severity = 'error') {
  return { severity, code, path, message };
}

/**
 * Compare an AVT_ faction code with a FAC_ id. Display names are handled separately.
 * @param {unknown} factionId
 * @param {string} code
 */
function factionCodeMismatch(factionId, code) {
  return typeof factionId === 'string' && factionId.startsWith('FAC_') && code !== factionId.slice(4);
}

/**
 * @param {string} issuePath
 * @param {string} prefix
 * @param {string} collectionPath
 */
function rebase(issuePath, prefix, collectionPath) {
  let rest = issuePath;
  if (rest === prefix) rest = '';
  else if (rest.startsWith(`${prefix}.`)) rest = rest.slice(prefix.length + 1);
  return rest ? `${collectionPath}.${rest}` : collectionPath;
}

/**
 * @param {string} message
 * @param {string} path
 */
function codeForSchema(message, path) {
  if (path.endsWith('actionType')) return 'ACTION_TYPE';
  if (path.endsWith('factionId') || path.endsWith('.role') || path.endsWith('role')) return 'FACTION';
  if (message.includes('duplicate')) return 'DUPLICATE';
  return 'SCHEMA';
}

/**
 * @param {object[]} errors
 * @param {{ path: string, message: string }[]} schemaErrors
 * @param {string} prefix
 * @param {string} collectionPath
 */
function pushSchema(errors, schemaErrors, prefix, collectionPath) {
  for (const schemaError of schemaErrors) {
    const path = rebase(schemaError.path, prefix, collectionPath);
    const code = codeForSchema(schemaError.message, path);
    if (
      code === 'FACTION' &&
      schemaError.message === 'unknown factionId' &&
      errors.some((item) => item.code === 'FACTION' && item.path === path)
    ) {
      continue;
    }
    errors.push(issue(code, path, schemaError.message));
  }
}

/**
 * @param {object[]} records
 * @param {string} idKey
 * @param {string} collection
 * @param {Map<string, string>} seen
 * @param {object[]} errors
 */
function pushDuplicateIds(records, idKey, collection, seen, errors) {
  records.forEach((record, index) => {
    const id = record?.[idKey];
    if (typeof id !== 'string' || id.length === 0) return;
    const path = `${collection}[${index}].${idKey}`;
    const previous = seen.get(id);
    if (previous) {
      errors.push(issue('DUPLICATE', path, `Duplicate ${idKey} "${id}" (also at ${previous})`));
      return;
    }
    seen.set(id, path);
  });
}

/**
 * @param {object | null | undefined} manifest
 */
function indexManifest(manifest) {
  const byId = new Map();
  const assets = manifest && Array.isArray(manifest.assets) ? manifest.assets : [];
  for (const entry of assets) {
    if (!entry || typeof entry.asset_id !== 'string' || entry.asset_id.length === 0) continue;
    if (!byId.has(entry.asset_id)) byId.set(entry.asset_id, entry);
  }
  return byId;
}

/**
 * @param {object[]} errors
 * @param {string} path
 * @param {unknown} assetId
 * @param {Map<string, object> | null} byId
 * @param {Map<string, number>} statusCounts
 */
function checkAsset(errors, path, assetId, byId, statusCounts) {
  if (typeof assetId !== 'string' || assetId.length === 0) return;
  if (!byId) return;
  const entry = byId.get(assetId);
  if (!entry) {
    errors.push(issue('ASSET_REF', path, `Asset "${assetId}" is not in the manifest`));
    return;
  }
  if (typeof entry.status === 'string') {
    statusCounts.set(entry.status, (statusCounts.get(entry.status) ?? 0) + 1);
  }
}

function emptyMaterialized() {
  return { avatars: [], avatarCards: [], actionCards: [], equipment: [] };
}

/**
 * @param {object} options
 * @param {object[]} errors
 * @param {string[]} notes
 * @param {object | null} manifest
 * @param {ReturnType<typeof emptyMaterialized>} materialized
 */
function buildReport(options, errors, notes, manifest, materialized) {
  const partial = Boolean(
    manifest &&
      typeof manifest.source_asset_count === 'number' &&
      Array.isArray(manifest.assets) &&
      manifest.assets.length < manifest.source_asset_count,
  );
  return {
    ok: errors.length === 0,
    sources: options.sources ?? [],
    manifest: {
      checked: Boolean(manifest),
      path: options.manifestPath ?? null,
      assetCount: manifest && Array.isArray(manifest.assets) ? manifest.assets.length : 0,
      partial,
      sourceAssetCount: partial ? manifest.source_asset_count : null,
    },
    counts: {
      avatars: materialized.avatars.length,
      avatarCards: materialized.avatarCards.length,
      actionCards: materialized.actionCards.length,
      equipment: materialized.equipment.length,
    },
    errors,
    warnings: [],
    notes,
  };
}

/**
 * @param {object} catalog Raw or already flat catalog. This function materializes templates.
 * @param {{ templates: { resolve: Function }, manifest?: object | null, manifestPath?: string | null, sources?: string[] }} options
 */
export function validateCatalog(catalog, options) {
  const errors = [];
  const notes = [];
  let materialized;
  try {
    materialized = materializeCatalog(catalog, options.templates);
  } catch (error) {
    const report = buildReport(
      options,
      [issue('TEMPLATE', 'catalog', error.message)],
      notes,
      options.manifest ?? null,
      emptyMaterialized(),
    );
    return { report, materialized: emptyMaterialized() };
  }
  const avatarIds = new Set(
    materialized.avatars
      .filter((record) => record && typeof record.avatarId === 'string')
      .map((record) => record.avatarId),
  );
  const checkAvatarMembership =
    Boolean(catalog.hasAvatars) || Object.prototype.hasOwnProperty.call(catalog, 'avatars');

  materialized.avatars.forEach((avatar, index) => {
    const path = `avatars[${index}]`;
    const parsed = parseAvatarId(avatar?.avatarId);
    if (!parsed.ok) {
      errors.push(
        issue(
          'AVATAR_ID',
          `${path}.avatarId`,
          'Character ID must match AVT_<FAC>_NNN, with FAC one of AEG, PHA, CEL, SAN and NNN three digits',
        ),
      );
    } else if (factionCodeMismatch(avatar.factionId, parsed.code)) {
      errors.push(
        issue(
          'AVATAR_ID',
          `${path}.avatarId`,
          `Character ID faction ${parsed.code} does not match factionId "${avatar.factionId}"`,
        ),
      );
    }
    if (avatar && typeof avatar.factionId === 'string' && !FACTION_RECORDS.some((record) => record.factionId === avatar.factionId)) {
      errors.push(issue('FACTION', `${path}.factionId`, `Unknown faction. Official factions: ${FACTION_LIST}`));
    }
    pushSchema(errors, validateAvatar(avatar), 'avatar', path);
  });

  materialized.avatarCards.forEach((card, index) => {
    const path = `avatarCards[${index}]`;
    if (typeof card?.cardId !== 'string' || !AVATAR_CARD_ID_PATTERN.test(card.cardId)) {
      errors.push(
        issue('CARD_ID', `${path}.cardId`, 'Avatar card ID must match AVC_AVT_<FAC>_NNN (AVC_ plus the character ID)'),
      );
    } else if (typeof card.avatarId === 'string' && card.cardId !== `AVC_${card.avatarId}`) {
      errors.push(issue('CARD_ID', `${path}.cardId`, `Avatar card ID must be AVC_${card.avatarId}`));
    }
    const avatarId = parseAvatarId(card?.avatarId);
    if (!avatarId.ok) {
      errors.push(
        issue('AVATAR_ID', `${path}.avatarId`, 'Avatar card avatarId must match AVT_<FAC>_NNN'),
      );
    } else if (factionCodeMismatch(card.factionId, avatarId.code)) {
      errors.push(
        issue('AVATAR_ID', `${path}.avatarId`, `Character ID faction ${avatarId.code} does not match factionId "${card.factionId}"`),
      );
    }
    if (checkAvatarMembership && typeof card?.avatarId === 'string' && !avatarIds.has(card.avatarId)) {
      errors.push(issue('BROKEN_REF', `${path}.avatarId`, `Avatar "${card.avatarId}" is not in this catalog`));
    }
    if (card && typeof card.factionId === 'string' && !FACTION_RECORDS.some((record) => record.factionId === card.factionId)) {
      errors.push(issue('FACTION', `${path}.factionId`, `Unknown faction. Official factions: ${FACTION_LIST}`));
    }
    pushSchema(errors, validateAvatarCard(card), 'avatarCard', path);
  });

  materialized.actionCards.forEach((card, index) => {
    const path = `actionCards[${index}]`;
    if (typeof card?.cardId !== 'string' || !ACTION_CARD_ID_PATTERN.test(card.cardId)) {
      errors.push(
        issue(
          'CARD_ID',
          `${path}.cardId`,
          'Action card ID must match ACT_<TOKEN> (uppercase, matching the shipped schema samples). The schema itself only requires a non-empty string.',
        ),
      );
    }
    pushSchema(errors, validateActionCard(card), 'actionCard', path);
  });

  const equipmentIds = new Set(
    materialized.equipment
      .filter((record) => record && typeof record.equipmentId === 'string')
      .map((record) => record.equipmentId),
  );

  materialized.equipment.forEach((item, index) => {
    const path = `equipment[${index}]`;
    if (typeof item?.equipmentId !== 'string' || !EQUIPMENT_ID_PATTERN.test(item.equipmentId)) {
      errors.push(issue('EQUIPMENT_ID', `${path}.equipmentId`, 'Equipment ID must match EQ_<TOKEN>'));
    } else {
      const code = equipmentFactionCode(item.equipmentId);
      if (code) {
        const native = parseAvatarId(item.nativeAvatarId);
        if (!native.ok || native.code !== code) {
          errors.push(
            issue(
              'EQUIPMENT_ID',
              `${path}.nativeAvatarId`,
              `Equipment ID "${item.equipmentId}" uses faction ${code}, so nativeAvatarId must be an AVT_${code}_NNN id`,
            ),
          );
        }
      } else if (item.nativeAvatarId !== null && item.nativeAvatarId !== undefined && !parseAvatarId(item.nativeAvatarId).ok) {
        errors.push(issue('AVATAR_ID', `${path}.nativeAvatarId`, 'nativeAvatarId must be null or AVT_<FAC>_NNN'));
      }
    }
    if (checkAvatarMembership && typeof item?.nativeAvatarId === 'string' && !avatarIds.has(item.nativeAvatarId)) {
      errors.push(
        issue('BROKEN_REF', `${path}.nativeAvatarId`, `Avatar "${item.nativeAvatarId}" is not in this catalog`),
      );
    }
    if (item?.variantOf !== null && item?.variantOf !== undefined) {
      if (typeof item.variantOf !== 'string' || !EQUIPMENT_ID_PATTERN.test(item.variantOf)) {
        errors.push(issue('EQUIPMENT_ID', `${path}.variantOf`, 'variantOf must be null or an EQ_ equipment ID'));
      } else if (item.variantOf === item.equipmentId) {
        errors.push(issue('BROKEN_REF', `${path}.variantOf`, 'variantOf cannot point at the same equipment ID'));
      } else if (!equipmentIds.has(item.variantOf)) {
        errors.push(
          issue('BROKEN_REF', `${path}.variantOf`, `variantOf "${item.variantOf}" is not an equipment ID in this catalog`),
        );
      }
    }
    pushSchema(errors, validateEquipment(item), 'equipment', path);
  });

  pushDuplicateIds(materialized.avatars, 'avatarId', 'avatars', new Map(), errors);
  const cardIds = new Map();
  pushDuplicateIds(materialized.avatarCards, 'cardId', 'avatarCards', cardIds, errors);
  pushDuplicateIds(materialized.actionCards, 'cardId', 'actionCards', cardIds, errors);
  pushDuplicateIds(materialized.equipment, 'equipmentId', 'equipment', new Map(), errors);

  const manifest = options.manifest ?? null;
  const statusCounts = new Map();
  if (manifest) {
    const manifestErrors = validateAssetManifest(manifest);
    for (const manifestError of manifestErrors) {
      errors.push(issue('MANIFEST', manifestError.path, manifestError.message));
    }
    const byId = indexManifest(manifest);
    materialized.avatars.forEach((avatar, index) => {
      const assetIds = avatar?.assetIds;
      if (!assetIds || typeof assetIds !== 'object') return;
      for (const [key, assetId] of Object.entries(assetIds)) {
        checkAsset(errors, `avatars[${index}].assetIds.${key}`, assetId, byId, statusCounts);
      }
    });
    materialized.avatarCards.forEach((card, index) => {
      checkAsset(errors, `avatarCards[${index}].assetId`, card?.assetId, byId, statusCounts);
    });
    materialized.equipment.forEach((item, index) => {
      checkAsset(errors, `equipment[${index}].assetId`, item?.assetId, byId, statusCounts);
    });
    if ([...statusCounts.keys()].some((status) => status === 'CONCEPT' || status === 'PROTOTYPE')) {
      notes.push(
        'Referenced assets include CONCEPT or PROTOTYPE art. This report does not mark content PRODUCTION_READY.',
      );
    }
  }

  if (
    manifest &&
    typeof manifest.source_asset_count === 'number' &&
    Array.isArray(manifest.assets) &&
    manifest.assets.length < manifest.source_asset_count
  ) {
    const source = manifest._snapshot?.source_file ?? 'docs/ASSET_MANIFEST.json';
    const commit = manifest._snapshot?.source_commit ?? 'the art branch';
    notes.push(
      `Manifest has ${manifest.assets.length} of ${manifest.source_asset_count} assets (${source} @ ${commit}). IDs absent from this file are reported as missing. Point --manifest at docs/ASSET_MANIFEST.json on feat/card-art-prototype-mira for the full set.`,
    );
  }

  return { report: buildReport(options, errors, notes, manifest, materialized), materialized };
}

/**
 * @param {string} file
 */
export function readManifest(file) {
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read manifest ${file}: ${error.message}`);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`Manifest ${file} must be a JSON object`);
  }
  return data;
}
