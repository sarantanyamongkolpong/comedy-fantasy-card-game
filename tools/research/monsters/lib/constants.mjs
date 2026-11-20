/**
 * Research-database vocabulary.
 * Rarities, roles, and faction ids are copied from the game constants so a
 * later importer does not invent a second list. Combat numbers are not here.
 */

export const SCHEMA_VERSION = 'monster-research-1';

/** Brief category names. "Secret / Comedy Boss" in the target table is this enum's Secret Boss. */
export const CATEGORIES = Object.freeze([
  'Normal',
  'Elite',
  'Mini Boss',
  'Main Boss',
  'World Boss',
  'Secret Boss',
]);

/** Monster ID prefixes. MON-NRM-0001, MON-ELT-, MON-MNB-, MON-MJB-, MON-WLB-, MON-SCB-. */
export const CATEGORY_PREFIX = Object.freeze({
  Normal: 'NRM',
  Elite: 'ELT',
  'Mini Boss': 'MNB',
  'Main Boss': 'MJB',
  'World Boss': 'WLB',
  'Secret Boss': 'SCB',
});

export const BOSS_CATEGORIES = Object.freeze([
  'Mini Boss',
  'Main Boss',
  'World Boss',
  'Secret Boss',
]);

/** Workflow words from the brief. LOCKED and OWNER_APPROVED are rejected. */
export const STATUSES = Object.freeze(['RESEARCH', 'PROPOSED', 'QA_PASSED']);

export const IP_RISKS = Object.freeze(['low', 'medium', 'high', 'blocked']);

/** Same three words as agents 01–05 inspiration records. */
export const CONFIDENCE = Object.freeze(['high', 'medium', 'low']);

/**
 * CORE-024 avatar rarities. FAC is an action-card top tier (CORE-025) and is
 * not a monster or enemy rarity.
 */
export const RARITIES = Object.freeze(['N', 'R', 'Epic', 'EX']);

/** Enemy role strings on content/v05/enemies/demo-battle.json. */
export const ROLES = Object.freeze(['Tank', 'DPS', 'Magic', 'Support']);

/** factionId values from src/schema/constants.js FACTION_RECORDS. Names are the specified strings. */
export const FACTIONS = Object.freeze([
  Object.freeze({ factionId: 'FAC_AEG', name: 'Aegis Dominion' }),
  Object.freeze({ factionId: 'FAC_PHA', name: 'Phantom Blades' }),
  Object.freeze({ factionId: 'FAC_CEL', name: 'Celestial Nexus' }),
  Object.freeze({ factionId: 'FAC_SAN', name: 'Sanctuary Order' }),
]);

export const FACTION_IDS = Object.freeze({
  'Aegis Dominion': 'FAC_AEG',
  'Phantom Blades': 'FAC_PHA',
  'Celestial Nexus': 'FAC_CEL',
  'Sanctuary Order': 'FAC_SAN',
});

/** Four factions plus the brief's non-faction labels. Null means unaffiliated. */
export const AFFILIATIONS = Object.freeze([
  'Aegis Dominion',
  'Phantom Blades',
  'Celestial Nexus',
  'Sanctuary Order',
  'Wild Creature',
  'Corrupted Echo',
  'Tower Guardian',
  'Tower Anomaly',
]);

export const NON_FACTION_AFFILIATIONS = Object.freeze([
  'Wild Creature',
  'Corrupted Echo',
  'Tower Guardian',
  'Tower Anomaly',
]);

export const HUMOR_TYPES = Object.freeze([
  'Absurd Comedy',
  'Dark Fantasy Comedy',
  'Satirical Fantasy',
  'Epic but Ridiculous',
]);

/** inspiration.kind values from the brief's research record format. */
export const INSPIRATION_KINDS = Object.freeze([
  'game',
  'myth',
  'folklore',
  'anime',
  'urban_legend',
  'pop',
  'historical',
]);

/** GachaBanner.pool vocabulary. A hook may name a pool. It never carries a weight or a rate. */
export const GACHA_POOLS = Object.freeze(['avatar', 'action', 'companion']);

export const SHEET_NAMES = Object.freeze([
  'Master Monster Database',
  'Normal Monsters',
  'Elite Monsters',
  'Mini Bosses',
  'Main Bosses',
  'World Bosses',
  'Secret Bosses',
  'Research Sources',
  'Duplicate & IP Risk Audit',
]);

export const CATEGORY_SHEET = Object.freeze({
  Normal: 'Normal Monsters',
  Elite: 'Elite Monsters',
  'Mini Boss': 'Mini Bosses',
  'Main Boss': 'Main Bosses',
  'World Boss': 'World Bosses',
  'Secret Boss': 'Secret Bosses',
});

/**
 * Duplicate thresholds on normalized text.
 * Name score is Dice on character bigrams. Concept score is token Jaccard.
 */
export const SIMILARITY = Object.freeze({
  nameError: 0.86,
  nameWarning: 0.75,
  conceptError: 0.72,
  conceptWarning: 0.5,
});

export const MONSTER_ID = /^MON-(NRM|ELT|MNB|MJB|WLB|SCB)-([0-9]{4})$/;

/** MON-NRM-0001 -> ENM_NRM_0001, the same ENM_ shape as content/v05/enemies. */
export function defaultEnemyId(monsterId) {
  const match = MONSTER_ID.exec(typeof monsterId === 'string' ? monsterId : '');
  return match ? `ENM_${match[1]}_${match[2]}` : null;
}
export const ENEMY_ID = /^ENM_[A-Z0-9_]+$/;
export const INSPIRATION_ID = /^(INS|SELF)-[0-9]{2}-[0-9]{3}$/;
