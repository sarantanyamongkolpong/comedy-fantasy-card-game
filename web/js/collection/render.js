/**
 * Landscape stash, inventory, collection, deck builder, and card detail.
 * Geometry comes from layout.js so every control stays on the 1672×941 stage.
 */

import { assetUrl, bindImage, findAsset } from '../assets.js';
import { button, el } from '../dom.js';
import { facHints, toggleDeckCard, toggleFlag } from '../profile.js';
import { actionModel, avatarModel, renderCard } from '../render-card.js';
import { gridSpec, layoutBoxes } from './layout.js';
import {
  KIND_LABEL,
  SORT_LABEL,
  STATE_LABEL,
  deckToggleTarget,
  entryMarks,
  flagTarget,
  kindCycle,
  nextInCycle,
  presentCollection,
  rarityLabel,
  stateCycle,
} from './model.js';
import { navItems, screenTitle } from './route.js';

const defaults = () => ({
  kind: 'all',
  rarity: 'all',
  state: 'all',
  sort: 'name',
  query: '',
  page: 0,
  deckPage: 0,
  shelfPage: 0,
  selectedKey: null,
  returnRoute: 'stash',
  returnParty: false,
});

let ui = defaults();
let focusSearch = false;
let caret = null;

export function resetCollectionUi() {
  ui = defaults();
  focusSearch = false;
  caret = null;
}

function place(node, box) {
  node.style.position = 'absolute';
  node.style.left = `${box.x}px`;
  node.style.top = `${box.y}px`;
  node.style.width = `${box.w}px`;
  node.style.height = `${box.h}px`;
  node.style.margin = '0';
  node.style.zIndex = '1';
  node.dataset.colId = box.id;
  return node;
}

function byId(boxes) {
  return new Map(boxes.map((item) => [item.id, item]));
}

function hit(label, box, onClick, className = '') {
  const node = button(label, onClick, `col-hit ${className}`.trim());
  place(node, box);
  return node;
}

function textBox(box, className = '') {
  const node = el('div', `col-text ${className}`.trim());
  place(node, box);
  return node;
}

function catalogDef(catalog, entry) {
  if (!entry || !catalog) return null;
  if (entry.kind === 'avatar') {
    return catalog.avatarById?.(entry.catalogId)
      ?? (catalog.avatars ?? []).find((row) => row.avatarId === entry.catalogId)
      ?? null;
  }
  if (entry.kind === 'action') {
    return catalog.cardById?.(entry.catalogId)
      ?? (catalog.actionCards ?? []).find((row) => row.cardId === entry.catalogId)
      ?? null;
  }
  return null;
}

function cardModel(catalog, entry) {
  const def = catalogDef(catalog, entry);
  if (!def) return null;
  return entry.kind === 'avatar' ? avatarModel(def) : actionModel(def);
}

function paintFrame(node, manifest, entry) {
  const frame = findAsset(manifest, { slot: 'frame', rarity: entry?.rarity || 'TBD' });
  if (!frame) return;
  node.style.backgroundImage = `url("${assetUrl(frame)}")`;
  node.style.backgroundSize = '100% 100%';
  node.style.backgroundRepeat = 'no-repeat';
  node.style.backgroundColor = 'transparent';
}

function cellMeta(entry) {
  const bits = [rarityLabel(entry.rarity)];
  if ((entry.count ?? 0) > 1) bits.push(`×${entry.count}`);
  if (entry.equipped) bits.push(entry.kind === 'avatar' ? 'Team' : entry.kind === 'action' ? 'Deck' : 'Eq');
  return bits.join(' ');
}

function deckLabel(entry) {
  if (!entry) return 'Deck';
  if (entry.kind === 'avatar') return entry.equipped ? 'In team' : 'Team';
  if (entry.kind !== 'action') return 'Held';
  const target = deckToggleTarget(entry);
  if (!target) return 'Deck';
  if (target.mode === 'remove') return 'Remove';
  if (target.mode === 'add') return 'Add';
  return 'Locked';
}

function applyFlag(ctx, entry, flag) {
  const copy = flagTarget(entry);
  if (!copy) {
    ctx.setNotice('Select an owned card first.');
    ctx.redraw();
    return;
  }
  if (entry.kind === 'token') {
    const row = (ctx.profile.tokens ?? []).find((token) => token.instanceId === copy.instanceId);
    if (!row) {
      ctx.setNotice('That token is not in this bag.');
      ctx.redraw();
      return;
    }
    row[flag] = row[flag] !== true;
    ctx.persist(false);
    ctx.setNotice(row[flag] ? 'Marked.' : 'Cleared.');
    ctx.redraw();
    return;
  }
  if (entry.kind !== 'avatar' && entry.kind !== 'action') {
    ctx.setNotice('That stack is not a card copy.');
    ctx.redraw();
    return;
  }
  const ok = toggleFlag(ctx.profile, entry.kind, copy.instanceId, flag);
  if (!ok) {
    ctx.setNotice('That copy is not in this bag.');
    ctx.redraw();
    return;
  }
  ctx.persist(false);
  ctx.setNotice(flag === 'locked' ? 'Lock updated.' : 'Favorite updated.');
  ctx.redraw();
}

function applyDeck(ctx, entry) {
  if (!entry) {
    ctx.setNotice('Select a card first.');
    ctx.redraw();
    return;
  }
  if (entry.kind === 'avatar') {
    ctx.setNotice(entry.equipped
      ? 'That avatar is seated. Swap seats on Team of 4.'
      : 'Seat avatars on Team of 4. This builder holds action cards.');
    ctx.redraw();
    return;
  }
  const target = deckToggleTarget(entry);
  if (!target) {
    ctx.setNotice('That card cannot enter the deck.');
    ctx.redraw();
    return;
  }
  if (target.mode === 'blocked') {
    ctx.setNotice('Locked cards stay put. Unlock it before pulling it from the deck.');
    ctx.redraw();
    return;
  }
  const result = toggleDeckCard(ctx.profile, target.instanceId);
  ctx.setNotice(result.ok
    ? (result.inDeck ? `Added ${entry.name}.` : `Removed ${entry.name}.`)
    : result.reason);
  if (result.ok) ctx.persist(false);
  ctx.redraw();
}

function openDetail(ctx, route, entry) {
  if (!entry) return;
  ui.selectedKey = entry.key;
  ui.returnRoute = route === 'detail' ? ui.returnRoute : route;
  ui.returnParty = ctx.screen === 'party';
  ctx.goto('detail');
}

function goBack(ctx, route) {
  if (route === 'detail') {
    if (ui.returnParty) {
      ctx.setPartyTab('deck');
      if (ctx.screen !== 'party') ctx.goto('party');
      return;
    }
    ctx.goto(ui.returnRoute || 'stash');
    return;
  }
  ctx.goto('home');
}

function activateNav(ctx, item) {
  ui.page = 0;
  ui.deckPage = 0;
  ui.shelfPage = 0;
  ui.selectedKey = null;
  if (item.id === 'team') {
    ctx.setPartyTab('team');
    if (ctx.screen !== 'party') ctx.goto('party');
    return;
  }
  if (item.screen === 'deck' && ctx.screen === 'party') {
    ctx.setPartyTab('deck');
    return;
  }
  ctx.goto(item.screen);
}

function fillSlots(parent, boxes, items, selectedKey, onPick) {
  const slots = boxes.filter((item) => item && (/-slot-\d+$/.test(item.id) || /^slot-\d+-\d+$/.test(item.id)));
  slots.forEach((slot, index) => {
    const entry = items[index];
    if (!entry) {
      const empty = hit('Empty', slot, () => {}, 'col-cell is-dim');
      empty.setAttribute('aria-disabled', 'true');
      empty.setAttribute('aria-label', 'Empty slot');
      parent.append(empty);
      return;
    }
    const node = hit('', slot, () => onPick(entry), 'col-cell');
    paintFrame(node, parent._manifest, entry);
    const rarity = rarityLabel(entry.rarity);
    const pip = el('span', `col-rarity rarity-${rarity === '—' ? 'none' : rarity}`, rarity);
    pip.dataset.rarity = entry.rarity || '';
    node.append(pip);
    node.append(el('span', 'col-name', entry.name));
    node.append(el('span', 'col-meta', cellMeta(entry)));
    if (entry.equipped) node.classList.add('is-equipped');
    if (!entry.owned) node.classList.add('is-missing');
    if (entry.key === selectedKey) node.classList.add('is-selected');
    node.setAttribute('aria-pressed', entry.key === selectedKey ? 'true' : 'false');
    node.setAttribute('aria-label', `${entry.name}. ${rarity}. ${entryMarks(entry).join('. ')}`);
    node.dataset.kind = entry.kind;
    node.dataset.catalogId = entry.catalogId;
    parent.append(node);
  });
}

function actionRow(parent, boxes, entry, handlers) {
  const lockCopy = flagTarget(entry);
  const lockLabel = lockCopy?.locked ? 'Unlock' : 'Lock';
  const favLabel = lockCopy?.favorite ? 'Unfavorite' : 'Favorite';
  const specs = [
    ['act-lock', lockLabel, handlers.lock],
    ['act-fav', favLabel, handlers.favorite],
    ['act-deck', deckLabel(entry), handlers.deck],
    ['act-detail', 'Detail', handlers.detail],
    ['act-list', 'List', handlers.list],
  ];
  for (const [id, label, onClick] of specs) {
    const slot = boxes.get(id);
    if (!slot || !onClick) continue;
    const node = hit(label, slot, () => onClick(entry), 'col-action');
    if (!entry) node.setAttribute('aria-disabled', 'true');
    parent.append(node);
  }
}

function detailCopy(entry, catalog) {
  const lines = [
    entry.name,
    `${rarityLabel(entry.rarity)} · ${entry.kind}`,
    entry.catalogId,
    entry.type ? String(entry.type) : '',
    entry.factionName || entry.factionId || '',
    entry.apCost == null ? '' : `${entry.apCost} AP`,
    entry.owned ? `Owned ×${entry.count}` : 'Not owned',
    entryMarks(entry).join(' · '),
    ...(entry.lines ?? []).slice(0, 4),
  ].filter(Boolean);
  if (entry.stats) {
    lines.push(`ATK ${entry.stats.atk ?? '—'}  DEF ${entry.stats.def ?? '—'}  SPD ${entry.stats.spd ?? '—'}`);
  }
  const def = catalogDef(catalog, entry);
  if (def?.active?.summary) lines.push(def.active.summary);
  if (def?.passive?.summary) lines.push(def.passive.summary);
  if (entry.rarity === 'FAC' && entry.factionName) {
    lines.push(`FAC plays when a living ${entry.factionName} avatar is on the team.`);
  }
  return lines.join('\n');
}

/**
 * @param {object} ctx
 * @param {string} route
 */
export function renderCollection(ctx, route) {
  const party = route === 'deck' && ctx.screen === 'party';
  let report = null;
  try {
    report = typeof ctx.api?.stashReport === 'function' ? ctx.api.stashReport(ctx.profile) : null;
  } catch (error) {
    ctx.setNotice(error instanceof Error ? error.message : 'Furniture slots could not be read.');
  }
  const view = presentCollection(route, ctx.profile, ctx.api?.catalog ?? {}, ui, report);
  ui.kind = view.kind;
  ui.state = view.state;
  ui.page = view.page;
  ui.deckPage = view.deckPage;
  ui.shelfPage = view.shelfPage;

  const boxes = layoutBoxes({ route, detailOpen: view.detailOpen, hasEntry: Boolean(view.selected) });
  const at = byId(boxes);
  const root = el('section', 'col-root');
  root.style.position = 'absolute';
  root.style.inset = '0';
  root.style.overflow = 'hidden';
  root.dataset.collectionRoute = route;
  root.dataset.detailOpen = view.detailOpen ? 'true' : 'false';
  root._manifest = ctx.manifest;

  const bg = findAsset(ctx.manifest, { slot: 'bg-stash', subjectId: 'inventory' });
  if (bg) {
    const img = el('img', 'col-bg');
    img.alt = '';
    bindImage(img, bg, { eager: true });
    root.append(img);
  }

  root.append(hit('Back', at.get('back'), () => goBack(ctx, route)));

  const title = textBox(at.get('title'));
  const heading = el('h1', null, screenTitle(route, party));
  heading.style.margin = '0';
  heading.style.fontSize = '36px';
  heading.style.lineHeight = '1.1';
  title.append(heading);
  if (ctx.notice) title.append(el('p', 'col-notice', ctx.notice));
  root.append(title);

  const capacity = textBox(at.get('capacity'), 'col-capacity');
  capacity.textContent = view.capacity.line;
  capacity.dataset.slots = view.capacity.installedSlots == null ? 'PENDING' : String(view.capacity.installedSlots);
  capacity.dataset.total = 'PENDING';
  capacity.dataset.held = view.capacity.heldCopies == null ? '' : String(view.capacity.heldCopies);
  root.append(capacity);

  const items = navItems(route, party, ui.returnRoute);
  items.forEach((item, index) => {
    const node = hit(item.label, at.get(`nav:${index}`), () => activateNav(ctx, item));
    if (item.selected) node.classList.add('is-selected');
    node.setAttribute('aria-pressed', item.selected ? 'true' : 'false');
    root.append(node);
  });

  if (route !== 'detail') {
    const search = document.createElement('input');
    search.type = 'search';
    search.className = 'col-search';
    search.placeholder = 'Search';
    search.value = ui.query;
    search.setAttribute('aria-label', 'Search cards');
    search.spellcheck = false;
    search.style.background = 'rgba(20, 12, 28, 0.92)';
    search.style.color = '#fff6d8';
    search.style.border = '3px solid #e6c36a';
    search.style.borderRadius = '16px';
    search.style.font = '700 22px/1.1 "Trebuchet MS", "Segoe UI", sans-serif';
    search.style.padding = '0 16px';
    place(search, at.get('search'));
    search.addEventListener('input', () => {
      ui.query = search.value;
      ui.page = 0;
      ui.deckPage = 0;
      ui.shelfPage = 0;
      focusSearch = true;
      caret = search.selectionStart;
      ctx.redraw();
    });
    root.append(search);

    const kindText = view.kind === 'all' ? 'All items' : (KIND_LABEL[view.kind] ?? view.kind);
    const kindButton = hit(kindText, at.get('kind'), () => {
      if (route === 'deck') {
        ctx.setNotice('The deck builder only takes action cards.');
        ctx.redraw();
        return;
      }
      ui.kind = nextInCycle(kindCycle(route), view.kind);
      ui.page = 0;
      ctx.redraw();
    });
    kindButton.setAttribute('aria-label', `Kind ${kindText}`);
    root.append(kindButton);

    const sortButton = hit(`Sort ${SORT_LABEL[view.sort]}`, at.get('sort'), () => {
      ui.sort = nextInCycle(['name', 'rarity', 'count', 'type'], view.sort);
      ui.page = 0;
      ui.shelfPage = 0;
      ctx.redraw();
    });
    sortButton.setAttribute('aria-label', `Sort by ${view.sort}`);
    root.append(sortButton);

    const stateText = view.state === 'all' ? 'Any' : (STATE_LABEL[view.state] ?? view.state);
    const stateButton = hit(stateText, at.get('state'), () => {
      ui.state = nextInCycle(stateCycle(route), view.state);
      ui.page = 0;
      ui.deckPage = 0;
      ui.shelfPage = 0;
      ctx.redraw();
    });
    stateButton.setAttribute('aria-label', `Show ${stateText}`);
    root.append(stateButton);

    for (const rarity of ['all', 'N', 'R', 'Epic', 'EX', 'FAC']) {
      const label = rarity === 'all' ? 'All' : rarity;
      const node = hit(label, at.get(`rarity:${rarity}`), () => {
        ui.rarity = rarity;
        ui.page = 0;
        ui.deckPage = 0;
        ui.shelfPage = 0;
        ctx.redraw();
      });
      if (view.rarity === rarity) node.classList.add('is-selected');
      node.setAttribute('aria-pressed', view.rarity === rarity ? 'true' : 'false');
      node.setAttribute('aria-label', rarity === 'all' ? 'Rarity all' : `Rarity ${rarity}`);
      root.append(node);
    }
  }

  const handlers = {
    lock: (entry) => applyFlag(ctx, entry, 'locked'),
    favorite: (entry) => applyFlag(ctx, entry, 'favorite'),
    deck: (entry) => applyDeck(ctx, entry),
    detail: (entry) => openDetail(ctx, route, entry),
    list: () => goBack(ctx, 'detail'),
  };

  if (route === 'deck') {
    const deckLabelBox = textBox(at.get('deck-label'));
    deckLabelBox.textContent = view.deckShown === view.deckCount
      ? `In deck ${view.deckCount}/${view.deckRequired}`
      : `In deck ${view.deckCount}/${view.deckRequired} · showing ${view.deckShown}`;
    root.append(deckLabelBox);
    const shelfLabel = textBox(at.get('shelf-label'));
    shelfLabel.textContent = view.shelfShown === view.shelfCount
      ? `Shelf ${view.shelfCount}`
      : `Shelf ${view.shelfCount} · showing ${view.shelfShown}`;
    root.append(shelfLabel);

    const deckSlots = [...at.values()].filter((item) => item.id.startsWith('deck-slot-') || item.id === 'deck-prev' || item.id === 'deck-next');
    root.append(hit('Prev', at.get('deck-prev'), () => {
      ui.deckPage = Math.max(0, view.deckPage - 1);
      ctx.redraw();
    }));
    root.append(hit('Next', at.get('deck-next'), () => {
      ui.deckPage = Math.min(view.deckPages - 1, view.deckPage + 1);
      ctx.redraw();
    }));
    fillSlots(root, deckSlots, view.deckItems, ui.selectedKey, (entry) => {
      ui.selectedKey = ui.selectedKey === entry.key ? null : entry.key;
      ctx.redraw();
    });

    const shelfSlots = [...at.values()].filter((item) => item.id.startsWith('shelf-slot-') || item.id === 'shelf-prev' || item.id === 'shelf-next');
    root.append(hit('Prev', at.get('shelf-prev'), () => {
      ui.shelfPage = Math.max(0, view.shelfPage - 1);
      ctx.redraw();
    }, ));
    root.append(hit('Next', at.get('shelf-next'), () => {
      ui.shelfPage = Math.min(view.shelfPages - 1, view.shelfPage + 1);
      ctx.redraw();
    }));
    const shelfPrev = root.querySelector('[data-col-id="shelf-prev"]');
    const deckPrev = root.querySelector('[data-col-id="deck-prev"]');
    if (deckPrev) deckPrev.setAttribute('aria-label', 'Deck previous page');
    const deckNext = root.querySelector('[data-col-id="deck-next"]');
    if (deckNext) deckNext.setAttribute('aria-label', 'Deck next page');
    if (shelfPrev) shelfPrev.setAttribute('aria-label', 'Shelf previous page');
    const shelfNext = root.querySelector('[data-col-id="shelf-next"]');
    if (shelfNext) shelfNext.setAttribute('aria-label', 'Shelf next page');

    fillSlots(root, shelfSlots, view.shelfItems, ui.selectedKey, (entry) => {
      ui.selectedKey = ui.selectedKey === entry.key ? null : entry.key;
      ctx.redraw();
    });

    let facLine = '';
    if (Array.isArray(ctx.profile?.avatars) && Array.isArray(ctx.profile?.actions)) {
      facLine = facHints(ctx.profile, ctx.api.catalog)[0]?.text ?? '';
    }
    const note = textBox(at.get('deck-note'));
    note.textContent = `Duplicate cap is PENDING (CORE-040).${facLine ? ` ${facLine}` : ''}`;
    root.append(note);
    actionRow(root, at, view.selected, handlers);
  } else if (route === 'detail') {
    const meta = textBox(at.get('detail-meta'), 'col-panel');
    meta.style.whiteSpace = 'pre-line';
    meta.style.fontSize = '22px';
    meta.style.lineHeight = '1.25';
    meta.textContent = view.selected
      ? detailCopy(view.selected, ctx.api?.catalog)
      : 'Select a card from Stash, Inventory, or the deck.';
    root.append(meta);
    if (view.selected) {
      const model = cardModel(ctx.api?.catalog, view.selected);
      const slot = at.get('detail-card');
      if (model && slot) {
        const card = renderCard(ctx.manifest, model);
        card.classList.add('col-detail-card');
        place(card, slot);
        root.append(card);
      }
    }
    actionRow(root, at, view.selected, handlers);
  } else {
    const spec = gridSpec(view.detailOpen);
    const slots = [];
    for (let row = 0; row < spec.rows; row += 1) {
      for (let col = 0; col < spec.cols; col += 1) slots.push(at.get(`slot-${row}-${col}`));
    }
    fillSlots(root, slots, view.pageItems, ui.selectedKey, (entry) => {
      ui.selectedKey = ui.selectedKey === entry.key ? null : entry.key;
      ctx.redraw();
    });
    const label = textBox(at.get('page-label'));
    label.textContent = view.totalListed === 0
      ? 'Nothing in this view.'
      : `Page ${view.page + 1}/${view.pages}`;
    root.append(label);
    root.append(hit('Prev', at.get('page-prev'), () => {
      ui.page = Math.max(0, view.page - 1);
      ctx.redraw();
    }));
    root.append(hit('Next', at.get('page-next'), () => {
      ui.page = Math.min(view.pages - 1, view.page + 1);
      ctx.redraw();
    }));
    const prev = root.querySelector('[data-col-id="page-prev"]');
    const next = root.querySelector('[data-col-id="page-next"]');
    if (prev) prev.setAttribute('aria-label', 'Previous page');
    if (next) next.setAttribute('aria-label', 'Next page');
    if (view.detailOpen && view.selected) {
      const name = hit(view.selected.name, at.get('detail-name'), () => openDetail(ctx, route, view.selected), 'col-panel');
      name.setAttribute('aria-label', `Card detail ${view.selected.name}`);
      root.append(name);
      const meta = textBox(at.get('detail-meta'), 'col-panel');
      meta.style.whiteSpace = 'pre-line';
      meta.textContent = detailCopy(view.selected, ctx.api?.catalog);
      root.append(meta);
      actionRow(root, at, view.selected, handlers);
    }
  }

  if (focusSearch) {
    const pos = caret;
    focusSearch = false;
    queueMicrotask(() => {
      const next = document.querySelector('[data-col-id="search"]');
      if (!next) return;
      next.focus();
      if (Number.isInteger(pos)) next.setSelectionRange(pos, pos);
    });
  }
  return root;
}
