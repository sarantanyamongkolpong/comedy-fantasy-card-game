import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAssetLoader } from '../assets/loader.js';
import { FACTION_RECORDS } from '../schema/constants.js';
import { CHARACTER_LINE_SEPARATOR } from './constants.js';

const slotAnchorFile = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../assets/slot-anchor-map.json'), 'utf8'),
);

/**
 * Slot name → anchor name. The map stores names, not pixels.
 * @returns {Record<string, string>}
 */
export function slotAnchorMap() {
  return slotAnchorFile.map ?? slotAnchorFile;
}

/**
 * Rig layer `file` values are sprite-folder basenames.
 * `tools/build_manifest.py` on the art branch joins `assets/characters/<ID>/sprite/<file>`.
 * A value that already starts with `assets/` is kept.
 * @param {string} avatarId
 * @param {string} file
 */
export function resolveRigLayerPath(avatarId, file) {
  if (typeof file !== 'string' || file.length === 0) return null;
  if (file.startsWith('assets/')) return file;
  return `assets/characters/${avatarId}/sprite/${file}`;
}

/**
 * @param {object | undefined} body
 */
export function readSlots(body) {
  if (
    Array.isArray(body?.slots) &&
    body.slots.length > 0 &&
    body.slots.every((slot) => typeof slot === 'string' && slot.length > 0)
  ) {
    return { slots: body.slots.slice(), encoding: 'array', raw: body.slot ?? null };
  }
  if (typeof body?.slot === 'string' && body.slot.includes('|')) {
    const slots = body.slot
      .split('|')
      .map((slot) => slot.trim())
      .filter((slot) => slot.length > 0);
    return { slots, encoding: 'pipe', raw: body.slot };
  }
  if (typeof body?.slot === 'string' && body.slot.trim().length > 0) {
    return { slots: [body.slot.trim()], encoding: 'string', raw: body.slot };
  }
  return { slots: [], encoding: 'missing', raw: body?.slot ?? null };
}

/**
 * @param {string} avatarId
 * @param {string} line
 */
export function parseCharacterLine(avatarId, line) {
  if (typeof line !== 'string') {
    return { ok: false, avatarId, line, reason: 'CHARACTER_LINE_NOT_A_STRING' };
  }
  const parts = line.split(CHARACTER_LINE_SEPARATOR).map((part) => part.trim());
  if (parts.length !== 4) {
    return { ok: false, avatarId, line, reason: 'CHARACTER_LINE_UNPARSED' };
  }
  const [names, factionName, role, rigId] = parts;
  const nameParts = names.split(' / ');
  if (nameParts.length !== 2 || nameParts.some((part) => part.length === 0)) {
    return { ok: false, avatarId, line, reason: 'CHARACTER_NAMES_UNPARSED' };
  }
  const faction = FACTION_RECORDS.find((record) => record.name === factionName);
  return {
    ok: true,
    avatarId,
    line,
    nameEn: nameParts[0],
    nameTh: nameParts[1],
    factionName,
    factionId: faction?.factionId ?? null,
    role,
    rigId,
  };
}

/**
 * Suggest a base asset id already present in `knownIds`.
 * `_web` is stripped first so a web encode of a variant points at that variant.
 * A plain web encode of a base card is not treated as a variant by the caller.
 * @param {string} assetId
 * @param {Set<string>} knownIds
 */
export function suggestVariantBase(assetId, knownIds) {
  if (assetId.endsWith('_web')) {
    const parent = assetId.slice(0, -'_web'.length);
    if (knownIds.has(parent)) return parent;
  }
  const marker = '_variant_';
  const at = assetId.indexOf(marker);
  if (at > 0) {
    const parent = assetId.slice(0, at);
    if (knownIds.has(parent)) return parent;
  }
  if (assetId.endsWith('_GOLDPOT')) {
    const parent = assetId.slice(0, -'_GOLDPOT'.length);
    if (knownIds.has(parent)) return parent;
  }
  return null;
}

/**
 * @param {object[]} assets
 * @param {object} entry
 */
export function suggestLayerSibling(assets, entry) {
  if (typeof entry?.variant !== 'string' || entry.variant.length === 0) return null;
  const siblings = assets.filter(
    (asset) =>
      asset !== entry &&
      asset.owner === entry.owner &&
      asset.type === entry.type &&
      asset.layer === entry.layer &&
      asset.slot === entry.slot &&
      (asset.variant === null || asset.variant === undefined),
  );
  if (siblings.length === 1) return siblings[0].asset_id;
  return null;
}

function explicitAnchor(body) {
  return typeof body?.anchor === 'string' && body.anchor.length > 0 ? body.anchor : null;
}

/**
 * Copy item records into the object shape `createAssetLoader` already accepts.
 * Shared bodies gain `asset_id` from the object key when the body omits it.
 * Pipe slots stay pipe slots. The copy does not pick a hand.
 * @param {{ itemFiles: { path: string, data: object }[] }} bundle
 */
export function normalizeArtBundle(bundle) {
  const map = slotAnchorMap();
  const itemsById = {};
  const itemRecords = [];
  const seen = new Map();

  for (const file of bundle.itemFiles ?? []) {
    const data = file.data ?? {};
    const shared = file.path.endsWith('shared_items.json');
    for (const key of Object.keys(data)) {
      const body = data[key] ?? {};
      const slots = readSlots(body);
      const hasAssetId = typeof body.asset_id === 'string' && body.asset_id.length > 0;
      const assetId = hasAssetId ? body.asset_id : key;
      const duplicate = seen.has(key);
      if (!duplicate) {
        seen.set(key, file.path);
        itemsById[key] = { ...body, asset_id: assetId };
      }
      const mappedAnchors = slots.slots.map((slot) => ({
        slot,
        anchor: typeof map[slot] === 'string' && map[slot].length > 0 ? map[slot] : null,
      }));
      itemRecords.push({
        id: key,
        file: file.path,
        shared,
        duplicateOf: duplicate ? seen.get(key) : null,
        assetId,
        assetIdFromKey: !hasAssetId,
        assetIdMismatch: assetId !== key,
        slots: slots.slots,
        slotEncoding: slots.encoding,
        rawSlot: slots.raw,
        anchor: explicitAnchor(body),
        mappedAnchors,
        pivot: body.pivot ?? null,
        variantOf: typeof body.variant_of === 'string' && body.variant_of.length > 0 ? body.variant_of : null,
        variantOfPresent: Object.prototype.hasOwnProperty.call(body, 'variant_of'),
        nativeCharacter: body.native_character ?? null,
        nativeOrigin: body.native_origin ?? body.native_origin_on_128 ?? null,
        filePath: typeof body.file === 'string' ? body.file : null,
        compatibleRigs: body.compatible_rigs ?? null,
        testedOn: Array.isArray(body.tested_on) ? body.tested_on.slice() : [],
      });
    }
  }

  const rigs = [];
  const rigLayers = [];
  for (const file of bundle.rigFiles ?? []) {
    rigs.push(file.data);
    const characters = file.data?.characters ?? {};
    for (const [avatarId, character] of Object.entries(characters)) {
      for (const layer of character.layers ?? []) {
        rigLayers.push({
          rigPath: file.path,
          rigId: file.data?.rig ?? null,
          avatarId,
          file: layer.file ?? null,
          resolvedPath: resolveRigLayerPath(avatarId, layer.file),
          slot: layer.slot ?? null,
          variant: typeof layer.variant === 'string' && layer.variant.length > 0 ? layer.variant : null,
          variantOf:
            typeof layer.variant_of === 'string' && layer.variant_of.length > 0 ? layer.variant_of : null,
        });
      }
    }
  }

  const characters = [];
  const lines = bundle.manifest?.characters ?? {};
  for (const [avatarId, line] of Object.entries(lines)) {
    characters.push(parseCharacterLine(avatarId, line));
  }

  return {
    itemsById,
    itemRecords: itemRecords.filter((record) => record.duplicateOf === null).concat(
      itemRecords.filter((record) => record.duplicateOf !== null),
    ),
    rigs,
    rigLayers,
    characters,
    slotAnchorMap: map,
  };
}

/**
 * @param {object} bundle
 */
export function createIntegratedLoader(bundle) {
  const normalized = normalizeArtBundle(bundle);
  const loader = createAssetLoader({
    manifest: bundle.manifest,
    dataFiles: {
      rigs: normalized.rigs,
      items: normalized.itemsById,
      frameLayout: bundle.frameLayout,
    },
  });
  return { loader, normalized };
}
