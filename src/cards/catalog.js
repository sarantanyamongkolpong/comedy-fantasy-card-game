import { SAMPLE_AVATARS } from '../avatars/catalog.js';

export { DEMO_ENEMY_TEAM, DEMO_MIXED_DECK, V05_STARTER_ACTIONS } from '../schema/v05-samples.js';

function tbdStats() {
  return { pow: null, def: null, spd: null, valueStatus: 'TBD' };
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/** One avatar card per starter avatar. Rarity and stats stay TBD. */
export const SAMPLE_AVATAR_CARDS = deepFreeze(
  SAMPLE_AVATARS.map((avatar) => ({
    cardId: `AVC_${avatar.avatarId}`,
    cardKind: 'avatar_card',
    avatarId: avatar.avatarId,
    nameEn: avatar.nameEn,
    nameTh: avatar.nameTh,
    factionId: avatar.factionId,
    role: avatar.role,
    rarity: null,
    stats: tbdStats(),
    assetId: avatar.assetIds.cardArt,
  })),
);

/**
 * Structural action-card samples. Names, costs, and effects are null.
 * These ids are schema examples, not a designed card list.
 */
export const SAMPLE_ACTION_CARDS = deepFreeze([
  {
    cardId: 'ACT_SCHEMA_ATK',
    cardKind: 'action_card',
    actionType: 'ATK',
    name: null,
    apCost: null,
    costStatus: 'TBD',
    effectId: null,
    rarity: null,
    labels: ['SCHEMA_SAMPLE', 'TBD'],
  },
  {
    cardId: 'ACT_SCHEMA_DEF',
    cardKind: 'action_card',
    actionType: 'DEF',
    name: null,
    apCost: null,
    costStatus: 'TBD',
    effectId: null,
    rarity: null,
    labels: ['SCHEMA_SAMPLE', 'TBD'],
  },
  {
    cardId: 'ACT_SCHEMA_SKILL',
    cardKind: 'action_card',
    actionType: 'Skill',
    name: null,
    apCost: null,
    costStatus: 'TBD',
    effectId: null,
    rarity: null,
    labels: ['SCHEMA_SAMPLE', 'TBD'],
  },
]);
