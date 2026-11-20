import { readFileSync } from 'node:fs';
import { repoPath } from './load-api.js';

function readFixture(name) {
  return JSON.parse(readFileSync(repoPath('tests', 'fixtures', 'v05', name), 'utf8'));
}

export function seeds() {
  return readFixture('seeds.json');
}

export function rosters() {
  return readFixture('rosters.json');
}

export function decks() {
  return readFixture('decks.json');
}

export function banners() {
  return readFixture('banners.json');
}

export function viewports() {
  return readFixture('viewports.json');
}

/**
 * @param {object[]} defs
 * @param {string} sideId
 */
export function expandDeck(defs, sideId) {
  const cards = [];
  const seen = new Map();
  for (const def of defs) {
    const copies = def.copies ?? 1;
    for (let copy = 0; copy < copies; copy += 1) {
      const index = seen.get(def.defId) ?? 0;
      seen.set(def.defId, index + 1);
      cards.push(actionCard(def, `${sideId}-${def.defId}-${index}`));
    }
  }
  return cards;
}

function actionCard(def, instanceId) {
  const spec = effectSpec(def);
  return {
    instanceId,
    cardId: def.defId,
    name: def.name,
    type: def.type,
    rarity: def.rarity,
    factionRequirement: def.factionRequirement ?? null,
    factionOverride: def.factionOverride === true,
    costAp: def.costAp,
    targetRule: spec.targetRule,
    effects: spec.effects,
    onResolveZone: def.onResolveZone ?? 'Discard',
    zoneRecovery: null,
    skillTargetCount: 1,
    sampleStatus: def.sampleStatus ?? 'SAMPLE',
  };
}

function effectSpec(def) {
  if (def.defId === 'ACT_GEN_DRAW') return { targetRule: 'Self', effects: [{ op: 'draw', count: 2 }] };
  if (def.defId === 'ACT_DMG_ALL') return { targetRule: 'All_Enemies', effects: [{ op: 'damage', mode: 'flat', amount: 1 }] };
  if (def.defId === 'ACT_RETRIEVE') {
    return {
      targetRule: 'Pile',
      effects: [{
        op: 'retrieve',
        pile: 'discard',
        destination: 'hand',
        count: 1,
        permit: { cardIds: ['ACT_GEN_ATK0'] },
      }],
    };
  }
  if (def.defId === 'ACT_GEN_SKILL' || def.defId === 'ACT_GEN_SKILL_EXTRA') {
    return { targetRule: 'Self', effects: [{ op: 'trigger_active' }] };
  }
  if (def.type === 'ATK') return { targetRule: 'Enemy', effects: [{ op: 'damage', mode: 'formula' }] };
  if (def.type === 'DEF') return { targetRule: 'Self', effects: [{ op: 'shield', amount: 1 }] };
  return { targetRule: 'Self', effects: [] };
}

function fillerStrikes(count) {
  return [{
    defId: 'ACT_GEN_ATK',
    name: 'Sample Strike',
    type: 'ATK',
    rarity: 'N',
    costAp: 1,
    copies: count,
    sampleStatus: 'SAMPLE',
  }];
}

/**
 * @param {'standard' | 'faction' | 'damage'} [profile]
 */
export function playerDeck(profile = 'standard') {
  const data = decks();
  if (profile === 'faction') {
    return expandDeck([...data.factionFront, ...fillerStrikes(25)], 'player');
  }
  if (profile === 'damage') {
    const front = [
      { defId: 'ACT_DMG_ALL', name: 'Sample Rout', type: 'ATK', rarity: 'R', costAp: 1, copies: 1, effect: { op: 'damage', amount: 1, target: 'all_enemies' }, sampleStatus: 'SAMPLE' },
      ...data.standardFront.slice(0, 4),
    ];
    return expandDeck([...front, ...fillerStrikes(25)], 'player');
  }
  return expandDeck([...data.standardFront, ...data.standardRest], 'player');
}

export function enemyDeck() {
  return expandDeck(fillerStrikes(30), 'enemy');
}

/**
 * @param {object} record
 * @param {{ spd?: number, hp?: number, defeated?: boolean, passiveChance?: number }} [options]
 */
export function toAvatar(record, options = {}) {
  const stats = {
    atk: record.stats?.atk ?? 1,
    def: record.stats?.def ?? 1,
    spd: options.spd ?? record.stats?.spd ?? 1,
    sampleStatus: record.statsStatus ?? 'PROPOSED',
  };
  const hp = options.defeated === true ? 0 : (options.hp ?? 10);
  const justina = record.designRef === 'AV_EX04' || record.rosterId.includes('AVT_SAN_002');
  const avatar = {
    avatarId: record.rosterId,
    instanceId: `${record.rosterId}-field`,
    designRef: record.designRef ?? null,
    nameEn: record.nameEn,
    factionId: record.factionCode,
    role: record.roleName,
    rarity: record.rarityName ?? 'Epic',
    gender: record.female === true || justina ? 'female' : null,
    stats,
    hp,
    maxHp: options.hp ?? 10,
    hpStatus: 'FIXTURE',
    defeated: hp <= 0,
    statuses: [],
    active: justina ? {
      name: 'Saving Grace',
      status: 'LOCKED',
      target: 'all_allies',
      effects: [{ op: 'regen', amount: 3, ticks: 2, target: 'all_allies' }],
    } : {
      name: 'Sample Active',
      status: 'PROPOSED',
      target: 'self',
      effects: [{ op: 'shield', amount: 0, target: 'self' }],
    },
    passive: null,
  };
  if (typeof options.passiveChance === 'number') {
    avatar.passive = {
      name: 'Sample Passive',
      status: 'PROPOSED',
      chance: options.passiveChance,
      trigger: 'turn_start',
      includeSelf: true,
      effects: [{ op: 'buff', stat: 'def', amount: 1, durationTurns: 1, target: 'self' }],
    };
  }
  return avatar;
}

export function deckLists(input) {
  if (Array.isArray(input.decks)) {
    return input.decks.map((deck) => (Array.isArray(deck) ? deck : deck.cards));
  }
  return Object.values(input.decks);
}

/**
 * @param {{ profile?: 'standard' | 'faction' | 'damage', damageSide?: 'player' | 'enemy', spd?: 'playerHigher' | 'enemyHigher' | 'tie' | 'sheet', hp?: number, playerHp?: number, enemyHp?: number, defeatPlayerIndex?: number, seed?: number, config?: object, passiveChance?: number }} [options]
 */
export function buildMatch(options = {}) {
  const seedFile = seeds();
  const roster = rosters();
  const spdMode = options.spd ?? (options.damageSide === 'enemy' ? 'enemyHigher' : 'playerHigher');
  const playerSpd = spdMode === 'tie' ? 4 : spdMode === 'enemyHigher' ? 1 : spdMode === 'sheet' ? null : 9;
  const enemySpd = spdMode === 'tie' ? 4 : spdMode === 'enemyHigher' ? 9 : spdMode === 'sheet' ? null : 1;
  const player = roster.justins.map((record, index) => toAvatar(record, {
    spd: playerSpd ?? record.stats.spd,
    hp: options.playerHp ?? options.hp ?? 10,
    defeated: options.defeatPlayerIndex === index,
    passiveChance: options.passiveChance,
  }));
  const enemy = roster.justins.map((record) => toAvatar({
    ...record,
    rosterId: `${record.rosterId}-FOE`,
    active: null,
    passive: null,
  }, {
    spd: enemySpd ?? record.stats.spd,
    hp: options.enemyHp ?? options.hp ?? 10,
  }));
  const profile = options.profile ?? (options.damageSide ? 'damage' : 'standard');
  const damageSide = options.damageSide ?? (profile === 'damage' ? 'player' : null);
  const damageCards = playerDeck('damage');
  const plainCards = enemyDeck();
  const playerCards = damageSide === 'enemy'
    ? plainCards.map((card) => ({ ...card, instanceId: card.instanceId.replace(/^enemy-/, 'player-') }))
    : playerDeck(profile === 'damage' ? 'standard' : profile);
  const enemyCards = damageSide === 'enemy'
    ? damageCards.map((card) => ({ ...card, instanceId: `enemy-${card.cardId}-${card.instanceId.split('-').at(-1)}` }))
    : damageSide === 'player'
      ? plainCards
      : plainCards;
  const resolvedPlayerCards = damageSide === 'player' ? damageCards : playerCards;
  assertDeckCount(resolvedPlayerCards);
  assertDeckCount(enemyCards);
  return {
    seed: options.seed ?? seedFile.battleSeed,
    shuffleDecks: false,
    config: options.config,
    teams: [
      { sideId: 'player', control: 'human', avatars: player },
      { sideId: 'enemy', control: 'ai', avatars: enemy },
    ],
    decks: {
      player: resolvedPlayerCards,
      enemy: enemyCards,
    },
  };
}

export function assertDeckCount(cards, expected = 30) {
  if (cards.length !== expected) {
    throw new Error(`fixture deck has ${cards.length} cards, expected ${expected}`);
  }
}
