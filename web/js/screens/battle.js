import { speedChoices } from '../auto-play.js';
import { bindImage, findAsset, firstAsset } from '../assets.js';
import { combatFx, floatersForUnit } from '../combat-fx.js';
import { battleBands, battleSlots } from '../battle-layout.js';
import { beginCard, cancelPlay, chooseActor, chooseTarget } from '../battle-flow.js';
import { button, el, modal } from '../dom.js';
import { actionModel, renderCard } from '../render-card.js';
import { factionName } from '../sample-catalog.js';

function place(node, box) {
  node.style.left = `${box.x}px`;
  node.style.top = `${box.y}px`;
  node.style.width = `${box.w}px`;
  node.style.height = `${box.h}px`;
}

export function renderBattle(ctx) {
  const match = ctx.match;
  const ui = ctx.battleUi;
  const bands = battleBands();
  const fx = combatFx(match.engine?.log ?? [], ui.logCursor);
  ui.logCursor = fx.cursor;
  ui.fx = fx;
  const root = el('section', 'battle');
  root.dataset.screen = 'battle';
  paintStage(root, ctx, 'bg-battle', 'battle');
  root.append(topBar(ctx, bands.top));
  root.append(arena(ctx, bands));
  root.append(pileStack(ctx, bands.piles));
  const hand = el('div', 'band-hand');
  hand.dataset.band = 'hand';
  place(hand, bands.hand);
  hand.append(handRow(ctx));
  root.append(hand);
  root.append(controls(ctx, bands.controls));

  if (ctx.notice) root.append(el('p', 'toast', ctx.notice));
  if (match.phase === 'mandatoryDiscard') root.append(mandatoryModal(ctx));
  else if (ui.confirm) root.append(confirmModal(ctx));
  else if (ui.pile) root.append(pileModal(ctx));
  ctx.battleUi.hpSnap = Object.fromEntries(match.units.map((unit) => [unit.instanceId, unit.hp]));
  return root;
}

function paintStage(root, ctx, slot, subjectId) {
  const bg = findAsset(ctx.manifest, { slot, subjectId });
  if (!bg) return;
  const img = el('img', 'stage-bg');
  img.alt = '';
  bindImage(img, bg, { eager: true });
  root.append(img);
}

function paintIfReady(node, asset) {
  if (!asset || asset.placeholder === true) return;
  const img = el('img');
  img.alt = '';
  bindImage(img, asset);
  node.prepend(img);
}

function topBar(ctx, box) {
  const bar = el('header', 'battle-top');
  place(bar, box);
  const badge = button('BATTLE', () => ctx.goto('map'), 'battle-badge plate');
  paintIfReady(badge, findAsset(ctx.manifest, { slot: 'ui-badge', subjectId: 'battle' }));
  bar.append(badge);
  const turn = el('p', 'turn-chip plate', `TURN ${String(ctx.match.turnIndex ?? 1).padStart(2, '0')}`);
  bar.append(turn);
  bar.append(apMeter(ctx));
  return bar;
}

function apMeter(ctx) {
  const ap = ctx.match.ap?.player ?? 0;
  const meter = el('div', 'ap-meter plate');
  meter.append(el('b', null, `AP ${ap}/5`));
  const pips = el('span', 'pips');
  for (let i = 0; i < 5; i += 1) {
    pips.append(el('span', i < ap ? 'pip is-on' : 'pip'));
  }
  meter.append(pips);
  return meter;
}

function arena(ctx, bands) {
  const field = el('div', 'arena');
  field.dataset.band = 'arena';
  place(field, bands.arena);
  field.append(leadPlate(ctx, bands));
  const slots = battleSlots();
  const used = { player: 0, enemy: 0 };
  for (const unit of ctx.match.units) {
    const index = used[unit.sideId] ?? 0;
    used[unit.sideId] = index + 1;
    const slot = slots.find((row) => row.side === unit.sideId && row.id === `${unit.sideId === 'player' ? 'p' : 'e'}${index}`);
    if (!slot) continue;
    field.append(unitToken(ctx, unit, slot, bands.arena));
  }
  return field;
}

function leadPlate(ctx, bands) {
  const lead = el('div', 'lead-plate plate');
  place(lead, {
    x: bands.lead.x - bands.arena.x,
    y: bands.lead.y - bands.arena.y,
    w: bands.lead.w,
    h: bands.lead.h,
  });
  const front = ctx.match.units.find((unit) => unit.sideId === 'enemy' && !unit.ko)
    ?? ctx.match.units.find((unit) => unit.sideId === 'enemy');
  const medal = el('span', 'lead-medal');
  const art = front ? unitArt(ctx, front) : null;
  if (art) {
    const img = el('img');
    img.alt = '';
    bindImage(img, art);
    medal.append(img);
  }
  lead.append(medal);
  const copy = el('span', 'lead-copy');
  copy.append(el('b', null, front ? front.name : 'Echoes'));
  copy.append(hpBar(front));
  copy.append(el('span', null, front ? `${front.hp} / ${front.maxHp}` : ''));
  lead.append(copy);
  return lead;
}

const ENEMY_SPRITE_BY_ROLE = {
  Tank: 'ENM_DEMO_001',
  DPS: 'ENM_DEMO_002',
  Magic: 'ENM_DEMO_003',
};

function unitArt(ctx, unit) {
  const queries = [];
  if (unit.sideId === 'enemy' && ENEMY_SPRITE_BY_ROLE[unit.role]) {
    queries.push({ slot: 'battle-sprite', subjectId: ENEMY_SPRITE_BY_ROLE[unit.role] });
  }
  queries.push(
    { slot: 'battle-sprite', subjectId: unit.avatarId },
    { slot: 'illustration', subjectId: unit.avatarId },
  );
  return firstAsset(ctx.manifest, queries);
}

function statusVfx(unit) {
  const subjects = [];
  if (unit.ko) subjects.push('ko');
  for (const status of unit.statuses ?? []) {
    if (status.id === 'shield' || status.name === 'shield') subjects.push('shield');
    if (status.id === 'regen' || status.name === 'regen') subjects.push('regen');
    if (status.id === 'taunt' || status.name === 'taunt') subjects.push('taunt');
  }
  return subjects;
}

function hpBar(unit) {
  const bar = el('span', 'hp-bar');
  const fill = el('span', 'hp-fill');
  const ratio = unit?.maxHp ? Math.max(0, Math.min(1, unit.hp / unit.maxHp)) : 0;
  fill.style.width = `${ratio * 100}%`;
  bar.append(fill);
  return bar;
}

function unitToken(ctx, unit, slot, arenaBox) {
  const node = el('button', `unit${unit.ko ? ' is-ko' : ''}${unit.sideId === 'enemy' ? ' faces-left' : ' faces-right'}`);
  node.type = 'button';
  node.dataset.row = slot.row;
  node.dataset.avatarId = unit.avatarId ?? '';
  node.dataset.sideId = unit.sideId ?? '';
  node.dataset.maxHp = String(unit.maxHp ?? '');
  const local = {
    x: slot.box.x - arenaBox.x,
    y: slot.box.y - arenaBox.y,
    w: slot.box.w,
    h: slot.box.h,
  };
  place(node, local);
  node.append(el('span', 'shadow'));
  const art = unitArt(ctx, unit);
  if (art) {
    const img = el('img', 'sprite');
    img.alt = '';
    bindImage(img, art);
    node.append(img);
  }
  const logged = floatersForUnit(ctx.battleUi.fx?.floaters, unit);
  if (logged.length) {
    for (const item of logged) {
      const tone = item.kind === 'damage' ? 'is-damage' : item.kind === 'heal' ? 'is-heal' : item.kind === 'shield' ? 'is-shield' : 'is-regen';
      node.append(el('span', `floater ${tone}`, item.text));
    }
  } else {
    const prev = ctx.battleUi.hpSnap?.[unit.instanceId];
    if (Number.isInteger(prev) && prev !== unit.hp) {
      const delta = unit.hp - prev;
      node.append(el('span', delta < 0 ? 'floater is-damage' : 'floater is-heal', delta > 0 ? `+${delta}` : String(delta)));
    }
  }
  for (const status of unit.statuses ?? []) {
    if (status.label) node.append(el('span', 'floater', status.label));
  }
  if (unit.ko) node.append(el('span', 'ko-tag', 'KO'));
  for (const subjectId of statusVfx(unit)) {
    const vfx = findAsset(ctx.manifest, { slot: 'battle-vfx', subjectId });
    if (!vfx) continue;
    const overlay = el('img', 'vfx');
    overlay.alt = '';
    bindImage(overlay, vfx);
    node.append(overlay);
  }
  node.append(hpBar(unit));
  node.append(el('span', 'unit-hp', `${unit.hp}/${unit.maxHp}`));
  const selected = ctx.battleUi.selection.actorAvatarId === unit.instanceId || ctx.battleUi.selection.targetId === unit.instanceId;
  if (selected) node.classList.add('is-selected');
  node.addEventListener('click', () => onUnit(ctx, unit));
  return node;
}

function onUnit(ctx, unit) {
  const match = ctx.match;
  const selection = ctx.battleUi.selection;
  if (match.phase !== 'playerTurn' || selection.mode === 'idle') {
    ctx.setNotice(`${unit.name}. ${unit.ko ? 'Down.' : `HP ${unit.hp}/${unit.maxHp} (provisional).`}`);
    ctx.redraw();
    return;
  }
  if (selection.mode === 'pickActor') {
    if (unit.sideId !== 'player' || unit.ko) {
      ctx.setNotice('Pick a living avatar on your side.');
      ctx.redraw();
      return;
    }
    const card = handCard(ctx, selection.cardInstanceId);
    if (card?.factionRequirement && unit.factionId !== card.factionRequirement) {
      ctx.setNotice(`FAC: ${card.name} needs ${factionName(card.factionRequirement)}.`);
      ctx.redraw();
      return;
    }
    const needsEnemy = card?.targetRule === 'Enemy';
    ctx.patchBattle({ selection: chooseActor(selection, unit.instanceId, needsEnemy) });
    return;
  }
  if (selection.mode === 'pickTarget') {
    if (unit.sideId === 'player' || unit.ko) {
      ctx.setNotice('Pick a living enemy.');
      ctx.redraw();
      return;
    }
    ctx.patchBattle({ selection: chooseTarget(selection, unit.instanceId) });
  }
}

function handCard(ctx, instanceId) {
  return ctx.api.getZones(ctx.match, 'player').hand.find((card) => card.instanceId === instanceId) ?? null;
}

function handRow(ctx) {
  const wrap = el('div', 'hand');
  const zones = ctx.api.getZones(ctx.match, 'player');
  zones.hand.forEach((card, index) => {
    const reason = typeof ctx.api.playBlockReason === 'function'
      ? ctx.api.playBlockReason(ctx.match, card)
      : null;
    const discarding = ctx.battleUi.discardIds.includes(card.instanceId);
    const face = renderCard(ctx.manifest, actionModel(card), {
      disabled: ctx.match.phase === 'playerTurn' && ctx.battleUi.voluntary && Boolean(reason && reason.startsWith('FAC')),
      reason,
      selected: ctx.battleUi.selection.cardInstanceId === card.instanceId || discarding,
      onClick: () => onCard(ctx, card, reason),
    });
    face.classList.add('hand-card');
    if (ctx.match.phase === 'playerTurn' && !reason) face.classList.add('is-playable');
    enableCardThrow(ctx, face, card, reason);
    face.style.zIndex = String(index + 1);
    wrap.append(face);
  });
  return wrap;
}

function onCard(ctx, card, reason) {
  if (ctx.autoRunning) {
    ctx.setNotice('Auto is in the middle of an action. Switch AUTO off to take the next one.');
    ctx.redraw();
    return;
  }
  if (ctx.match.phase === 'mandatoryDiscard') {
    toggleDiscard(ctx, card.instanceId);
    return;
  }
  if (ctx.battleUi.voluntary) {
    if ((ctx.match.ap.player ?? 0) < 1) {
      ctx.setNotice('Tossing a card costs 1 AP.');
      ctx.redraw();
      return;
    }
    ctx.patchBattle({
      confirm: {
        kind: 'discard',
        cardInstanceId: card.instanceId,
        text: `Spend 1 AP to toss ${card.name}? Cancel spends nothing.`,
      },
    });
    return;
  }
  if (ctx.match.phase !== 'playerTurn') {
    ctx.setNotice('It is not your turn. You can still open the piles.');
    ctx.redraw();
    return;
  }
  if (reason && reason.startsWith('FAC')) {
    ctx.setNotice(reason);
    ctx.redraw();
    return;
  }
  if (reason && reason.startsWith('Needs')) {
    ctx.setNotice(reason);
    ctx.redraw();
    return;
  }
  ctx.patchBattle({ selection: beginCard(card), confirm: null });
}

function toggleDiscard(ctx, instanceId) {
  const ids = ctx.battleUi.discardIds.includes(instanceId)
    ? ctx.battleUi.discardIds.filter((id) => id !== instanceId)
    : ctx.battleUi.discardIds.concat(instanceId);
  ctx.patchBattle({ discardIds: ids });
}

function pileStack(ctx, box) {
  const stack = el('div', 'pile-stack');
  stack.dataset.band = 'piles';
  place(stack, box);
  const zones = ctx.api.getZones(ctx.match, 'player');
  for (const [zone, label] of [['draw', 'DECK'], ['discard', 'DISCARD'], ['void', 'VOID']]) {
    const row = button('', () => {
      ctx.patchBattle({ pile: { sideId: 'player', zone }, confirm: null });
    }, 'pile-btn plate');
    row.append(el('span', zone === 'void' ? 'pile-glyph is-void' : 'pile-glyph'));
    row.append(el('span', 'pile-name', label));
    row.append(el('span', 'pile-count', String(zones[zone].length)));
    const fx = ctx.battleUi.fx;
    const burst = (zone === 'draw' && fx?.draw) || (zone === 'discard' && fx?.discard)
      ? findAsset(ctx.manifest, { slot: 'zone-vfx', subjectId: zone })
      : null;
    if (burst) {
      const overlay = el('img', 'zone-vfx');
      overlay.alt = '';
      bindImage(overlay, burst);
      row.append(overlay);
    }
    const icon = findAsset(ctx.manifest, { slot: 'ui-icon', subjectId: zone });
    paintIfReady(row, icon);
    stack.append(row);
  }
  return stack;
}

function controls(ctx, box) {
  const match = ctx.match;
  const panel = el('div', 'battle-controls');
  panel.dataset.band = 'controls';
  place(panel, box);
  const end = button('END\nTURN', () => {
    if (ctx.autoRunning) {
      ctx.setNotice('Auto is in the middle of an action. Switch AUTO off to take the next one.');
      ctx.redraw();
      return;
    }
    if (match.phase !== 'playerTurn') {
      ctx.setNotice('End Turn waits for your turn. It will not press itself.');
      ctx.redraw();
      return;
    }
    const cancelled = cancelPlay(match);
    ctx.api.endTurn(match);
    ctx.patchBattle({ selection: cancelled.selection, confirm: null, voluntary: false });
    settle(ctx);
  }, 'end-turn plate');
  paintIfReady(end, findAsset(ctx.manifest, { slot: 'ui-button', subjectId: 'end-turn' }));
  panel.append(end);
  const available = ctx.api.autoAvailable === true;
  const rules = typeof ctx.api.dataRules === 'function' ? ctx.api.dataRules() : null;
  const choices = speedChoices(rules);
  const speed = choices.includes(ctx.autoSpeed) ? ctx.autoSpeed : (rules?.autoPolicy?.speed?.value ?? 'normal');
  const autoRow = el('div', 'auto-row');
  const auto = button('AUTO', () => ctx.setAuto(!ctx.autoEnabled), 'auto-toggle plate');
  auto.disabled = !available;
  auto.title = available ? 'Play your turns with the engine auto.' : 'Auto loading';
  if (ctx.autoEnabled) auto.classList.add('is-on');
  auto.dataset.auto = available ? (ctx.autoEnabled ? 'on' : 'off') : 'loading';
  autoRow.append(auto);
  if (available) {
    const chip = button(speed, () => {
      const index = choices.indexOf(speed);
      ctx.setAutoSpeed(choices[(index + 1) % choices.length]);
    }, 'speed-btn plate');
    chip.title = 'PROPOSED playback speed.';
    autoRow.append(chip);
  }
  panel.append(autoRow);
  if (ctx.battleUi.selection.mode === 'confirmPlay') {
    const row = el('div', 'auto-row');
    row.append(button('Play card', () => askPlay(ctx), 'toss-btn'));
    row.append(button('Cancel', () => {
      const cancelled = cancelPlay(match);
      ctx.setNotice('Cancelled. No AP spent.');
      ctx.patchBattle({ selection: cancelled.selection, confirm: null });
    }, 'toss-btn'));
    panel.append(row);
  } else {
    panel.append(button(ctx.battleUi.voluntary ? 'Cancel toss' : 'Toss 1 AP', () => {
      if (ctx.autoRunning) return;
      if (match.phase !== 'playerTurn') {
        ctx.setNotice('You can toss a card only on your turn.');
        ctx.redraw();
        return;
      }
      ctx.patchBattle({ voluntary: !ctx.battleUi.voluntary, selection: cancelPlay(match).selection, confirm: null });
    }, 'toss-btn'));
  }
  return panel;
}

function askPlay(ctx) {
  const selection = ctx.battleUi.selection;
  const card = handCard(ctx, selection.cardInstanceId);
  const actor = ctx.match.units.find((unit) => unit.instanceId === selection.actorAvatarId);
  const target = ctx.match.units.find((unit) => unit.instanceId === selection.targetId);
  const text = target
    ? `Play ${card?.name} with ${actor?.name} on ${target?.name}? Costs ${card?.costAp} AP. Cancel spends nothing.`
    : `Play ${card?.name} with ${actor?.name}? Costs ${card?.costAp} AP. Cancel spends nothing.`;
  ctx.patchBattle({ confirm: { kind: 'play', text } });
}

function confirmModal(ctx) {
  const confirm = ctx.battleUi.confirm;
  return modal(confirm.kind === 'discard' ? 'Toss a card?' : 'Play this?', el('p', null, confirm.text), [
    {
      label: 'Yes',
      onClick: () => {
        if (confirm.kind === 'discard') {
          ctx.api.discardVoluntary(ctx.match, confirm.cardInstanceId);
          ctx.setNotice(ctx.match.lastError || 'Tossed. 1 AP spent.');
        } else {
          const selection = ctx.battleUi.selection;
          ctx.api.playAction(ctx.match, {
            cardInstanceId: selection.cardInstanceId,
            actorAvatarId: selection.actorAvatarId,
            targets: selection.targetId ? [selection.targetId] : [],
          });
          ctx.setNotice(ctx.match.lastError || 'The card resolves.');
        }
        ctx.patchBattle({ confirm: null, selection: cancelPlay(ctx.match).selection, voluntary: false });
        settle(ctx);
      },
    },
    {
      label: 'Cancel',
      onClick: () => {
        ctx.setNotice('Cancelled. No AP spent.');
        ctx.patchBattle({ confirm: null, selection: cancelPlay(ctx.match).selection });
      },
    },
  ]);
}

function mandatoryModal(ctx) {
  const need = ctx.match.pendingDiscard ?? 0;
  const chosen = ctx.battleUi.discardIds.length;
  return modal(
    'The hand is stuffed',
    el('p', null, `Discard ${need} card${need === 1 ? '' : 's'} for free. Chosen ${chosen}. This does not spend AP.`),
    [
      {
        label: 'Discard chosen',
        onClick: () => {
          ctx.api.resolveEndOfRoundDiscard(ctx.match, ctx.battleUi.discardIds);
          if (ctx.match.lastError) {
            ctx.setNotice(ctx.match.lastError);
            ctx.redraw();
            return;
          }
          ctx.setNotice('Free discard done. AP unchanged by the discard.');
          ctx.patchBattle({ discardIds: [], selection: cancelPlay(ctx.match).selection });
          settle(ctx);
        },
      },
    ],
  );
}

function pileModal(ctx) {
  const { sideId, zone } = ctx.battleUi.pile;
  const zones = ctx.api.getZones(ctx.match, sideId);
  const cards = zones[zone] ?? [];
  const body = el('div', 'pile-list');
  body.append(el('p', 'fine', `${zone} · ${cards.length} card${cards.length === 1 ? '' : 's'}. Open any time.`));
  if (cards.length === 0) body.append(el('p', null, 'Empty. Even the jokes went home.'));
  for (const card of cards) body.append(el('p', null, `${card.name} · ${card.type} · ${card.costAp} AP · ${card.rarity}`));
  return modal(`${zone[0].toUpperCase()}${zone.slice(1)} pile`, body, [
    { label: 'Close', onClick: () => ctx.patchBattle({ pile: null }) },
  ]);
}

function settle(ctx) {
  ctx.persist?.(false);
  let outcome = ctx.api.getOutcome(ctx.match);
  if (outcome.status !== 'decided' && ctx.match.phase === 'enemyTurn' && typeof ctx.api.playEnemyTurn === 'function') {
    ctx.api.playEnemyTurn(ctx.match);
    outcome = ctx.api.getOutcome(ctx.match);
  }
  if (outcome.status === 'decided') {
    ctx.goto('rewards');
    return;
  }
  ctx.redraw();
}


// ---- Card throw (Owner 2026-11-21): drag a card onto a character, with a curved light line. ----

const SNAP_RADIUS = 230; // stage px: generous so a throw never misses its character

function stageScale() {
  const stage = document.getElementById('stage');
  if (!stage) return { rect: { left: 0, top: 0 }, k: 1 };
  const rect = stage.getBoundingClientRect();
  return { rect, k: rect.width / 1672 || 1 };
}

function toStage(clientX, clientY) {
  const { rect, k } = stageScale();
  return { x: (clientX - rect.left) / k, y: (clientY - rect.top) / k };
}

function unitCentre(node) {
  const r = node.getBoundingClientRect();
  const sprite = node.querySelector('.sprite')?.getBoundingClientRect();
  const box = sprite && sprite.height > 0 ? sprite : r;
  return toStage(box.left + box.width / 2, box.top + box.height * 0.45);
}

function engineAtk(ctx, unit) {
  const row = ctx.match.engine?.sides?.[unit.sideId]?.avatars?.find((a) => a.avatarId === unit.avatarId);
  return row?.stats?.atk ?? 0;
}

function eligibleAllies(ctx, card) {
  return ctx.match.units.filter((u) => u.sideId === 'player' && !u.ko
    && (!card.factionRequirement || u.factionId === card.factionRequirement));
}

function dropTargets(ctx, card) {
  if (card.targetRule === 'Enemy') {
    if (eligibleAllies(ctx, card).length === 0) return [];
    return ctx.match.units.filter((u) => u.sideId === 'enemy' && !u.ko);
  }
  return eligibleAllies(ctx, card);
}

function throwCard(ctx, card, unit) {
  let actor = unit;
  let targets = [];
  if (card.targetRule === 'Enemy') {
    actor = eligibleAllies(ctx, card).sort((a, b) => engineAtk(ctx, b) - engineAtk(ctx, a))[0];
    targets = [unit.instanceId];
  }
  if (!actor) return;
  ctx.api.playAction(ctx.match, { cardInstanceId: card.instanceId, actorAvatarId: actor.instanceId, targets });
  ctx.setNotice(ctx.match.lastError || `${card.name.replace(/^Placeholder\s+/, '')} → ${unit.name}`);
  ctx.patchBattle({ confirm: null, selection: cancelPlay(ctx.match).selection, voluntary: false });
  settle(ctx);
}

function enableCardThrow(ctx, face, card, reason) {
  face.style.touchAction = 'none';
  face.addEventListener('pointerdown', (down) => {
    if (ctx.autoRunning || ctx.match.phase !== 'playerTurn' || ctx.battleUi.voluntary || reason) return;
    const start = { x: down.clientX, y: down.clientY };
    let drag = null;
    const stage = document.getElementById('stage');
    const field = stage?.querySelector('[data-screen="battle"]');
    const move = (ev) => {
      if (!drag) {
        if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 10) return;
        drag = beginDrag(ctx, face, card, field);
      }
      updateDrag(drag, ev);
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (!drag) return;
      const hit = drag.current;
      endDrag(drag);
      face.dataset.dragged = '1';
      setTimeout(() => { delete face.dataset.dragged; }, 50);
      if (hit) throwCard(ctx, card, hit.unit);
      else {
        ctx.setNotice(drag.targets.length ? 'Drop the card on a glowing character.' : 'No character can use that card.');
        ctx.redraw();
      }
      ev.preventDefault();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  });
  face.addEventListener('click', (ev) => {
    if (face.dataset.dragged) { ev.stopImmediatePropagation(); ev.preventDefault(); }
  }, true);
}

function beginDrag(ctx, face, card, field) {
  const units = dropTargets(ctx, card);
  const nodes = units.map((unit) => {
    const node = field?.querySelector(`.unit[data-side-id="${unit.sideId}"][data-avatar-id="${unit.avatarId}"]`);
    node?.classList.add('throw-candidate');
    return node ? { unit, node, c: unitCentre(node) } : null;
  }).filter(Boolean);
  const r = face.getBoundingClientRect();
  const origin = toStage(r.left + r.width / 2, r.top + r.height * 0.3);
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'throw-arc');
  svg.setAttribute('viewBox', '0 0 1672 941');
  const glow = document.createElementNS(ns, 'path');
  glow.setAttribute('class', 'throw-arc-glow');
  const line = document.createElementNS(ns, 'path');
  line.setAttribute('class', 'throw-arc-line');
  const tip = document.createElementNS(ns, 'circle');
  tip.setAttribute('class', 'throw-arc-tip');
  tip.setAttribute('r', '16');
  svg.append(glow, line, tip);
  const ghost = face.cloneNode(true);
  ghost.classList.add('throw-ghost');
  ghost.removeAttribute('style');
  const { k } = stageScale();
  ghost.style.width = `${r.width / k}px`;
  ghost.style.height = `${r.height / k}px`;
  const stage = document.getElementById('stage');
  stage.append(svg, ghost);
  face.classList.add('is-throwing');
  return { svg, glow, line, tip, ghost, face, origin, targets: nodes, current: null };
}

function updateDrag(drag, ev) {
  const p = toStage(ev.clientX, ev.clientY);
  let best = null;
  for (const t of drag.targets) {
    const d = Math.hypot(t.c.x - p.x, t.c.y - p.y);
    if (d < SNAP_RADIUS && (!best || d < best.d)) best = { ...t, d };
  }
  if (drag.current && drag.current.node !== best?.node) drag.current.node.classList.remove('throw-target');
  drag.current = best;
  const end = best ? best.c : p;
  if (best) best.node.classList.add('throw-target');
  const o = drag.origin;
  const cx = (o.x + end.x) / 2;
  const cy = Math.min(o.y, end.y) - 220 - Math.abs(end.x - o.x) * 0.15;
  const d = `M ${o.x} ${o.y} Q ${cx} ${cy} ${end.x} ${end.y}`;
  drag.glow.setAttribute('d', d);
  drag.line.setAttribute('d', d);
  drag.tip.setAttribute('cx', String(end.x));
  drag.tip.setAttribute('cy', String(end.y));
  drag.svg.classList.toggle('is-locked', Boolean(best));
  const gw = parseFloat(drag.ghost.style.width) || 140;
  const gh = parseFloat(drag.ghost.style.height) || 200;
  drag.ghost.style.left = `${p.x - gw / 2}px`;
  drag.ghost.style.top = `${p.y - gh * 0.6}px`;
}

function endDrag(drag) {
  drag.svg.remove();
  drag.ghost.remove();
  drag.face.classList.remove('is-throwing');
  for (const t of drag.targets) t.node.classList.remove('throw-candidate', 'throw-target');
}
