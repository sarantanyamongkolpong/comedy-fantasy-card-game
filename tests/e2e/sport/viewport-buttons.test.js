import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { abs, sportEntryHtml } from '../../../tools/sport-qa/lib/discover.mjs';
import { repoRoot } from '../../../tools/sport-qa/lib/paths.mjs';

const VIEWPORTS = [
  { width: 844, height: 390 },
  { width: 667, height: 375 },
  { width: 915, height: 412 },
  { width: 1280, height: 720 },
];

const entry = sportEntryHtml();

async function loadDriver() {
  let chromium = null;
  try {
    ({ chromium } = await import('playwright-core'));
  } catch {
    try {
      ({ chromium } = await import('/tmp/sport-qa-deps/node_modules/playwright-core/index.js'));
    } catch {
      chromium = null;
    }
  }
  const chrome = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
    .find((file) => existsSync(file));
  if (!chromium || !chrome) return null;
  return { chromium, chrome };
}

async function visibleButtons(page) {
  return page.evaluate(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const nodes = [...document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]')];
    const outside = [];
    let visible = 0;
    for (const node of nodes) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      visible += 1;
      const label = (node.innerText || node.value || node.getAttribute('aria-label') || node.id || 'button').trim().slice(0, 80);
      const inside = rect.left >= -1 && rect.top >= -1 && rect.right <= width + 1 && rect.bottom <= height + 1;
      if (!inside) {
        outside.push({
          label,
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
          viewport: `${width}x${height}`,
        });
      }
    }
    return { visible, outside };
  });
}

if (!entry) {
  test('sport viewport buttons', { skip: 'web/sport is absent' }, () => {});
} else {
  const driver = await loadDriver();
  if (!driver) {
    test('sport viewport buttons', { skip: 'playwright-core or Chrome is not installed' }, () => {});
  } else {
    const shotRoot = process.env.SPORT_QA_SCREENSHOTS
      ?? join(repoRoot(), 'tests/e2e/sport/screenshots');
    mkdirSync(shotRoot, { recursive: true });

    for (const viewport of VIEWPORTS) {
      test(`visible buttons stay inside ${viewport.width}x${viewport.height}`, { timeout: 60000 }, async () => {
        const browser = await driver.chromium.launch({
          executablePath: driver.chrome,
          args: ['--no-sandbox', '--disable-dev-shm-usage'],
        });
        const page = await browser.newPage({ viewport });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        try {
          await page.goto(pathToFileURL(abs(entry.file)).href, { waitUntil: 'domcontentloaded' });
          const landing = await visibleButtons(page);
          assert.ok(landing.visible > 0, `${entry.file} has no visible buttons at ${viewport.width}x${viewport.height}`);
          assert.deepEqual(landing.outside, [], 'a visible button is outside the viewport');
          if (entry.kind === 'app-shell') {
            const entrance = page.getByRole('button', { name: /sport/i });
            const links = page.getByRole('link', { name: /sport/i });
            if (await entrance.count()) await entrance.first().click();
            else if (await links.count()) await links.first().click();
            else throw new Error('the app shell has no sport entrance');
            await page.waitForTimeout(200);
            const sport = await visibleButtons(page);
            assert.ok(sport.visible > 0, 'the sport screen has no visible buttons');
            assert.deepEqual(sport.outside, [], 'a sport-screen button is outside the viewport');
          }
          assert.deepEqual(errors, []);
        } finally {
          await page.screenshot({
            path: join(shotRoot, `${viewport.width}x${viewport.height}.png`),
            fullPage: false,
          }).catch(() => {});
          await browser.close();
        }
      });
    }
  }
}
