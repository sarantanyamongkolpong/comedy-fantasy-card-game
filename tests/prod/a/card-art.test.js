import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { cardFace } from '../../../web/js/card-layers.js';
import { decodeRgbaPng, pngSize } from './png-rgba.js';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, 'web/manifests/cards.json'), 'utf8'));
const actions = JSON.parse(readFileSync(join(root, 'content/v05/actions/starter-actions.json'), 'utf8'));
const deck = JSON.parse(readFileSync(join(root, 'content/v05/decks/demo-mixed-deck.json'), 'utf8')).deck;
const byId = new Map(actions.actionCards.map((card) => [card.cardId, card]));

function abs(rel) {
  return join(root, rel);
}

function modelOf(raw) {
  return {
    name: raw.name,
    rarity: raw.rarity,
    factionId: raw.Faction_Requirement,
    illustrationSubjectId: raw.cardId,
    costAp: raw.apCost,
    type: raw.actionType,
    stats: null,
    lines: [raw.Version_And_Status],
    statusNote: raw.Version_And_Status,
  };
}

test('the starter is the published 30-slot demo deck, with one subject per real card id', () => {
  assert.equal(deck.deckId, 'DECK_DEMO_MIXED_001');
  assert.equal(deck.cardIds.length, 30);
  assert.deepEqual(manifest.deck.cardIds, deck.cardIds);
  assert.equal(manifest.status, 'GENERATED_REVIEW');
  assert.equal(manifest.productionReady, false);
  const unique = [...new Set(deck.cardIds)];
  assert.equal(unique.length, 14);
  assert.deepEqual(manifest.deck.uniqueCardIds, unique);
  for (const id of unique) {
    assert.equal(byId.has(id), true, id);
    assert.equal(actions.actionCards.some((card) => card.cardId === id), true);
  }
});

test('every deck card resolves subject, frame, and icons from published data', () => {
  const ids = new Set();
  for (const asset of manifest.assets) {
    assert.equal(ids.has(asset.asset_id), false, asset.asset_id);
    ids.add(asset.asset_id);
    assert.equal(asset.status, 'CONCEPT', asset.asset_id);
    assert.equal(asset.review_status, 'GENERATED_REVIEW', asset.asset_id);
    assert.equal(typeof asset.type, 'string');
    assert.equal(asset.owner, 'a-card-art');
    assert.equal(asset.placeholder, false, asset.asset_id);
    assert.equal(asset.path.includes('REF_CARD'), false);
    assert.equal(existsSync(abs(asset.path)), true, asset.path);
    assert.equal(statSync(abs(asset.path)).size, asset.bytes, asset.asset_id);
    assert.equal(existsSync(abs(asset.source_path)), true, asset.source_path);
    if (!asset.borrowed) {
      assert.equal(statSync(abs(asset.source_path)).size, asset.source_bytes, asset.asset_id);
      assert.equal(asset.source_bytes > asset.bytes, true, asset.asset_id);
      assert.ok(asset.source_bytes <= 3 * 1024 * 1024, asset.asset_id);
    }
    const budget = manifest.budgets[asset.kind];
    if (budget && !asset.borrowed) assert.ok(asset.bytes <= budget, `${asset.asset_id} ${asset.bytes}`);
    if (asset.path.startsWith('web/assets/cards/')) {
      assert.equal(asset.path.endsWith('.webp'), true, asset.path);
      const magic = readFileSync(abs(asset.path)).subarray(0, 4).toString('ascii');
      assert.equal(magic, 'RIFF');
    }
  }

  for (const rarity of ['N', 'R', 'Epic', 'EX', 'FAC']) {
    const frames = manifest.assets.filter((asset) => asset.slot === 'frame' && asset.rarity === rarity);
    assert.equal(frames.length, 1, rarity);
  }

  for (const cardId of new Set(deck.cardIds)) {
    const raw = byId.get(cardId);
    const face = cardFace(manifest, modelOf(raw));
    assert.equal(face.bakedCard, false);
    assert.equal(face.text.name, raw.name);
    assert.equal(face.text.rarity, raw.rarity);
    assert.equal(face.text.type, raw.actionType);
    assert.equal(face.text.apCost, raw.apCost);
    assert.equal(face.text.stats, null);
    const slots = face.layers.map((layer) => layer.slot);
    assert.ok(slots.includes('illustration'), cardId);
    assert.ok(slots.includes('frame'), cardId);
    assert.ok(slots.includes('faction-badge'), cardId);
    assert.ok(slots.includes('ui-icon'), cardId);
    if (raw.actionType === 'Skill') assert.ok(slots.includes('type-icon'), cardId);
    const illustration = face.layers.find((layer) => layer.slot === 'illustration');
    assert.equal(illustration.placeholder, false);
    assert.equal(illustration.path.includes(cardId), true, illustration.path);
    const frame = face.layers.find((layer) => layer.slot === 'frame');
    assert.equal(frame.rarity, raw.rarity);
    for (const layer of face.layers) {
      assert.equal(layer.placeholder, false, layer.assetId);
      assert.equal(existsSync(abs(layer.path)), true, layer.path);
    }
    const badge = face.layers.find((layer) => layer.slot === 'faction-badge');
    const badgeAsset = manifest.assets.find((asset) => asset.asset_id === badge.assetId);
    assert.equal(badgeAsset.subject_id, raw.Faction_Requirement || 'generic');
  }
});

test('original subjects and frames are transparent where the layers need holes', () => {
  for (const asset of manifest.assets.filter((item) => item.kind === 'subject')) {
    const image = decodeRgbaPng(readFileSync(abs(asset.source_path)));
    assert.equal(image.pixel(1, 1)[3], 0, asset.asset_id);
    assert.equal(image.pixel(image.width - 2, image.height - 2)[3], 0, asset.asset_id);
    const mid = image.pixel(Math.floor(image.width / 2), Math.floor(image.height / 2));
    assert.equal(mid[3] > 200, true, asset.asset_id);
  }
  const scaleX = 864 / manifest.frameInsets.masterWidth;
  const scaleY = 1152 / manifest.frameInsets.masterHeight;
  for (const rarity of ['N', 'R', 'Epic', 'EX', 'FAC']) {
    const frame = manifest.assets.find((asset) => asset.slot === 'frame' && asset.rarity === rarity);
    const image = decodeRgbaPng(readFileSync(abs(frame.source_path)));
    assert.equal(image.pixel(0, 0)[3], 0, rarity);
    for (const name of ['art', 'title', 'body']) {
      const box = manifest.frameInsets.byRarity[rarity][name];
      const x = Math.round((box.x + box.w / 2) * scaleX);
      const y = Math.round((box.y + box.h / 2) * scaleY);
      assert.equal(image.pixel(x, y)[3], 0, `${rarity} ${name}`);
    }
  }
});

test('stat, skill, and type icons are present and the preview names every deck card', () => {
  for (const subject of ['atk', 'def', 'spd', 'ap', 'ATK', 'DEF', 'Skill', 'FAC_AEG', 'FAC_PHA', 'FAC_CEL', 'FAC_SAN', 'generic']) {
    assert.equal(manifest.assets.some((asset) => asset.subject_id === subject && asset.placeholder === false), true, subject);
  }
  const preview = join(root, 'tools/art/cards/preview');
  const html = readdirSync(preview).filter((name) => name.endsWith('.html')).map((name) => readFileSync(join(preview, name), 'utf8')).join('\n');
  for (const cardId of new Set(deck.cardIds)) {
    assert.equal(html.includes(cardId), true, cardId);
    assert.equal(html.includes(byId.get(cardId).name), true, cardId);
  }
  const shots = readdirSync(join(root, 'tools/art/cards/qa')).filter((name) => name.startsWith('844x390-') && name.endsWith('.png'));
  assert.equal(shots.length >= 5, true);
  for (const name of shots) {
    const size = pngSize(readFileSync(join(root, 'tools/art/cards/qa', name)));
    assert.deepEqual(size, { width: 844, height: 390 }, name);
  }
});
