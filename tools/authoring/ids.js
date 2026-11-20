import { FACTION_RECORDS } from '../../src/schema/constants.js';

/** Faction codes taken from the schema constants. FAC_AEG → AEG. */
export const FACTION_CODES = Object.freeze(
  FACTION_RECORDS.map((record) => {
    if (!record.factionId.startsWith('FAC_') || record.factionId.length <= 4) {
      throw new Error(`Schema factionId "${record.factionId}" has no FAC_ code`);
    }
    return record.factionId.slice(4);
  }),
);

const CODE = FACTION_CODES.join('|');

/** Character id: AVT_<FAC>_NNN. NNN is three digits, matching the starter ids. */
export const AVATAR_ID_PATTERN = new RegExp(`^AVT_(${CODE})_(\\d{3})$`);

/** Avatar card id from docs/DATA_SCHEMA.md: AVC_ plus the avatar id. */
export const AVATAR_CARD_ID_PATTERN = new RegExp(`^AVC_AVT_(${CODE})_\\d{3}$`);

/**
 * Action card ids in the shipped schema samples use an ACT_ prefix.
 * The schema itself only requires a non-empty string. See docs/CONTENT_AUTHORING.md.
 */
export const ACTION_CARD_ID_PATTERN = /^ACT_[A-Z][A-Z0-9_]*$/;

/** Equipment ids in the art manifest use an EQ_ prefix. */
export const EQUIPMENT_ID_PATTERN = /^EQ_[A-Z0-9_]+$/;

const EQUIPMENT_FACTION_PATTERN = new RegExp(`^EQ_(${CODE})_`);

/**
 * @param {string} factionId
 * @returns {string | null}
 */
export function factionCodeOf(factionId) {
  if (typeof factionId !== 'string' || !factionId.startsWith('FAC_')) return null;
  const code = factionId.slice(4);
  return FACTION_CODES.includes(code) ? code : null;
}

/**
 * @param {unknown} avatarId
 * @returns {{ ok: true, code: string, number: string } | { ok: false }}
 */
export function parseAvatarId(avatarId) {
  if (typeof avatarId !== 'string') return { ok: false };
  const match = AVATAR_ID_PATTERN.exec(avatarId);
  if (!match) return { ok: false };
  return { ok: true, code: match[1], number: match[2] };
}

/**
 * @param {unknown} equipmentId
 * @returns {string | null} Faction code when the id is EQ_<FAC>_…, otherwise null.
 */
export function equipmentFactionCode(equipmentId) {
  if (typeof equipmentId !== 'string') return null;
  const match = EQUIPMENT_FACTION_PATTERN.exec(equipmentId);
  return match ? match[1] : null;
}

export const OFFICIAL_FACTION_NAMES = Object.freeze(FACTION_RECORDS.map((record) => record.name));

/**
 * Map an official faction name to its id. Unknown strings are returned unchanged.
 * @param {unknown} value
 */
export function factionIdFromAuthorValue(value) {
  if (typeof value !== 'string') return value;
  const byName = FACTION_RECORDS.find((record) => record.name === value);
  return byName ? byName.factionId : value;
}
