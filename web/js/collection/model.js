/**
 * Read-only view of the bag, codex, and deck.
 * Web profiles (instance lists) and versioned data profiles (stacks) both resolve.
 * Capacity numbers come from installed furniture. Cabin base and total stay PENDING.
 */

import { DECK_SIZE } from '../../../src/schema/constants.js';
import { stashReport } from '../../../src/save/stash.js';
import { BROWSE_PAGE_SLOTS, BROWSE_PAGE_SLOTS_DETAIL, DECK_PAGE } from './layout.js';

export const RARITY_RANK = Object.freeze({ N: 1, R: 2, Epic: 3, FAC: 4, EX: 5 });
export const RARITIES = Object.freeze(['N', 'R', 'Epic', 'EX', 'FAC']);
export const SORTS = Object.freeze(['name', 'rarity', 'count', 'type']);

export const KIND_LABEL = Object.freeze({
  all: 'All',
  avatar: 'Avatars',
  action: 'Actions',
  token: 'Tokens',
  companion: 'Companions',
});

export const STATE_LABEL = Object.freeze({
  all: 'All',
  equipped: 'Equipped',
  spare: 'Spare',
  locked: 'Locked',
  favorite: 'Favorite',
  owned: 'Owned',
  missing: 'Missing',
});

export const SORT_LABEL = Object.freeze({
  name: 'Name',
  rarity: 'Rarity',
  count: 'Count',
  type: 'Type',
});

/**
 * @param {string | null | undefined} rarity
 */
export function rarityRank(rarity) {
  return RARITY_RANK[rarity] ?? 0;
}

/**
 * @param {string | null | undefined} rarity
 */
export function rarityLabel(rarity) {
  if (rarity === 'N' || rarity === 'R' || rarity === 'Epic' || rarity === 'EX' || rarity === 'FAC') return rarity;
  return '—';
}

/**
 * @param {string} route
 */
export function kindCycle(route) {
  if (route === 'deck') return ['action'];
  if (route === 'collection') return ['all', 'avatar', 'action'];
  return ['all', 'avatar', 'action', 'token', 'companion'];
}

/**
 * @param {string} route
 */
export function stateCycle(route) {
  if (route === 'collection') return ['all', 'owned', 'missing', 'equipped'];
  if (route === 'deck') return ['all', 'locked', 'favorite'];
  return ['all', 'equipped', 'spare', 'locked', 'favorite'];
}

/**
 * @param {string[]} cycle
 * @param {string} current
 */
export function nextInCycle(cycle, current) {
  const index = cycle.indexOf(current);
  return cycle[(index + 1) % cycle.length];
}

/**
 * @param {string} route
 * @param {string} kind
 */
export function effectiveKind(route, kind) {
  const cycle = kindCycle(route);
  return cycle.includes(kind) ? kind : cycle[0];
}

/**
 * @param {string} route
 * @param {string} state
 */
export function effectiveState(route, state) {
  const cycle = stateCycle(route);
  return cycle.includes(state) ? state : 'all';
}

/**
 * @param {string} name
 */
export function facingName(name) {
  const cleaned = String(name ?? '').replace(/placeholder/ig, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || String(name ?? '');
}

function cleanLine(text) {
  const value = String(text ?? '').trim();
  if (!value || /placeholder/i.test(value)) return '';
  return value;
}

/**
 * @param {object} stack
 * @param {number} index
 */
export function copyInstanceId(stack, index) {
  return `${stack.instanceId}#${index + 1}`;
}

function factionLabel(catalog, factionId) {
  if (!factionId) return '';
  if (typeof catalog?.factionName === 'function') return catalog.factionName(factionId) ?? '';
  return '';
}

function avatarDef(catalog, id) {
  if (!id) return null;
  if (typeof catalog?.avatarById === 'function') return catalog.avatarById(id);
  return (catalog?.avatars ?? []).find((row) => row.avatarId === id) ?? null;
}

function actionDef(catalog, id) {
  if (!id) return null;
  if (typeof catalog?.cardById === 'function') return catalog.cardById(id);
  return (catalog?.actionCards ?? []).find((row) => row.cardId === id) ?? null;
}

function blankEntry(partial) {
  return {
    key: partial.key,
    kind: partial.kind,
    catalogId: partial.catalogId ?? '',
    instanceId: partial.instanceId ?? null,
    name: partial.name ?? partial.catalogId ?? '',
    rarity: partial.rarity ?? null,
    type: partial.type ?? '',
    factionId: partial.factionId ?? null,
    factionName: partial.factionName ?? '',
    count: partial.count ?? 0,
    owned: partial.owned === true,
    equippedCount: partial.equippedCount ?? 0,
    equipped: partial.equipped === true || (partial.equippedCount ?? 0) > 0,
    locked: partial.locked === true,
    favorite: partial.favorite === true,
    copies: partial.copies ?? [],
    apCost: partial.apCost ?? null,
    stats: partial.stats ?? null,
    lines: partial.lines ?? [],
    battleLegal: partial.battleLegal !== false,
  };
}

function fromAvatarDef(catalog, def) {
  const lines = [def.role, def.active?.name, def.passive?.name, def.statsStatus].map(cleanLine).filter(Boolean);
  return {
    catalogId: def.avatarId,
    name: facingName(def.name ?? def.avatarId),
    rarity: def.rarity ?? null,
    type: def.role ?? '',
    factionId: def.factionId ?? null,
    factionName: factionLabel(catalog, def.factionId),
    apCost: null,
    stats: def.stats ?? null,
    lines,
    battleLegal: def.battleLegal !== false,
  };
}

function fromActionDef(catalog, def) {
  const lines = [def.type, def.blurb, def.versionAndStatus].map(cleanLine).filter(Boolean);
  if (def.factionRequirement) lines.push(`FAC ${factionLabel(catalog, def.factionRequirement) || def.factionRequirement}`);
  return {
    catalogId: def.cardId,
    name: facingName(def.name ?? def.cardId),
    rarity: def.rarity ?? null,
    type: def.type ?? '',
    factionId: def.factionRequirement ?? null,
    factionName: factionLabel(catalog, def.factionRequirement),
    apCost: Number.isInteger(def.costAp) ? def.costAp : null,
    stats: null,
    lines,
    battleLegal: true,
  };
}

function summarize(copies) {
  return {
    count: copies.length,
    equippedCount: copies.filter((copy) => copy.equipped).length,
    locked: copies.some((copy) => copy.locked),
    favorite: copies.some((copy) => copy.favorite),
  };
}

/**
 * @param {object | null | undefined} profile
 */
export function resolveSource(profile) {
  if (!profile || typeof profile !== 'object') {
    return { mode: 'web', avatars: [], actions: [], tokens: [], companions: [], team: [], deck: [], house: {}, decks: [] };
  }
  const ui = profile.web?.ui;
  if (ui && (Array.isArray(ui.avatars) || Array.isArray(ui.actions) || Array.isArray(ui.tokens))) {
    return {
      mode: 'web',
      avatars: ui.avatars ?? [],
      actions: ui.actions ?? [],
      tokens: ui.tokens ?? [],
      companions: ui.companions ?? [],
      team: Array.isArray(profile.team) ? profile.team : (ui.team ?? []),
      deck: Array.isArray(profile.deck) ? profile.deck : (ui.deck ?? []),
      house: profile.house ?? ui.house ?? {},
      decks: Array.isArray(profile.decks) ? profile.decks : [],
    };
  }
  if (Array.isArray(profile.avatars) || Array.isArray(profile.actions) || Array.isArray(profile.tokens)) {
    return {
      mode: 'web',
      avatars: profile.avatars ?? [],
      actions: profile.actions ?? [],
      tokens: profile.tokens ?? [],
      companions: profile.companions ?? [],
      team: profile.team ?? [],
      deck: profile.deck ?? [],
      house: profile.house ?? {},
      decks: profile.decks ?? [],
    };
  }
  return {
    mode: 'data',
    avatars: [],
    actions: [],
    tokens: [],
    companions: [],
    inventory: profile.inventory ?? {},
    team: Array.isArray(profile.team) ? profile.team : [],
    deck: [],
    house: profile.house ?? {},
    decks: Array.isArray(profile.decks) ? profile.decks : [],
  };
}

function webCopies(rows, kind, idField, team, deck) {
  return (rows ?? []).map((row, index) => {
    const catalogId = row[idField] ?? row.catalogId ?? '';
    const instanceId = row.instanceId ?? `${kind}:${index}:${catalogId}`;
    const equipped = kind === 'avatar'
      ? team.includes(instanceId)
      : kind === 'action'
        ? deck.includes(instanceId)
        : false;
    return {
      instanceId,
      catalogId,
      locked: row.locked === true,
      favorite: row.favorite === true,
      equipped,
    };
  });
}

function expandStack(stack, kind, team) {
  const quantity = Number.isInteger(stack?.quantity) ? stack.quantity : 0;
  const reserved = (stack?.reservations ?? []).reduce((sum, row) => sum + (Number.isInteger(row.count) ? row.count : 0), 0);
  const copies = [];
  for (let index = 0; index < quantity; index += 1) {
    const instanceId = copyInstanceId(stack, index);
    const equipped = kind === 'action'
      ? index < reserved
      : team.includes(instanceId) || team.includes(stack.catalogId);
    copies.push({
      instanceId,
      catalogId: stack.catalogId,
      locked: stack.locked === true,
      favorite: stack.favorite === true,
      equipped,
    });
  }
  return copies;
}

function activeDeckIds(decks) {
  const deck = (decks ?? []).find((row) => row.deckId === 'DECK_ACTIVE') ?? decks?.[0] ?? null;
  return Array.isArray(deck?.cardIds) ? deck.cardIds : [];
}

function takeCopiesForDeck(copies, cardIds) {
  const pool = copies.map((copy) => ({ ...copy, equipped: false }));
  const used = new Set();
  const deck = [];
  for (let index = 0; index < cardIds.length; index += 1) {
    const catalogId = cardIds[index];
    const found = pool.find((copy) => copy.catalogId === catalogId && !used.has(copy.instanceId));
    if (found) {
      used.add(found.instanceId);
      found.equipped = true;
      deck.push({ ...found, deckIndex: index });
    } else {
      deck.push({
        instanceId: `missing:${index}:${catalogId}`,
        catalogId,
        locked: false,
        favorite: false,
        equipped: true,
        missing: true,
        deckIndex: index,
      });
    }
  }
  const shelf = pool.filter((copy) => !used.has(copy.instanceId));
  return { deck, shelf, copies: pool.map((copy) => ({ ...copy, equipped: used.has(copy.instanceId) })) };
}

function groupStacks(kind, catalogId, copies, described) {
  const summary = summarize(copies);
  return blankEntry({
    ...described,
    key: `stack:${kind}:${catalogId}`,
    kind,
    catalogId,
    name: described?.name || catalogId,
    count: summary.count,
    owned: summary.count > 0,
    equippedCount: summary.equippedCount,
    equipped: summary.equippedCount > 0,
    locked: summary.locked,
    favorite: summary.favorite,
    copies,
  });
}

function copyEntry(kind, described, copy, index, total) {
  return blankEntry({
    ...described,
    key: `copy:${copy.instanceId}`,
    kind,
    catalogId: copy.catalogId,
    instanceId: copy.instanceId,
    name: described?.name || copy.catalogId,
    count: 1,
    owned: copy.missing !== true,
    equippedCount: copy.equipped ? 1 : 0,
    equipped: copy.equipped === true,
    locked: copy.locked === true,
    favorite: copy.favorite === true,
    copies: [copy],
    lines: [...(described?.lines ?? []), `Copy ${index + 1}/${total}`],
  });
}

/**
 * @param {object} profile
 * @param {object} catalog
 */
export function buildLibrary(profile, catalog = {}) {
  const source = resolveSource(profile);
  /** @type {Map<string, object[]>} */
  const avatarGroups = new Map();
  /** @type {Map<string, object[]>} */
  const actionGroups = new Map();
  const tokens = [];
  const companions = [];

  if (source.mode === 'web') {
    for (const copy of webCopies(source.avatars, 'avatar', 'avatarId', source.team, source.deck)) {
      if (!avatarGroups.has(copy.catalogId)) avatarGroups.set(copy.catalogId, []);
      avatarGroups.get(copy.catalogId).push(copy);
    }
    for (const copy of webCopies(source.actions, 'action', 'cardId', source.team, source.deck)) {
      if (!actionGroups.has(copy.catalogId)) actionGroups.set(copy.catalogId, []);
      actionGroups.get(copy.catalogId).push(copy);
    }
    for (const token of source.tokens ?? []) {
      tokens.push({
        instanceId: token.instanceId,
        catalogId: token.instanceId,
        name: facingName(token.name ?? 'Token'),
        rarity: token.rarity ?? null,
        type: token.pool ?? 'TEST',
        locked: token.locked === true,
        favorite: token.favorite === true,
        note: token.note ?? '',
      });
    }
    for (const row of source.companions ?? []) {
      companions.push({
        instanceId: row.instanceId ?? row.catalogId,
        catalogId: row.catalogId ?? row.instanceId,
        name: facingName(row.name ?? row.catalogId ?? 'Companion'),
        rarity: row.rarity ?? null,
        locked: row.locked === true,
        favorite: row.favorite === true,
      });
    }
  } else {
    for (const stack of source.inventory?.avatars ?? []) {
      avatarGroups.set(stack.catalogId, expandStack(stack, 'avatar', source.team));
    }
    const actionCopies = [];
    for (const stack of source.inventory?.actions ?? []) actionCopies.push(...expandStack(stack, 'action', source.team));
    const cardIds = activeDeckIds(source.decks);
    const dealt = cardIds.length > 0
      ? takeCopiesForDeck(actionCopies, cardIds)
      : {
        deck: actionCopies.filter((copy) => copy.equipped),
        shelf: actionCopies.filter((copy) => !copy.equipped),
        copies: actionCopies,
      };
    for (const copy of dealt.copies) {
      if (!actionGroups.has(copy.catalogId)) actionGroups.set(copy.catalogId, []);
      actionGroups.get(copy.catalogId).push(copy);
    }
    for (const stack of source.inventory?.companions ?? []) {
      const copies = expandStack(stack, 'companion', source.team);
      if (!copies.length) continue;
      companions.push({
        catalogId: stack.catalogId,
        name: facingName(stack.name ?? stack.catalogId ?? 'Companion'),
        rarity: stack.rarity ?? null,
        copies,
      });
    }
    source._dealt = dealt;
  }

  const stacks = [];
  const copies = [];
  const codex = [];
  const seenAvatars = new Set();
  const seenActions = new Set();

  const pushAvatar = (catalogId, ownedCopies, def) => {
    const described = def ? fromAvatarDef(catalog, def) : { catalogId, name: catalogId, rarity: null, type: '', factionId: null, factionName: '', lines: [] };
    const stack = groupStacks('avatar', catalogId, ownedCopies, described);
    if (ownedCopies.length > 0) stacks.push(stack);
    ownedCopies.forEach((copy, index) => copies.push(copyEntry('avatar', described, copy, index, ownedCopies.length)));
    codex.push(blankEntry({
      ...described,
      key: `codex:avatar:${catalogId}`,
      kind: 'avatar',
      count: ownedCopies.length,
      owned: ownedCopies.length > 0,
      equippedCount: stack.equippedCount,
      equipped: stack.equipped,
      locked: stack.locked,
      favorite: stack.favorite,
      copies: ownedCopies,
    }));
    seenAvatars.add(catalogId);
  };

  const pushAction = (catalogId, ownedCopies, def) => {
    const described = def ? fromActionDef(catalog, def) : { catalogId, name: catalogId, rarity: null, type: '', factionId: null, factionName: '', lines: [] };
    const stack = groupStacks('action', catalogId, ownedCopies, described);
    if (ownedCopies.length > 0) stacks.push(stack);
    ownedCopies.forEach((copy, index) => copies.push(copyEntry('action', described, copy, index, ownedCopies.length)));
    codex.push(blankEntry({
      ...described,
      key: `codex:action:${catalogId}`,
      kind: 'action',
      count: ownedCopies.length,
      owned: ownedCopies.length > 0,
      equippedCount: stack.equippedCount,
      equipped: stack.equipped,
      locked: stack.locked,
      favorite: stack.favorite,
      copies: ownedCopies,
    }));
    seenActions.add(catalogId);
  };

  for (const def of catalog?.avatars ?? []) pushAvatar(def.avatarId, avatarGroups.get(def.avatarId) ?? [], def);
  for (const [catalogId, ownedCopies] of avatarGroups) {
    if (!seenAvatars.has(catalogId)) pushAvatar(catalogId, ownedCopies, avatarDef(catalog, catalogId));
  }
  for (const def of catalog?.actionCards ?? []) pushAction(def.cardId, actionGroups.get(def.cardId) ?? [], def);
  for (const [catalogId, ownedCopies] of actionGroups) {
    if (!seenActions.has(catalogId)) pushAction(catalogId, ownedCopies, actionDef(catalog, catalogId));
  }

  for (const token of tokens) {
    const copy = {
      instanceId: token.instanceId,
      catalogId: token.catalogId,
      locked: token.locked,
      favorite: token.favorite,
      equipped: false,
    };
    const described = {
      name: token.name,
      rarity: token.rarity,
      type: token.type,
      lines: token.note ? [token.note] : [],
    };
    stacks.push(groupStacks('token', token.catalogId, [copy], described));
    copies.push(copyEntry('token', described, copy, 0, 1));
  }

  for (const row of companions) {
    const described = { name: row.name, rarity: row.rarity, type: 'Companion', lines: [] };
    const ownedCopies = row.copies ?? [{
      instanceId: row.instanceId,
      catalogId: row.catalogId,
      locked: row.locked === true,
      favorite: row.favorite === true,
      equipped: false,
    }];
    stacks.push(groupStacks('companion', row.catalogId, ownedCopies, described));
    ownedCopies.forEach((copy, index) => copies.push(copyEntry('companion', described, copy, index, ownedCopies.length)));
  }

  let deck = [];
  let shelf = [];
  if (source.mode === 'web') {
    const byInstance = new Map(copies.filter((entry) => entry.kind === 'action').map((entry) => [entry.instanceId, entry]));
    deck = [];
    const seen = new Set();
    for (const instanceId of source.deck ?? []) {
      const entry = byInstance.get(instanceId);
      if (!entry) continue;
      seen.add(instanceId);
      deck.push(entry);
    }
    shelf = copies.filter((entry) => entry.kind === 'action' && !seen.has(entry.instanceId));
  } else {
    const dealt = source._dealt ?? { deck: [], shelf: [] };
    const describedFor = (catalogId) => {
      const stack = stacks.find((entry) => entry.kind === 'action' && entry.catalogId === catalogId);
      return stack;
    };
    deck = dealt.deck.map((copy, index) => copyEntry('action', describedFor(copy.catalogId) ?? { name: copy.catalogId, catalogId: copy.catalogId }, { ...copy, equipped: true }, index, dealt.deck.length));
    shelf = dealt.shelf.map((copy, index) => copyEntry('action', describedFor(copy.catalogId) ?? { name: copy.catalogId, catalogId: copy.catalogId }, copy, index, dealt.shelf.length));
  }

  return {
    mode: source.mode,
    house: source.house,
    stacks,
    copies,
    codex,
    deck,
    shelf,
    deckIds: source.mode === 'web' ? [...(source.deck ?? [])] : activeDeckIds(source.decks),
    team: [...(source.team ?? [])],
  };
}

function furniturePieces(house) {
  return (Array.isArray(house?.installedFurniture) ? house.installedFurniture : []).filter((piece) => {
    if (piece.installed === false) return false;
    if (piece.artOnly === true) return false;
    if (piece.capacity == null && piece.capacityStatus === 'PENDING_OWNER') return false;
    return Number.isInteger(piece.capacity) && piece.capacity >= 0;
  });
}

/**
 * @param {object} profile
 * @param {object | null} [report]
 * @param {number} [heldCopies]
 */
export function capacityFromProfile(profile, report = null, heldCopies = null) {
  const source = resolveSource(profile);
  let storageReport = report;
  let failed = false;
  if (!storageReport) {
    try {
      storageReport = stashReport({ house: source.house ?? {}, inventory: { avatars: [], actions: [], companions: [] } });
    } catch {
      failed = true;
      storageReport = null;
    }
  }
  const slots = storageReport?.storage?.installedSlots;
  const known = !failed && Number.isInteger(slots) ? slots : null;
  const held = Number.isInteger(heldCopies) ? heldCopies : null;
  const pieces = furniturePieces(source.house);
  const knownText = known == null ? 'PENDING' : String(known);
  const heldText = held == null ? 'PENDING' : String(held);
  return {
    installedSlots: known,
    heldCopies: held,
    cabinBase: 'PENDING',
    cabinRule: 'HOME-11',
    total: 'PENDING',
    totalRule: 'HOME-11',
    houseTierAddsSlots: false,
    pieces: pieces.map((piece) => ({
      id: piece.furnitureId ?? piece.assetId ?? '',
      name: piece.name ?? piece.furnitureId ?? piece.assetId ?? 'Furniture',
      capacity: piece.capacity,
    })),
    line: [
      `Furniture slots: ${knownText}. Copies held: ${heldText}.`,
      'Cabin base: PENDING (HOME-11).',
      'Total capacity: PENDING.',
      'A house tier adds no slots.',
    ].join('\n'),
  };
}

/**
 * @param {object} entry
 * @param {string} query
 */
export function matchesQuery(entry, query) {
  const needle = String(query ?? '').trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    entry.name,
    entry.catalogId,
    entry.instanceId,
    entry.rarity,
    entry.type,
    entry.factionId,
    entry.factionName,
    entry.kind,
    ...(entry.lines ?? []),
  ].filter(Boolean).join(' ').toLowerCase();
  return hay.includes(needle);
}

/**
 * @param {object} entry
 * @param {string} kind
 */
export function matchesKind(entry, kind) {
  return kind === 'all' || entry.kind === kind;
}

/**
 * @param {object} entry
 * @param {string} rarity
 */
export function matchesRarity(entry, rarity) {
  return rarity === 'all' || entry.rarity === rarity;
}

/**
 * @param {object} entry
 * @param {string} state
 */
export function matchesState(entry, state) {
  if (state === 'all') return true;
  if (state === 'equipped') return entry.equippedCount > 0 || entry.equipped === true;
  if (state === 'spare') return entry.owned && !(entry.equippedCount > 0 || entry.equipped === true);
  if (state === 'locked') return entry.locked === true;
  if (state === 'favorite') return entry.favorite === true;
  if (state === 'owned') return entry.owned === true;
  if (state === 'missing') return entry.owned !== true;
  return true;
}

/**
 * @param {object} left
 * @param {object} right
 * @param {string} mode
 */
export function compareEntries(left, right, mode) {
  if (mode === 'count') {
    const gap = (right.count ?? 0) - (left.count ?? 0);
    if (gap) return gap;
  } else if (mode === 'rarity') {
    const gap = rarityRank(right.rarity) - rarityRank(left.rarity);
    if (gap) return gap;
  } else if (mode === 'type') {
    const gap = String(left.type ?? '').localeCompare(String(right.type ?? ''));
    if (gap) return gap;
  }
  const name = String(left.name ?? '').localeCompare(String(right.name ?? ''));
  if (name) return name;
  return String(left.catalogId ?? '').localeCompare(String(right.catalogId ?? ''));
}

/**
 * @param {object[]} entries
 * @param {{ kind?: string, rarity?: string, state?: string, query?: string, sort?: string }} filters
 */
export function selectEntries(entries, filters = {}) {
  const kind = filters.kind ?? 'all';
  const rarity = filters.rarity ?? 'all';
  const state = filters.state ?? 'all';
  const sort = filters.sort ?? 'name';
  const picked = (entries ?? []).filter((entry) => (
    matchesKind(entry, kind)
    && matchesRarity(entry, rarity)
    && matchesState(entry, state)
    && matchesQuery(entry, filters.query ?? '')
  ));
  picked.sort((left, right) => compareEntries(left, right, sort));
  return picked;
}

/**
 * @param {object[]} entries
 * @param {number} page
 * @param {number} pageSize
 */
export function paginate(entries, page, pageSize) {
  const size = Math.max(1, pageSize);
  const pages = Math.max(1, Math.ceil((entries?.length ?? 0) / size));
  const current = Math.min(Math.max(0, page || 0), pages - 1);
  const start = current * size;
  return {
    page: current,
    pages,
    pageSize: size,
    items: (entries ?? []).slice(start, start + size),
  };
}

/**
 * @param {object | null | undefined} entry
 */
export function flagTarget(entry) {
  if (!entry?.owned) return null;
  const copies = entry.copies ?? [];
  if (entry.instanceId) return copies.find((copy) => copy.instanceId === entry.instanceId) ?? copies[0] ?? null;
  return copies[0] ?? null;
}

/**
 * @param {object | null | undefined} entry
 */
export function deckToggleTarget(entry) {
  if (!entry || entry.kind !== 'action' || entry.owned !== true) return null;
  const copies = entry.copies ?? [];
  const self = entry.instanceId ? copies.find((copy) => copy.instanceId === entry.instanceId) : null;
  if (self) {
    if (self.equipped && self.locked) return { instanceId: self.instanceId, mode: 'blocked' };
    if (self.equipped) return { instanceId: self.instanceId, mode: 'remove' };
    if (!self.locked) return { instanceId: self.instanceId, mode: 'add' };
    return { instanceId: self.instanceId, mode: 'blocked' };
  }
  const spare = copies.find((copy) => !copy.equipped && !copy.locked);
  if (spare) return { instanceId: spare.instanceId, mode: 'add' };
  const removable = copies.find((copy) => copy.equipped && !copy.locked);
  if (removable) return { instanceId: removable.instanceId, mode: 'remove' };
  const blocked = copies.find((copy) => copy.equipped && copy.locked);
  if (blocked) return { instanceId: blocked.instanceId, mode: 'blocked' };
  return null;
}

/**
 * @param {object | null | undefined} entry
 */
export function entryMarks(entry) {
  if (!entry) return [];
  const marks = [];
  if (!entry.owned) marks.push('Not owned');
  if (entry.equipped) marks.push(entry.kind === 'avatar' ? 'In team' : entry.kind === 'action' ? 'In deck' : 'Equipped');
  if (entry.locked) marks.push('Locked');
  if (entry.favorite) marks.push('Favorite');
  if (entry.rarity === 'FAC') marks.push('FAC');
  return marks;
}

function poolFor(route, library) {
  if (route === 'inventory') return library.copies;
  if (route === 'collection') return library.codex;
  return library.stacks;
}

function findKey(library, key) {
  if (!key) return null;
  for (const list of [library.stacks, library.copies, library.codex, library.deck, library.shelf]) {
    const found = list.find((entry) => entry.key === key);
    if (found) return found;
  }
  return null;
}

/**
 * @param {string} route
 * @param {object} profile
 * @param {object} catalog
 * @param {{ kind?: string, rarity?: string, state?: string, sort?: string, query?: string, page?: number, deckPage?: number, shelfPage?: number, selectedKey?: string | null }} ui
 * @param {object | null} [report]
 */
export function presentCollection(route, profile, catalog, ui = {}, report = null) {
  const library = buildLibrary(profile, catalog);
  const held = library.copies.length;
  const capacity = capacityFromProfile(profile, report, held);
  const kind = effectiveKind(route, ui.kind ?? 'all');
  const state = effectiveState(route, ui.state ?? 'all');
  const rarity = RARITIES.includes(ui.rarity) || ui.rarity === 'all' ? (ui.rarity ?? 'all') : 'all';
  const sort = SORTS.includes(ui.sort) ? ui.sort : 'name';
  const filters = { kind, rarity, state, sort, query: ui.query ?? '' };
  const selected = findKey(library, ui.selectedKey ?? null);
  const detailOpen = Boolean(selected) && route !== 'deck' && route !== 'detail';
  const pageSize = detailOpen ? BROWSE_PAGE_SLOTS_DETAIL : BROWSE_PAGE_SLOTS;
  const listed = route === 'deck' || route === 'detail' ? [] : selectEntries(poolFor(route, library), filters);
  const page = paginate(listed, ui.page ?? 0, pageSize);
  const deckFilters = { kind: 'action', rarity, state, sort: 'name', query: ui.query ?? '' };
  const deckListed = route === 'deck'
    ? library.deck.filter((entry) => matchesRarity(entry, rarity) && matchesState(entry, state) && matchesQuery(entry, ui.query ?? ''))
    : [];
  const shelfListed = route === 'deck' ? selectEntries(library.shelf, { ...deckFilters, sort }) : [];
  const deckPage = paginate(deckListed, ui.deckPage ?? 0, DECK_PAGE);
  const shelfPage = paginate(shelfListed, ui.shelfPage ?? 0, DECK_PAGE);
  return {
    route,
    library,
    capacity,
    kind,
    state,
    rarity,
    sort,
    query: ui.query ?? '',
    selected,
    detailOpen,
    pageItems: page.items,
    page: page.page,
    pages: page.pages,
    pageSize,
    totalListed: listed.length,
    deckItems: deckPage.items,
    deckPage: deckPage.page,
    deckPages: deckPage.pages,
    deckCount: library.deck.length,
    deckRequired: DECK_SIZE,
    deckShown: deckListed.length,
    shelfItems: shelfPage.items,
    shelfPage: shelfPage.page,
    shelfPages: shelfPage.pages,
    shelfCount: library.shelf.length,
    shelfShown: shelfListed.length,
  };
}
