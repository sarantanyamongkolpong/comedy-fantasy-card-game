/**
 * Read-only indexes of canon the world pack is allowed to cite.
 * This module does not write content, combat, prices, or the asset manifest.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Observed hotspot siteId -> locked map destination id. Not a rename. */
export const SITE_DESTINATION = Object.freeze({
  home: 'home',
  tower: 'mysterious-tower',
  arena: 'tournament-arena',
  sports: 'sports-complex',
  gachapon: 'gachapon',
  mall: 'shopping-mall',
});

/**
 * Player-facing mall rows copied from web/js/screens/mall.js.
 * Labels are the screen's words. Reference-furniture sheet names can differ.
 */
export const MALL_ROWS = Object.freeze([
  ['Companion bed', 'furniture_companion_bed'],
  ['Cozy sofa', 'furniture_cozy_sofa'],
  ['Bookcase', 'furniture_bookcase'],
  ['Trophy shelf', 'furniture_trophy_shelf'],
  ['Wardrobe', 'furniture_wardrobe'],
  ['Magic workbench', 'furniture_magic_workbench'],
  ['Ornate chest', 'furniture_ornate_storage_chest'],
  ['Box', 'FUR_REF_BUNGALOW_BOX'],
  ['Cottage box', 'FUR_REF_COTTAGE_BOX'],
  ['Tall cabinet', 'FUR_REF_LOFT_TALL_CABINET'],
  ['Display counter', 'FUR_REF_VILLA_DISPLAY_COUNTER'],
  ['Large tall cabinet', 'FUR_REF_PENTHOUSE_LARGE_TALL_CABINET'],
]);

export const WORLD_FILES = Object.freeze([
  'npcs.json',
  'shopkeepers.json',
  'side-events.json',
  'tutorials.json',
  'progression.json',
]);

export function repoRootFrom(metaUrl = import.meta.url) {
  return path.resolve(path.dirname(fileURLToPath(metaUrl)), '../../..');
}

export function loadCanon(root = repoRootFrom()) {
  const manifest = readJson(root, 'web/assets-manifest.json');
  const buildings = (manifest.assets ?? []).filter((asset) => asset.slot === 'building' && asset.hotspot);
  const byAsset = new Map(buildings.map((asset) => [asset.asset_id, asset]));
  const enemiesFile = readJson(root, 'content/v05/enemies/demo-battle.json');
  const battle = enemiesFile.battle;
  const house = readJson(root, 'content/v05/hideout/house-tiers.json');
  const art = readJson(root, 'content/v05/hideout/phase3-furniture-art.json');
  const actions = readJson(root, 'content/v05/actions/starter-actions.json');
  const avatars = readJson(root, 'content/v05/avatars/justin-avatars.json');
  const deckFile = readJson(root, 'content/v05/decks/demo-mixed-deck.json');
  const banners = readJson(root, 'content/v05/gacha/TEST_ONLY_banners.json');
  const actionCardIds = new Set((actions.actionCards ?? []).map((card) => card.cardId));
  const cardIds = new Set(actionCardIds);
  collectCardIds(avatars, cardIds);
  return {
    root,
    buildings: byAsset,
    buildingOrder: buildings.map((asset) => asset.asset_id),
    anchors: new Set((manifest.uiAnchors ?? []).map((anchor) => anchor.id)),
    destinations: new Map((house.mapDestinations ?? []).map((row) => [row.id, row])),
    tiers: new Map((house.houseTiers ?? []).map((row) => [row.id, row])),
    artIds: new Set((art.furniture ?? []).map((row) => row.assetId)),
    battle,
    enemies: new Map((battle.enemies ?? []).map((enemy) => [enemy.enemyId, enemy])),
    actionCardIds,
    cardIds,
    avatarIds: (avatars.avatars ?? []).map((avatar) => avatar.avatarId),
    deck: deckFile.deck,
    banners: new Map((banners.banners ?? []).map((banner) => [banner.bannerId, banner])),
    bannerOrder: (banners.banners ?? []).map((banner) => banner.bannerId),
    mallLabelByRef: new Map(MALL_ROWS.map(([label, id]) => [id, label])),
  };
}

function collectCardIds(value, into) {
  if (Array.isArray(value)) {
    for (const item of value) collectCardIds(item, into);
    return;
  }
  if (!value || typeof value !== 'object') return;
  if (typeof value.cardId === 'string') into.add(value.cardId);
  for (const child of Object.values(value)) collectCardIds(child, into);
}

function readJson(root, relative) {
  return JSON.parse(readFileSync(path.join(root, relative), 'utf8'));
}
