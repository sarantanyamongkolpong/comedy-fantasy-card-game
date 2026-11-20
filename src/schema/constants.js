/** Specified faction names and roles. Do not rename the name strings. */
export const FACTION_RECORDS = Object.freeze([
  Object.freeze({ factionId: 'FAC_AEG', name: 'Aegis Dominion', role: 'Tank' }),
  Object.freeze({ factionId: 'FAC_PHA', name: 'Phantom Blades', role: 'DPS' }),
  Object.freeze({ factionId: 'FAC_CEL', name: 'Celestial Nexus', role: 'Magic' }),
  Object.freeze({ factionId: 'FAC_SAN', name: 'Sanctuary Order', role: 'Support' }),
]);

/** Action card types specified for the hand system. */
export const CARD_ACTION_TYPES = Object.freeze(['ATK', 'DEF', 'Skill']);

/** Status legend from the art manifest (docs/ASSET_MANIFEST.json on the art branch). */
export const ASSET_STATUSES = Object.freeze([
  'CONCEPT',
  'PROTOTYPE',
  'QA_PASSED',
  'PRODUCTION_READY',
  'INTEGRATED',
]);

/** Art statuses the loader returns with an advisory instead of treating as missing. */
export const ADVISORY_STATUSES = Object.freeze(['CONCEPT', 'PROTOTYPE']);

export const PARTY_SIZE = 4;
export const HAND_SIZE = 5;
export const BASE_AP = 5;

/**
 * Legacy stat keys. Existing catalogs, equipment, replay logs, and the balance
 * lab still speak `pow`. v0.5 primary stats are `atk` / `def` / `spd`
 * (CORE-005). Do not rename this export: callers outside this stream read it.
 */
export const STAT_KEYS = Object.freeze(['pow', 'def', 'spd']);

/** Primary avatar stats (CORE-005, LOCKED). */
export const PRIMARY_STAT_KEYS = Object.freeze(['atk', 'def', 'spd']);

/** CORE-009. Action deck size. LOCKED. */
export const DECK_SIZE = 30;

/** CORE-008. */
export const AP_COST_MIN = 0;
export const AP_COST_MAX = 5;

/** CORE-014. Voluntary discard during your turn. */
export const VOLUNTARY_DISCARD_AP = 1;

/** CORE-030. Separate from stars / rank, which stay PENDING_OWNER. */
export const MAX_AVATAR_LEVEL = 5;

/** CORE-024. FAC is not an avatar rarity. */
export const AVATAR_RARITIES = Object.freeze(['N', 'R', 'Epic', 'EX']);

/** CORE-025. EX and FAC are the same top tier. */
export const ACTION_RARITIES = Object.freeze(['N', 'R', 'Epic', 'EX', 'FAC']);

export const TOP_AVATAR_RARITIES = Object.freeze(['EX']);
export const TOP_ACTION_RARITIES = Object.freeze(['EX', 'FAC']);

/** GA-05 / GA-06 / GA-09. */
export const EPIC_PITY_PULLS = 100;

/** GA-07 / GA-08. Companion has no top-tier pity (GA-10). */
export const TOP_PITY_PULLS = 200;

export const COMPANION_EPIC_PITY_PULLS = 100;

export const SAVE_VERSION = 1;

/** Owner t253u, 20 Nov 2026. Cited wherever these three decisions are stored. */
export const OWNER_EVIDENCE_T253U = 'Owner t253u 20 Nov 2026';

/**
 * CORE-005 is LOCKED as a 1:1 copy. `legacy.pow` keeps the old value.
 * This is not a combat formula.
 */
export const POW_TO_ATK = Object.freeze({
  mapping: '1:1',
  keepLegacyPow: true,
  status: 'LOCKED',
  rule: 'CORE-005',
  evidence: OWNER_EVIDENCE_T253U,
});

/**
 * CORE-026..029. `xor` means exactly one of Active or Passive.
 * Values not listed here are not skill-slot rules.
 */
export const SKILL_SLOT_RULES = Object.freeze({
  N: Object.freeze({ active: 'optional', passive: 'forbidden', ultimate: 'forbidden', rule: 'CORE-026', status: 'LOCKED' }),
  R: Object.freeze({ active: 'xor', passive: 'xor', ultimate: 'forbidden', rule: 'CORE-027', status: 'LOCKED' }),
  Epic: Object.freeze({ active: 'required', passive: 'required', ultimate: 'forbidden', rule: 'CORE-028', status: 'LOCKED' }),
  EX: Object.freeze({ active: 'required', passive: 'required', ultimate: 'required', rule: 'CORE-029', status: 'LOCKED' }),
});

/** v05_Action_Schema Target_Rule vocabulary. The field's sheet state is still PENDING. */
export const TARGET_RULES = Object.freeze([
  'Self',
  'Ally',
  'All_Allies',
  'Enemy',
  'All_Enemies',
  'Card',
  'Pile',
]);

export const RESOLVE_ZONES = Object.freeze(['Discard', 'Void']);

export const DATA_STATUSES = Object.freeze([
  'LOCKED',
  'PROPOSED',
  'PLACEHOLDER',
  'PENDING_OWNER',
  'SUPERSEDED',
]);

export const SUBJECT_KINDS = Object.freeze([
  'avatar',
  'avatar_card',
  'action_card',
  'equipment',
]);

export const VARIANT_KINDS = Object.freeze([
  'equipment',
  'card_art',
  'sprite_layer',
]);

export const FEATURE_STATUSES = Object.freeze([
  'IMPLEMENTED',
  'TESTED',
  'BLOCKED_BY_DESIGN',
  'NOT_IMPLEMENTED',
]);
