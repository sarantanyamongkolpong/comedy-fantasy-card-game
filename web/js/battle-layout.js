/**
 * Battle composition on the 1672×941 stage.
 * Owner ref is mirrored: our four avatars stand on the left, enemies on the right.
 * Tiles are visual anchors only. They are not a movement grid.
 */

export function battleBands(design = { width: 1672, height: 941 }) {
  const top = { x: 0, y: 0, w: design.width, h: 128 };
  const arena = { x: 0, y: 128, w: design.width, h: 414 };
  const piles = { x: 16, y: 552, w: 230, h: 372 };
  const hand = { x: 260, y: 560, w: 1060, h: 360 };
  const controls = { x: 1340, y: 560, w: 312, h: 360 };
  const lead = { x: 980, y: 132, w: 660, h: 28 };
  return { top, arena, piles, hand, controls, lead };
}

/** Feet anchors. Box is the sprite, sitting on a tile. */
export function battleSlots() {
  const sprite = { w: 140, h: 150 };
  const feet = [
    { id: 'p0', side: 'player', x: 250, y: 310 },
    { id: 'p1', side: 'player', x: 480, y: 300 },
    { id: 'p2', side: 'player', x: 200, y: 500 },
    { id: 'p3', side: 'player', x: 520, y: 500 },
    { id: 'e0', side: 'enemy', x: 1422, y: 310 },
    { id: 'e1', side: 'enemy', x: 1192, y: 322 },
    { id: 'e2', side: 'enemy', x: 1472, y: 500 },
    { id: 'e3', side: 'enemy', x: 1152, y: 500 },
  ];
  return feet.map((slot) => ({
    ...slot,
    box: {
      x: slot.x - sprite.w / 2,
      y: slot.y - sprite.h,
      w: sprite.w,
      h: sprite.h,
    },
    bar: { x: slot.x - 70, y: slot.y + 4, w: 140, h: 28 },
  }));
}

export function boxesIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
