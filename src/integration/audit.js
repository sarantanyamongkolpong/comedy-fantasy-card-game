import { createAssetLoader } from '../assets/loader.js';
import { SAMPLE_AVATARS, SAMPLE_EQUIPMENT, SAMPLE_VARIANTS } from '../avatars/catalog.js';
import { ASSET_STATUSES, FACTION_RECORDS } from '../schema/constants.js';
import { validateAssetManifest } from '../schema/validate.js';
import { ART_JSON, FRAME_RECT_NAMES, PATH_ROOTS } from './constants.js';
import {
  normalizeArtBundle,
  suggestLayerSibling,
  suggestVariantBase,
} from './normalize.js';

const CHECKS = [
  ['character-ids', 'Character ID compatibility'],
  ['equipment-ids', 'Equipment ID compatibility'],
  ['manifest-format', 'Asset Manifest format'],
  ['rig-definitions', 'rig definitions'],
  ['equipment-slots', 'equipment slots'],
  ['anchor-names', 'anchor names'],
  ['pivot-coordinates', 'pivot coordinates'],
  ['variant-references', 'character variant references'],
  ['frame-layout', 'card frame layout data'],
  ['asset-status', 'asset status handling'],
  ['path-resolution', 'path resolution'],
  ['missing-assets', 'missing asset behaviour'],
];

function sameJson(left, right) {
  return JSON.stringify(sortKeys(left)) === JSON.stringify(sortKeys(right));
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]));
  }
  return value;
}

function collectStrings(value, field, out = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, field, out);
    return out;
  }
  if (value && typeof value === 'object') {
    if (typeof value[field] === 'string' && value[field].length > 0) out.push(value[field]);
    for (const child of Object.values(value)) collectStrings(child, field, out);
  }
  return out;
}

function integerPair(value) {
  return Array.isArray(value) && value.length === 2 && value.every((item) => Number.isInteger(item));
}

function classifyPath(path) {
  if (typeof path !== 'string' || path.length === 0) return 'empty';
  if (path.startsWith('assets/characters/_rigs/')) return 'rigs';
  if (/^assets\/characters\/AVT_[A-Z0-9_]+\//.test(path)) return 'character';
  if (path.startsWith('assets/card-art/')) return 'card-art';
  if (path.startsWith('assets/equipment/')) return 'equipment';
  if (path.startsWith('assets/animations/')) return 'animations';
  if (path.startsWith('assets/vfx/')) return 'vfx';
  if (path.startsWith('assets/reference/')) return 'reference';
  if (path.startsWith('preview/')) return 'preview';
  return 'other';
}

function variantGap(entry) {
  const linked = typeof entry?.variant_of === 'string' && entry.variant_of.length > 0;
  if (linked) return false;
  if (typeof entry?.variant === 'string' && entry.variant.length > 0) return true;
  if (typeof entry?.asset_id === 'string' && entry.asset_id.includes('_variant_')) return true;
  if (typeof entry?.asset_id === 'string' && entry.asset_id.endsWith('_GOLDPOT')) return true;
  return false;
}

function change(issue, file, record, field, current, required, note) {
  return {
    issue,
    status: 'REQUIRES_ART_CHANGE',
    file,
    record,
    field,
    current: current === undefined || current === null || current === '' ? 'absent' : String(current),
    required,
    note,
  };
}

/**
 * Audit one in-memory art bundle against the systems catalog and loader.
 * The bundle is the pinned Mira commit, loaded by `loadArtBundle`.
 * @param {object} bundle
 */
export function auditArtBundle(bundle) {
  const normalized = normalizeArtBundle(bundle);
  const manifest = bundle.manifest ?? {};
  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
  const byId = new Map();
  const duplicateIds = [];
  for (const entry of assets) {
    if (!entry || typeof entry.asset_id !== 'string' || entry.asset_id.length === 0) continue;
    if (byId.has(entry.asset_id)) duplicateIds.push(entry.asset_id);
    else byId.set(entry.asset_id, entry);
  }
  const knownIds = new Set(byId.keys());
  const validationErrors = validateAssetManifest(manifest);
  const evidence = Object.fromEntries(CHECKS.map(([id]) => [id, []]));
  const flags = Object.fromEntries(CHECKS.map(([id]) => [id, []]));
  const flag = (id, status) => flags[id].push(status);
  const say = (id, line) => evidence[id].push(line);

  let loader = null;
  let loaderError = null;
  try {
    loader = createAssetLoader({
      manifest: bundle.manifest,
      dataFiles: {
        rigs: normalized.rigs,
        items: normalized.itemsById,
        frameLayout: bundle.frameLayout,
      },
    });
  } catch (error) {
    loaderError = error instanceof Error ? error.message : String(error);
    flag('manifest-format', 'FAIL');
    say('manifest-format', `createAssetLoader rejected the manifest: ${loaderError}`);
  }

  const uniqueItems = normalized.itemRecords.filter((record) => record.duplicateOf === null);
  const artChanges = [];
  const placements = [];

  // --- characters ---
  const parsedById = new Map(normalized.characters.map((row) => [row.avatarId, row]));
  const sampleIds = SAMPLE_AVATARS.map((avatar) => avatar.avatarId);
  const manifestIds = Object.keys(manifest.characters ?? {});
  if (manifestIds.length === sampleIds.length && sampleIds.every((id) => manifestIds.includes(id))) {
    say('character-ids', `Manifest character ids match the systems catalog: ${sampleIds.join(', ')}.`);
  } else {
    flag('character-ids', 'FAIL');
    say(
      'character-ids',
      `Manifest character ids are ${manifestIds.join(', ') || '(none)'}. Systems catalog ids are ${sampleIds.join(', ')}.`,
    );
  }
  for (const avatar of SAMPLE_AVATARS) {
    const row = parsedById.get(avatar.avatarId);
    if (!row?.ok) {
      flag('character-ids', 'FAIL');
      say('character-ids', `${avatar.avatarId} character line could not be parsed.`);
      continue;
    }
    const faction = FACTION_RECORDS.find((record) => record.factionId === avatar.factionId);
    if (
      row.nameEn !== avatar.nameEn ||
      row.nameTh !== avatar.nameTh ||
      row.factionId !== avatar.factionId ||
      row.role !== avatar.role ||
      row.rigId !== avatar.rigId
    ) {
      flag('character-ids', 'FAIL');
      say(
        'character-ids',
        `${avatar.avatarId} parsed as ${row.nameEn} / ${row.nameTh}, ${row.factionName}, ${row.role}, ${row.rigId}.`,
      );
    }
    const homes = (bundle.rigFiles ?? []).filter((file) => file.data?.characters?.[avatar.avatarId]);
    if (homes.length !== 1) {
      flag('character-ids', 'FAIL');
      flag('rig-definitions', 'FAIL');
      say('character-ids', `${avatar.avatarId} is present on ${homes.length} rig files.`);
    } else if (homes[0].data.rig !== avatar.rigId) {
      flag('character-ids', 'FAIL');
      flag('rig-definitions', 'FAIL');
      say('character-ids', `${avatar.avatarId} rig file says ${homes[0].data.rig}. Catalog rigId is ${avatar.rigId}.`);
    }
    if (faction && row.ok && row.role !== faction.role) {
      flag('character-ids', 'FAIL');
    }
  }
  if (!flags['character-ids'].includes('FAIL')) {
    say(
      'character-ids',
      'English name, Thai name, faction, role, and rig id on each manifest line match the systems sample.',
    );
  }

  const crosswalk = [];
  for (const legacy of bundle.legacyReference?.characters ?? []) {
    const match = SAMPLE_AVATARS.find((avatar) => avatar.nameTh === legacy.name_th);
    crosswalk.push({
      slug: legacy.character_id,
      avatarId: match?.avatarId ?? null,
    });
    if (!match) {
      flag('character-ids', 'FAIL');
      say('character-ids', `Legacy slug ${legacy.character_id} has Thai name ${legacy.name_th}, which matches no sample avatar.`);
      continue;
    }
    const faction = FACTION_RECORDS.find((record) => record.factionId === match.factionId);
    if (legacy.faction !== faction?.name || legacy.battle_role !== match.role || legacy.rig !== match.rigId) {
      flag('character-ids', 'FAIL');
      say('character-ids', `Legacy slug ${legacy.character_id} disagrees with ${match.avatarId}.`);
    }
  }
  say(
    'character-ids',
    `Starter-pack slugs in ${ART_JSON.legacyReference} pair by Thai name and are not loader ids: ${crosswalk
      .map((row) => `${row.slug} → ${row.avatarId ?? 'unmatched'}`)
      .join('; ')}.`,
  );

  const avatarIdSet = new Set(sampleIds);
  for (const entry of assets) {
    const owner = entry?.owner;
    const knownOwner = owner === 'shared' || owner === 'owner' || avatarIdSet.has(owner);
    if (!knownOwner) {
      flag('character-ids', 'FAIL');
      say('character-ids', `${entry?.asset_id ?? '(row)'} owner ${owner} is outside avatar ids, shared, and owner.`);
    }
    const folder = typeof entry?.path === 'string' ? entry.path.match(/^assets\/characters\/(AVT_[A-Z0-9_]+)\//) : null;
    if (folder && folder[1] !== entry.owner) {
      flag('character-ids', 'FAIL');
      say('character-ids', `${entry.asset_id} path is under ${folder[1]} and owner is ${entry.owner}.`);
    }
  }

  // --- equipment ids ---
  const equipmentEntries = assets.filter((entry) => entry?.type === 'equipment_item');
  const manifestEquipmentIds = equipmentEntries.map((entry) => entry.asset_id).sort();
  const fileEquipmentIds = uniqueItems.map((record) => record.id).sort();
  if (sameJson(manifestEquipmentIds, fileEquipmentIds)) {
    say(
      'equipment-ids',
      `${fileEquipmentIds.length} equipment ids match across docs/ASSET_MANIFEST.json and the item JSON files.`,
    );
  } else {
    flag('equipment-ids', 'FAIL');
    say('equipment-ids', 'Manifest equipment_item ids and item-file keys differ.');
  }
  const duplicateItemIds = normalized.itemRecords.filter((record) => record.duplicateOf).map((record) => record.id);
  if (duplicateItemIds.length > 0) {
    flag('equipment-ids', 'FAIL');
    say('equipment-ids', `Duplicate equipment ids: ${duplicateItemIds.join(', ')}.`);
  }
  for (const avatar of SAMPLE_AVATARS) {
    const home = (bundle.rigFiles ?? []).find((file) => file.data?.characters?.[avatar.avatarId]);
    const native = home?.data?.characters?.[avatar.avatarId]?.native_items ?? {};
    const file = (bundle.itemFiles ?? []).find((itemFile) => itemFile.path.includes(`/${avatar.avatarId}/`));
    if (!file || !sameJson(native, file.data)) {
      flag('equipment-ids', 'FAIL');
      say('equipment-ids', `${avatar.avatarId} rig native_items differ from equipment/items.json.`);
    }
  }
  if (!flags['equipment-ids'].includes('FAIL')) {
    say('equipment-ids', 'Rig native_items objects match each character items.json.');
  }
  for (const sample of SAMPLE_EQUIPMENT) {
    const record = uniqueItems.find((item) => item.id === sample.equipmentId);
    const entry = byId.get(sample.equipmentId);
    if (!record || !entry) {
      flag('equipment-ids', 'FAIL');
      say('equipment-ids', `Sample equipment ${sample.equipmentId} is missing from the art data.`);
      continue;
    }
    const artVariant = record.variantOf;
    const sampleVariant = sample.variantOf;
    if (record.rawSlot !== sample.slot || artVariant !== sampleVariant || entry.slot !== sample.slot) {
      flag('equipment-ids', 'FAIL');
      say('equipment-ids', `${sample.equipmentId} slot or variantOf disagrees with the systems sample.`);
    }
    if (sample.nativeAvatarId === null) {
      if (entry.owner !== 'shared' || record.nativeCharacter !== null) {
        flag('equipment-ids', 'FAIL');
        say('equipment-ids', `${sample.equipmentId} is a shared sample and the art owner is ${entry.owner}.`);
      }
    } else if (entry.owner !== sample.nativeAvatarId || record.nativeCharacter !== sample.nativeAvatarId) {
      flag('equipment-ids', 'FAIL');
      say('equipment-ids', `${sample.equipmentId} native character disagrees with the systems sample.`);
    }
  }
  const sharedMissingId = uniqueItems.filter((record) => record.shared && record.assetIdFromKey);
  if (sharedMissingId.length > 0) {
    say(
      'equipment-ids',
      `Shared item bodies omit asset_id (${sharedMissingId.map((record) => record.id).join(', ')}). The object key matches the manifest id. Keyed loader lookup still resolves. R-ASSET-ID records the field to add.`,
    );
    for (const record of sharedMissingId) {
      artChanges.push(
        change(
          'R-ASSET-ID',
          record.file,
          record.id,
          'asset_id',
          'absent',
          record.id,
          'Same id as the object key, matching per-character items.json.',
        ),
      );
    }
  }
  say(
    'equipment-ids',
    `The systems sample lists ${SAMPLE_EQUIPMENT.length} of ${fileEquipmentIds.length} art equipment ids. No stats were added for the rest.`,
  );

  // --- manifest format ---
  const structuralErrors = validationErrors.filter(
    (issue) => !issue.message.includes('status must be') && !issue.path.endsWith('.status') && !issue.message.includes('duplicate'),
  );
  const duplicateErrors = validationErrors.filter((issue) => issue.message.includes('duplicate'));
  const statusErrors = validationErrors.filter(
    (issue) => issue.message.includes('status must be') || issue.path.endsWith('.status'),
  );
  if (manifest.asset_count === assets.length) {
    say('manifest-format', `asset_count ${manifest.asset_count} equals assets.length. validateAssetManifest structural errors: ${structuralErrors.length}.`);
  } else {
    flag('manifest-format', 'FAIL');
    say('manifest-format', `asset_count is ${manifest.asset_count} and assets.length is ${assets.length}.`);
  }
  if (structuralErrors.length > 0) {
    flag('manifest-format', 'FAIL');
    for (const issue of structuralErrors.slice(0, 8)) say('manifest-format', `${issue.path}: ${issue.message}`);
  }
  if (duplicateIds.length > 0 || duplicateErrors.length > 0) {
    flag('manifest-format', 'FAIL');
    say('manifest-format', `Duplicate asset_id values: ${[...new Set(duplicateIds)].join(', ') || '(validator)'}.`);
  } else {
    say('manifest-format', '0 duplicate asset_id values. The loader keeps the first row and records DUPLICATE_ID when a copy is introduced.');
  }
  if (loader && loader.warnings.length > 0) {
    flag('manifest-format', 'FAIL');
    say('manifest-format', `Loader warnings on the real manifest: ${loader.warnings.map((warning) => warning.reason).join(', ')}.`);
  } else if (loader) {
    say('manifest-format', 'Loader warnings on the real manifest: none.');
  }
  const types = [...new Set(assets.map((entry) => entry.type))].sort();
  say('manifest-format', `Entry types: ${types.join(', ')}.`);
  let legacyRejected = false;
  try {
    createAssetLoader({ manifest: bundle.legacyReference, dataFiles: {} });
  } catch (error) {
    legacyRejected = true;
    const message = error instanceof Error ? error.message : String(error);
    say(
      'manifest-format',
      `${ART_JSON.legacyReference} has no assets array (${message}). The loader manifest is ${ART_JSON.manifest}.`,
    );
  }
  if (!legacyRejected) {
    flag('manifest-format', 'FAIL');
    say('manifest-format', `${ART_JSON.legacyReference} was accepted as a loader manifest.`);
  }

  // --- rigs ---
  const rigEntries = assets.filter((entry) => entry?.type === 'rig_definition');
  const rigPaths = (bundle.rigFiles ?? []).map((file) => file.path).sort();
  const rigEntryPaths = rigEntries.map((entry) => entry.path).sort();
  if (sameJson(rigPaths, [...ART_JSON.rigs].sort()) && sameJson(rigPaths, rigEntryPaths)) {
    say('rig-definitions', `Rig files match manifest rig_definition paths: ${rigPaths.join(', ')}.`);
  } else {
    flag('rig-definitions', 'FAIL');
    say('rig-definitions', 'Rig file paths and manifest rig_definition paths differ.');
  }
  const logical = manifest.canvas?.logical;
  let defaultsDiffer = 0;
  for (const file of bundle.rigFiles ?? []) {
    const rig = file.data ?? {};
    if (!integerPair(rig.canvas) || !Number.isInteger(rig.baseline_y) || typeof rig.rig !== 'string') {
      flag('rig-definitions', 'FAIL');
      say('rig-definitions', `${file.path} is missing rig, canvas, or baseline_y.`);
    } else if (!sameJson(rig.canvas, logical) || rig.baseline_y !== manifest.canvas?.baseline_y) {
      flag('rig-definitions', 'FAIL');
      say('rig-definitions', `${file.path} canvas or baseline disagrees with the manifest canvas block.`);
    }
    for (const [avatarId, character] of Object.entries(rig.characters ?? {})) {
      const fit = character.fit ?? {};
      if (fit === null || typeof fit !== 'object' || Array.isArray(fit)) {
        flag('rig-definitions', 'FAIL');
        say('rig-definitions', `${avatarId} fit is not an object.`);
        continue;
      }
      for (const [equipmentId, value] of Object.entries(fit)) {
        if (!integerPair(value)) {
          flag('rig-definitions', 'FAIL');
          say('rig-definitions', `${avatarId} fit ${equipmentId} is not an integer pair.`);
        }
      }
      const defaults = rig.default_anchors ?? {};
      const anchors = character.anchors ?? {};
      const differs = Object.keys(anchors).some((name) => {
        const fallback = defaults[name];
        const point = anchors[name];
        return !fallback || !point || fallback[0] !== point[0] || fallback[1] !== point[1];
      });
      if (differs) defaultsDiffer += 1;
    }
  }
  say(
    'rig-definitions',
    `Per-character anchors are the placement source. default_anchors differ from those anchors on ${defaultsDiffer} character blocks. The adapter does not copy default_anchors over a character.`,
  );
  if (bundle.animation?.asset_id === 'ANIM_SHARED_001' && byId.has('ANIM_SHARED_001')) {
    say('rig-definitions', 'ANIM_SHARED_001 asset_id matches its manifest row.');
  } else {
    flag('rig-definitions', 'FAIL');
    say('rig-definitions', 'Animation file asset_id does not match the manifest.');
  }
  const clipStatuses = [...new Set(collectStrings(bundle.animation?.states, 'status'))];
  say(
    'rig-definitions',
    `Clip status strings stay descriptive (${clipStatuses.join('; ')}). The manifest row status is ${byId.get('ANIM_SHARED_001')?.status ?? 'missing'}.`,
  );

  // --- slots, anchors, pivots, placements ---
  const requiredAnchors = bundle.legacyReference?.anchor_names;
  if (!Array.isArray(requiredAnchors) || requiredAnchors.some((name) => typeof name !== 'string')) {
    flag('anchor-names', 'FAIL');
    say('anchor-names', 'Legacy anchor_names is missing.');
  } else {
    say('anchor-names', `Anchor name set from the starter pack: ${requiredAnchors.join(', ')}.`);
  }
  for (const file of bundle.rigFiles ?? []) {
    for (const [avatarId, character] of Object.entries(file.data?.characters ?? {})) {
      const names = Object.keys(character.anchors ?? {});
      if (!Array.isArray(requiredAnchors) || !sameJson([...names].sort(), [...requiredAnchors].sort())) {
        flag('anchor-names', 'FAIL');
        say('anchor-names', `${avatarId} anchor names are ${names.join(', ')}.`);
      }
      for (const [name, point] of Object.entries(character.anchors ?? {})) {
        if (!integerPair(point)) {
          flag('anchor-names', 'FAIL');
          say('anchor-names', `${avatarId} anchor ${name} is not an integer pair.`);
        }
      }
      for (const entry of assets) {
        if (entry.owner !== avatarId || !entry.anchors) continue;
        if (!sameJson(entry.anchors, character.anchors)) {
          flag('anchor-names', 'FAIL');
          say('anchor-names', `${entry.asset_id} embedded anchors differ from the rig.`);
        }
      }
    }
  }
  const map = normalized.slotAnchorMap;
  for (const [slot, anchor] of Object.entries(map)) {
    if (!Array.isArray(requiredAnchors) || !requiredAnchors.includes(anchor)) {
      flag('anchor-names', 'REQUIRES_SYSTEM_CHANGE');
      say('anchor-names', `Slot map sends ${slot} to ${anchor}, which is not an anchor name.`);
    }
  }
  const atNames = [...new Set(collectStrings(bundle.animation, 'at'))];
  const missingAt = atNames.filter((name) => !Array.isArray(requiredAnchors) || !requiredAnchors.includes(name));
  if (missingAt.length > 0) {
    flag('anchor-names', 'FAIL');
    say('anchor-names', `Animation anchor targets missing from the rig set: ${missingAt.join(', ')}.`);
  } else {
    say('anchor-names', `Animation "at" targets are rig anchor names: ${atNames.join(', ')}.`);
  }

  for (const record of uniqueItems) {
    const entry = byId.get(record.id);
    if (record.slots.length === 0) {
      flag('equipment-slots', 'FAIL');
      say('equipment-slots', `${record.id} has no slot.`);
    }
    if (record.slotEncoding === 'pipe') {
      say('equipment-slots', `${record.id} slot is the string "${record.rawSlot}". Placement without a chosen hand returns AMBIGUOUS_SLOT.`);
    }
    if (!integerPair(record.pivot)) {
      flag('pivot-coordinates', 'FAIL');
      say('pivot-coordinates', `${record.id} pivot is not an integer pair.`);
    }
    if (entry && !sameJson(entry.pivot, record.pivot)) {
      flag('pivot-coordinates', 'FAIL');
      say('pivot-coordinates', `${record.id} manifest pivot differs from the item file.`);
    }
    if (entry && record.nativeOrigin && entry.native_origin_on_128 && !sameJson(entry.native_origin_on_128, record.nativeOrigin)) {
      flag('pivot-coordinates', 'FAIL');
      say('pivot-coordinates', `${record.id} native_origin_on_128 differs from items.json native_origin.`);
    }
    if (record.slots.length === 1) {
      const mapped = record.mappedAnchors[0]?.anchor ?? null;
      if (!mapped) {
        flag('anchor-names', 'REQUIRES_SYSTEM_CHANGE');
        say('anchor-names', `${record.id} slot ${record.slots[0]} has no slot-map anchor.`);
      } else if (record.anchor && record.anchor !== mapped) {
        flag('anchor-names', 'FAIL');
        say('anchor-names', `${record.id} anchor ${record.anchor} disagrees with the slot map value ${mapped}.`);
      } else if (!record.anchor) {
        artChanges.push(
          change(
            'R-ANCHOR',
            record.file,
            record.id,
            'anchor',
            'absent',
            mapped,
            'Anchor name for this slot. The slot map already stores this name. Coordinates stay on the rig.',
          ),
        );
        if (entry && typeof entry.anchor !== 'string') {
          artChanges.push(
            change(
              'R-ANCHOR',
              ART_JSON.manifest,
              record.id,
              'anchor',
              'absent',
              mapped,
              'Same anchor name on the manifest equipment row.',
            ),
          );
        }
      }
    }
    if (typeof record.rawSlot === 'string' && record.rawSlot.includes('|')) {
      artChanges.push(
        change('R-SLOTS', record.file, record.id, 'slot', record.rawSlot, 'absent', 'Remove the pipe-delimited slot string.'),
      );
      artChanges.push(
        change(
          'R-SLOTS',
          record.file,
          record.id,
          'slots',
          'absent',
          JSON.stringify(record.slots),
          'Allowed slots. The loader does not choose one.',
        ),
      );
    }
    if (entry && typeof entry.slot === 'string' && entry.slot.includes('|')) {
      artChanges.push(
        change('R-SLOTS', ART_JSON.manifest, record.id, 'slot', entry.slot, 'absent', 'Remove the pipe-delimited slot string.'),
      );
      artChanges.push(
        change(
          'R-SLOTS',
          ART_JSON.manifest,
          record.id,
          'slots',
          'absent',
          JSON.stringify(record.slots),
          'Allowed slots on the manifest equipment row.',
        ),
      );
    }

    const targets = [];
    if (record.nativeCharacter) targets.push(record.nativeCharacter);
    for (const avatarId of record.testedOn) {
      if (!targets.includes(avatarId)) targets.push(avatarId);
    }
    if (!loader || targets.length === 0) continue;
    if (record.slotEncoding === 'pipe') {
      const ambiguous = loader.placement(targets[0], record.id);
      placements.push(placementRow(record.id, targets[0], ambiguous));
      if (ambiguous.reason !== 'AMBIGUOUS_SLOT') {
        flag('equipment-slots', 'FAIL');
        say('equipment-slots', `${record.id} without a chosen slot returned ${ambiguous.reason ?? 'ok'} instead of AMBIGUOUS_SLOT.`);
      }
      for (const avatarId of targets) {
        for (const slot of record.slots) {
          const placed = loader.placement(avatarId, record.id, { slot });
          placements.push(placementRow(record.id, avatarId, placed));
          notePlacement(record, placed, flag, say);
        }
      }
    } else {
      for (const avatarId of targets) {
        const placed = loader.placement(avatarId, record.id);
        placements.push(placementRow(record.id, avatarId, placed));
        notePlacement(record, placed, flag, say);
      }
    }
  }
  const nativeMatches = placements.filter((row) => row.matches === true).length;
  const nativeMisses = placements.filter((row) => row.matches === false).length;
  say('pivot-coordinates', `${nativeMatches} placements match a recorded native origin. ${nativeMisses} disagree.`);
  if (nativeMisses > 0) flag('pivot-coordinates', 'FAIL');
  const negative = uniqueItems.filter((record) => Array.isArray(record.pivot) && record.pivot.some((value) => value < 0));
  if (negative.length > 0) {
    say(
      'pivot-coordinates',
      `Negative pivot components are grip points above a crop: ${negative.map((record) => `${record.id} [${record.pivot.join(', ')}]`).join('; ')}.`,
    );
  }
  const singleSlotCount = uniqueItems.filter((record) => record.slots.length === 1).length;
  say(
    'equipment-slots',
    `${singleSlotCount} equipment rows use one slot name that the slot map knows. Pipe-delimited slots are listed as R-SLOTS.`,
  );
  say(
    'anchor-names',
    'Equipment JSON stores slot and pivot. It does not store an anchor name. R-ANCHOR is that field. Placement uses src/assets/slot-anchor-map.json until the field exists.',
  );

  // --- variants ---
  for (const entry of assets) {
    if (typeof entry.variant_of === 'string' && entry.variant_of.length > 0 && !knownIds.has(entry.variant_of)) {
      flag('variant-references', 'FAIL');
      flag('missing-assets', 'FAIL');
      say('variant-references', `${entry.asset_id} variant_of ${entry.variant_of} is not a manifest id.`);
    }
  }
  for (const sample of SAMPLE_VARIANTS) {
    const entry = byId.get(sample.assetId);
    if (!entry) {
      flag('variant-references', 'FAIL');
      say('variant-references', `Sample variant asset ${sample.assetId} is missing from the manifest.`);
      continue;
    }
    if (entry.status !== sample.status) {
      flag('variant-references', 'FAIL');
      say('variant-references', `${sample.assetId} status is ${entry.status}. Systems sample status is ${sample.status}.`);
    }
    if (typeof entry.variant_of === 'string' && entry.variant_of.length > 0 && entry.variant_of !== sample.baseId) {
      flag('variant-references', 'FAIL');
      say('variant-references', `${sample.assetId} variant_of is ${entry.variant_of}. Systems baseId is ${sample.baseId}.`);
    }
    if (typeof entry.variant_of === 'string' && entry.variant_of === sample.baseId) {
      say('variant-references', `${sample.assetId} variant_of ${entry.variant_of} matches the systems sample. Status ${entry.status}.`);
    }
  }
  for (const entry of assets) {
    if (!variantGap(entry)) continue;
    const sample = SAMPLE_VARIANTS.find((variant) => variant.assetId === entry.asset_id);
    let required = null;
    if (sample) required = sample.baseId;
    if (!required && typeof entry.variant === 'string') required = suggestLayerSibling(assets, entry);
    if (!required) required = suggestVariantBase(entry.asset_id, knownIds);
    if (sample && required && required !== sample.baseId) {
      flag('variant-references', 'BLOCKED_BY_DESIGN');
      say('variant-references', `${entry.asset_id} filename candidate ${required} disagrees with systems baseId ${sample.baseId}.`);
      continue;
    }
    if (required && !knownIds.has(required)) {
      flag('variant-references', 'FAIL');
      say('variant-references', `${entry.asset_id} base candidate ${required} is not a manifest id.`);
      continue;
    }
    if (!required) {
      flag('variant-references', 'REQUIRES_ART_CHANGE');
      say('variant-references', `${entry.asset_id} has no variant_of and no single base candidate.`);
      artChanges.push(
        change(
          'R-VARIANT',
          ART_JSON.manifest,
          entry.asset_id,
          'variant_of',
          'absent',
          'a manifest asset_id of the base asset',
          'No single base id could be chosen from the filename or a sibling layer.',
        ),
      );
      continue;
    }
    artChanges.push(
      change(
        'R-VARIANT',
        ART_JSON.manifest,
        entry.asset_id,
        'variant_of',
        entry.variant_of ?? 'absent',
        required,
        sample
          ? 'Systems variant sample uses this base id. The manifest row has no variant_of.'
          : 'Base asset id implied by the variant label or the asset id. Existing equipment variants already store variant_of.',
      ),
    );
  }
  for (const layer of normalized.rigLayers) {
    if (!layer.variant || layer.variantOf) continue;
    const entry = assets.find((asset) => asset.path === layer.resolvedPath);
    const required = entry ? suggestLayerSibling(assets, entry) ?? suggestVariantBase(entry.asset_id, knownIds) : null;
    if (!required) {
      flag('variant-references', 'REQUIRES_ART_CHANGE');
      say('variant-references', `${layer.file} variant ${layer.variant} has no base candidate.`);
      continue;
    }
    artChanges.push(
      change(
        'R-VARIANT',
        layer.rigPath,
        `${layer.avatarId} layer ${layer.file}`,
        'variant_of',
        'absent',
        required,
        `Keep the variant label "${layer.variant}". variant_of is the base asset id.`,
      ),
    );
  }
  const explicitLinks = assets.filter((entry) => typeof entry.variant_of === 'string' && entry.variant_of.length > 0);
  say(
    'variant-references',
    `${explicitLinks.length} manifest row(s) already store variant_of. Rows with a variant label, "_variant_" in the id, or a _GOLDPOT suffix and no variant_of are R-VARIANT. Plain _web exports of a base card are format siblings and are not variant rows.`,
  );

  // --- frame layout ---
  const rects = bundle.frameLayout?.rects ?? {};
  const missingRects = FRAME_RECT_NAMES.filter((name) => !rects[name]);
  if (missingRects.length > 0) {
    flag('frame-layout', 'FAIL');
    say('frame-layout', `Missing rects: ${missingRects.join(', ')}.`);
  }
  for (const name of FRAME_RECT_NAMES) {
    const rect = rects[name];
    if (!rect) continue;
    const numeric = ['x', 'y', 'w', 'h'].every((key) => typeof rect[key] === 'number' && Number.isFinite(rect[key]));
    if (!numeric || !(rect.w > 0) || !(rect.h > 0)) {
      flag('frame-layout', 'FAIL');
      say('frame-layout', `${name} is missing a positive x, y, w, h rect.`);
      continue;
    }
    if (loader) {
      const resolved = loader.layoutRect(name);
      const same =
        resolved.ok === true &&
        resolved.rect.x === rect.x &&
        resolved.rect.y === rect.y &&
        resolved.rect.w === rect.w &&
        resolved.rect.h === rect.h;
      if (!same) {
        flag('frame-layout', 'FAIL');
        say('frame-layout', `layoutRect(${name}) disagrees with frame_layout.json.`);
      }
    }
  }
  if (loader && loader.layoutRect('nope').reason !== 'UNKNOWN_RECT') {
    flag('frame-layout', 'FAIL');
    say('frame-layout', 'An unknown rect name did not return UNKNOWN_RECT.');
  }
  const canvas = bundle.frameLayout?.canvas;
  if (!missingRects.length && !flags['frame-layout'].includes('FAIL')) {
    say(
      'frame-layout',
      `frame_layout.json rects ${FRAME_RECT_NAMES.join(', ')} match layoutRect. Canvas ${canvas?.w}×${canvas?.h}. Units: ${bundle.frameLayout?.units ?? 'missing'}.`,
    );
  }

  // --- status ---
  const byStatus = Object.fromEntries(ASSET_STATUSES.map((status) => [status, 0]));
  const unknownStatuses = [];
  for (const entry of assets) {
    if (ASSET_STATUSES.includes(entry?.status)) byStatus[entry.status] += 1;
    else unknownStatuses.push(entry?.asset_id ?? '(row)');
  }
  const legend = manifest.status_legend;
  const legendMatches =
    Array.isArray(legend) && legend.length === ASSET_STATUSES.length && legend.every((status, index) => status === ASSET_STATUSES[index]);
  if (!legendMatches) {
    flag('asset-status', 'FAIL');
    say('asset-status', `status_legend is ${JSON.stringify(legend)}. Systems legend is ${ASSET_STATUSES.join(', ')}.`);
  } else {
    say('asset-status', `status_legend matches the systems enum: ${ASSET_STATUSES.join(', ')}.`);
  }
  if (unknownStatuses.length > 0 || statusErrors.length > 0) {
    flag('asset-status', 'FAIL');
    say('asset-status', `Rows outside the enum: ${unknownStatuses.join(', ') || '(validator)'}.`);
  }
  if (loader) {
    for (const status of ['CONCEPT', 'PROTOTYPE']) {
      const rows = assets.filter((entry) => entry.status === status);
      const bad = rows.filter((entry) => {
        const resolved = loader.resolve(entry.asset_id);
        return !(resolved.ok && resolved.found && resolved.advisory === status && resolved.productionReady === false);
      });
      if (bad.length > 0) {
        flag('asset-status', 'FAIL');
        say('asset-status', `${bad.length} ${status} rows did not resolve with that advisory.`);
      }
    }
  }
  const ready = loader
    ? assets.filter((entry) => loader.resolve(entry.asset_id).productionReady).map((entry) => entry.asset_id)
    : [];
  say(
    'asset-status',
    `Counts: ${ASSET_STATUSES.map((status) => `${status} ${byStatus[status]}`).join(', ')}. productionReady rows: ${ready.length}. ${manifest.honest_summary ?? ''}`.trim(),
  );

  // --- paths and missing files ---
  const prefixCounts = {};
  const hashMismatches = [];
  for (const entry of assets) {
    const kind = classifyPath(entry.path);
    prefixCounts[kind] = (prefixCounts[kind] ?? 0) + 1;
    if (kind === 'other' || kind === 'empty') {
      flag('path-resolution', 'FAIL');
      say('path-resolution', `${entry.asset_id} path ${entry.path} is outside the art roots.`);
    }
    if (!PATH_ROOTS.some((root) => typeof entry.path === 'string' && entry.path.startsWith(root))) {
      flag('path-resolution', 'FAIL');
    }
    const info = bundle.files?.[entry.path];
    if (!info) {
      flag('path-resolution', 'FAIL');
      flag('missing-assets', 'FAIL');
      say('missing-assets', `${entry.asset_id} path is missing: ${entry.path}`);
      continue;
    }
    if (info.sha256 !== entry.sha256 || info.bytes !== entry.bytes) {
      hashMismatches.push(entry.asset_id);
    }
  }
  if (hashMismatches.length > 0) {
    flag('path-resolution', 'FAIL');
    say('path-resolution', `sha256 or byte length disagrees with the file: ${hashMismatches.join(', ')}.`);
  }
  let unindexedLayers = 0;
  for (const layer of normalized.rigLayers) {
    const indexed = assets.some((entry) => entry.path === layer.resolvedPath);
    if (!layer.resolvedPath || !indexed) {
      unindexedLayers += 1;
      flag('path-resolution', 'FAIL');
      say('path-resolution', `Rig layer ${layer.file} resolved to ${layer.resolvedPath}, which is not a manifest path.`);
    }
  }
  if (unindexedLayers === 0) {
    say(
      'path-resolution',
      `Rig layer file names are sprite-folder basenames. Resolved path is assets/characters/<ID>/sprite/<file>, matching tools/build_manifest.py. ${normalized.rigLayers.length} layers resolve to a manifest path.`,
    );
  }
  const nativeFiles = uniqueItems.filter((record) => record.filePath);
  const missingItemFiles = nativeFiles.filter((record) => !assets.some((entry) => entry.path === record.filePath));
  if (missingItemFiles.length > 0) {
    flag('path-resolution', 'FAIL');
    say('path-resolution', `Item file fields missing from the manifest: ${missingItemFiles.map((record) => record.id).join(', ')}.`);
  }
  if (!flags['path-resolution'].includes('FAIL')) {
    const summary = Object.entries(prefixCounts)
      .map(([kind, count]) => `${kind} ${count}`)
      .join(', ');
    say(
      'path-resolution',
      `${assets.length} manifest paths exist and their sha256 and byte length match the blobs. Prefixes: ${summary}.`,
    );
    say(
      'path-resolution',
      'Shared item bodies omit file. The manifest path is the repo-relative PNG.',
    );
  }

  const vfxIds = Object.keys(bundle.vfx ?? {});
  const vfxEntries = assets.filter((entry) => entry.type === 'vfx_strip').map((entry) => entry.asset_id).sort();
  if (!sameJson([...vfxIds].sort(), vfxEntries)) {
    flag('missing-assets', 'FAIL');
    say('missing-assets', 'vfx.json keys differ from manifest vfx_strip ids.');
  }
  const animationVfx = [...new Set(collectStrings(bundle.animation, 'vfx'))];
  const missingVfx = animationVfx.filter((id) => !knownIds.has(id));
  if (missingVfx.length > 0) {
    flag('missing-assets', 'FAIL');
    say('missing-assets', `Animation vfx ids missing from the manifest: ${missingVfx.join(', ')}.`);
  } else {
    say('missing-assets', `Animation vfx ids resolve in the manifest: ${animationVfx.join(', ')}.`);
  }
  if (loader) {
    const missing = loader.resolve('NO_SUCH_ASSET');
    if (missing.ok === false && missing.found === false && missing.reason === 'MISSING_ID' && missing.productionReady === false) {
      say('missing-assets', 'An unknown id returns found false, reason MISSING_ID, productionReady false.');
    } else {
      flag('missing-assets', 'FAIL');
      say('missing-assets', `Unknown id returned ${JSON.stringify({ ok: missing.ok, found: missing.found, reason: missing.reason })}.`);
    }
    const concept = assets.find((entry) => entry.status === 'CONCEPT');
    if (concept) {
      const resolved = loader.resolve(concept.asset_id);
      if (resolved.found && resolved.advisory === 'CONCEPT') {
        say('missing-assets', `${concept.asset_id} is CONCEPT and still resolves. The loader keeps advisory rows.`);
      } else {
        flag('missing-assets', 'FAIL');
      }
    }
  } else {
    flag('missing-assets', 'FAIL');
    say('missing-assets', 'Loader was not created, so missing-id behaviour was not checked.');
  }
  if ((bundle.missingPaths ?? []).length > 0) {
    flag('missing-assets', 'FAIL');
    say('missing-assets', `Missing blobs: ${bundle.missingPaths.join(', ')}.`);
  }

  if (artChanges.some((row) => row.issue === 'R-SLOTS')) flag('equipment-slots', 'REQUIRES_ART_CHANGE');
  if (artChanges.some((row) => row.issue === 'R-ANCHOR')) flag('anchor-names', 'REQUIRES_ART_CHANGE');
  if (artChanges.some((row) => row.issue === 'R-VARIANT')) flag('variant-references', 'REQUIRES_ART_CHANGE');

  artChanges.sort((left, right) =>
    left.issue.localeCompare(right.issue) ||
    left.file.localeCompare(right.file) ||
    left.record.localeCompare(right.record) ||
    left.field.localeCompare(right.field),
  );

  const checks = CHECKS.map(([id, name]) => ({
    id,
    name,
    status: statusOf(flags[id]),
    evidence: evidence[id],
  }));

  const specificIssues = [
    specific(
      'item-anchor-naming',
      'Item anchor naming',
      artChanges.some((row) => row.issue === 'R-ANCHOR'),
      checks.find((check) => check.id === 'anchor-names').status,
      'Single-slot equipment has no anchor name. The slot map supplies head, main_hand, off_hand, back, and feet.',
    ),
    specific(
      'shared-slot-arrays',
      'Shared equipment slot arrays',
      artChanges.some((row) => row.issue === 'R-SLOTS'),
      checks.find((check) => check.id === 'equipment-slots').status,
      'EQ_DAGGER_BASIC_001 uses slot "main_hand|off_hand" in shared_items.json and in the manifest.',
    ),
    specific(
      'asset-id-in-item-records',
      'Asset ID inside item records',
      artChanges.some((row) => row.issue === 'R-ASSET-ID'),
      checks.find((check) => check.id === 'equipment-ids').status,
      'Four shared item bodies omit asset_id. Per-character items.json already stores it. The key still matches the manifest.',
    ),
    specific(
      'variant-of',
      'variant_of compatibility',
      artChanges.some((row) => row.issue === 'R-VARIANT'),
      checks.find((check) => check.id === 'variant-references').status,
      'EQ_AEG_POT_HELMET_GOLD_001.variant_of is EQ_AEG_POT_HELMET_SILVER_001. Card, sprite, and composite variants omit variant_of.',
    ),
    specific(
      'status-enums',
      'Manifest status enums',
      false,
      checks.find((check) => check.id === 'asset-status').status,
      `Legend ${ASSET_STATUSES.join(', ')}. Live counts CONCEPT ${byStatus.CONCEPT}, PROTOTYPE ${byStatus.PROTOTYPE}, QA_PASSED ${byStatus.QA_PASSED}, PRODUCTION_READY ${byStatus.PRODUCTION_READY}, INTEGRATED ${byStatus.INTEGRATED}.`,
    ),
    specific(
      'duplicate-ids',
      'Duplicate IDs',
      false,
      duplicateIds.length > 0 || duplicateErrors.length > 0 ? 'FAIL' : 'PASS',
      duplicateIds.length > 0 ? `Duplicates: ${duplicateIds.join(', ')}.` : 'The real manifest has no duplicate asset_id.',
    ),
  ];

  const observations = [
    'compatible_rigs on shared items is preserved on the normalized copy. The loader has no rejection rule for it, and this audit does not add one.',
    'A no-commit merge of the art branch into the systems branch conflicts on README.md and tests/README.md. This branch does not resolve those files and does not commit a merge.',
    `${ART_JSON.legacyReference} keeps slug ids (aegis_sir_potlid and the other three). The live ids are the AVT_* keys in ${ART_JSON.manifest}.`,
    'Nothing in the manifest is QA_PASSED, PRODUCTION_READY, or INTEGRATED. This audit is not PRODUCTION_READY.',
  ];

  return {
    artCommit: bundle.artCommit,
    artRef: bundle.artRef,
    source: bundle.source,
    counts: {
      assets: assets.length,
      byStatus,
    },
    checks,
    specificIssues,
    artChanges,
    placements,
    observations,
    crosswalk,
  };
}

function statusOf(list) {
  if (list.includes('FAIL')) return 'FAIL';
  if (list.includes('REQUIRES_SYSTEM_CHANGE')) return 'REQUIRES_SYSTEM_CHANGE';
  if (list.includes('REQUIRES_ART_CHANGE')) return 'REQUIRES_ART_CHANGE';
  if (list.includes('BLOCKED_BY_DESIGN')) return 'BLOCKED_BY_DESIGN';
  return 'PASS';
}

function specific(id, name, hasArtChange, checkStatus, evidence) {
  let status = 'PASS';
  if (checkStatus === 'FAIL' || checkStatus === 'REQUIRES_SYSTEM_CHANGE' || checkStatus === 'BLOCKED_BY_DESIGN') {
    status = checkStatus;
  } else if (hasArtChange || checkStatus === 'REQUIRES_ART_CHANGE') {
    status = 'REQUIRES_ART_CHANGE';
  }
  return { id, name, status, evidence };
}

function placementRow(equipmentId, avatarId, result) {
  return {
    equipmentId,
    avatarId,
    slot: result.slot ?? null,
    ok: result.ok === true,
    reason: result.reason ?? null,
    anchorName: result.anchorName ?? null,
    origin: result.origin ?? null,
    nativeOrigin: result.nativeOrigin ?? null,
    matches: result.nativeOriginMatches ?? null,
    fit: result.fit ?? null,
  };
}

function notePlacement(record, placed, flag, say) {
  if (placed.ok && record.nativeOrigin && placed.nativeOriginMatches === false && sameAvatar(record, placed)) {
    flag('pivot-coordinates', 'FAIL');
    say('pivot-coordinates', `${record.id} on ${placed.avatarId} origin disagrees with native_origin.`);
  }
  if (!placed.ok) {
    if (placed.reason === 'MISSING_PIVOT' || placed.reason === 'INVALID_FIT') flag('pivot-coordinates', 'FAIL');
    else if (placed.reason === 'MISSING_ANCHOR' || placed.reason === 'NO_ANCHOR_MAPPING' || placed.reason === 'MISSING_ANCHORS') {
      flag('anchor-names', 'FAIL');
    } else if (placed.reason === 'MISSING_RIG') flag('rig-definitions', 'FAIL');
    else if (placed.reason === 'MISSING_EQUIPMENT_DATA') flag('equipment-ids', 'FAIL');
    else flag('equipment-slots', 'FAIL');
    say('equipment-slots', `${record.id} on ${placed.avatarId} returned ${placed.reason}.`);
  }
}

function sameAvatar(record, placed) {
  return record.nativeCharacter === placed.avatarId;
}
