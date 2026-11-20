import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildingHotspots, designSize, rectInsideCanvas, uiAnchors } from '../../web/js/map-layout.js';
import { DESIGN, barKind, canvasToViewport, isPortrait, stageLayout, viewportToCanvas, MIN_HIT_CSS_PX, MIN_HIT_DESIGN_PX } from '../../web/js/stage.js';

const manifest = JSON.parse(readFileSync(new URL('../../web/assets-manifest.json', import.meta.url), 'utf8'));

const LANDSCAPES = [
  [640, 360],
  [812, 375],
  [844, 390],
  [915, 412],
  [1024, 768],
  [1280, 720],
  [1920, 1080],
];

test('the published design canvas is the 1672×941 map master', () => {
  const design = designSize(manifest);
  assert.equal(design.width, 1672);
  assert.equal(design.height, 941);
  assert.equal(DESIGN.width, design.width);
  assert.equal(DESIGN.height, design.height);
});

test('proposed building anchors stay inside the master canvas', () => {
  const canvas = designSize(manifest);
  const hotspots = buildingHotspots(manifest);
  assert.equal(hotspots.length, 6);
  const overflow = [];
  for (const hotspot of hotspots) {
    assert.equal(hotspot.anchorMode, 'bottom-center');
    assert.equal(hotspot.transform, 'translate(-50%, -100%)');
    assert.equal(hotspot.placementStatus, 'PROPOSED');
    assert.equal(hotspot.anchorX >= 0 && hotspot.anchorX <= canvas.width, true, hotspot.id);
    assert.equal(hotspot.anchorY >= 0 && hotspot.anchorY <= canvas.height, true, hotspot.id);
    if (!rectInsideCanvas(hotspot, canvas)) overflow.push(hotspot.id);
  }
  for (const anchor of uiAnchors(manifest)) {
    assert.equal(rectInsideCanvas(anchor, canvas), true, anchor.id);
  }
  assert.deepEqual(overflow, ['mall']);
});

test('canvas positions are invariant across landscape viewports', () => {
  const design = designSize(manifest);
  const hotspots = buildingHotspots(manifest);
  const relatives = new Map();
  for (const [width, height] of LANDSCAPES) {
    const layout = stageLayout({ width, height }, {}, design);
    assert.ok(layout.scale > 0);
    assert.ok(Math.abs(layout.stageW / layout.stageH - design.width / design.height) < 1e-9);
    const bars = barKind(layout);
    const viewportAspect = width / height;
    const designAspect = design.width / design.height;
    if (Math.abs(viewportAspect - designAspect) > 0.02) {
      assert.equal(bars.letterbox || bars.pillarbox, true, `${width}x${height} should letterbox or pillarbox`);
    } else {
      assert.ok(layout.offsetX < width * 0.02 && layout.offsetY < height * 0.02);
    }
    assert.ok(MIN_HIT_DESIGN_PX * layout.scale + 1e-6 >= MIN_HIT_CSS_PX, `${width}x${height} scale ${layout.scale}`);
    for (const hotspot of hotspots) {
      const view = canvasToViewport(hotspot.anchorX, hotspot.anchorY, layout);
      const back = viewportToCanvas(view.x, view.y, layout);
      assert.ok(Math.abs(back.x - hotspot.anchorX) < 1e-6);
      assert.ok(Math.abs(back.y - hotspot.anchorY) < 1e-6);
      const relativeX = (view.x - layout.offsetX) / layout.stageW;
      const relativeY = (view.y - layout.offsetY) / layout.stageH;
      const key = hotspot.id;
      if (!relatives.has(key)) relatives.set(key, { relativeX, relativeY });
      else {
        const first = relatives.get(key);
        assert.ok(Math.abs(first.relativeX - relativeX) < 1e-9);
        assert.ok(Math.abs(first.relativeY - relativeY) < 1e-9);
      }
      assert.ok(view.x >= layout.offsetX - 1e-6);
      assert.ok(view.y >= layout.offsetY - 1e-6);
      assert.ok(view.x <= layout.offsetX + layout.stageW + 1e-6);
      assert.ok(view.y <= layout.offsetY + layout.stageH + 1e-6);
    }
  }
});

test('safe-area insets shrink the stage and keep anchors inside the safe box', () => {
  const design = designSize(manifest);
  const layout = stageLayout({ width: 844, height: 390 }, { top: 0, right: 24, bottom: 0, left: 20 }, design);
  assert.ok(layout.offsetX >= 20);
  assert.ok(layout.offsetX + layout.stageW <= 844 - 24 + 1e-6);
  const hotspot = buildingHotspots(manifest)[0];
  const view = canvasToViewport(hotspot.x, hotspot.y, layout);
  assert.ok(view.x >= layout.offsetX - 1e-6);
  assert.ok(view.x <= layout.offsetX + layout.stageW + 1e-6);
});

test('portrait viewports ask for the rotate overlay', () => {
  assert.equal(isPortrait({ width: 390, height: 844 }), true);
  assert.equal(isPortrait({ width: 844, height: 390 }), false);
});
