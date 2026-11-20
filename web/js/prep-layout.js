/**
 * Prep Battle composition on the 1672×941 stage.
 * The team stands on the left. Tiles are a preview, not a front/back formation.
 */

export function prepBands(design = { width: 1672, height: 941 }) {
  return {
    title: { x: 16, y: 16, w: 460, h: 100 },
    location: { x: 500, y: 20, w: 660, h: 92 },
    team: { x: 16, y: 132, w: 440, h: 664 },
    arena: { x: 472, y: 132, w: 700, h: 664 },
    deck: { x: 1188, y: 132, w: 468, h: 360 },
    detail: { x: 1188, y: 508, w: 468, h: 288 },
    back: { x: 16, y: 816, w: 320, h: 112 },
    start: { x: 500, y: 812, w: 660, h: 116 },
    width: design.width,
    height: design.height,
  };
}

export function prepPlayerSlots() {
  const arena = prepBands().arena;
  const centers = [
    { id: 'p0', x: arena.x + 190, y: arena.y + 250 },
    { id: 'p1', x: arena.x + 430, y: arena.y + 240 },
    { id: 'p2', x: arena.x + 170, y: arena.y + 520 },
    { id: 'p3', x: arena.x + 470, y: arena.y + 530 },
  ];
  const w = 150;
  const h = 180;
  return centers.map((center) => ({
    ...center,
    box: { x: center.x - w / 2, y: center.y - h, w, h },
  }));
}

export function boxesIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
