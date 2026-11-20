import { assetUrl, bindImage, findAsset } from '../assets.js';
import { chromeButton, paintFrame } from '../chrome.js';
import { button, el, shell } from '../dom.js';
import { inDeck, inTeam, ownedAction, ownedAvatar, toggleFlag } from '../profile.js';
import { actionModel, avatarModel, playerFacingName, renderCard } from '../render-card.js';

const RARITY_RANK = { N: 1, R: 2, Epic: 3, FAC: 4, EX: 5, TBD: 0 };

export function groupOwned(rows, idKey) {
  const groups = new Map();
  for (const row of rows ?? []) {
    const id = row?.[idKey];
    if (!id) continue;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(row);
  }
  return [...groups.values()];
}

export function stashCapacityLine(report) {
  const slots = report?.storage?.installedSlots;
  const known = Number.isInteger(slots) ? String(slots) : 'PENDING';
  return `Furniture slots: ${known}. Cabin base: PENDING (HOME-11). Total capacity: PENDING. A house tier adds no slots.`;
}

export function sortStacks(stacks, mode, labelOf, rarityOf) {
  const copy = stacks.slice();
  copy.sort((left, right) => {
    if (mode === 'count') return right.length - left.length || labelOf(left).localeCompare(labelOf(right));
    if (mode === 'rarity') {
      const gap = (RARITY_RANK[rarityOf(right)] ?? 0) - (RARITY_RANK[rarityOf(left)] ?? 0);
      if (gap) return gap;
    }
    return labelOf(left).localeCompare(labelOf(right));
  });
  return copy;
}

export function renderStash(ctx) {
  const body = el('div', 'stash');
  body.dataset.screen = 'stash';
  const filters = el('div', 'stash-filters');
  for (const [id, label] of [['avatars', 'Avatars'], ['actions', 'Actions'], ['tokens', 'TEST tokens']]) {
    const selected = ctx.stashFilter === id;
    const chip = chromeButton(ctx.manifest, label, () => ctx.setStashFilter(id), {
      variant: selected ? 'primary' : 'ghost',
      className: 'slim stash-filter',
    });
    const tab = findAsset(ctx.manifest, { slot: 'ui-tab', subjectId: selected ? 'selected' : 'unselected' });
    if (tab) chip.style.backgroundImage = `url("${assetUrl(tab)}")`;
    if (selected) chip.classList.add('is-selected');
    filters.append(chip);
  }
  const sortMode = ctx.stashSort || 'name';
  filters.append(chromeButton(ctx.manifest, `Sort: ${sortMode}`, () => ctx.setStashSort(nextSort(sortMode)), {
    variant: 'secondary',
    icon: 'sort',
    className: 'slim',
  }));
  body.append(filters);

  const report = typeof ctx.api.stashReport === 'function' ? ctx.api.stashReport(ctx.profile) : null;
  const hint = el('p', 'stash-hint', `${stashCapacityLine(report)} Stacks are copies of the same card. Lock and favorite still apply to one copy.`);
  paintFrame(hint, ctx.manifest, 'tooltip');
  body.append(hint);

  const scroll = el('div', 'bag-scroll');
  const grid = el('div', 'bag-grid');
  if (ctx.stashFilter === 'tokens') {
    if (ctx.profile.tokens.length === 0) {
      grid.append(el('p', 'lede', 'No TEST tokens yet. The gachapon is through the map, coughing politely.'));
    }
    for (const token of ctx.profile.tokens) {
      const card = el('article', 'token');
      card.append(el('h2', null, token.name));
      card.append(el('p', null, `${token.pool} · ${token.rarity} · ×1 · TEST`));
      card.append(el('p', 'fine', token.note));
      grid.append(card);
    }
  } else {
    const kind = ctx.stashFilter === 'actions' ? 'action' : 'avatar';
    const rows = kind === 'avatar' ? ctx.profile.avatars : ctx.profile.actions;
    const stacks = sortStacks(
      groupOwned(rows, kind === 'avatar' ? 'avatarId' : 'cardId'),
      sortMode,
      (stack) => stackLabel(ctx, kind, stack),
      (stack) => stackRarity(ctx, kind, stack),
    );
    for (const stack of stacks) grid.append(slotButton(ctx, kind, stack));
  }
  scroll.append(grid);
  body.append(scroll);
  if (ctx.detail?.stackId) {
    body.classList.add('has-detail');
    body.append(detailPanel(ctx));
  }

  const view = shell(ctx, 'The Stash', body, { back: 'home' });
  const bg = findAsset(ctx.manifest, { slot: 'bg-stash', subjectId: 'inventory' });
  if (bg) {
    const img = el('img', 'scene-bg');
    img.alt = '';
    bindImage(img, bg, { eager: true });
    view.prepend(img);
    view.classList.add('has-scene');
  }
  return view;
}

function nextSort(mode) {
  if (mode === 'name') return 'rarity';
  if (mode === 'rarity') return 'count';
  return 'name';
}

function stackLabel(ctx, kind, stack) {
  const def = defOf(ctx, kind, stack[0]);
  return playerFacingName(def?.name ?? stack[0].avatarId ?? stack[0].cardId);
}

function stackRarity(ctx, kind, stack) {
  return defOf(ctx, kind, stack[0])?.rarity ?? '';
}

function defOf(ctx, kind, owned) {
  if (!owned) return null;
  return kind === 'avatar' ? ctx.api.catalog.avatarById(owned.avatarId) : ctx.api.catalog.cardById(owned.cardId);
}

function slotButton(ctx, kind, stack) {
  const owned = stack[0];
  const def = defOf(ctx, kind, owned);
  const stackId = kind === 'avatar' ? owned.avatarId : owned.cardId;
  const node = button('', () => ctx.setDetail({ kind, stackId }), 'bag-slot');
  const frame = findAsset(ctx.manifest, { slot: 'ui-frame', subjectId: 'slot' });
  if (frame) {
    const img = el('img', 'slot-frame');
    img.alt = '';
    bindImage(img, frame);
    node.append(img);
  }
  node.append(el('span', 'slot-name', stackLabel(ctx, kind, stack)));
  node.append(el('span', 'slot-meta', def?.rarity || def?.role || ''));
  node.append(el('span', 'stack-count', `×${stack.length}`));
  if (ctx.detail?.stackId === stackId) node.classList.add('is-selected');
  return node;
}

function detailPanel(ctx) {
  const { kind, stackId } = ctx.detail;
  const rows = (kind === 'avatar' ? ctx.profile.avatars : ctx.profile.actions)
    .filter((row) => (kind === 'avatar' ? row.avatarId : row.cardId) === stackId);
  const panel = el('aside', 'detail bag-detail');
  paintFrame(panel, ctx.manifest, 'detail');
  if (rows.length === 0) {
    panel.append(el('p', null, 'That stack wandered off.'));
    return panel;
  }
  const def = defOf(ctx, kind, rows[0]);
  const model = kind === 'avatar' ? avatarModel(def) : actionModel(def);
  if (def) panel.append(renderCard(ctx.manifest, model));
  panel.append(el('h2', null, playerFacingName(def?.name ?? 'Copy')));
  panel.append(el('p', 'stack-count', `Stack ×${rows.length}`));
  panel.append(el('p', 'fine', kind === 'avatar'
    ? `${def?.avatarId ?? stackId} · ${def?.statsStatus ?? 'PENDING'}`
    : `${def?.cardId ?? stackId} · ${def?.versionAndStatus ?? 'PENDING'}`));
  const list = el('div', 'copy-list');
  rows.forEach((owned, index) => {
    const marks = [`Copy ${index + 1}`];
    if (owned.locked) marks.push('Locked');
    if (owned.favorite) marks.push('Favorite');
    if (kind === 'avatar' && inTeam(ctx.profile, owned.instanceId)) marks.push('In team');
    if (kind === 'action' && inDeck(ctx.profile, owned.instanceId)) marks.push('In deck');
    const row = el('div', 'row');
    row.append(el('span', 'fine', marks.join(' · ')));
    row.append(button(owned.locked ? 'Unlock' : 'Lock', () => {
      toggleFlag(ctx.profile, kind, owned.instanceId, 'locked');
      ctx.persist();
      ctx.redraw();
    }, 'hit slim'));
    row.append(button(owned.favorite ? 'Unfavorite' : 'Favorite', () => {
      toggleFlag(ctx.profile, kind, owned.instanceId, 'favorite');
      ctx.persist();
      ctx.redraw();
    }, 'hit slim'));
    list.append(row);
  });
  panel.append(list);
  panel.append(chromeButton(ctx.manifest, 'Close', () => ctx.setDetail(null), { variant: 'secondary', icon: 'close', className: 'slim' }));
  return panel;
}
