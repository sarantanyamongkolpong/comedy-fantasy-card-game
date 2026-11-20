/**
 * Fragment plates are not in web/assets-manifest.json. The module page resolves
 * them with assetUrl(). The playable file is an iife, so that call throws, and
 * the booth then resolves the fragment path from the page URL. web/dist/playable.html
 * looks one directory up. web/index.html looks beside itself.
 */

import { assetUrl, bindImage } from '../assets.js';

export function gachaAssetUrl(entry, base) {
  const file = entry?.path ?? '';
  if (!file) return '';
  if (file.startsWith('data:') || file.startsWith('blob:') || file.startsWith('file:') || /^https?:/.test(file)) {
    return file;
  }
  try {
    if (base === undefined) return assetUrl(entry);
  } catch {
    /* playable iife leaves import.meta.url empty */
  }
  const relative = String(file).replace(/^web\//, '');
  const href = base ?? (typeof location !== 'undefined' ? location.href : 'http://localhost/web/index.html');
  const prefix = /\/dist\//.test(href) ? '../' : '';
  return new URL(`${prefix}${relative}`, href).href;
}

export function bindGacha(img, entry, options) {
  if (!entry) return bindImage(img, entry, options);
  try {
    return bindImage(img, entry, options);
  } catch {
    img.dataset.assetId = entry.asset_id ?? '';
    img.dataset.slot = entry.slot ?? '';
    img.loading = options?.eager ? 'eager' : 'lazy';
    img.decoding = 'async';
    const presentation = entry.presentation ?? {};
    if (presentation.blend) img.dataset.blend = presentation.blend;
    if (presentation.mask) img.dataset.mask = presentation.mask;
    img.src = gachaAssetUrl(entry);
    return img;
  }
}
