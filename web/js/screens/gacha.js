import { bindImage, findAsset } from '../assets.js';
import { button, el, shell } from '../dom.js';
import { applyPull } from '../profile.js';

export function renderGacha(ctx) {
  const body = el('div', 'gacha');
  const intro = el('p', 'lede');
  const coin = findAsset(ctx.manifest, { slot: 'ui-icon', subjectId: 'g' });
  if (coin) {
    const img = el('img', 'g-coin');
    img.alt = '';
    bindImage(img, coin);
    intro.append(img);
  }
  intro.append(document.createTextNode(' Three booths. Avatar and Action share the idea of currency G, but the price is PENDING (GA-11), so this TEST booth charges nothing. Weights below are TEST weights, not drop rates.'));
  body.append(intro);
  body.append(el('p', 'fine', 'Pity caps are LOCKED: Epic within 100, top tier within 200 where a top tier exists. Companion has no top pity. Reset-on-hit is PENDING (GA-12). This booth\'s assumption: per banner, reset only the tier you actually hit.'));
  const row = el('div', 'banner-row');
  for (const banner of ctx.api.catalog.banners) {
    const state = ctx.profile.banners[banner.bannerId];
    const card = el('article', `banner${ctx.gachaBannerId === banner.bannerId ? ' is-selected' : ''}`);
    const machine = findAsset(ctx.manifest, { slot: 'gacha-machine', subjectId: banner.pool });
    if (machine) {
      const img = el('img', 'gacha-machine');
      img.alt = '';
      bindImage(img, machine);
      card.append(img);
    }
    card.append(el('h2', null, `${banner.name}`));
    card.append(el('p', 'badge', 'TEST CONFIG'));
    card.append(el('p', null, `Pool: ${banner.pool}`));
    if (state) {
      card.append(el('p', null, `Epic pity ${state.pityEpic} / ${state.pityEpicMax}`));
      card.append(el('p', null, state.pityTopMax == null
        ? 'Top pity: none (LOCKED for companions)'
        : `Top pity ${state.pityTop} / ${state.pityTopMax}`));
      card.append(el('p', 'fine', `Pulls on this banner: ${state.pulls}`));
    }
    const weights = (banner.weights ?? state?.weights ?? []).map((entry) => `${entry.rarity} ${entry.weight}`).join(' · ');
    card.append(el('p', 'fine', `TEST weights: ${weights}`));
    const actions = el('div', 'row');
    actions.append(button('Pull 1', () => ctx.pullBanner(banner, 1), 'hit slim'));
    actions.append(button('Pull 10', () => ctx.pullBanner(banner, 10), 'hit slim'));
    card.append(actions);
    row.append(card);
  }
  body.append(row);
  if (ctx.gachaResults?.length) {
    const log = el('div', 'pull-log');
    log.append(el('h2', null, 'Latest TEST pull'));
    for (const result of ctx.gachaResults) {
      const line = el('p', null, `${result.rarity}${result.forced ? ` (pity ${result.forced})` : ''}: ${result.name}`);
      log.append(line);
      log.append(el('p', 'fine', result.note));
    }
    body.append(log);
    const rarities = new Set(ctx.gachaResults.map((result) => result.rarity));
    for (const rarity of ['Epic', 'EX']) {
      if (!rarities.has(rarity)) continue;
      const vfx = findAsset(ctx.manifest, { slot: 'gacha-vfx', subjectId: rarity });
      if (!vfx) continue;
      const overlay = el('img', 'gacha-reveal');
      overlay.alt = '';
      bindImage(overlay, vfx);
      body.append(overlay);
    }
  }
  const view = shell(ctx, 'Gachapon', body, { back: 'home' });
  const bg = findAsset(ctx.manifest, { slot: 'bg-gacha', subjectId: 'gacha' });
  if (bg) {
    const img = el('img', 'scene-bg');
    img.alt = '';
    bindImage(img, bg);
    view.prepend(img);
    view.classList.add('has-scene');
  }
  return view;
}

export function performPull(ctx, banner, count) {
  const state = ctx.profile.banners[banner.bannerId];
  const outcome = ctx.api.pull(state, {
    seed: `gacha:${banner.bannerId}:${ctx.profile.seq}:${count}`,
    count,
    catalog: ctx.api.catalog,
  });
  ctx.profile.banners[banner.bannerId] = outcome.state;
  for (const result of outcome.results) applyPull(ctx.profile, result);
  ctx.setGachaResults(outcome.results);
  ctx.setNotice(`TEST pull ×${count}. G charged: ${outcome.chargedG ?? 0} because the price is PENDING.`);
  ctx.persist();
  ctx.redraw();
}
