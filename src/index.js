export { DesignBlockedError } from './design/errors.js';
export { defaultRules, resolveRules } from './design/blocked-rules.js';
export {
  ADVISORY_STATUSES,
  ASSET_STATUSES,
  BASE_AP,
  CARD_ACTION_TYPES,
  FACTION_RECORDS,
  FEATURE_STATUSES,
  HAND_SIZE,
  PARTY_SIZE,
  STAT_KEYS,
} from './schema/constants.js';
export {
  validateActionCard,
  validateAssetManifest,
  validateAssetManifestEntry,
  validateAvatar,
  validateAvatarCard,
  validateEquipment,
  validateFaction,
  validateOwnership,
  validateStats,
  validateVariant,
  validationResult,
} from './schema/validate.js';
export { FACTIONS, SAMPLE_AVATARS, SAMPLE_EQUIPMENT, SAMPLE_VARIANTS, V05_JUSTIN_AVATARS } from './avatars/catalog.js';
export { SAMPLE_OWNERSHIP, createOwnership, rollAcquisition } from './avatars/ownership.js';
export { DEMO_ENEMY_TEAM, DEMO_MIXED_DECK, SAMPLE_ACTION_CARDS, SAMPLE_AVATAR_CARDS, V05_STARTER_ACTIONS } from './cards/catalog.js';
export { defaultRuleConfig, pendingOwnerFlags } from './config/index.js';
export { validateDeck } from './schema/deck.js';
export {
  HOUSE_TIERS,
  MAP_DESTINATIONS,
  PHASE3_FURNITURE_ART,
  acquireTier,
  displayHouseTier,
  installFurniture,
  removeFurniture,
  storageFromFurniture,
} from './schema/hideout.js';
export {
  DECK_SIZE,
  OWNER_EVIDENCE_T253U,
  OWNER_EVIDENCE_T261U,
  POW_TO_ATK,
  SAVE_VERSION,
} from './schema/constants.js';
export { migratePowToAtk, migrateSavePow, reversePowMigration, reverseSavePow } from './migrate/index.js';
export { createBannerState, exampleTestBanners, pull, testBanner } from './gacha/index.js';
export {
  adoptWebProfile,
  applyBattleReward,
  bindDeck,
  consumeDuplicate,
  createLocalStorageAdapter,
  createMemoryAdapter,
  createProfile,
  deserialize,
  grantItem,
  playerView,
  serialize,
  setAutoBattle,
  stackCounts,
  stashReport,
  setFavorite,
  setLocked,
  unbindDeck,
} from './save/index.js';

/**
 * Stream A contract names from the 20 Nov audit, section 4.
 * `src/engine` is not on this branch. The names exist so imports succeed.
 * Calling one throws ENGINE_NOT_LANDED until stream A lands and this file re-exports it.
 */
function engineNotLanded(name) {
  function unavailable() {
    const error = new Error(
      `${name} is the stream A contract export (src/engine/index.js). That module is not on this branch.`,
    );
    error.code = 'ENGINE_NOT_LANDED';
    throw error;
  }
  Object.defineProperty(unavailable, 'name', { value: name });
  return unavailable;
}

export const createMatch = engineNotLanded('createMatch');
export const startTurn = engineNotLanded('startTurn');
export const playAction = engineNotLanded('playAction');
export const discardVoluntary = engineNotLanded('discardVoluntary');
export const resolveEndOfRoundDiscard = engineNotLanded('resolveEndOfRoundDiscard');
export const getZones = engineNotLanded('getZones');
export const getOutcome = engineNotLanded('getOutcome');
// `endTurn` is already exported from src/battle/battle.js below. Replacing it
// would break src/debug/execute.js. Stream A's engine endTurn should land as
// a distinct export request if its signature differs.
export const ENGINE_CONTRACT_NAMES = Object.freeze([
  'createMatch',
  'startTurn',
  'playAction',
  'discardVoluntary',
  'endTurn',
  'resolveEndOfRoundDiscard',
  'getZones',
  'getOutcome',
]);
export const engineModuleStatus = Object.freeze({
  landed: false,
  owner: 'stream A',
  module: 'src/engine/index.js',
});
export {
  addCard,
  assertDeckSize,
  createDeck,
  createHand,
  discardCard,
  drawCards,
  removeCard,
} from './cards/hand.js';
export { assessActionPlay, assessAffordability, resolveApCost } from './cards/play.js';
export {
  createBattle,
  endTurn,
  evaluateOutcome,
  playCard,
  publicView,
  resolveEffect,
} from './battle/battle.js';
export { createAssetLoader } from './assets/loader.js';
export { FEATURES, featuresMarkdown } from './status/features.js';
