/** Hideout and map data from v05_Hideout_Map. Grant-vs-buy and cabin base stay pending. */

export const HOUSE_TIERS = Object.freeze([
  Object.freeze({
    tier: 1,
    id: 'cabin',
    name: 'Cabin',
    rule: 'HOME-01',
    status: 'LOCKED',
    referenceFurniture: null,
  }),
  Object.freeze({
    tier: 2,
    id: 'bungalow',
    name: 'Bungalow',
    rule: 'HOME-02',
    status: 'LOCKED',
    referenceFurniture: furnitureRef('FUR_REF_BUNGALOW_BOX', 'Box', 50, 'HOME-02'),
  }),
  Object.freeze({
    tier: 3,
    id: 'cottage',
    name: 'Cottage',
    rule: 'HOME-03',
    status: 'LOCKED',
    referenceFurniture: furnitureRef('FUR_REF_COTTAGE_BOX', 'Box', 50, 'HOME-03'),
  }),
  Object.freeze({
    tier: 4,
    id: 'loft',
    name: 'Loft',
    rule: 'HOME-04',
    status: 'LOCKED',
    referenceFurniture: furnitureRef('FUR_REF_LOFT_TALL_CABINET', 'Tall Cabinet', 100, 'HOME-04'),
  }),
  Object.freeze({
    tier: 5,
    id: 'villa',
    name: 'Villa',
    rule: 'HOME-05',
    status: 'LOCKED',
    referenceFurniture: furnitureRef('FUR_REF_VILLA_DISPLAY_COUNTER', 'Display Counter', 100, 'HOME-05'),
  }),
  Object.freeze({
    tier: 6,
    id: 'penthouse',
    name: 'Penthouse',
    rule: 'HOME-06',
    status: 'LOCKED',
    referenceFurniture: furnitureRef('FUR_REF_PENTHOUSE_LARGE_TALL_CABINET', 'Large Tall Cabinet', 150, 'HOME-06'),
  }),
]);

export const MAP_DESTINATIONS = Object.freeze([
  pin('home', 'Home', 'MAP-02', 'Player hub / Hideout'),
  pin('mysterious-tower', 'Mysterious Tower', 'MAP-03', 'PvE battle and Mystery Tower lore'),
  Object.freeze({
    id: 'sports-complex',
    name: 'Sports Complex',
    rule: 'MAP-04',
    status: 'LOCKED',
    summary: 'Football, Basketball, Racing, MotoGP',
    modes: Object.freeze(['Football', 'Basketball', 'Racing', 'MotoGP']),
    playable: false,
    implementation: 'OUT_OF_SCOPE',
    note: 'The map pin is locked. The four side-battle games are not part of this core pass.',
  }),
  pin('tournament-arena', 'Tournament Arena', 'MAP-05', 'Main battle / PvP venue'),
  pin('shopping-mall', 'Shopping Mall', 'MAP-06', 'Furniture and cosmetics'),
  pin('gachapon', 'Gachapon', 'MAP-07', 'Avatar / Action / Companion pools'),
]);

function furnitureRef(furnitureId, name, capacity, rule) {
  return Object.freeze({
    furnitureId,
    name,
    capacity,
    capacityStatus: 'LOCKED',
    capacityEvidence: `v05_Hideout_Map ${rule} implementation note`,
    grantStatus: 'PENDING_OWNER',
    grantRule: 'OPEN-06',
    note: 'Capacity is the sheet reference. Whether the tier grants this piece or only unlocks it for sale is PENDING_OWNER. Acquiring the tier does not install it.',
  });
}

function pin(id, name, rule, summary) {
  return Object.freeze({ id, name, rule, status: 'LOCKED', summary, playable: true });
}

function tierIndex(id) {
  return HOUSE_TIERS.findIndex((row) => row.id === id);
}

/**
 * Highest acquired tier (HOME-07). Does not add storage.
 * @param {{ acquiredTiers?: string[] }} house
 */
export function displayHouseTier(house) {
  const owned = Array.isArray(house?.acquiredTiers) ? house.acquiredTiers : [];
  let best = null;
  for (const id of owned) {
    if (tierIndex(id) < 0) continue;
    if (best === null || tierIndex(id) > tierIndex(best)) best = id;
  }
  return best;
}

/**
 * Slots come only from installed furniture (HOME-08).
 * Cabin base is PENDING_OWNER and is not added.
 * @param {{ installedFurniture?: { capacity?: number, installed?: boolean }[] }} house
 */
export function storageFromFurniture(house) {
  const installed = Array.isArray(house?.installedFurniture) ? house.installedFurniture : [];
  let installedSlots = 0;
  for (const piece of installed) {
    if (piece.installed === false) continue;
    if (!Number.isInteger(piece.capacity) || piece.capacity < 0) {
      throw new TypeError('installed furniture capacity must be a non-negative integer');
    }
    installedSlots += piece.capacity;
  }
  return {
    installedSlots,
    houseTierBonus: 0,
    cabinBase: {
      value: null,
      status: 'PENDING_OWNER',
      rule: 'HOME-11',
      note: 'Do not set a starting stash number.',
    },
    rule: 'HOME-08',
    status: 'LOCKED',
  };
}

/**
 * @param {{ acquiredTiers: string[], installedFurniture?: unknown[], displayTier?: string }} house
 * @param {string} tierId
 */
export function acquireTier(house, tierId) {
  if (tierIndex(tierId) < 0) throw new TypeError(`unknown house tier "${tierId}"`);
  const acquiredTiers = house.acquiredTiers.includes(tierId)
    ? [...house.acquiredTiers]
    : [...house.acquiredTiers, tierId];
  const next = {
    ...house,
    acquiredTiers,
    installedFurniture: Array.isArray(house.installedFurniture) ? house.installedFurniture.map((piece) => ({ ...piece })) : [],
  };
  next.displayTier = displayHouseTier(next);
  return next;
}

/**
 * @param {{ acquiredTiers?: string[], installedFurniture?: object[], displayTier?: string }} house
 * @param {{ furnitureId: string, capacity: number, name?: string }} piece
 */
export function installFurniture(house, piece) {
  if (!piece || typeof piece.furnitureId !== 'string' || piece.furnitureId.length === 0) {
    throw new TypeError('furnitureId is required');
  }
  if (!Number.isInteger(piece.capacity) || piece.capacity < 0) {
    throw new TypeError('capacity must be a non-negative integer');
  }
  const next = {
    ...house,
    acquiredTiers: [...(house.acquiredTiers ?? [])],
    installedFurniture: [...(house.installedFurniture ?? []), { ...piece, installed: true }],
  };
  next.displayTier = displayHouseTier(next);
  return next;
}
