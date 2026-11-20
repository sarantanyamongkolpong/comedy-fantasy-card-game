import { el } from '../../js/dom.js';
import { artNode } from '../art.js';
import { getTuning, sportMeta } from '../fixtures/index.js';
import {
  BASKET_ROLES,
  FORMATIONS,
  PITCH_H,
  PITCH_W,
  SLOT_H,
  SLOT_W,
  featuredStat,
  placeRows,
} from '../lineup.js';
import { cardById, coaches, lineupOf } from '../session.js';
import { noteRow, sportRoot, topBar } from '../shell.js';

export function renderPrep(ctx) {
  const sport = ctx.sport;
  const meta = sportMeta(sport);
  const ready = ctx.lineupReady(sport);
  const root = sportRoot('prep', sport);
  root.append(topBar({
    title: `${meta?.label ?? sport} Prep`,
    sub: `${meta?.venue ?? 'Venue'} · PROPOSED`,
    back: { label: 'Hub', action: 'hub', onClick: ctx.goHub },
    actions: [
      { label: 'Roster', action: 'roster', onClick: ctx.goRoster },
      { label: 'Auto Sim', action: 'start-sim', primary: true, disabled: !ready, onClick: () => ctx.startSim(sport) },
    ],
  }));
  root.append(noteRow(ctx.notice || (ready
    ? 'Set the plan, then start. Nothing moves until you press Auto Sim.'
    : 'The lineup is short a name. PROPOSED grid still needs every slot.')));
  const row = el('div', 'prep-row');
  if (sport === 'football' || sport === 'basket') row.append(pitch(ctx, sport));
  else row.append(entryStack(ctx, sport));
  row.append(side(ctx, sport));
  root.append(row);
  return root;
}

function pitch(ctx, sport) {
  const lineup = lineupOf(sport);
  const board = el('div', 'pitch');
  board.style.width = `${PITCH_W}px`;
  board.style.height = `${PITCH_H}px`;
  board.dataset.lineupCount = String(lineup.slots.length);
  const rows = sport === 'football' ? FORMATIONS[lineup.formation] : [BASKET_ROLES];
  const spots = placeRows(rows, PITCH_W, PITCH_H, SLOT_W, SLOT_H);
  spots.forEach((spot, index) => {
    const card = cardById(lineup.slots[index]);
    const node = ctx.nav(slotText(spot.role, card), () => ctx.cycleSlot(sport, index), {
      action: 'cycle-slot',
    });
    node.classList.add('slot');
    node.dataset.lineupSlot = String(index);
    node.dataset.role = spot.role;
    node.style.left = `${spot.x}px`;
    node.style.top = `${spot.y}px`;
    node.style.width = `${spot.w}px`;
    node.style.height = `${spot.h}px`;
    node.setAttribute('aria-label', card ? `${spot.role} ${card.parodyName}` : spot.role);
    const stat = featuredStat(card);
    node.replaceChildren(
      el('span', 'role', `${spot.role} · PROPOSED`),
      el('span', 'who', card?.parodyName ?? 'Empty'),
      el('span', 'stat', stat ? `${stat.key} ${stat.value}` : ' '),
    );
    board.append(node);
  });
  return board;
}

function slotText(role, card) {
  return card ? `${role} ${card.parodyName}` : role;
}

function entryStack(ctx, sport) {
  const lineup = lineupOf(sport);
  const stack = el('div', 'entry-stack');
  stack.dataset.lineupCount = '2';
  lineup.slots.forEach((id, index) => {
    const card = cardById(id);
    const cardNode = el('article', 'entry-card');
    cardNode.dataset.lineupSlot = String(index);
    cardNode.dataset.role = 'ENTRY';
    if (card) cardNode.append(artNode({ slot: 'portrait', subjectId: card.id }));
    cardNode.append(el('p', 'entry-name', card?.parodyName ?? 'Empty'));
    const stat = featuredStat(card);
    const vehicle = card?.vehicleName ? `${card.vehicleName} · ` : '';
    cardNode.append(el('p', null, `${vehicle}${stat ? `${stat.key} ${stat.value}` : ''} · PROPOSED`));
    cardNode.append(ctx.nav('Next entry', () => ctx.cycleEntry(sport, index), { action: 'cycle-entry' }));
    stack.append(cardNode);
  });
  return stack;
}

function side(ctx, sport) {
  const panel = el('aside', 'prep-side');
  const lineup = lineupOf(sport);
  const tuning = getTuning();
  if (sport === 'football') {
    panel.append(el('p', 'choice-label', 'Formation · PROPOSED'));
    panel.append(choiceGrid(ctx, 'cols-3', Object.keys(FORMATIONS).map((id) => ({
      label: id,
      selected: lineup.formation === id,
      onClick: () => ctx.setFormation(id),
      action: 'formation',
    }))));
    panel.append(el('p', 'choice-label', 'Coach · PROPOSED'));
    panel.append(choiceGrid(ctx, 'cols-2', coaches(sport).map((coach) => ({
      label: coach.parodyName,
      selected: lineup.coachId === coach.id,
      onClick: () => ctx.setCoach(sport, coach.id),
      action: 'coach',
    }))));
    const blurb = tuning.football.formations[lineup.formation]?.blurb ?? '';
    const coach = cardById(lineup.coachId);
    panel.append(el('p', 'side-blurb', `${blurb} ${coach?.passive ?? ''} Away: Puddle United.`));
  } else if (sport === 'basket') {
    panel.append(el('p', 'choice-label', 'Defense · PROPOSED'));
    panel.append(choiceGrid(ctx, 'cols-3', Object.entries(tuning.basket.schemes).map(([id, scheme]) => ({
      label: scheme.label,
      selected: lineup.scheme === id,
      onClick: () => ctx.setScheme(id),
      action: 'scheme',
    }))));
    panel.append(el('p', 'choice-label', 'Pace · PROPOSED'));
    panel.append(choiceGrid(ctx, 'cols-3', Object.entries(tuning.basket.paces).map(([id, pace]) => ({
      label: pace.label,
      selected: lineup.pace === id,
      onClick: () => ctx.setPace(id),
      action: 'pace',
    }))));
    panel.append(el('p', 'choice-label', 'Coach · PROPOSED'));
    panel.append(choiceGrid(ctx, 'cols-3', coaches(sport).map((coach) => ({
      label: coach.parodyName,
      selected: lineup.coachId === coach.id,
      onClick: () => ctx.setCoach(sport, coach.id),
      action: 'coach',
    }))));
    const scheme = tuning.basket.schemes[lineup.scheme];
    const pace = tuning.basket.paces[lineup.pace];
    panel.append(el('p', 'side-blurb', `${scheme?.blurb ?? ''} ${pace?.blurb ?? ''} Away: Gravy City Hoops. Five stay on the court.`));
  } else {
    const rules = tuning[sport];
    panel.append(el('p', 'choice-label', 'Tyre · PROPOSED'));
    panel.append(choiceGrid(ctx, 'cols-3', Object.entries(rules.tyres).map(([id, tyre]) => ({
      label: tyre.label,
      selected: lineup.tyre === id,
      onClick: () => ctx.setTyre(sport, id),
      action: 'tyre',
    }))));
    panel.append(el('p', 'choice-label', 'Setup · PROPOSED'));
    panel.append(choiceGrid(ctx, 'cols-3', Object.entries(rules.setups).map(([id, setup]) => ({
      label: setup.label,
      selected: lineup.setup === id,
      onClick: () => ctx.setSetup(sport, id),
      action: 'setup',
    }))));
    const away = sport === 'car' ? 'Biscuit Brake Club' : 'Spoonslide';
    panel.append(el('p', 'side-blurb', `Away: ${away}. Both entries count. A DNF retires one machine. PROPOSED.`));
  }
  return panel;
}

function choiceGrid(ctx, cols, items) {
  const grid = el('div', `choice-grid ${cols}`);
  for (const item of items) {
    const node = ctx.nav(item.label, item.onClick, { action: item.action });
    if (item.selected) node.classList.add('is-selected');
    node.setAttribute('aria-pressed', item.selected ? 'true' : 'false');
    grid.append(node);
  }
  return grid;
}
