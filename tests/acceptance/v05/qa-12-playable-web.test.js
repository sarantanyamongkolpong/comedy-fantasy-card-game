import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { repoPath } from './helpers/load-api.js';
import { buildMatch } from './helpers/match.js';
import { asState, duplicateRewardIds, playCard, readOutcome } from './helpers/state.js';

const webRoot = repoPath('web');
const webLanded = existsSync(join(webRoot, 'js', 'stage.js')) && existsSync(join(webRoot, 'assets-manifest.json'));
const engineLanded = existsSync(repoPath('src', 'engine', 'index.js'))
  && existsSync(repoPath('src', 'gacha', 'index.js'))
  && existsSync(repoPath('src', 'save', 'index.js'));

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const SHELLS = [
  { width: 667, height: 375 },
  { width: 844, height: 390 },
  { width: 1280, height: 720 },
];

if (!webLanded) {
  test.todo('OWNER-PLAT-04 building sprite boxes stay inside the 1672x941 canvas — web/ not landed (stream C)');
  test.todo('OWNER-PLAT-01 OWNER-PLAT-02 landscape shell 667x375 844x390 1280x720 — web/ not landed (stream C)');
  test.todo('OWNER-PLAT-03 manifest wiring lists every web image ref — web/ not landed (stream C)');
} else {
  const manifest = JSON.parse(readFileSync(join(webRoot, 'assets-manifest.json'), 'utf8'));
  const stage = await import(pathToFileURL(join(webRoot, 'js', 'stage.js')).href);
  const mapLayout = await import(pathToFileURL(join(webRoot, 'js', 'map-layout.js')).href);

  test('OWNER-PLAT-04 building sprite boxes stay inside the 1672x941 canvas', () => {
    const canvas = mapLayout.designSize(manifest);
    assert.equal(canvas.width, 1672);
    assert.equal(canvas.height, 941);
    assert.equal(stage.DESIGN_WIDTH, 1672);
    assert.equal(stage.DESIGN_HEIGHT, 941);
    const boxes = mapLayout.buildingHotspots(manifest);
    assert.equal(boxes.length, 6);
    for (const box of boxes) {
      assert.equal(
        mapLayout.rectInsideCanvas({ x: box.x, y: box.y, w: box.w, h: box.h }, canvas),
        true,
        `${box.assetId} box ${box.x},${box.y} ${box.w}x${box.h} leaves the 1672x941 canvas`,
      );
    }
    for (const anchor of mapLayout.uiAnchors(manifest)) {
      assert.equal(
        mapLayout.rectInsideCanvas(anchor, canvas),
        true,
        `${anchor.id} leaves the canvas`,
      );
    }
  });

  test('OWNER-PLAT-01 OWNER-PLAT-02 landscape shell 667x375 844x390 1280x720', () => {
    for (const viewport of SHELLS) {
      assert.equal(stage.isPortrait(viewport), false, `${viewport.width}x${viewport.height}`);
      const layout = stage.stageLayout(viewport);
      const expected = Math.min(viewport.width / 1672, viewport.height / 941);
      assert.ok(Math.abs(layout.scale - expected) < 1e-9);
      assert.equal(layout.designWidth, 1672);
      assert.equal(layout.designHeight, 941);
      assert.ok(layout.stageW <= viewport.width + 0.51);
      assert.ok(layout.stageH <= viewport.height + 0.51);
      assert.ok(layout.offsetX >= -0.51);
      assert.ok(layout.offsetY >= -0.51);
      const bars = stage.barKind(layout);
      assert.equal(bars.pillarbox && bars.letterbox, false);
    }
    assert.equal(stage.isPortrait({ width: 390, height: 844 }), true);
    const html = readFileSync(join(webRoot, 'index.html'), 'utf8');
    const css = readFileSync(join(webRoot, 'css', 'app.css'), 'utf8');
    assert.match(html, /id="rotate-overlay"/);
    assert.match(css, /#rotate-overlay\s*\{[^}]*display:\s*none/);
    assert.match(css, /orientation:\s*portrait/);
  });

  test('OWNER-PLAT-03 manifest wiring lists every web image ref', () => {
    const listed = new Set((manifest.assets ?? []).map((asset) => asset.path).filter(Boolean));
    assert.ok(listed.size > 0);
    const sources = walk(webRoot).filter((file) => /\.(html|css|js|mjs)$/.test(file));
    for (const file of sources) {
      const text = readFileSync(file, 'utf8');
      assert.equal(text.includes('data:image'), false, file);
      const refs = text.match(/[\w./-]+\.(?:png|webp|gif|jpe?g|svg)/gi) ?? [];
      for (const ref of refs) {
        const name = ref.split('/').pop();
        const hit = [...listed].some((path) => path.endsWith(name) || path.endsWith(ref));
        assert.equal(hit, true, `${file} references ${ref} outside assets-manifest.json`);
      }
    }
  });
}

if (!webLanded || !engineLanded) {
  test.todo('QA-10 real-engine Deck Battle Rewards win and lose — web/ and src/engine are not both on this checkout');
  test.todo('QA-10 GA-11 web gacha banners must satisfy src/gacha — web/ and src/gacha are not both on this checkout');
  test.todo('QA-10 GA-11 web pull seed must be an integer — web/js/screens/gacha.js not landed');
  test.todo('QA-10 save load reload restores the player profile — web/ and src/save are not both on this checkout');
} else {
  const gameApi = await import(pathToFileURL(join(webRoot, 'js', 'game-api.js')).href);
  const profileMod = await import(pathToFileURL(join(webRoot, 'js', 'profile.js')).href);

  test('QA-10 real-engine Deck Battle Rewards win and lose', async () => {
    const api = await gameApi.loadGameApi();
    assert.equal(api.source, 'engine');
    assert.equal(api.productionReady, false);
    assert.equal(typeof api.playEnemyTurn, 'function', 'the web adapter must expose playEnemyTurn from the engine');

    let won = asState(api.createMatch(buildMatch({ damageSide: 'player', enemyHp: 1 })));
    won = playCard(api, won, 'player', 'ACT_DMG_ALL', 'AVT_PHA_002').state;
    const win = readOutcome(api, won);
    assert.equal(win.result, 'win');
    assert.equal(win.winningSideId, 'player');
    assert.equal(win.losingSideId, 'enemy');
    assert.equal(win.rewards.length, 1);
    assert.deepEqual(duplicateRewardIds(win.rewards), []);
    assert.deepEqual(readOutcome(api, won), win);

    let lost = asState(api.createMatch(buildMatch({ damageSide: 'enemy', playerHp: 1 })));
    assert.equal(lost.activeSideId, 'enemy');
    const card = api.getZones(lost, 'enemy').hand.find((entry) => entry.cardId === 'ACT_DMG_ALL');
    assert.ok(card, 'enemy opening hand is missing ACT_DMG_ALL');
    lost = asState(api.playAction(lost, {
      cardInstanceId: card.instanceId,
      actorAvatarId: lost.sides.enemy.avatars[0].avatarId,
      targets: [],
    }), lost);
    const lose = readOutcome(api, lost);
    assert.equal(lose.result, 'lose');
    assert.equal(lose.winningSideId, 'enemy');
    assert.equal(lose.losingSideId, 'player');
    assert.equal(lose.rewards.length, 1);
    assert.deepEqual(readOutcome(api, lost).rewards, lose.rewards);
  });

  test('QA-10 GA-11 web gacha banners must satisfy src/gacha', async () => {
    const api = await gameApi.loadGameApi();
    assert.equal(api.source, 'engine');
    assert.ok(api.catalog.banners.length >= 3);
    for (const banner of api.catalog.banners) {
      let state;
      try {
        state = api.createBannerState(banner);
      } catch (error) {
        assert.fail(`${banner.bannerId} was rejected by src/gacha: ${error.message}`);
      }
      const pulled = api.pull(state, { seed: 20261120, count: 1 });
      assert.equal(pulled.pulls.length, 1);
    }
  });

  test('QA-10 GA-11 web pull seed must be an integer', () => {
    const source = readFileSync(join(webRoot, 'js', 'screens', 'gacha.js'), 'utf8');
    const seedLine = source.split('\n').find((line) => line.includes('seed:'));
    assert.ok(seedLine, 'performPull must pass seed');
    assert.equal(seedLine.includes('`'), false, `pull() requires an integer seed; web passes ${seedLine.trim()}`);
  });

  test('QA-10 save load reload restores the player profile', async () => {
    const api = await gameApi.loadGameApi();
    const profile = profileMod.createStarterProfile(api.catalog);
    assert.equal(profile.deck.length, 30);
    assert.equal(profile.team.length, 4);
    const raw = api.serialize(profile);
    const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
    const loaded = api.deserialize(text);
    assert.deepEqual(loaded.team, profile.team);
    assert.deepEqual(loaded.deck, profile.deck);
    const again = api.deserialize(api.serialize(loaded));
    assert.deepEqual(again.team, profile.team);
    assert.deepEqual(again.deck, profile.deck);
  });
}
