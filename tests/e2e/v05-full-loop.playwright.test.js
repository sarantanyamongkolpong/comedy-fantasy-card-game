import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { repoPath } from '../acceptance/v05/helpers/load-api.js';

const VIEWPORTS = [
  { width: 844, height: 390 },
  { width: 667, height: 375 },
  { width: 915, height: 412 },
  { width: 1280, height: 720 },
];
const REWARD_CAP_MS = 120000;
const htmlPath = repoPath('web', 'dist', 'playable.html');
const chrome = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((file) => existsSync(file));

let chromium = null;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  chromium = null;
}

const canDrive = Boolean(chromium && chrome);

function buildPlayable() {
  const run = spawnSync(process.execPath, [repoPath('web', 'tools', 'build-single-html')], {
    cwd: repoPath(),
    encoding: 'utf8',
  });
  if (run.status !== 0) {
    throw new Error(`${run.stdout ?? ''}\n${run.stderr ?? ''}`);
  }
  assert.equal(existsSync(htmlPath), true);
}

async function readStage(page) {
  return page.evaluate(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const root = document.documentElement;
    const broken = [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0 && img.getAttribute('src'))
      .map((img) => img.currentSrc || img.className || 'img');
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

async function clickNamed(page, name) {
  const button = page.getByRole('button', { name, exact: true }).first();
  const box = await button.boundingBox();
  const viewport = page.viewportSize();
  const visibleW = box ? Math.min(box.x + box.width, viewport.width) - Math.max(box.x, 0) : 0;
  const visibleH = box ? Math.min(box.y + box.height, viewport.height) - Math.max(box.y, 0) : 0;
  if (visibleW < 44 || visibleH < 44) {
    throw new Error(`${name} is outside the ${viewport.width}x${viewport.height} viewport`);
  }
  await button.click();
}

if (!canDrive) {
  test.todo('QA-10 full loop Home Hideout Stash Deck Map Prep Battle Rewards Save Gacha — Playwright or Chrome is not installed');
} else {
  test.before(() => {
    buildPlayable();
  });

  for (const viewport of VIEWPORTS) {
    test(`QA-10 full loop at ${viewport.width}x${viewport.height}`, { timeout: REWARD_CAP_MS + 60000 }, async () => {
        const errors = [];
        const clipped = [];
        const browser = await chromium.launch({
          executablePath: chrome,
          args: ['--no-sandbox', '--disable-dev-shm-usage'],
        });
      const page = await browser.newPage({ viewport });
      page.on('pageerror', (error) => errors.push(error.message));
      try {
        await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => localStorage.clear());
        await page.reload({ waitUntil: 'domcontentloaded' });
        const note = async (label) => {
          const report = await readStage(page);
          if (report.overflow || report.broken.length > 0 || report.outside.length > 0) {
            clipped.push({ label, ...report });
          }
        };
        await page.getByRole('heading', { name: 'The Hideout' }).waitFor();
        await note('hideout');

        await clickNamed(page, 'Stash');
        await page.getByRole('heading', { name: 'The Stash' }).waitFor();
        await note('stash');
        await clickNamed(page, 'Back');

        await clickNamed(page, 'Team & Deck');
        await page.getByRole('heading', { name: 'Team & Deck' }).waitFor();
        await clickNamed(page, 'Action deck');
        await note('deck');
        await clickNamed(page, 'Back');

        await clickNamed(page, 'World Map');
        await page.getByRole('heading', { name: 'World Map' }).waitFor();
        await note('map');
        await clickNamed(page, 'Mysterious Tower');
        await page.getByRole('heading', { name: 'PREP BATTLE' }).waitFor();
        await note('prep');

        await page.evaluate(() => window.__cfcg.setAutoDelay(0));
        const start = page.getByRole('button', { name: 'START BATTLE' });
        assert.equal(await start.isEnabled(), true, 'START BATTLE is disabled');
        await start.click();
        await page.locator('button.auto-toggle').waitFor();
        await note('battle');
        await page.locator('button.auto-toggle').click();
        await page.getByRole('heading', { name: /Victory lap|Consolation cocoa/ }).waitFor({ timeout: REWARD_CAP_MS });
        await note('rewards');

        await clickNamed(page, 'Back to the Hideout');
        await page.getByRole('heading', { name: 'The Hideout' }).waitFor();
        await clickNamed(page, 'Save');
        await page.getByText('Saved in this browser.').waitFor();
        await clickNamed(page, 'Load');
        await page.getByText('Loaded the save from this browser.').waitFor();
        await note('save-load');

        await clickNamed(page, 'Gachapon');
        await page.getByRole('heading', { name: 'Gachapon' }).waitFor();
        await clickNamed(page, 'Pull 1');
        await page.getByRole('heading', { name: 'Latest TEST pull' }).waitFor();
        await note('gacha');
        await clickNamed(page, 'Back');
        await page.getByRole('heading', { name: 'The Hideout' }).waitFor();
        await note('hideout-return');
        assert.deepEqual(errors, []);
        assert.deepEqual(clipped, [], 'a screen has overflow, a broken image, or a control outside the viewport');
      } finally {
        await browser.close();
      }
    });
  }
}
