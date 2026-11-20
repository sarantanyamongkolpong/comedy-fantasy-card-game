/**
 * Validate content/prod/world against schema.json and the live canon indexes.
 * Exits 1 when the pack is inconsistent. Does not write game data.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORLD_FILES, loadCanon, repoRootFrom, SITE_DESTINATION } from './canon.js';
import { checkAgainstSchema } from './schema-check.js';

const FILE_DEFS = Object.freeze({
  'catalog.json': 'catalogFile',
  'npcs.json': 'npcFile',
  'shopkeepers.json': 'shopFile',
  'side-events.json': 'eventFile',
  'tutorials.json': 'tutorialFile',
  'progression.json': 'progressionFile',
});

const NULL_ECONOMY = new Set(['G', 'price', 'unlockCost', 'amount']);
const BANNED_KEYS = new Set([
  'weight',
  'weights',
  'dropRate',
  'odds',
  'rate',
  'rates',
  'pity',
  'pityEpic',
  'pityTop',
  'capacity',
  'gold',
  'coins',
  'cost',
  'costG',
]);
const FORBIDDEN_STRINGS = new Set(['LOCKED', 'OWNER_APPROVED', 'PRODUCTION_READY', 'QA_PASSED']);
const STATUS_VALUES = new Set(['GENERATED_REVIEW', 'PROPOSED', 'PENDING_OWNER']);
const REQUIRED_LOOPS = Object.freeze(['map', 'prep_battle', 'battle', 'rewards', 'gacha', 'hideout', 'stash', 'deck']);
const LOOP_SCREEN = Object.freeze({
  map: 'map',
  prep_battle: 'prep',
  battle: 'battle',
  rewards: 'rewards',
  gacha: 'gacha',
  hideout: 'home',
  stash: 'stash',
  deck: 'party',
  mall: 'mall',
});
const CONTROLS = Object.freeze({
  home: new Set(['Stash', 'Team & Deck', 'Gachapon', 'World Map']),
  map: new Set(['Hideout', 'Mysterious Tower', 'Tournament Arena', 'Sports Complex', 'Gachapon', 'Shopping Mall']),
  prep: new Set(['START BATTLE', 'BACK']),
  battle: new Set(['END TURN', 'Play card', 'BATTLE']),
  rewards: new Set(['Back to the Hideout']),
  gacha: new Set(['Pull 1', 'Pull 10']),
  stash: new Set(['Avatars', 'Actions', 'TEST tokens']),
  party: new Set(['Team of 4', 'Action deck']),
  mall: new Set(['Back to the Map']),
});

const schema = JSON.parse(readFileSync(new URL('./schema.json', import.meta.url), 'utf8'));

export function economyLeak(text) {
  if (/\b\d+\s*G\b/.test(text)) return 'G amount in text';
  if (/\bG\s*[:=]\s*\d+/.test(text)) return 'G assignment in text';
  if (/\b\d+\s*(?:gold|coins)\b/i.test(text)) return 'coin amount in text';
  if (/\b(?:price|priced)\b[^.\n]{0,24}\d+/.test(text)) return 'price digit in text';
  if (/\bunlock(?:\s+cost)?\b[^.\n]{0,24}\d+/.test(text)) return 'unlock digit in text';
  if (/\bcosts?\s+\d+\b(?!\s*AP)/.test(text)) return 'cost digit in text';
  return null;
}

export function loadWorldPack(root = repoRootFrom()) {
  const dir = path.join(root, 'content/prod/world');
  const present = readdirSync(dir).filter((name) => name.endsWith('.json')).sort();
  const expected = ['catalog.json', ...WORLD_FILES].sort();
  const loadErrors = [];
  if (JSON.stringify(present) !== JSON.stringify(expected)) {
    loadErrors.push(`content/prod/world json files are ${present.join(', ')}; expected ${expected.join(', ')}`);
  }
  const files = {};
  for (const name of ['catalog.json', ...WORLD_FILES]) {
    files[name] = JSON.parse(readFileSync(path.join(dir, name), 'utf8'));
  }
  return {
    root,
    files,
    loadErrors,
    catalog: files['catalog.json'],
    npcs: files['npcs.json'].npcs,
    shopkeepers: files['shopkeepers.json'].shopkeepers,
    sideEvents: files['side-events.json'].sideEvents,
    tutorials: files['tutorials.json'].tutorials,
    progression: files['progression.json'],
  };
}

export function validateWorldPack(pack, canon = loadCanon(pack.root)) {
  const errors = [...(pack.loadErrors ?? [])];
  for (const [fileName, defName] of Object.entries(FILE_DEFS)) {
    errors.push(...checkAgainstSchema(schema, pack.files[fileName], fileName, defName));
  }
  errors.push(...semanticErrors(pack, canon));
  return errors;
}

export function summarize(pack) {
  const stages = pack.progression.chapters.reduce((sum, chapter) => sum + chapter.stages.length, 0);
  const offers = pack.shopkeepers.reduce((sum, shop) => sum + shop.offers.length, 0);
  return {
    npcs: pack.npcs.length,
    shopkeepers: pack.shopkeepers.length,
    offers,
    sideEvents: pack.sideEvents.length,
    tutorials: pack.tutorials.length,
    chapters: pack.progression.chapters.length,
    stages,
    facilities: pack.progression.facilities.length,
    lockedNodes: pack.progression.lockedNodes.length,
    openQuestions: pack.catalog.openQuestions.length,
  };
}

function semanticErrors(pack, canon) {
  const errors = [];
  walkEconomy(pack.files, '$', errors);
  checkCatalog(pack, canon, errors);
  const ids = new Set();
  claimId(ids, pack.catalog.packId, 'WORLD_PACK_', 'catalog.packId', errors);
  for (const question of pack.catalog.openQuestions) claimId(ids, question.id, 'OQ_G_', 'catalog.openQuestions', errors);
  checkQuestionOrder(pack.catalog.openQuestions, errors);

  const buildings = new Map();
  for (const [index, npc] of pack.npcs.entries()) {
    const pathName = `npcs[${index}]`;
    claimId(ids, npc.id, 'NPC_', pathName, errors);
    rememberBuilding(buildings, npc.building, pathName, errors);
    buildingErrors(npc.building, canon, pathName, errors);
    resolveIds(npc.mentionsAvatarIds, canon.avatarIds, `${pathName}.mentionsAvatarIds`, errors);
    resolveIds(npc.mentionsCardIds, canon.cardIds, `${pathName}.mentionsCardIds`, errors);
  }
  const npcById = new Map(pack.npcs.map((npc) => [npc.id, npc]));
  const npcByAsset = groupBy(pack.npcs, (npc) => npc.building.assetId);

  for (const [index, shop] of pack.shopkeepers.entries()) {
    const pathName = `shopkeepers[${index}]`;
    claimId(ids, shop.id, 'SHOP_', pathName, errors);
    rememberBuilding(buildings, shop.building, pathName, errors);
    buildingErrors(shop.building, canon, pathName, errors);
    const npc = npcById.get(shop.npcId);
    if (!npc) errors.push(`${pathName}.npcId: unknown NPC ${shop.npcId}`);
    else if (npc.shopkeeperId !== shop.id) errors.push(`${pathName}.npcId: ${shop.npcId} does not point back at ${shop.id}`);
    else if (npc.building.assetId !== shop.building.assetId) errors.push(`${pathName}: shop building does not match its NPC`);
    checkOffers(shop, canon, pathName, errors, ids);
  }

  for (const [index, event] of pack.sideEvents.entries()) {
    const pathName = `sideEvents[${index}]`;
    claimId(ids, event.id, 'EVT_', pathName, errors);
    rememberBuilding(buildings, event.building, pathName, errors);
    buildingErrors(event.building, canon, pathName, errors);
    const npc = npcById.get(event.npcId);
    if (!npc) errors.push(`${pathName}.npcId: unknown NPC ${event.npcId}`);
    else if (npc.building.assetId !== event.building.assetId) errors.push(`${pathName}: event building does not match its NPC`);
    resolveIds(event.mentionsAvatarIds, canon.avatarIds, `${pathName}.mentionsAvatarIds`, errors);
    resolveIds(event.mentionsCardIds, canon.cardIds, `${pathName}.mentionsCardIds`, errors);
    resolveIds(event.mentionsEnemyIds, canon.enemies, `${pathName}.mentionsEnemyIds`, errors);
  }

  checkCoverage(pack, canon, npcByAsset, errors);
  checkTutorials(pack, canon, ids, errors);
  checkProgression(pack, canon, ids, buildings, errors);
  return errors;
}

function checkCatalog(pack, canon, errors) {
  if (JSON.stringify(pack.catalog.files) !== JSON.stringify([...WORLD_FILES])) {
    errors.push('catalog.files: must list the content files in pack order');
  }
  for (const source of pack.catalog.sources) {
    if (source.includes('..') || path.isAbsolute(source)) {
      errors.push(`catalog.sources: ${source} must stay inside the repo`);
      continue;
    }
    if (!existsSync(path.join(canon.root, source))) errors.push(`catalog.sources: missing ${source}`);
  }
}

function checkQuestionOrder(questions, errors) {
  const numbers = questions.map((question) => Number(question.id.slice('OQ_G_'.length)));
  const sorted = [...numbers].sort((left, right) => left - right);
  sorted.forEach((value, index) => {
    if (value !== index + 1) errors.push(`catalog.openQuestions: expected OQ_G_${String(index + 1).padStart(2, '0')} in the id set`);
  });
}

function checkOffers(shop, canon, pathName, errors, ids) {
  const assetId = shop.building.assetId;
  const mallAsset = assetByAction(canon, 'mall');
  const gachaAsset = assetByAction(canon, 'gacha');
  if (assetId === mallAsset) checkMallOffers(shop, canon, pathName, errors, ids);
  else if (assetId === gachaAsset) checkGachaOffers(shop, canon, pathName, errors, ids);
  else errors.push(`${pathName}: shopkeepers belong on the mall and gachapon only`);
}

function checkMallOffers(shop, canon, pathName, errors, ids) {
  const expected = [...canon.mallLabelByRef.keys()];
  const actual = shop.offers.map((offer) => offer.refId);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(`${pathName}.offers: mall offers must follow the mall screen rows`);
  }
  shop.offers.forEach((offer, index) => checkOneOffer(offer, canon, `${pathName}.offers[${index}]`, errors, ids, 'mall'));
}

function checkGachaOffers(shop, canon, pathName, errors, ids) {
  const actual = shop.offers.map((offer) => offer.refId);
  if (JSON.stringify(actual) !== JSON.stringify(canon.bannerOrder)) {
    errors.push(`${pathName}.offers: gacha offers must follow the test banner file`);
  }
  shop.offers.forEach((offer, index) => checkOneOffer(offer, canon, `${pathName}.offers[${index}]`, errors, ids, 'gacha'));
}

function checkOneOffer(offer, canon, pathName, errors, ids, venue) {
  claimId(ids, offer.id, 'OFFER_', pathName, errors);
  if (venue === 'mall') {
    if (offer.kind === 'gacha_banner' || offer.pool != null || offer.testOnly !== false || offer.currency != null) {
      errors.push(`${pathName}: mall offer is not a priced banner and stores no currency`);
    }
    const mallLabel = canon.mallLabelByRef.get(offer.refId);
    if (offer.mallScreenLabel !== mallLabel) errors.push(`${pathName}.mallScreenLabel: mall screen says ${mallLabel}`);
    if (offer.kind === 'furniture_art') {
      if (!canon.artIds.has(offer.refId)) errors.push(`${pathName}.refId: unknown furniture art ${offer.refId}`);
      if (offer.houseTierId != null) errors.push(`${pathName}.houseTierId: art rows are not a house tier`);
      if (offer.displayName !== mallLabel) errors.push(`${pathName}.displayName: art label must match the mall screen`);
    } else if (offer.kind === 'furniture_reference') {
      const tier = [...canon.tiers.values()].find((row) => row.referenceFurniture?.furnitureId === offer.refId);
      if (!tier) errors.push(`${pathName}.refId: unknown furniture reference ${offer.refId}`);
      else if (offer.houseTierId !== tier.id) errors.push(`${pathName}.houseTierId: ${offer.refId} belongs to ${tier.id}`);
      else if (offer.displayName !== tier.referenceFurniture.name) {
        errors.push(`${pathName}.displayName: sheet name is ${tier.referenceFurniture.name}`);
      }
    } else errors.push(`${pathName}.kind: mall rows are furniture`);
    return;
  }
  if (offer.kind !== 'gacha_banner' || offer.testOnly !== true || offer.houseTierId != null || offer.mallScreenLabel != null) {
    errors.push(`${pathName}: gacha offers cite test banners only`);
  }
  const banner = canon.banners.get(offer.refId);
  if (!banner) {
    errors.push(`${pathName}.refId: unknown banner ${offer.refId}`);
    return;
  }
  if (offer.pool !== banner.pool) errors.push(`${pathName}.pool: banner pool is ${banner.pool}`);
  if (offer.testOnly !== (banner.testOnly === true)) {
    errors.push(`${pathName}.testOnly: must follow the banner record`);
  }
  const expectedName = banner.bannerId.replaceAll('_', ' ');
  if (offer.displayName !== expectedName) errors.push(`${pathName}.displayName: client label is ${expectedName}`);
  const currency = banner.pool === 'companion' ? null : 'G';
  if (offer.currency !== currency) errors.push(`${pathName}.currency: expected ${currency === null ? 'null' : currency}`);
}

function checkCoverage(pack, canon, npcByAsset, errors) {
  const eventByAsset = groupBy(pack.sideEvents, (event) => event.building.assetId);
  const shopByAsset = groupBy(pack.shopkeepers, (shop) => shop.building.assetId);
  for (const assetId of canon.buildingOrder) {
    if ((npcByAsset.get(assetId) ?? []).length !== 1) errors.push(`npcs: ${assetId} needs exactly one NPC`);
    if ((eventByAsset.get(assetId) ?? []).length !== 1) errors.push(`sideEvents: ${assetId} needs exactly one side event`);
    const asset = canon.buildings.get(assetId);
    const shops = shopByAsset.get(assetId) ?? [];
    const commercial = asset.hotspot.action === 'mall' || asset.hotspot.action === 'gacha';
    if (commercial && shops.length !== 1) errors.push(`shopkeepers: ${assetId} needs exactly one shopkeeper`);
    if (!commercial && shops.length !== 0) errors.push(`shopkeepers: ${assetId} is not a shop`);
    const npc = (npcByAsset.get(assetId) ?? [])[0];
    if (!npc) continue;
    if (commercial && npc.shopkeeperId == null) errors.push(`npcs: ${npc.id} needs a shopkeeperId`);
    if (!commercial && npc.shopkeeperId != null) errors.push(`npcs: ${npc.id} is not a shopkeeper`);
  }
}

function checkTutorials(pack, canon, ids, errors) {
  const orders = new Set();
  const loops = new Set();
  pack.tutorials.forEach((tutorial, index) => {
    const pathName = `tutorials[${index}]`;
    claimId(ids, tutorial.id, 'TUT_', pathName, errors);
    if (orders.has(tutorial.order)) errors.push(`${pathName}.order: duplicate`);
    orders.add(tutorial.order);
    if (tutorial.screen !== tutorial.pointsAt.screen) errors.push(`${pathName}: pointsAt.screen must match screen`);
    if (LOOP_SCREEN[tutorial.loopStep] !== tutorial.screen) errors.push(`${pathName}: loopStep ${tutorial.loopStep} belongs on ${LOOP_SCREEN[tutorial.loopStep]}`);
    loops.add(tutorial.loopStep);
    const allowed = CONTROLS[tutorial.screen];
    if (tutorial.pointsAt.control != null && !allowed.has(tutorial.pointsAt.control)) {
      errors.push(`${pathName}.pointsAt.control: unknown control for ${tutorial.screen}`);
    }
    if (tutorial.pointsAt.hotspotId != null) {
      const asset = [...canon.buildings.values()].find((row) => row.hotspot.id === tutorial.pointsAt.hotspotId);
      if (!asset) errors.push(`${pathName}.pointsAt.hotspotId: unknown hotspot`);
      else if (tutorial.pointsAt.control != null && tutorial.pointsAt.control !== asset.hotspot.label) {
        errors.push(`${pathName}.pointsAt.control: hotspot label is ${asset.hotspot.label}`);
      }
    }
    if (tutorial.pointsAt.uiAnchorId != null && !canon.anchors.has(tutorial.pointsAt.uiAnchorId)) {
      errors.push(`${pathName}.pointsAt.uiAnchorId: unknown anchor`);
    }
    resolveIds(tutorial.mentionsAvatarIds, canon.avatarIds, `${pathName}.mentionsAvatarIds`, errors);
    resolveIds(tutorial.mentionsCardIds, canon.cardIds, `${pathName}.mentionsCardIds`, errors);
  });
  const expectedOrders = pack.tutorials.map((_, index) => index + 1);
  const actualOrders = [...orders].sort((left, right) => left - right);
  if (JSON.stringify(actualOrders) !== JSON.stringify(expectedOrders)) {
    errors.push('tutorials: order must be contiguous from 1');
  }
  for (const step of REQUIRED_LOOPS) {
    if (!loops.has(step)) errors.push(`tutorials: missing loop step ${step}`);
  }
}

function checkProgression(pack, canon, ids, buildings, errors) {
  const progression = pack.progression;
  claimId(ids, progression.id, 'PROG_', 'progression', errors);
  const stages = [];
  progression.chapters.forEach((chapter, index) => {
    const pathName = `chapters[${index}]`;
    if (chapter.order !== index + 1) errors.push(`${pathName}.order: expected ${index + 1}`);
    claimId(ids, chapter.id, 'CH_', pathName, errors);
    rememberBuilding(buildings, chapter.building, pathName, errors);
    buildingErrors(chapter.building, canon, pathName, errors);
    const stageOrders = new Set();
    chapter.stages.forEach((stage, stageIndex) => {
      const stagePath = `${pathName}.stages[${stageIndex}]`;
      if (stage.order !== stageIndex + 1) errors.push(`${stagePath}.order: expected ${stageIndex + 1}`);
      claimId(ids, stage.id, 'ST_', stagePath, errors);
      rememberBuilding(buildings, stage.building, stagePath, errors);
      buildingErrors(stage.building, canon, stagePath, errors);
      if (stage.building.assetId !== chapter.building.assetId) errors.push(`${stagePath}: stage building must match its chapter`);
      if (stage.webMode !== stage.building.webMode) errors.push(`${stagePath}.webMode: must match the building mode`);
      if (stageOrders.has(stage.order)) errors.push(`${stagePath}.order: duplicate`);
      stageOrders.add(stage.order);
      if (stage.catalogBattleId !== canon.battle.battleId) errors.push(`${stagePath}.catalogBattleId: unknown battle`);
      if (stage.rosterReuse !== canon.battle.battleId) errors.push(`${stagePath}.rosterReuse: must name the only catalog battle`);
      const expectedEnemies = (canon.battle.enemies ?? []).map((enemy) => ({
        enemyId: enemy.enemyId,
        displayName: enemy.displayName,
      }));
      if (JSON.stringify(stage.enemies) !== JSON.stringify(expectedEnemies)) {
        errors.push(`${stagePath}.enemies: must cite the catalog team in file order without renaming`);
      }
      if (JSON.stringify(stage.runtimeOpponent.avatarIds) !== JSON.stringify(canon.avatarIds)) {
        errors.push(`${stagePath}.runtimeOpponent.avatarIds: must be the Justin roster in file order`);
      }
      if (stage.runtimeOpponent.deckId !== canon.deck.deckId) errors.push(`${stagePath}.runtimeOpponent.deckId: unknown deck`);
      for (const cardId of canon.deck.cardIds ?? []) {
        if (!canon.actionCardIds.has(cardId)) errors.push(`${stagePath}: deck card ${cardId} is not an action card`);
      }
      stages.push(stage);
    });
    const expectedStageOrders = chapter.stages.map((_, stageIndex) => stageIndex + 1);
    const actualStageOrders = [...stageOrders].sort((left, right) => left - right);
    if (JSON.stringify(actualStageOrders) !== JSON.stringify(expectedStageOrders)) {
      errors.push(`${pathName}: stage order must be contiguous from 1`);
    }
  });
  const chapterOrders = progression.chapters.map((chapter) => chapter.order).sort((left, right) => left - right);
  if (JSON.stringify(chapterOrders) !== JSON.stringify(progression.chapters.map((_, index) => index + 1))) {
    errors.push('chapters: order must be contiguous from 1');
  }
  stages.forEach((stage, index) => {
    const expected = index === 0 ? null : stages[index - 1].id;
    if (stage.requiresStageId !== expected) {
      errors.push(`stages: ${stage.id} must require ${expected === null ? 'nothing' : expected}`);
    }
  });

  progression.facilities.forEach((facility, index) => {
    const pathName = `facilities[${index}]`;
    claimId(ids, facility.id, 'FAC_', pathName, errors);
    rememberBuilding(buildings, facility.building, pathName, errors);
    buildingErrors(facility.building, canon, pathName, errors);
  });
  progression.lockedNodes.forEach((node, index) => {
    const pathName = `lockedNodes[${index}]`;
    claimId(ids, node.id, 'NODE_', pathName, errors);
    rememberBuilding(buildings, node.building, pathName, errors);
    buildingErrors(node.building, canon, pathName, errors);
  });

  const placed = new Map();
  const take = (rows, kind) => {
    for (const row of rows) {
      const assetId = row.building.assetId;
      if (placed.has(assetId)) errors.push(`${assetId} is in both ${placed.get(assetId)} and ${kind}`);
      placed.set(assetId, kind);
    }
  };
  take(progression.chapters, 'chapters');
  take(progression.facilities, 'facilities');
  take(progression.lockedNodes, 'lockedNodes');
  for (const [assetId, asset] of canon.buildings) {
    const expected = classify(asset);
    if (placed.get(assetId) !== expected) {
      errors.push(`${assetId}: progression slot is ${placed.get(assetId) ?? 'missing'}; manifest class is ${expected}`);
    }
  }
}

function classify(asset) {
  if (asset.hotspot.locked === true || asset.hotspot.action === 'locked') return 'lockedNodes';
  if (asset.hotspot.action === 'battle') return 'chapters';
  return 'facilities';
}

function assetByAction(canon, action) {
  const asset = [...canon.buildings.values()].find((row) => row.hotspot.action === action);
  return asset?.asset_id ?? null;
}

function rememberBuilding(seen, building, pathName, errors) {
  const previous = seen.get(building.assetId);
  if (!previous) {
    seen.set(building.assetId, building);
    return;
  }
  if (JSON.stringify(previous) !== JSON.stringify(building)) {
    errors.push(`${pathName}.building: disagrees with an earlier citation of ${building.assetId}`);
  }
}

function buildingErrors(building, canon, pathName, errors) {
  const asset = canon.buildings.get(building.assetId);
  if (!asset) {
    errors.push(`${pathName}.building.assetId: unknown building ${building.assetId}`);
    return;
  }
  const hotspot = asset.hotspot;
  const at = `${pathName}.building`;
  if (building.hotspotId !== hotspot.id) errors.push(`${at}.hotspotId: manifest hotspot is ${hotspot.id}`);
  if (building.siteId !== hotspot.siteId) errors.push(`${at}.siteId: manifest siteId is ${hotspot.siteId}`);
  if (building.hotspotLabel !== hotspot.label) errors.push(`${at}.hotspotLabel: manifest label is ${hotspot.label}`);
  if (building.mapAction !== hotspot.action) errors.push(`${at}.mapAction: manifest action is ${hotspot.action}`);
  const mode = hotspot.mode ?? null;
  if (building.webMode !== mode) errors.push(`${at}.webMode: manifest mode is ${mode === null ? 'null' : mode}`);
  if (building.hotspotLocked !== (hotspot.locked === true)) {
    errors.push(`${at}.hotspotLocked: manifest locked is ${hotspot.locked === true}`);
  }
  const destinationId = SITE_DESTINATION[building.siteId];
  if (!destinationId) errors.push(`${at}.siteId: no destination alias for ${building.siteId}`);
  else if (building.mapDestinationId !== destinationId) {
    errors.push(`${at}.mapDestinationId: alias for ${building.siteId} is ${destinationId}`);
  }
  const destination = canon.destinations.get(building.mapDestinationId);
  if (!destination) errors.push(`${at}.mapDestinationId: unknown destination ${building.mapDestinationId}`);
  else if (building.mapDestinationName !== destination.name) {
    errors.push(`${at}.mapDestinationName: canon name is ${destination.name}`);
  } else if (hotspot.locked === true) {
    if (destination.playable !== false) errors.push(`${at}: locked pin destination is marked playable`);
    if (destination.implementation !== 'OUT_OF_SCOPE') errors.push(`${at}: locked pin is not OUT_OF_SCOPE in canon`);
  } else if (destination.playable !== true) {
    errors.push(`${at}: playable pin destination is not playable in canon`);
  }
}

function resolveIds(ids, known, pathName, errors) {
  const set = known instanceof Set ? known : new Set(known instanceof Map ? known.keys() : known);
  for (const id of ids) {
    if (!set.has(id)) errors.push(`${pathName}: unresolved ${id}`);
  }
}

function claimId(ids, id, prefix, pathName, errors) {
  if (typeof id !== 'string' || !id.startsWith(prefix)) errors.push(`${pathName}: id ${id} must start with ${prefix}`);
  if (ids.has(id)) errors.push(`${pathName}: duplicate id ${id}`);
  ids.add(id);
}

function groupBy(rows, keyOf) {
  const grouped = new Map();
  for (const row of rows) {
    const key = keyOf(row);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  return grouped;
}

function walkEconomy(value, pathName, errors) {
  if (typeof value === 'string') {
    if (FORBIDDEN_STRINGS.has(value)) errors.push(`${pathName}: forbidden status ${value}`);
    const leak = economyLeak(value);
    if (leak) errors.push(`${pathName}: ${leak}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkEconomy(item, `${pathName}[${index}]`, errors));
    return;
  }
  if (typeof value === 'number') {
    if (!pathName.endsWith('.order')) errors.push(`${pathName}: unexpected number`);
    return;
  }
  if (!value || typeof value !== 'object') return;
  const keys = Object.keys(value);
  if (keys.some((key) => NULL_ECONOMY.has(key))) {
    const pending = keys.some((key) => (key === 'status' || key.endsWith('Status')) && value[key] === 'PENDING_OWNER');
    if (!pending) errors.push(`${pathName}: economy values need PENDING_OWNER on the same object`);
  }
  for (const key of keys) {
    const child = value[key];
    const childPath = `${pathName}.${key}`;
    if (BANNED_KEYS.has(key)) errors.push(`${childPath}: banned economy or rate field`);
    if (NULL_ECONOMY.has(key) && child !== null) errors.push(`${childPath}: must be null`);
    if ((key === 'status' || key.endsWith('Status')) && typeof child === 'string' && !STATUS_VALUES.has(child)) {
      errors.push(`${childPath}: status ${child} is not allowed on this pack`);
    }
    walkEconomy(child, childPath, errors);
  }
}

function invokedDirectly() {
  if (!process.argv[1]) return false;
  return fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
}

if (invokedDirectly()) {
  const pack = loadWorldPack();
  const errors = validateWorldPack(pack);
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, ...summarize(pack) }, null, 2));
}
