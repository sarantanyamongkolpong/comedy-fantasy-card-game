import { SAVE_VERSION } from '../schema/constants.js';

const REQUIRED = ['profileId', 'inventory', 'decks', 'currency', 'pity', 'house', 'rewardLedger'];
const READABLE_VERSIONS = new Set([1, SAVE_VERSION]);

/**
 * @param {object} profile
 */
export function serialize(profile) {
  if (!profile || typeof profile !== 'object') throw new TypeError('profile is required');
  return JSON.stringify({ saveVersion: SAVE_VERSION, profile });
}

/**
 * @param {string | { saveVersion: number, profile: object }} json
 */
export function deserialize(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new TypeError('save must be an object');
  if (!READABLE_VERSIONS.has(data.saveVersion)) {
    throw new Error(`Unsupported saveVersion ${String(data.saveVersion)}; this build reads ${SAVE_VERSION}`);
  }
  const profile = data.profile;
  if (!profile || typeof profile !== 'object') throw new TypeError('save is missing profile');
  for (const key of REQUIRED) {
    if (!Object.prototype.hasOwnProperty.call(profile, key)) throw new TypeError(`save profile is missing ${key}`);
  }
  if (!profile.inventory.avatars || !profile.inventory.actions || !profile.inventory.companions) {
    throw new TypeError('save inventory must include avatars, actions, and companions');
  }
  if (typeof profile.currency.G !== 'number') throw new TypeError('save currency.G must be a number');
  return migrateProfile(profile);
}

/**
 * Version 1 saves have no AUTO preference. Missing autoBattle becomes false.
 * A boolean already stored is kept.
 * @param {object} profile
 */
function migrateProfile(profile) {
  const next = structuredClone(profile);
  const current = next.preferences;
  const bag = current && typeof current === 'object' && !Array.isArray(current) ? current : {};
  const autoBattle = typeof bag.autoBattle === 'boolean' ? bag.autoBattle : false;
  next.preferences = { ...bag, autoBattle };
  next.saveVersion = SAVE_VERSION;
  return next;
}
