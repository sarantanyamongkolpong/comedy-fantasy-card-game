import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { sportEntryHtml } from '../../../tools/sport-qa/lib/discover.mjs';
import { repoRoot } from '../../../tools/sport-qa/lib/paths.mjs';

const VIEWPORTS = [
  { width: 844, height: 390 },
  { width: 667, height: 375 },
  { width: 915, height: 412 },
  { width: 1280, height: 720 },
];

const entry = sportEntryHtml();
const port = 8795;
let server = null;

async function startServer() {
  if (server) return;
  server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
    cwd: repoRoot(),
    stdio: 'ignore',
  });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/web/`);
      if (response.ok || response.status === 404) return;
    } catch {
      await new Promise((resolve) => { setTimeout(resolve, 100); });
    }
  }
  throw new Error('static server did not start');
}

test.after(() => {
  server?.kill();
});

async function loadDriver() {
  const specifiers = [
    'playwright-core',
    '/tmp/sport-qa-deps/node_modules/playwright-core/index.mjs',
  ];
  let chromium = null;
  for (const specifier of specifiers) {
    try {
      const mod = await import(specifier);
      chromium = mod.chromium ?? mod.default?.chromium ?? null;
      if (chromium) break;
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
          await startServer();
          const url = entry.kind === 'sport-page'
            ? `http://127.0.0.1:${port}/${entry.file}`
            : `http://127.0.0.1:${port}/web/`;
          await page.goto(url, { waitUntil: 'domcontentloaded' });
          await page.getByRole('button').first().waitFor({ timeout: 10000 });
          const outside = [];
          const landing = await visibleButtons(page);
          assert.ok(landing.visible > 0, `${entry.file} has no visible buttons at ${viewport.width}x${viewport.height}`);
          outside.push(...landing.outside.map((row) => ({ screen: 'home', ...row })));
          if (entry.kind === 'app-shell') {
            const map = page.getByRole('button', { name: /world map/i });
            if (await map.count()) {
              await map.first().click();
              await page.waitForTimeout(200);
              const mapped = await visibleButtons(page);
              outside.push(...mapped.outside.map((row) => ({ screen: 'map', ...row })));
            }
            let entrance = page.getByRole('button', { name: /sport/i });
            const links = page.getByRole('link', { name: /sport/i });
            if (await entrance.count()) await entrance.first().click();
            else if (await links.count()) await links.first().click();
            else throw new Error('the app shell has no sport entrance');
            await page.waitForTimeout(300);
            const sport = await visibleButtons(page);
            assert.ok(sport.visible > 0, 'the sport screen has no visible buttons');
            outside.push(...sport.outside.map((row) => ({ screen: 'sport', ...row })));
          }
          assert.deepEqual(outside, [], `a visible button is outside the viewport: ${JSON.stringify(outside)}`);
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
