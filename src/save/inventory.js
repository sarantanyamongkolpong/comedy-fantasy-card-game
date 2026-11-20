import { SAVE_VERSION } from '../schema/constants.js';
import { validateDeck } from '../schema/deck.js';
// Sport v3 hook: new profiles carry an empty sport payload so save/load round-trips.
import { emptySportState, migrateSportV3 } from '../sport/save/migrate-v3.js';

const LIST = {
  avatar: 'avatars',
  action: 'actions',
  companion: 'companions',
};

function listKey(kind) {
  const key = LIST[kind];
  if (!key) throw new TypeError('kind must be avatar, action, or companion');
  return key;
}

function fail(message, code, extra = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, extra);
  throw error;
}

/**
 * @param {object} [overrides]
 */
export function createProfile(overrides = {}) {
  const profile = {
    profileId: overrides.profileId ?? 'PLAYER',
    saveVersion: SAVE_VERSION,
    preferences: {
      autoBattle: false,
    },
    inventory: {
      avatars: [],
      actions: [],
      companions: [],
    },
    decks: [],
    currency: { G: 0 },
    pity: {},
    house: {
      acquiredTiers: ['cabin'],
      displayTier: 'cabin',
      installedFurniture: [],
    },
    rewardLedger: {},
    sport: overrides.sport ? structuredClone(overrides.sport) : emptySportState(),
  };
  if (overrides.currency) profile.currency = { ...profile.currency, ...overrides.currency };
  if (overrides.inventory) profile.inventory = structuredClone(overrides.inventory);
  if (overrides.house) profile.house = structuredClone(overrides.house);
  if (overrides.pity) profile.pity = structuredClone(overrides.pity);
  if (overrides.decks) profile.decks = structuredClone(overrides.decks);
  if (overrides.rewardLedger) profile.rewardLedger = structuredClone(overrides.rewardLedger);
  if (overrides.preferences) {
    const incoming = overrides.preferences;
    if (Object.prototype.hasOwnProperty.call(incoming, 'autoBattle') && typeof incoming.autoBattle !== 'boolean') {
      throw new TypeError('preferences.autoBattle must be a boolean');
    }
    profile.preferences = {
      ...profile.preferences,
      ...structuredClone(incoming),
    };
  }
  return migrateSportV3(profile);
}

/**
 * @param {object} profile
 * @param {boolean} enabled
 */
export function setAutoBattle(profile, enabled) {
  if (typeof enabled !== 'boolean') throw new TypeError('autoBattle must be a boolean');
  const next = structuredClone(profile);
  next.preferences = { ...(next.preferences ?? {}), autoBattle: enabled };
  return next;
}

function reservedCount(stack) {
  return (stack.reservations ?? []).reduce((sum, row) => sum + row.count, 0);
}

/**
 * One row per catalog stack. Quantity is the stack count. Reserved copies stay in a deck.
 * @param {{ avatars?: object[], actions?: object[], companions?: object[] }} inventory
 */
export function stackCounts(inventory) {
  const stacks = [];
  for (const kind of ['avatars', 'actions', 'companions']) {
    for (const row of inventory?.[kind] ?? []) {
      const quantity = Number.isInteger(row.quantity) ? row.quantity : 0;
      const reserved = reservedCount(row);
      stacks.push({
        kind: row.kind ?? kind.slice(0, -1),
        catalogId: row.catalogId,
        quantity,
        reserved,
        free: quantity - reserved,
        locked: row.locked === true,
        favorite: row.favorite === true,
      });
    }
  }
  return {
    stacks,
    copies: stacks.reduce((sum, row) => sum + row.quantity, 0),
  };
}

/**
 * Mutates `profile`. Callers that need a copy use {@link grantItem}.
 * @param {object} profile
 * @param {{ kind: string, catalogId: string, quantity?: number, source?: object }} item
 */
export function insertItem(profile, item) {
  if (!item || typeof item.catalogId !== 'string' || item.catalogId.length === 0) {
    fail('catalogId is required', 'BAD_ITEM');
  }
  const quantity = item.quantity ?? 1;
  if (!Number.isInteger(quantity) || quantity < 1) fail('quantity must be an integer >= 1', 'BAD_ITEM');
  const key = listKey(item.kind);
  const stack = profile.inventory[key].find((row) => row.catalogId === item.catalogId);
  if (stack) {
    stack.quantity += quantity;
    return profile;
  }
  profile.inventory[key].push({
    instanceId: `STACK_${item.kind}_${item.catalogId}`,
    catalogId: item.catalogId,
    kind: item.kind,
    quantity,
    locked: false,
    favorite: false,
    reservations: [],
    source: item.source ?? null,
  });
  return profile;
}

/**
 * @param {object} profile
 * @param {{ kind: string, catalogId: string, quantity?: number, source?: object }} item
 */
export function grantItem(profile, item) {
  const next = structuredClone(profile);
  insertItem(next, item);
  return next;
}

function updateStack(profile, kind, catalogId, mutate) {
  const next = structuredClone(profile);
  const stack = next.inventory[listKey(kind)].find((row) => row.catalogId === catalogId);
  if (!stack) fail(`No ${kind} stack "${catalogId}"`, 'NOT_OWNED');
  mutate(stack);
  return next;
}

export function setLocked(profile, kind, catalogId, locked) {
  return updateStack(profile, kind, catalogId, (stack) => {
    stack.locked = Boolean(locked);
  });
}

export function setFavorite(profile, kind, catalogId, favorite) {
  return updateStack(profile, kind, catalogId, (stack) => {
    stack.favorite = Boolean(favorite);
  });
}

/**
 * Reserve action copies for a 30-card deck. Previous reservations for the same deck id are replaced.
 * @param {object} profile
 * @param {{ deckId: string, cardIds: string[] }} deck
 * @param {object} [context]
 */
export function bindDeck(profile, deck, context = {}) {
  if (!deck || typeof deck.deckId !== 'string' || deck.deckId.length === 0) fail('deckId is required', 'BAD_DECK');
  const report = validateDeck(deck, context);
  if (!report.ok) fail('Illegal deck', 'ILLEGAL_DECK', { errors: report.errors });
  const counts = new Map();
  for (const id of deck.cardIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  const next = structuredClone(profile);
  for (const stack of next.inventory.actions) {
    stack.reservations = (stack.reservations ?? []).filter((row) => row.deckId !== deck.deckId);
  }
  for (const [catalogId, count] of counts) {
    const stack = next.inventory.actions.find((row) => row.catalogId === catalogId);
    if (!stack) fail(`Missing action "${catalogId}"`, 'NOT_OWNED');
    const elsewhere = reservedCount(stack);
    if (stack.quantity < elsewhere + count) fail(`Not enough copies of "${catalogId}"`, 'NOT_ENOUGH_COPIES');
    stack.reservations.push({ deckId: deck.deckId, count });
  }
  const stored = { deckId: deck.deckId, cardIds: [...deck.cardIds] };
  const index = next.decks.findIndex((row) => row.deckId === deck.deckId);
  if (index >= 0) next.decks[index] = stored;
  else next.decks.push(stored);
  return next;
}

export function unbindDeck(profile, deckId) {
  const next = structuredClone(profile);
  for (const stack of next.inventory.actions) {
    stack.reservations = (stack.reservations ?? []).filter((row) => row.deckId !== deckId);
  }
  next.decks = next.decks.filter((row) => row.deckId !== deckId);
  return next;
}

/**
 * Spend duplicate copies. Locked, favorite, and copies reserved by a deck stay put.
 * @param {object} profile
 * @param {{ kind: string, catalogId: string, quantity?: number }} request
 */
export function consumeDuplicate(profile, request) {
  const quantity = request.quantity ?? 1;
  if (!Number.isInteger(quantity) || quantity < 1) fail('quantity must be an integer >= 1', 'BAD_ITEM');
  const next = structuredClone(profile);
  const list = next.inventory[listKey(request.kind)];
  const index = list.findIndex((row) => row.catalogId === request.catalogId);
  if (index < 0) fail('stack not owned', 'NOT_OWNED');
  const stack = list[index];
  if (stack.locked) fail('locked stack cannot be consumed', 'PROTECTED', { reason: 'locked' });
  if (stack.favorite) fail('favorite stack cannot be consumed', 'PROTECTED', { reason: 'favorite' });
  const reserved = reservedCount(stack);
  const free = stack.quantity - reserved;
  if (quantity > free) {
    fail(
      reserved > 0 ? 'in-deck copies are protected' : 'not enough free copies',
      'PROTECTED',
      { reason: reserved > 0 ? 'in-deck' : 'not-enough-free-copies' },
    );
  }
  stack.quantity -= quantity;
  if (stack.quantity === 0) list.splice(index, 1);
  return next;
}
