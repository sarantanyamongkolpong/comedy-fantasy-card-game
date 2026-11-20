import { bindImage, findAsset, firstAsset } from '../assets.js';
import { beginCard, cancelPlay, chooseActor, chooseTarget } from '../battle-flow.js';
import { button, el, modal } from '../dom.js';
import { actionModel, renderCard } from '../render-card.js';
import { factionName } from '../sample-catalog.js';

const STATUS_SUBJECT = {
  shield: 'shield',
  taunt: 'taunt',
  regen: 'regen',
  atkBuff: 'atk',
  defBuff: 'def',
  nextStrike: 'atk',
};

export function renderBattle(ctx) {
  const match = ctx.match;
  const ui = ctx.battleUi;
  const root = el('section', 'battle');
  const top = el('header', 'battle-top');
  const modeLabel = match.mode === 'arena' ? 'Tournament Arena (practice echo)' : 'Mysterious Tower (practice echo)';
  top.append(el('div', 'title-block', null));
  top.firstChild.append(el('h1', 'title', modeLabel));
  top.firstChild.append(el('p', 'badge', 'HP & damage PROVISIONAL · End Turn is always manual'));
  top.append(button('Flee to map', () => ctx.goto('map'), 'hit slim'));
  root.append(top);

  root.append(unitRow(ctx, 'enemy', 'Echoes'));
  root.append(unitRow(ctx, 'player', 'Your team'));

  const lower = el('div', 'battle-lower');
  lower.append(handRow(ctx));
  lower.append(rail(ctx));
  root.append(lower);

  if (ctx.notice) root.append(el('p', 'toast', ctx.notice));
  if (match.phase === 'mandatoryDiscard') root.append(mandatoryModal(ctx));
  else if (ui.confirm) root.append(confirmModal(ctx));
  else if (ui.pile) root.append(pileModal(ctx));
  return root;
}

function unitRow(ctx, sideId, label) {
  const row = el('div', `unit-row side-${sideId}`);
  row.append(el('p', 'row-label', label));
  const units = ctx.match.units.filter((unit) => unit.sideId === sideId);
  const strip = el('div', 'units');
  for (const unit of units) strip.append(unitButton(ctx, unit));
  row.append(strip);
  return row;
}

function unitButton(ctx, unit) {
  const ui = ctx.battleUi;
  const node = el('button', `unit${unit.ko ? ' is-ko' : ''}`);
  node.type = 'button';
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
  node.append(el('span', 'unit-name', unit.name));
  node.append(el('span', 'unit-meta', `${factionName(unit.factionId)} · ${unit.role}`));
  node.append(el('span', 'unit-hp', `HP ${unit.hp}/${unit.maxHp}`));
  node.append(el('span', 'fine', 'provisional'));
  const icons = el('span', 'statuses');
  if (unit.ko) icons.append(statusIcon(ctx, 'ko', 'Down'));
  for (const status of unit.statuses) {
    icons.append(statusIcon(ctx, STATUS_SUBJECT[status.id] ?? status.id, status.name));
  }
  node.append(icons);
  const selected = ui.selection.actorAvatarId === unit.instanceId || ui.selection.targetId === unit.instanceId;
  if (selected) node.classList.add('is-selected');
  node.addEventListener('click', () => onUnit(ctx, unit));
  return node;
}

function statusIcon(ctx, subjectId, label) {
  const wrap = el('span', 'status');
  const art = findAsset(ctx.manifest, { slot: 'status-icon', subjectId });
  if (art) {
    const img = el('img');
    img.alt = label;
    bindImage(img, art);
    wrap.append(img);
  }
  wrap.append(el('b', null, label));
  return wrap;
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
  for (const card of zones.hand) {
    const reason = typeof ctx.api.playBlockReason === 'function'
      ? ctx.api.playBlockReason(ctx.match, card)
      : null;
    const discarding = ctx.battleUi.discardIds.includes(card.instanceId);
    wrap.append(renderCard(ctx.manifest, actionModel(card), {
      disabled: ctx.match.phase === 'playerTurn' && ctx.battleUi.voluntary && Boolean(reason && reason.startsWith('FAC')),
      reason,
      selected: ctx.battleUi.selection.cardInstanceId === card.instanceId || discarding,
      onClick: () => onCard(ctx, card, reason),
    }));
  }
  return wrap;
}

function onCard(ctx, card, reason) {
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

function rail(ctx) {
  const match = ctx.match;
  const railNode = el('aside', 'rail');
  const ap = match.ap?.player ?? 0;
  const meter = el('div', 'ap-meter');
  meter.append(el('span', 'fine', 'AP'));
  const pips = el('span', 'pips');
  for (let i = 0; i < 5; i += 1) {
    const pip = el('span', i < ap ? 'pip is-on' : 'pip');
    const icon = findAsset(ctx.manifest, { slot: 'ui-icon', subjectId: 'ap' });
    if (icon) {
      const img = el('img');
      img.alt = '';
      bindImage(img, icon);
      pip.append(img);
    }
    pips.append(pip);
  }
  meter.append(pips);
  meter.append(el('b', null, `${ap}/5`));
  railNode.append(meter);

  const end = button('End Turn', () => {
    if (match.phase !== 'playerTurn') {
      ctx.setNotice('End Turn waits for your turn. It will not press itself.');
      ctx.redraw();
      return;
    }
    const cancelled = cancelPlay(match);
    ctx.api.endTurn(match);
    ctx.patchBattle({ selection: cancelled.selection, confirm: null, voluntary: false });
    settle(ctx);
  });
  if (match.phase !== 'playerTurn') end.disabled = false;
  railNode.append(end);

  railNode.append(button(ctx.battleUi.voluntary ? 'Cancel toss' : 'Toss a card (1 AP)', () => {
    if (match.phase !== 'playerTurn') {
      ctx.setNotice('You can toss a card only on your turn.');
      ctx.redraw();
      return;
    }
    ctx.patchBattle({ voluntary: !ctx.battleUi.voluntary, selection: cancelPlay(match).selection, confirm: null });
  }, 'hit slim'));

  const zones = ctx.api.getZones(match, 'player');
  const piles = el('div', 'piles');
  for (const [zone, label] of [['draw', 'Draw'], ['discard', 'Discard'], ['void', 'Void']]) {
    piles.append(button(`${label} ${zones[zone].length}`, () => {
      ctx.patchBattle({ pile: { sideId: 'player', zone }, confirm: null });
    }, 'hit slim'));
  }
  railNode.append(piles);
  const log = el('div', 'log');
  const lines = (match.log ?? []).slice(-6);
  for (const line of lines) log.append(el('p', null, line.text));
  railNode.append(log);
  if (ctx.battleUi.selection.mode === 'pickActor') railNode.append(el('p', 'fine', 'Who performs the card? Cancel with End Turn\'s neighbor or the No button after you pick.'));
  if (ctx.battleUi.selection.mode === 'confirmPlay') {
    railNode.append(button('Play card', () => askPlay(ctx)));
    railNode.append(button('Cancel', () => {
      const cancelled = cancelPlay(match);
      ctx.setNotice('Cancelled. No AP spent.');
      ctx.patchBattle({ selection: cancelled.selection, confirm: null });
    }, 'hit slim'));
  }
  return railNode;
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
