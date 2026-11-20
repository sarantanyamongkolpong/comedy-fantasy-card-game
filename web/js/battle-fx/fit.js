/**
 * Painted bounds for battle and prep.
 * Hit boxes stay in battle-layout.js and prep-layout.js.
 * Sprite sizes are the largest even widths that keep those paintings apart.
 */

import { battleBands, battleSlots } from '../battle-layout.js';
import { prepPlayerSlots } from '../prep-layout.js';

export const FIT = Object.freeze({
  spriteWidth: 136,
  backSpriteHeight: 186,
  frontSpriteHeight: 236,
  spriteBottom: 22,
  prepInsetX: 6,
  prepTop: 4,
  prepBottom: 22,
  handCardWidth: 128,
  handGap: 6,
  handLift: 16,
  cardAspect: 1536 / 1024,
});

export function paintedSprite(slot) {
  const height = slot.row === 'back' ? FIT.backSpriteHeight : FIT.frontSpriteHeight;
  const box = slot.box;
  return {
    x: box.x + box.w / 2 - FIT.spriteWidth / 2,
    y: box.y + box.h - FIT.spriteBottom - height,
    w: FIT.spriteWidth,
    h: height,
  };
}

export function battleSpriteBoxes(slots = battleSlots()) {
  return slots.map((slot) => ({
    id: slot.id,
    side: slot.side,
    row: slot.row,
    box: paintedSprite(slot),
  }));
}

/**
 * Flex row: basis is the card width, grow is 0, shrink is shared,
 * the row is centered in the hand band, cards sit on the bottom edge.
 */
export function handCardBoxes(count = 5, bands = battleBands()) {
  const n = Math.max(0, count);
  const gap = FIT.handGap;
  const gaps = Math.max(0, n - 1) * gap;
  const available = bands.hand.w - gaps;
  const width = n === 0 ? 0 : Math.min(FIT.handCardWidth, available / n);
  const total = n * width + gaps;
  const start = bands.hand.x + (bands.hand.w - total) / 2;
  const height = width * FIT.cardAspect;
  const y = bands.hand.y + bands.hand.h - height;
  return Array.from({ length: n }, (_, index) => ({
    x: start + index * (width + gap),
    y,
    w: width,
    h: height,
  }));
}

export function liftedCard(box) {
  return { ...box, y: box.y - FIT.handLift };
}

export function prepSpriteBoxes(slots = prepPlayerSlots()) {
  return slots.map((slot) => {
    const box = slot.box;
    return {
      id: slot.id,
      box: {
        x: box.x + FIT.prepInsetX,
        y: box.y + FIT.prepTop,
        w: Math.max(0, box.w - FIT.prepInsetX * 2),
        h: Math.max(0, box.h - FIT.prepTop - FIT.prepBottom),
      },
    };
  });
}
