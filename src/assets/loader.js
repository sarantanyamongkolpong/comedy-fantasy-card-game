import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADVISORY_STATUSES, ASSET_STATUSES } from '../schema/constants.js';

const defaultSlotAnchorMap = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'slot-anchor-map.json'), 'utf8'),
);

/**
 * @param {object | undefined} input
 */
function anchorMapOf(input) {
  const source = input ?? defaultSlotAnchorMap;
  return source.map ?? source;
}

/**
 * @param {object} manifest
 * @returns {{ byId: Map<string, object>, warnings: object[] }}
 */
function indexManifest(manifest) {
  if (!manifest || !Array.isArray(manifest.assets)) {
    throw new TypeError('manifest.assets array is required');
  }
  const byId = new Map();
  const warnings = [];
  for (const entry of manifest.assets) {
    if (!entry || typeof entry.asset_id !== 'string' || entry.asset_id.length === 0) {
      warnings.push({ reason: 'ENTRY_MISSING_ID' });
      continue;
    }
    if (byId.has(entry.asset_id)) {
      warnings.push({ reason: 'DUPLICATE_ID', assetId: entry.asset_id });
      continue;
    }
    byId.set(entry.asset_id, entry);
  }
  return { byId, warnings };
}

/**
 * @param {object} dataFiles
 * @param {string} equipmentId
 */
function lookupItem(dataFiles, equipmentId) {
  const items = dataFiles?.items;
  if (!items) return null;
  if (Array.isArray(items)) return items.find((item) => item.asset_id === equipmentId || item.equipmentId === equipmentId) ?? null;
  return items[equipmentId] ?? null;
}

/**
 * @param {object} dataFiles
 * @param {string} avatarId
 */
function findCharacter(dataFiles, avatarId) {
  const rigs = dataFiles?.rigs;
  const list = Array.isArray(rigs) ? rigs : rigs?.rigs;
  if (!Array.isArray(list)) return null;
  for (const rig of list) {
    const character = rig?.characters?.[avatarId];
    if (character) return { rig, character };
  }
  return null;
}

/**
 * Resolve assets by id. Pixel positions are read from `dataFiles` and the slot map.
 * Missing ids return a result. CONCEPT and PROTOTYPE return a result plus an advisory.
 * @param {{ manifest: object, dataFiles?: object, slotAnchorMap?: object }} options
 */
export function createAssetLoader({ manifest, dataFiles = {}, slotAnchorMap } = {}) {
  const { byId, warnings } = indexManifest(manifest);
  const slotsToAnchors = anchorMapOf(slotAnchorMap);

  function resolve(assetId) {
    if (typeof assetId !== 'string' || assetId.length === 0 || !byId.has(assetId)) {
      return {
        ok: false,
        found: false,
        assetId: assetId ?? null,
        reason: 'MISSING_ID',
        advisory: null,
        entry: null,
        status: null,
        productionReady: false,
      };
    }
    const entry = byId.get(assetId);
    const status = entry.status ?? null;
    const known = ASSET_STATUSES.includes(status);
    let advisory = null;
    if (!known) advisory = 'UNKNOWN_STATUS';
    else if (ADVISORY_STATUSES.includes(status)) advisory = status;
    const productionReady = status === 'PRODUCTION_READY' || status === 'INTEGRATED';
    return {
      ok: true,
      found: true,
      assetId,
      entry,
      status,
      advisory,
      productionReady,
      reason: null,
    };
  }

  function integrity(assetId) {
    const resolved = resolve(assetId);
    if (!resolved.found) return resolved;
    return {
      ok: true,
      assetId,
      sha256: resolved.entry.sha256 ?? null,
      bytes: resolved.entry.bytes ?? null,
    };
  }

  function layoutRect(rectName) {
    const layout = dataFiles.frameLayout;
    if (!layout || !layout.rects || typeof layout.rects !== 'object') {
      return { ok: false, reason: 'LAYOUT_UNAVAILABLE', rectName };
    }
    const rect = layout.rects[rectName];
    if (!rect) return { ok: false, reason: 'UNKNOWN_RECT', rectName };
    return {
      ok: true,
      rectName,
      rect: { x: rect.x, y: rect.y, w: rect.w, h: rect.h },
      units: layout.units ?? null,
    };
  }

  /**
   * Place an equipment item on an avatar.
   * origin = anchor − pivot + fit. Every number comes from data files.
   * A missing fit entry contributes [0, 0] (no extra offset).
   * @param {string} avatarId
   * @param {string} equipmentId
   * @param {{ slot?: string }} [options]
   */
  function placement(avatarId, equipmentId, options = {}) {
    const item = lookupItem(dataFiles, equipmentId);
    if (!item) return { ok: false, reason: 'MISSING_EQUIPMENT_DATA', equipmentId, avatarId };
    const found = findCharacter(dataFiles, avatarId);
    if (!found) return { ok: false, reason: 'MISSING_RIG', avatarId, equipmentId };
    const anchors = found.character.anchors;
    if (!anchors || typeof anchors !== 'object') {
      return { ok: false, reason: 'MISSING_ANCHORS', avatarId, equipmentId };
    }
    const rawSlot = options.slot ?? item.slot;
    if (typeof rawSlot !== 'string' || rawSlot.length === 0) {
      return { ok: false, reason: 'MISSING_SLOT', equipmentId, avatarId };
    }
    const slots = rawSlot.split('|').map((slot) => slot.trim()).filter((slot) => slot.length > 0);
    if (slots.length === 0) return { ok: false, reason: 'MISSING_SLOT', equipmentId, avatarId };
    if (slots.length > 1 && options.slot === undefined) {
      return { ok: false, reason: 'AMBIGUOUS_SLOT', equipmentId, avatarId, slots };
    }
    const slot = options.slot ?? slots[0];
    const anchorName = slotsToAnchors[slot];
    if (typeof anchorName !== 'string' || anchorName.length === 0) {
      return { ok: false, reason: 'NO_ANCHOR_MAPPING', slot, equipmentId, avatarId };
    }
    const anchor = anchors[anchorName];
    if (!Array.isArray(anchor) || anchor.length !== 2) {
      return { ok: false, reason: 'MISSING_ANCHOR', anchorName, avatarId, equipmentId };
    }
    const pivot = item.pivot;
    if (!Array.isArray(pivot) || pivot.length !== 2) {
      return { ok: false, reason: 'MISSING_PIVOT', equipmentId, avatarId };
    }
    const fitEntry = found.character.fit?.[equipmentId];
    const fit = fitEntry ?? [0, 0];
    if (!Array.isArray(fit) || fit.length !== 2) {
      return { ok: false, reason: 'INVALID_FIT', equipmentId, avatarId };
    }
    const origin = [anchor[0] - pivot[0] + fit[0], anchor[1] - pivot[1] + fit[1]];
    const native = item.native_origin ?? item.native_origin_on_128 ?? null;
    const nativeOriginMatches = Array.isArray(native)
      ? native[0] === origin[0] && native[1] === origin[1]
      : null;
    return {
      ok: true,
      avatarId,
      equipmentId,
      slot,
      anchorName,
      anchor,
      pivot,
      fit,
      origin,
      nativeOrigin: native,
      nativeOriginMatches,
      rig: found.rig.rig ?? null,
      sources: {
        anchor: 'rig',
        pivot: 'equipment',
        fit: fitEntry ? 'rig.fit' : 'none',
        slotAnchor: 'slot-anchor-map',
      },
    };
  }

  return {
    resolve,
    integrity,
    layoutRect,
    placement,
    warnings,
    ids() {
      return [...byId.keys()];
    },
  };
}
