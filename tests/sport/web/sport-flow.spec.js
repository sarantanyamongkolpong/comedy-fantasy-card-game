import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const port = 8771;
const root = new URL('../../../', import.meta.url);
const chrome = ['/usr/bin/google-chrome', '/usr/local/bin/google-chrome', '/usr/bin/chromium'].find((file) => existsSync(file));
const shotRoot = new URL('./screenshots/', import.meta.url);

let chromium = null;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  chromium = null;
}

const canDrive = Boolean(chromium && chrome);
const viewports = [
  { width: 844, height: 390 },
  { width: 667, height: 375 },
  { width: 915, height: 412 },
  { width: 1280, height: 720 },
];
const sports = [
  { id: 'football', slots: 11, keeper: true },
  { id: 'basket', slots: 5, keeper: false },
  { id: 'car', slots: 2, keeper: false },
  { id: 'moto', slots: 2, keeper: false },
];

let server;

async function ready() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/web/`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => { setTimeout(resolve, 100); });
    }
  }
  throw new Error('static server did not start');
}

async function openGame(viewport) {
  const browser = await chromium.launch({
    executablePath: chrome,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({ viewport });
  await page.goto(`http://127.0.0.1:${port}/web/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'World Map' }).click();
  await page.waitForSelector('[data-sports-hub="open"]');
  return { browser, page };
}

async function shot(page, viewport, name) {
  const dir = fileURLToPath(new URL(`${viewport.width}x${viewport.height}/`, shotRoot));
  mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: `${dir}${name}.png`, fullPage: false });
}

async function buttonsInside(page) {
  return page.evaluate(() => {
    const stage = document.querySelector('#stage')?.getBoundingClientRect();
    const problems = [];
    if (!stage) return ['missing stage'];
    for (const button of document.querySelectorAll('#stage button')) {
      const rect = button.getBoundingClientRect();
      const label = (button.innerText || button.getAttribute('aria-label') || 'button').replace(/\s+/g, ' ').trim().slice(0, 40);
      if (rect.width < 1 || rect.height < 1) {
        problems.push(`empty ${label}`);
        continue;
      }
      const pad = 1;
      if (rect.left < -pad || rect.top < -pad || rect.right > window.innerWidth + pad || rect.bottom > window.innerHeight + pad) {
        problems.push(`off viewport ${label}`);
      }
      if (rect.left < stage.left - pad || rect.top < stage.top - pad || rect.right > stage.right + pad || rect.bottom > stage.bottom + pad) {
        problems.push(`off stage ${label}`);
      }
      if (rect.width < 44 || rect.height < 44) problems.push(`small ${label} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
    }
    const root = document.querySelector('.sport-root');
    if (root) {
      const text = root.innerText;
      if (/\bLOCKED\b/.test(text) || /PRODUCTION_READY/.test(text)) problems.push('status word on screen');
      if (/Thibaut Courtois|Erling Haaland|Max Verstappen|Stephen Curry|Lionel Messi|MotoGP/.test(text)) problems.push('private name on screen');
    }
    return problems;
  });
}

describe('sport complex web', { concurrency: 1, skip: canDrive ? false : 'playwright-core or Chrome is not installed' }, () => {
  test.before(async () => {
    server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
      cwd: root,
      stdio: 'ignore',
    });
    await ready();
  });

  test.after(() => {
    server?.kill();
  });

  for (const viewport of viewports) {
    test(`hub, four sports, gacha at ${viewport.width}x${viewport.height}`, { timeout: 180000 }, async () => {
      const { browser, page } = await openGame(viewport);
      try {
        await shot(page, viewport, '01-map');
        await page.locator('[data-sports-hub="open"]').click();
        await page.waitForSelector('[data-sport-screen="hub"]');
        assert.equal(await page.locator('[data-action="prep"]').count(), 4);
        assert.match(await page.locator('.sport-g').innerText(), /G/);
        assert.match(await page.locator('.sport-g').innerText(), /PROPOSED/);
        assert.deepEqual(await buttonsInside(page), []);
        await shot(page, viewport, '02-hub');

        for (const sport of sports) {
          await page.locator(`[data-sport-screen="hub"] [data-action="prep"][data-sport="${sport.id}"]`).click();
          await page.waitForSelector(`[data-sport-screen="prep"][data-sport="${sport.id}"]`);
          assert.equal(await page.locator('[data-lineup-slot]').count(), sport.slots);
          if (sport.keeper) assert.equal(await page.locator('[data-role="GK"]').count(), 1);
          assert.equal(await page.locator('[data-action="start-sim"]').isEnabled(), true);
          assert.deepEqual(await buttonsInside(page), []);
          await shot(page, viewport, `03-prep-${sport.id}`);
          await page.locator('[data-action="start-sim"]').click();
          await page.waitForSelector('[data-sport-screen="sim"]');
          assert.equal(await page.locator('[data-sport-screen="sim"]').getAttribute('data-playing'), 'false');
          await page.locator('[data-action="play"]').click();
          await page.waitForFunction(() => Number(document.querySelector('[data-sport-screen="sim"]')?.dataset.eventIndex) > 0);
          await page.locator('[data-speed="4"]').click();
          assert.deepEqual(await buttonsInside(page), []);
          await shot(page, viewport, `04-sim-${sport.id}`);
          await page.locator('[data-action="skip"]').click();
          await page.waitForSelector('[data-sport-screen="result"]');
          const resultText = await page.locator('[data-sport-screen="result"]').innerText();
          assert.match(resultText, /PROPOSED/);
          assert.match(resultText, /MVP/);
          assert.match(resultText, /\+?\d+ G/);
          assert.deepEqual(await buttonsInside(page), []);
          await shot(page, viewport, `05-result-${sport.id}`);
          await page.locator('[data-sport-screen="result"] [data-action="hub"]').click();
          await page.waitForSelector('[data-sport-screen="hub"]');
        }

        const before = Number(await page.locator('.sport-g').getAttribute('data-g'));
        await page.locator('[data-action="gacha"]').click();
        await page.waitForSelector('[data-sport-screen="gacha"]');
        await page.locator('[data-action="pull-1"]').click();
        await page.waitForSelector('[data-reveal]');
        const after = Number(await page.locator('.sport-g').getAttribute('data-g'));
        assert.ok(after < before);
        assert.match(await page.locator('.pity-line').innerText(), /Epic pity/);
        assert.match(await page.locator('.pity-line').innerText(), /PROPOSED/);
        assert.deepEqual(await buttonsInside(page), []);
        await shot(page, viewport, '06-gacha');
        await page.locator('[data-sport-screen="gacha"] [data-action="hub"]').click();
        await page.locator('[data-sport-screen="hub"] [data-action="roster"]').click();
        await page.waitForSelector('[data-sport-screen="roster"]');
        assert.match(await page.locator('.roster-grid').innerText(), /PROPOSED/);
        assert.deepEqual(await buttonsInside(page), []);
        await shot(page, viewport, '07-roster');
      } finally {
        await browser.close();
      }
    });
  }
});
