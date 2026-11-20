import { button, el, shell } from '../dom.js';
import { inDeck, inTeam, ownedAction, ownedAvatar, toggleFlag } from '../profile.js';
import { actionModel, avatarModel, renderCard } from '../render-card.js';

export function renderStash(ctx) {
  const body = el('div', 'stash');
  const filters = el('div', 'row');
  for (const [id, label] of [['avatars', 'Avatars'], ['actions', 'Actions'], ['tokens', 'TEST tokens']]) {
    const chip = button(label, () => ctx.setStashFilter(id), 'hit slim');
    if (ctx.stashFilter === id) chip.classList.add('is-selected');
    filters.append(chip);
  }
  body.append(filters);
  body.append(el('p', 'fine', 'Lock and favorite are markers. Locked copies refuse to leave a deck. Nothing here is spent on synthesis yet. In-deck and in-team are badges, not extra copies.'));

  const grid = el('div', 'card-grid');
  if (ctx.stashFilter === 'avatars') {
    for (const owned of ctx.profile.avatars) {
      const def = ctx.api.catalog.avatarById(owned.avatarId);
      if (!def) continue;
      grid.append(stashCard(ctx, 'avatar', owned, def));
    }
  } else if (ctx.stashFilter === 'actions') {
    for (const owned of ctx.profile.actions) {
      const def = ctx.api.catalog.cardById(owned.cardId);
      if (!def) continue;
      grid.append(stashCard(ctx, 'action', owned, def));
    }
  } else {
    if (ctx.profile.tokens.length === 0) {
      grid.append(el('p', 'lede', 'No TEST tokens yet. The gachapon is through the map, coughing politely.'));
    }
    for (const token of ctx.profile.tokens) {
      const card = el('article', 'token');
      card.append(el('h2', null, token.name));
      card.append(el('p', null, `${token.pool} · ${token.rarity} · TEST`));
      card.append(el('p', 'fine', token.note));
      grid.append(card);
    }
  }
  body.append(grid);

  if (ctx.detail) body.append(detailPanel(ctx));
  return shell(ctx, 'The Stash', body, { back: 'home' });
}

function stashCard(ctx, kind, owned, def) {
  const model = kind === 'avatar' ? avatarModel(def) : actionModel(def);
  const card = renderCard(ctx.manifest, model, {
    selected: ctx.detail?.instanceId === owned.instanceId,
    onClick: () => ctx.setDetail({ kind, instanceId: owned.instanceId }),
  });
  const marks = [];
  if (owned.locked) marks.push('Locked');
  if (owned.favorite) marks.push('Favorite');
  if (kind === 'avatar' && inTeam(ctx.profile, owned.instanceId)) marks.push('In team');
  if (kind === 'action' && inDeck(ctx.profile, owned.instanceId)) marks.push('In deck');
  if (marks.length) {
    const flag = el('span', 'marks', marks.join(' · '));
    card.append(flag);
  }
  return card;
}

function detailPanel(ctx) {
  const { kind, instanceId } = ctx.detail;
  const owned = kind === 'avatar' ? ownedAvatar(ctx.profile, instanceId) : ownedAction(ctx.profile, instanceId);
  const panel = el('aside', 'detail');
  if (!owned) {
    panel.append(el('p', null, 'That copy wandered off.'));
    return panel;
  }
  const def = kind === 'avatar'
    ? ctx.api.catalog.avatarById(owned.avatarId)
    : ctx.api.catalog.cardById(owned.cardId);
  panel.append(el('h2', null, def?.name ?? 'Copy'));
  panel.append(el('p', 'fine', kind === 'avatar'
    ? `${def.avatarId} · ${def.statsStatus}`
    : `${def.cardId} · ${def.versionAndStatus}`));
  if (kind === 'avatar' && def?.statsStatus === 'PROPOSED') {
    panel.append(el('p', 'fine', 'Printed stars on the reference card are not a star cap. Rarity text comes from data.'));
  }
  const row = el('div', 'row');
  row.append(button(owned.locked ? 'Unlock' : 'Lock', () => {
    toggleFlag(ctx.profile, kind, instanceId, 'locked');
    ctx.persist();
    ctx.redraw();
  }));
  row.append(button(owned.favorite ? 'Unfavorite' : 'Favorite', () => {
    toggleFlag(ctx.profile, kind, instanceId, 'favorite');
    ctx.persist();
    ctx.redraw();
  }));
  row.append(button('Close', () => ctx.setDetail(null)));
  panel.append(row);
  return panel;
}
