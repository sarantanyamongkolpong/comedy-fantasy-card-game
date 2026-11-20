import { FACTION_RECORDS, OWNER_EVIDENCE_T253U } from './constants.js';
import { HOUSE_TIERS, MAP_DESTINATIONS } from './hideout.js';

const FACTION = Object.fromEntries(FACTION_RECORDS.map((row) => [row.factionId, row]));

function skill(fields) {
  const status = fields.status;
  return {
    schemaVersion: 'v05',
    cardId: fields.id,
    cardKind: 'action_card',
    actionType: 'Skill',
    name: fields.name,
    apCost: null,
    costStatus: 'PENDING_OWNER',
    effectId: fields.id,
    rarity: 'Epic',
    labels: status === 'LOCKED' ? ['LOCKED'] : ['PROPOSED', 'NOT_LOCKED'],
    Action_ID: fields.id,
    Name: fields.name,
    Type: 'Skill',
    Rarity: 'Epic',
    Faction_Requirement: null,
    Cost_AP: null,
    Target_Rule: fields.target ?? null,
    Effect_Spec: fields.effect,
    Duration_Turns: fields.duration ?? null,
    On_Resolve_Zone: 'Discard',
    Zone_Recovery: null,
    Can_Play: {
      kind: 'avatar-skill',
      requiresSkillAction: true,
      rule: 'CORE-021',
    },
    Asset_Ref: null,
    Version_And_Status: status,
    evidence: fields.evidence ?? null,
    fieldStatus: {
      Cost_AP: 'PENDING_OWNER',
      Target_Rule: 'PENDING_OWNER',
      Effect_Spec: status,
      Name: fields.nameStatus ?? status,
    },
  };
}

function proposedEffect(trigger, chance, op) {
  return {
    valueStatus: 'PROPOSED',
    trigger,
    chance: chance === null ? null : { value: chance, valueStatus: 'PROPOSED' },
    ops: [{ ...op, valueStatus: 'PROPOSED' }],
    tickTiming: { value: null, status: 'PENDING_OWNER', rule: 'OPEN-02' },
  };
}

function avatar(fields) {
  const faction = FACTION[fields.factionId];
  return {
    schemaVersion: 'v05',
    avatarId: fields.avatarId,
    designRef: fields.designRef,
    sheetName: fields.sheetName,
    nameEn: fields.nameEn,
    nameTh: fields.nameEn,
    nameThNote: 'No Thai name in the v05 sheet. This copy of nameEn is not a locked localization.',
    factionId: fields.factionId,
    factionName: faction.name,
    role: faction.role,
    rarity: 'Epic',
    gender: fields.gender,
    rigId: null,
    stats: {
      atk: fields.atk,
      def: fields.def,
      spd: fields.spd,
      valueStatus: 'PROPOSED',
      fieldStatus: { atk: 'PROPOSED', def: 'PROPOSED', spd: 'PROPOSED' },
      evidence: `${fields.designRef} numbers are proposed design samples (OPEN-08), not locked balance.`,
    },
    skills: {
      active: fields.active,
      passive: fields.passive,
      ultimate: null,
    },
    assetIds: {},
    assetNote: 'No modular asset id is invented. Reference card art stays on the design branch until it is decomposed.',
    fieldStatus: {
      nameEn: 'LOCKED',
      nameTh: 'PENDING_OWNER',
      factionId: 'LOCKED',
      role: 'LOCKED',
      rarity: 'LOCKED',
      gender: fields.genderStatus,
      stats: 'PROPOSED',
      active: fields.activeStatus,
      passive: 'PROPOSED',
    },
    levelCap: { max: 5, status: 'LOCKED', rule: 'CORE-030' },
    stars: {
      value: null,
      status: 'PENDING_OWNER',
      rule: 'OPEN-04',
      note: 'Do not lock a star cap such as N2/R3/Epic4/EX5.',
    },
    identity: {
      status: 'LOCKED',
      decision: 'new-character',
      evidence: OWNER_EVIDENCE_T253U,
      notARenameOf: fields.notARenameOf,
    },
  };
}

function justinAvatars() {
  const aegis = 'FAC_AEG';
  const phantom = 'FAC_PHA';
  const celestial = 'FAC_CEL';
  const sanctuary = 'FAC_SAN';
  return [
    avatar({
      avatarId: 'AVT_AEG_002',
      designRef: 'AV_EX01',
      sheetName: 'JUSTIN CASE',
      nameEn: 'Justin Case',
      factionId: aegis,
      gender: null,
      genderStatus: 'PENDING_OWNER',
      atk: 3,
      def: 8,
      spd: 1,
      notARenameOf: 'AVT_AEG_001',
      activeStatus: 'PROPOSED',
      active: skill({
        id: 'ACT_SKILL_AVT_AEG_002_ACTIVE',
        name: 'Shield +2; Taunt 1 Turn',
        status: 'PROPOSED',
        target: 'Self',
        duration: 1,
        effect: proposedEffect('action', null, { op: 'shield', amount: 2, durationTurns: 1, also: 'taunt' }),
      }),
      passive: skill({
        id: 'ACT_SKILL_AVT_AEG_002_PASSIVE',
        name: '70% turn start: team DEF +1 for 1 Turn',
        status: 'PROPOSED',
        target: 'All_Allies',
        duration: 1,
        effect: proposedEffect('turn-start', 0.7, {
          op: 'stat-buff',
          stat: 'def',
          amount: 1,
          targets: 'All_Allies',
          durationTurns: 1,
        }),
      }),
    }),
    avatar({
      avatarId: 'AVT_PHA_002',
      designRef: 'AV_EX02',
      sheetName: 'JUSTIN TIME',
      nameEn: 'Justin Time',
      factionId: phantom,
      gender: null,
      genderStatus: 'PENDING_OWNER',
      atk: 8,
      def: 2,
      spd: 9,
      notARenameOf: 'AVT_PHA_001',
      activeStatus: 'PROPOSED',
      active: skill({
        id: 'ACT_SKILL_AVT_PHA_002_ACTIVE',
        name: 'Reckless Rush',
        status: 'PROPOSED',
        target: 'Self',
        duration: 1,
        effect: proposedEffect('action', null, {
          op: 'next-attack-buff',
          stat: 'atk',
          amount: 2,
          targets: 'Self',
          durationTurns: 1,
          note: 'next attack ATK +2 this Turn',
        }),
      }),
      passive: skill({
        id: 'ACT_SKILL_AVT_PHA_002_PASSIVE',
        name: 'Lucky Slash',
        status: 'PROPOSED',
        target: 'Enemy',
        duration: null,
        effect: proposedEffect('on-attack', 0.3, { op: 'bonus-damage', amount: 2 }),
      }),
    }),
    avatar({
      avatarId: 'AVT_CEL_002',
      designRef: 'AV_EX03',
      sheetName: 'JUSTIN THEORY',
      nameEn: 'Justin Theory',
      factionId: celestial,
      gender: null,
      genderStatus: 'PENDING_OWNER',
      atk: 7,
      def: 3,
      spd: 4,
      notARenameOf: 'AVT_CEL_001',
      activeStatus: 'PROPOSED',
      active: skill({
        id: 'ACT_SKILL_AVT_CEL_002_ACTIVE',
        name: 'Arcane Formula',
        status: 'PROPOSED',
        target: 'Self',
        duration: 1,
        effect: proposedEffect('action', null, {
          op: 'next-attack-buff',
          stat: 'atk',
          amount: 3,
          targets: 'Self',
          durationTurns: 1,
        }),
      }),
      passive: skill({
        id: 'ACT_SKILL_AVT_CEL_002_PASSIVE',
        name: 'Eureka',
        status: 'PROPOSED',
        target: 'Self',
        duration: 1,
        effect: proposedEffect('turn-start', 0.4, {
          op: 'stat-buff',
          stat: 'atk',
          amount: 1,
          targets: 'Self',
          durationTurns: 1,
        }),
      }),
    }),
    avatar({
      avatarId: 'AVT_SAN_002',
      designRef: 'AV_EX04',
      sheetName: 'JUSTINA MOMENT',
      nameEn: 'Justina Moment',
      factionId: sanctuary,
      gender: 'female',
      genderStatus: 'LOCKED',
      atk: 2,
      def: 5,
      spd: 6,
      notARenameOf: 'AVT_SAN_001',
      activeStatus: 'LOCKED',
      active: skill({
        id: 'ACT_SKILL_AVT_SAN_002_ACTIVE',
        name: 'Saving Grace',
        status: 'LOCKED',
        nameStatus: 'LOCKED',
        evidence: `${OWNER_EVIDENCE_T253U}. v05 AV_EX04 active effect stays LOCKED.`,
        target: 'All_Allies',
        duration: 2,
        effect: {
          valueStatus: 'LOCKED',
          evidence: 'v05 AV_EX04 Active Skill: Saving Grace, all teammates Regen +3 for 2 Turns.',
          trigger: 'action',
          chance: null,
          ops: [
            {
              op: 'regen',
              amount: 3,
              durationTurns: 2,
              targets: 'All_Allies',
              valueStatus: 'LOCKED',
              evidence: 'v05 AV_EX04',
            },
          ],
          tickTiming: { value: null, status: 'PENDING_OWNER', rule: 'OPEN-02' },
        },
      }),
      passive: skill({
        id: 'ACT_SKILL_AVT_SAN_002_PASSIVE',
        name: 'Moral Support',
        status: 'PROPOSED',
        target: 'Ally',
        duration: 1,
        effect: proposedEffect('turn-start', 0.5, {
          op: 'stat-buff',
          stat: 'atk',
          amount: 1,
          targets: 'random-ally',
          durationTurns: 1,
        }),
      }),
    }),
  ];
}

function actionCard(fields) {
  const faction = fields.factionId ?? null;
  return {
    schemaVersion: 'v05',
    cardId: fields.id,
    cardKind: 'action_card',
    actionType: fields.type,
    name: fields.name,
    apCost: fields.cost,
    costStatus: 'PLACEHOLDER',
    effectId: fields.id,
    rarity: fields.rarity,
    labels: ['PLACEHOLDER', 'NOT_LOCKED'],
    Action_ID: fields.id,
    Name: fields.name,
    Type: fields.type,
    Rarity: fields.rarity,
    Faction_Requirement: faction,
    Cost_AP: fields.cost,
    Target_Rule: fields.target,
    Effect_Spec: {
      valueStatus: 'PLACEHOLDER',
      ops: [
        {
          op: 'placeholder',
          note: 'Not a locked combat effect.',
          valueStatus: 'PLACEHOLDER',
        },
      ],
    },
    Duration_Turns: null,
    On_Resolve_Zone: 'Discard',
    Zone_Recovery: null,
    Can_Play: {
      requiresFaction: fields.rarity === 'FAC',
      factionId: faction,
      factionOverride: false,
      requiresAp: true,
      requiresSkillAction: fields.type === 'Skill',
      rule: fields.rarity === 'FAC' ? 'CORE-023' : 'CORE-022',
    },
    Asset_Ref: null,
    Version_And_Status: 'PLACEHOLDER',
    evidence: null,
    fieldStatus: {
      Cost_AP: 'PLACEHOLDER',
      Effect_Spec: 'PLACEHOLDER',
      Name: 'PLACEHOLDER',
      Target_Rule: 'PENDING_OWNER',
    },
  };
}

function starterActions() {
  return [
    actionCard({ id: 'ACT_GEN_ATK_001', name: 'Placeholder Jab', type: 'ATK', rarity: 'N', cost: 1, target: 'Enemy' }),
    actionCard({ id: 'ACT_GEN_ATK_002', name: 'Placeholder Smash', type: 'ATK', rarity: 'R', cost: 2, target: 'Enemy' }),
    actionCard({ id: 'ACT_GEN_DEF_001', name: 'Placeholder Guard', type: 'DEF', rarity: 'N', cost: 1, target: 'Self' }),
    actionCard({ id: 'ACT_GEN_DEF_002', name: 'Placeholder Bulwark', type: 'DEF', rarity: 'R', cost: 2, target: 'Self' }),
    actionCard({ id: 'ACT_GEN_SKILL_001', name: 'Placeholder Spark', type: 'Skill', rarity: 'N', cost: 1, target: 'Self' }),
    actionCard({ id: 'ACT_GEN_SKILL_002', name: 'Placeholder Anthem', type: 'Skill', rarity: 'Epic', cost: 2, target: 'Self' }),
    actionCard({ id: 'ACT_FAC_AEG_001', name: 'Placeholder Aegis Wall', type: 'DEF', rarity: 'FAC', cost: 1, target: 'Self', factionId: 'FAC_AEG' }),
    actionCard({ id: 'ACT_FAC_AEG_002', name: 'Placeholder Aegis Taunt', type: 'Skill', rarity: 'FAC', cost: 2, target: 'Self', factionId: 'FAC_AEG' }),
    actionCard({ id: 'ACT_FAC_PHA_001', name: 'Placeholder Phantom Cut', type: 'ATK', rarity: 'FAC', cost: 1, target: 'Enemy', factionId: 'FAC_PHA' }),
    actionCard({ id: 'ACT_FAC_PHA_002', name: 'Placeholder Phantom Rush', type: 'Skill', rarity: 'FAC', cost: 2, target: 'Self', factionId: 'FAC_PHA' }),
    actionCard({ id: 'ACT_FAC_CEL_001', name: 'Placeholder Star Bolt', type: 'ATK', rarity: 'FAC', cost: 1, target: 'Enemy', factionId: 'FAC_CEL' }),
    actionCard({ id: 'ACT_FAC_CEL_002', name: 'Placeholder Arcane Poke', type: 'Skill', rarity: 'FAC', cost: 2, target: 'Self', factionId: 'FAC_CEL' }),
    actionCard({ id: 'ACT_FAC_SAN_001', name: 'Placeholder Saving Ping', type: 'Skill', rarity: 'FAC', cost: 1, target: 'All_Allies', factionId: 'FAC_SAN' }),
    actionCard({ id: 'ACT_FAC_SAN_002', name: 'Placeholder Sanctuary Ward', type: 'DEF', rarity: 'FAC', cost: 2, target: 'Ally', factionId: 'FAC_SAN' }),
  ];
}

function copies(id, count) {
  return Array.from({ length: count }, () => id);
}

function demoDeck() {
  const cardIds = [
    ...copies('ACT_GEN_ATK_001', 3),
    ...copies('ACT_GEN_ATK_002', 2),
    ...copies('ACT_GEN_DEF_001', 3),
    ...copies('ACT_GEN_DEF_002', 2),
    ...copies('ACT_GEN_SKILL_001', 2),
    ...copies('ACT_GEN_SKILL_002', 2),
    ...copies('ACT_FAC_AEG_001', 2),
    ...copies('ACT_FAC_AEG_002', 2),
    ...copies('ACT_FAC_PHA_001', 2),
    ...copies('ACT_FAC_PHA_002', 2),
    ...copies('ACT_FAC_CEL_001', 2),
    ...copies('ACT_FAC_CEL_002', 2),
    ...copies('ACT_FAC_SAN_001', 2),
    ...copies('ACT_FAC_SAN_002', 2),
  ];
  return {
    deckId: 'DECK_DEMO_MIXED_001',
    name: 'Demo mixed deck',
    status: 'PLACEHOLDER',
    note: '30 action cards across all four factions. Costs and effects are placeholders. Duplicate cap is PENDING_OWNER (CORE-040).',
    cardIds,
    duplicateMax: { value: null, status: 'PENDING_OWNER', rule: 'CORE-040' },
  };
}

function demoEnemies() {
  const rows = [
    ['ENM_DEMO_001', 'Placeholder Echo Tank', 'FAC_AEG', 'Tank'],
    ['ENM_DEMO_002', 'Placeholder Echo Blade', 'FAC_PHA', 'DPS'],
    ['ENM_DEMO_003', 'Placeholder Echo Spark', 'FAC_CEL', 'Magic'],
    ['ENM_DEMO_004', 'Placeholder Echo Hymn', 'FAC_SAN', 'Support'],
  ];
  return {
    battleId: 'DEMO_BATTLE_001',
    status: 'PLACEHOLDER',
    note: 'One demo enemy team so Deck to Battle can load four opponents. Every number is a placeholder, not locked balance.',
    enemies: rows.map(([enemyId, displayName, factionId, role]) => ({
      enemyId,
      displayName,
      factionId,
      role,
      rarity: 'N',
      rarityStatus: 'PLACEHOLDER',
      stats: {
        atk: 1,
        def: 1,
        spd: 1,
        valueStatus: 'PLACEHOLDER',
        fieldStatus: { atk: 'PLACEHOLDER', def: 'PLACEHOLDER', spd: 'PLACEHOLDER' },
      },
    })),
  };
}

/**
 * Plain data used by the content files and the runtime catalogs.
 * No production rates. No PRODUCTION_READY mark.
 */
export function buildV05Content() {
  return {
    avatars: justinAvatars(),
    actions: starterActions(),
    deck: demoDeck(),
    enemies: demoEnemies(),
    houseTiers: HOUSE_TIERS.map((row) => structuredClone(row)),
    mapDestinations: MAP_DESTINATIONS.map((row) => structuredClone(row)),
  };
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

const BUILT = buildV05Content();

export const V05_JUSTIN_AVATARS = deepFreeze(BUILT.avatars);
export const V05_STARTER_ACTIONS = deepFreeze(BUILT.actions);
export const DEMO_MIXED_DECK = deepFreeze(BUILT.deck);
export const DEMO_ENEMY_TEAM = deepFreeze(BUILT.enemies);
