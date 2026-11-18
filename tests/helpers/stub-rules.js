/**
 * TEST-ONLY rule stubs.
 *
 * The Owner has not designed these rules. Tests inject the functions below.
 * Nothing in src/ imports this file. Do not copy these functions into game defaults.
 */
export const TEST_ONLY = 'TEST-ONLY';

/** TEST-ONLY. Sums avatar SPD. This is not the game's team-SPD rule. */
export function testOnlyTeamSpdSum(side) {
  return side.members.reduce((sum, member) => sum + member.stats.spd, 0);
}
testOnlyTeamSpdSum.label = TEST_ONLY;

/** TEST-ONLY. A side is defeated when every member marker `ko` is true. This is not an HP rule. */
export function testOnlySideDefeatedWhenAllKo(side) {
  return side.members.every((member) => member.markers?.ko === true);
}
testOnlySideDefeatedWhenAllKo.label = TEST_ONLY;

/** TEST-ONLY. No extra cap beyond the AP check. */
export function testOnlyNoExtraActionLimit() {
  return { ok: true, label: TEST_ONLY, name: 'no per-turn cap beyond AP' };
}
testOnlyNoExtraActionLimit.label = TEST_ONLY;

/**
 * TEST-ONLY. Allows at most `max` committed plays this turn.
 * @param {number} max
 */
export function testOnlyMaxPlays(max) {
  const rule = ({ playsThisTurn }) => {
    if (playsThisTurn >= max) return { ok: false, reason: 'ACTION_LIMIT', label: TEST_ONLY };
    return { ok: true, label: TEST_ONLY };
  };
  rule.label = TEST_ONLY;
  return rule;
}

/**
 * TEST-ONLY. AP costs by action type. The table is supplied by the test.
 * @param {Record<string, number>} table
 */
export function testOnlyCostByType(table) {
  const rule = (card) => {
    const cost = table[card.actionType];
    if (!Number.isInteger(cost)) {
      throw new Error(`TEST-ONLY cost missing for ${card.actionType}`);
    }
    return cost;
  };
  rule.label = TEST_ONLY;
  return rule;
}

/**
 * TEST-ONLY. Draws the first deck card into the hand.
 * @param {{ hand: { cards: object[] }, deck: { cards: object[] } }} input
 */
export function testOnlyDrawOne(input) {
  const next = input.deck.cards[0];
  if (!next) return { ok: false, reason: 'DECK_EMPTY', label: TEST_ONLY };
  input.deck.cards = input.deck.cards.slice(1);
  input.hand.cards.push(structuredClone(next));
  return { ok: true, cardId: next.cardId, label: TEST_ONLY };
}
testOnlyDrawOne.label = TEST_ONLY;

/**
 * TEST-ONLY. Treats `max` as a deck size cap. The cap is chosen by the test.
 * @param {number} max
 */
export function testOnlyDeckMax(max) {
  const rule = (deck) => ({ ok: deck.cards.length <= max, max, label: TEST_ONLY });
  rule.label = TEST_ONLY;
  return rule;
}

/**
 * TEST-ONLY avatar. Stat numbers exist so a battle can run. They are not catalog values.
 * @param {string} avatarId
 * @param {number} spd
 */
export function testOnlyAvatar(avatarId, spd) {
  return {
    avatarId,
    stats: { pow: 0, def: 0, spd, valueStatus: 'SET' },
    markers: { ko: false },
    labels: [TEST_ONLY],
  };
}

/**
 * @param {string} sideId
 * @param {number[]} spds
 */
export function testOnlySide(sideId, spds) {
  if (spds.length !== 4) throw new Error('TEST-ONLY side needs 4 spd values');
  return {
    sideId,
    members: spds.map((spd, index) => testOnlyAvatar(`${sideId}_AV${index + 1}`, spd)),
  };
}

/**
 * @param {{ cardId: string, actionType: 'ATK' | 'DEF' | 'Skill', apCost?: number | null }} input
 */
export function testOnlyActionCard(input) {
  const apCost = input.apCost === undefined ? null : input.apCost;
  return {
    cardId: input.cardId,
    cardKind: 'action_card',
    actionType: input.actionType,
    name: null,
    apCost,
    costStatus: apCost === null ? 'TBD' : 'SET',
    effectId: null,
    rarity: null,
    labels: [TEST_ONLY],
  };
}
