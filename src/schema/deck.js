import { DECK_SIZE } from './constants.js';

/**
 * @param {unknown} deck
 * @param {{ cardsById?: Map<string, object> | Record<string, object>, teamFactions?: string[], enforceFac?: boolean }} [context]
 */
export function validateDeck(deck, context = {}) {
  /** @type {{ path: string, message: string, rule?: string }[]} */
  const errors = [];
  const cardIds = deck && typeof deck === 'object' ? deck.cardIds : undefined;
  if (!Array.isArray(cardIds)) {
    errors.push({ path: 'cardIds', message: 'cardIds must be an array', rule: 'CORE-009' });
  } else if (cardIds.length !== DECK_SIZE) {
    errors.push({
      path: 'cardIds',
      message: `deck must contain exactly ${DECK_SIZE} action cards (has ${cardIds.length})`,
      rule: 'CORE-009',
    });
  }

  const cardsById = context.cardsById ?? new Map();
  const lookup = (id) => (cardsById instanceof Map ? cardsById.get(id) : cardsById[id]);
  /** @type {object[]} */
  const resolved = [];
  if (Array.isArray(cardIds)) {
    cardIds.forEach((id, index) => {
      if (typeof id !== 'string' || id.length === 0) {
        errors.push({ path: `cardIds[${index}]`, message: 'card id must be a non-empty string' });
        return;
      }
      const card = lookup(id);
      if (!card) {
        errors.push({ path: `cardIds[${index}]`, message: `unknown card "${id}"` });
        return;
      }
      resolved.push(card);
    });
  }

  const team = new Set(context.teamFactions ?? []);
  /** @type {{ cardId: string, faction: string | null, legal: boolean, reason: string, rule: string }[]} */
  const facLegality = [];
  const factions = new Set();
  for (const card of resolved) {
    const faction = card.Faction_Requirement ?? null;
    if (typeof faction === 'string') factions.add(faction);
    const rarity = card.Rarity ?? card.rarity;
    if (rarity !== 'FAC') continue;
    const override = Boolean(card.Can_Play && card.Can_Play.factionOverride === true);
    const legal = override || (typeof faction === 'string' && team.has(faction));
    const reason = override
      ? 'card sets factionOverride'
      : legal
        ? 'team includes the required faction'
        : 'FAC requires a matching faction avatar on the team (CORE-023)';
    facLegality.push({
      cardId: card.cardId ?? card.Action_ID,
      faction: typeof faction === 'string' ? faction : null,
      legal,
      reason,
      rule: 'CORE-023',
    });
    if (context.enforceFac === true && !legal) {
      errors.push({
        path: `card:${card.cardId ?? card.Action_ID}`,
        message: reason,
        rule: 'CORE-023',
      });
    }
  }

  const counts = new Map();
  if (Array.isArray(cardIds)) {
    for (const id of cardIds) {
      if (typeof id !== 'string') continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    info: {
      count: Array.isArray(cardIds) ? cardIds.length : 0,
      requiredCount: DECK_SIZE,
      mixedFactionsAllowed: true,
      singleFactionForbidden: false,
      mixed: factions.size > 1,
      factions: [...factions],
      facLegality,
      duplicateCounts: Object.fromEntries(counts),
      duplicateMax: { value: null, status: 'PENDING_OWNER', rule: 'CORE-040' },
      inDeckProtection: {
        rule: 'GA-13',
        status: 'LOCKED',
        note: 'Copies reserved by a deck cannot be consumed. Lock and favorite protect the whole stack.',
      },
    },
  };
}
