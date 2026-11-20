/**
 * Thin adapter over the v0.5 contract.
 *
 * Real modules (when streams A and B have pushed them):
 *   src/engine/index.js  createMatch, startTurn, playAction, discardVoluntary,
 *                        endTurn, resolveEndOfRoundDiscard, getZones, getOutcome
 *   src/config/index.js  defaultRuleConfig
 *   src/gacha/index.js   createBannerState, pull
 *   src/save/index.js    serialize, deserialize
 *   content/v05/index.js optional catalog
 *
 * Until those exports exist, this file serves the clearly marked mock.
 * It does not copy engine or content files onto this branch.
 */

import * as mock from './mock-engine.js';
import { sampleCatalog } from './sample-catalog.js';

const ENGINE_URL = '../../src/engine/index.js';
const CONFIG_URL = '../../src/config/index.js';
const GACHA_URL = '../../src/gacha/index.js';
const SAVE_URL = '../../src/save/index.js';
const CONTENT_URL = '../../content/v05/index.js';

async function tryImport(specifier) {
  try {
    return await import(specifier);
  } catch {
    return null;
  }
}

function normalizeContent(content) {
  if (!content) return null;
  const avatars = content.avatars ?? content.AVATARS;
  const actionCards = content.actionCards ?? content.ACTION_CARDS;
  if (!Array.isArray(avatars) || !Array.isArray(actionCards)) return null;
  const avatarMap = new Map(avatars.map((avatar) => [avatar.avatarId, avatar]));
  const cardMap = new Map(actionCards.map((card) => [card.cardId, card]));
  const banners = Array.isArray(content.banners) ? content.banners : sampleCatalog.banners;
  const justinIds = avatars.filter((avatar) => avatar.battleLegal !== false && /_002$/.test(avatar.avatarId)).map((avatar) => avatar.avatarId);
  return {
    source: 'content/v05',
    productionReady: false,
    avatars,
    actionCards,
    banners,
    justinIds: justinIds.length === 4 ? justinIds : sampleCatalog.justinIds,
    avatarById: (id) => avatarMap.get(id) ?? null,
    cardById: (id) => cardMap.get(id) ?? null,
    factionName: sampleCatalog.factionName,
  };
}

function missingExports(parts) {
  const missing = [];
  const engineNeeds = ['createMatch', 'startTurn', 'playAction', 'discardVoluntary', 'endTurn', 'resolveEndOfRoundDiscard', 'getZones', 'getOutcome'];
  for (const name of engineNeeds) {
    if (typeof parts.engine?.[name] !== 'function') missing.push(`src/engine/index.js#${name}`);
  }
  if (typeof parts.config?.defaultRuleConfig !== 'function') missing.push('src/config/index.js#defaultRuleConfig');
  if (typeof parts.gacha?.createBannerState !== 'function') missing.push('src/gacha/index.js#createBannerState');
  if (typeof parts.gacha?.pull !== 'function') missing.push('src/gacha/index.js#pull');
  if (typeof parts.save?.serialize !== 'function') missing.push('src/save/index.js#serialize');
  if (typeof parts.save?.deserialize !== 'function') missing.push('src/save/index.js#deserialize');
  return missing;
}

function bindReal(parts, catalog) {
  return {
    source: 'engine',
    productionReady: false,
    missing: [],
    catalog,
    createMatch: parts.engine.createMatch,
    startTurn: parts.engine.startTurn,
    playAction: parts.engine.playAction,
    discardVoluntary: parts.engine.discardVoluntary,
    endTurn: parts.engine.endTurn,
    resolveEndOfRoundDiscard: parts.engine.resolveEndOfRoundDiscard,
    getZones: parts.engine.getZones,
    getOutcome: parts.engine.getOutcome,
    playEnemyTurn: parts.engine.playEnemyTurn ?? parts.engine.runEnemyTurn ?? null,
    playBlockReason: parts.engine.playBlockReason ?? null,
    defaultRuleConfig: parts.config.defaultRuleConfig,
    createBannerState: parts.gacha.createBannerState,
    pull: parts.gacha.pull,
    serialize: parts.save.serialize,
    deserialize: parts.save.deserialize,
  };
}

function bindMock(catalog, missing) {
  return {
    source: 'mock',
    productionReady: false,
    missing,
    catalog,
    createMatch: mock.createMatch,
    startTurn: mock.startTurn,
    playAction: mock.playAction,
    discardVoluntary: mock.discardVoluntary,
    endTurn: mock.endTurn,
    resolveEndOfRoundDiscard: mock.resolveEndOfRoundDiscard,
    getZones: mock.getZones,
    getOutcome: mock.getOutcome,
    playEnemyTurn: mock.playEnemyTurn,
    playBlockReason: mock.playBlockReason,
    defaultRuleConfig: mock.defaultRuleConfig,
    createBannerState: mock.createBannerState,
    pull: mock.pull,
    serialize: mock.serialize,
    deserialize: mock.deserialize,
  };
}

export async function loadGameApi() {
  const [engine, config, gacha, saveMod, content] = await Promise.all([
    tryImport(ENGINE_URL),
    tryImport(CONFIG_URL),
    tryImport(GACHA_URL),
    tryImport(SAVE_URL),
    tryImport(CONTENT_URL),
  ]);
  const catalog = normalizeContent(content) ?? sampleCatalog;
  const parts = { engine, config, gacha, save: saveMod };
  const missing = missingExports(parts);
  if (missing.length > 0) return bindMock(catalog, missing);
  return bindReal(parts, catalog);
}
