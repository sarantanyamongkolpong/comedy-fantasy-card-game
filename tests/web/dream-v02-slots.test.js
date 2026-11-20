import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { findAsset } from '../../web/js/assets.js';

const manifest = JSON.parse(readFileSync(new URL('../../web/assets-manifest.json', import.meta.url), 'utf8'));

test('Dream v0.2 binds into slots and the tower arena stays an alternate', () => {
  const battle = findAsset(manifest, { slot: 'bg-battle', subjectId: 'battle' });
  assert.equal(battle.asset_id, 'BG_BATTLE');
  assert.equal(battle.path.endsWith('BG_BATTLE.webp'), true);
  const alt = findAsset(manifest, { assetId: 'BG_BATTLE_ALT_TOWER' });
  assert.equal(alt.default, false);
  assert.equal(alt.slot, 'bg-battle');
  assert.equal(findAsset(manifest, { slot: 'bg-battle', subjectId: 'tower-alternate' }), null);
  assert.equal(findAsset(manifest, { slot: 'bg-prep', subjectId: 'prep' }).asset_id, 'BG_PREP');
  for (const [slot, subjectId] of [
    ['house', 'cabin'],
    ['furniture', 'FUR_REF_BUNGALOW_BOX'],
    ['inventory-icon', 'FUR_REF_VILLA_DISPLAY_COUNTER'],
    ['illustration', 'ACT_GEN_ATK_001'],
    ['illustration', 'ACT_GEN_DEF_002'],
    ['battle-sprite', 'ENM_DEMO_001'],
    ['battle-sprite', 'ENM_DEMO_003'],
    ['gacha-machine', 'avatar'],
    ['bg-gacha', 'gacha'],
    ['bg-hideout', 'cabin'],
    ['ui-icon', 'g'],
    ['battle-vfx', 'regen'],
    ['gacha-vfx', 'EX'],
  ]) {
    const asset = findAsset(manifest, { slot, subjectId });
    assert.ok(asset, `${slot} ${subjectId}`);
    assert.equal(asset.placeholder, false, asset.asset_id);
    assert.equal(asset.review_status, 'GENERATED_REVIEW', asset.asset_id);
    assert.equal(asset.status, 'CONCEPT', asset.asset_id);
  }
  assert.equal(findAsset(manifest, { slot: 'battle-sprite', subjectId: 'ENM_DEMO_004' }), null);
  const slash = findAsset(manifest, { slot: 'illustration', subjectId: 'ACT_GEN_ATK_001' });
  assert.equal(slash.presentation.objectPosition, 'center 30%');
  const ex = findAsset(manifest, { slot: 'gacha-vfx', subjectId: 'EX' });
  assert.equal(ex.presentation.mask, 'radial');
  assert.equal(ex.presentation.blend, 'screen');
});
