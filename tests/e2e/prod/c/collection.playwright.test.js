import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { repoPath } from '../../../acceptance/v05/helpers/load-api.js';
import { REVIEW_VIEWPORTS } from '../../../../web/js/collection/layout.js';

const htmlPath = repoPath('web', 'dist', 'playable.html');
const shotDir = repoPath('tests', 'e2e', 'prod', 'c', 'screenshots');
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
  if (run.status !== 0) throw new Error(`${run.stdout ?? ''}\n${run.stderr ?? ''}`);
  assert.equal(existsSync(htmlPath), true);
}

async function audit(page) {
  return page.evaluate(() => {
    const stage = document.getElementById('stage').getBoundingClientRect();
    const problems = [];
    const nodes = [...document.querySelectorAll('button, input, h1')];
    for (const node of nodes) {
      const rect = node.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      const style = getComputedStyle(node);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      const visibleW = Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0);
      const visibleH = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      const label = (node.getAttribute('aria-label') || node.innerText || node.textContent || node.className || 'control').trim().slice(0, 60);
      const minimum = node.tagName === 'H1' ? 1 : 44;
      const inside = rect.left >= stage.left - 1
        && rect.top >= stage.top - 1
        && rect.right <= stage.right + 1
        && rect.bottom <= stage.bottom + 1;
      if (visibleW < minimum || visibleH < minimum || !inside) {
        problems.push(`${label} ${Math.round(visibleW)}x${Math.round(visibleH)} inside=${inside}`);
      }
    }
    return {
      problems,
      route: document.querySelector('[data-collection-route]')?.dataset.collectionRoute ?? '',
      slots: document.querySelector('[data-col-id="capacity"]')?.dataset.slots ?? '',
      total: document.querySelector('[data-col-id="capacity"]')?.dataset.total ?? '',
      held: document.querySelector('[data-col-id="capacity"]')?.dataset.held ?? '',
      capacity: document.querySelector('[data-col-id="capacity"]')?.textContent ?? '',
    };
  });
}

if (!canDrive) {
  test.todo('collection screens at landscape viewports — Playwright or Chrome is not installed');
} else {
  test.before(() => {
    mkdirSync(shotDir, { recursive: true });
    buildPlayable();
  });

  for (const viewport of REVIEW_VIEWPORTS) {
    test(`collection screens at ${viewport.width}x${viewport.height}`, { timeout: 120000 }, async () => {
      const browser = await chromium.launch({
        executablePath: chrome,
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      });
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      try {
        await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => localStorage.clear());
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.getByRole('heading', { name: 'The Hideout' }).waitFor();

        const shot = async (name) => {
          await page.screenshot({ path: repoPath('tests', 'e2e', 'prod', 'c', 'screenshots', `${viewport.width}x${viewport.height}-${name}.png`) });
        };
        const check = async (route) => {
          const report = await audit(page);
          assert.equal(report.route, route, report.problems.join(' | '));
          assert.deepEqual(report.problems, [], report.problems.join(' | '));
          assert.match(report.capacity, /Furniture slots:/);
          assert.match(report.capacity, /PENDING/);
          assert.match(report.capacity, /HOME-11/);
          assert.equal(report.total, 'PENDING');
          assert.match(report.capacity, /A house tier adds no slots/);
        };

        await page.getByRole('button', { name: 'Stash', exact: true }).click();
        await page.getByRole('heading', { name: 'The Stash' }).waitFor();
        await check('stash');
        await shot('stash');

        await page.locator('[data-col-id="nav:1"]').click();
        await page.getByRole('heading', { name: 'Inventory' }).waitFor();
        await check('inventory');
        await shot('inventory');

        await page.locator('[data-col-id="nav:2"]').click();
        await page.getByRole('heading', { name: 'Card Collection' }).waitFor();
        await check('collection');
        await shot('collection');

        await page.locator('[data-col-id="rarity:FAC"]').click();
        await page.locator('[data-col-id^="slot-"]:not([aria-disabled="true"])').first().click();
        await page.locator('[data-col-id="detail-name"]').click();
        await page.getByRole('heading', { name: 'Card Detail' }).waitFor();
        await check('detail');
        const detailText = await page.locator('[data-col-id="detail-meta"]').innerText();
        assert.match(detailText, /FAC/);
        await shot('detail');

        await page.locator('[data-col-id="nav:3"]').click();
        await page.getByRole('heading', { name: 'Deck Builder' }).waitFor();
        await page.locator('[data-col-id="rarity:all"]').click();
        await page.locator('[data-col-id="deck-slot-0"]:not([aria-disabled="true"])').waitFor();
        await check('deck');
        await shot('deck');
        await page.locator('[data-col-id="search"]').fill('jab');
        await page.locator('[data-col-id="deck-label"]').filter({ hasText: /showing [1-9]/ }).waitFor();
        const deckAudit = await audit(page);
        assert.deepEqual(deckAudit.problems, [], deckAudit.problems.join(' | '));
        assert.match(await page.locator('[data-col-id="deck-slot-0"]').innerText(), /Jab/i);

        await page.getByRole('button', { name: 'Back', exact: true }).click();
        await page.getByRole('heading', { name: 'The Hideout' }).waitFor();
        await page.getByRole('button', { name: 'Team & Deck', exact: true }).click();
        await page.getByRole('heading', { name: 'Team & Deck' }).waitFor();
        await page.getByRole('button', { name: 'Action deck', exact: true }).click();
        await page.getByRole('heading', { name: 'Team & Deck' }).waitFor();
        await check('deck');
        await page.getByRole('button', { name: 'Back', exact: true }).click();
        await page.getByRole('heading', { name: 'The Hideout' }).waitFor();
        assert.deepEqual(errors, []);
      } finally {
        await browser.close();
      }
    });
  }
}
