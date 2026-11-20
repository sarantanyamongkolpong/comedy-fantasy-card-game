import { bindImage, findAsset } from '../assets.js';
import { chromeButton, paintFrame } from '../chrome.js';
import { el, shell } from '../dom.js';

const GOODS = [
  ['Companion bed', 'furniture_companion_bed. Art only, PROPOSED. Hideout can place it. It adds no slots.'],
  ['Cozy sofa', 'furniture_cozy_sofa. Art only, PROPOSED. Hideout can place it. It adds no slots.'],
  ['Bookcase', 'furniture_bookcase. Art only, PROPOSED. Hideout can place it. It adds no slots.'],
  ['Trophy shelf', 'furniture_trophy_shelf. Art only, PROPOSED. Hideout can place it. It adds no slots.'],
  ['Wardrobe', 'furniture_wardrobe. Art only, PROPOSED. Hideout can place it. It adds no slots.'],
  ['Magic workbench', 'furniture_magic_workbench. Art only, PROPOSED. Hideout can place it. It adds no slots.'],
  ['Ornate chest', 'furniture_ornate_storage_chest. Art only, PROPOSED. Hideout can place it. It adds no slots.'],
  ['Box', 'FUR_REF_BUNGALOW_BOX. Grant versus buy is PENDING_OWNER.'],
  ['Cottage box', 'FUR_REF_COTTAGE_BOX. Grant versus buy is PENDING_OWNER.'],
  ['Tall cabinet', 'FUR_REF_LOFT_TALL_CABINET. Grant versus buy is PENDING_OWNER.'],
  ['Display counter', 'FUR_REF_VILLA_DISPLAY_COUNTER. Grant versus buy is PENDING_OWNER.'],
  ['Large tall cabinet', 'FUR_REF_PENTHOUSE_LARGE_TALL_CABINET. Grant versus buy is PENDING_OWNER.'],
];

export function renderMall(ctx) {
  const root = el('div', 'mall');
  root.dataset.screen = 'mall';
  const merchant = findAsset(ctx.manifest, { slot: 'mall-cutout', subjectId: 'merchant' });
  if (merchant) {
    const img = el('img', 'mall-merchant');
    img.alt = '';
    bindImage(img, merchant);
    root.append(img);
  }
  const counter = findAsset(ctx.manifest, { slot: 'mall-cutout', subjectId: 'counter' });
  if (counter) {
    const img = el('img', 'mall-counter');
    img.alt = '';
    bindImage(img, counter);
    root.append(img);
  }
  const sheet = el('aside', 'mall-sheet');
  const body = el('div', 'sheet-body');
  paintFrame(sheet, ctx.manifest, 'detail');
  body.append(el('h2', null, 'Blank price tags'));
  body.append(el('p', 'fine', 'Every price is PENDING. Cabin storage is PENDING (HOME-11). Nothing can be bought in this build.'));
  const table = el('div', 'price-list');
  for (const [name, note] of GOODS) {
    const row = el('div', 'price-row');
    row.append(el('span', 'price-name', name));
    row.append(el('span', 'price-tag', 'PENDING'));
    row.append(el('span', 'fine', note));
    table.append(row);
  }
  body.append(table);
  body.append(chromeButton(ctx.manifest, 'Back to the Map', () => ctx.goto('map'), { variant: 'secondary', icon: 'back' }));
  sheet.append(body);
  root.append(sheet);
  const view = shell(ctx, 'Shopping Mall', root);
  const bg = findAsset(ctx.manifest, { slot: 'bg-mall', subjectId: 'mall' });
  if (bg) {
    const img = el('img', 'scene-bg');
    img.alt = '';
    bindImage(img, bg, { eager: true });
    view.prepend(img);
    view.classList.add('has-scene');
  }
  return view;
}
