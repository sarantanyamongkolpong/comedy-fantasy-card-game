import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import test from 'node:test';
import { findAsset } from '../../web/js/assets.js';
import { combatFx, floatersForUnit } from '../../web/js/combat-fx.js';
import { SCREEN_ASSET_QUERIES, SCREEN_BYTE_CAP, screenBytes } from '../../web/js/image-budget.js';
import { rewardLines } from '../../web/js/reward-lines.js';
import { PHASE3_FURNITURE_ART } from '../../src/schema/hideout.js';
import { loadGameApi } from '../../web/js/game-api.js';
import { createStarterProfile } from '../../web/js/profile.js';
import { groupOwned, sortStacks, stashCapacityLine } from '../../web/js/screens/stash.js';

const manifest = JSON.parse(readFileSync(new URL('../../web/assets-manifest.json', import.meta.url), 'utf8'));

test('Phase 3 uses the SVG frames and leaves the rejected rasters unbound', () => {
  for (const subjectId of ['slot', 'detail', 'tab', 'tooltip']) {
    const asset = findAsset(manifest, { slot: 'ui-frame', subjectId });
    assert.ok(asset, subjectId);
    assert.equal(asset.path.endsWith('.svg'), true, asset.asset_id);
    assert.equal(asset.review_status, 'GENERATED_REVIEW');
    assert.equal(asset.status, 'CONCEPT');
    assert.equal(asset.placeholder, false);
  }
  const text = JSON.stringify(manifest);
  for (const banned of [
    'inventory_slot_frame.png',
    'inventory_item_detail_panel.png',
    'inventory_category_tab_frame.png',
    'inventory_tooltip_frame.png',
    'vfx_critical_hit',
    'vfx_card_upgrade',
  ]) {
    assert.equal(text.includes(banned), false, banned);
  }
  assert.equal(findAsset(manifest, { slot: 'battle-vfx', subjectId: 'taunt' }).asset_id, 'VFX_STATUS_TAUNT');
  assert.equal(findAsset(manifest, { slot: 'zone-vfx', subjectId: 'draw' }).asset_id, 'VFX_ZONE_DRAW');
  assert.equal(findAsset(manifest, { slot: 'zone-vfx', subjectId: 'discard' }).asset_id, 'VFX_ZONE_DISCARD');
  assert.equal(findAsset(manifest, { slot: 'reward-vfx', subjectId: 'coin' }).asset_id, 'VFX_REWARD_COINS');
  assert.equal(findAsset(manifest, { slot: 'bg-battle', subjectId: 'battle' }).asset_id, 'BG_BATTLE');
  assert.equal(findAsset(manifest, { slot: 'bg-prep', subjectId: 'prep' }).asset_id, 'BG_PREP');
  assert.equal(findAsset(manifest, { assetId: 'BG_BATTLE_ALT_TOWER' }).default, false);
  assert.equal(manifest.assets.filter((asset) => asset.slot === 'hideout-furniture').length, 7);
});

test('stash slots come from installed furniture, and phase 3 art adds none', async () => {
  const line = stashCapacityLine({ storage: { installedSlots: 0 } });
  assert.match(line, /Furniture slots: 0/);
  assert.match(line, /Total capacity: PENDING/);
  const api = await loadGameApi();
  const profile = createStarterProfile(api.catalog);
  assert.equal(api.stashReport(profile).storage.installedSlots, 0);
  assert.equal(api.stashReport(profile).totalCapacity.value, null);
  const placed = api.installFurniture(profile, PHASE3_FURNITURE_ART[0]);
  assert.equal(placed.storage.installedSlots, 0);
  assert.equal(profile.house.installedFurniture[0].artOnly, true);
  assert.equal(profile.house.installedFurniture[0].status, 'PROPOSED');
  assert.equal(profile.house.installedFurniture[0].assetId, 'furniture_companion_bed');
  const loaded = api.deserialize(api.serialize({ profile }));
  assert.equal(loaded.profile.house.installedFurniture[0].assetId, 'furniture_companion_bed');
  assert.equal(api.stashReport(loaded.profile).storage.installedSlots, 0);
  api.removeFurniture(profile, 'furniture_companion_bed');
  assert.equal(profile.house.installedFurniture.length, 0);
  const box = api.installFurniture(profile, { furnitureId: 'FUR_REF_BUNGALOW_BOX', capacity: 50 });
  assert.equal(box.storage.installedSlots, 50);
  api.removeFurniture(profile, 'FUR_REF_BUNGALOW_BOX');
  assert.equal(api.stashReport(profile).storage.installedSlots, 0);
  const source = readFileSync(new URL('../../web/js/screens/gacha.js', import.meta.url), 'utf8');
  const seedLine = source.split('\n').find((row) => row.includes('seed:'));
  assert.equal(seedLine.includes('`'), false);
  assert.match(source, /const seed = integerSeed\(/);
});

test('stash stacks and sorts copies without inventing a capacity', () => {
  const rows = [
    { cardId: 'ACT_A', name: 'Smash' },
    { cardId: 'ACT_B', name: 'Guard' },
    { cardId: 'ACT_A', name: 'Smash' },
  ];
  const stacks = groupOwned(rows, 'cardId');
  assert.equal(stacks.length, 2);
  const byCount = sortStacks(stacks, 'count', (stack) => stack[0].name, () => 'N');
  assert.equal(byCount[0][0].cardId, 'ACT_A');
  assert.equal(byCount[0].length, 2);
  const byName = sortStacks(stacks, 'name', (stack) => stack[0].name, () => 'N');
  assert.equal(byName[0][0].name, 'Guard');
});

test('floating numbers come from damage, shield, and regen log rows', () => {
  const log = [
    { type: 'damage', avatarId: 'AVT_AEG_002', sideId: 'enemy', targetId: 'AVT_AEG_002', amount: 4, dealt: 3, delta: -3, hp: 11 },
    { type: 'shield', avatarId: 'AVT_AEG_002', sideId: 'player', amount: 1, shield: 1, delta: 0 },
    { type: 'regen_applied', avatarId: 'AVT_SAN_002', sideId: 'player', amount: 3, ticks: 2, delta: 0 },
    { type: 'regen_tick', avatarId: 'AVT_SAN_002', sideId: 'player', amount: 3, healed: 3, delta: 3, hp: 14 },
    { type: 'damage', avatarId: 'AVT_PHA_002', sideId: 'enemy', dealt: 0, delta: 0, hp: 8 },
  ];
  const fx = combatFx(log, 0);
  assert.equal(fx.floaters.length, 4);
  assert.deepEqual(floatersForUnit(fx.floaters, { avatarId: 'AVT_AEG_002', sideId: 'enemy', hp: 11 }).map((item) => item.text), ['-3']);
  assert.deepEqual(floatersForUnit(fx.floaters, { avatarId: 'AVT_AEG_002', sideId: 'player', hp: 20 }).map((item) => item.text), ['SHIELD 1']);
  assert.deepEqual(floatersForUnit(fx.floaters, { avatarId: 'AVT_SAN_002', sideId: 'player', hp: 14 }).map((item) => item.text), ['REGEN +3 x2', '+3']);
  assert.equal(floatersForUnit(fx.floaters, { avatarId: 'AVT_AEG_002', sideId: 'enemy', hp: 99 }).length, 0);
  const again = combatFx(log, fx.cursor);
  assert.equal(again.floaters.length, 0);
  const draw = combatFx([{ type: 'draw_to_hand' }, { type: 'voluntary_discard' }], 0);
  assert.equal(draw.draw, true);
  assert.equal(draw.discard, true);
});

test('reward lines keep a null payload pending', () => {
  const lines = rewardLines({
    status: 'decided',
    winnerSideId: 'player',
    reason: 'all_avatars_defeated',
    rewards: {
      payloadStatus: 'PENDING_OWNER',
      timesEmitted: 1,
      payload: {
        status: 'PENDING_OWNER',
        G: null,
        GStatus: 'PENDING_OWNER',
        loot: null,
        lootStatus: 'PENDING_OWNER',
        items: null,
        itemsStatus: 'PENDING_OWNER',
      },
    },
  });
  const byLabel = Object.fromEntries(lines.map((line) => [line.label, line.value]));
  assert.equal(byLabel.Result, 'Victory');
  assert.equal(byLabel.G, 'PENDING');
  assert.equal(byLabel.Loot, 'PENDING');
  assert.equal(byLabel.Items, 'PENDING');
  assert.equal(byLabel.G === '0' || byLabel.Loot === '0' || byLabel.Items === '0', false);
  assert.equal(byLabel.Payload, 'PENDING_OWNER');
  assert.equal(byLabel['Times emitted'], '1');
  const paid = rewardLines({
    status: 'decided',
    winnerSideId: 'enemy',
    reason: 'all_avatars_defeated',
    rewards: { payload: { G: 4, items: ['TOKEN'] }, payloadStatus: 'PENDING_OWNER', timesEmitted: 1 },
  });
  const paidMap = Object.fromEntries(paid.map((line) => [line.label, line.value]));
  assert.equal(paidMap.Result, 'Defeat');
  assert.equal(paidMap.G, '4');
  assert.equal(paidMap.Loot, 'TOKEN');
});

test('each screen stays inside the image budget', () => {
  const root = new URL('../../', import.meta.url);
  const report = [];
  for (const screen of Object.keys(SCREEN_ASSET_QUERIES)) {
    const row = screenBytes(manifest, screen, (path) => statSync(new URL(path, root)).size);
    report.push({ screen, bytes: row.total, files: row.files.length });
    assert.equal(row.total > 0, true, screen);
    assert.equal(row.total <= SCREEN_BYTE_CAP, true, `${screen} ${row.total}`);
  }
  console.log(JSON.stringify(report));
});
