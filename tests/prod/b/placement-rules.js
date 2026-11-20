/** Placement checks shared by the hideout preview and tests/prod/b. No economy. */

export function boxesOverlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function insideStage(box, stage) {
  return box.w > 0
    && box.h > 0
    && box.x >= 0
    && box.y >= 0
    && box.x + box.w <= stage.width
    && box.y + box.h <= stage.height;
}

export function expectedFootprint(box, cell) {
  return {
    cols: Math.ceil(box.w / cell),
    rows: Math.ceil(box.h / cell),
  };
}

/**
 * A replacement only checks category and footprint.
 * It does not copy capacity, price, or slot grants.
 */
export function canPlace(anchor, object) {
  if (!anchor || !object) return { ok: false, reason: 'missing' };
  if (!anchor.accepts.includes(object.category)) return { ok: false, reason: 'category' };
  if (object.footprint.cols > anchor.footprint.cols || object.footprint.rows > anchor.footprint.rows) {
    return { ok: false, reason: 'footprint' };
  }
  return { ok: true, reason: 'fit' };
}

export function replacePreview(layout, anchorId, object, anchors) {
  const anchor = anchors.find((row) => row.id === anchorId);
  const decision = canPlace(anchor, object);
  if (!decision.ok) {
    return { layout, decision, installed: false, grantsCapacity: false };
  }
  return {
    layout: { ...layout, [anchorId]: object.manifestAssetId },
    decision,
    installed: false,
    grantsCapacity: false,
  };
}
