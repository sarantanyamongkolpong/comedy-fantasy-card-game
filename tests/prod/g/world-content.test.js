import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { MALL_ROWS, repoRootFrom } from '../../../tools/content/world/canon.js';
import { renderPreview } from '../../../tools/content/world/preview.js';
import { economyLeak, loadWorldPack, summarize, validateWorldPack } from '../../../tools/content/world/validate.js';

const root = repoRootFrom();

function pack() {
  return loadWorldPack(root);
}

test('world pack matches the schema, canon ids, and empty economy', () => {
  const world = pack();
  assert.deepEqual(validateWorldPack(world), []);
  assert.deepEqual(summarize(world), {
    npcs: 6,
    shopkeepers: 2,
    offers: 15,
    sideEvents: 6,
    tutorials: 10,
    chapters: 2,
    stages: 4,
    facilities: 3,
    lockedNodes: 1,
    openQuestions: 13,
  });
  assert.equal(world.catalog.reviewStatus, 'GENERATED_REVIEW');
  assert.equal(world.catalog.designStatus, 'PROPOSED');
  assert.equal(world.catalog.mainQuest, false);
  assert.equal(world.catalog.wiredToClient, false);
});

test('mall offer labels still match the mall screen source', () => {
  const mall = readFileSync(path.join(root, 'web/js/screens/mall.js'), 'utf8');
  for (const [label, id] of MALL_ROWS) {
    assert.ok(mall.includes(`['${label}', '${id}.`), `${label} ${id}`);
  }
});

test('economy prose allows locked AP wording and rejects amounts', () => {
  assert.equal(economyLeak('Optional toss costs 1 AP.'), null);
  assert.equal(economyLeak('Exactly 30 action cards. Not 29. Not 31.'), null);
  assert.equal(economyLeak('You begin a turn at 5 AP.'), null);
  assert.ok(economyLeak('The pin costs 40 G.'));
  assert.ok(economyLeak('price 12'));
  assert.ok(economyLeak('unlock cost 3'));
});

test('every cited amount in the pack is null and pending', () => {
  const world = pack();
  const offers = world.shopkeepers.flatMap((shop) => shop.offers);
  for (const offer of offers) {
    assert.equal(offer.G, null);
    assert.equal(offer.price, null);
    assert.equal(offer.unlockCost, null);
    assert.equal(offer.amount, null);
    assert.equal(offer.priceStatus, 'PENDING_OWNER');
    assert.equal(offer.checkoutEnabled, undefined);
  }
  for (const shop of world.shopkeepers) assert.equal(shop.checkoutEnabled, false);
  for (const event of world.sideEvents) {
    assert.equal(event.mainQuest, false);
    assert.equal(event.questId, null);
    assert.equal(event.reward.G, null);
    assert.equal(event.reward.status, 'PENDING_OWNER');
  }
  for (const chapter of world.progression.chapters) {
    for (const stage of chapter.stages) {
      assert.equal(stage.rosterWiredToWebBattle, false);
      assert.equal(stage.gatesCoreLoop, false);
      assert.equal(stage.mainQuest, false);
      assert.equal(stage.reward.G, null);
      assert.equal(stage.enforcedByClient, false);
    }
  }
  assert.equal(world.progression.lockedNodes[0].systemsLive, false);
  assert.equal(world.progression.lockedNodes[0].includedInUnlockChain, false);
  for (const facility of world.progression.facilities) {
    assert.equal(facility.availableFromStart, true);
    assert.equal(facility.unlockCost, null);
  }
});

test('the web client does not import the world pack', () => {
  const roots = ['web', 'src'].map((name) => path.join(root, name));
  const hits = [];
  for (const dir of roots) {
    for (const file of jsFiles(dir)) {
      const text = readFileSync(file, 'utf8');
      if (text.includes('content/prod/world')) hits.push(path.relative(root, file));
    }
  }
  const index = readFileSync(path.join(root, 'web/index.html'), 'utf8');
  if (index.includes('content/prod/world')) hits.push('web/index.html');
  assert.deepEqual(hits, []);
});

test('read-only preview lists every record and has no script', () => {
  const world = pack();
  const html = renderPreview(world);
  const committed = readFileSync(path.join(root, 'tools/content/world/preview.html'), 'utf8');
  assert.equal(html, committed);
  assert.equal(/<script/i.test(html), false);
  assert.equal(html.includes('PENDING_OWNER'), true);
  assert.equal(html.includes('GENERATED_REVIEW'), true);
  assert.equal(/\b\d+\s*G\b/.test(html), false);
  assert.equal(html.includes('costs 40'), false);
  for (const npc of world.npcs) assert.equal(html.includes(npc.id), true);
  for (const event of world.sideEvents) assert.equal(html.includes(event.id), true);
  for (const chapter of world.progression.chapters) {
    for (const stage of chapter.stages) assert.equal(html.includes(stage.id), true);
  }
});

test('validator cli exits 0', () => {
  const result = spawnSync(process.execPath, ['tools/content/world/validate.js'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.includes('"ok": true'), true);
});

function jsFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...jsFiles(full));
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.html')) found.push(full);
  }
  return found;
}
