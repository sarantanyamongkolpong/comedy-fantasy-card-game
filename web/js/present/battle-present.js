/**
 * Battle presentation queue (Owner 2026-11-21, P0 visual playability).
 *
 * The engine resolves an action instantly. This module replays the new engine log rows on the
 * battle DOM that is still on screen (the pre-action picture), one event at a time: who acts,
 * the lunge, the hit, the floating number, the HP bar, the KO. It never changes engine state,
 * damage, AI or balance. When it finishes, the caller renders the real post-action screen.
 */

const BASE = {
  turn: 520,
  anticipation: 260,
  motion: 360,
  hit: 320,
  float: 850,
  ko: 520,
  gap: 120,
};

function scale(speed) {
  if (speed === 'fast') return 0.5;
  if (speed === 'slow') return 1.4;
  return 1;
}

function sleep(ms) {
  return new Promise((resolve) => { setTimeout(resolve, Math.max(0, Math.round(ms))); });
}

function unitNode(root, sideId, avatarId) {
  if (!root || !avatarId) return null;
  const sel = sideId
    ? `.unit[data-side-id="${sideId}"][data-avatar-id="${avatarId}"]`
    : `.unit[data-avatar-id="${avatarId}"]`;
  return root.querySelector(sel);
}

function floatText(node, text, tone) {
  if (!node) return;
  const span = document.createElement('span');
  span.className = `pfx-float pfx-${tone}`;
  span.textContent = text;
  node.append(span);
  setTimeout(() => span.remove(), 1400);
}

function burst(node, kind) {
  if (!node) return;
  const fx = document.createElement('span');
  fx.className = `pfx-burst pfx-burst-${kind}`;
  node.append(fx);
  setTimeout(() => fx.remove(), 700);
}

function setHp(node, hp, maxHp) {
  if (!node || !Number.isInteger(hp)) return;
  const text = node.querySelector('.unit-hp');
  const max = Number.isInteger(maxHp) ? maxHp : Number(node.dataset.maxHp || 0);
  if (text) text.textContent = `${Math.max(0, hp)}/${max || '?'}`;
  const fill = node.querySelector('.hp-fill');
  if (fill && max > 0) fill.style.width = `${Math.max(0, Math.min(1, hp / max)) * 100}%`;
}

function banner(root, text, tone, ms) {
  const host = root?.closest('#stage') ?? root;
  if (!host) return sleep(ms);
  const node = document.createElement('div');
  node.className = `pfx-banner pfx-banner-${tone}`;
  node.textContent = text;
  host.append(node);
  return sleep(ms).then(() => node.remove());
}

function cardName(engine, sideId, cardId) {
  const side = engine?.sides?.[sideId];
  if (!side) return cardId ?? 'a card';
  for (const zone of Object.values(side.zones ?? {})) {
    const hit = (zone ?? []).find((card) => card.cardId === cardId);
    if (hit?.name) return hit.name.replace(/^Placeholder\s+/, '');
  }
  return cardId ?? 'a card';
}

function unitName(engine, sideId, avatarId) {
  const unit = engine?.sides?.[sideId]?.avatars?.find((row) => row.avatarId === avatarId);
  return unit?.name ?? avatarId ?? '';
}

function caption(root, text) {
  const host = root?.closest('#stage') ?? root;
  if (!host) return;
  let node = host.querySelector('.pfx-caption');
  if (!node) {
    node = document.createElement('div');
    node.className = 'pfx-caption';
    host.append(node);
  }
  node.textContent = text;
  node.classList.remove('is-on');
  void node.offsetWidth;
  node.classList.add('is-on');
}

/**
 * @param {HTMLElement} root  battle screen element currently on the stage
 * @param {object[]} events   new engine log rows, in order
 * @param {{ engine: object, speed?: string, playerSide?: string }} opts
 */
export async function presentBattleEvents(root, events, opts = {}) {
  if (!root || !Array.isArray(events) || events.length === 0) return;
  const k = scale(opts.speed);
  const engine = opts.engine;
  const playerSide = opts.playerSide ?? 'player';
  let actor = null;
  root.classList.add('is-presenting');
  try {
    for (const e of events) {
      if (!e || typeof e !== 'object') continue;
      if (e.type === 'turn_start') {
        const mine = e.sideId === playerSide;
        await banner(root, mine ? 'YOUR TURN' : 'ENEMY TURN', mine ? 'player' : 'enemy', BASE.turn * k);
      } else if (e.type === 'play') {
        if (actor) actor.classList.remove('pfx-acting', 'pfx-lunge');
        actor = unitNode(root, e.sideId, e.actorAvatarId);
        caption(root, `${unitName(engine, e.sideId, e.actorAvatarId)} — ${cardName(engine, e.sideId, e.cardId)}`);
        if (actor) {
          actor.classList.add('pfx-acting');
          await sleep(BASE.anticipation * k);
          if (e.actionType === 'ATK') actor.classList.add('pfx-lunge');
          else burst(actor, e.actionType === 'Skill' ? 'magic' : 'guard');
          await sleep(BASE.motion * k);
        }
      } else if (e.type === 'damage') {
        const target = unitNode(root, e.sideId, e.avatarId);
        if (target) {
          burst(target, 'slash');
          target.classList.remove('pfx-hit');
          void target.offsetWidth;
          target.classList.add('pfx-hit');
          const dealt = Number.isInteger(e.dealt) ? e.dealt : 0;
          const absorbed = Number.isInteger(e.absorbed) ? e.absorbed : 0;
          if (absorbed > 0) floatText(target, `BLOCK ${absorbed}`, 'shield');
          if (dealt > 0) floatText(target, `-${dealt}`, 'damage');
          else if (absorbed === 0) floatText(target, 'MISS', 'miss');
          setHp(target, e.hp, e.maxHp);
        }
        await sleep((BASE.hit + BASE.gap) * k);
      } else if (e.type === 'shield') {
        const target = unitNode(root, e.sideId, e.avatarId);
        burst(target, 'shield');
        floatText(target, `+${e.amount ?? 0} SHIELD`, 'shield');
        await sleep(BASE.hit * k);
      } else if (e.type === 'regen_applied') {
        const target = unitNode(root, e.sideId, e.avatarId);
        burst(target, 'heal');
        floatText(target, 'REGEN', 'heal');
        await sleep(BASE.hit * k);
      } else if (e.type === 'regen_tick') {
        const target = unitNode(root, e.sideId, e.avatarId);
        const healed = Number.isInteger(e.healed) ? e.healed : 0;
        if (healed > 0) {
          burst(target, 'heal');
          floatText(target, `+${healed}`, 'heal');
          setHp(target, e.hp, e.maxHp);
          await sleep(BASE.hit * k);
        }
      } else if (e.type === 'passive_proc') {
        const target = unitNode(root, e.sideId, e.avatarId) ?? unitNode(root, null, e.avatarId);
        floatText(target, e.name ? `${e.name}!` : 'PASSIVE', 'passive');
        await sleep(BASE.gap * 2 * k);
      } else if (e.type === 'avatar_defeated') {
        const target = unitNode(root, e.sideId, e.avatarId);
        if (target) {
          floatText(target, 'KO!', 'ko');
          target.classList.add('pfx-ko');
        }
        await sleep(BASE.ko * k);
      } else if (e.type === 'taunt' || e.type === 'status') {
        const target = unitNode(root, e.sideId, e.avatarId);
        floatText(target, (e.kind ?? e.type).toUpperCase(), 'passive');
        await sleep(BASE.gap * 2 * k);
      }
    }
    if (actor) {
      actor.classList.remove('pfx-lunge');
      await sleep(BASE.gap * k);
      actor.classList.remove('pfx-acting');
    }
    await sleep(BASE.float * 0.5 * k);
  } finally {
    root.classList.remove('is-presenting');
  }
}

export async function presentOutcome(root, won) {
  const host = root?.closest('#stage') ?? root;
  if (!host) return;
  await banner(root, won ? 'VICTORY!' : 'DEFEAT', won ? 'victory' : 'defeat', 1500);
}
