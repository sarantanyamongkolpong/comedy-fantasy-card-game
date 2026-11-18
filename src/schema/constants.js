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

export const STAT_KEYS = Object.freeze(['pow', 'def', 'spd']);

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
