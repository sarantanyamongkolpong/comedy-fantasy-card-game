/**
 * Thin adapter over the v0.5 contract.
 *
 * Real modules (when streams A and B have pushed them):
 *   src/engine/index.js  createMatch, startTurn, playAction, discardVoluntary,
 *                        endTurn, resolveEndOfRoundDiscard, getZones, getOutcome
 *   src/config/index.js  defaultRuleConfig
 *   src/gacha/index.js   createBannerState, pull
 *   src/save/index.js    serialize, deserialize
 *   content/v05 JSON via web/js/content-catalog.js
 *
 * Enemy turns use `playEnemyTurn`. Player AUTO uses `runAutoTurn` and
 * `chooseAutoActions`. `runEnemyTurn` remains the older demo helper.
 * The mock remains only when a required export is missing.
 */

import { chooseAutoActions, playEnemyTurn, runAutoTurn, runEnemyTurn } from '../../src/engine/index.js';
import * as engineMod from '../../src/engine/index.js';
import * as configMod from '../../src/config/index.js';
import * as gachaMod from '../../src/gacha/index.js';
import * as saveMod from '../../src/save/index.js';
import { contentCatalog } from './content-catalog.js';
import { bindEngine } from './engine-session.js';
import * as mock from './mock-engine.js';
import { sampleCatalog } from './sample-catalog.js';

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
  if (typeof parts.save?.createProfile !== 'function') missing.push('src/save/index.js#createProfile');
  if (typeof runEnemyTurn !== 'function') missing.push('src/engine/index.js#runEnemyTurn');
  if (typeof chooseAutoActions !== 'function') missing.push('src/engine/index.js#chooseAutoActions');
  if (typeof runAutoTurn !== 'function') missing.push('src/engine/index.js#runAutoTurn');
  if (typeof playEnemyTurn !== 'function') missing.push('src/engine/index.js#playEnemyTurn');
  return missing;
}

function bindReal(parts) {
  const session = bindEngine(parts.engine, parts.gacha, parts.save, {
    playEnemyTurn,
    runAutoTurn,
    chooseAutoActions,
    runEnemyTurn,
  });
  return {
    source: 'engine',
    productionReady: false,
    missing: [],
    catalog: contentCatalog,
    dataRules: parts.config.defaultRuleConfig,
    ...session,
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
  const parts = { engine: engineMod, config: configMod, gacha: gachaMod, save: saveMod };
  const missing = missingExports(parts);
  if (missing.length > 0) return bindMock(sampleCatalog, missing);
  return bindReal(parts);
}
