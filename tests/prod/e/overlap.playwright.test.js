import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const port = 8779;
const root = fileURLToPath(new URL('../../../', import.meta.url));
const chrome = ['/usr/bin/google-chrome', '/usr/bin/chromium'].find((file) => existsSync(file));
const shotDir = fileURLToPath(new URL('./screenshots/after/', import.meta.url));

let chromium = null;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  chromium = null;
}

const canDrive = Boolean(chromium && chrome);
const viewports = [
  [844, 390],
  [667, 375],
  [915, 412],
  [1280, 720],
  [932, 430],
  [1024, 768],
];

let server;

function intersects(a, b) {
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return width > 0.75 && height > 0.75;
}

async function ready() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/web/`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => { setTimeout(resolve, 100); });
    }
  }
  throw new Error('static server did not start');
}

async function boxes(page, selector) {
  return page.locator(selector).evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
  }));
}

function assertClear(items, label) {
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      assert.equal(intersects(items[i], items[j]), false, `${label} ${i} x ${j}`);
    }
  }
}

function assertApart(left, right, label) {
  for (const a of left) {
    for (const b of right) assert.equal(intersects(a, b), false, label);
  }
}

async function settlePaint(page) {
  await page.evaluate(() => document.querySelector('.stage-bg')?.decode?.());
  await page.waitForTimeout(400);
}

test.before(async () => {
  if (!canDrive) return;
  mkdirSync(shotDir, { recursive: true });
  server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
    cwd: root,
    stdio: 'ignore',
  });
  await ready();
});

test.after(() => {
  server?.kill();
});

test('prep and battle paintings do not overlap on the letterboxed stage', { timeout: 120000, skip: !canDrive }, async () => {
  const browser = await chromium.launch({
    executablePath: chrome,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    for (const [width, height] of viewports) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      await page.goto(`http://127.0.0.1:${port}/web/`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__cfcg);
      await page.evaluate(() => window.__cfcg.prep());
      await page.waitForSelector('[data-screen="prep"][data-bp="1"]');
      await page.waitForFunction(() => {
        const bg = document.querySelector('.stage-bg');
        const sprites = [...document.querySelectorAll('.prep-token .sprite')];
        return bg && bg.complete && bg.naturalWidth > 0 && sprites.length === 4 && sprites.every((img) => img.complete && img.naturalWidth > 0);
      });
      const prepText = await page.locator('#stage').innerText();
      assert.match(prepText, /PREP BATTLE/);
      assert.match(prepText, /START BATTLE/);
      assert.equal(prepText.includes('FRONT'), false);
      assert.equal(prepText.includes('SYNC'), false);
      const prepSprites = await boxes(page, '.prep-token .sprite');
      assert.equal(prepSprites.length, 4, `${width}x${height} prep`);
      assertClear(prepSprites, `prep ${width}x${height}`);
      await settlePaint(page);
      await page.screenshot({ path: `${shotDir}/prep-${width}x${height}.png` });

      await page.evaluate(() => window.__cfcg.battle());
      await page.waitForSelector('[data-screen="battle"][data-bp="1"]');
      await page.waitForFunction(() => {
        const bg = document.querySelector('.stage-bg');
        const sprites = [...document.querySelectorAll('.battle .unit .sprite')];
        return bg && bg.complete && bg.naturalWidth > 0 && sprites.length === 8 && sprites.every((img) => img.complete && img.naturalWidth > 0);
      });
      const battleText = await page.locator('#stage').innerText();
      assert.match(battleText, /AUTO/);
      assert.equal(battleText.includes('FRONT'), false);
      const auto = page.locator('button.auto-toggle');
      assert.equal(await auto.isDisabled(), false);
      assert.match(await auto.innerText(), /AUTO/);
      const stage = await page.locator('#stage').boundingBox();
      const design = 1672 / 941;
      assert.ok(Math.abs(stage.width / stage.height - design) < 0.02, `${width}x${height} stage`);
      assert.ok(stage.width <= width + 1 && stage.height <= height + 1);
      const sprites = await boxes(page, '.battle .unit .sprite');
      const cards = await boxes(page, '.hand-card');
      const lead = await boxes(page, '.lead-plate');
      assert.equal(sprites.length, 8, `${width}x${height}`);
      assert.ok(cards.length >= 1, `${width}x${height} cards`);
      assert.ok(sprites.every((box) => box.width > 20 && box.height > 20), `${width}x${height} sprite size`);
      assert.ok(cards.every((box) => box.width > 20 && box.height > 20), `${width}x${height} card size`);
      const playerX = sprites.slice(0, 4).reduce((sum, box) => sum + box.left, 0) / 4;
      const enemyX = sprites.slice(4).reduce((sum, box) => sum + box.left, 0) / 4;
      assert.equal(playerX < enemyX, true, `${width}x${height} mirror`);
      assertClear(sprites, `sprite ${width}x${height}`);
      assertClear(cards, `card ${width}x${height}`);
      assertApart(sprites, cards, `sprite/card ${width}x${height}`);
      assertApart(sprites, lead, `sprite/lead ${width}x${height}`);
      assertApart(cards, await boxes(page, '.pile-btn'), `card/pile ${width}x${height}`);
      assertApart(cards, await boxes(page, '.end-turn, .auto-toggle'), `card/control ${width}x${height}`);
      const gem = await page.locator('.pip.is-on').first().evaluate((node) => getComputedStyle(node).backgroundImage);
      assert.match(gem, /ap-gem-on/);
      await settlePaint(page);
      await page.screenshot({ path: `${shotDir}/battle-${width}x${height}.png` });
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
