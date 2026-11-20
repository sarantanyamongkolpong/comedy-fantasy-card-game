import { findAsset } from './assets.js';

/** Slots each screen actually paints. Bytes are the files behind those slots. */
export const SCREEN_ASSET_QUERIES = Object.freeze({
  home: [
    { slot: 'bg-hideout', subjectId: 'cabin' },
    { slot: 'house', subjectId: 'cabin' },
    { slot: 'hideout-furniture' },
    { slot: 'ui-button' },
    { slot: 'nav-icon' },
  ],
  stash: [
    { slot: 'bg-stash', subjectId: 'inventory' },
    { slot: 'inventory-prop', subjectId: 'backpack' },
    { slot: 'ui-frame' },
    { slot: 'ui-tab' },
    { slot: 'ui-button' },
    { slot: 'nav-icon' },
  ],
  party: [
    { slot: 'ui-button' },
    { slot: 'nav-icon' },
  ],
  map: [
    { slot: 'map-background' },
    { slot: 'building' },
  ],
  mall: [
    { slot: 'bg-mall', subjectId: 'mall' },
    { slot: 'mall-cutout' },
    { slot: 'ui-panel' },
    { slot: 'ui-button' },
  ],
  prep: [
    { slot: 'bg-prep', subjectId: 'prep' },
  ],
  battle: [
    { slot: 'bg-battle', subjectId: 'battle' },
    { slot: 'battle-vfx' },
    { slot: 'zone-vfx' },
  ],
  rewards: [
    { slot: 'bg-rewards', subjectId: 'room' },
    { slot: 'reward-cutout', subjectId: 'treasure' },
    { slot: 'reward-vfx', subjectId: 'coin' },
    { slot: 'ui-panel' },
    { slot: 'ui-button' },
  ],
  gacha: [
    { slot: 'bg-gacha', subjectId: 'gacha' },
    { slot: 'gacha-machine' },
    { slot: 'ui-icon', subjectId: 'g' },
  ],
});

export const SCREEN_BYTE_CAP = 2_000_000;

export function assetsForScreen(manifest, screen) {
  const queries = SCREEN_ASSET_QUERIES[screen] ?? [];
  const found = [];
  const seen = new Set();
  for (const query of queries) {
    const rows = query.subjectId
      ? [findAsset(manifest, query)].filter(Boolean)
      : (manifest?.assets ?? []).filter((asset) => asset.slot === query.slot && asset.default !== false);
    for (const asset of rows) {
      if (!asset?.path || seen.has(asset.path)) continue;
      seen.add(asset.path);
      found.push(asset);
    }
  }
  return found;
}

export function screenBytes(manifest, screen, sizeOf) {
  let total = 0;
  const files = [];
  for (const asset of assetsForScreen(manifest, screen)) {
    const bytes = sizeOf(asset.path);
    total += bytes;
    files.push({ assetId: asset.asset_id, path: asset.path, bytes });
  }
  return { screen, total, files };
}
