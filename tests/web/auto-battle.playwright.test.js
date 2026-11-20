import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import test from 'node:test';

const port = 8766;
const root = new URL('../../', import.meta.url);
const chrome = ['/usr/bin/google-chrome', '/usr/bin/chromium'].find((file) => existsSync(file));

let chromium = null;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  chromium = null;
}

const canDrive = Boolean(chromium && chrome);
let server;

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

async function browserPage() {
  const browser = await chromium.launch({
    executablePath: chrome,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
  await page.goto(`http://127.0.0.1:${port}/web/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  return { browser, page };
}

test.before(async () => {
  if (!canDrive) return;
  server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
    cwd: root,
    stdio: 'ignore',
  });
  await ready();
});

test.after(() => {
  server?.kill();
});

test('AUTO uses the engine export and starts off', { timeout: 60000, skip: !canDrive }, async () => {
  const { browser, page } = await browserPage();
  try {
    await page.evaluate(() => window.__cfcg.battle());
    await page.waitForSelector('[data-screen="battle"]');
    const auto = page.locator('button.auto-toggle');
    assert.equal(await auto.isDisabled(), false);
    assert.equal(await auto.getAttribute('data-auto'), 'off');
    assert.equal(await page.locator('#stage').innerText().then((text) => text.includes('SYNC')), false);
  } finally {
    await browser.close();
  }
});

test('enabling AUTO drives runAutoTurn without a manual card', { timeout: 60000, skip: !canDrive }, async () => {
  const { browser, page } = await browserPage();
  try {
    await page.evaluate(() => {
      window.__cfcg.setAutoDelay(0);
      window.__cfcg.battle();
    });
    const started = await page.evaluate(() => window.__cfcg.phase());
    await page.waitForSelector('[data-screen="battle"]');
    await page.locator('button.auto-toggle').click();
    await page.waitForFunction((initial) => {
      const toast = document.querySelector('.toast');
      const moved = window.__cfcg.phase() !== initial;
      const line = toast && /plays|End turn|Toss|Discard/.test(toast.textContent || '');
      return moved || line;
    }, started);
    assert.equal(await page.locator('[data-screen="battle"], h1.title').count() > 0, true);
  } finally {
    await browser.close();
  }
});

test('switching AUTO off during an action hands the turn back', { timeout: 60000, skip: !canDrive }, async () => {
  const { browser, page } = await browserPage();
  try {
    await page.evaluate(() => {
      window.__cfcg.setAutoDelay(200);
      window.__cfcg.battle();
    });
    await page.waitForSelector('[data-screen="battle"]');
    const auto = page.locator('button.auto-toggle');
    await auto.click();
    await page.waitForFunction(() => {
      const toast = document.querySelector('.toast');
      return toast && /plays|End turn|Toss|Discard/.test(toast.textContent || '');
    });
    await auto.click();
    await page.waitForFunction(() => window.__cfcg.autoEnabled() === false);
    await page.waitForTimeout(400);
    assert.equal(await page.locator('[data-screen="battle"]').count(), 1);
    assert.equal(await page.evaluate(() => window.__cfcg.phase()), 'playerTurn');
    assert.equal(await page.locator('button.end-turn').isEnabled(), true);
  } finally {
    await browser.close();
  }
});

test('map opens Prep Battle and Start Battle is the labelled primary control', { timeout: 60000, skip: !canDrive }, async () => {
  const { browser, page } = await browserPage();
  try {
    await page.getByRole('button', { name: 'World Map' }).click();
    await page.getByRole('button', { name: 'Mysterious Tower' }).click();
    await page.waitForSelector('[data-screen="prep"]');
    const text = await page.locator('#stage').innerText();
    assert.match(text, /PREP BATTLE/);
    assert.match(text, /MYSTERIOUS TOWER/);
    assert.match(text, /Saving Grace/);
    assert.match(text, /Regen \+3 x2 turns/);
    assert.match(text, /Moral Support/);
    assert.equal(text.includes('SYNC'), false);
    assert.equal(text.includes('HEAL BONUS'), false);
    assert.equal(text.includes('FRONT'), false);
    const start = page.locator('button.prep-start');
    assert.match(await start.innerText(), /START BATTLE/);
    assert.equal(await start.isEnabled(), true);
    await start.click();
    await page.waitForSelector('[data-screen="battle"]');
  } finally {
    await browser.close();
  }
});
