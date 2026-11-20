/** Screen ids owned by Inventory & Collection. Party's deck tab reuses the deck builder. */

export const COLLECTION_ROUTES = Object.freeze(['stash', 'inventory', 'collection', 'deck', 'detail']);

/**
 * @param {string} screen
 * @param {string} [partyTab]
 * @returns {string | null}
 */
export function collectionRoute(screen, partyTab) {
  if (COLLECTION_ROUTES.includes(screen)) return screen;
  if (screen === 'party' && partyTab === 'deck') return 'deck';
  return null;
}

/**
 * @param {string} route
 * @param {boolean} party
 */
export function screenTitle(route, party) {
  if (route === 'stash') return 'The Stash';
  if (route === 'inventory') return 'Inventory';
  if (route === 'collection') return 'Card Collection';
  if (route === 'detail') return 'Card Detail';
  if (route === 'deck' && party) return 'Team & Deck';
  return 'Deck Builder';
}

/**
 * @param {string} route
 * @param {boolean} party
 * @param {string} [current]
 */
export function navItems(route, party, current) {
  const active = route === 'detail' ? current : route;
  if (party) {
    return [
      { id: 'team', label: 'Team of 4', screen: 'party', selected: false },
      { id: 'deck', label: 'Action deck', screen: 'deck', selected: active === 'deck' },
      { id: 'stash', label: 'Stash', screen: 'stash', selected: active === 'stash' },
      { id: 'collection', label: 'Collection', screen: 'collection', selected: active === 'collection' },
    ];
  }
  return [
    { id: 'stash', label: 'Stash', screen: 'stash', selected: active === 'stash' },
    { id: 'inventory', label: 'Inventory', screen: 'inventory', selected: active === 'inventory' },
    { id: 'collection', label: 'Collection', screen: 'collection', selected: active === 'collection' },
    { id: 'deck', label: 'Deck', screen: 'deck', selected: active === 'deck' },
  ];
}
