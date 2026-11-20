import { speedChoices } from '../auto-play.js';
import { bindImage, findAsset, firstAsset } from '../assets.js';
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
  const root = el('section', 'battle');
  root.dataset.screen = 'battle';
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
  return root;
}

function topBar(ctx, box) {
  const bar = el('header', 'battle-top');
  place(bar, box);
  const badge = button('BATTLE', () => ctx.goto('map'), 'battle-badge');
  const plate = findAsset(ctx.manifest, { slot: 'ui-badge', subjectId: 'battle' });
  if (plate) {
    const img = el('img');
    img.alt = '';
    bindImage(img, plate);
    badge.prepend(img);
  }
  bar.append(badge);
  const turn = el('p', 'turn-chip', `TURN ${String(ctx.match.turnIndex ?? 1).padStart(2, '0')}`);
  bar.append(turn);
  bar.append(apMeter(ctx));
  return bar;
}

function apMeter(ctx) {
  const ap = ctx.match.ap?.player ?? 0;
  const meter = el('div', 'ap-meter');
  meter.append(el('b', null, `AP ${ap}/5`));
  const pips = el('span', 'pips');
  const icon = findAsset(ctx.manifest, { slot: 'ui-icon', subjectId: 'ap-pip' })
    ?? findAsset(ctx.manifest, { slot: 'ui-icon', subjectId: 'ap' });
  for (let i = 0; i < 5; i += 1) {
    const pip = el('span', i < ap ? 'pip is-on' : 'pip');
    if (icon) {
      const img = el('img');
      img.alt = '';
      bindImage(img, icon);
      pip.append(img);
    }
    pips.append(pip);
  }
  meter.append(pips);
  return meter;
}

function arena(ctx, bands) {
  const field = el('div', 'arena');
  field.dataset.band = 'arena';
  place(field, bands.arena);
  const bg = findAsset(ctx.manifest, { slot: 'bg-battle', subjectId: 'battle' });
  if (bg) {
    const img = el('img', 'battle-bg');
    img.alt = '';
    bindImage(img, bg);
    field.append(img);
  }
  const lead = el('div', 'lead-plate');
  place(lead, {
    x: bands.lead.x - bands.arena.x,
    y: bands.lead.y - bands.arena.y,
    w: bands.lead.w,
    h: bands.lead.h,
  });
  const front = ctx.match.units.find((unit) => unit.sideId === 'enemy' && !unit.ko)
    ?? ctx.match.units.find((unit) => unit.sideId === 'enemy');
  lead.append(el('b', null, front ? front.name : 'Echoes'));
  lead.append(el('span', null, front ? `${front.hp} / ${front.maxHp}` : ''));
  field.append(lead);
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

function unitToken(ctx, unit, slot, arenaBox) {
  const node = el('button', `unit${unit.ko ? ' is-ko' : ''}${unit.sideId === 'enemy' ? ' faces-left' : ' faces-right'}`);
  node.type = 'button';
  const local = {
    x: slot.box.x - arenaBox.x,
    y: slot.box.y - arenaBox.y,
    w: slot.box.w,
    h: slot.box.h,
  };
  place(node, local);
  const tile = findAsset(ctx.manifest, { slot: 'battle-tile', subjectId: unit.sideId });
  if (tile) {
    const pad = el('img', 'tile');
    pad.alt = '';
    bindImage(pad, tile);
    node.append(pad);
  }
  const art = firstAsset(ctx.manifest, [
    { slot: 'battle-sprite', subjectId: unit.avatarId },
    { slot: 'illustration', subjectId: unit.avatarId },
  ]);
  if (art) {
    const img = el('img', 'sprite');
    img.alt = '';
    bindImage(img, art);
    node.append(img);
  }
  const floater = (unit.statuses ?? []).find((status) => status.label);
  if (floater) node.append(el('span', 'floater', floater.label));
  const bar = el('span', 'hp-bar');
  const fill = el('span', 'hp-fill');
  const ratio = unit.maxHp ? Math.max(0, Math.min(1, unit.hp / unit.maxHp)) : 0;
  fill.style.width = `${ratio * 100}%`;
  bar.append(fill);
  node.append(bar);
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
    const row = button(`${label} ${zones[zone].length}`, () => {
      ctx.patchBattle({ pile: { sideId: 'player', zone }, confirm: null });
    }, 'pile-btn');
    const icon = findAsset(ctx.manifest, { slot: 'ui-icon', subjectId: zone });
    if (icon) {
      const img = el('img');
      img.alt = '';
      bindImage(img, icon);
      row.prepend(img);
    }
    stack.append(row);
  }
  return stack;
}

function controls(ctx, box) {
  const match = ctx.match;
  const panel = el('div', 'battle-controls');
  panel.dataset.band = 'controls';
  place(panel, box);
  const end = button('END TURN', () => {
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
  }, 'end-turn');
  const art = findAsset(ctx.manifest, { slot: 'ui-button', subjectId: 'end-turn' });
  if (art) {
    const img = el('img');
    img.alt = '';
    bindImage(img, art);
    end.prepend(img);
  }
  panel.append(end);
  const available = ctx.api.autoAvailable === true;
  const rules = typeof ctx.api.dataRules === 'function' ? ctx.api.dataRules() : null;
  const choices = speedChoices(rules);
  const speed = choices.includes(ctx.autoSpeed) ? ctx.autoSpeed : (rules?.autoPolicy?.speed?.value ?? 'normal');
  const autoRow = el('div', 'auto-row');
  const auto = button('AUTO', () => ctx.setAuto(!ctx.autoEnabled), 'auto-toggle');
  auto.disabled = !available;
  auto.title = available ? 'Play your turns with the engine auto.' : 'Auto loading';
  if (ctx.autoEnabled) auto.classList.add('is-on');
  auto.dataset.auto = available ? (ctx.autoEnabled ? 'on' : 'off') : 'loading';
  autoRow.append(auto);
  if (available) {
    const chip = button(speed, () => {
      const index = choices.indexOf(speed);
      ctx.setAutoSpeed(choices[(index + 1) % choices.length]);
    }, 'speed-btn');
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
