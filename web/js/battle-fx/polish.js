/**
 * Presentation pass for Prep and Battle.
 * It paints frames, gems, the shield plate, and status sigils.
 * It does not call the engine.
 */

import { battleUiCatalog } from './catalog.js';
import { FIT } from './fit.js';
import { classifyFloater, holdLogFx } from './floaters.js';
import { floatersForUnit } from '../combat-fx.js';
import { engineAvatarFor, shieldPool, shieldRatio } from './shield.js';
import { statusFlags } from './status.js';

const FRAME_SELECTOR = [
  '.battle-badge',
  '.turn-chip',
  '.ap-meter',
  '.lead-plate',
  '.pile-btn',
  '.end-turn',
  '.prep-title',
  '.prep-location',
  '.prep-team',
  '.prep-deck',
  '.prep-detail',
  '.prep-start',
  '.prep-back',
].join(',');

function applyFitVars(root) {
  root.style.setProperty('--bp-sprite-w', `${FIT.spriteWidth}px`);
  root.style.setProperty('--bp-sprite-h-back', `${FIT.backSpriteHeight}px`);
  root.style.setProperty('--bp-sprite-h-front', `${FIT.frontSpriteHeight}px`);
  root.style.setProperty('--bp-sprite-bottom', `${FIT.spriteBottom}px`);
  root.style.setProperty('--bp-prep-inset-x', `${FIT.prepInsetX}px`);
  root.style.setProperty('--bp-prep-top', `${FIT.prepTop}px`);
  root.style.setProperty('--bp-prep-bottom', `${FIT.prepBottom}px`);
  root.style.setProperty('--bp-hand-card-w', `${FIT.handCardWidth}px`);
  root.style.setProperty('--bp-hand-gap', `${FIT.handGap}px`);
  root.style.setProperty('--bp-hand-lift', `${FIT.handLift}px`);
}

function applyArtVars(root, urls) {
  const map = {
    '--bp-gem-on': urls.gemOn,
    '--bp-gem-off': urls.gemOff,
    '--bp-hp-track': urls.hpTrack,
    '--bp-hp-shield': urls.hpShield,
    '--bp-shadow': urls.shadow,
    '--bp-row-front': urls.rowFront,
    '--bp-row-back': urls.rowBack,
  };
  for (const [name, url] of Object.entries(map)) {
    if (url) root.style.setProperty(name, `url("${url}")`);
  }
}

function image(className, src) {
  const img = document.createElement('img');
  img.className = className;
  img.alt = '';
  img.draggable = false;
  img.src = src;
  return img;
}

function mountFrames(root, urls) {
  if (!urls.corner || !urls.edgeH || !urls.edgeV) return;
  for (const node of root.querySelectorAll(FRAME_SELECTOR)) {
    if (node.querySelector(':scope > .bp-frame')) continue;
    node.classList.add('bp-framed');
    const frame = document.createElement('span');
    frame.className = 'bp-frame';
    frame.setAttribute('aria-hidden', 'true');
    for (const place of ['tl', 'tr', 'bl', 'br']) {
      frame.append(image(`bp-corner bp-corner-${place}`, urls.corner));
    }
    frame.append(image('bp-edge bp-edge-top', urls.edgeH));
    frame.append(image('bp-edge bp-edge-bottom', urls.edgeH));
    frame.append(image('bp-edge bp-edge-left', urls.edgeV));
    frame.append(image('bp-edge bp-edge-right', urls.edgeV));
    node.prepend(frame);
  }
}

function addSigil(unit, src, kind, index) {
  if (!src) return index;
  const img = image(`bp-sigil bp-sigil-${kind}`, src);
  img.style.left = `${4 + index * 24}px`;
  unit.append(img);
  return index + 1;
}

function paintShield(bar, shield, maxHp) {
  const ratio = shieldRatio(shield, maxHp);
  if (!bar || ratio <= 0 || bar.querySelector('.hp-shield')) return;
  const overlay = document.createElement('span');
  overlay.className = 'hp-shield';
  overlay.dataset.shield = String(shield);
  overlay.style.width = `${ratio * 100}%`;
  bar.append(overlay);
}

function mountLogFloaters(unitEl, unit, fx) {
  const logged = floatersForUnit(fx?.floaters, unit);
  if (!logged.length) return;
  const existing = [...unitEl.querySelectorAll('.floater')].map((node) => node.textContent);
  for (const item of logged) {
    const at = existing.indexOf(item.text);
    if (at >= 0) {
      existing.splice(at, 1);
      continue;
    }
    const node = document.createElement('span');
    node.className = item.className;
    node.textContent = item.text;
    unitEl.append(node);
  }
}

function polishUnit(unitEl, unit, match, urls, fx) {
  const avatar = engineAvatarFor(match, unit);
  const shield = shieldPool(unit, avatar);
  unitEl.dataset.shield = String(shield);
  paintShield(unitEl.querySelector('.hp-bar'), shield, unit?.maxHp);
  const flags = statusFlags(unit, avatar);
  unitEl.classList.toggle('is-shielded', flags.shield);
  unitEl.classList.toggle('is-taunt', flags.taunt);
  unitEl.classList.toggle('is-regen', flags.regen);
  unitEl.classList.toggle('is-buff', flags.buff);
  unitEl.classList.toggle('is-debuff', flags.debuff);
  let index = 0;
  if (flags.shield) index = addSigil(unitEl, urls.shield, 'shield', index);
  if (flags.buff) index = addSigil(unitEl, urls.buff, 'buff', index);
  if (flags.debuff) addSigil(unitEl, urls.debuff, 'debuff', index);
  mountLogFloaters(unitEl, unit, fx);
  const floaters = [...unitEl.querySelectorAll('.floater')];
  let labels = 0;
  let numbers = 0;
  for (const node of floaters) {
    const tone = classifyFloater(node.className);
    node.dataset.tone = tone;
    if (tone === 'status') {
      node.classList.add('bp-status-label');
      node.style.top = `${30 + labels * 14}px`;
      node.style.bottom = 'auto';
      labels += 1;
    } else {
      node.style.bottom = `${46 + numbers * 22}px`;
      numbers += 1;
    }
  }
}

function polishBattle(root, ctx, urls) {
  mountFrames(root, urls);
  const units = ctx?.match?.units ?? [];
  const fx = holdLogFx(ctx?.match?.engine?.log);
  const nodes = [...root.querySelectorAll('.arena .unit')];
  nodes.forEach((node, index) => {
    if (units[index]) polishUnit(node, units[index], ctx.match, urls, fx);
  });
  const leadUnit = units.find((unit) => unit.sideId === 'enemy' && !unit.ko)
    ?? units.find((unit) => unit.sideId === 'enemy');
  if (leadUnit) {
    const avatar = engineAvatarFor(ctx.match, leadUnit);
    paintShield(root.querySelector('.lead-plate .hp-bar'), shieldPool(leadUnit, avatar), leadUnit.maxHp);
  }
}

export function applyBattlePolish(root, ctx) {
  if (!root || root.nodeType !== 1) return root;
  const screen = root.dataset.screen;
  if (screen !== 'battle' && screen !== 'prep') return root;
  root.classList.add('bp-on');
  root.dataset.bp = '1';
  const { urls } = battleUiCatalog();
  applyFitVars(root);
  applyArtVars(root, urls);
  if (screen === 'battle') polishBattle(root, ctx, urls);
  else mountFrames(root, urls);
  return root;
}
