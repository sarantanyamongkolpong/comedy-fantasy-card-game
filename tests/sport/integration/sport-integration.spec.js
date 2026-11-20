/**
 * Browser QA for the live Sport Complex wiring (integration/v06-sport).
 * Run: node --test tests/sport/integration/sport-integration.spec.js
 * Needs playwright-core and a Chromium. Skips cleanly when either is missing.
 * Screenshots: tests/sport/integration/screenshots/<WxH>/
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const port = 8781;
const root = new URL('../../../', import.meta.url);
const shotRoot = new URL('./screenshots/', import.meta.url);

function findChrome() {
  const fixed = ['/usr/bin/google-chrome', '/usr/local/bin/google-chrome', '/usr/bin/chromium'].find((file) => existsSync(file));
  if (fixed) return fixed;
  const cache = `${homedir()}/.cache/ms-playwright`;
  if (!existsSync(cache)) return null;
  for (const dir of readdirSync(cache).filter((name) => name.startsWith('chromium-')).sort().reverse()) {
    for (const rel of ['chrome-linux64/chrome', 'chrome-linux/chrome']) {
      const file = `${cache}/${dir}/${rel}`;
      if (existsSync(file)) return file;
    }
  }
  return null;
}

let chromium = null;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  chromium = null;
}
const chrome = findChrome();
const canDrive = Boolean(chromium && chrome);
const VIEWPORTS = (process.env.SPORT_VIEWPORTS ?? '844x390,667x375,915x412,1280x720')
  .split(',').map((pair) => { const [width, height] = pair.split('x').map(Number); return { width, height }; });
const SPORTS = [
  { id: 'football', slots: 11, banner: 'SPORT_FOOTBALL' },
  { id: 'basket', slots: 5, banner: 'SPORT_BASKET' },
  { id: 'car', slots: 2, banner: 'SPORT_CAR' },
  { id: 'moto', slots: 2, banner: 'SPORT_MOTO' },
];
const PRIVATE = /Thibaut Courtois|Erling Haaland|Max Verstappen|Stephen Curry|Lionel Messi|Lando Norris|Marc M[aá]rquez|Nikola Joki|LeBron James|MotoGP|Formula 1|uefa\.com|nba\.com/;
const report = [];

let server;
async function ready() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/web/`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => { setTimeout(resolve, 100); });
    }
  }
  throw new Error('static server did not start');
}

async function shot(page, viewport, name) {
  const dir = fileURLToPath(new URL(`${viewport.width}x${viewport.height}/`, shotRoot));
  mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: `${dir}${name}.png`, fullPage: false });
}

async function problems(page) {
  return page.evaluate((privatePattern) => {
    const out = [];
    const stage = document.querySelector('#stage')?.getBoundingClientRect();
    if (!stage) return ['missing stage'];
    for (const button of document.querySelectorAll('#stage button')) {
      const rect = button.getBoundingClientRect();
      const label = (button.innerText || button.getAttribute('aria-label') || 'button').replace(/\s+/g, ' ').trim().slice(0, 40);
      if (rect.width < 1 || rect.height < 1) continue;
      const pad = 1;
      if (rect.left < -pad || rect.top < -pad || rect.right > window.innerWidth + pad || rect.bottom > window.innerHeight + pad) out.push(`off viewport ${label}`);
      if (rect.left < stage.left - pad || rect.top < stage.top - pad || rect.right > stage.right + pad || rect.bottom > stage.bottom + pad) out.push(`off stage ${label}`);
    }
    const rootNode = document.querySelector('.sport-root');
    if (rootNode) {
      const text = rootNode.innerText;
      if (/\bLOCKED\b/.test(text) || /PRODUCTION_READY/.test(text)) out.push('status word on screen');
      if (new RegExp(privatePattern).test(text)) out.push('private name on screen');
    }
    return out;
  }, PRIVATE.source);
}

const gOf = async (page) => Number(await page.locator('.sport-g').first().getAttribute('data-g'));

async function openHub(page) {
  await page.getByRole('button', { name: 'World Map' }).click();
  await page.waitForSelector('[data-sports-hub="open"]');
  await page.locator('[data-sports-hub="open"]').click();
  await page.waitForSelector('[data-sport-screen="hub"]');
}

describe('sport v0.6 integration browser QA', { concurrency: 1, skip: canDrive ? false : 'playwright-core or Chromium is not installed' }, () => {
  test.before(async () => {
    server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: fileURLToPath(root), stdio: 'ignore' });
    await ready();
  });
  test.after(() => {
    server?.kill();
    mkdirSync(fileURLToPath(shotRoot), { recursive: true });
    writeFileSync(fileURLToPath(new URL('report.json', shotRoot)), `${JSON.stringify(report, null, 2)}\n`);
  });

  for (const viewport of VIEWPORTS) {
    test(`live sport flow at ${viewport.width}x${viewport.height}`, { timeout: 240000 }, async () => {
      const browser = await chromium.launch({ executablePath: chrome, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
      const errors = [];
      const row = { viewport: `${viewport.width}x${viewport.height}`, sports: {}, save: null, consoleErrors: errors };
      report.push(row);
      try {
        const page = await browser.newPage({ viewport });
        page.on('console', (msg) => {
          if (msg.type() !== 'error') return;
          const where = msg.location()?.url ?? '';
          // The dev static server has no favicon; the browser asks for one on its own.
          if (/favicon\.ico$/.test(where)) return;
          errors.push(`${msg.text()} @ ${where}`);
        });
        page.on('pageerror', (error) => errors.push(String(error)));
        const missing = [];
        row.missing = missing;
        page.on('response', (response) => { if (response.status() >= 400) missing.push(`${response.status()} ${new URL(response.url()).pathname}`); });
        await page.goto(`http://127.0.0.1:${port}/web/`, { waitUntil: 'networkidle' });
        await page.evaluate(() => localStorage.clear());
        await page.reload({ waitUntil: 'networkidle' });
        await openHub(page);
        assert.equal(await page.locator('[data-action="prep"]').count(), 4);
        assert.deepEqual(await problems(page), []);
        await shot(page, viewport, '01-hub');

        for (const sport of SPORTS) {
          const status = { prep: false, sim: false, result: false, gacha: false, roster: false };
          row.sports[sport.id] = status;
          await page.locator(`[data-sport-screen="hub"] [data-action="prep"][data-sport="${sport.id}"]`).click();
          await page.waitForSelector(`[data-sport-screen="prep"][data-sport="${sport.id}"]`);
          assert.equal(await page.locator('[data-lineup-slot]').count(), sport.slots);
          assert.equal(await page.locator('[data-action="start-sim"]').isEnabled(), true);
          assert.deepEqual(await problems(page), []);
          await shot(page, viewport, `02-prep-${sport.id}`);
          status.prep = true;

          await page.locator('[data-action="start-sim"]').click();
          await page.waitForSelector('[data-sport-screen="sim"]');
          await page.locator('[data-action="speed"][data-speed="4"]').click();
          await page.locator('[data-action="play"]').click();
          await page.waitForFunction(() => Number(document.querySelector('[data-sport-screen="sim"]')?.dataset.eventIndex) >= 6, null, { timeout: 20000 });
          assert.deepEqual(await problems(page), []);
          await shot(page, viewport, `03-sim-${sport.id}`);
          status.sim = true;

          const before = await gOf(page);
          await page.locator('[data-action="skip"]').click();
          await page.waitForSelector('[data-sport-screen="result"]');
          const resultText = await page.locator('[data-sport-screen="result"]').innerText();
          assert.match(resultText, /MVP/);
          assert.match(resultText, /PROPOSED/);
          const reward = Number(await page.locator('[data-reward]').getAttribute('data-reward'));
          assert.equal(await gOf(page), before + reward, 'reward lands on the shared G wallet');
          assert.deepEqual(await problems(page), []);
          await shot(page, viewport, `04-result-${sport.id}`);
          status.result = true;
          await page.locator('[data-sport-screen="result"] [data-action="hub"]').click();
          await page.waitForSelector('[data-sport-screen="hub"]');

          await page.locator('[data-sport-screen="hub"] [data-action="gacha"]').click();
          await page.waitForSelector('[data-sport-screen="gacha"]');
          await page.locator(`[data-action="banner"][data-sport="${sport.id}"]`).click();
          const g0 = await gOf(page);
          const count = sport.id === 'football' ? 10 : 1;
          await page.locator(`[data-action="pull-${count}"]`).click();
          await page.waitForSelector('[data-reveal]');
          assert.equal(await page.locator('[data-reveal]').count(), count);
          assert.ok((await gOf(page)) < g0, 'pull spends shared G');
          assert.equal(Number(await page.locator('.pity-line').getAttribute('data-pity-epic')) >= 0, true);
          const pulledId = await page.locator('[data-reveal]').first().getAttribute('data-card-id');
          assert.deepEqual(await problems(page), []);
          await shot(page, viewport, `05-gacha-${sport.id}`);
          status.gacha = true;
          await page.locator('[data-sport-screen="gacha"] [data-action="hub"]').click();
          await page.locator('[data-sport-screen="hub"] [data-action="roster"]').click();
          await page.waitForSelector('[data-sport-screen="roster"]');
          await page.locator(`[data-action="roster-sport"][data-sport="${sport.id}"]`).click();
          await page.waitForSelector(`[data-sport-screen="roster"][data-sport="${sport.id}"]`);
          let found = false;
          for (let pageNo = 0; pageNo < 12 && !found; pageNo += 1) {
            found = (await page.locator(`.roster-card[data-card-id="${pulledId}"]`).count()) > 0;
            if (!found) {
              const next = page.locator('[data-action="page-next"]');
              if (await next.isDisabled()) break;
              await next.click();
            }
          }
          assert.ok(found, `pulled ${pulledId} shows on the roster`);
          assert.deepEqual(await problems(page), []);
          await shot(page, viewport, `06-roster-${sport.id}`);
          status.roster = true;
          await page.locator('[data-sport-screen="roster"] [data-action="hub"]').click();
          await page.waitForSelector('[data-sport-screen="hub"]');
        }

        // Save and reload: exit to map (persists), reload the page, reopen the hub.
        const gBefore = await gOf(page);
        await page.locator('[data-sport-screen="hub"] [data-action="gacha"]').click();
        await page.locator('[data-action="banner"][data-sport="football"]').click();
        const pityBefore = await page.locator('.pity-line').innerText();
        await page.locator('[data-sport-screen="gacha"] [data-action="hub"]').click();
        await page.locator('[data-sport-screen="hub"] [data-action="map"]').click();
        await page.waitForSelector('[data-sports-hub="open"]');
        const stored = await page.evaluate(() => localStorage.getItem('cfcg.v05.web.save'));
        assert.ok(stored && stored.includes('"sport"'), 'save carries the sport payload');
        await page.reload({ waitUntil: 'networkidle' });
        await openHub(page);
        const gAfter = await gOf(page);
        await page.locator('[data-sport-screen="hub"] [data-action="gacha"]').click();
        await page.locator('[data-action="banner"][data-sport="football"]').click();
        const pityAfter = await page.locator('.pity-line').innerText();
        await shot(page, viewport, '07-after-reload-gacha');
        row.save = { gBefore, gAfter, pityBefore, pityAfter, pass: gBefore === gAfter && pityBefore === pityAfter };
        assert.equal(gAfter, gBefore, 'G survives reload');
        assert.equal(pityAfter, pityBefore, 'pity survives reload');
        const savedProfile = JSON.parse(stored).profile;
        assert.ok(Object.keys(savedProfile.sport.roster).length > 0, 'top-level profile.sport roster saved');
        assert.deepEqual(errors, [], `console errors: ${errors.join(' | ')}`);
      } finally {
        await browser.close();
      }
    });
  }
});
