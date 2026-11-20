import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { REQUIRED_CARD_ANCHORS, cardFace, layoutFor } from '../../web/js/card-layers.js';
import { rectInsideCanvas, designSize } from '../../web/js/map-layout.js';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const manifest = JSON.parse(readFileSync(join(repoRoot, 'web/assets-manifest.json'), 'utf8'));

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

test('every manifest asset exists, is a placeholder, and is not a reference card', () => {
  const ids = new Set();
  assert.equal(manifest.productionReady, false);
  for (const asset of manifest.assets) {
    assert.equal(ids.has(asset.asset_id), false, asset.asset_id);
    ids.add(asset.asset_id);
    assert.equal(typeof asset.path, 'string');
    assert.equal(typeof asset.slot, 'string');
    assert.equal(typeof asset.anchor, 'string');
    assert.notEqual(asset.status, 'PRODUCTION_READY');
    assert.notEqual(asset.status, 'GENERATED_REVIEW');
    if (asset.review_status === 'GENERATED_REVIEW') {
      assert.equal(asset.placeholder, false, asset.asset_id);
      assert.equal(asset.status, 'CONCEPT');
      if (asset.fallback_path) assert.equal(existsSync(join(repoRoot, asset.fallback_path)), true, asset.fallback_path);
    } else {
      assert.equal(asset.placeholder, true, asset.asset_id);
    }
    assert.equal(asset.path.includes('REF_CARD'), false);
    assert.equal(asset.path.endsWith('.png'), false);
    const file = join(repoRoot, asset.path);
    assert.equal(existsSync(file), true, asset.path);
    assert.equal(statSync(file).size > 0, true);
  }
  for (const file of manifest.referenceOnly.files) {
    assert.equal(manifest.assets.some((asset) => asset.path === file), false);
  }
});

test('required slots, justin ids, and classic ids are present and unrenamed', () => {
  const slot = (name, extra) => manifest.assets.filter((asset) => asset.slot === name && (!extra || Object.entries(extra).every(([key, value]) => asset[key] === value)));
  for (const rarity of ['N', 'R', 'Epic', 'EX', 'FAC', 'TBD']) {
    assert.equal(slot('frame', { rarity }).length, 1, rarity);
  }
  for (const subject of ['FAC_AEG', 'FAC_PHA', 'FAC_CEL', 'FAC_SAN', 'generic']) {
    assert.equal(slot('faction-badge', { subject_id: subject }).length, 1, subject);
  }
  for (const subject of ['atk', 'def', 'spd']) {
    assert.equal(slot('stat-icon', { subject_id: subject }).length, 1, subject);
  }
  for (const id of ['AVT_AEG_002', 'AVT_PHA_002', 'AVT_CEL_002', 'AVT_SAN_002']) {
    assert.equal(slot('illustration', { subject_id: id }).length, 1, id);
    assert.equal(slot('battle-sprite', { subject_id: id }).length, 1, id);
    assert.equal(manifest.assets.some((asset) => asset.asset_id === id), true);
  }
  for (const id of ['AVT_AEG_001', 'AVT_PHA_001', 'AVT_CEL_001', 'AVT_SAN_001']) {
    assert.equal(slot('illustration', { subject_id: id }).length, 1, id);
    assert.equal(manifest.assets.some((asset) => asset.asset_id === id), false, `${id} stays a character id, not a renamed art id`);
  }
  const buildings = slot('building');
  assert.equal(buildings.length, 6);
  const canvas = designSize(manifest);
  for (const building of buildings) {
    const hotspot = building.hotspot;
    assert.equal(hotspot.anchorMode, 'bottom-center');
    assert.equal(hotspot.anchorX >= 0 && hotspot.anchorX <= canvas.width, true, building.asset_id);
    assert.equal(hotspot.anchorY >= 0 && hotspot.anchorY <= canvas.height, true, building.asset_id);
  }
  assert.equal(buildings.some((building) => building.hotspot.locked === true && building.hotspot.label === 'Sports Complex'), true);
});

test('card layout anchors sit inside the card and faces are layered', () => {
  const layout = manifest.cardLayout;
  for (const name of REQUIRED_CARD_ANCHORS) {
    const box = layout.anchors[name];
    assert.ok(box, name);
    assert.equal(rectInsideCanvas(box, layout), true, name);
  }
  const epic = layoutFor(manifest, 'Epic');
  const normal = layoutFor(manifest, 'N');
  const rare = layoutFor(manifest, 'R');
  assert.notEqual(rare.anchors.illustration.y, normal.anchors.illustration.y);
  for (const name of REQUIRED_CARD_ANCHORS) {
    assert.equal(rectInsideCanvas(epic.anchors[name], epic), true, name);
  }
  assert.equal(manifest.frameInsets.byRarity.Epic.art.y !== manifest.frameInsets.byRarity.R.art.y, true);
  const face = cardFace(manifest, {
    name: 'JUSTIN CASE',
    rarity: 'Epic',
    factionId: 'FAC_AEG',
    illustrationSubjectId: 'AVT_AEG_002',
    costAp: null,
    stats: { atk: 3, def: 8, spd: 1 },
    lines: ['Tank'],
    statusNote: 'Stats PROPOSED',
  });
  assert.equal(face.bakedCard, false);
  assert.equal(face.text.name, 'JUSTIN CASE');
  assert.equal(face.text.stats.atk, 3);
  const slots = face.layers.map((layer) => layer.slot);
  assert.ok(slots.includes('illustration'));
  assert.ok(slots.includes('frame'));
  assert.ok(slots.includes('faction-badge'));
  assert.equal(face.layers.filter((layer) => layer.slot === 'frame').every((layer) => layer.rarity === 'Epic'), true);
  assert.equal(face.layers.some((layer) => /REF_CARD|\.png$/.test(layer.path)), false);
  assert.equal(new Set(face.layers.map((layer) => layer.path)).size, face.layers.length);
});

test('web source does not bake images or reference-card pngs', () => {
  const files = walk(join(repoRoot, 'web')).filter((file) => /\.(js|css|html|svg|json)$/.test(file));
  const offenders = [];
  for (const file of files) {
    if (file.endsWith('assets-manifest.json')) continue;
    const text = readFileSync(file, 'utf8');
    if (/data:image/i.test(text) || /REF_CARD_/.test(text)) offenders.push(file);
    if (/\.(js|css|html)$/.test(file) && /web\/assets\//.test(text)) offenders.push(file);
  }
  assert.deepEqual(offenders, []);
});
