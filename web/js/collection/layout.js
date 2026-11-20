/** Fixed 1672×941 boxes. Every control is at least 116 design pixels and inside the stage. */

export const STAGE = Object.freeze({ width: 1672, height: 941 });
export const HIT = 116;

const PAD = 12;
const GAP = 8;

export const HEADER_Y = PAD;
export const NAV_Y = HEADER_Y + HIT + GAP;
export const TOOL_Y = NAV_Y + HIT + GAP;
export const BODY_Y = TOOL_Y + HIT + GAP;
export const BODY_BOTTOM = STAGE.height - PAD;
export const BODY_H = BODY_BOTTOM - BODY_Y;

export const REVIEW_VIEWPORTS = Object.freeze([
  Object.freeze({ width: 844, height: 390 }),
  Object.freeze({ width: 667, height: 375 }),
  Object.freeze({ width: 915, height: 412 }),
  Object.freeze({ width: 1280, height: 720 }),
  Object.freeze({ width: 932, height: 430 }),
  Object.freeze({ width: 1024, height: 768 }),
]);

const TOOL_SPECS = Object.freeze([
  Object.freeze({ id: 'search', w: 420, kind: 'input' }),
  Object.freeze({ id: 'kind', w: 168, kind: 'hit' }),
  Object.freeze({ id: 'sort', w: 136, kind: 'hit' }),
  Object.freeze({ id: 'state', w: 156, kind: 'hit' }),
  Object.freeze({ id: 'rarity:all', w: 116, kind: 'hit' }),
  Object.freeze({ id: 'rarity:N', w: 116, kind: 'hit' }),
  Object.freeze({ id: 'rarity:R', w: 116, kind: 'hit' }),
  Object.freeze({ id: 'rarity:Epic', w: 116, kind: 'hit' }),
  Object.freeze({ id: 'rarity:EX', w: 116, kind: 'hit' }),
  Object.freeze({ id: 'rarity:FAC', w: 116, kind: 'hit' }),
]);

/**
 * @param {boolean} detailOpen
 */
export function gridSpec(detailOpen) {
  if (detailOpen) {
    return {
      cols: 6,
      rows: 3,
      slotW: 170,
      slotH: HIT,
      gap: GAP,
      gridX: PAD,
      gridW: 1100,
      detailX: 1120,
      detailW: 540,
    };
  }
  return {
    cols: 8,
    rows: 3,
    slotW: 190,
    slotH: HIT,
    gap: GAP,
    gridX: PAD,
    gridW: 1648,
    detailX: null,
    detailW: 0,
  };
}

export const BROWSE_PAGE_SLOTS = 8 * 3;
export const BROWSE_PAGE_SLOTS_DETAIL = 6 * 3;
export const DECK_PAGE = 8;

function box(id, x, y, w, h, kind) {
  return { id, x, y, w, h, kind };
}

function placeRow(y, specs) {
  let x = PAD;
  const boxes = [];
  for (let i = 0; i < specs.length; i += 1) {
    const spec = specs[i];
    boxes.push(box(spec.id, x, y, spec.w, HIT, spec.kind));
    x += spec.w + GAP;
  }
  return boxes;
}

function headerBoxes() {
  return [
    box('back', PAD, HEADER_Y, 168, HIT, 'hit'),
    box('title', 188, HEADER_Y, 860, HIT, 'text'),
    box('capacity', 1056, HEADER_Y, 604, HIT, 'text'),
  ];
}

function navBoxes() {
  const w = 406;
  return [0, 1, 2, 3].map((index) => box(
    `nav:${index}`,
    PAD + index * (w + GAP),
    NAV_Y,
    w,
    HIT,
    'hit',
  ));
}

/**
 * @param {string} prefix
 * @param {number} y
 */
export function deckBand(prefix, y) {
  const prev = box(`${prefix}-prev`, PAD, y, 140, HIT, 'hit');
  const slots = [];
  let x = 160;
  for (let i = 0; i < DECK_PAGE; i += 1) {
    slots.push(box(`${prefix}-slot-${i}`, x, y, 162, HIT, 'hit'));
    x += 170;
  }
  const next = box(`${prefix}-next`, 1520, y, 140, HIT, 'hit');
  return { prev, slots, next };
}

function browseBoxes(detailOpen) {
  const spec = gridSpec(detailOpen);
  const boxes = [];
  for (let row = 0; row < spec.rows; row += 1) {
    for (let col = 0; col < spec.cols; col += 1) {
      boxes.push(box(
        `slot-${row}-${col}`,
        spec.gridX + col * (spec.slotW + spec.gap),
        BODY_Y + row * (spec.slotH + spec.gap),
        spec.slotW,
        spec.slotH,
        'hit',
      ));
    }
  }
  const pagerY = BODY_Y + spec.rows * (spec.slotH + spec.gap) - spec.gap + GAP;
  const prev = box('page-prev', spec.gridX, pagerY, 168, HIT, 'hit');
  const next = box('page-next', spec.gridX + spec.gridW - 168, pagerY, 168, HIT, 'hit');
  const label = box('page-label', prev.x + prev.w + GAP, pagerY, next.x - (prev.x + prev.w + GAP * 2), HIT, 'text');
  boxes.push(prev, label, next);
  if (detailOpen) {
    const x = spec.detailX;
    const y = BODY_Y;
    boxes.push(box('detail-name', x + 136, y + 12, 392, HIT, 'hit'));
    boxes.push(box('detail-meta', x + 12, y + 136, 516, 180, 'text'));
    const actionY = y + BODY_H - PAD - HIT;
    boxes.push(box('act-lock', x + 12, actionY, 164, HIT, 'hit'));
    boxes.push(box('act-fav', x + 184, actionY, 164, HIT, 'hit'));
    boxes.push(box('act-deck', x + 356, actionY, 172, HIT, 'hit'));
  }
  return boxes;
}

function deckBoxes() {
  const boxes = [];
  boxes.push(box('deck-label', PAD, BODY_Y, 1648, 28, 'text'));
  const deck = deckBand('deck', 416);
  boxes.push(deck.prev, ...deck.slots, deck.next);
  boxes.push(box('shelf-label', PAD, 540, 1648, 28, 'text'));
  const shelf = deckBand('shelf', 572);
  boxes.push(shelf.prev, ...shelf.slots, shelf.next);
  boxes.push(box('deck-note', PAD, 704, 1648, 90, 'text'));
  const actionY = 805;
  let x = PAD;
  for (const spec of [
    { id: 'act-lock', w: 200 },
    { id: 'act-fav', w: 200 },
    { id: 'act-deck', w: 240 },
    { id: 'act-detail', w: 240 },
  ]) {
    boxes.push(box(spec.id, x, actionY, spec.w, HIT, 'hit'));
    x += spec.w + GAP;
  }
  return boxes;
}

function detailBoxes(hasEntry) {
  const boxes = [];
  boxes.push(box('detail-meta', 348, 276, 1312, 500, 'text'));
  if (hasEntry) boxes.push(box('detail-card', 24, 276, 300, 420, 'hit'));
  let x = 348;
  const y = 813;
  for (const spec of [
    { id: 'act-lock', w: 220 },
    { id: 'act-fav', w: 220 },
    { id: 'act-deck', w: 240 },
    { id: 'act-list', w: 240 },
  ]) {
    boxes.push(box(spec.id, x, y, spec.w, HIT, 'hit'));
    x += spec.w + GAP;
  }
  return boxes;
}

/**
 * @param {{ route: string, detailOpen?: boolean, hasEntry?: boolean }} options
 */
export function layoutBoxes(options) {
  const route = options.route;
  const detailOpen = options.detailOpen === true && route !== 'deck' && route !== 'detail';
  const boxes = [...headerBoxes(), ...navBoxes()];
  if (route !== 'detail') boxes.push(...placeRow(TOOL_Y, TOOL_SPECS));
  if (route === 'deck') boxes.push(...deckBoxes());
  else if (route === 'detail') boxes.push(...detailBoxes(options.hasEntry !== false));
  else boxes.push(...browseBoxes(detailOpen));
  return boxes;
}

function overlaps(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/**
 * @param {{ id: string, x: number, y: number, w: number, h: number, kind: string }[]} boxes
 */
export function layoutIssues(boxes) {
  const issues = [];
  for (const item of boxes) {
    if (item.x < 0 || item.y < 0 || item.x + item.w > STAGE.width + 0.01 || item.y + item.h > STAGE.height + 0.01) {
      issues.push(`outside ${item.id} (${item.x},${item.y} ${item.w}x${item.h})`);
    }
    if (item.kind !== 'text' && (item.w < HIT || item.h < HIT)) {
      issues.push(`small ${item.id} ${item.w}x${item.h}`);
    }
  }
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      if (overlaps(boxes[i], boxes[j])) issues.push(`overlap ${boxes[i].id} ${boxes[j].id}`);
    }
  }
  return issues;
}
