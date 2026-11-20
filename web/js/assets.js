/**
 * Manifest lookup. Screens ask for a slot (and rarity or subject).
 * They do not hard-code file paths.
 */

const byId = new Map();
let loaded = null;

export function findAsset(manifest, query) {
  const assets = manifest?.assets ?? [];
  return assets.find((asset) => {
    if (query.assetId && asset.asset_id !== query.assetId) return false;
    if (query.slot && asset.slot !== query.slot) return false;
    if (Object.prototype.hasOwnProperty.call(query, 'rarity') && asset.rarity !== query.rarity) return false;
    if (Object.prototype.hasOwnProperty.call(query, 'subjectId') && asset.subject_id !== query.subjectId) return false;
    return true;
  }) ?? null;
}

export function firstAsset(manifest, queries) {
  for (const query of queries) {
    const found = findAsset(manifest, query);
    if (found) return found;
  }
  return null;
}

export function assetUrl(entry) {
  const file = entry?.path;
  if (!file) return '';
  const relative = file.replace(/^web\//, '');
  return new URL(`../${relative}`, import.meta.url).href;
}

/** Point an img at a manifest entry and fall back to the placeholder if the file fails. */
export function bindImage(img, entry) {
  if (!entry) return img;
  img.dataset.assetId = entry.asset_id ?? '';
  img.dataset.slot = entry.slot ?? '';
  if (entry.placeholder) img.dataset.placeholder = 'true';
  if (entry.review_status) img.dataset.reviewStatus = entry.review_status;
  img.src = assetUrl(entry);
  if (entry.fallback_path) {
    img.addEventListener('error', () => {
      if (img.dataset.fellBack === 'true') return;
      img.dataset.fellBack = 'true';
      img.src = assetUrl({ path: entry.fallback_path });
    });
  }
  return img;
}

export async function loadManifest() {
  const url = new URL('../assets-manifest.json', import.meta.url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Asset manifest failed (${response.status})`);
  const manifest = await response.json();
  byId.clear();
  for (const asset of manifest.assets ?? []) byId.set(asset.asset_id, asset);
  loaded = manifest;
  return manifest;
}

export function manifest() {
  return loaded;
}
