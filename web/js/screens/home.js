import { PHASE3_FURNITURE_ART } from '../../../src/schema/hideout.js';
import { bindImage, findAsset } from '../assets.js';
import { chromeButton } from '../chrome.js';
import { button, el, shell } from '../dom.js';
import { HOUSE_TIERS } from '../profile.js';
import { stashCapacityLine } from './stash.js';

export function renderHome(ctx) {
  const body = el('div', 'home');
  body.dataset.screen = 'home';
  const tierId = ctx.previewTier || ctx.profile.house.tierId;
  const owned = HOUSE_TIERS.find((tier) => tier.tierId === ctx.profile.house.tierId);
  const shown = HOUSE_TIERS.find((tier) => tier.tierId === tierId) ?? owned;
  const peeking = shown.tierId !== ctx.profile.house.tierId;
  const report = typeof ctx.api.stashReport === 'function' ? ctx.api.stashReport(ctx.profile) : null;
  const installed = ctx.profile.house?.installedFurniture ?? [];
  const ownedLine = peeking
    ? `Brochure only. You still own the ${owned.tierName}. This picture is not purchased.`
    : installed.length > 0
      ? `You live in the ${shown.tierName}. ${installed.length} piece(s) installed. ${stashCapacityLine(report)}`
      : `You live in the ${shown.tierName}. Nothing is installed. ${stashCapacityLine(report)}`;
  const note = el('div', 'house-note');
  note.append(el('p', 'lede', ownedLine));
  note.append(el('p', 'fine', 'Tap a prop to place or remove it. Phase 3 art is PROPOSED and adds no slots. Prices are PENDING.'));
  body.append(note);

  if (peeking) {
    const art = findAsset(ctx.manifest, { slot: 'house', subjectId: shown.tierId });
    if (art) {
      const figure = el('div', 'house-art');
      const img = el('img', 'house-img');
      img.alt = '';
      bindImage(img, art);
      figure.append(img);
      body.append(figure);
    }
  }

  const nav = el('div', 'home-nav');
  nav.append(
    chromeButton(ctx.manifest, 'Stash', () => ctx.goto('stash'), { icon: 'bag' }),
    chromeButton(ctx.manifest, 'Team & Deck', () => ctx.goto('party'), { icon: 'deck' }),
    chromeButton(ctx.manifest, 'Gachapon', () => ctx.goto('gacha'), { icon: 'gacha' }),
    chromeButton(ctx.manifest, 'World Map', () => ctx.goto('map'), { icon: 'map' }),
    chromeButton(ctx.manifest, 'Companion room', () => ctx.openCompanion(), { icon: 'companion', variant: 'secondary' }),
    chromeButton(ctx.manifest, 'Save', () => ctx.persist(true), { icon: 'home', variant: 'secondary' }),
    chromeButton(ctx.manifest, 'Load', () => ctx.loadSave(), { icon: 'back', variant: 'ghost' }),
  );
  body.append(nav);

  const brochure = el('div', 'brochure');
  brochure.append(el('p', 'fine', 'House ladder (LOCKED names). Tap a tier to peek. Peeking does not upgrade you.'));
  const row = el('div', 'row wrap');
  for (const tier of HOUSE_TIERS) {
    const chip = button(tier.tierName, () => ctx.setPreviewTier(tier.tierId), 'hit slim');
    if (tier.tierId === ctx.profile.house.tierId) chip.classList.add('is-owned');
    if (tier.tierId === tierId) chip.classList.add('is-selected');
    row.append(chip);
  }
  brochure.append(row);
  body.append(brochure);

  const view = shell(ctx, 'The Hideout', body);
  const bg = findAsset(ctx.manifest, { slot: 'bg-hideout', subjectId: 'cabin' });
  if (bg && !peeking) {
    const img = el('img', 'scene-bg');
    img.alt = '';
    bindImage(img, bg, { eager: true });
    view.prepend(img);
    view.classList.add('has-scene');
    view.append(furnitureLayer(ctx));
  }
  return view;
}

function artRowFor(asset) {
  return PHASE3_FURNITURE_ART.find((row) => row.file === asset.source_file) ?? null;
}

function pieceInstalled(profile, row) {
  return (profile.house?.installedFurniture ?? []).some((piece) => piece.assetId === row.assetId || piece.furnitureId === row.assetId);
}

function furnitureLayer(ctx) {
  const layer = el('div', 'furniture-layer');
  for (const asset of ctx.manifest.assets ?? []) {
    if (asset.slot !== 'hideout-furniture' || asset.placeholder === true) continue;
    const row = artRowFor(asset);
    const placed = row ? pieceInstalled(ctx.profile, row) : false;
    const box = asset.presentation?.placement;
    const spot = button('', () => {
      if (!row || typeof ctx.api.installFurniture !== 'function') {
        ctx.setNotice(`${labelFor(asset)} has no art-only furniture row. Price PENDING. Capacity PENDING.`);
        ctx.redraw();
        return;
      }
      if (pieceInstalled(ctx.profile, row)) {
        ctx.api.removeFurniture(ctx.profile, row.assetId);
        ctx.setNotice(`${row.assetId} removed. It was art only, so furniture slots did not change. Price stays PENDING.`);
      } else {
        ctx.api.installFurniture(ctx.profile, row);
        ctx.setNotice(`${row.assetId} installed as art (PROPOSED). Capacity PENDING. It adds no stash slots.`);
      }
      ctx.persist(false);
      ctx.redraw();
    }, placed ? 'prop-btn is-installed' : 'prop-btn');
    spot.setAttribute('aria-label', row ? row.assetId : labelFor(asset));
    spot.setAttribute('aria-pressed', placed ? 'true' : 'false');
    if (box) {
      spot.style.left = `${box.x}px`;
      spot.style.top = `${box.y}px`;
      spot.style.width = `${box.w}px`;
      spot.style.height = `${box.h}px`;
    }
    const img = el('img');
    img.alt = '';
    bindImage(img, asset);
    spot.append(img);
    layer.append(spot);
  }
  return layer;
}

function labelFor(asset) {
  return String(asset.subject_id ?? 'Furniture').replaceAll('-', ' ');
}
