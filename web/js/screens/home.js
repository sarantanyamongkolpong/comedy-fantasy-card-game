import { bindImage, findAsset } from '../assets.js';
import { button, el, shell } from '../dom.js';
import { HOUSE_TIERS } from '../profile.js';

export function renderHome(ctx) {
  const body = el('div', 'home');
  const tierId = ctx.previewTier || ctx.profile.house.tierId;
  const owned = HOUSE_TIERS.find((tier) => tier.tierId === ctx.profile.house.tierId);
  const shown = HOUSE_TIERS.find((tier) => tier.tierId === tierId) ?? owned;
  const art = findAsset(ctx.manifest, { slot: 'house', subjectId: shown.tierId });
  const figure = el('div', 'house-art');
  if (art) {
    const img = el('img', 'house-img');
    img.alt = `${shown.tierName} placeholder`;
    bindImage(img, art);
    figure.append(img);
  }
  const ownedLine = shown.tierId === ctx.profile.house.tierId
    ? `You live in the ${shown.tierName}. Highest tier you actually own.`
    : `Brochure only. You still own the ${owned.tierName}. This picture is not purchased.`;
  figure.append(el('p', 'lede', ownedLine));
  figure.append(el('p', 'fine', 'Storage slots: PENDING (HOME-11). Installed furniture: none. A fancier house does not add slots by itself.'));
  body.append(figure);
  body.append(furnitureStrip(ctx));

  const nav = el('div', 'home-nav');
  nav.append(
    button('Stash', () => ctx.goto('stash')),
    button('Team & Deck', () => ctx.goto('party')),
    button('Gachapon', () => ctx.goto('gacha')),
    button('World Map', () => ctx.goto('map')),
    button('Companion room', () => ctx.openCompanion()),
    button('Save', () => ctx.persist(true)),
    button('Load', () => ctx.loadSave()),
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
  if (bg) {
    const img = el('img', 'scene-bg');
    img.alt = '';
    bindImage(img, bg);
    view.prepend(img);
    view.classList.add('has-scene');
  }
  return view;
}

function furnitureStrip(ctx) {
  const strip = el('div', 'furniture-strip');
  strip.append(el('p', 'fine', 'Furniture art is bound. Nothing is installed, and a house tier does not add storage.'));
  const row = el('div', 'row');
  const seen = new Set();
  for (const asset of ctx.manifest.assets ?? []) {
    if (asset.slot !== 'furniture' || asset.placeholder === true) continue;
    if (seen.has(asset.path)) continue;
    seen.add(asset.path);
    const fig = el('figure', 'furniture-prop');
    const img = el('img');
    img.alt = '';
    bindImage(img, asset);
    fig.append(img);
    row.append(fig);
  }
  strip.append(row);
  return strip;
}
