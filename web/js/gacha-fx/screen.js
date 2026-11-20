/**
 * Gacha booth visuals. Pulls go through the existing web API (same seed
 * formula as web/js/screens/gacha.js). Odds, pity thresholds, and G prices
 * are not set here.
 *
 * Shared-file hook: web/js/app.js renders this instead of screens/gacha.js.
 */

import { integerSeed } from '../../../src/gacha/rng.js';
import { lockedPityPolicy } from '../../../src/gacha/index.js';
import { defaultRuleConfig } from '../../../src/config/index.js';
import { findAsset } from '../assets.js';
import { bindGacha, gachaAssetUrl } from './asset-url.js';
import { button, el, shell } from '../dom.js';
import { applyPull } from '../profile.js';
import { annotateDuplicates, decorateResults } from './duplicates.js';
import { epicPityLabel, pityFraction, pityView, primeBannerCounters, topPityLabel } from './pity-view.js';
import { createRevealDirector, prefersReducedMotion } from './sequence.js';
import { highlightResult, resultLine, summarizeRewards, summaryHeadline } from './summary.js';
import { installGachaFxStyles } from './styles.js';
import { presentationFor, withGachaFragment } from './vfx.js';
import { balanceLabel, chargeLabel, priceLabel, walletView } from './wallet-view.js';

let director = null;
let charging = null;
let chargedG = 0;
let selectedId = null;
let stepMs = 820;

function rules() {
  return defaultRuleConfig();
}

function policyLine() {
  const policy = lockedPityPolicy();
  const top = Array.isArray(policy.topHitResets) ? policy.topHitResets.join(' and ') : String(policy.topHitResets);
  return `${policy.rule} ${policy.status} · per ${policy.counterScope} · Epic hit resets ${policy.epicHitResets} · top hit resets ${top} · companion top pity ${policy.companionTopPity ? 'on' : 'none'}`;
}

function paintPlate(img, presentation) {
  if (!presentation?.plate) return;
  bindGacha(img, presentation.plate, { eager: true });
  if (presentation.blend) img.dataset.blend = presentation.blend;
  if (!presentation.mask) return;
  const url = gachaAssetUrl(presentation.mask);
  img.dataset.edgeMask = presentation.mask.asset_id ?? '';
  img.style.webkitMaskImage = `url("${url}")`;
  img.style.maskImage = `url("${url}")`;
  img.style.webkitMaskSize = '100% 100%';
  img.style.maskSize = '100% 100%';
  img.style.webkitMaskRepeat = 'no-repeat';
  img.style.maskRepeat = 'no-repeat';
  img.style.maskMode = 'alpha';
}

function renderWallet(ctx, banner, manifest) {
  const view = walletView(ctx.profile, banner, 1, chargedG);
  const row = el('div', 'gfx-wallet');
  row.dataset.currency = 'G';
  row.dataset.balance = String(view.balance);
  row.dataset.charged = String(chargedG);
  row.dataset.costStatus = view.costStatus;
  row.setAttribute('role', 'status');
  row.setAttribute('aria-label', `${balanceLabel(view)}. ${chargeLabel(chargedG)}. ${priceLabel(view)}.`);
  const coin = findAsset(manifest, { slot: 'ui-icon', subjectId: 'g' });
  if (coin) {
    const img = el('img', 'g-coin');
    img.alt = '';
    bindGacha(img, coin, { eager: true });
    row.append(img);
  }
  const balance = el('p', 'gfx-balance');
  balance.append(document.createTextNode('Balance '));
  const amount = el('strong', null, balanceLabel(view));
  amount.dataset.gBalance = String(view.balance);
  balance.append(amount);
  const spend = el('p', 'gfx-spend');
  spend.dataset.gCharge = String(chargedG);
  spend.textContent = `${chargeLabel(chargedG)} · ${priceLabel(view)}`;
  row.append(balance, spend);
  return row;
}

function renderPity(pool, state) {
  const view = pityView(pool, state, rules());
  const wrap = el('div', 'gfx-pity');
  const epic = el('p', 'gfx-pity-line');
  epic.dataset.pity = 'epic';
  epic.dataset.value = String(view.epic.value);
  epic.dataset.max = String(view.epic.max);
  epic.dataset.rule = view.epic.rule;
  epic.textContent = epicPityLabel(view);
  const epicTrack = el('span', 'gfx-pity-track');
  const epicFill = el('span', 'gfx-pity-fill');
  epicFill.style.transform = `scaleX(${pityFraction(view.epic.value, view.epic.max)})`;
  epicTrack.append(epicFill);
  epic.append(epicTrack);
  wrap.append(epic);
  const top = el('p', 'gfx-pity-line');
  top.dataset.pity = 'top';
  top.dataset.rule = view.top?.rule ?? 'GA-10';
  if (view.top) {
    top.dataset.value = String(view.top.value);
    top.dataset.max = String(view.top.max);
    const track = el('span', 'gfx-pity-track');
    const fill = el('span', 'gfx-pity-fill');
    fill.style.transform = `scaleX(${pityFraction(view.top.value, view.top.max)})`;
    track.append(fill);
    top.append(document.createTextNode(topPityLabel(view)), track);
  } else {
    top.dataset.value = 'none';
    top.dataset.max = 'none';
    top.textContent = topPityLabel(view);
  }
  wrap.append(top);
  return wrap;
}

function pullAndPresent(ctx, banner, count) {
  const state = ctx.profile.banners?.[banner.bannerId];
  if (!state) {
    ctx.setNotice('That booth has no banner state yet.');
    ctx.redraw();
    return;
  }
  const seed = integerSeed(['gacha', banner.bannerId, ctx.profile.seq, count].join(':'));
  const outcome = ctx.api.pull(state, {
    seed,
    count,
    catalog: ctx.api.catalog,
  });
  const decorated = decorateResults(outcome.results ?? [], outcome.pulls ?? []);
  const annotated = annotateDuplicates(ctx.profile, decorated);
  ctx.profile.banners[banner.bannerId] = outcome.state;
  for (const result of annotated) applyPull(ctx.profile, result);
  ctx.setGachaResults(annotated);
  const reported = Number.isInteger(outcome.chargedG)
    ? outcome.chargedG
    : (Number.isInteger(outcome.spent?.amount) ? outcome.spent.amount : 0);
  chargedG = banner.pool === 'companion' ? 0 : reported;
  selectedId = banner.bannerId;
  ctx.setNotice(`TEST pull ×${count}. G charged: ${chargedG} because the price is PENDING.`);
  ctx.persist(false);
  director?.cancel();
  director = createRevealDirector(annotated, {
    reducedMotion: prefersReducedMotion(),
    stepMs,
    isAlive: () => typeof document !== 'undefined' && document.querySelector('.gfx-gacha') != null,
    onStep: () => ctx.redraw(),
    onDone: () => ctx.redraw(),
    manual: true,
  });
  // Owner 2026-11-21: the machine charges and summons before the first card, and each card
  // waits for the player (Next) so a x10 pull can be read card by card.
  charging = { count, bannerId: banner.bannerId };
  ctx.redraw();
  setTimeout(() => {
    charging = null;
    director?.start();
    ctx.redraw();
  }, 1400);
}

function renderBanners(ctx, banners, manifest) {
  const row = el('div', 'banner-row');
  for (const banner of banners) {
    const state = ctx.profile.banners?.[banner.bannerId];
    const selected = banner.bannerId === selectedId;
    const card = el('article', `banner${selected ? ' is-selected' : ''}`);
    card.dataset.bannerId = banner.bannerId;
    card.dataset.pool = banner.pool;
    card.addEventListener('click', () => {
      if (selectedId === banner.bannerId) return;
      selectedId = banner.bannerId;
      ctx.redraw();
    });
    const machine = findAsset(manifest, { slot: 'gacha-machine', subjectId: banner.pool });
    if (machine) {
      const img = el('img', 'gacha-machine');
      img.alt = '';
      bindGacha(img, machine);
      card.append(img);
    }
    card.append(el('h2', null, banner.name || banner.bannerId));
    card.append(el('p', 'badge', 'TEST CONFIG'));
    card.append(el('p', null, `Pool: ${banner.pool}`));
    card.append(renderPity(banner.pool, state));
    const cost = walletView(ctx.profile, banner, 1, 0);
    card.append(el('p', 'fine', priceLabel(cost)));
    const weights = (banner.weights ?? banner.entries ?? state?.weights ?? [])
      .map((entry) => `${entry.rarity} ${entry.weight}`)
      .join(' · ');
    card.append(el('p', 'fine', `TEST weights: ${weights}`));
    if (state) card.append(el('p', 'fine', `Pulls on this banner: ${state.pulls ?? 0}`));
    const actions = el('div', 'row');
    const pull = (count, event) => {
      event.stopPropagation();
      pullAndPresent(ctx, banner, count);
    };
    actions.append(button('Pull 1', (event) => pull(1, event), 'hit slim'));
    actions.append(button('Pull 10', (event) => pull(10, event), 'hit slim'));
    card.append(actions);
    row.append(card);
  }
  return row;
}

function renderSummaryBlock(ctx, manifest) {
  const results = ctx.gachaResults ?? [];
  const summary = summarizeRewards(results, chargedG);
  const log = el('section', 'pull-log gfx-summary');
  const head = el('div', 'gfx-summary-head');
  const best = highlightResult(results);
  if (best) {
    const presentation = presentationFor(best.rarity, manifest);
    if (presentation.plate) {
      const thumb = el('img', 'gfx-thumb');
      thumb.alt = '';
      paintPlate(thumb, presentation);
      head.append(thumb);
    }
  }
  const copy = el('div');
  copy.append(el('h2', null, 'Latest TEST pull'));
  const headline = el('p', 'gfx-headline', summaryHeadline(summary));
  headline.dataset.fresh = String(summary.fresh);
  headline.dataset.duplicates = String(summary.duplicates);
  copy.append(headline);
  head.append(copy);
  log.append(head);
  const counts = el('ul', 'gfx-counts');
  for (const [rarity, count] of Object.entries(summary.byRarity)) {
    const item = el('li', null, `${rarity} ${count}`);
    item.dataset.rarity = rarity;
    counts.append(item);
  }
  log.append(counts);
  const mark = findAsset(manifest, { assetId: 'GFX_MARK_DUPLICATE' });
  for (const result of results) {
    const line = el('p', result.duplicate ? 'gfx-result is-duplicate' : 'gfx-result');
    line.dataset.rarity = result.rarity ?? '';
    line.dataset.duplicate = result.duplicate ? 'true' : 'false';
    line.dataset.copy = String(result.copyNumber ?? 1);
    if (result.duplicate && mark) {
      const icon = el('img', 'gfx-mark');
      icon.alt = '';
      bindGacha(icon, mark);
      line.append(icon);
    }
    line.append(document.createTextNode(resultLine(result)));
    log.append(line);
  }
  return log;
}

function renderCharge(manifest) {
  const overlay = el('div', 'gfx-reveal gfx-charging');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Summoning');
  const stage = el('div', 'gfx-stage');
  const machine = findAsset(manifest, { slot: 'gacha-machine' });
  if (machine) {
    const img = el('img', 'gfx-machine');
    img.alt = '';
    bindGacha(img, machine, { eager: true });
    stage.append(img);
  }
  stage.append(el('span', 'gfx-ring'));
  for (let spark = 0; spark < 10; spark += 1) stage.append(el('i', 'gfx-spark'));
  overlay.append(stage);
  overlay.append(el('p', 'gfx-step', `Summoning x${charging.count}…`));
  return overlay;
}

function renderReveal(manifest) {
  const current = director.results[director.index];
  const overlay = el('div', 'gfx-reveal');
  overlay.dataset.rarity = current?.rarity ?? '';
  overlay.dataset.index = String(director.index);
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', `${current?.rarity ?? 'Card'} reveal. ${current?.name ?? ''}`);
  const stage = el('div', 'gfx-stage');
  const presentation = presentationFor(current?.rarity, manifest);
  if (presentation.plate) {
    const plate = el('img', 'gfx-plate');
    plate.alt = '';
    plate.dataset.rarity = current.rarity;
    paintPlate(plate, presentation);
    stage.append(plate);
  }
  stage.append(el('span', 'gfx-ring'));
  for (let spark = 0; spark < 6; spark += 1) stage.append(el('i', 'gfx-spark'));
  const card = el('div', 'gfx-card is-flipped');
  const inner = el('div', 'gfx-card-inner');
  const back = el('div', 'gfx-back');
  const backArt = findAsset(manifest, { assetId: 'GFX_CARD_BACK' });
  if (backArt) {
    const img = el('img');
    img.alt = '';
    bindGacha(img, backArt, { eager: true });
    back.append(img);
  }
  const face = el('div', 'gfx-face');
  const frame = current ? findAsset(manifest, { slot: 'frame', rarity: current.rarity }) : null;
  if (frame) {
    const img = el('img', 'gfx-frame');
    img.alt = '';
    bindGacha(img, frame, { eager: true });
    face.append(img);
  }
  const subject = current?.subjectId ?? current?.avatarId ?? current?.cardId ?? current?.id ?? null;
  const illus = subject ? findAsset(manifest, { slot: 'illustration', subjectId: subject }) : null;
  if (illus) {
    const img = el('img', 'gfx-illus');
    img.alt = '';
    bindGacha(img, illus, { eager: true });
    face.append(img);
  }
  face.append(el('p', 'gfx-rarity-label', current?.rarity ?? ''));
  face.append(el('p', 'gfx-card-name', current?.name ?? ''));
  if (current?.duplicate) face.append(el('p', 'gfx-dup', current.duplicateNote));
  else face.append(el('p', 'gfx-dup', 'New copy.'));
  inner.append(back, face);
  card.append(inner);
  stage.append(card);
  overlay.append(stage);
  overlay.append(el('p', 'gfx-step', `${director.index + 1} / ${director.results.length}`));
  const last = director.index >= director.results.length - 1;
  const nav = el('div', 'gfx-nav');
  const nextBtn = button(last ? 'Done' : 'Next', () => director?.next(), 'hit gfx-next');
  nav.append(nextBtn);
  if (!last) nav.append(button('Skip', () => director?.skip(), 'hit slim gfx-skip'));
  overlay.append(nav);
  queueMicrotask(() => nextBtn.focus({ preventScroll: true }));
  return overlay;
}

function installTestBridge(ctx) {
  const hook = globalThis.__cfcg;
  if (!hook) return;
  hook.primeGachaPity = (bannerId, counters) => {
    const result = primeBannerCounters(ctx.profile, bannerId, counters);
    ctx.redraw();
    return result;
  };
  hook.setGachaBalance = (amount) => {
    if (!Number.isInteger(amount) || amount < 0) return;
    ctx.profile.currencyG = amount;
    if (ctx.profile.currency && typeof ctx.profile.currency === 'object') ctx.profile.currency.G = amount;
    ctx.redraw();
  };
  hook.setRevealStepMs = (ms) => {
    if (Number.isInteger(ms) && ms >= 0) stepMs = ms;
  };
  hook.setGachaSeq = (seq) => {
    if (Number.isInteger(seq) && seq >= 0) ctx.profile.seq = seq;
  };
}

export function renderGachaFx(ctx) {
  installGachaFxStyles();
  const manifest = withGachaFragment(ctx.manifest);
  const banners = ctx.api?.catalog?.banners ?? [];
  if (!selectedId || !banners.some((banner) => banner.bannerId === selectedId)) {
    selectedId = banners[0]?.bannerId ?? null;
  }
  const selected = banners.find((banner) => banner.bannerId === selectedId) ?? null;
  const body = el('div', `gacha gfx-gacha${ctx.gachaResults?.length ? ' has-results' : ''}`);
  body.dataset.screen = 'gacha-fx';
  body.dataset.motion = prefersReducedMotion() ? 'reduced' : 'full';
  body.append(renderWallet(ctx, selected, manifest));
  const note = el('p', 'gfx-policy fine');
  note.textContent = `TEST weights are not drop rates. Avatar and Action share G. The price is PENDING, so this booth charges nothing. ${policyLine()}`;
  body.append(note);
  body.append(renderBanners(ctx, banners, manifest));
  if (ctx.gachaResults?.length) body.append(renderSummaryBlock(ctx, manifest));
  if (charging) body.append(renderCharge(manifest));
  else if (director && !director.done && director.results.length > 0) body.append(renderReveal(manifest));
  const view = shell(ctx, 'Gachapon', body, { back: 'home' });
  const bg = findAsset(manifest, { slot: 'bg-gacha', subjectId: 'gacha' });
  if (bg) {
    const img = el('img', 'scene-bg');
    img.alt = '';
    bindGacha(img, bg, { eager: true });
    view.prepend(img);
    view.classList.add('has-scene');
  }
  installTestBridge(ctx);
  return view;
}
