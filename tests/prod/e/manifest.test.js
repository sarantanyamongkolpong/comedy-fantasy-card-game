import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { ASSET_STATUSES } from '../../../src/schema/constants.js';
import { validateAssetManifest } from '../../../src/schema/validate.js';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const fragment = JSON.parse(readFileSync(join(root, 'web/manifests/battle-ui.json'), 'utf8'));
const main = JSON.parse(readFileSync(join(root, 'web/assets-manifest.json'), 'utf8'));

test('battle UI fragment is review art with unique ids and real files', () => {
  assert.equal(fragment.review_status, 'GENERATED_REVIEW');
  assert.equal(fragment.productionReady, false);
  assert.equal(validateAssetManifest(fragment).length, 0);
  const mainIds = new Set(main.assets.map((asset) => asset.asset_id));
  const seen = new Set();
  assert.ok(fragment.assets.length >= 8);
  for (const asset of fragment.assets) {
    assert.equal(seen.has(asset.asset_id), false, asset.asset_id);
    seen.add(asset.asset_id);
    assert.equal(mainIds.has(asset.asset_id), false, asset.asset_id);
    assert.equal(asset.status, 'CONCEPT');
    assert.equal(ASSET_STATUSES.includes(asset.status), true);
    assert.equal(asset.review_status, 'GENERATED_REVIEW');
    assert.equal(asset.placeholder, false);
    assert.equal(asset.slot, 'battle-ui');
    assert.equal(typeof asset.anchor, 'string');
    assert.equal(typeof asset.subject_id, 'string');
    assert.equal(asset.rarity, null);
    assert.equal(asset.owner, 'prod-e');
    assert.equal(asset.type, 'ui');
    assert.equal(asset.path.startsWith('web/assets/battle-ui/'), true, asset.path);
    assert.equal(asset.path.endsWith('.webp'), true);
    assert.equal(asset.source_path.startsWith('art-src/battle-ui/'), true);
    assert.equal(asset.source_path.endsWith('.svg'), true);
    const shipped = statSync(join(root, asset.path));
    const source = statSync(join(root, asset.source_path));
    assert.equal(shipped.size, asset.bytes, asset.asset_id);
    assert.equal(shipped.size > 0, true);
    assert.equal(source.size > 0, true);
    const svg = readFileSync(join(root, asset.source_path), 'utf8');
    assert.equal(/<text[\s>]/i.test(svg), false, asset.source_path);
    assert.equal(svg.includes('REF_CARD'), false);
  }
  const subjects = fragment.assets.map((asset) => asset.subject_id);
  for (const subject of ['frame-corner', 'frame-edge-h', 'frame-edge-v', 'ap-gem-on', 'ap-gem-off', 'hp-track', 'hp-shield', 'shadow-ground', 'vfx-shield', 'vfx-buff', 'vfx-debuff', 'row-front', 'row-back']) {
    assert.equal(subjects.includes(subject), true, subject);
  }
});
