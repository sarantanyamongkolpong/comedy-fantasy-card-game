import {
  ACTION_RARITIES,
  AP_COST_MAX,
  AP_COST_MIN,
  AVATAR_RARITIES,
  FACTION_RECORDS,
  MAX_AVATAR_LEVEL,
  OWNER_EVIDENCE_T253U,
  RESOLVE_ZONES,
  SKILL_SLOT_RULES,
  TARGET_RULES,
} from './constants.js';

function issue(path, message) {
  return { path, message };
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function unknownKeys(object, allowed, path, errors) {
  for (const key of Object.keys(object)) {
    if (!allowed.has(key)) errors.push(issue(`${path}.${key}`, `unknown field "${key}"`));
  }
}

const AVATAR_KEYS = new Set([
  'schemaVersion',
  'avatarId',
  'designRef',
  'sheetName',
  'nameEn',
  'nameTh',
  'nameThNote',
  'factionId',
  'factionName',
  'role',
  'rarity',
  'gender',
  'rigId',
  'stats',
  'skills',
  'assetIds',
  'assetNote',
  'fieldStatus',
  'levelCap',
  'stars',
  'identity',
]);

const STAT_KEYS = new Set([
  'atk',
  'def',
  'spd',
  'pow',
  'valueStatus',
  'legacy',
  'migration',
  'fieldStatus',
  'evidence',
]);

const ACTION_KEYS = new Set([
  'schemaVersion',
  'cardId',
  'cardKind',
  'actionType',
  'name',
  'apCost',
  'costStatus',
  'effectId',
  'rarity',
  'labels',
  'Action_ID',
  'Name',
  'Type',
  'Rarity',
  'Faction_Requirement',
  'Cost_AP',
  'Target_Rule',
  'Effect_Spec',
  'Duration_Turns',
  'On_Resolve_Zone',
  'Zone_Recovery',
  'Can_Play',
  'Asset_Ref',
  'Version_And_Status',
  'fieldStatus',
  'evidence',
]);

const VALUE_FLAGS = new Set(['TBD', 'SET', 'PROPOSED', 'PLACEHOLDER', 'PENDING_OWNER', 'LOCKED']);

/**
 * @param {unknown} avatar
 */
export function isV05Avatar(avatar) {
  if (!isObject(avatar)) return false;
  if (avatar.schemaVersion === 'v05') return true;
  return isObject(avatar.stats) && Object.prototype.hasOwnProperty.call(avatar.stats, 'atk');
}

/**
 * @param {unknown} card
 */
export function isV05Action(card) {
  if (!isObject(card)) return false;
  if (card.schemaVersion === 'v05') return true;
  return Object.prototype.hasOwnProperty.call(card, 'Action_ID');
}

/**
 * @param {unknown} stats
 * @param {string} path
 * @param {{ path: string, message: string }[]} errors
 */
export function validateV05Stats(stats, path, errors) {
  if (!isObject(stats)) {
    errors.push(issue(path, 'stats must be an object'));
    return;
  }
  unknownKeys(stats, STAT_KEYS, path, errors);
  if (!VALUE_FLAGS.has(stats.valueStatus)) {
    errors.push(issue(`${path}.valueStatus`, 'valueStatus must be TBD, SET, PROPOSED, PLACEHOLDER, PENDING_OWNER, or LOCKED'));
    return;
  }
  for (const key of ['atk', 'def', 'spd']) {
    const value = stats[key];
    const ok = value === null || (Number.isInteger(value) && value >= 0);
    if (!ok) errors.push(issue(`${path}.${key}`, 'must be null or a non-negative integer'));
  }
  if (stats.pow !== undefined && stats.pow !== null && !(Number.isInteger(stats.pow) && stats.pow >= 0)) {
    errors.push(issue(`${path}.pow`, 'legacy pow must stay null or a non-negative integer'));
  }
  if (stats.valueStatus === 'TBD') {
    for (const key of ['atk', 'def', 'spd']) {
      if (stats[key] !== null) errors.push(issue(`${path}.${key}`, 'TBD stats must stay null'));
    }
  }
  if (stats.valueStatus === 'SET' || stats.valueStatus === 'PROPOSED' || stats.valueStatus === 'PLACEHOLDER') {
    for (const key of ['atk', 'def', 'spd']) {
      if (!Number.isInteger(stats[key])) errors.push(issue(`${path}.${key}`, `${stats.valueStatus} stats must be integers`));
    }
  }
  if (stats.valueStatus === 'PROPOSED' || stats.valueStatus === 'PLACEHOLDER') {
    if (!isObject(stats.fieldStatus)) {
      errors.push(issue(`${path}.fieldStatus`, `${stats.valueStatus} stats must flag atk, def, and spd`));
    } else {
      for (const key of ['atk', 'def', 'spd']) {
        if (stats.fieldStatus[key] !== stats.valueStatus) {
          errors.push(issue(`${path}.fieldStatus.${key}`, `must be ${stats.valueStatus} so the number is not treated as LOCKED`));
        }
      }
    }
  }
  if (stats.legacy !== undefined) {
    if (!isObject(stats.legacy) || !Object.prototype.hasOwnProperty.call(stats.legacy, 'pow')) {
      errors.push(issue(`${path}.legacy`, 'legacy must be an object that keeps pow'));
    } else if (stats.pow !== undefined && stats.legacy.pow !== stats.pow) {
      errors.push(issue(`${path}.legacy.pow`, 'legacy.pow must keep the pow value; it must not be rewritten'));
    }
  }
  if (stats.migration !== undefined) {
    if (!isObject(stats.migration) || stats.migration.mapping !== '1:1' || stats.migration.status !== 'LOCKED') {
      errors.push(issue(`${path}.migration`, 'CORE-005 migration must stay the locked 1:1 mapping'));
    }
  }
}

/**
 * @param {unknown} rarity
 * @param {unknown} skills
 * @param {string} path
 * @param {{ path: string, message: string }[]} errors
 */
export function validateSkillSlots(rarity, skills, path, errors) {
  if (rarity === null || rarity === undefined) return;
  const rules = SKILL_SLOT_RULES[rarity];
  if (!rules) return;
  const bag = isObject(skills) ? skills : {};
  if (isObject(skills)) unknownKeys(skills, new Set(['active', 'passive', 'ultimate']), path, errors);
  const present = (value) => value !== null && value !== undefined;
  const active = bag.active ?? null;
  const passive = bag.passive ?? null;
  const ultimate = bag.ultimate ?? null;
  if (rules.ultimate === 'forbidden' && present(ultimate)) {
    errors.push(issue(`${path}.ultimate`, `${rarity} cannot have an Ultimate (${rules.rule})`));
  }
  if (rules.ultimate === 'required' && !present(ultimate)) {
    errors.push(issue(`${path}.ultimate`, `EX requires an Ultimate (${rules.rule})`));
  }
  if (rarity === 'N' && present(passive)) {
    errors.push(issue(`${path}.passive`, 'N cannot have a Passive (CORE-026)'));
  }
  if (rarity === 'R') {
    const count = (present(active) ? 1 : 0) + (present(passive) ? 1 : 0);
    if (count !== 1) {
      errors.push(issue(path, 'R requires Active OR Passive, exactly one (CORE-027)'));
    }
  }
  if (rarity === 'Epic' || rarity === 'EX') {
    if (!present(active)) errors.push(issue(`${path}.active`, `${rarity} requires an Active (${rules.rule})`));
    if (!present(passive)) errors.push(issue(`${path}.passive`, `${rarity} requires a Passive (${rules.rule})`));
  }
}

/**
 * @param {unknown} card
 * @param {string} [path]
 */
export function validateActionCardV05(card, path = 'actionCard') {
  const errors = [];
  if (!isObject(card)) return [issue(path, 'action card must be an object')];
  unknownKeys(card, ACTION_KEYS, path, errors);
  if (card.schemaVersion !== 'v05') errors.push(issue(`${path}.schemaVersion`, 'schemaVersion must be "v05"'));
  if (card.cardKind !== 'action_card') errors.push(issue(`${path}.cardKind`, 'cardKind must be "action_card"'));
  if (typeof card.Action_ID !== 'string' || card.Action_ID.length === 0) {
    errors.push(issue(`${path}.Action_ID`, 'Action_ID is required'));
  } else if (card.cardId !== card.Action_ID) {
    errors.push(issue(`${path}.cardId`, 'cardId must match Action_ID'));
  }
  if (typeof card.Name !== 'string' || card.Name.length === 0) errors.push(issue(`${path}.Name`, 'Name is required'));
  else if (card.name !== card.Name) errors.push(issue(`${path}.name`, 'name must match Name'));
  if (!['ATK', 'DEF', 'Skill'].includes(card.Type)) errors.push(issue(`${path}.Type`, 'Type must be ATK, DEF, or Skill'));
  else if (card.actionType !== card.Type) errors.push(issue(`${path}.actionType`, 'actionType must match Type'));
  if (!ACTION_RARITIES.includes(card.Rarity)) {
    errors.push(issue(`${path}.Rarity`, `Rarity must be one of ${ACTION_RARITIES.join(', ')}`));
  } else if (card.rarity !== card.Rarity) {
    errors.push(issue(`${path}.rarity`, 'rarity must match Rarity'));
  }
  const faction = card.Faction_Requirement;
  if (card.Rarity === 'FAC') {
    if (typeof faction !== 'string' || !FACTION_RECORDS.some((row) => row.factionId === faction)) {
      errors.push(issue(`${path}.Faction_Requirement`, 'FAC requires a factionId'));
    }
  } else if (faction !== null && faction !== undefined) {
    errors.push(issue(`${path}.Faction_Requirement`, 'only FAC actions carry a faction requirement; generic actions use null'));
  }
  const costFlag = isObject(card.fieldStatus) ? card.fieldStatus.Cost_AP : undefined;
  const cost = card.Cost_AP;
  if (cost === null) {
    if (costFlag !== 'PENDING_OWNER') {
      errors.push(issue(`${path}.Cost_AP`, 'null Cost_AP is only allowed when fieldStatus.Cost_AP is PENDING_OWNER'));
    }
  } else if (!Number.isInteger(cost) || cost < AP_COST_MIN || cost > AP_COST_MAX) {
    errors.push(issue(`${path}.Cost_AP`, `Cost_AP must be an integer from ${AP_COST_MIN} to ${AP_COST_MAX}, or null while PENDING_OWNER`));
  } else if (!['PLACEHOLDER', 'PROPOSED', 'LOCKED'].includes(costFlag)) {
    errors.push(issue(`${path}.fieldStatus.Cost_AP`, 'a numeric Cost_AP must be flagged PLACEHOLDER, PROPOSED, or LOCKED'));
  } else if (costFlag === 'LOCKED' && (typeof card.evidence !== 'string' || card.evidence.length === 0)) {
    errors.push(issue(`${path}.evidence`, 'a LOCKED Cost_AP requires evidence'));
  }
  if (card.apCost !== cost) errors.push(issue(`${path}.apCost`, 'apCost must match Cost_AP'));
  if (card.costStatus !== costFlag) errors.push(issue(`${path}.costStatus`, 'costStatus must match fieldStatus.Cost_AP'));
  if (card.Target_Rule !== null && card.Target_Rule !== undefined && !TARGET_RULES.includes(card.Target_Rule)) {
    errors.push(issue(`${path}.Target_Rule`, `Target_Rule must be null or one of ${TARGET_RULES.join(', ')}`));
  }
  if (!isObject(card.Effect_Spec)) errors.push(issue(`${path}.Effect_Spec`, 'Effect_Spec must be an object'));
  if (card.Duration_Turns !== null && card.Duration_Turns !== undefined && !Number.isInteger(card.Duration_Turns)) {
    errors.push(issue(`${path}.Duration_Turns`, 'Duration_Turns must be an integer or null'));
  }
  if (!RESOLVE_ZONES.includes(card.On_Resolve_Zone)) {
    errors.push(issue(`${path}.On_Resolve_Zone`, 'On_Resolve_Zone must be Discard or Void'));
  }
  if (card.Zone_Recovery !== null && card.Zone_Recovery !== undefined && !isObject(card.Zone_Recovery)) {
    errors.push(issue(`${path}.Zone_Recovery`, 'Zone_Recovery must be an object or null'));
  }
  if (!isObject(card.Can_Play)) errors.push(issue(`${path}.Can_Play`, 'Can_Play must be an object'));
  if (card.Asset_Ref !== null && typeof card.Asset_Ref !== 'string') {
    errors.push(issue(`${path}.Asset_Ref`, 'Asset_Ref must be null or a string. Do not invent an art path.'));
  }
  if (typeof card.Version_And_Status !== 'string' || card.Version_And_Status.length === 0) {
    errors.push(issue(`${path}.Version_And_Status`, 'Version_And_Status is required'));
  } else if (card.Version_And_Status === 'PRODUCTION_READY') {
    errors.push(issue(`${path}.Version_And_Status`, 'v05 sample data must not be marked PRODUCTION_READY'));
  } else if (card.Version_And_Status === 'LOCKED' && (typeof card.evidence !== 'string' || card.evidence.length === 0)) {
    errors.push(issue(`${path}.evidence`, 'LOCKED data requires evidence'));
  }
  if (card.labels !== undefined) {
    if (!Array.isArray(card.labels) || card.labels.some((label) => typeof label !== 'string')) {
      errors.push(issue(`${path}.labels`, 'labels must be an array of strings'));
    } else if (card.labels.includes('PRODUCTION_READY')) {
      errors.push(issue(`${path}.labels`, 'labels must not say PRODUCTION_READY'));
    }
  }
  if (card.effectId !== null && card.effectId !== undefined && typeof card.effectId !== 'string') {
    errors.push(issue(`${path}.effectId`, 'effectId must be a string or null'));
  }
  return errors;
}

/**
 * @param {unknown} avatar
 * @param {string} [path]
 */
export function validateAvatarV05(avatar, path = 'avatar') {
  const errors = [];
  if (!isObject(avatar)) return [issue(path, 'avatar must be an object')];
  unknownKeys(avatar, AVATAR_KEYS, path, errors);
  if (avatar.schemaVersion !== 'v05') errors.push(issue(`${path}.schemaVersion`, 'schemaVersion must be "v05"'));
  if (typeof avatar.avatarId !== 'string' || !/^AVT_[A-Z0-9_]+$/.test(avatar.avatarId)) {
    errors.push(issue(`${path}.avatarId`, 'avatarId must look like AVT_AEG_001'));
  }
  if (typeof avatar.nameEn !== 'string' || avatar.nameEn.length === 0) {
    errors.push(issue(`${path}.nameEn`, 'nameEn is required'));
  }
  if (typeof avatar.nameTh !== 'string' || avatar.nameTh.length === 0) {
    errors.push(issue(`${path}.nameTh`, 'nameTh is required'));
  }
  const faction = FACTION_RECORDS.find((row) => row.factionId === avatar.factionId);
  if (!faction) errors.push(issue(`${path}.factionId`, 'unknown factionId'));
  else if (avatar.role !== faction.role) {
    errors.push(issue(`${path}.role`, `role must be ${faction.role} for ${faction.name}`));
  }
  if (avatar.factionName !== undefined && faction && avatar.factionName !== faction.name) {
    errors.push(issue(`${path}.factionName`, `factionName must stay "${faction.name}"`));
  }
  if (avatar.rarity !== null && !AVATAR_RARITIES.includes(avatar.rarity)) {
    errors.push(issue(`${path}.rarity`, `rarity must be null or one of ${AVATAR_RARITIES.join(', ')}`));
  }
  if (avatar.gender !== undefined && avatar.gender !== null && avatar.gender !== 'female') {
    errors.push(issue(`${path}.gender`, 'gender must be null or "female" (only Justina is sourced)'));
  }
  if (avatar.rigId !== undefined && avatar.rigId !== null && (typeof avatar.rigId !== 'string' || avatar.rigId.length === 0)) {
    errors.push(issue(`${path}.rigId`, 'rigId must be a non-empty string or null'));
  }
  validateV05Stats(avatar.stats, `${path}.stats`, errors);
  validateSkillSlots(avatar.rarity, avatar.skills, `${path}.skills`, errors);
  if (isObject(avatar.skills)) {
    for (const slot of ['active', 'passive', 'ultimate']) {
      if (avatar.skills[slot] !== null && avatar.skills[slot] !== undefined) {
        errors.push(...validateActionCardV05(avatar.skills[slot], `${path}.skills.${slot}`));
      }
    }
  }
  if (avatar.assetIds !== undefined) {
    if (!isObject(avatar.assetIds)) errors.push(issue(`${path}.assetIds`, 'assetIds must be an object'));
    else {
      for (const [key, value] of Object.entries(avatar.assetIds)) {
        if (typeof value !== 'string' || value.length === 0) {
          errors.push(issue(`${path}.assetIds.${key}`, 'asset id must be a non-empty string'));
        }
      }
    }
  }
  if (avatar.levelCap !== undefined) {
    if (!isObject(avatar.levelCap) || avatar.levelCap.max !== MAX_AVATAR_LEVEL || avatar.levelCap.status !== 'LOCKED') {
      errors.push(issue(`${path}.levelCap`, 'level cap is LOCKED at 5 (CORE-030)'));
    }
  }
  if (avatar.stars !== undefined) {
    if (!isObject(avatar.stars) || avatar.stars.value !== null || avatar.stars.status !== 'PENDING_OWNER') {
      errors.push(issue(`${path}.stars`, 'star cap is PENDING_OWNER and must stay null (OPEN-04)'));
    }
  }
  if (avatar.identity !== undefined) {
    if (!isObject(avatar.identity) || avatar.identity.decision !== 'new-character' || avatar.identity.status !== 'LOCKED') {
      errors.push(issue(`${path}.identity`, 'identity decision must stay the locked new-character record'));
    } else if (typeof avatar.identity.evidence !== 'string' || !avatar.identity.evidence.includes(OWNER_EVIDENCE_T253U)) {
      errors.push(issue(`${path}.identity.evidence`, `evidence must include "${OWNER_EVIDENCE_T253U}"`));
    }
  }
  if (avatar.relationship !== undefined) {
    errors.push(issue(`${path}.relationship`, 'gifts and relationship are companion-only (CORE-032)'));
  }
  return errors;
}
