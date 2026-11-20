import assert from 'node:assert/strict';
import { bindApi, loadNamed, MAP_FILES } from './helpers/load-api.js';
import { viewports } from './helpers/match.js';

const map = await loadNamed(MAP_FILES, ['layoutWorldMap'], 'stream C');
const fixtures = viewports();

function number(value, label) {
  if (typeof value !== 'number' || Number.isNaN(value)) throw new Error(`${label} must be a number`);
  return value;
}

function readLayout(raw, viewport) {
  if (!raw || typeof raw !== 'object') throw new Error('layoutWorldMap must return an object');
  const designWidth = number(raw.designWidth ?? raw.canvasWidth ?? raw.width, 'designWidth');
  const designHeight = number(raw.designHeight ?? raw.canvasHeight ?? raw.height, 'designHeight');
  const scale = number(raw.scale ?? raw.uniformScale, 'scale');
  const offsetX = number(raw.offsetX ?? raw.letterboxX ?? 0, 'offsetX');
  const offsetY = number(raw.offsetY ?? raw.letterboxY ?? 0, 'offsetY');
  const anchors = raw.anchors ?? raw.buildings ?? raw.placed;
  if (!Array.isArray(anchors) || anchors.length === 0) throw new Error('layoutWorldMap must return anchors');
  return {
    designWidth,
    designHeight,
    scale,
    scaleX: raw.scaleX,
    scaleY: raw.scaleY,
    offsetX,
    offsetY,
    rotateOverlay: raw.rotateOverlay === true || raw.overlay === 'rotate',
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    anchors: anchors.map((anchor) => ({
      id: anchor.id,
      designX: number(anchor.designX ?? anchor.x, `${anchor.id} designX`),
      designY: number(anchor.designY ?? anchor.y, `${anchor.id} designY`),
      screenX: number(anchor.screenX ?? anchor.sx, `${anchor.id} screenX`),
      screenY: number(anchor.screenY ?? anchor.sy, `${anchor.id} screenY`),
    })),
  };
}

bindApi(map, [
  {
    name: 'OWNER-PLAT-04 world map anchors stay fixed across landscape viewports and portrait shows rotate',
    fn(api) {
      const layouts = [];
      for (const viewport of fixtures.landscape) {
        const raw = api.layoutWorldMap({
          viewportWidth: viewport.width,
          viewportHeight: viewport.height,
          anchors: fixtures.anchors,
        });
        const layout = readLayout(raw, viewport);
        assert.equal(layout.rotateOverlay, false, `${viewport.width}x${viewport.height} is landscape`);
        layouts.push(layout);
      }
      const portrait = readLayout(api.layoutWorldMap({
        viewportWidth: fixtures.portrait.width,
        viewportHeight: fixtures.portrait.height,
        anchors: fixtures.anchors,
      }), fixtures.portrait);
      assert.equal(portrait.rotateOverlay, true);
      layouts.push(portrait);

      const designWidth = layouts[0].designWidth;
      const designHeight = layouts[0].designHeight;
      const baseline = new Map(layouts[0].anchors.map((anchor) => [anchor.id, anchor]));
      for (const layout of layouts) {
        assert.equal(layout.designWidth, designWidth);
        assert.equal(layout.designHeight, designHeight);
        const expectedScale = Math.min(layout.viewportWidth / designWidth, layout.viewportHeight / designHeight);
        assert.ok(Math.abs(layout.scale - expectedScale) < 1e-6);
        if (layout.scaleX != null || layout.scaleY != null) {
          assert.ok(Math.abs(layout.scaleX - layout.scaleY) < 1e-9, 'scale must be uniform');
        }
        const contentWidth = designWidth * layout.scale;
        const contentHeight = designHeight * layout.scale;
        assert.ok(contentWidth <= layout.viewportWidth + 0.51);
        assert.ok(contentHeight <= layout.viewportHeight + 0.51);
        const aspectDiffers = Math.abs((layout.viewportWidth / layout.viewportHeight) - (designWidth / designHeight)) > 0.01;
        if (aspectDiffers) assert.ok(layout.offsetX > 0.5 || layout.offsetY > 0.5);
        for (const anchor of layout.anchors) {
          assert.ok(anchor.designX >= -1 && anchor.designX <= designWidth + 1);
          assert.ok(anchor.designY >= -1 && anchor.designY <= designHeight + 1);
          const screenX = layout.offsetX + anchor.designX * layout.scale;
          const screenY = layout.offsetY + anchor.designY * layout.scale;
          assert.ok(Math.abs(screenX - anchor.screenX) <= 1, `${anchor.id} screenX`);
          assert.ok(Math.abs(screenY - anchor.screenY) <= 1, `${anchor.id} screenY`);
          const expected = baseline.get(anchor.id);
          assert.ok(expected, anchor.id);
          assert.ok(Math.abs(anchor.designX - expected.designX) <= 1);
          assert.ok(Math.abs(anchor.designY - expected.designY) <= 1);
        }
      }
    },
  },
]);
