import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createAssetLoader } from '../../src/assets/loader.js';
import { SAMPLE_AVATARS, SAMPLE_EQUIPMENT, SAMPLE_VARIANTS } from '../../src/avatars/catalog.js';
import { ASSET_STATUSES } from '../../src/schema/constants.js';
import { validateAssetManifest } from '../../src/schema/validate.js';
import {
  ART_COMMIT,
  ART_JSON,
  auditArtBundle,
  createIntegratedLoader,
  loadArtBundle,
  renderCompatibilityReport,
  renderRequiredChangesDoc,
  resolveRigLayerPath,
} from '../../src/integration/contract.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const bundle = loadArtBundle();
const audit = auditArtBundle(bundle);

const EXPECTED_CHECKS = [
  ['character-ids', 'PASS'],
  ['equipment-ids', 'PASS'],
  ['manifest-format', 'PASS'],
  ['rig-definitions', 'PASS'],
  ['equipment-slots', 'REQUIRES_ART_CHANGE'],
  ['anchor-names', 'REQUIRES_ART_CHANGE'],
  ['pivot-coordinates', 'PASS'],
  ['variant-references', 'REQUIRES_ART_CHANGE'],
  ['frame-layout', 'PASS'],
  ['asset-status', 'PASS'],
  ['path-resolution', 'PASS'],
  ['missing-assets', 'PASS'],
];

const EXPECTED_ISSUES = [
  ['item-anchor-naming', 'REQUIRES_ART_CHANGE'],
  ['shared-slot-arrays', 'REQUIRES_ART_CHANGE'],
  ['asset-id-in-item-records', 'REQUIRES_ART_CHANGE'],
  ['variant-of', 'REQUIRES_ART_CHANGE'],
  ['status-enums', 'PASS'],
  ['duplicate-ids', 'PASS'],
];

const ART_BINARY = /\.(png|jpe?g|gif|webp|ico|bmp)$/i;
const ART_BINARY_IMPORT = /(?:^|\n)\s*(?:import\s+(?:[^'"\n]+\s+from\s+)?|import\s*\(|require\s*\()\s*['"][^'"]+\.(?:png|jpe?g|gif|webp|ico|bmp)['"]/;
const ART_DATA_URI = /data:image\/(?:png|jpeg|gif|webp);base64,/i;

function readRepo(path) {
  return readFileSync(join(repoRoot, path), 'utf8');
}

/**
 * Art is legitimately in this commit only when HEAD contains the manifest and
 * at least one of its paths exists on disk. A systems-only HEAD does not.
 * @param {Set<string>} tracked
 */
function committedArtTreePresent(tracked) {
  if (!tracked.has(ART_JSON.manifest)) return false;
  const manifestPath = join(repoRoot, ART_JSON.manifest);
  if (!existsSync(manifestPath)) return false;
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    return false;
  }
  if (!manifest || !Array.isArray(manifest.assets) || manifest.assets.length === 0) return false;
  return manifest.assets.some((entry) => {
    if (!entry || typeof entry.path !== 'string' || entry.path.length === 0) return false;
    if (entry.path.startsWith('/') || entry.path.split(/[\\/]/).includes('..')) return false;
    return existsSync(join(repoRoot, entry.path));
  });
}

/**
 * Systems code may name art paths. It may not import or carry the binaries.
 * @returns {string[]}
 */
function embeddedArtInSystems() {
  /** @type {string[]} */
  const hits = [];
  function walk(directory, relative) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = join(directory, entry.name);
      const next = `${relative}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(full, next);
        continue;
      }
      if (!entry.isFile()) continue;
      if (ART_BINARY.test(entry.name)) {
        hits.push(next);
        continue;
      }
      if (!/\.(?:js|mjs|cjs|json)$/.test(entry.name)) continue;
      const text = readFileSync(full, 'utf8');
      if (ART_BINARY_IMPORT.test(text) || ART_DATA_URI.test(text)) hits.push(next);
    }
  }
  walk(join(repoRoot, 'src'), 'src');
  return hits;
}

function characterBlock(avatarId) {
  for (const file of bundle.rigFiles) {
    const character = file.data.characters?.[avatarId];
    if (character) return { rig: file.data, character };
  }
  return null;
}

test('pinned art commit loads the real manifest', () => {
  assert.equal(bundle.artCommit, ART_COMMIT);
  assert.equal(bundle.manifest.asset_count, 87);
  assert.equal(bundle.manifest.assets.length, 87);
  assert.deepEqual(bundle.manifest.status_legend, [...ASSET_STATUSES]);
  assert.deepEqual(validateAssetManifest(bundle.manifest), []);
  assert.equal(bundle.missingPaths.length, 0);
  assert.equal(Object.keys(bundle.files).length, 87);
});

test('twelve checks and the named contract issues', () => {
  assert.deepEqual(
    audit.checks.map((check) => [check.id, check.status]),
    EXPECTED_CHECKS,
  );
  assert.deepEqual(
    audit.specificIssues.map((issue) => [issue.id, issue.status]),
    EXPECTED_ISSUES,
  );
  assert.equal(audit.counts.byStatus.CONCEPT, 11);
  assert.equal(audit.counts.byStatus.PROTOTYPE, 76);
  assert.equal(audit.counts.byStatus.QA_PASSED, 0);
  assert.equal(audit.counts.byStatus.PRODUCTION_READY, 0);
  assert.equal(audit.counts.byStatus.INTEGRATED, 0);
});

test('character ids, sample equipment, and sample variants match the art commit', () => {
  for (const avatar of SAMPLE_AVATARS) {
    const line = bundle.manifest.characters[avatar.avatarId];
    assert.equal(line.includes(avatar.nameEn), true);
    assert.equal(line.includes(avatar.nameTh), true);
    assert.equal(line.includes(avatar.rigId), true);
    const home = characterBlock(avatar.avatarId);
    assert.equal(home.rig.rig, avatar.rigId);
  }
  for (const sample of SAMPLE_EQUIPMENT) {
    const entry = bundle.manifest.assets.find((asset) => asset.asset_id === sample.equipmentId);
    assert.equal(entry.slot, sample.slot);
    assert.equal(entry.variant_of ?? null, sample.variantOf);
  }
  for (const sample of SAMPLE_VARIANTS) {
    const entry = bundle.manifest.assets.find((asset) => asset.asset_id === sample.assetId);
    assert.equal(entry.status, sample.status);
    if (sample.subjectKind === 'equipment') assert.equal(entry.variant_of, sample.baseId);
    if (sample.subjectKind === 'card_art') assert.equal(entry.variant_of, undefined);
  }
});

test('native placement matches native_origin and the loader formula', () => {
  const { loader, normalized } = createIntegratedLoader(bundle);
  const native = normalized.itemRecords.filter((record) => record.nativeCharacter);
  assert.equal(native.length, 13);
  for (const record of native) {
    const { character } = characterBlock(record.nativeCharacter);
    const placed = loader.placement(record.nativeCharacter, record.id);
    const anchorName = normalized.slotAnchorMap[record.slots[0]];
    const anchor = character.anchors[anchorName];
    const fit = character.fit?.[record.id] ?? [0, 0];
    const origin = [anchor[0] - record.pivot[0] + fit[0], anchor[1] - record.pivot[1] + fit[1]];
    assert.equal(placed.ok, true, record.id);
    assert.equal(placed.anchorName, anchorName);
    assert.deepEqual(placed.anchor, anchor);
    assert.deepEqual(placed.origin, origin);
    assert.equal(placed.nativeOriginMatches, true, record.id);
    assert.deepEqual(placed.nativeOrigin, record.nativeOrigin);
    assert.equal(placed.sources.slotAnchor, 'slot-anchor-map');
  }
  const kunai = native.find((record) => record.id === 'EQ_PHA_KUNAI_MAIN_001');
  assert.equal(kunai.pivot[1] < 0, true);
});

test('shared items, the dagger pipe, and filled asset_id copies', () => {
  const { loader, normalized } = createIntegratedLoader(bundle);
  const sharedFile = bundle.itemFiles.find((file) => file.path.endsWith('shared_items.json'));
  for (const id of Object.keys(sharedFile.data)) {
    assert.equal(sharedFile.data[id].asset_id, undefined);
    assert.equal(normalized.itemsById[id].asset_id, id);
    assert.equal(sharedFile.data[id].asset_id, undefined);
  }
  const rawArray = createAssetLoader({
    manifest: bundle.manifest,
    dataFiles: {
      rigs: normalized.rigs,
      items: Object.values(sharedFile.data),
      frameLayout: bundle.frameLayout,
    },
  });
  assert.equal(rawArray.placement('AVT_CEL_001', 'EQ_STAFF_NEUTRAL_001').reason, 'MISSING_EQUIPMENT_DATA');
  const filledArray = createAssetLoader({
    manifest: bundle.manifest,
    dataFiles: {
      rigs: normalized.rigs,
      items: Object.values(normalized.itemsById),
      frameLayout: bundle.frameLayout,
    },
  });
  assert.equal(filledArray.placement('AVT_CEL_001', 'EQ_STAFF_NEUTRAL_001').ok, true);

  const dagger = loader.placement('AVT_AEG_001', 'EQ_DAGGER_BASIC_001');
  assert.equal(dagger.reason, 'AMBIGUOUS_SLOT');
  assert.deepEqual(dagger.slots, ['main_hand', 'off_hand']);
  const chosen = loader.placement('AVT_AEG_001', 'EQ_DAGGER_BASIC_001', { slot: 'off_hand' });
  assert.equal(chosen.ok, true);
  assert.equal(chosen.anchorName, 'off_hand');
  const { character, rig } = characterBlock('AVT_AEG_001');
  const anchor = character.anchors.main_hand;
  const pivot = sharedFile.data.EQ_SWORD_BASIC_001.pivot;
  const fit = character.fit.EQ_SWORD_BASIC_001;
  const sword = loader.placement('AVT_AEG_001', 'EQ_SWORD_BASIC_001');
  assert.deepEqual(sword.origin, [anchor[0] - pivot[0] + fit[0], anchor[1] - pivot[1] + fit[1]]);
  assert.equal(JSON.stringify(character.anchors) === JSON.stringify(rig.default_anchors), false);
});

test('missing ids, advisory statuses, and a synthetic duplicate', () => {
  const { loader } = createIntegratedLoader(bundle);
  const missing = loader.resolve('NO_SUCH_ASSET');
  assert.equal(missing.ok, false);
  assert.equal(missing.found, false);
  assert.equal(missing.reason, 'MISSING_ID');
  const concept = bundle.manifest.assets.filter((entry) => entry.status === 'CONCEPT');
  assert.equal(concept.length, 11);
  for (const entry of concept) {
    const resolved = loader.resolve(entry.asset_id);
    assert.equal(resolved.ok, true);
    assert.equal(resolved.advisory, 'CONCEPT');
    assert.equal(resolved.productionReady, false);
  }
  for (const entry of bundle.manifest.assets) {
    const info = bundle.files[entry.path];
    assert.equal(info.sha256, entry.sha256);
    assert.equal(info.bytes, entry.bytes);
    assert.equal(loader.integrity(entry.asset_id).sha256, entry.sha256);
  }

  const duplicated = structuredClone(bundle.manifest);
  duplicated.assets.push({ ...duplicated.assets[0] });
  const tampered = auditArtBundle({ ...bundle, manifest: duplicated });
  assert.equal(tampered.checks.find((check) => check.id === 'manifest-format').status, 'FAIL');
  assert.equal(tampered.specificIssues.find((issue) => issue.id === 'duplicate-ids').status, 'FAIL');

  const oddManifest = structuredClone(bundle.manifest);
  oddManifest.assets[0] = { ...oddManifest.assets[0], status: 'WIP' };
  const odd = auditArtBundle({ ...bundle, manifest: oddManifest });
  assert.equal(odd.checks.find((check) => check.id === 'asset-status').status, 'FAIL');
  const oddLoader = createAssetLoader({
    manifest: oddManifest,
    dataFiles: { rigs: bundle.rigFiles.map((file) => file.data), items: {}, frameLayout: bundle.frameLayout },
  });
  assert.equal(oddLoader.resolve(oddManifest.assets[0].asset_id).advisory, 'UNKNOWN_STATUS');
  assert.equal(oddLoader.resolve(oddManifest.assets[0].asset_id).ok, true);
});

test('layer basename resolution and frame rects come from the art files', () => {
  assert.equal(
    resolveRigLayerPath('AVT_AEG_001', 'AVT_AEG_001_L01_body.png'),
    'assets/characters/AVT_AEG_001/sprite/AVT_AEG_001_L01_body.png',
  );
  const kept = 'assets/characters/AVT_AEG_001/sprite/AVT_AEG_001_L01_body.png';
  assert.equal(resolveRigLayerPath('AVT_AEG_001', kept), kept);
  const { loader } = createIntegratedLoader(bundle);
  for (const name of ['art_window', 'faction_emblem', 'rarity', 'name', 'stat_pow', 'stat_def', 'stat_spd']) {
    const rect = bundle.frameLayout.rects[name];
    assert.deepEqual(loader.layoutRect(name).rect, { x: rect.x, y: rect.y, w: rect.w, h: rect.h });
  }
  assert.equal(loader.layoutRect('nope').reason, 'UNKNOWN_RECT');
});

test('required art changes name file, field, current value, and required value', () => {
  const issues = new Set(audit.artChanges.map((row) => row.issue));
  assert.deepEqual([...issues], ['R-ANCHOR', 'R-ASSET-ID', 'R-SLOTS', 'R-VARIANT']);
  for (const row of audit.artChanges) {
    assert.equal(row.status, 'REQUIRES_ART_CHANGE');
    assert.equal(typeof row.file, 'string');
    assert.equal(typeof row.record, 'string');
    assert.equal(typeof row.field, 'string');
    assert.equal(typeof row.current, 'string');
    assert.equal(typeof row.required, 'string');
    assert.equal(row.required.length > 0, true);
  }
  const daggerSlots = audit.artChanges.filter((row) => row.issue === 'R-SLOTS' && row.record === 'EQ_DAGGER_BASIC_001');
  assert.equal(daggerSlots.some((row) => row.file === 'assets/equipment/shared_items.json' && row.field === 'slot' && row.current === 'main_hand|off_hand' && row.required === 'absent'), true);
  assert.equal(daggerSlots.some((row) => row.file === 'assets/equipment/shared_items.json' && row.field === 'slots' && row.current === 'absent' && row.required === '["main_hand","off_hand"]'), true);
  assert.equal(daggerSlots.some((row) => row.file === ART_JSON.manifest && row.field === 'slot'), true);
  const assetIds = audit.artChanges.filter((row) => row.issue === 'R-ASSET-ID').map((row) => row.required).sort();
  assert.deepEqual(assetIds, ['EQ_DAGGER_BASIC_001', 'EQ_SHIELD_BUCKLER_001', 'EQ_STAFF_NEUTRAL_001', 'EQ_SWORD_BASIC_001']);
  const card = audit.artChanges.find((row) => row.record === 'CARD_AVT_AEG_001_card_v1_variant_goldpot' && row.field === 'variant_of');
  assert.equal(card.required, 'CARD_AVT_AEG_001_card_v1');
  assert.equal(card.current, 'absent');
  const sprite = audit.artChanges.find((row) => row.record === 'SPR_AVT_AEG_001_L04_headgear_gold');
  assert.equal(sprite.required, 'SPR_AVT_AEG_001_L04_headgear_silver');
  const helmet = audit.artChanges.find((row) => row.issue === 'R-ANCHOR' && row.record === 'EQ_PHA_SNEAKERS_SQUEAK_001' && row.file.endsWith('items.json'));
  assert.equal(helmet.required, 'feet');
  assert.equal(audit.artChanges.some((row) => row.issue === 'R-ANCHOR' && row.record === 'EQ_DAGGER_BASIC_001'), false);
});

test('reports match the renderer and systems code does not embed art', () => {
  assert.equal(readRepo('docs/ART_SYSTEMS_COMPATIBILITY_REPORT.md'), renderCompatibilityReport(audit));
  assert.equal(readRepo('docs/REQUIRED_CHANGES_FOR_MIRA.md'), renderRequiredChangesDoc(audit));
  const tracked = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' });
  const trackedLines = new Set(tracked.split('\n').filter(Boolean));
  const embedded = [
    ...embeddedArtInSystems(),
    ...[...trackedLines].filter((path) => path.startsWith('src/') && ART_BINARY.test(path)),
  ];
  assert.deepEqual(embedded, []);
  if (committedArtTreePresent(trackedLines)) return;
  assert.equal(tracked.includes('assets/characters/'), false);
  assert.equal(tracked.includes('docs/ASSET_MANIFEST.json'), false);
  assert.equal(tracked.includes('assets/card-art/'), false);
});
