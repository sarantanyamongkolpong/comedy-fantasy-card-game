import { migrateSavePow } from '../migrate/save-pow.js';
import { SAVE_VERSION } from '../schema/constants.js';
// Sport v3 hook (sim-race stream). Adds profile.sport on load.
// SAVE_VERSION stays 2 so existing v1/v2 profiles still report 2.
// See src/sport/save/migrate-v3.js.
import { migrateSportV3 } from '../sport/save/migrate-v3.js';

const REQUIRED = ['profileId', 'inventory', 'decks', 'currency', 'pity', 'house', 'rewardLedger'];
const READABLE_VERSIONS = new Set([1, 2, 3]);

function isDataProfile(profile) {
  return Boolean(
    profile
    && profile.inventory
    && Array.isArray(profile.inventory.avatars)
    && Array.isArray(profile.inventory.actions)
    && Array.isArray(profile.inventory.companions)
    && Array.isArray(profile.decks)
    && profile.currency
    && typeof profile.currency.G === 'number',
  );
}

function isWebPlayer(profile) {
  return Array.isArray(profile.team) || Array.isArray(profile.deck) || Array.isArray(profile.avatars);
}

/**
 * Store a web starter as a versioned profile. `team` and `deck` stay on the profile.
 * The original object is kept at `web.ui`.
 * @param {object} ui
 */
export function adoptWebProfile(ui) {
  return {
    profileId: typeof ui.profileId === 'string' ? ui.profileId : 'PLAYER',
    saveVersion: SAVE_VERSION,
    preferences: {
      autoBattle: ui.preferences?.autoBattle === true || ui.autoPlay?.enabled === true,
    },
    inventory: isDataProfile(ui) ? structuredClone(ui.inventory) : { avatars: [], actions: [], companions: [] },
    decks: Array.isArray(ui.decks) ? structuredClone(ui.decks) : [],
    currency: {
      G: typeof ui.currency?.G === 'number' ? ui.currency.G : (Number.isInteger(ui.currencyG) ? ui.currencyG : 0),
    },
    pity: ui.pity && typeof ui.pity === 'object' ? structuredClone(ui.pity) : {},
    house: ui.house?.acquiredTiers
      ? structuredClone(ui.house)
      : {
        acquiredTiers: ['cabin'],
        displayTier: ui.house?.tierId ?? 'cabin',
        installedFurniture: [],
      },
    rewardLedger: ui.rewardLedger && typeof ui.rewardLedger === 'object' ? structuredClone(ui.rewardLedger) : {},
    team: Array.isArray(ui.team) ? structuredClone(ui.team) : [],
    deck: Array.isArray(ui.deck) ? structuredClone(ui.deck) : [],
    web: { ui: structuredClone(ui) },
  };
}

/**
 * Player fields web should put on the object it returns from deserialize.
 * @param {object} profile
 */
export function playerView(profile) {
  const ui = profile?.web?.ui && typeof profile.web.ui === 'object' ? structuredClone(profile.web.ui) : {};
  if (Array.isArray(profile?.team)) ui.team = structuredClone(profile.team);
  if (Array.isArray(profile?.deck)) ui.deck = structuredClone(profile.deck);
  return ui;
}

/**
 * @param {object} profile
 */
export function serialize(profile) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) throw new TypeError('profile is required');
  const stored = isDataProfile(profile) ? profile : (isWebPlayer(profile) ? adoptWebProfile(profile) : profile);
  // A profile that already opted into sport schema 3 keeps that envelope.
  // Ordinary card-game profiles stay on SAVE_VERSION (2).
  const envelope = stored.saveVersion === 3 ? 3 : SAVE_VERSION;
  return JSON.stringify({ saveVersion: envelope, profile: stored });
}

/**
 * @param {string | { saveVersion: number, profile: object }} json
 */
export function deserialize(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new TypeError('save must be an object');
  if (!READABLE_VERSIONS.has(data.saveVersion)) {
    throw new Error(`Unsupported saveVersion ${String(data.saveVersion)}; this build reads 1, 2, and 3`);
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
  return liftPlayerFields(migrateSavePow(migrateProfile(profile)));
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
  if (next.saveVersion !== 3) next.saveVersion = SAVE_VERSION;
  return migrateSportV3(next);
}

function liftPlayerFields(profile) {
  const ui = profile.web?.ui;
  if (!ui || typeof ui !== 'object') return profile;
  if (!Object.prototype.hasOwnProperty.call(profile, 'team') && Array.isArray(ui.team)) {
    profile.team = structuredClone(ui.team);
  }
  if (!Object.prototype.hasOwnProperty.call(profile, 'deck') && Array.isArray(ui.deck)) {
    profile.deck = structuredClone(ui.deck);
  }
  return profile;
}
