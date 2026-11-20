import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { stageLayout, MIN_HIT_CSS_PX, MIN_HIT_DESIGN_PX } from '../../../web/js/stage.js';
import {
  HIT,
  REVIEW_VIEWPORTS,
  STAGE,
  layoutBoxes,
  layoutIssues,
} from '../../../web/js/collection/layout.js';
import { collectionRoute, screenTitle } from '../../../web/js/collection/route.js';

const routes = ['stash', 'inventory', 'collection', 'deck', 'detail'];

test('collection controls stay inside the 1672×941 stage at the 116px hit size', () => {
  assert.equal(HIT, MIN_HIT_DESIGN_PX);
  assert.equal(STAGE.width, 1672);
  assert.equal(STAGE.height, 941);
  for (const route of routes) {
    for (const detailOpen of [false, true]) {
      if ((route === 'deck' || route === 'detail') && detailOpen) continue;
      for (const hasEntry of [false, true]) {
        const boxes = layoutBoxes({ route, detailOpen, hasEntry });
        const issues = layoutIssues(boxes);
        assert.deepEqual(issues, [], `${route} detail=${detailOpen} entry=${hasEntry}: ${issues.join('; ')}`);
        assert.ok(boxes.some((box) => box.id === 'back'));
        assert.ok(boxes.some((box) => box.id === 'capacity'));
      }
    }
  }
});

test('116 design pixels stay at least 44 CSS pixels on the review viewports', () => {
  for (const viewport of REVIEW_VIEWPORTS) {
    const layout = stageLayout(viewport);
    const css = HIT * layout.scale;
    assert.ok(css + 1e-9 >= MIN_HIT_CSS_PX, `${viewport.width}x${viewport.height} hit is ${css}`);
  }
});

test('party deck tab routes into the collection deck builder', () => {
  assert.equal(collectionRoute('stash', 'team'), 'stash');
  assert.equal(collectionRoute('inventory', 'team'), 'inventory');
  assert.equal(collectionRoute('collection', 'team'), 'collection');
  assert.equal(collectionRoute('deck', 'team'), 'deck');
  assert.equal(collectionRoute('detail', 'team'), 'detail');
  assert.equal(collectionRoute('party', 'deck'), 'deck');
  assert.equal(collectionRoute('party', 'team'), null);
  assert.equal(collectionRoute('home', 'team'), null);
  assert.equal(screenTitle('stash', false), 'The Stash');
  assert.equal(screenTitle('deck', true), 'Team & Deck');
  assert.equal(screenTitle('deck', false), 'Deck Builder');
  assert.equal(screenTitle('detail', false), 'Card Detail');
});

test('shared files only carry the collection hook', () => {
  const app = readFileSync(new URL('../../../web/js/app.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../../../web/index.html', import.meta.url), 'utf8');
  const builder = readFileSync(new URL('../../../web/tools/build-single-html', import.meta.url), 'utf8');
  assert.match(app, /HOOK prod\/c-inventory/);
  assert.match(app, /collectionRoute/);
  assert.match(html, /css\/collection\.css/);
  assert.match(builder, /HOOK prod\/c-inventory/);
  assert.match(builder, /collection\.css/);
});
