/**
 * Player profile helpers. Starter roster is SAMPLE data until content/v05 arrives.
 * Deck size 30 and team size 4 are LOCKED. Duplicate cap is PENDING (not enforced).
 */

import { JUSTIN_IDS, STARTER_DECK_LIST, factionName } from './sample-catalog.js';

export const HOUSE_TIERS = Object.freeze([
  Object.freeze({ tierId: 'cabin', tierName: 'Cabin', rule: 'HOME-01' }),
  Object.freeze({ tierId: 'bungalow', tierName: 'Bungalow', rule: 'HOME-02' }),
  Object.freeze({ tierId: 'cottage', tierName: 'Cottage', rule: 'HOME-03' }),
  Object.freeze({ tierId: 'loft', tierName: 'Loft', rule: 'HOME-04' }),
  Object.freeze({ tierId: 'villa', tierName: 'Villa', rule: 'HOME-05' }),
  Object.freeze({ tierId: 'penthouse', tierName: 'Penthouse', rule: 'HOME-06' }),
]);

export function createStarterProfile(catalog) {
  const avatars = catalog.avatars.map((avatar) => ({
    instanceId: `own:${avatar.avatarId}`,
    avatarId: avatar.avatarId,
    locked: false,
    favorite: false,
    source: avatar.battleLegal ? 'SAMPLE_STARTER' : 'EXISTING_ART_AVATAR',
  }));
  const actions = STARTER_DECK_LIST.map((cardId, index) => ({
    instanceId: `own:act:${index}:${cardId}`,
    cardId,
    locked: false,
    favorite: false,
    source: 'SAMPLE_STARTER',
  }));
  return {
    version: 1,
    dataSource: catalog.source ?? 'SAMPLE',
    productionReady: false,
    seq: 1,
    house: { tierId: 'cabin', tierName: 'Cabin', rule: 'HOME-01', status: 'LOCKED' },
    storage: { status: 'PENDING', rule: 'HOME-11', installed: [] },
    avatars,
    actions,
    tokens: [],
    team: JUSTIN_IDS.map((id) => `own:${id}`),
    deck: actions.map((action) => action.instanceId),
    banners: {},
    claimedRewardIds: [],
    companion: { status: 'PLACEHOLDER' },
  };
}

function nextId(profile, prefix) {
  profile.seq += 1;
  return `${prefix}:${profile.seq}`;
}

export function ownedAvatar(profile, instanceId) {
  return profile.avatars.find((avatar) => avatar.instanceId === instanceId) ?? null;
}

export function ownedAction(profile, instanceId) {
  return profile.actions.find((action) => action.instanceId === instanceId) ?? null;
}

export function teamDefs(profile, catalog) {
  return profile.team.map((instanceId) => {
    const owned = ownedAvatar(profile, instanceId);
    const def = owned ? catalog.avatarById(owned.avatarId) : null;
    return { owned, def };
  });
}

export function deckDefs(profile, catalog) {
  return profile.deck.map((instanceId) => {
    const owned = ownedAction(profile, instanceId);
    const def = owned ? catalog.cardById(owned.cardId) : null;
    return { owned, def, instanceId };
  });
}

export function facHints(profile, catalog) {
  const factions = new Set(teamDefs(profile, catalog).map((row) => row.def?.factionId).filter(Boolean));
  const hints = [];
  const seen = new Set();
  for (const row of deckDefs(profile, catalog)) {
    const card = row.def;
    if (!card?.factionRequirement || factions.has(card.factionRequirement)) continue;
    if (seen.has(card.cardId)) continue;
    seen.add(card.cardId);
    hints.push({
      level: 'warning',
      cardId: card.cardId,
      text: `${card.name} is FAC. It needs a living ${factionName(card.factionRequirement)} avatar on the team before it can be played. A mixed deck may still hold it.`,
    });
  }
  return hints;
}

export function deckMessages(profile, catalog) {
  const messages = [];
  const count = profile.deck.length;
  if (count !== 30) {
    messages.push({
      level: 'error',
      text: count < 30
        ? `The deck has ${count}/30 action cards. The tower bouncer wants ${30 - count} more.`
        : `The deck has ${count}/30 action cards. Remove ${count - 30}.`,
    });
  } else {
    messages.push({ level: 'ok', text: '30/30 action cards. The bouncer nods.' });
  }
  messages.push({
    level: 'info',
    text: 'Duplicate cap is PENDING (CORE-040) and is not enforced.',
  });
  if (profile.team.length !== 4) {
    messages.push({ level: 'error', text: `Team is ${profile.team.length}/4 avatars.` });
  }
  for (const row of teamDefs(profile, catalog)) {
    if (!row.def) {
      messages.push({ level: 'error', text: 'The team points at an avatar you do not own.' });
    } else if (!row.def.battleLegal) {
      messages.push({
        level: 'error',
        text: `${row.def.name} (${row.def.avatarId}) has stats ${row.def.statsStatus}. They cannot enter the tower yet.`,
      });
    }
  }
  const unique = new Set(profile.team);
  if (unique.size !== profile.team.length) {
    messages.push({ level: 'error', text: 'The same avatar copy is seated twice.' });
  }
  messages.push(...facHints(profile, catalog));
  return messages;
}

export function battleReady(profile, catalog) {
  const messages = deckMessages(profile, catalog);
  return {
    ok: messages.every((message) => message.level !== 'error'),
    messages,
  };
}

function memberFrom(instanceId, def) {
  return {
    instanceId,
    avatarId: def.avatarId,
    assetId: def.assetId,
    name: def.name,
    factionId: def.factionId,
    factionName: factionName(def.factionId),
    role: def.role,
    rarity: def.rarity,
    stats: { ...def.stats },
    statsStatus: def.statsStatus,
    active: def.active ? { ...def.active } : null,
    passive: def.passive ? { ...def.passive } : null,
  };
}

export function buildMatchInput(profile, catalog, { seed, mode }) {
  const members = teamDefs(profile, catalog).map((row) => memberFrom(row.owned.instanceId, row.def));
  const deck = deckDefs(profile, catalog).map((row) => ({ ...row.def, instanceId: row.instanceId }));
  const enemyMembers = catalog.justinIds.map((avatarId) => {
    const def = catalog.avatarById(avatarId);
    return memberFrom(`echo:${avatarId}`, { ...def, name: `Echo ${def.name}` });
  });
  const enemyDeck = STARTER_DECK_LIST.map((cardId, index) => ({
    ...catalog.cardById(cardId),
    instanceId: `echo:act:${index}:${cardId}`,
  }));
  return {
    seed,
    mode,
    teams: [
      { sideId: 'player', members },
      { sideId: 'enemy', members: enemyMembers },
    ],
    decks: { player: deck, enemy: enemyDeck },
  };
}

export function toggleFlag(profile, kind, instanceId, flag) {
  const list = kind === 'avatar' ? profile.avatars : profile.actions;
  const row = list.find((item) => item.instanceId === instanceId);
  if (!row) return false;
  row[flag] = !row[flag];
  return true;
}

export function setTeamSlot(profile, index, instanceId) {
  if (index < 0 || index > 3) return { ok: false, reason: 'Teams have 4 seats.' };
  if (profile.team.includes(instanceId)) return { ok: false, reason: 'That copy is already seated.' };
  const owned = ownedAvatar(profile, instanceId);
  if (!owned) return { ok: false, reason: 'You do not own that avatar.' };
  const next = profile.team.slice();
  next[index] = instanceId;
  profile.team = next.filter(Boolean).slice(0, 4);
  return { ok: true };
}

export function toggleDeckCard(profile, instanceId) {
  const owned = ownedAction(profile, instanceId);
  if (!owned) return { ok: false, reason: 'That card is not in the stash.' };
  if (owned.locked && profile.deck.includes(instanceId)) {
    return { ok: false, reason: 'Locked cards stay put. Unlock it before pulling it from the deck.' };
  }
  if (profile.deck.includes(instanceId)) {
    profile.deck = profile.deck.filter((id) => id !== instanceId);
    return { ok: true, inDeck: false };
  }
  profile.deck = profile.deck.concat(instanceId);
  return { ok: true, inDeck: true };
}

export function applyPull(profile, result) {
  if (result.avatarId) {
    const instanceId = nextId(profile, 'gacha');
    profile.avatars.push({
      instanceId,
      avatarId: result.avatarId,
      locked: false,
      favorite: false,
      source: 'GACHA_TEST',
    });
    return instanceId;
  }
  if (result.cardId) {
    const instanceId = nextId(profile, 'gacha');
    profile.actions.push({
      instanceId,
      cardId: result.cardId,
      locked: false,
      favorite: false,
      source: 'GACHA_TEST',
    });
    return instanceId;
  }
  const instanceId = nextId(profile, 'token');
  profile.tokens.push({
    instanceId,
    name: result.name,
    rarity: result.rarity,
    pool: result.pool,
    note: result.note,
    assetId: result.assetId,
    source: 'GACHA_TEST',
  });
  return instanceId;
}

export function inDeck(profile, instanceId) {
  return profile.deck.includes(instanceId);
}

export function inTeam(profile, instanceId) {
  return profile.team.includes(instanceId);
}
