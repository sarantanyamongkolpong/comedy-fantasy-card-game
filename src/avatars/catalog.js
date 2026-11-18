import { FACTION_RECORDS } from '../schema/constants.js';

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

/** @type {readonly { factionId: string, name: string, role: string }[]} */
export const FACTIONS = FACTION_RECORDS;

/**
 * First four avatars. Stats and rarity are null / TBD.
 * Rig ids match the art branch; they are identity data, not combat numbers.
 */
export const SAMPLE_AVATARS = deepFreeze([
  {
    avatarId: 'AVT_AEG_001',
    nameEn: 'Sir Potlid',
    nameTh: 'เซอร์ฝาหม้อ',
    factionId: 'FAC_AEG',
    role: 'Tank',
    rigId: 'humanoid_heavy',
    stats: tbdStats(),
    rarity: null,
    assetIds: {
      cardArt: 'CARD_AVT_AEG_001_card_v1',
      cardArtVariantGoldpot: 'CARD_AVT_AEG_001_card_v1_variant_goldpot',
    },
  },
  {
    avatarId: 'AVT_PHA_001',
    nameEn: 'Nox Squeak',
    nameTh: 'น็อกซ์ รองเท้าดัง',
    factionId: 'FAC_PHA',
    role: 'DPS',
    rigId: 'humanoid_standard',
    stats: tbdStats(),
    rarity: null,
    assetIds: {
      cardArt: 'CARD_AVT_PHA_001_card_v1',
    },
  },
  {
    avatarId: 'AVT_CEL_001',
    nameEn: 'Madame Meteor',
    nameTh: 'มาดามดาวตก',
    factionId: 'FAC_CEL',
    role: 'Magic',
    rigId: 'humanoid_standard',
    stats: tbdStats(),
    rarity: null,
    assetIds: {
      cardArt: 'CARD_AVT_CEL_001_card_v1',
    },
  },
  {
    avatarId: 'AVT_SAN_001',
    nameEn: 'Sister Plaster',
    nameTh: 'ซิสเตอร์พลาสเตอร์',
    factionId: 'FAC_SAN',
    role: 'Support',
    rigId: 'humanoid_standard',
    stats: tbdStats(),
    rarity: null,
    assetIds: {
      cardArt: 'CARD_AVT_SAN_001_card_v1',
    },
  },
]);

/**
 * Equipment identity records. Stat modifiers stay null.
 * The gold pot helmet is a variant of the silver one, matching the art items file.
 */
export const SAMPLE_EQUIPMENT = deepFreeze([
  {
    equipmentId: 'EQ_AEG_POT_HELMET_SILVER_001',
    slot: 'headgear',
    nativeAvatarId: 'AVT_AEG_001',
    assetId: 'EQ_AEG_POT_HELMET_SILVER_001',
    variantOf: null,
    statModifiers: tbdStats(),
    upgrade: null,
    upgradeStatus: 'BLOCKED_BY_DESIGN',
  },
  {
    equipmentId: 'EQ_AEG_POT_HELMET_GOLD_001',
    slot: 'headgear',
    nativeAvatarId: 'AVT_AEG_001',
    assetId: 'EQ_AEG_POT_HELMET_GOLD_001',
    variantOf: 'EQ_AEG_POT_HELMET_SILVER_001',
    statModifiers: tbdStats(),
    upgrade: null,
    upgradeStatus: 'BLOCKED_BY_DESIGN',
  },
  {
    equipmentId: 'EQ_STAFF_NEUTRAL_001',
    slot: 'main_hand',
    nativeAvatarId: null,
    assetId: 'EQ_STAFF_NEUTRAL_001',
    variantOf: null,
    statModifiers: tbdStats(),
    upgrade: null,
    upgradeStatus: 'BLOCKED_BY_DESIGN',
  },
]);

/** Variants known from the art manifest. Status values are copied from that manifest. */
export const SAMPLE_VARIANTS = deepFreeze([
  {
    variantId: 'VAR_EQ_AEG_POT_HELMET_GOLD_001',
    baseId: 'EQ_AEG_POT_HELMET_SILVER_001',
    subjectKind: 'equipment',
    label: 'gold',
    assetId: 'EQ_AEG_POT_HELMET_GOLD_001',
    status: 'PROTOTYPE',
  },
  {
    variantId: 'VAR_CARD_AVT_AEG_001_GOLDPOT',
    baseId: 'CARD_AVT_AEG_001_card_v1',
    subjectKind: 'card_art',
    label: 'goldpot',
    assetId: 'CARD_AVT_AEG_001_card_v1_variant_goldpot',
    status: 'CONCEPT',
  },
]);
