import {
  ACTION_RARITIES,
  AP_COST_MAX,
  AP_COST_MIN,
  AVATAR_RARITIES,
  BASE_AP,
  COMPANION_EPIC_PITY_PULLS,
  DECK_SIZE,
  EPIC_PITY_PULLS,
  FACTION_RECORDS,
  HAND_SIZE,
  MAX_AVATAR_LEVEL,
  OWNER_EVIDENCE_T253U,
  OWNER_EVIDENCE_T261U,
  PARTY_SIZE,
  POW_TO_ATK,
  TOP_PITY_PULLS,
  VOLUNTARY_DISCARD_AP,
} from '../schema/constants.js';

/**
 * A rule value plus the sheet status. PENDING_OWNER values stay null.
 * @param {unknown} value
 * @param {'LOCKED' | 'PROPOSED' | 'PLACEHOLDER' | 'PENDING_OWNER'} status
 * @param {string} rule
 * @param {Record<string, unknown>} [extra]
 */
function flag(value, status, rule, extra = {}) {
  return { value, status, rule, ...extra };
}

function pending(rule, extra = {}) {
  return flag(null, 'PENDING_OWNER', rule, extra);
}

/**
 * Default rule config for stream A and the data layer.
 * Each call returns a new object so callers can read it without sharing mutations.
 * LOCKED numbers are the v0.5 sheet (and Owner t253u where noted). Nothing else is filled in.
 */
export function defaultRuleConfig() {
  return {
    version: 'v05',
    partySize: flag(PARTY_SIZE, 'LOCKED', 'CORE-003'),
    baseAp: flag(BASE_AP, 'LOCKED', 'CORE-007'),
    deckSize: flag(DECK_SIZE, 'LOCKED', 'CORE-009'),
    openingHand: flag(HAND_SIZE, 'LOCKED', 'CORE-010'),
    handSize: flag(HAND_SIZE, 'LOCKED', 'CORE-010'),
    refillHandTo: flag(HAND_SIZE, 'LOCKED', 'CORE-011'),
    endOfRoundHandCap: flag(HAND_SIZE, 'LOCKED', 'CORE-013'),
    voluntaryDiscardAp: flag(VOLUNTARY_DISCARD_AP, 'LOCKED', 'CORE-014'),
    apCost: {
      min: AP_COST_MIN,
      max: AP_COST_MAX,
      status: 'LOCKED',
      rule: 'CORE-008',
    },
    maxAvatarLevel: flag(MAX_AVATAR_LEVEL, 'LOCKED', 'CORE-030'),
    factions: {
      value: FACTION_RECORDS.map((row) => ({ ...row })),
      status: 'LOCKED',
      rule: 'CORE-003',
      note: 'Aegis Dominion=Tank, Phantom Blades=DPS, Celestial Nexus=Magic, Sanctuary Order=Support',
    },
    avatarRarities: flag([...AVATAR_RARITIES], 'LOCKED', 'CORE-024'),
    actionRarities: flag([...ACTION_RARITIES], 'LOCKED', 'CORE-025', {
      note: 'EX and FAC are the same top tier',
    }),
    powToAtk: { ...POW_TO_ATK },
    justinCharacters: {
      value: 'new-characters',
      status: 'LOCKED',
      evidence: OWNER_EVIDENCE_T253U,
      ids: ['AVT_AEG_002', 'AVT_PHA_002', 'AVT_CEL_002', 'AVT_SAN_002'],
      designRefs: ['AV_EX01', 'AV_EX02', 'AV_EX03', 'AV_EX04'],
      existingIdsUntouched: ['AVT_AEG_001', 'AVT_PHA_001', 'AVT_CEL_001', 'AVT_SAN_001'],
      note: 'Stats and skills stay PROPOSED except Justina Moment active, which stays LOCKED.',
    },
    teamSpdAggregation: pending('CORE-038', { also: 'OPEN-01' }),
    spdTieBreak: pending('CORE-038', { also: 'OPEN-01' }),
    damageFormula: pending('CORE-039', { also: 'OPEN-02' }),
    hpModel: pending('CORE-039', { also: 'OPEN-02' }),
    healCap: pending('CORE-039', { also: 'OPEN-02' }),
    regenTickTiming: pending('OPEN-02'),
    deckDuplicateMax: pending('CORE-040', { also: 'OPEN-03' }),
    battleGrid: pending('CORE-036'),
    vrSync: {
      value: null,
      status: 'REJECTED',
      rule: 'CORE-037',
      evidence: OWNER_EVIDENCE_T261U,
      note: 'SYNC is dropped. Out of scope, not a pending rule.',
    },
    autoBattle: {
      value: true,
      status: 'LOCKED',
      rule: 'AUTO',
      evidence: OWNER_EVIDENCE_T261U,
      note: 'AUTO battle mode is required. The choice policy is not locked.',
    },
    autoPolicy: {
      value: 'balanced',
      status: 'PROPOSED',
      rule: 'AUTO',
      evidence: OWNER_EVIDENCE_T261U,
      note: 'Engine handoff field autoPolicy. Default is balanced. Not a locked AI.',
      speed: {
        value: 'normal',
        status: 'PROPOSED',
        options: ['slow', 'normal', 'fast'],
        note: 'Playback speed the engine may read. Not combat balance.',
      },
    },
    starCapByRarity: pending('OPEN-04', {
      note: 'Do not lock N2/R3/Epic4/EX5. Stars are separate from the level cap of 5.',
    }),
    duplicateConversion: pending('OPEN-04', {
      also: 'GA-13',
      note: 'Hero Synthesis uses duplicates. The conversion ratio is not set. Locked, favorite, and in-deck copies are protected.',
    }),
    gacha: {
      poolsSeparate: flag(true, 'LOCKED', 'GA-01', {
        pools: ['avatar', 'action', 'companion'],
        columnShift: 'GA-01 status cell is "Owner 19-20 Nov"; Pity Pulls cell is LOCKED. Effective status LOCKED.',
      }),
      sharedCurrency: flag('G', 'LOCKED', 'GA-02', {
        appliesTo: ['avatar', 'action'],
        columnShift: 'GA-02 is column-shifted the same way as GA-01. Effective status LOCKED.',
      }),
      companionCurrency: pending('GA-02', {
        note: 'Companion price/currency is not locked. Companion pulls do not spend G.',
      }),
      avatarRarities: flag([...AVATAR_RARITIES], 'LOCKED', 'GA-03', {
        columnShift: 'GA-03 is column-shifted. Effective status LOCKED.',
      }),
      actionRarities: flag([...ACTION_RARITIES], 'LOCKED', 'GA-04', {
        columnShift: 'GA-04 is column-shifted. Effective status LOCKED. EX and FAC are the same top tier.',
      }),
      pity: {
        status: 'LOCKED',
        evidence: OWNER_EVIDENCE_T253U,
        rule: 'GA-12',
        counterScope: 'banner',
        epicAndTopSeparate: true,
        epicHitResets: 'epic',
        topHitResets: ['epic', 'top'],
        companionEpicSeparate: true,
        companionTopPity: false,
        avatarEpicPulls: EPIC_PITY_PULLS,
        actionEpicPulls: EPIC_PITY_PULLS,
        avatarTopPulls: TOP_PITY_PULLS,
        actionTopPulls: TOP_PITY_PULLS,
        companionEpicPulls: COMPANION_EPIC_PITY_PULLS,
        rules: {
          'GA-05': EPIC_PITY_PULLS,
          'GA-06': EPIC_PITY_PULLS,
          'GA-07': TOP_PITY_PULLS,
          'GA-08': TOP_PITY_PULLS,
          'GA-09': COMPANION_EPIC_PITY_PULLS,
          'GA-10': null,
        },
      },
      rates: pending('GA-11', { note: 'Do not invent production drop rates. Demo pulls use an explicit TEST config.' }),
      costG: pending('GA-11', { note: 'Do not invent a production G price.' }),
      pityCardChoice: pending('GA-11', {
        note: 'Which card inside a guaranteed rarity is not specified. Pity selection uses a uniform pick among eligible entries and records that this is not a drop rate.',
      }),
    },
    house: {
      cabinBaseCapacity: pending('HOME-11', { note: 'Do not set a starting stash number.' }),
      furnitureGrant: pending('OPEN-06', {
        note: 'Reference capacities are data. Acquiring a house tier does not install furniture and does not add slots.',
      }),
    },
    targetRuleEnum: pending('Target_Rule', {
      vocabulary: ['Self', 'Ally', 'All_Allies', 'Enemy', 'All_Enemies', 'Card', 'Pile'],
      note: 'v05_Action_Schema lists the vocabulary and marks the field PENDING.',
    }),
  };
}

/**
 * @param {unknown} node
 * @param {string} [path]
 * @returns {{ path: string, rule: string }[]}
 */
export function pendingOwnerFlags(node = defaultRuleConfig(), path = '') {
  /** @type {{ path: string, rule: string }[]} */
  const found = [];
  if (!node || typeof node !== 'object') return found;
  if (!Array.isArray(node) && node.status === 'PENDING_OWNER') {
    found.push({ path: path || '(root)', rule: typeof node.rule === 'string' ? node.rule : '' });
  }
  for (const [key, value] of Object.entries(node)) {
    if (value && typeof value === 'object') {
      found.push(...pendingOwnerFlags(value, path ? `${path}.${key}` : key));
    }
  }
  return found;
}
