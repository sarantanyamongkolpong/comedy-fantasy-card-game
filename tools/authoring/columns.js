/** CLI kind names. Schema kinds use underscores; files and flags use hyphens. */
export const KIND_ALIASES = Object.freeze({
  avatar: 'avatar',
  avatars: 'avatar',
  'avatar-card': 'avatar-card',
  'avatar-cards': 'avatar-card',
  avatar_card: 'avatar-card',
  'action-card': 'action-card',
  'action-cards': 'action-card',
  action_card: 'action-card',
  equipment: 'equipment',
});

export const COLLECTION_BY_KIND = Object.freeze({
  avatar: 'avatars',
  'avatar-card': 'avatarCards',
  'action-card': 'actionCards',
  equipment: 'equipment',
});

export const KIND_BY_COLLECTION = Object.freeze({
  avatars: 'avatar',
  avatarCards: 'avatar-card',
  actionCards: 'action-card',
  equipment: 'equipment',
});

/**
 * Fixed CSV columns per kind. Dotted names are nested schema fields.
 * JSON columns hold an object or an array. Empty scalar cells become null on import.
 */
export const COLUMNS = Object.freeze({
  avatar: Object.freeze([
    'avatarId',
    'nameEn',
    'nameTh',
    'factionId',
    'role',
    'rigId',
    'stats.pow',
    'stats.def',
    'stats.spd',
    'stats.valueStatus',
    'rarity',
    'assetIds',
  ]),
  'avatar-card': Object.freeze([
    'cardId',
    'cardKind',
    'avatarId',
    'nameEn',
    'nameTh',
    'factionId',
    'role',
    'rarity',
    'stats.pow',
    'stats.def',
    'stats.spd',
    'stats.valueStatus',
    'assetId',
  ]),
  'action-card': Object.freeze([
    'cardId',
    'cardKind',
    'actionType',
    'name',
    'apCost',
    'costStatus',
    'effectId',
    'rarity',
    'labels',
  ]),
  equipment: Object.freeze([
    'equipmentId',
    'slot',
    'nativeAvatarId',
    'assetId',
    'variantOf',
    'statModifiers.pow',
    'statModifiers.def',
    'statModifiers.spd',
    'statModifiers.valueStatus',
    'upgrade',
    'upgradeStatus',
  ]),
});

/** Cells in these columns are JSON text. An empty cell omits the key; the token null stays null. */
export const JSON_COLUMNS = new Set(['assetIds', 'labels']);

/**
 * Numeric schema fields. An empty cell stays null. The digit string "0" stays 0.
 * Any other token, including "TBD", is kept as a string so it is not coerced.
 */
export const NUMERIC_COLUMNS = new Set([
  'stats.pow',
  'stats.def',
  'stats.spd',
  'statModifiers.pow',
  'statModifiers.def',
  'statModifiers.spd',
  'apCost',
  'upgrade',
]);

/**
 * @param {string} kind
 * @returns {'avatar' | 'avatar-card' | 'action-card' | 'equipment'}
 */
export function normalizeKind(kind) {
  const normalized = KIND_ALIASES[kind];
  if (!normalized) {
    throw new Error(`Unknown kind "${kind}". Expected avatar, avatar-card, action-card, or equipment.`);
  }
  return normalized;
}
