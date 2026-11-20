import { bindImage, findAsset } from '../assets.js';
import { button, el } from '../dom.js';
import { anchorById, buildingHotspots } from '../map-layout.js';
const KNOWN_ACTIONS = new Set(['home', 'gacha', 'battle', 'mall', 'locked']);

export function renderMap(ctx) {
  const root = el('section', 'map-screen');
  const bg = findAsset(ctx.manifest, { slot: 'map-background', subjectId: 'world' });
  if (bg) {
    const img = el('img', 'map-bg');
    img.alt = '';
    bindImage(img, bg);
    root.append(img);
  }
  const title = anchorById(ctx.manifest, 'map-title');
  const titleNode = el('div', 'map-title');
  titleNode.append(el('h1', null, 'World Map'));
  titleNode.append(el('p', null, 'Comedy fantasy, no main quest. Wander on purpose.'));
  place(titleNode, title);
  root.append(titleNode);

  const backBox = anchorById(ctx.manifest, 'map-back');
  const back = button('Hideout', () => ctx.goto('home'), 'hit');
  place(back, backBox);
  root.append(back);

  for (const hotspot of buildingHotspots(ctx.manifest)) {
    const spot = el('button', `hotspot${hotspot.locked ? ' is-locked' : ''}`);
    spot.type = 'button';
    if (hotspot.anchorMode === 'bottom-center') {
      spot.style.left = `${hotspot.anchorX}px`;
      spot.style.top = `${hotspot.anchorY}px`;
      spot.style.width = `${hotspot.targetWidth}px`;
      spot.style.height = `${hotspot.targetHeight}px`;
      spot.style.transform = hotspot.transform || 'translate(-50%, -100%)';
    } else {
      spot.style.left = `${hotspot.x}px`;
      spot.style.top = `${hotspot.y}px`;
      spot.style.width = `${hotspot.w}px`;
      spot.style.height = `${hotspot.h}px`;
    }
    spot.dataset.placementStatus = hotspot.placementStatus || '';
    const art = findAsset(ctx.manifest, { assetId: hotspot.assetId });
    if (art) {
      const img = el('img', 'hotspot-art');
      img.alt = '';
      bindImage(img, art);
      spot.append(img);
    }
    spot.append(el('span', 'hotspot-label', hotspot.label));
    if (hotspot.locked) spot.append(el('span', 'hotspot-lock', 'Coming soon'));
    spot.addEventListener('click', () => onHotspot(ctx, hotspot));
    root.append(spot);
  }
  if (ctx.notice) root.append(el('p', 'toast', ctx.notice));
  if (ctx.modal) root.append(ctx.modal);
  return root;
}

function place(node, box) {
  if (!box) return;
  node.style.position = 'absolute';
  node.style.left = `${box.x}px`;
  node.style.top = `${box.y}px`;
  node.style.width = `${box.w}px`;
  node.style.height = `${box.h}px`;
}

function onHotspot(ctx, hotspot) {
  if (!KNOWN_ACTIONS.has(hotspot.action)) {
    ctx.setNotice(`${hotspot.label} is on the map. Nothing is wired to action "${hotspot.action}" yet.`);
    ctx.redraw();
    return;
  }
  if (hotspot.action === 'home') {
    ctx.goto('home');
    return;
  }
  if (hotspot.action === 'gacha') {
    ctx.goto('gacha');
    return;
  }
  if (hotspot.action === 'locked') {
    ctx.setNotice('The Sports Complex is locked. Football, basketball, racing, and MotoGP are stretching off-screen. Coming soon.');
    ctx.redraw();
    return;
  }
  if (hotspot.action === 'mall') {
    ctx.setNotice('The Shopping Mall has blank price tags. Furniture prices and cabin storage are PENDING. Nothing is for sale in this build.');
    ctx.redraw();
    return;
  }
  if (hotspot.action === 'battle') {
    ctx.openPrep({ label: hotspot.label, mode: hotspot.mode || 'tower' });
  }
}
