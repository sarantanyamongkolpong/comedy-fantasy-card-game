/**
 * Fixed design canvas for every screen (OWNER-PLAT-04).
 * The stage is always DESIGN.width × DESIGN.height. The viewport scales it
 * uniformly by min(innerWidth / W, innerHeight / H) and letterboxes the rest.
 * Canvas coordinates never change when the window changes size.
 */

export const DESIGN_WIDTH = 1672;
export const DESIGN_HEIGHT = 941;

export const DESIGN = Object.freeze({
  width: DESIGN_WIDTH,
  height: DESIGN_HEIGHT,
  id: '1280x720',
});

/** CSS pixels. At 640×360 the 1672×941 stage scale is 360/941, so 116 design px stays at least 44 CSS px. */
export const MIN_HIT_DESIGN_PX = 116;
export const MIN_HIT_CSS_PX = 44;

/**
 * @param {{ width: number, height: number }} viewport
 * @param {{ top?: number, right?: number, bottom?: number, left?: number }} [safeArea]
 * @param {{ width: number, height: number }} [design]
 */
export function stageLayout(viewport, safeArea = {}, design = DESIGN) {
  const top = safeArea.top ?? 0;
  const right = safeArea.right ?? 0;
  const bottom = safeArea.bottom ?? 0;
  const left = safeArea.left ?? 0;
  const innerW = viewport.width - left - right;
  const innerH = viewport.height - top - bottom;
  const scale = Math.min(innerW / design.width, innerH / design.height);
  const stageW = design.width * scale;
  const stageH = design.height * scale;
  const offsetX = left + (innerW - stageW) / 2;
  const offsetY = top + (innerH - stageH) / 2;
  return {
    scale,
    offsetX,
    offsetY,
    stageW,
    stageH,
    designWidth: design.width,
    designHeight: design.height,
    innerW,
    innerH,
    safeArea: { top, right, bottom, left },
  };
}

/**
 * @param {number} x canvas x
 * @param {number} y canvas y
 * @param {ReturnType<typeof stageLayout>} layout
 */
export function canvasToViewport(x, y, layout) {
  return {
    x: layout.offsetX + x * layout.scale,
    y: layout.offsetY + y * layout.scale,
  };
}

/**
 * @param {number} x viewport x
 * @param {number} y viewport y
 * @param {ReturnType<typeof stageLayout>} layout
 */
export function viewportToCanvas(x, y, layout) {
  return {
    x: (x - layout.offsetX) / layout.scale,
    y: (y - layout.offsetY) / layout.scale,
  };
}

/**
 * @param {{ width: number, height: number }} viewport
 */
export function isPortrait(viewport) {
  return viewport.height > viewport.width;
}

/**
 * @param {ReturnType<typeof stageLayout>} layout
 */
export function barKind(layout) {
  const x = layout.offsetX - layout.safeArea.left;
  const y = layout.offsetY - layout.safeArea.top;
  return {
    pillarbox: x > 0.5,
    letterbox: y > 0.5,
  };
}
