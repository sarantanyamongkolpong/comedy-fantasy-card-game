/**
 * Battle composition on the 1672×941 stage.
 * Feet come from the measured centres of the baked floor tiles
 * (manifest.battleTiles). Four of the ten tiles per side, so the
 * bodies do not share a column. Tiles are visual anchors only.
 */

const IMAGE = { width: 1280, height: 720 };
const STAGE = { width: 1672, height: 941 };

const PLAYER_FEET = [
  { id: 'p0', row: 'back', column: 0, imageX: 172, imageY: 336 },
  { id: 'p1', row: 'back', column: 4, imageX: 550, imageY: 336 },
  { id: 'p2', row: 'front', column: 2, imageX: 312, imageY: 456 },
  { id: 'p3', row: 'front', column: 3, imageX: 425, imageY: 456 },
];

const ENEMY_FEET = [
  { id: 'e0', row: 'back', column: 4, imageX: 1108, imageY: 336 },
  { id: 'e1', row: 'back', column: 0, imageX: 730, imageY: 336 },
  { id: 'e2', row: 'front', column: 2, imageX: 968, imageY: 456 },
  { id: 'e3', row: 'front', column: 1, imageX: 855, imageY: 456 },
];

function stagePoint(imageX, imageY) {
  return {
    x: Math.round(imageX * STAGE.width / IMAGE.width),
    y: Math.round(imageY * STAGE.height / IMAGE.height),
  };
}

export function battleBands(design = { width: 1672, height: 941 }) {
  const top = { x: 0, y: 0, w: design.width, h: 88 };
  const arena = { x: 0, y: 88, w: design.width, h: 530 };
  const piles = { x: 12, y: 626, w: 380, h: 128 };
  const hand = { x: 404, y: 626, w: 680, h: 308 };
  const controls = { x: 1096, y: 626, w: 560, h: 300 };
  const lead = { x: 900, y: 96, w: 740, h: 140 };
  return { top, arena, piles, hand, controls, lead };
}

/** Feet anchors. The box is the hit target; the sprite draws taller than the box. */
export function battleSlots() {
  const footprint = { w: 116, h: 210 };
  const bar = 22;
  return [...PLAYER_FEET, ...ENEMY_FEET].map((feet) => {
    const point = stagePoint(feet.imageX, feet.imageY);
    return {
      id: feet.id,
      side: feet.id.startsWith('p') ? 'player' : 'enemy',
      row: feet.row,
      column: feet.column,
      imageX: feet.imageX,
      imageY: feet.imageY,
      x: point.x,
      y: point.y,
      box: {
        x: point.x - footprint.w / 2,
        y: point.y - (footprint.h - bar),
        w: footprint.w,
        h: footprint.h,
      },
    };
  });
}

export function boxesIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
