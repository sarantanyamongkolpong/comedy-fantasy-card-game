import { bindImage, findAsset, loadManifest } from './assets.js';
import { loadGameApi } from './game-api.js';
import { designSize } from './map-layout.js';
import { emptySelection } from './battle-flow.js';
import { el, modal } from './dom.js';
import { createStarterProfile, buildMatchInput } from './profile.js';
import { isPortrait, stageLayout } from './stage.js';
import { renderBattle } from './screens/battle.js';
import { performPull, renderGacha } from './screens/gacha.js';
import { renderHome } from './screens/home.js';
import { renderMap } from './screens/map.js';
import { renderParty } from './screens/party.js';
import { renderRewards } from './screens/rewards.js';
import { renderStash } from './screens/stash.js';

const SAVE_KEY = 'cfcg.v05.web.save';

const state = {
  screen: 'home',
  manifest: null,
  api: null,
  profile: null,
  notice: '',
  modal: null,
  previewTier: null,
  stashFilter: 'avatars',
  detail: null,
  partyTab: 'team',
  replacing: null,
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

function hydrate(profile) {
  profile.tokens ??= [];
  profile.claimedRewardIds ??= [];
  profile.banners ??= {};
  profile.seq ??= 1;
  profile.companion ??= { status: 'PLACEHOLDER' };
  profile.storage ??= { status: 'PENDING', rule: 'HOME-11', installed: [] };
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
  const payload = state.api.serialize(state.profile);
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
    state.profile = hydrate(state.api.deserialize(text));
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
    detail: state.detail,
    partyTab: state.partyTab,
    replacing: state.replacing,
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
    setDetail(detail) { state.detail = detail; render(); },
    setPartyTab(tab) { state.partyTab = tab; state.replacing = null; render(); },
    setReplacing(index) { state.replacing = index; render(); },
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
  state.screen = state.api.getOutcome(match).status === 'decided' ? 'rewards' : 'battle';
  state.notice = mode === 'arena'
    ? 'Arena practice. The opponent is an echo, not a second player.'
    : 'The tower clears its throat. The opponent is a practice echo.';
  render();
}

function render() {
  const stage = document.getElementById('stage');
  const ctx = makeCtx();
  let view;
  if (state.screen === 'stash') view = renderStash(ctx);
  else if (state.screen === 'party') view = renderParty(ctx);
  else if (state.screen === 'gacha') view = renderGacha(ctx);
  else if (state.screen === 'map') view = renderMap(ctx);
  else if (state.screen === 'battle' && state.match) view = renderBattle(ctx);
  else if (state.screen === 'rewards' && state.match) view = renderRewards(ctx);
  else view = renderHome(ctx);
  stage.replaceChildren(view);
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
    if (text) stored = hydrate(state.api.deserialize(text));
  } catch {
    stored = null;
  }
  state.profile = stored ?? createStarterProfile(state.api.catalog);
  ensureBanners();
  mountRotateArt();
  applyStage();
  window.addEventListener('resize', applyStage);
  render();
}

main().then(() => {
  window.__cfcg = {
    screen(name) {
      state.screen = name;
      state.modal = null;
      state.notice = '';
      render();
    },
    battle() { startBattle('tower'); },
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
