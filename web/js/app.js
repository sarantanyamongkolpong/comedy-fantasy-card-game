import { presentBattleEvents, presentOutcome } from './present/battle-present.js';
import { actionCaption, autoDelayMs, fightSignature, speedChoices } from './auto-play.js';
import { bindImage, findAsset, loadManifest } from './assets.js';
import { loadGameApi } from './game-api.js';
import { designSize } from './map-layout.js';
import { emptySelection } from './battle-flow.js';
import { el, modal } from './dom.js';
import { createStarterProfile, buildMatchInput } from './profile.js';
import { isPortrait, stageLayout } from './stage.js';
import { applyBattlePolish } from './battle-fx/polish.js';
import { renderBattle } from './screens/battle.js';
import { performPull } from './screens/gacha.js';
// AGENT D hook (prod/d-gacha): booth visuals live in web/js/gacha-fx. Pulls stay on the existing API.
import { renderGachaFx } from './gacha-fx/screen.js';
import { renderHome } from './screens/home.js';
import { renderMall } from './screens/mall.js';
import { renderMap } from './screens/map.js';
import { renderParty } from './screens/party.js';
import { renderPrep } from './screens/prep.js';
import { renderRewards } from './screens/rewards.js';
// HOOK prod/c-inventory: Stash, Inventory, Collection, Deck Builder, and Card Detail.
import { collectionRoute, renderCollection } from './collection/index.js';

const SAVE_KEY = 'cfcg.v05.web.save';

const state = {
  screen: 'map', // Owner 2026-11-21: the game starts on the World Map.
  manifest: null,
  api: null,
  profile: null,
  notice: '',
  modal: null,
  previewTier: null,
  stashFilter: 'avatars',
  stashSort: 'name',
  detail: null,
  partyTab: 'team',
  replacing: null,
  prepIndex: null,
  autoRunning: false,
  autoDelayOverride: null,
  gachaBannerId: null,
  gachaResults: [],
  match: null,
  battleUi: freshBattleUi(),
};

function freshBattleUi() {
  return {
    selection: emptySelection(),
    discardIds: [],
    pile: null,
    confirm: null,
    voluntary: false,
  };
}

function acceptSave(data) {
  if (data && data.webBundle) return data;
  return { webBundle: false, profile: data, match: null, screen: null, battleUi: null };
}

function hydrate(profile) {
  profile.tokens ??= [];
  profile.claimedRewardIds ??= [];
  profile.banners ??= {};
  profile.seq ??= 1;
  profile.companion ??= { status: 'PLACEHOLDER' };
  profile.house ??= { tierId: 'cabin', tierName: 'Cabin', rule: 'HOME-01', status: 'LOCKED' };
  profile.house.installedFurniture ??= [];
  profile.storage ??= { status: 'PENDING', rule: 'HOME-11', installed: [] };
  profile.autoPlay ??= { enabled: false, speed: 'normal' };
  if (typeof profile.autoPlay.speed !== 'string' || profile.autoPlay.speed.length === 0) profile.autoPlay.speed = 'normal';
  profile.autoPlay.enabled = profile.autoPlay.enabled === true;
  return profile;
}

function ensureBanners() {
  for (const banner of state.api.catalog.banners) {
    const current = state.profile.banners[banner.bannerId];
    if (!current || current.bannerId !== banner.bannerId) {
      state.profile.banners[banner.bannerId] = state.api.createBannerState(banner);
    }
  }
}

function readSafeArea() {
  const probe = document.getElementById('safe-probe');
  const style = getComputedStyle(probe);
  return {
    top: parseFloat(style.paddingTop) || 0,
    right: parseFloat(style.paddingRight) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
    left: parseFloat(style.paddingLeft) || 0,
  };
}

function applyStage() {
  const design = designSize(state.manifest);
  const layout = stageLayout(
    { width: window.innerWidth, height: window.innerHeight },
    readSafeArea(),
    design,
  );
  const stage = document.getElementById('stage');
  stage.style.width = `${design.width}px`;
  stage.style.height = `${design.height}px`;
  stage.style.transform = `translate(${layout.offsetX}px, ${layout.offsetY}px) scale(${layout.scale})`;
  const portrait = isPortrait({ width: window.innerWidth, height: window.innerHeight });
  document.body.classList.toggle('is-portrait', portrait);
}

function persist(announce) {
  const payload = state.api.serialize({
    profile: state.profile,
    match: state.match,
    screen: state.screen,
    battleUi: state.battleUi,
  });
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  localStorage.setItem(SAVE_KEY, text);
  if (announce) {
    state.notice = 'Saved in this browser.';
    render();
  }
}

function loadSave() {
  const text = localStorage.getItem(SAVE_KEY);
  if (!text) {
    state.notice = 'No save in this browser yet.';
    render();
    return;
  }
  try {
    const loaded = acceptSave(state.api.deserialize(text));
    state.profile = hydrate(loaded.profile);
    if (loaded.match) {
      state.match = loaded.match;
      state.battleUi = loaded.battleUi ?? freshBattleUi();
      if (loaded.screen === 'battle' || loaded.screen === 'rewards' || loaded.screen === 'prep') state.screen = loaded.screen;
    }
    ensureBanners();
    state.notice = 'Loaded the save from this browser.';
  } catch (error) {
    state.notice = error instanceof Error ? error.message : 'That save would not open.';
  }
  render();
}

function makeCtx() {
  return {
    screen: state.screen,
    manifest: state.manifest,
    api: state.api,
    profile: state.profile,
    notice: state.notice,
    modal: state.modal,
    previewTier: state.previewTier,
    stashFilter: state.stashFilter,
    stashSort: state.stashSort,
    detail: state.detail,
    partyTab: state.partyTab,
    replacing: state.replacing,
    prepIndex: state.prepIndex,
    prepSite: state.profile.prepSite ?? null,
    autoEnabled: state.profile.autoPlay?.enabled === true,
    autoSpeed: state.profile.autoPlay?.speed || 'normal',
    autoRunning: state.autoRunning,
    gachaBannerId: state.gachaBannerId,
    gachaResults: state.gachaResults,
    match: state.match,
    battleUi: state.battleUi,
    redraw() { render(); },
    persist,
    loadSave,
    goto(screen) {
      state.screen = screen;
      state.modal = null;
      state.notice = '';
      state.detail = null;
      persist(false);
      render();
    },
    setNotice(text) { state.notice = text; },
    setPreviewTier(tierId) { state.previewTier = tierId; render(); },
    setStashFilter(filter) { state.stashFilter = filter; state.detail = null; render(); },
    setStashSort(mode) { state.stashSort = mode; render(); },
    setDetail(detail) { state.detail = detail; render(); },
    setPartyTab(tab) { state.partyTab = tab; state.replacing = null; render(); },
    setReplacing(index) { state.replacing = index; render(); },
    setPrepIndex(index) { state.prepIndex = index; render(); },
    openPrep(site) {
      state.profile.prepSite = { label: site.label, mode: site.mode || 'tower' };
      state.screen = 'prep';
      state.modal = null;
      state.notice = '';
      persist(false);
      render();
    },
    setAuto(enabled) {
      if (state.api.autoAvailable !== true) return;
      state.profile.autoPlay.enabled = enabled === true;
      persist(false);
      render();
      if (state.profile.autoPlay.enabled) startAutoLoop();
    },
    setAutoSpeed(speed) {
      const rules = typeof state.api.dataRules === 'function' ? state.api.dataRules() : null;
      const choices = speedChoices(rules);
      state.profile.autoPlay.speed = choices.includes(speed) ? speed : 'normal';
      persist(false);
      render();
    },
    setGachaResults(results) { state.gachaResults = results; },
    pullBanner(banner, count) { performPull(makeCtx(), banner, count); },
    patchBattle(partial) {
      state.battleUi = { ...state.battleUi, ...partial };
      render();
    },
    startBattle(mode) { startBattle(mode); },
    claimAndLeave() {
      const id = state.match?.rewardId;
      if (id && !state.profile.claimedRewardIds.includes(id)) {
        state.profile.claimedRewardIds.push(id);
      }
      state.match = null;
      state.battleUi = freshBattleUi();
      state.screen = 'home';
      state.notice = 'Back home. That fight will not pay out twice.';
      persist(false);
      render();
    },
    openCompanion() {
      const art = findAsset(state.manifest, { slot: 'illustration', subjectId: 'companion' });
      const body = el('div', 'companion');
      if (art) {
        const img = el('img', 'companion-img');
        img.alt = '';
        bindImage(img, art);
        body.append(img);
      }
      body.append(el('p', null, 'The companion room has a heart-shaped Do Not Disturb sign. Gifts and relationship are for companions only. Avatars do not get a hug mechanic. This room is a placeholder.'));
      state.modal = modal('Companion room', body, [
        { label: 'Back away', onClick: () => { state.modal = null; render(); } },
      ]);
      render();
    },
  };
}

function startBattle(mode) {
  state.profile.seq += 1;
  const seed = state.profile.seq;
  const input = buildMatchInput(state.profile, state.api.catalog, { seed, mode });
  input.config = state.api.defaultRuleConfig();
  const match = state.api.createMatch(input);
  match.rewardId = `fight:${mode}:${seed}`;
  if (match.phase === 'enemyTurn' && typeof state.api.playEnemyTurn === 'function') {
    state.api.playEnemyTurn(match);
  }
  state.match = match;
  state.battleUi = freshBattleUi();
  persist(false);
  state.screen = state.api.getOutcome(match).status === 'decided' ? 'rewards' : 'battle';
  state.notice = mode === 'arena'
    ? 'Arena practice. The opponent is an echo, not a second player.'
    : 'The tower clears its throat. The opponent is a practice echo.';
  render();
  if (state.screen === 'battle' && state.profile.autoPlay?.enabled) startAutoLoop();
}

function paint() {
  const stage = document.getElementById('stage');
  const ctx = makeCtx();
  let view;
  const routed = collectionRoute(state.screen, state.partyTab);
  // HOOK prod/c-inventory: party deck tab uses the collection deck builder.
  if (routed) view = renderCollection(ctx, routed);
  else if (state.screen === 'mall') view = renderMall(ctx);
  else if (state.screen === 'party') view = renderParty(ctx);
  else if (state.screen === 'gacha') view = renderGachaFx(ctx);
  else if (state.screen === 'map') view = renderMap(ctx);
  else if (state.screen === 'prep') view = renderPrep(ctx);
  else if (state.screen === 'battle' && state.match) view = renderBattle(ctx);
  else if (state.screen === 'rewards' && state.match) view = renderRewards(ctx);
  else view = renderHome(ctx);
  if ((state.screen === 'battle' && state.match) || state.screen === 'prep') applyBattlePolish(view, ctx);
  // Owner 2026-11-21: every place except the map and a live battle gets a World Map button that
  // stays on screen (fixed corner), so long panels can never trap the player.
  if (state.screen !== 'map' && !(state.screen === 'battle' && state.match)) {
    const mapBtn = document.createElement('button');
    mapBtn.type = 'button';
    mapBtn.className = 'global-map-button';
    mapBtn.textContent = 'World Map';
    mapBtn.setAttribute('aria-label', 'World Map');
    mapBtn.addEventListener('click', () => ctx.goto('map'));
    view.append(mapBtn);
  }
  swapView(stage, view);
}

// ---- Presentation layer (Owner 2026-11-21, P0 visual playability) ----------------------------
// The engine resolves instantly; render() first replays new engine log rows on the battle that is
// still on screen, shows VICTORY/DEFEAT, then crossfades to the next screen. Engine results are
// never changed. Rapid calls during a presentation are coalesced into one render afterwards.
let paintedScreen = null;
let presenting = null;
let renderAgain = false;
let fadeTimer = null;

function engineLog() {
  return state.match?.engine?.log ?? null;
}

async function waitForImages(view, limitMs) {
  const imgs = [...view.querySelectorAll('img')].filter((img) => img.src && !img.complete);
  if (imgs.length === 0) return;
  await Promise.race([
    Promise.all(imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()))),
    new Promise((resolve) => { setTimeout(resolve, limitMs); }),
  ]);
}

function swapView(stage, view) {
  const changed = paintedScreen !== null && paintedScreen !== state.screen;
  paintedScreen = state.screen;
  if (fadeTimer) {
    clearTimeout(fadeTimer);
    fadeTimer = null;
  }
  if (!changed) {
    stage.replaceChildren(view);
    return;
  }
  // Crossfade: keep the old screen underneath, fade the new one in, then drop the old one.
  for (const old of [...stage.children]) old.classList.add('screen-leaving');
  view.classList.add('screen-entering');
  stage.append(view);
  waitForImages(view, 350).then(() => {
    requestAnimationFrame(() => view.classList.add('is-in'));
    fadeTimer = setTimeout(() => {
      for (const old of [...stage.children]) if (old !== view) old.remove();
      view.classList.remove('screen-entering', 'is-in');
      fadeTimer = null;
    }, 320);
  });
}

function render() {
  if (presenting) {
    renderAgain = true;
    return presenting;
  }
  const log = engineLog();
  const stage = document.getElementById('stage');
  const onBattle = paintedScreen === 'battle' && stage?.querySelector('[data-screen="battle"]');
  const cursor = state.battleUi?.presentedCursor;
  if (onBattle && log && Number.isInteger(cursor) && cursor < log.length) {
    const events = log.slice(cursor);
    state.battleUi.presentedCursor = log.length;
    const root = stage.querySelector('[data-screen="battle"]');
    // The confirm dialog closes as soon as the action is chosen, then the action plays out.
    for (const node of stage.querySelectorAll('.modal')) node.remove();
    root.querySelector('.is-selected')?.classList.remove('is-selected');
    const outcome = state.api.getOutcome(state.match);
    presenting = (async () => {
      try {
        await presentBattleEvents(root, events, {
          engine: state.match.engine,
          speed: state.profile.autoPlay?.speed || 'normal',
        });
        if (outcome.status === 'decided') {
          const won = (outcome.winnerSideId ?? outcome.winner) === 'player';
          await presentOutcome(root, won);
        }
      } finally {
        presenting = null;
        renderAgain = false;
        if (state.battleUi) state.battleUi.logCursor = log.length;
        paintAndTrack();
      }
    })();
    return presenting;
  }
  paintAndTrack();
  return Promise.resolve();
}

function paintAndTrack() {
  paint();
  const log = engineLog();
  if (state.screen === 'battle' && log && state.battleUi) state.battleUi.presentedCursor = log.length;
}

function mountRotateArt() {
  const art = findAsset(state.manifest, { slot: 'ui-icon', subjectId: 'rotate' });
  const img = document.getElementById('rotate-art');
  if (art && img) {
    img.alt = 'A phone turning sideways';
    bindImage(img, art);
  }
}

async function main() {
  state.manifest = await loadManifest();
  state.api = await loadGameApi();
  let stored = null;
  try {
    const text = localStorage.getItem(SAVE_KEY);
    if (text) stored = acceptSave(state.api.deserialize(text));
  } catch {
    stored = null;
  }
  state.profile = hydrate(stored?.profile ?? createStarterProfile(state.api.catalog));
  if (stored?.match) {
    state.match = stored.match;
    state.battleUi = stored.battleUi ?? freshBattleUi();
    if (stored.screen === 'battle' || stored.screen === 'rewards') state.screen = stored.screen;
  }
  // Owner 2026-11-21: outside a saved battle, a new session always opens on the World Map.
  ensureBanners();
  mountRotateArt();
  applyStage();
  window.addEventListener('resize', applyStage);
  window.addEventListener('pagehide', () => persist(false));
  render();
  if (state.screen === 'battle' && state.profile.autoPlay?.enabled) startAutoLoop();
}

let autoToken = 0;

function wait(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function startAutoLoop() {
  if (state.api.autoAvailable !== true || typeof state.api.runAutoTurn !== 'function') return;
  if (state.screen !== 'battle' || !state.match) return;
  const token = ++autoToken;
  state.autoRunning = true;
  render();
    let previous = '';
    let spins = 0;
  try {
    while (token === autoToken && state.profile.autoPlay?.enabled && state.screen === 'battle' && state.match && spins < 2000) {
      spins += 1;
      const outcome = state.api.getOutcome(state.match);
      if (outcome.status === 'decided') {
        state.screen = 'rewards';
        break;
      }
      const signature = fightSignature(state.match);
      if (signature === previous) {
        state.notice = 'Auto returned no change. The turn is yours.';
        state.profile.autoPlay.enabled = false;
        break;
      }
      previous = signature;
      const stop = () => token !== autoToken || state.profile.autoPlay?.enabled !== true;
      if (state.match.phase === 'enemyTurn') {
        const enemy = state.api.playEnemyTurn(state.match);
        const stopped = await animateLog(enemy?.log ?? [], token);
        if (stopped) break;
        continue;
      }
      if (state.match.phase === 'mandatoryDiscard') {
        const logs = [];
        const playerDiscard = state.api.runAutoTurn(state.match, 'player');
        logs.push(...(playerDiscard?.log ?? []));
        if (state.match.phase === 'mandatoryDiscard') {
          const enemyDiscard = state.api.runAutoTurn(state.match, 'enemy');
          logs.push(...(enemyDiscard?.log ?? []));
        }
        const stopped = await animateLog(logs, token);
        if (stopped) break;
        continue;
      }
      const result = state.api.runAutoTurn(state.match, 'player', { maxActions: 1, shouldStop: stop });
      if (result?.reason === 'AUTO_LOADING') {
        state.profile.autoPlay.enabled = false;
        state.notice = 'Auto loading';
        break;
      }
      await animateLog(result?.log ?? [], token);
      if (state.match?.phase === 'enemyTurn') {
        const enemy = state.api.playEnemyTurn(state.match);
        await animateLog(enemy?.log ?? [], token);
      }
      if (token !== autoToken || state.profile.autoPlay?.enabled !== true) break;
    }
    if (state.match && state.api.getOutcome(state.match).status === 'decided') state.screen = 'rewards';
  } finally {
    if (token === autoToken) state.autoRunning = false;
    persist(false);
    render();
  }
}

async function animateLog(log, token) {
  // Owner 2026-11-21: AUTO plays through the same visual queue as manual play.
  if (token !== autoToken || state.screen !== 'battle') return true;
  const first = log.find((entry) => entry && entry.kind !== 'end_turn') ?? log[0];
  if (first) state.notice = actionCaption(first);
  await render();
  const speed = state.profile.autoPlay?.speed || 'normal';
  await wait(Math.min(autoDelayMs(speed, state.autoDelayOverride), speed === 'fast' ? 150 : 300));
  return token !== autoToken || state.profile.autoPlay?.enabled !== true;
}

main().then(() => {
  window.__cfcg = {
    screen(name) {
      state.screen = name;
      state.modal = null;
      state.notice = '';
      render();
    },
    prep(label = 'Mysterious Tower', mode = 'tower') {
      state.profile.prepSite = { label, mode };
      state.screen = 'prep';
      state.notice = '';
      render();
    },
    battle() { startBattle('tower'); },
    installAutoContract(fns) {
      if (typeof fns?.runAutoTurn !== 'function') return;
      state.api.autoAvailable = true;
      const refresh = state.api.refreshMatch;
      state.api.runAutoTurn = (view, sideId = 'player') => {
        const result = fns.runAutoTurn(view.engine, sideId);
        if (result?.state && result.state !== view.engine) view.engine = result.state;
        if (typeof refresh === 'function') refresh(view);
        return { ok: result?.ok !== false, log: result?.log ?? result?.actions ?? [], state: view.engine };
      };
      render();
    },
    setAutoDelay(ms) { state.autoDelayOverride = ms; },
    autoEnabled() { return state.profile.autoPlay?.enabled === true; },
    phase() { return state.match?.phase ?? null; },
    rewards() {
      startBattle('tower');
      const api = state.api;
      let guard = 0;
      while (api.getOutcome(state.match).status !== 'decided' && guard < 80) {
        guard += 1;
        if (state.match.phase === 'mandatoryDiscard') {
          const hand = state.match.zones.player.hand;
          const excess = hand.length - 5;
          api.resolveEndOfRoundDiscard(state.match, hand.slice(-Math.max(excess, 0)).map((card) => card.instanceId));
          continue;
        }
        if (state.match.phase === 'enemyTurn' && typeof api.playEnemyTurn === 'function') {
          api.playEnemyTurn(state.match);
          continue;
        }
        const hand = api.getZones(state.match, 'player').hand;
        const actor = state.match.units.find((unit) => unit.sideId === 'player' && !unit.ko);
        const foe = state.match.units.find((unit) => unit.sideId === 'enemy' && !unit.ko);
        const card = hand.find((entry) => entry.costAp <= state.match.ap.player && entry.targetRule === 'Enemy' && !entry.factionRequirement);
        if (card && actor && foe) {
          api.playAction(state.match, { cardInstanceId: card.instanceId, actorAvatarId: actor.instanceId, targets: [foe.instanceId] });
        } else {
          api.endTurn(state.match);
        }
      }
      state.screen = 'rewards';
      render();
    },
  };
}).catch((error) => {
  const stage = document.getElementById('stage');
  stage.replaceChildren(document.createTextNode(error instanceof Error ? error.message : String(error)));
});
