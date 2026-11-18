/**
 * TEST-ONLY rulesets for the replay examples.
 *
 * Nothing in src/ imports this file. These functions are not game defaults.
 * The numbers below exist so a recorded battle can spend AP and name a starter.
 * Damage and skill stay on the engine defaults, which throw BLOCKED_BY_DESIGN.
 */

const FIXTURE = 'TEST-ONLY';

/** TEST-ONLY. Costs the examples spend. Not a card-cost rule. */
const AP_COST_BY_ACTION_TYPE = Object.freeze({ ATK: 2, DEF: 1, Skill: 3 });

/** TEST-ONLY. Sums avatar SPD. This is not the game's team-SPD rule. */
function teamSpdSum(side) {
  return side.members.reduce((sum, member) => sum + member.stats.spd, 0);
}
teamSpdSum.label = FIXTURE;

/** TEST-ONLY. A side is defeated when every member marker `ko` is true. This is not an HP rule. */
function sideDefeatedWhenEveryKo(side) {
  return side.members.every((member) => member.markers?.ko === true);
}
sideDefeatedWhenEveryKo.label = FIXTURE;

/** TEST-ONLY. No extra cap beyond the AP check. */
function noExtraActionLimit() {
  return { ok: true };
}
noExtraActionLimit.label = FIXTURE;

/** TEST-ONLY. AP costs by action type. The table is the frozen object above. */
function apCostByActionType(card) {
  const cost = AP_COST_BY_ACTION_TYPE[card.actionType];
  if (!Number.isInteger(cost)) {
    throw new Error(`fixture cost missing for ${card.actionType}`);
  }
  return cost;
}
apCostByActionType.label = FIXTURE;

export const sumSpdKoRuleset = {
  id: 'test-only-sum-spd-ko',
  label: FIXTURE,
  parameters: {
    note: 'Fixture values for the recorder. Not game defaults.',
    teamSpd: 'sum of the four member spd stats',
    isSideDefeated: 'true when every member marker ko is true',
    apCostByActionType: { ...AP_COST_BY_ACTION_TYPE },
    perTurnActionLimit: 'accept while the play otherwise affords its cost',
    damage: 'not injected; engine default throws',
    skillEffect: 'not injected; engine default throws',
  },
  rules: {
    teamSpd: teamSpdSum,
    isSideDefeated: sideDefeatedWhenEveryKo,
    perTurnActionLimit: noExtraActionLimit,
    resolveApCost: apCostByActionType,
  },
};

export const rulesets = {
  [sumSpdKoRuleset.id]: sumSpdKoRuleset,
};

/**
 * @param {string} id
 */
export function getRuleset(id) {
  const found = rulesets[id];
  if (!found) {
    throw new TypeError(`Unknown fixture ruleset "${id}". Known: ${Object.keys(rulesets).join(', ')}`);
  }
  return found;
}
