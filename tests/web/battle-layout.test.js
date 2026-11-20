import assert from 'node:assert/strict';
import test from 'node:test';
import { battleBands, battleSlots, boxesIntersect } from '../../web/js/battle-layout.js';
import { prepBands, prepPlayerSlots } from '../../web/js/prep-layout.js';
import { stageLayout } from '../../web/js/stage.js';
import { contentCatalog } from '../../web/js/content-catalog.js';

const VIEWPORTS = [
  [667, 375],
  [844, 390],
  [1280, 720],
];

function inside(inner, outer) {
  return inner.x >= outer.x
    && inner.y >= outer.y
    && inner.x + inner.w <= outer.x + outer.w
    && inner.y + inner.h <= outer.y + outer.h;
}

function scaleBox(box, layout) {
  return {
    x: layout.offsetX + box.x * layout.scale,
    y: layout.offsetY + box.y * layout.scale,
    w: box.w * layout.scale,
    h: box.h * layout.scale,
  };
}

test('battle bands, lead plate, and unit boxes do not overlap', () => {
  const design = { width: 1672, height: 941 };
  const bands = battleBands(design);
  const names = ['top', 'arena', 'piles', 'hand', 'controls'];
  for (let i = 0; i < names.length; i += 1) {
    for (let j = i + 1; j < names.length; j += 1) {
      assert.equal(boxesIntersect(bands[names[i]], bands[names[j]]), false, `${names[i]} x ${names[j]}`);
    }
    assert.equal(inside(bands[names[i]], { x: 0, y: 0, w: design.width, h: design.height }), true, names[i]);
  }
  assert.equal(inside(bands.lead, bands.arena), true);
  const slots = battleSlots();
  assert.equal(slots.filter((slot) => slot.side === 'player').length, 4);
  assert.equal(slots.filter((slot) => slot.side === 'enemy').length, 4);
  for (const slot of slots) {
    assert.equal(inside(slot.box, bands.arena), true, slot.id);
    assert.equal(boxesIntersect(slot.box, bands.lead), false, slot.id);
    assert.equal(slot.side === 'player' ? slot.box.x + slot.box.w < design.width / 2 : slot.box.x > design.width / 2, true, slot.id);
  }
  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      assert.equal(boxesIntersect(slots[i].box, slots[j].box), false, `${slots[i].id} x ${slots[j].id}`);
    }
  }
  for (const [width, height] of VIEWPORTS) {
    const layout = stageLayout({ width, height }, {}, design);
    const hand = scaleBox(bands.hand, layout);
    const team = slots.filter((slot) => slot.side === 'player').map((slot) => scaleBox(slot.box, layout));
    for (const box of team) assert.equal(boxesIntersect(box, hand), false, `${width}x${height}`);
  }
});

test('prep battle panels do not overlap and the preview stays on the left team', () => {
  const design = { width: 1672, height: 941 };
  const bands = prepBands(design);
  const names = ['title', 'location', 'team', 'arena', 'deck', 'detail', 'back', 'start'];
  for (let i = 0; i < names.length; i += 1) {
    for (let j = i + 1; j < names.length; j += 1) {
      assert.equal(boxesIntersect(bands[names[i]], bands[names[j]]), false, `${names[i]} x ${names[j]}`);
    }
    assert.equal(inside(bands[names[i]], { x: 0, y: 0, w: design.width, h: design.height }), true, names[i]);
  }
  const slots = prepPlayerSlots();
  assert.equal(slots.length, 4);
  for (const slot of slots) {
    assert.equal(inside(slot.box, bands.arena), true, slot.id);
    assert.equal(boxesIntersect(slot.box, bands.team), false, slot.id);
    assert.equal(boxesIntersect(slot.box, bands.deck), false, slot.id);
  }
  for (const [width, height] of VIEWPORTS) {
    const layout = stageLayout({ width, height }, {}, design);
    assert.equal(boxesIntersect(scaleBox(bands.team, layout), scaleBox(bands.arena, layout)), false, `${width}x${height}`);
    assert.equal(boxesIntersect(scaleBox(bands.deck, layout), scaleBox(bands.detail, layout)), false, `${width}x${height}`);
    assert.equal(boxesIntersect(scaleBox(bands.back, layout), scaleBox(bands.start, layout)), false, `${width}x${height}`);
  }
});

test('Justina prep copy comes from content, not the reference heal bonus', () => {
  const justina = contentCatalog.avatarById('AVT_SAN_002');
  assert.equal(justina.role, 'Support');
  assert.equal(justina.active.name, 'Saving Grace');
  assert.equal(justina.active.summary, 'Regen +3 x2 turns');
  assert.equal(justina.passive.name, 'Moral Support');
  assert.equal(JSON.stringify(justina).includes('HEAL BONUS'), false);
  assert.equal(JSON.stringify(justina).includes('SYNC'), false);
});
