/**
 * SAMPLE / PROPOSED catalog used only while stream B (content/v05) is absent.
 * Justin names, factions, and Justina's Active effect are from the v0.5 sheet.
 * Other stats and skills stay PROPOSED. Costs on action cards are SAMPLE, not locked balance.
 * AVT_*_001 records keep their existing ids and TBD stats. They are not renamed.
 */

export const FACTION_NAMES = Object.freeze({
  FAC_AEG: 'Aegis Dominion',
  FAC_PHA: 'Phantom Blades',
  FAC_CEL: 'Celestial Nexus',
  FAC_SAN: 'Sanctuary Order',
});

const PROPOSED = 'PROPOSED';
const SAMPLE = 'SAMPLE/PROPOSED';

/** @type {readonly object[]} */
export const AVATARS = Object.freeze([
  Object.freeze({
    avatarId: 'AVT_AEG_002',
    assetId: 'AVT_AEG_002',
    name: 'JUSTIN CASE',
    nameTh: null,
    factionId: 'FAC_AEG',
    role: 'Tank',
    rarity: 'Epic',
    gender: null,
    designRef: 'AV_EX01',
    battleLegal: true,
    statsStatus: PROPOSED,
    stats: Object.freeze({ atk: 3, def: 8, spd: 1 }),
    active: Object.freeze({
      name: 'Shield + Taunt',
      status: PROPOSED,
      kind: 'shieldTaunt',
      shield: 2,
      tauntTurns: 1,
    }),
    passive: Object.freeze({
      name: null,
      sheetText: '70% turn start: team DEF +1 (1 turn)',
      status: PROPOSED,
      kind: 'turnStart',
      scope: 'team',
      buff: 'defBuff',
      buffName: 'DEF',
      amount: 1,
      chance: 0.7,
      assetId: 'ICO_STATUS_SHIELD',
      note: 'Passive name was not supplied on the sheet. Do not invent one.',
    }),
  }),
  Object.freeze({
    avatarId: 'AVT_PHA_002',
    assetId: 'AVT_PHA_002',
    name: 'JUSTIN TIME',
    nameTh: null,
    factionId: 'FAC_PHA',
    role: 'DPS',
    rarity: 'Epic',
    gender: null,
    designRef: 'AV_EX02',
    battleLegal: true,
    statsStatus: PROPOSED,
    stats: Object.freeze({ atk: 8, def: 2, spd: 9 }),
    active: Object.freeze({
      name: 'Reckless Rush',
      status: PROPOSED,
      kind: 'nextStrike',
      bonus: 2,
    }),
    passive: Object.freeze({
      name: 'Lucky Slash',
      status: PROPOSED,
      kind: 'onAttackBonus',
      amount: 2,
      chance: 0.3,
    }),
  }),
  Object.freeze({
    avatarId: 'AVT_CEL_002',
    assetId: 'AVT_CEL_002',
    name: 'JUSTIN THEORY',
    nameTh: null,
    factionId: 'FAC_CEL',
    role: 'Magic',
    rarity: 'Epic',
    gender: null,
    designRef: 'AV_EX03',
    battleLegal: true,
    statsStatus: PROPOSED,
    stats: Object.freeze({ atk: 7, def: 3, spd: 4 }),
    active: Object.freeze({
      name: 'Arcane Formula',
      status: PROPOSED,
      kind: 'nextStrike',
      bonus: 3,
    }),
    passive: Object.freeze({
      name: 'Eureka!',
      status: PROPOSED,
      kind: 'turnStart',
      scope: 'self',
      buff: 'atkBuff',
      buffName: 'ATK',
      amount: 1,
      chance: 0.4,
      assetId: 'ICO_STATUS_ATK',
    }),
  }),
  Object.freeze({
    avatarId: 'AVT_SAN_002',
    assetId: 'AVT_SAN_002',
    name: 'JUSTINA MOMENT',
    nameTh: null,
    factionId: 'FAC_SAN',
    role: 'Support',
    rarity: 'Epic',
    gender: 'female',
    designRef: 'AV_EX04',
    battleLegal: true,
    statsStatus: PROPOSED,
    stats: Object.freeze({ atk: 2, def: 5, spd: 6 }),
    active: Object.freeze({
      name: 'Saving Grace',
      status: 'LOCKED',
      kind: 'regenTeam',
      amount: 3,
      turns: 2,
      note: 'Active effect LOCKED. Other stats on this avatar are PROPOSED.',
    }),
    passive: Object.freeze({
      name: 'Moral Support',
      status: PROPOSED,
      kind: 'turnStart',
      scope: 'randomAlly',
      buff: 'atkBuff',
      buffName: 'ATK',
      amount: 1,
      chance: 0.5,
      assetId: 'ICO_STATUS_ATK',
    }),
  }),
  Object.freeze({
    avatarId: 'AVT_AEG_001',
    assetId: 'WEB_PORTRAIT_AVT_AEG_001',
    name: 'Sir Potlid',
    nameTh: 'เซอร์ฝาหม้อ',
    factionId: 'FAC_AEG',
    role: 'Tank',
    rarity: null,
    gender: null,
    designRef: null,
    battleLegal: false,
    statsStatus: 'TBD',
    stats: Object.freeze({ atk: null, def: null, spd: null }),
    active: null,
    passive: null,
    note: 'Existing art avatar. Stats TBD. Id is unchanged.',
  }),
  Object.freeze({
    avatarId: 'AVT_PHA_001',
    assetId: 'WEB_PORTRAIT_AVT_PHA_001',
    name: 'Nox Squeak',
    nameTh: 'น็อกซ์ รองเท้าดัง',
    factionId: 'FAC_PHA',
    role: 'DPS',
    rarity: null,
    gender: null,
    designRef: null,
    battleLegal: false,
    statsStatus: 'TBD',
    stats: Object.freeze({ atk: null, def: null, spd: null }),
    active: null,
    passive: null,
    note: 'Existing art avatar. Stats TBD. Id is unchanged.',
  }),
  Object.freeze({
    avatarId: 'AVT_CEL_001',
    assetId: 'WEB_PORTRAIT_AVT_CEL_001',
    name: 'Madame Meteor',
    nameTh: 'มาดามดาวตก',
    factionId: 'FAC_CEL',
    role: 'Magic',
    rarity: null,
    gender: null,
    designRef: null,
    battleLegal: false,
    statsStatus: 'TBD',
    stats: Object.freeze({ atk: null, def: null, spd: null }),
    active: null,
    passive: null,
    note: 'Existing art avatar. Stats TBD. Id is unchanged.',
  }),
  Object.freeze({
    avatarId: 'AVT_SAN_001',
    assetId: 'WEB_PORTRAIT_AVT_SAN_001',
    name: 'Sister Plaster',
    nameTh: 'ซิสเตอร์พลาสเตอร์',
    factionId: 'FAC_SAN',
    role: 'Support',
    rarity: null,
    gender: null,
    designRef: null,
    battleLegal: false,
    statsStatus: 'TBD',
    stats: Object.freeze({ atk: null, def: null, spd: null }),
    active: null,
    passive: null,
    note: 'Existing art avatar. Stats TBD. Id is unchanged.',
  }),
]);

function card(partial) {
  return Object.freeze({
    versionAndStatus: SAMPLE,
    factionRequirement: null,
    onResolveZone: 'Discard',
    ...partial,
  });
}

/** @type {readonly object[]} */
export const ACTION_CARDS = Object.freeze([
  card({
    cardId: 'ACT_SAMPLE_BONK',
    name: 'Sincere Bonk',
    type: 'ATK',
    rarity: 'N',
    costAp: 1,
    targetRule: 'Enemy',
    effect: Object.freeze({ kind: 'strike', bonus: 0 }),
    blurb: 'A friendly impact. SAMPLE cost.',
  }),
  card({
    cardId: 'ACT_SAMPLE_HEAVY',
    name: 'Encore Bonk',
    type: 'ATK',
    rarity: 'R',
    costAp: 3,
    targetRule: 'Enemy',
    effect: Object.freeze({ kind: 'strike', bonus: 2 }),
    blurb: 'The bonk demands an encore. SAMPLE cost.',
  }),
  card({
    cardId: 'ACT_SAMPLE_POKE',
    name: 'Free Poke',
    type: 'ATK',
    rarity: 'N',
    costAp: 0,
    targetRule: 'Enemy',
    effect: Object.freeze({ kind: 'strike', bonus: 0 }),
    blurb: 'Costs 0 AP. Still asks nicely. SAMPLE.',
  }),
  card({
    cardId: 'ACT_SAMPLE_GUARD',
    name: 'Hold My Lid',
    type: 'DEF',
    rarity: 'N',
    costAp: 1,
    targetRule: 'Self',
    effect: Object.freeze({ kind: 'shield', shield: 2 }),
    blurb: 'Shield +2. SAMPLE amount.',
  }),
  card({
    cardId: 'ACT_SAMPLE_SKILL',
    name: 'Cue the Bit',
    type: 'Skill',
    rarity: 'N',
    costAp: 1,
    targetRule: 'Actor',
    effect: Object.freeze({ kind: 'active' }),
    blurb: 'Fires the chosen avatar Active. Generic.',
  }),
  card({
    cardId: 'ACT_SAMPLE_RUMMAGE',
    name: 'Pocket Rummage',
    type: 'ATK',
    rarity: 'N',
    costAp: 1,
    targetRule: 'Enemy',
    effect: Object.freeze({ kind: 'strike', bonus: 0, draw: 2 }),
    blurb: 'A small hit, then draw 2. Hand may pass 5. SAMPLE.',
  }),
  card({
    cardId: 'ACT_SAMPLE_VOID',
    name: 'Yeet to the Void',
    type: 'ATK',
    rarity: 'R',
    costAp: 2,
    targetRule: 'Enemy',
    onResolveZone: 'Void',
    effect: Object.freeze({ kind: 'strike', bonus: 1 }),
    blurb: 'Resolves into the Void, not the Discard. SAMPLE.',
  }),
  card({
    cardId: 'ACT_SAMPLE_FAC_AEG',
    name: 'Lid of the Law',
    type: 'ATK',
    rarity: 'FAC',
    factionRequirement: 'FAC_AEG',
    costAp: 2,
    targetRule: 'Enemy',
    effect: Object.freeze({ kind: 'strike', bonus: 1 }),
    blurb: 'FAC. Needs a living Aegis Dominion avatar to play.',
  }),
  card({
    cardId: 'ACT_SAMPLE_FAC_PHA',
    name: 'Punctual Stab',
    type: 'ATK',
    rarity: 'FAC',
    factionRequirement: 'FAC_PHA',
    costAp: 2,
    targetRule: 'Enemy',
    effect: Object.freeze({ kind: 'strike', bonus: 1 }),
    blurb: 'FAC. Needs a living Phantom Blades avatar to play.',
  }),
  card({
    cardId: 'ACT_SAMPLE_FAC_CEL',
    name: 'Chalk Lightning',
    type: 'ATK',
    rarity: 'FAC',
    factionRequirement: 'FAC_CEL',
    costAp: 2,
    targetRule: 'Enemy',
    effect: Object.freeze({ kind: 'strike', bonus: 1 }),
    blurb: 'FAC. Needs a living Celestial Nexus avatar to play.',
  }),
  card({
    cardId: 'ACT_SAMPLE_FAC_SAN',
    name: 'Polite Smite',
    type: 'ATK',
    rarity: 'FAC',
    factionRequirement: 'FAC_SAN',
    costAp: 2,
    targetRule: 'Enemy',
    effect: Object.freeze({ kind: 'strike', bonus: 1 }),
    blurb: 'FAC. Needs a living Sanctuary Order avatar to play.',
  }),
]);

/**
 * 30-card SAMPLE starter. Duplicates are allowed because CORE-040 is PENDING.
 * Counts: 8 bonk, 4 heavy, 4 guard, 4 skill, 2 poke, 2 rummage, 2 void, 1 of each FAC = 30.
 */
export const STARTER_DECK_LIST = Object.freeze([
  ...Array(8).fill('ACT_SAMPLE_BONK'),
  ...Array(4).fill('ACT_SAMPLE_HEAVY'),
  ...Array(4).fill('ACT_SAMPLE_GUARD'),
  ...Array(4).fill('ACT_SAMPLE_SKILL'),
  ...Array(2).fill('ACT_SAMPLE_POKE'),
  ...Array(2).fill('ACT_SAMPLE_RUMMAGE'),
  ...Array(2).fill('ACT_SAMPLE_VOID'),
  'ACT_SAMPLE_FAC_AEG',
  'ACT_SAMPLE_FAC_PHA',
  'ACT_SAMPLE_FAC_CEL',
  'ACT_SAMPLE_FAC_SAN',
]);

/** Same labelled TEST banners as src/gacha/test-config.js. Weights are not drop rates. */
const TEST_WARNING = 'TEST_ONLY_NOT_PRODUCTION. These weights are fixtures for the pity engine. NOT A DROP RATE. GA-11 remains PENDING_OWNER.';

function testBanner(fields) {
  const entries = Object.freeze(fields.entries.map((entry) => Object.freeze({ ...entry })));
  return Object.freeze({
    testOnly: true,
    rateStatus: 'TEST_ONLY_NOT_PRODUCTION',
    warning: TEST_WARNING,
    costG: null,
    costStatus: 'PENDING_OWNER',
    bannerId: fields.bannerId,
    pool: fields.pool,
    name: fields.name,
    pityEpic: 100,
    pityTop: fields.pool === 'companion' ? null : 200,
    entries,
    weights: entries,
  });
}

export const TEST_BANNERS = Object.freeze([
  testBanner({
    bannerId: 'TEST_BANNER_AVATAR',
    pool: 'avatar',
    name: 'Avatar Gachapon',
    entries: [
      { id: 'TEST_POOL_N', rarity: 'N', weight: 100 },
      { id: 'TEST_POOL_EPIC', rarity: 'Epic', weight: 0 },
      { id: 'TEST_POOL_EX', rarity: 'EX', weight: 0 },
    ],
  }),
  testBanner({
    bannerId: 'TEST_BANNER_ACTION',
    pool: 'action',
    name: 'Action Gachapon',
    entries: [
      { id: 'TEST_POOL_N', rarity: 'N', weight: 100 },
      { id: 'TEST_POOL_EPIC', rarity: 'Epic', weight: 0 },
      { id: 'TEST_POOL_FAC', rarity: 'FAC', weight: 0 },
    ],
  }),
  testBanner({
    bannerId: 'TEST_BANNER_COMPANION',
    pool: 'companion',
    name: 'Companion Gachapon',
    entries: [
      { id: 'TEST_POOL_N', rarity: 'N', weight: 100 },
      { id: 'TEST_POOL_EPIC', rarity: 'Epic', weight: 0 },
    ],
  }),
]);

const avatarMap = new Map(AVATARS.map((avatar) => [avatar.avatarId, avatar]));
const cardMap = new Map(ACTION_CARDS.map((action) => [action.cardId, action]));

export function avatarById(avatarId) {
  return avatarMap.get(avatarId) ?? null;
}

export function cardById(cardId) {
  return cardMap.get(cardId) ?? null;
}

export function factionName(factionId) {
  return FACTION_NAMES[factionId] ?? factionId;
}

export const JUSTIN_IDS = Object.freeze([
  'AVT_AEG_002',
  'AVT_PHA_002',
  'AVT_CEL_002',
  'AVT_SAN_002',
]);

export const sampleCatalog = Object.freeze({
  source: 'SAMPLE',
  productionReady: false,
  avatars: AVATARS,
  actionCards: ACTION_CARDS,
  banners: TEST_BANNERS,
  starterDeckList: STARTER_DECK_LIST,
  justinIds: JUSTIN_IDS,
  avatarById,
  cardById,
  factionName,
});
