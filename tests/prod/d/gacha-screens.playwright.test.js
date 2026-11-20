/**
 * Booth screenshots. Chrome drives the source app over a local static server.
 * Viewports: the four production sizes plus 932×430 and 1024×768.
 */

import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBannerState, integerSeed, pull, testBanner } from '../../../src/gacha/index.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const shots = join(root, 'tests/prod/d/screenshots');
const chrome = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((file) => existsSync(file));
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

const VIEWPORTS = [
  [844, 390],
  [667, 375],
  [915, 412],
  [1280, 720],
  [932, 430],
  [1024, 768],
];

let chromium = null;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  chromium = null;
}

function epicSeq() {
  const banner = testBanner({
    bannerId: 'TEST_BANNER_AVATAR',
    pool: 'avatar',
    entries: [
      { id: 'TEST_POOL_N', rarity: 'N', weight: 100 },
      { id: 'TEST_POOL_EPIC', rarity: 'Epic', weight: 0 },
      { id: 'TEST_POOL_EX', rarity: 'EX', weight: 0 },
    ],
  });
  for (let seq = 1; seq < 80; seq += 1) {
    const state = createBannerState(banner, { epicCounter: 99, topCounter: 10 });
    const seed = integerSeed(['gacha', 'TEST_BANNER_AVATAR', seq, 1].join(':'));
    const result = pull(state, { seed, count: 1 });
    if (result.pulls[0].rarity === 'Epic') return seq;
  }
  throw new Error('No TEST seed produced an Epic pity card');
}

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const file = normalize(join(root, rel));
      if (!file.startsWith(normalize(root))) {
        res.writeHead(403);
        res.end();
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('missing');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, origin: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function fit(page) {
  return page.evaluate(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const root = document.documentElement;
    const broken = [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0 && img.getAttribute('src'))
      .map((img) => img.dataset.assetId || img.className || 'img');
    const outside = [];
    for (const node of document.querySelectorAll('button, h1')) {
      const rect = node.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      const style = getComputedStyle(node);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      const visibleW = Math.min(rect.right, width) - Math.max(rect.left, 0);
      const visibleH = Math.min(rect.bottom, height) - Math.max(rect.top, 0);
      const label = (node.innerText || node.textContent || '').trim().slice(0, 48);
      const minimum = node.tagName === 'BUTTON' ? 44 : 1;
      if (visibleW < minimum || visibleH < minimum) outside.push(label);
    }
    return {
      overflow: root.scrollWidth > width + 1 || root.scrollHeight > height + 1,
      broken,
      outside,
    };
  });
}

async function openBooth(page, origin) {
  await page.goto(`${origin}/web/index.html`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'The Hideout' }).waitFor();
  await page.getByRole('button', { name: 'Gachapon', exact: true }).click();
  await page.getByRole('heading', { name: 'Gachapon' }).waitFor();
  await page.locator('.gfx-gacha').waitFor();
  await page.waitForFunction(() => {
    const images = [...document.querySelectorAll('.gfx-gacha img, .scene-bg')];
    return images.length > 0 && images.every((img) => img.complete && img.naturalWidth > 0);
  });
}

async function shot(page, name) {
  await page.screenshot({ path: join(shots, name) });
}

if (!chromium || !chrome) {
  test.todo('gacha screenshots — Playwright or Chrome is not installed');
} else {
  const sequence = epicSeq();
  let server;
  let origin;

  test.before(async () => {
    await mkdir(shots, { recursive: true });
    ({ server, origin } = await startServer());
  });

  test.after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  for (const [width, height] of VIEWPORTS) {
    test(`gacha booth ${width}x${height}`, { timeout: 120000 }, async () => {
      const errors = [];
      const browser = await chromium.launch({
        executablePath: chrome,
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      });
      const page = await browser.newPage({ viewport: { width, height } });
      page.setDefaultTimeout(20000);
      page.on('pageerror', (error) => errors.push(error.message));
      try {
        await openBooth(page, origin);
        assert.equal(await page.locator('[data-g-balance]').getAttribute('data-g-balance'), '0');
        assert.equal(await page.locator('[data-banner-id="TEST_BANNER_AVATAR"] [data-pity="epic"]').getAttribute('data-max'), '100');
        assert.equal(await page.locator('[data-banner-id="TEST_BANNER_AVATAR"] [data-pity="top"]').getAttribute('data-max'), '200');
        assert.equal(await page.locator('[data-banner-id="TEST_BANNER_COMPANION"] [data-pity="top"]').getAttribute('data-value'), 'none');
        await page.evaluate(() => window.__cfcg.setGachaBalance(12));
        await page.locator('[data-g-balance="12"]').waitFor();
        const booth = await fit(page);
        assert.deepEqual(booth.broken, [], 'broken image');
        assert.deepEqual(booth.outside, [], 'control outside the viewport');
        assert.equal(booth.overflow, false);
        await shot(page, `booth-${width}x${height}.png`);

        await page.evaluate(() => window.__cfcg.setRevealStepMs(30000));
        await page.getByRole('button', { name: 'Pull 10', exact: true }).first().click();
        await page.locator('.gfx-reveal[data-rarity="N"]').waitFor();
        await page.locator('.gfx-card.is-flipped').waitFor();
        await page.waitForTimeout(700);
        await shot(page, `reveal-n-${width}x${height}.png`);
        await page.getByRole('button', { name: 'Skip', exact: true }).click();
        await page.locator('.gfx-reveal').waitFor({ state: 'detached' });
        await page.getByRole('heading', { name: 'Latest TEST pull' }).waitFor();
        assert.equal(await page.locator('[data-duplicate="true"]').count(), 9);
        assert.equal(await page.locator('[data-duplicate="false"]').count(), 1);
        assert.equal(await page.locator('[data-g-balance]').getAttribute('data-g-balance'), '12');
        assert.equal(await page.locator('[data-g-charge]').getAttribute('data-g-charge'), '0');
        assert.equal(await page.locator('[data-banner-id="TEST_BANNER_AVATAR"] [data-pity="epic"]').getAttribute('data-value'), '10');
        const summary = await fit(page);
        assert.deepEqual(summary.outside, [], 'control outside after the summary');
        assert.equal(summary.overflow, false);
        await shot(page, `summary-x10-${width}x${height}.png`);
        assert.deepEqual(errors, []);
      } finally {
        await browser.close();
      }
    });
  }

  test('epic, EX edge mask, and FAC reveals', { timeout: 120000 }, async () => {
    const errors = [];
    const browser = await chromium.launch({
      executablePath: chrome,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.setDefaultTimeout(20000);
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await openBooth(page, origin);
      await page.evaluate((seq) => {
        window.__cfcg.setRevealStepMs(30000);
        window.__cfcg.setGachaBalance(12);
        window.__cfcg.primeGachaPity('TEST_BANNER_AVATAR', { epicCounter: 99, topCounter: 10 });
        window.__cfcg.setGachaSeq(seq);
      }, sequence);
      await page.locator('[data-banner-id="TEST_BANNER_AVATAR"] [data-pity="epic"][data-value="99"]').waitFor();
      await page.locator('[data-banner-id="TEST_BANNER_AVATAR"]').getByRole('button', { name: 'Pull 1', exact: true }).click();
      const epic = page.locator('.gfx-reveal');
      await epic.waitFor();
      assert.equal(await epic.getAttribute('data-rarity'), 'Epic');
      await page.waitForTimeout(700);
      await shot(page, 'reveal-epic-1280x720.png');
      await page.getByRole('button', { name: 'Skip', exact: true }).click();

      await page.evaluate(() => {
        window.__cfcg.primeGachaPity('TEST_BANNER_AVATAR', { epicCounter: 0, topCounter: 199 });
      });
      await page.locator('[data-banner-id="TEST_BANNER_AVATAR"]').getByRole('button', { name: 'Pull 1', exact: true }).click();
      const ex = page.locator('.gfx-reveal[data-rarity="EX"]');
      await ex.waitFor();
      const mask = await ex.locator('.gfx-plate').evaluate((img) => ({
        id: img.dataset.edgeMask || '',
        image: img.style.maskImage || '',
      }));
      assert.equal(mask.id, 'GFX_EDGE_MASK_EX');
      assert.match(mask.image, /edge_mask_ex/);
      await page.waitForTimeout(700);
      await shot(page, 'reveal-ex-1280x720.png');
      await page.getByRole('button', { name: 'Skip', exact: true }).click();

      await page.evaluate(() => {
        window.__cfcg.primeGachaPity('TEST_BANNER_ACTION', { epicCounter: 0, topCounter: 199 });
      });
      await page.locator('[data-banner-id="TEST_BANNER_ACTION"]').getByRole('button', { name: 'Pull 1', exact: true }).click();
      await page.locator('.gfx-reveal[data-rarity="FAC"]').waitFor();
      await page.waitForTimeout(700);
      await shot(page, 'reveal-fac-1280x720.png');
      await page.getByRole('button', { name: 'Skip', exact: true }).click();
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  });

  test('reduced motion skips the reveal sequence', { timeout: 90000 }, async () => {
    const browser = await chromium.launch({
      executablePath: chrome,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.setDefaultTimeout(20000);
    try {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openBooth(page, origin);
      assert.equal(await page.locator('.gfx-gacha').getAttribute('data-motion'), 'reduced');
      await page.getByRole('button', { name: 'Pull 1', exact: true }).first().click();
      await page.getByRole('heading', { name: 'Latest TEST pull' }).waitFor();
      assert.equal(await page.locator('.gfx-reveal').count(), 0);
      await shot(page, 'reduced-1280x720.png');
      const narrow = await browser.newPage({ viewport: { width: 667, height: 375 } });
      await narrow.emulateMedia({ reducedMotion: 'reduce' });
      await openBooth(narrow, origin);
      await narrow.getByRole('button', { name: 'Pull 1', exact: true }).first().click();
      await narrow.getByRole('heading', { name: 'Latest TEST pull' }).waitFor();
      assert.equal(await narrow.locator('.gfx-reveal').count(), 0);
      const report = await fit(narrow);
      assert.deepEqual(report.outside, []);
      await shot(narrow, 'reduced-667x375.png');
      await narrow.close();
    } finally {
      await browser.close();
    }
  });
}
