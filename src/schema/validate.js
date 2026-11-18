import {
  ASSET_STATUSES,
  CARD_ACTION_TYPES,
  FACTION_RECORDS,
  STAT_KEYS,
  SUBJECT_KINDS,
  VARIANT_KINDS,
} from './constants.js';

/**
 * @param {string} path
 * @param {string} message
 */
function issue(path, message) {
  return { path, message };
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function unknownKeys(object, allowed, path, errors) {
  for (const key of Object.keys(object)) {
    if (!allowed.has(key)) {
      errors.push(issue(`${path}.${key}`, `unknown field "${key}"`));
    }
  }
}

/**
 * @param {unknown} stats
 * @param {string} [path]
 * @returns {{ path: string, message: string }[]}
 */
export function validateStats(stats, path = 'stats') {
  const errors = [];
  if (!isObject(stats)) {
    return [issue(path, 'stats must be an object with pow, def, spd, and valueStatus')];
  }
  unknownKeys(stats, new Set([...STAT_KEYS, 'valueStatus']), path, errors);
  for (const key of STAT_KEYS) {
    const value = stats[key];
    const ok = value === null || (Number.isInteger(value) && value >= 0);
    if (!ok) {
      errors.push(issue(`${path}.${key}`, 'must be null or a non-negative integer'));
    }
  }
  if (stats.valueStatus !== 'TBD' && stats.valueStatus !== 'SET') {
    errors.push(issue(`${path}.valueStatus`, 'must be "TBD" or "SET"'));
    return errors;
  }
  const numeric = STAT_KEYS.filter((key) => typeof stats[key] === 'number');
  const empty = STAT_KEYS.filter((key) => stats[key] === null);
  if (stats.valueStatus === 'TBD' && numeric.length > 0) {
    errors.push(issue(path, 'TBD stats must keep pow, def, and spd null'));
  }
  if (stats.valueStatus === 'SET' && empty.length > 0) {
    errors.push(issue(path, 'SET stats must provide pow, def, and spd'));
  }
  return errors;
}

/**
 * @param {unknown} faction
 * @param {string} [path]
 */
export function validateFaction(faction, path = 'faction') {
  const errors = [];
  if (!isObject(faction)) return [issue(path, 'faction must be an object')];
  unknownKeys(faction, new Set(['factionId', 'name', 'role']), path, errors);
  const known = FACTION_RECORDS.find((record) => record.factionId === faction.factionId);
  if (!known) {
    errors.push(issue(`${path}.factionId`, 'unknown factionId'));
    return errors;
  }
  if (faction.name !== known.name) {
    errors.push(issue(`${path}.name`, `faction name must stay "${known.name}"`));
  }
  if (faction.role !== known.role) {
    errors.push(issue(`${path}.role`, `role must stay "${known.role}"`));
  }
  return errors;
}

function validateRarity(rarity, path, errors) {
  if (rarity === null) return;
  if (typeof rarity !== 'string' || rarity.length === 0) {
    errors.push(issue(path, 'rarity must be null until a scale exists, or a non-empty string'));
  }
}

/**
 * @param {unknown} avatar
 * @param {string} [path]
 */
export function validateAvatar(avatar, path = 'avatar') {
  const errors = [];
  if (!isObject(avatar)) return [issue(path, 'avatar must be an object')];
  unknownKeys(
    avatar,
    new Set(['avatarId', 'nameEn', 'nameTh', 'factionId', 'role', 'rigId', 'stats', 'rarity', 'assetIds']),
    path,
    errors,
  );
  if (typeof avatar.avatarId !== 'string' || !/^AVT_[A-Z0-9_]+$/.test(avatar.avatarId)) {
    errors.push(issue(`${path}.avatarId`, 'avatarId must look like AVT_AEG_001'));
  }
  if (typeof avatar.nameEn !== 'string' || avatar.nameEn.length === 0) {
    errors.push(issue(`${path}.nameEn`, 'nameEn is required'));
  }
  if (typeof avatar.nameTh !== 'string' || avatar.nameTh.length === 0) {
    errors.push(issue(`${path}.nameTh`, 'nameTh is required'));
  }
  const faction = FACTION_RECORDS.find((record) => record.factionId === avatar.factionId);
  if (!faction) {
    errors.push(issue(`${path}.factionId`, 'unknown factionId'));
  } else if (avatar.role !== faction.role) {
    errors.push(issue(`${path}.role`, `role must be ${faction.role} for ${faction.name}`));
  }
  errors.push(...validateStats(avatar.stats, `${path}.stats`));
  validateRarity(avatar.rarity, `${path}.rarity`, errors);
  if (avatar.rigId !== undefined && (typeof avatar.rigId !== 'string' || avatar.rigId.length === 0)) {
    errors.push(issue(`${path}.rigId`, 'rigId must be a non-empty string when present'));
  }
  if (avatar.assetIds !== undefined) {
    if (!isObject(avatar.assetIds)) {
      errors.push(issue(`${path}.assetIds`, 'assetIds must be an object of asset id strings'));
    } else {
      for (const [key, value] of Object.entries(avatar.assetIds)) {
        if (typeof value !== 'string' || value.length === 0) {
          errors.push(issue(`${path}.assetIds.${key}`, 'asset id must be a non-empty string'));
        }
      }
    }
  }
  return errors;
}

/**
 * @param {unknown} card
 * @param {string} [path]
 */
export function validateAvatarCard(card, path = 'avatarCard') {
  const errors = [];
  if (!isObject(card)) return [issue(path, 'avatar card must be an object')];
  unknownKeys(
    card,
    new Set(['cardId', 'cardKind', 'avatarId', 'nameEn', 'nameTh', 'factionId', 'role', 'rarity', 'stats', 'assetId']),
    path,
    errors,
  );
  if (card.cardKind !== 'avatar_card') {
    errors.push(issue(`${path}.cardKind`, 'cardKind must be "avatar_card"'));
  }
  if (typeof card.cardId !== 'string' || card.cardId.length === 0) {
    errors.push(issue(`${path}.cardId`, 'cardId is required'));
  }
  if (typeof card.avatarId !== 'string' || card.avatarId.length === 0) {
    errors.push(issue(`${path}.avatarId`, 'avatarId is required'));
  }
  if (typeof card.nameEn !== 'string' || card.nameEn.length === 0) {
    errors.push(issue(`${path}.nameEn`, 'nameEn is required'));
  }
  if (typeof card.nameTh !== 'string' || card.nameTh.length === 0) {
    errors.push(issue(`${path}.nameTh`, 'nameTh is required'));
  }
  const faction = FACTION_RECORDS.find((record) => record.factionId === card.factionId);
  if (!faction) {
    errors.push(issue(`${path}.factionId`, 'unknown factionId'));
  } else if (card.role !== faction.role) {
    errors.push(issue(`${path}.role`, `role must be ${faction.role} for ${faction.name}`));
  }
  errors.push(...validateStats(card.stats, `${path}.stats`));
  validateRarity(card.rarity, `${path}.rarity`, errors);
  if (typeof card.assetId !== 'string' || card.assetId.length === 0) {
    errors.push(issue(`${path}.assetId`, 'assetId is required'));
  }
  return errors;
}

/**
 * @param {unknown} card
 * @param {string} [path]
 */
export function validateActionCard(card, path = 'actionCard') {
  const errors = [];
  if (!isObject(card)) return [issue(path, 'action card must be an object')];
  unknownKeys(
    card,
    new Set(['cardId', 'cardKind', 'actionType', 'name', 'apCost', 'costStatus', 'effectId', 'rarity', 'labels']),
    path,
    errors,
  );
  if (card.cardKind !== 'action_card') {
    errors.push(issue(`${path}.cardKind`, 'cardKind must be "action_card"'));
  }
  if (typeof card.cardId !== 'string' || card.cardId.length === 0) {
    errors.push(issue(`${path}.cardId`, 'cardId is required'));
  }
  if (!CARD_ACTION_TYPES.includes(card.actionType)) {
    errors.push(issue(`${path}.actionType`, 'actionType must be ATK, DEF, or Skill'));
  }
  if (card.name !== null && typeof card.name !== 'string') {
    errors.push(issue(`${path}.name`, 'name must be null or a string'));
  }
  const costOk = card.apCost === null || (Number.isInteger(card.apCost) && card.apCost >= 0);
  if (!costOk) {
    errors.push(issue(`${path}.apCost`, 'apCost must be null or a non-negative integer'));
  }
  if (card.apCost === null && card.costStatus !== 'TBD') {
    errors.push(issue(`${path}.costStatus`, 'null apCost requires costStatus "TBD"'));
  }
  if (typeof card.apCost === 'number' && card.costStatus !== 'SET') {
    errors.push(issue(`${path}.costStatus`, 'numeric apCost requires costStatus "SET"'));
  }
  if (card.effectId !== null && (typeof card.effectId !== 'string' || card.effectId.length === 0)) {
    errors.push(issue(`${path}.effectId`, 'effectId must be null or a non-empty string'));
  }
  validateRarity(card.rarity, `${path}.rarity`, errors);
  if (card.labels !== undefined) {
    if (!Array.isArray(card.labels) || card.labels.some((label) => typeof label !== 'string')) {
      errors.push(issue(`${path}.labels`, 'labels must be an array of strings'));
    }
  }
  return errors;
}

/**
 * @param {unknown} equipment
 * @param {string} [path]
 */
export function validateEquipment(equipment, path = 'equipment') {
  const errors = [];
  if (!isObject(equipment)) return [issue(path, 'equipment must be an object')];
  unknownKeys(
    equipment,
    new Set([
      'equipmentId',
      'slot',
      'nativeAvatarId',
      'assetId',
      'variantOf',
      'statModifiers',
      'upgrade',
      'upgradeStatus',
    ]),
    path,
    errors,
  );
  if (typeof equipment.equipmentId !== 'string' || equipment.equipmentId.length === 0) {
    errors.push(issue(`${path}.equipmentId`, 'equipmentId is required'));
  }
  if (typeof equipment.slot !== 'string' || equipment.slot.length === 0) {
    errors.push(issue(`${path}.slot`, 'slot is required'));
  }
  if (equipment.nativeAvatarId !== null && typeof equipment.nativeAvatarId !== 'string') {
    errors.push(issue(`${path}.nativeAvatarId`, 'nativeAvatarId must be null or a string'));
  }
  if (typeof equipment.assetId !== 'string' || equipment.assetId.length === 0) {
    errors.push(issue(`${path}.assetId`, 'assetId is required'));
  }
  if (equipment.variantOf !== null && (typeof equipment.variantOf !== 'string' || equipment.variantOf.length === 0)) {
    errors.push(issue(`${path}.variantOf`, 'variantOf must be null or an equipment id'));
  }
  errors.push(...validateStats(equipment.statModifiers, `${path}.statModifiers`));
  if (equipment.upgrade !== null) {
    errors.push(issue(`${path}.upgrade`, 'upgrade formulas are BLOCKED_BY_DESIGN (Q-UPGRADE); upgrade must be null'));
  }
  if (equipment.upgradeStatus !== 'BLOCKED_BY_DESIGN') {
    errors.push(issue(`${path}.upgradeStatus`, 'upgradeStatus must be "BLOCKED_BY_DESIGN"'));
  }
  return errors;
}

/**
 * @param {unknown} ownership
 * @param {string} [path]
 */
export function validateOwnership(ownership, path = 'ownership') {
  const errors = [];
  if (!isObject(ownership)) return [issue(path, 'ownership must be an object')];
  unknownKeys(
    ownership,
    new Set(['ownershipId', 'ownerId', 'subjectKind', 'subjectId', 'quantity', 'source', 'sourceStatus']),
    path,
    errors,
  );
  if (typeof ownership.ownershipId !== 'string' || ownership.ownershipId.length === 0) {
    errors.push(issue(`${path}.ownershipId`, 'ownershipId is required'));
  }
  if (typeof ownership.ownerId !== 'string' || ownership.ownerId.length === 0) {
    errors.push(issue(`${path}.ownerId`, 'ownerId is required'));
  }
  if (!SUBJECT_KINDS.includes(ownership.subjectKind)) {
    errors.push(issue(`${path}.subjectKind`, `subjectKind must be one of ${SUBJECT_KINDS.join(', ')}`));
  }
  if (typeof ownership.subjectId !== 'string' || ownership.subjectId.length === 0) {
    errors.push(issue(`${path}.subjectId`, 'subjectId is required'));
  }
  const quantityOk = ownership.quantity === null || (Number.isInteger(ownership.quantity) && ownership.quantity >= 1);
  if (!quantityOk) {
    errors.push(issue(`${path}.quantity`, 'quantity must be null or an integer >= 1'));
  }
  if (ownership.source !== null) {
    errors.push(issue(`${path}.source`, 'acquisition source is TBD; source must be null (Q-GACHA)'));
  }
  if (ownership.sourceStatus !== 'TBD') {
    errors.push(issue(`${path}.sourceStatus`, 'sourceStatus must be "TBD"'));
  }
  return errors;
}

/**
 * @param {unknown} variant
 * @param {string} [path]
 */
export function validateVariant(variant, path = 'variant') {
  const errors = [];
  if (!isObject(variant)) return [issue(path, 'variant must be an object')];
  unknownKeys(
    variant,
    new Set(['variantId', 'baseId', 'subjectKind', 'label', 'assetId', 'status']),
    path,
    errors,
  );
  if (typeof variant.variantId !== 'string' || variant.variantId.length === 0) {
    errors.push(issue(`${path}.variantId`, 'variantId is required'));
  }
  if (typeof variant.baseId !== 'string' || variant.baseId.length === 0) {
    errors.push(issue(`${path}.baseId`, 'baseId is required'));
  }
  if (!VARIANT_KINDS.includes(variant.subjectKind)) {
    errors.push(issue(`${path}.subjectKind`, `subjectKind must be one of ${VARIANT_KINDS.join(', ')}`));
  }
  if (variant.label !== null && (typeof variant.label !== 'string' || variant.label.length === 0)) {
    errors.push(issue(`${path}.label`, 'label must be null or a non-empty string'));
  }
  if (typeof variant.assetId !== 'string' || variant.assetId.length === 0) {
    errors.push(issue(`${path}.assetId`, 'assetId is required'));
  }
  if (!ASSET_STATUSES.includes(variant.status)) {
    errors.push(issue(`${path}.status`, `status must be one of ${ASSET_STATUSES.join(', ')}`));
  }
  return errors;
}

/**
 * Asset manifest entry. Extra art fields (pivot, anchors, sha256, …) are allowed.
 * @param {unknown} entry
 * @param {string} [path]
 */
export function validateAssetManifestEntry(entry, path = 'asset') {
  const errors = [];
  if (!isObject(entry)) return [issue(path, 'manifest entry must be an object')];
  for (const key of ['asset_id', 'path', 'type', 'owner']) {
    if (typeof entry[key] !== 'string' || entry[key].length === 0) {
      errors.push(issue(`${path}.${key}`, `${key} must be a non-empty string`));
    }
  }
  if (!ASSET_STATUSES.includes(entry.status)) {
    errors.push(issue(`${path}.status`, `status must be one of ${ASSET_STATUSES.join(', ')}`));
  }
  return errors;
}

/**
 * @param {unknown} manifest
 */
export function validateAssetManifest(manifest) {
  const errors = [];
  if (!isObject(manifest)) return [issue('manifest', 'manifest must be an object')];
  if (!Array.isArray(manifest.assets)) {
    return [issue('manifest.assets', 'assets must be an array')];
  }
  const seen = new Set();
  manifest.assets.forEach((entry, index) => {
    const entryErrors = validateAssetManifestEntry(entry, `assets[${index}]`);
    errors.push(...entryErrors);
    if (entry && typeof entry.asset_id === 'string') {
      if (seen.has(entry.asset_id)) {
        errors.push(issue(`assets[${index}].asset_id`, `duplicate asset_id "${entry.asset_id}"`));
      }
      seen.add(entry.asset_id);
    }
  });
  return errors;
}

/**
 * @param {{ path: string, message: string }[]} errors
 */
export function validationResult(errors) {
  return { ok: errors.length === 0, errors };
}
