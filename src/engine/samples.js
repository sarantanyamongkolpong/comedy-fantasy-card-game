/**
 * SAMPLE / PROPOSED avatars and action cards for the demo loop and unit tests.
 * Names, factions, and Justina's Saving Grace match the locked v0.5 sheet.
 * Stats and the other skills are proposed samples, not approved combat balance.
 * These records are engine fixtures. Stream B owns the catalog rows (AVT_*_002).
 */

const SAMPLE = 'SAMPLE/PROPOSED';

function card(partial) {
  return {
    cardId: 'ACT_SAMPLE_STRIKE',
    name: 'Sample Strike',
    type: 'ATK',
    rarity: 'N',
    factionRequirement: null,
    factionOverride: false,
    costAp: 1,
    targetRule: 'Enemy',
    effects: [{ op: 'damage', mode: 'formula' }],
    onResolveZone: 'Discard',
    zoneRecovery: null,
    skillTargetCount: 1,
    versionAndStatus: SAMPLE,
    ...partial,
  };
}

/** @returns {object} */
export function sampleCard(partial = {}) {
  return card(partial);
}

function active(name, status, target, effects) {
  return { name, status, target, effects };
}

function passive(name, chance, trigger, effects, extra = {}) {
  return { name, status: 'PROPOSED', chance, trigger, effects, includeSelf: false, ...extra };
}

/** Four Epic samples. Existing AVT_*_001 ids are not reused. */
export function proposedSampleRoster() {
  return [
    {
      avatarId: 'AVT_AEG_002',
      designRef: 'AV_EX01',
      name: 'JUSTIN CASE',
      faction: 'Aegis Dominion',
      rarity: 'Epic',
      statStatus: 'PROPOSED',
      gender: null,
      assetRef: null,
      stats: { atk: 3, def: 8, spd: 1 },
      active: active('Shield and Taunt', 'PROPOSED', 'self', [
        { op: 'shield', amount: 2, target: 'self' },
        { op: 'taunt', durationTurns: 1, target: 'self' },
      ]),
      passive: passive('Bulwark', 0.7, 'turn_start', [
        { op: 'buff', stat: 'def', amount: 1, durationTurns: 1, target: 'all_allies' },
      ], { includeSelf: true }),
    },
    {
      avatarId: 'AVT_PHA_002',
      designRef: 'AV_EX02',
      name: 'JUSTIN TIME',
      faction: 'Phantom Blades',
      rarity: 'Epic',
      statStatus: 'PROPOSED',
      gender: null,
      assetRef: null,
      stats: { atk: 8, def: 2, spd: 9 },
      active: active('Reckless Rush', 'PROPOSED', 'self', [
        { op: 'next_attack', amount: 2, target: 'self' },
      ]),
      passive: passive('Lucky Slash', 0.3, 'on_attack', [
        { op: 'bonus_damage', amount: 2 },
      ]),
    },
    {
      avatarId: 'AVT_CEL_002',
      designRef: 'AV_EX03',
      name: 'JUSTIN THEORY',
      faction: 'Celestial Nexus',
      rarity: 'Epic',
      statStatus: 'PROPOSED',
      gender: null,
      assetRef: null,
      stats: { atk: 7, def: 3, spd: 4 },
      active: active('Arcane Formula', 'PROPOSED', 'self', [
        { op: 'next_attack', amount: 3, target: 'self' },
      ]),
      passive: passive('Eureka!', 0.4, 'turn_start', [
        { op: 'buff', stat: 'atk', amount: 1, durationTurns: 1, target: 'self' },
      ], { includeSelf: true }),
    },
    {
      avatarId: 'AVT_SAN_002',
      designRef: 'AV_EX04',
      name: 'JUSTINA MOMENT',
      faction: 'Sanctuary Order',
      rarity: 'Epic',
      statStatus: 'PROPOSED',
      gender: 'female',
      assetRef: null,
      stats: { atk: 2, def: 5, spd: 6 },
      active: active('Saving Grace', 'LOCKED', 'all_allies', [
        { op: 'regen', amount: 3, ticks: 2, target: 'all_allies' },
      ]),
      passive: passive('Moral Support', 0.5, 'turn_start', [
        { op: 'buff', stat: 'atk', amount: 1, durationTurns: 1, target: 'random_ally' },
      ]),
    },
  ];
}

function library() {
  return [
    card({ cardId: 'ACT_SAMPLE_STRIKE', name: 'Sample Strike', costAp: 1 }),
    card({ cardId: 'ACT_SAMPLE_STRIKE_0', name: 'Sample Jab', costAp: 0 }),
    card({ cardId: 'ACT_SAMPLE_STRIKE_5', name: 'Sample Haymaker', costAp: 5 }),
    card({
      cardId: 'ACT_SAMPLE_GUARD',
      name: 'Sample Guard',
      type: 'DEF',
      rarity: 'N',
      costAp: 1,
      targetRule: 'Self',
      effects: [{ op: 'shield', amount: 2, target: 'self' }],
    }),
    card({
      cardId: 'ACT_SAMPLE_SKILL',
      name: 'Sample Skill',
      type: 'Skill',
      rarity: 'R',
      costAp: 1,
      targetRule: 'Ally',
      effects: [{ op: 'trigger_active' }],
    }),
    card({
      cardId: 'ACT_SAMPLE_FAC_AEG',
      name: 'Sample Aegis Strike',
      rarity: 'FAC',
      factionRequirement: 'Aegis Dominion',
      costAp: 1,
    }),
    card({
      cardId: 'ACT_SAMPLE_FAC_PHA',
      name: 'Sample Phantom Strike',
      rarity: 'FAC',
      factionRequirement: 'Phantom Blades',
      costAp: 1,
    }),
    card({
      cardId: 'ACT_SAMPLE_FAC_CEL',
      name: 'Sample Nexus Strike',
      rarity: 'FAC',
      factionRequirement: 'Celestial Nexus',
      costAp: 1,
    }),
    card({
      cardId: 'ACT_SAMPLE_FAC_SAN',
      name: 'Sample Sanctuary Strike',
      rarity: 'FAC',
      factionRequirement: 'Sanctuary Order',
      costAp: 1,
    }),
    card({
      cardId: 'ACT_SAMPLE_DRAW',
      name: 'Sample Draw',
      type: 'Skill',
      rarity: 'N',
      costAp: 1,
      targetRule: 'Self',
      effects: [{ op: 'draw', count: 1 }],
    }),
    card({
      cardId: 'ACT_SAMPLE_VOID',
      name: 'Sample Exile Strike',
      rarity: 'R',
      costAp: 1,
      onResolveZone: 'Void',
      effects: [{ op: 'damage', mode: 'flat', amount: 1 }],
    }),
    card({
      cardId: 'ACT_SAMPLE_RETRIEVE',
      name: 'Sample Recall',
      type: 'Skill',
      rarity: 'R',
      costAp: 1,
      targetRule: 'Pile',
      effects: [{
        op: 'retrieve',
        pile: 'discard',
        destination: 'hand',
        count: 1,
        permit: { cardIds: ['ACT_SAMPLE_STRIKE', 'ACT_SAMPLE_VOID', 'ACT_SAMPLE_STRIKE_0'] },
      }],
    }),
  ];
}

/** 30-card sample deck. Repeated definitions fill the locked size. Duplicate cap is PENDING and unset. */
export function buildSampleDeck() {
  const defs = library();
  const deck = [];
  while (deck.length < 30) {
    deck.push(structuredClone(defs[deck.length % defs.length]));
  }
  return deck;
}

/**
 * Two sample teams and two 30-card decks. `hp` overrides the placeholder life total for a short demo.
 * @param {{ seed?: number, hp?: number, shuffleDecks?: boolean, playerControl?: string, enemyControl?: string }} [options]
 */
export function proposedSampleMatchInput(options = {}) {
  const tune = (avatar) => {
    const copy = structuredClone(avatar);
    if (Number.isInteger(options.hp)) {
      copy.maxHp = options.hp;
      copy.hp = options.hp;
    }
    return copy;
  };
  return {
    seed: options.seed ?? 1,
    shuffleDecks: options.shuffleDecks !== false,
    teams: [
      { sideId: 'player', control: options.playerControl ?? 'human', avatars: proposedSampleRoster().map(tune) },
      { sideId: 'enemy', control: options.enemyControl ?? 'ai', avatars: proposedSampleRoster().map(tune) },
    ],
    decks: {
      player: buildSampleDeck(),
      enemy: buildSampleDeck(),
    },
  };
}
