import { button, el } from '../js/dom.js';
import { artNode } from './art.js';
import { gOf } from './session.js';

export function sportRoot(screen, sport) {
  const root = el('section', 'sport-root');
  root.dataset.sportScreen = screen;
  if (sport) root.dataset.sport = sport;
  return root;
}

export function navButton(label, onClick, { action, sport, primary = false, disabled = false, speed = null } = {}) {
  const node = button(label, onClick, primary ? 'sport-nav is-primary' : 'sport-nav');
  if (action) node.dataset.action = action;
  if (sport) node.dataset.sport = sport;
  if (speed != null) node.dataset.speed = String(speed);
  node.disabled = disabled;
  return node;
}

export function topBar({ title, sub, back, actions = [] }) {
  const bar = el('header', 'sport-bar');
  if (back) bar.append(navButton(back.label, back.onClick, back));
  const heading = el('div', 'sport-title');
  heading.append(artNode({ slot: 'mark', subjectId: 'hub' }));
  const words = el('div');
  words.append(el('h1', null, title));
  if (sub) words.append(el('p', null, sub));
  heading.append(words);
  bar.append(heading);
  bar.append(gBadge());
  for (const action of actions) bar.append(navButton(action.label, action.onClick, action));
  return bar;
}

export function gBadge() {
  const box = el('div', 'sport-g');
  const balance = gOf();
  box.dataset.g = String(balance);
  box.append(el('span', 'sport-g-value', `${balance} G`));
  box.append(el('span', 'sport-g-tag', 'PROPOSED'));
  return box;
}

export function noteRow(text) {
  return el('p', 'sport-note', text || 'Choices happen before the whistle. The match plays itself.');
}

export function personLabel(card) {
  if (!card) return 'Empty';
  if (card.vehicleName) return `${card.parodyName} · ${card.vehicleName}`;
  return card.parodyName;
}

export function statLine(card) {
  if (!card?.stats) return '';
  return Object.entries(card.stats).map(([key, value]) => `${key} ${value}`).join(' · ');
}
