/**
 * Quick C+D+E integration check at 844×390 and 1280×720.
 * Confirms home, stash, gacha (x1 and x10), prep, and battle open without page errors.
 * Screenshots land in tests/prod/cde/screenshots/.
 */

import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const shots = join(root, 'tests/prod/cde/screenshots');
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
  [1280, 720],
];

let chromium = null;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  chromium = null;
}

const canDrive = Boolean(chromium && chrome);

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

async function hitLabel(page, locator) {
  const box = await locator.boundingBox();
  if (!box || box.width < 2 || box.height < 2) return { ok: false, reason: 'no-box', box, label: null };
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const label = await page.evaluate(({ x, y }) => {
    const node = document.elementFromPoint(x, y);
    if (!node) return null;
    const button = node.closest('button');
    return (button?.innerText || node.innerText || node.textContent || '').trim();
  }, { x, y });
  return { ok: label === 'Pull 10', reason: label ? `hit:${label}` : 'nothing', box, label };
}

if (!canDrive) {
  test.todo('C+D+E integration screens at 844x390 and 1280x720 — Playwright or Chrome is not installed');
} else {
  test('C+D+E integration screens at 844x390 and 1280x720', { timeout: 180000 }, async () => {
    await mkdir(shots, { recursive: true });
    const { server, origin } = await startServer();
    const browser = await chromium.launch({
      executablePath: chrome,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const notes = { stashMissingDataScreen: false, errors: [] };
    try {
      for (const [width, height] of VIEWPORTS) {
        const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
        const errors = [];
        page.on('pageerror', (error) => errors.push(`${width}x${height}: ${error.message}`));
        await page.goto(`${origin}/web/index.html`, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => localStorage.clear());
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__cfcg);
        await page.waitForSelector('[data-screen="home"]');
        if (width === 844) await page.screenshot({ path: join(shots, 'home-844x390.png') });

        await page.getByRole('button', { name: 'Stash', exact: true }).click();
        await page.waitForSelector('[data-collection-route="stash"]');
        const stashText = await page.locator('#stage').innerText();
        assert.match(stashText, /The Stash/);
        const stashAttr = await page.evaluate(() => document.querySelector('[data-screen="stash"]')?.dataset.screen ?? null);
        if (!stashAttr) notes.stashMissingDataScreen = true;
        if (width === 844) await page.screenshot({ path: join(shots, 'stash-844x390.png') });

        await page.evaluate(() => window.__cfcg.screen('home'));
        await page.waitForSelector('[data-screen="home"]');
        await page.getByRole('button', { name: 'Gachapon', exact: true }).click();
        await page.waitForSelector('[data-screen="gacha-fx"]');
        const pull1 = page.getByRole('button', { name: 'Pull 1', exact: true }).first();
        const pull10 = page.getByRole('button', { name: 'Pull 10', exact: true }).first();
        await assert.ok(await pull1.isVisible());
        await assert.ok(await pull10.isVisible());
        await assert.ok(await pull10.isEnabled());
        const before = await page.locator('[data-banner-id]').first().locator('[data-pity="epic"]').getAttribute('data-value');
        await page.evaluate(() => {
          window.__cfcg.setGachaBalance(100);
          window.__cfcg.setRevealStepMs(30000);
        });
        await pull1.click();
        await page.getByRole('button', { name: 'Skip', exact: true }).click();
        await page.waitForFunction(() => !document.querySelector('.gfx-reveal'));
        const afterOne = await page.locator('[data-banner-id]').first().locator('[data-pity="epic"]').getAttribute('data-value');
        assert.notEqual(afterOne, null);
        assert.notEqual(afterOne, before);
        const afterPull1Hit = await hitLabel(page, pull10);
        assert.equal(afterPull1Hit.ok, true, `Pull 10 not clickable after x1: ${afterPull1Hit.reason}`);
        await pull10.click();
        await page.getByRole('button', { name: 'Skip', exact: true }).click();
        await page.waitForFunction(() => !document.querySelector('.gfx-reveal'));
        const afterTen = await page.locator('[data-banner-id]').first().locator('[data-pity="epic"]').getAttribute('data-value');
        assert.notEqual(afterTen, afterOne);
        if (width === 844) await page.screenshot({ path: join(shots, 'gacha-844x390.png') });
        if (width === 1280) await page.screenshot({ path: join(shots, 'gacha-x10-1280x720.png') });

        await page.evaluate(() => window.__cfcg.prep());
        await page.waitForSelector('[data-screen="prep"]');
        const prepText = await page.locator('#stage').innerText();
        assert.match(prepText, /PREP BATTLE|Prep|START BATTLE/i);
        if (width === 1280) await page.screenshot({ path: join(shots, 'prep-1280x720.png') });

        await page.evaluate(() => window.__cfcg.battle());
        await page.waitForSelector('[data-screen="battle"]');
        if (width === 1280) await page.screenshot({ path: join(shots, 'battle-1280x720.png') });

        await page.close();
        notes.errors.push(...errors);
        assert.deepEqual(errors, [], errors.join('\n'));
      }
    } finally {
      await browser.close();
      await new Promise((resolve) => server.close(resolve));
    }
    if (notes.stashMissingDataScreen) {
      console.log('NOTE P2: C stash still omits data-screen=stash (collection route only).');
    }
  });
}
