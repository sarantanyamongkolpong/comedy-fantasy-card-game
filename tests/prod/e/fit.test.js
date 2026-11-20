import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { battleBands, battleSlots, boxesIntersect } from '../../../web/js/battle-layout.js';
import { prepBands } from '../../../web/js/prep-layout.js';
import {
  FIT,
  battleSpriteBoxes,
  handCardBoxes,
  liftedCard,
  prepSpriteBoxes,
} from '../../../web/js/battle-fx/fit.js';

function inside(inner, outer) {
  return inner.x >= outer.x - 0.01
    && inner.y >= outer.y - 0.01
    && inner.x + inner.w <= outer.x + outer.w + 0.01
    && inner.y + inner.h <= outer.y + outer.h + 0.01;
}

test('battle sprites stay on their own half and clear each other, the lead, and the hand', () => {
  const bands = battleBands();
  const sprites = battleSpriteBoxes();
  assert.equal(sprites.length, 8);
  const stage = { x: 0, y: 0, w: 1672, h: 941 };
  for (const sprite of sprites) {
    assert.equal(inside(sprite.box, stage), true, sprite.id);
    assert.equal(inside(sprite.box, bands.arena), true, sprite.id);
    assert.equal(boxesIntersect(sprite.box, bands.lead), false, sprite.id);
    assert.equal(boxesIntersect(sprite.box, bands.hand), false, sprite.id);
    assert.equal(boxesIntersect(sprite.box, bands.top), false, sprite.id);
    const mid = 1672 / 2;
    if (sprite.side === 'player') assert.equal(sprite.box.x + sprite.box.w < mid, true, sprite.id);
    else assert.equal(sprite.box.x > mid, true, sprite.id);
  }
  for (let i = 0; i < sprites.length; i += 1) {
    for (let j = i + 1; j < sprites.length; j += 1) {
      assert.equal(boxesIntersect(sprites[i].box, sprites[j].box), false, `${sprites[i].id} x ${sprites[j].id}`);
    }
  }
  const back = sprites.filter((sprite) => sprite.row === 'back');
  const front = sprites.filter((sprite) => sprite.row === 'front');
  assert.ok(back.every((sprite) => sprite.box.h === FIT.backSpriteHeight));
  assert.ok(front.every((sprite) => sprite.box.h === FIT.frontSpriteHeight));
  assert.ok(front.every((sprite) => sprite.box.h > back[0].box.h));
});

test('hand cards stay in the hand band and clear the arena sprites', () => {
  const bands = battleBands();
  const sprites = battleSpriteBoxes().map((sprite) => sprite.box);
  for (const count of [1, 5, 6, 8]) {
    const cards = handCardBoxes(count);
    for (let i = 0; i < cards.length; i += 1) {
      assert.equal(inside(cards[i], bands.hand), true, `${count} card ${i}`);
      assert.equal(boxesIntersect(cards[i], bands.arena), false, `${count} card ${i}`);
      assert.equal(boxesIntersect(liftedCard(cards[i]), bands.arena), false, `lift ${count}`);
      for (const sprite of sprites) {
        assert.equal(boxesIntersect(cards[i], sprite), false, `card ${count} sprite`);
        assert.equal(boxesIntersect(liftedCard(cards[i]), sprite), false, `lifted card ${count}`);
      }
      for (let j = i + 1; j < cards.length; j += 1) {
        assert.equal(boxesIntersect(cards[i], cards[j]), false, `${count} ${i}x${j}`);
      }
    }
  }
});

test('prep preview sprites stay inside the arena and clear each other', () => {
  const bands = prepBands();
  const sprites = prepSpriteBoxes();
  assert.equal(sprites.length, 4);
  for (let i = 0; i < sprites.length; i += 1) {
    assert.equal(inside(sprites[i].box, bands.arena), true, sprites[i].id);
    for (let j = i + 1; j < sprites.length; j += 1) {
      assert.equal(boxesIntersect(sprites[i].box, sprites[j].box), false, `${sprites[i].id} x ${sprites[j].id}`);
    }
  }
  const slots = battleSlots();
  assert.equal(slots.length, 8);
});

test('stylesheet fallbacks match the fit numbers and do not name image files', () => {
  const css = readFileSync(new URL('../../../web/css/battle-polish.css', import.meta.url), 'utf8');
  assert.match(css, new RegExp(`--bp-sprite-w:\\s*${FIT.spriteWidth}px`));
  assert.match(css, new RegExp(`--bp-sprite-h-back:\\s*${FIT.backSpriteHeight}px`));
  assert.match(css, new RegExp(`--bp-sprite-h-front:\\s*${FIT.frontSpriteHeight}px`));
  assert.match(css, new RegExp(`--bp-hand-card-w:\\s*${FIT.handCardWidth}px`));
  assert.match(css, new RegExp(`--bp-hand-gap:\\s*${FIT.handGap}px`));
  assert.match(css, /animation:\s*none/);
  assert.match(css, /bp-rise 900ms ease-out 1 both/);
  assert.equal(css.includes('.webp'), false);
  assert.equal(css.includes('web/assets/'), false);
});
