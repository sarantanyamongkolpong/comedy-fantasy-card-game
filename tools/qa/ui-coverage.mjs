/**
 * Headless Chrome coverage for the shipped web client.
 * Screenshots, touch size, card/character overlap, navigation, stash,
 * gacha ledger, AUTO, save/load, and a short playback sample.
 * Product files are not modified. A damage preset is applied only by
 * rewriting the served app.js response inside this process.
 */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { artifactDir, repoRoot } from './lib/repo.mjs';

const VIEWPORTS = [
  { id: '844x390', width: 844, height: 390 },
  { id: '667x375', width: 667, height: 375 },
  { id: '915x412', width: 915, height: 412 },
  { id: '1280x720', width: 1280, height: 720 },
  { id: '932x430', width: 932, height: 430 },
  { id: '1024x768', width: 1024, height: 768 },
];

const PORT = 8771;
const MIN_TOUCH = 44;
const TIGHT_TOUCH = 24;
const playwrightRoot = process.env.QA_PLAYWRIGHT || '/tmp/qa-deps/node_modules/playwright-core';

function loadChromium() {
  const require = createRequire(join(playwrightRoot, 'package.json'));
  return require('playwright-core').chromium;
}

function finding(list, severity, area, message, extra = {}) {
  list.push({ severity, area, message, ...extra });
}

async function waitForServer(port) {
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

function startServer(port) {
  const child = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
    cwd: repoRoot,
    stdio: 'ignore',
  });
  return child;
}

async function openPage(browser, viewport, preset) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  if (preset) {
    await page.route('**/js/app.js', async (route) => {
      const response = await route.fetch();
      const source = await response.text();
      const needle = 'input.config = state.api.defaultRuleConfig();';
      if (!source.includes(needle)) throw new Error('flat_atk injection point missing from app.js');
      const body = source.replace(needle, `${needle} input.config.damage.preset = ${JSON.stringify(preset)};`);
      await route.fulfill({
        response,
        body,
        headers: { ...response.headers(), 'content-type': 'text/javascript; charset=utf-8' },
      });
    });
  }
  await page.goto(`http://127.0.0.1:${PORT}/web/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('[data-screen="home"]', { timeout: 20000 });
  return { page, errors };
}

async function shot(page, viewportId, name) {
  const dir = join(artifactDir(), 'screenshots', viewportId);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${name}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 62, animations: 'disabled' });
  return relativeToRepo(file);
}

function relativeToRepo(file) {
  return file.startsWith(repoRoot) ? file.slice(repoRoot.length + 1) : file;
}

async function settle(page) {
  await page.evaluate(() => {
    const imgs = [...document.images].filter((img) => {
      if (!img.getAttribute('src')) return false;
      const rect = img.getBoundingClientRect();
      return rect.width > 1 && rect.height > 1;
    });
    return Promise.all(imgs.map((img) => {
      const decoded = typeof img.decode === 'function' ? img.decode().catch(() => {}) : Promise.resolve();
      return Promise.race([
        decoded,
        new Promise((resolve) => { setTimeout(resolve, 2500); }),
      ]);
    }));
  });
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

async function clickNamed(page, name) {
  const button = page.getByRole('button', { name, exact: true }).first();
  await button.click({ timeout: 8000 });
}

async function geometry(page) {
  return page.evaluate(() => {
    function box(el) {
      const rect = el.getBoundingClientRect();
      return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
    }
    function visible(el) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 1 && rect.height > 1;
    }
    function overlapRatio(a, b) {
      const width = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
      const height = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      const area = width * height;
      const smaller = Math.min(a.w * a.h, b.w * b.h);
      return smaller > 0 ? area / smaller : 0;
    }
    function pairs(nodes, label) {
      const rects = nodes.filter(visible).map((el, index) => ({
        index,
        label: el.getAttribute('aria-label') || el.dataset.cardName || el.dataset.row || el.className || String(index),
        ...box(el),
      }));
      const hits = [];
      for (let left = 0; left < rects.length; left += 1) {
        for (let right = left + 1; right < rects.length; right += 1) {
          const ratio = overlapRatio(rects[left], rects[right]);
          if (ratio > 0.02) hits.push({ kind: label, left: rects[left].label, right: rects[right].label, ratio: Number(ratio.toFixed(3)) });
        }
      }
      return { count: rects.length, hits };
    }
    const buttons = [...document.querySelectorAll('button')].filter(visible).map((el) => {
      const rect = box(el);
      return {
        name: (el.getAttribute('aria-label') || el.innerText || el.className || 'button').replace(/\s+/g, ' ').slice(0, 80),
        w: Number(rect.w.toFixed(1)),
        h: Number(rect.h.toFixed(1)),
        x: Number(rect.x.toFixed(1)),
        y: Number(rect.y.toFixed(1)),
      };
    });
    return {
      screen: document.querySelector('[data-screen]')?.dataset.screen ?? null,
      buttons,
      names: pairs([...document.querySelectorAll('.hand-card .card-name')], 'card-name'),
      costs: pairs([...document.querySelectorAll('.hand-card .card-cost')], 'card-cost'),
      cards: pairs([...document.querySelectorAll('.hand-card')], 'hand-card'),
      sprites: pairs([...document.querySelectorAll('.battle .sprite, .prep-token .sprite')], 'sprite'),
      slots: pairs([...document.querySelectorAll('.bag-slot')], 'stash-slot'),
      mapLabels: pairs([...document.querySelectorAll('.hotspot-label, .hotspot-lock')], 'map-label'),
      brokenImages: [...document.images].filter((img) => visible(img) && img.complete && img.naturalWidth === 0 && img.getAttribute('src')).length,
      handCount: document.querySelectorAll('.hand-card').length,
      spriteCount: document.querySelectorAll('.battle .sprite, .prep-token .sprite').length,
    };
  });
}

function judgeGeometry(findings, viewportId, screen, geo) {
  for (const button of geo.buttons) {
    const min = Math.min(button.w, button.h);
    if (min < TIGHT_TOUCH) {
      finding(findings, 'P1', 'touch', `${screen} control "${button.name}" is ${button.w}x${button.h} CSS px`, { viewport: viewportId, screen });
    } else if (min < MIN_TOUCH) {
      finding(findings, 'P2', 'touch', `${screen} control "${button.name}" is ${button.w}x${button.h} CSS px, under the 44px target`, { viewport: viewportId, screen });
    }
    if (button.x + button.w < 0 || button.y + button.h < 0 || button.x > viewportWidth(viewportId) || button.y > viewportHeight(viewportId)) {
      finding(findings, 'P2', 'visibility', `${screen} control "${button.name}" sits outside the viewport`, { viewport: viewportId, screen });
    }
  }
  for (const hit of geo.names.hits) {
    if (hit.ratio >= 0.08) finding(findings, 'P1', 'cards', `${screen} card names overlap (${hit.left} / ${hit.right}, ${hit.ratio})`, { viewport: viewportId, screen });
  }
  for (const hit of geo.costs.hits) {
    if (hit.ratio >= 0.08) finding(findings, 'P1', 'cards', `${screen} card costs overlap (${hit.left} / ${hit.right}, ${hit.ratio})`, { viewport: viewportId, screen });
  }
  for (const hit of geo.sprites.hits) {
    const severity = hit.ratio >= 0.4 ? 'P1' : 'P2';
    if (hit.ratio >= 0.15) finding(findings, severity, 'characters', `${screen} character sprites overlap (${hit.left} / ${hit.right}, ${hit.ratio})`, { viewport: viewportId, screen });
  }
  for (const hit of geo.slots.hits) {
    if (hit.ratio >= 0.1) finding(findings, 'P2', 'inventory', `${screen} stash slots overlap (${hit.ratio})`, { viewport: viewportId, screen });
  }
  for (const hit of (geo.mapLabels?.hits ?? [])) {
    if (hit.ratio >= 0.2) finding(findings, 'P2', 'map', `${screen} map label overlaps (${hit.left} / ${hit.right}, ${hit.ratio})`, { viewport: viewportId, screen });
  }
  if (geo.brokenImages > 0) finding(findings, 'P1', 'assets', `${screen} has ${geo.brokenImages} broken images`, { viewport: viewportId, screen });
  if ((screen === 'battle' || screen === 'prep') && geo.spriteCount === 0) {
    finding(findings, 'P1', 'characters', `${screen} rendered no character sprites`, { viewport: viewportId, screen });
  }
  if (screen === 'battle' && geo.handCount === 0) {
    finding(findings, 'P1', 'cards', 'battle rendered no hand cards', { viewport: viewportId, screen });
  }
}

function viewportWidth(id) {
  return VIEWPORTS.find((item) => item.id === id)?.width ?? 0;
}
function viewportHeight(id) {
  return VIEWPORTS.find((item) => item.id === id)?.height ?? 0;
}

async function readText(page) {
  return page.locator('#stage').innerText();
}

async function gachaLedger(page, findings, viewportId, screenshots) {
  await clickNamed(page, 'Gachapon');
  await page.waitForSelector('.gacha', { timeout: 8000 });
  screenshots.push(await shot(page, viewportId, 'gacha'));
  const text = await readText(page);
  const checks = [
    ['Epic pity', /Epic pity 0 \/ 100/],
    ['top pity', /Top pity 0 \/ 200/],
    ['companion top', /Top pity: none/],
    ['TEST weights N', /N 100/],
    ['no production price', /price is PENDING/],
    ['cost copy', /charges nothing/],
  ];
  for (const [label, pattern] of checks) {
    if (!pattern.test(text)) finding(findings, 'P0', 'gacha', `G ledger missing ${label}`, { viewport: viewportId });
  }
  if (/costG\s*[:=]\s*[1-9]/.test(text)) finding(findings, 'P0', 'gacha', 'screen shows a non-zero G cost', { viewport: viewportId });
  await clickNamed(page, 'Pull 1');
  await page.waitForTimeout(80);
  const afterOne = await readText(page);
  if (!/G charged: 0/.test(afterOne)) finding(findings, 'P0', 'gacha', 'Pull 1 did not report G charged: 0', { viewport: viewportId });
  if (!/Epic pity 1 \/ 100/.test(afterOne)) finding(findings, 'P1', 'gacha', 'Pull 1 did not advance epic pity 0 -> 1', { viewport: viewportId });
  const covered = await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((el) => (el.innerText || '').trim() === 'Pull 10');
    if (!button) return 'missing';
    const rect = button.getBoundingClientRect();
    const top = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    if (!top || button.contains(top) || top === button) return null;
    return (top.innerText || top.className || 'overlay').replace(/\s+/g, ' ').slice(0, 80);
  });
  if (covered) {
    finding(findings, 'P1', 'gacha', `Pull 10 is covered after Pull 1 (${covered})`, { viewport: viewportId });
  }
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((el) => (el.innerText || '').trim() === 'Pull 10');
    button?.click();
  });
  const afterTen = await readText(page);
  if (!/G charged: 0/.test(afterTen)) finding(findings, 'P0', 'gacha', 'Pull 10 did not report G charged: 0', { viewport: viewportId });
  if (!/Epic pity 11 \/ 100/.test(afterTen)) finding(findings, 'P1', 'gacha', 'Pull 1 then Pull 10 did not leave epic pity at 11', { viewport: viewportId });
  screenshots.push(await shot(page, viewportId, 'gacha-after-pull'));
}

async function saveRoundTrip(page, findings, viewportId) {
  await clickNamed(page, 'Save');
  const before = await page.evaluate(() => localStorage.getItem('cfcg.v05.web.save'));
  if (!before) {
    finding(findings, 'P0', 'save', 'Save wrote no localStorage payload', { viewport: viewportId });
    return;
  }
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-screen]', { timeout: 20000 });
  const afterBoot = await page.evaluate(() => localStorage.getItem('cfcg.v05.web.save'));
  if (afterBoot !== before) finding(findings, 'P0', 'save', 'reload changed the saved payload', { viewport: viewportId });
  await page.evaluate(() => {
    const raw = localStorage.getItem('cfcg.v05.web.save');
    localStorage.setItem('cfcg.v05.web.save.bak', raw);
    localStorage.removeItem('cfcg.v05.web.save');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-screen="home"]', { timeout: 20000 });
  await page.evaluate(() => {
    localStorage.setItem('cfcg.v05.web.save', localStorage.getItem('cfcg.v05.web.save.bak'));
  });
  await clickNamed(page, 'Load');
  const notice = await readText(page);
  if (!/Loaded the save/.test(notice)) finding(findings, 'P0', 'save', 'Load did not confirm the save', { viewport: viewportId });
  const restored = await page.evaluate(() => {
    const text = localStorage.getItem('cfcg.v05.web.save');
    return text ? text.length : 0;
  });
  if (restored < 20) finding(findings, 'P0', 'save', 'loaded save is empty', { viewport: viewportId });
}

async function autoProbe(page, findings, viewportId) {
  const ready = await page.evaluate(() => {
    const toggle = document.querySelector('button.auto-toggle');
    return toggle ? toggle.dataset.auto : null;
  });
  if (!ready) {
    finding(findings, 'P0', 'auto', 'AUTO toggle missing on battle', { viewport: viewportId });
    return;
  }
  if (ready !== 'off') finding(findings, 'P1', 'auto', `AUTO did not start off (${ready})`, { viewport: viewportId });
  const before = await page.evaluate(() => window.__cfcg.phase());
  await page.evaluate(() => {
    window.__cfcg.setAutoDelay(0);
    document.querySelector('button.auto-toggle')?.click();
  });
  try {
    await page.waitForFunction((initial) => {
      const toast = document.querySelector('.toast');
      const moved = window.__cfcg.phase() !== initial || document.querySelector('[data-screen="rewards"]');
      const line = toast && /plays|End turn|Toss|Discard|Auto/.test(toast.textContent || '');
      return moved || line;
    }, before, { timeout: 15000 });
  } catch {
    finding(findings, 'P0', 'auto', 'AUTO produced no action within 15s', { viewport: viewportId });
  }
  await page.evaluate(() => {
    if (window.__cfcg.autoEnabled() && document.querySelector('button.auto-toggle')) {
      document.querySelector('button.auto-toggle').click();
    }
  });
  await page.waitForTimeout(150);
  if (await page.locator('[data-screen="battle"]').count()) {
    const enabled = await page.evaluate(() => window.__cfcg.autoEnabled());
    if (enabled) finding(findings, 'P1', 'auto', 'AUTO stayed on after the second toggle', { viewport: viewportId });
  }
}

async function installMarks(page) {
  await page.evaluate(() => {
    window.__qaMarks = [];
    const note = () => {
      window.__qaMarks.push({
        t: performance.now(),
        screen: document.querySelector('[data-screen]')?.dataset.screen ?? null,
        turn: document.querySelector('.turn-chip')?.textContent ?? null,
        toast: document.querySelector('.toast')?.textContent ?? null,
      });
    };
    note();
    const observer = new MutationObserver(note);
    observer.observe(document.getElementById('stage'), { subtree: true, childList: true, characterData: true });
    window.__qaObserver = observer;
  });
}

async function playbackSample(browser, preset, delayMs, budgetMs) {
  const viewport = VIEWPORTS.find((item) => item.id === '1280x720');
  const { page, errors } = await openPage(browser, viewport, preset);
  try {
    await page.evaluate((delay) => window.__cfcg.setAutoDelay(delay), delayMs);
    await clickNamed(page, 'World Map');
    await clickNamed(page, 'Mysterious Tower');
    await page.waitForSelector('[data-screen="prep"]');
    await installMarks(page);
    const started = Date.now();
    await page.locator('button.prep-start').click();
    await page.waitForSelector('[data-screen="battle"], [data-screen="rewards"]', { timeout: 15000 });
    if (await page.locator('[data-screen="battle"]').count()) {
      await page.evaluate(() => document.querySelector('button.auto-toggle')?.click());
      try {
        await page.waitForSelector('[data-screen="rewards"]', { timeout: budgetMs });
      } catch {
        // budget elapsed; record the partial fight
      }
      if (await page.locator('button.auto-toggle').count() && await page.evaluate(() => window.__cfcg.autoEnabled())) {
        await page.locator('button.auto-toggle').click();
      }
    }
    const elapsedMs = Date.now() - started;
    const marks = await page.evaluate(() => window.__qaMarks ?? []);
    const toasts = [];
    for (const mark of marks) {
      if (!mark.toast || mark.toast === toasts.at(-1)?.toast) continue;
      toasts.push(mark);
    }
    const gaps = [];
    for (let index = 1; index < toasts.length; index += 1) gaps.push(toasts[index].t - toasts[index - 1].t);
    gaps.sort((a, b) => a - b);
    const median = gaps.length ? gaps[Math.floor(gaps.length / 2)] : null;
    const turns = [...new Set(marks.map((mark) => mark.turn).filter(Boolean))];
    return {
      preset: preset ?? 'current',
      delayMs,
      elapsedMs,
      reachedRewards: marks.some((mark) => mark.screen === 'rewards') || (await page.locator('[data-screen="rewards"]').count()) > 0,
      toastChanges: toasts.length,
      medianToastGapMs: median == null ? null : Number(median.toFixed(1)),
      distinctTurns: turns.length,
      lastTurn: turns.at(-1) ?? null,
      pageErrors: errors,
    };
  } finally {
    await page.close();
  }
}

async function sampleFps(page) {
  return page.evaluate(() => new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();
    function tick(now) {
      frames += 1;
      if (now - start >= 1000) {
        resolve({ frames, ms: Number((now - start).toFixed(1)), fps: Number((frames / ((now - start) / 1000)).toFixed(1)) });
      } else requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }));
}

async function heap(page) {
  const session = await page.context().newCDPSession(page);
  await session.send('Performance.enable');
  const { metrics } = await session.send('Performance.getMetrics');
  const pick = (name) => metrics.find((metric) => metric.name === name)?.value ?? null;
  return {
    jsHeapUsedSize: pick('JSHeapUsedSize'),
    jsHeapTotalSize: pick('JSHeapTotalSize'),
    nodes: pick('Nodes'),
  };
}

async function firstLoad(page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    return {
      durationMs: nav ? Number(nav.duration.toFixed(1)) : null,
      domContentLoadedMs: nav ? Number(nav.domContentLoadedEventEnd.toFixed(1)) : null,
      loadEventMs: nav ? Number(nav.loadEventEnd.toFixed(1)) : null,
      resourceCount: resources.length,
      transferSize: resources.reduce((total, entry) => total + (entry.transferSize || 0), 0) + (nav?.transferSize || 0),
      decodedBodySize: resources.reduce((total, entry) => total + (entry.decodedBodySize || 0), 0) + (nav?.decodedBodySize || 0),
    };
  });
}

async function coverViewport(browser, viewport, findings, screenshots) {
  const { page, errors } = await openPage(browser, viewport, null);
  const record = async (name) => {
    await settle(page);
    screenshots.push(await shot(page, viewport.id, name));
  };
  try {
    await record('home');
    let geo = await geometry(page);
    judgeGeometry(findings, viewport.id, 'home', geo);
    if (viewport.id === '1280x720') {
      findings.load = findings.load;
    }
    await clickNamed(page, 'Stash');
    await page.waitForSelector('[data-screen="stash"]');
    await record('stash-avatars');
    geo = await geometry(page);
    judgeGeometry(findings, viewport.id, 'stash', geo);
    await clickNamed(page, 'Actions');
    await record('stash-actions');
    await clickNamed(page, 'TEST tokens');
    await record('stash-tokens');
    await clickNamed(page, 'Back');
    await clickNamed(page, 'Team & Deck');
    await page.waitForFunction(() => document.body.innerText.includes('Team & Deck'));
    await record('party');
    await clickNamed(page, 'Action deck');
    await record('party-deck');
    await clickNamed(page, 'Back');
    await gachaLedger(page, findings, viewport.id, screenshots);
    await clickNamed(page, 'Back');
    await clickNamed(page, 'World Map');
    await page.waitForFunction(() => document.body.innerText.includes('World Map'));
    await record('map');
    geo = await geometry(page);
    judgeGeometry(findings, viewport.id, 'map', geo);
    await clickNamed(page, 'Shopping Mall');
    await page.waitForSelector('[data-screen="mall"]');
    await record('mall');
    await clickNamed(page, 'Back to the Map');
    await page.waitForFunction(() => document.body.innerText.includes('World Map'));
    await clickNamed(page, 'Mysterious Tower');
    await page.waitForSelector('[data-screen="prep"]');
    await record('prep');
    geo = await geometry(page);
    judgeGeometry(findings, viewport.id, 'prep', geo);
    const prepText = await readText(page);
    if (!/PREP BATTLE/.test(prepText) || !/START BATTLE/.test(prepText)) {
      finding(findings, 'P0', 'navigation', 'prep screen missing PREP BATTLE or START BATTLE', { viewport: viewport.id });
    }
    await page.locator('button.prep-start').click();
    await page.waitForSelector('[data-screen="battle"]', { timeout: 15000 });
    await record('battle');
    geo = await geometry(page);
    judgeGeometry(findings, viewport.id, 'battle', geo);
    await autoProbe(page, findings, viewport.id);
    await record('battle-auto');
    await page.evaluate(() => window.__cfcg.rewards());
    await page.waitForSelector('[data-screen="rewards"]', { timeout: 20000 });
    await record('rewards');
    const rewardText = await readText(page);
    if (!/Victory|Defeat|nap/.test(rewardText)) finding(findings, 'P1', 'results', 'rewards screen has no result copy', { viewport: viewport.id });
    if (!/PENDING/.test(rewardText)) finding(findings, 'P2', 'results', 'rewards screen did not keep pending loot visible', { viewport: viewport.id });
    await clickNamed(page, 'Back to the Hideout');
    await page.waitForSelector('[data-screen="home"]');
    await clickNamed(page, 'World Map');
    await page.waitForFunction(() => document.body.innerText.includes('World Map'));
    await record('map-after-rewards');
    await clickNamed(page, 'Hideout');
    await page.waitForSelector('[data-screen="home"]');
    await clickNamed(page, 'Companion room');
    await record('companion');
    await clickNamed(page, 'Back away');
    await saveRoundTrip(page, findings, viewport.id);
    await record('home-after-load');
    if (errors.length) finding(findings, 'P0', 'crash', errors.join(' | '), { viewport: viewport.id });
  } finally {
    await page.close();
  }
}

async function main() {
  const chromium = loadChromium();
  const chrome = ['/usr/bin/google-chrome', '/usr/local/bin/google-chrome', '/usr/bin/chromium'].find((file) => existsSync(file));
  if (!chrome) throw new Error('chrome not found');
  const server = startServer(PORT);
  const findings = [];
  const screenshots = [];
  let browser;
  try {
    await waitForServer(PORT);
    browser = await chromium.launch({
      executablePath: chrome,
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-precise-memory-info'],
    });
    const perfPage = await openPage(browser, VIEWPORTS.find((item) => item.id === '1280x720'), null);
    const load = await firstLoad(perfPage.page);
    const fpsHome = await sampleFps(perfPage.page);
    const heapHome = await heap(perfPage.page);
    await perfPage.page.evaluate(() => window.__cfcg.battle());
    await perfPage.page.waitForSelector('[data-screen="battle"]');
    const fpsBattle = await sampleFps(perfPage.page);
    const heapBattle = await heap(perfPage.page);
    await perfPage.page.close();
    for (const viewport of VIEWPORTS) {
      try {
        await coverViewport(browser, viewport, findings, screenshots);
      } catch (error) {
        finding(findings, 'P0', 'harness', error instanceof Error ? error.message : String(error), { viewport: viewport.id });
      }
    }
    const portrait = { id: '390x844-portrait', width: 390, height: 844 };
    const portraitPage = await openPage(browser, portrait, null);
    screenshots.push(await shot(portraitPage.page, portrait.id, 'rotate-overlay'));
    const overlayVisible = await portraitPage.page.locator('#rotate-overlay').isVisible();
    if (!overlayVisible) finding(findings, 'P1', 'navigation', 'portrait 390x844 did not show the rotate overlay');
    await portraitPage.page.close();
    const playback = [];
    playback.push(await playbackSample(browser, null, 640, 12000));
    playback.push(await playbackSample(browser, null, 0, 90000));
    playback.push(await playbackSample(browser, 'flat_atk', 0, 90000));
    const normal = playback.find((row) => row.delayMs === 640);
    const report = {
      generatedAt: new Date().toISOString(),
      chrome,
      viewports: VIEWPORTS,
      screenshots,
      findings,
      performance: { load, fpsHome, fpsBattle, heapHome, heapBattle },
      playback,
      playbackMsPerFrame: normal?.medianToastGapMs ?? null,
    };
    const dir = artifactDir();
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 'ui-coverage.json');
    writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
    const counts = findings.reduce((bag, item) => {
      bag[item.severity] = (bag[item.severity] ?? 0) + 1;
      return bag;
    }, {});
    process.stdout.write(`${JSON.stringify({ file, screenshots: screenshots.length, counts, playback }, null, 2)}\n`);
  } finally {
    await browser?.close();
    server.kill();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exit(1);
  });
}
