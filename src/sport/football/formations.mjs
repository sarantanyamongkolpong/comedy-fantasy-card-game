/**
 * Five football shapes from the v0.6 owner brief.
 * Status: PROPOSED. Traits are design inferences, not a counter table and
 * not an official tactical rating. Two shapes never "delete" each other;
 * `footballContext` returns a small multiplier around 1.
 *
 * Trait meanings (unitless, about 0–1):
 *   width            flank occupation
 *   centralNumbers   bodies between the boxes
 *   press            high line / attacking pressure
 *   transitionRisk   space left behind the line
 *   wingbackLoad     extra stamina tax on wide defenders
 *   boxPresence      finishers in the penalty area
 *   compactness      how narrow and stacked the block is
 */
import { clamp } from '../common/rng-and-events.mjs';

export const FORMATION_IDS = Object.freeze(['4-3-3', '4-2-3-1', '3-5-2', '4-4-2', '3-4-3']);

/** @type {Record<string, string>} */
export const ROLE_FAMILY = Object.freeze({
  GK: 'GK',
  CB: 'CB',
  RB: 'FB',
  LB: 'FB',
  RWB: 'WB',
  LWB: 'WB',
  DM: 'DM',
  CM: 'CM',
  AM: 'AM',
  RM: 'W',
  LM: 'W',
  RW: 'W',
  LW: 'W',
  ST: 'ST',
});

const LINE = Object.freeze({
  GK: 'GK',
  CB: 'DEF',
  FB: 'DEF',
  WB: 'DEF',
  DM: 'MID',
  CM: 'MID',
  AM: 'MID',
  W: 'FWD',
  ST: 'FWD',
});

/** How much a slot family contributes to the attack rating. GK is separate. */
export const ATTACK_WEIGHT = Object.freeze({
  GK: 0,
  CB: 0.28,
  FB: 0.58,
  WB: 0.74,
  DM: 0.5,
  CM: 0.8,
  AM: 1.16,
  W: 1.12,
  ST: 1.34,
});

/** How much a slot family contributes to the outfield defense rating. */
export const DEFENSE_WEIGHT = Object.freeze({
  GK: 0,
  CB: 1.3,
  FB: 1.04,
  WB: 0.98,
  DM: 1.1,
  CM: 0.74,
  AM: 0.4,
  W: 0.32,
  ST: 0.18,
});

const ADVANCED = new Set(['AM', 'W', 'ST']);

/**
 * @param {string} role
 */
export function roleFamily(role) {
  return ROLE_FAMILY[role] ?? null;
}

/**
 * @param {string} role
 */
export function isAdvancedRole(role) {
  const family = roleFamily(role);
  return family != null && ADVANCED.has(family);
}

/**
 * Positional legality is soft except for the goalkeeper slot.
 * 1 is a natural fit. Lower numbers are still allowed for outfield slots.
 * @param {string} playerRole
 * @param {string} slotRole
 */
export function suitability(playerRole, slotRole) {
  if (playerRole === slotRole) return 1;
  const playerFamily = roleFamily(playerRole);
  const slotFamily = roleFamily(slotRole);
  if (!playerFamily || !slotFamily) return 0.6;
  if (playerFamily === 'GK' || slotFamily === 'GK') return 0.35;
  if (playerFamily === slotFamily) return 0.92;
  const playerLine = LINE[playerFamily];
  const slotLine = LINE[slotFamily];
  if (playerLine === slotLine) return 0.8;
  const order = ['DEF', 'MID', 'FWD'];
  const distance = Math.abs(order.indexOf(playerLine) - order.indexOf(slotLine));
  if (distance === 1) return 0.7;
  return 0.58;
}

function slots(roles) {
  return roles.map((role) => ({ role }));
}

export const FORMATIONS = Object.freeze({
  '4-3-3': Object.freeze({
    id: '4-3-3',
    slots: Object.freeze(slots(['GK', 'RB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CM', 'RW', 'ST', 'LW'])),
    profile: Object.freeze({
      width: 0.78,
      centralNumbers: 0.56,
      press: 0.58,
      transitionRisk: 0.64,
      wingbackLoad: 0.48,
      boxPresence: 0.62,
      compactness: 0.46,
    }),
  }),
  '4-2-3-1': Object.freeze({
    id: '4-2-3-1',
    slots: Object.freeze(slots(['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'DM', 'RW', 'AM', 'LW', 'ST'])),
    profile: Object.freeze({
      width: 0.6,
      centralNumbers: 0.74,
      press: 0.5,
      transitionRisk: 0.5,
      wingbackLoad: 0.36,
      boxPresence: 0.48,
      compactness: 0.66,
    }),
  }),
  '3-5-2': Object.freeze({
    id: '3-5-2',
    slots: Object.freeze(slots(['GK', 'CB', 'CB', 'CB', 'RWB', 'CM', 'DM', 'CM', 'LWB', 'ST', 'ST'])),
    profile: Object.freeze({
      width: 0.7,
      centralNumbers: 0.78,
      press: 0.48,
      transitionRisk: 0.6,
      wingbackLoad: 0.84,
      boxPresence: 0.72,
      compactness: 0.7,
    }),
  }),
  '4-4-2': Object.freeze({
    id: '4-4-2',
    slots: Object.freeze(slots(['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CM', 'LM', 'ST', 'ST'])),
    profile: Object.freeze({
      width: 0.52,
      centralNumbers: 0.5,
      press: 0.42,
      transitionRisk: 0.4,
      wingbackLoad: 0.32,
      boxPresence: 0.76,
      compactness: 0.8,
    }),
  }),
  '3-4-3': Object.freeze({
    id: '3-4-3',
    slots: Object.freeze(slots(['GK', 'CB', 'CB', 'CB', 'RWB', 'CM', 'CM', 'LWB', 'RW', 'ST', 'LW'])),
    profile: Object.freeze({
      width: 0.84,
      centralNumbers: 0.48,
      press: 0.6,
      transitionRisk: 0.7,
      wingbackLoad: 0.88,
      boxPresence: 0.66,
      compactness: 0.42,
    }),
  }),
});

/**
 * Small, two-sided context multiplier. Identical profiles produce the same
 * number in both directions (a scoring environment), not a winner.
 * Tired wingbacks only help the side that is attacking them.
 *
 * @param {{ attack: object, defense: object, wingbackFatigue?: number, tuning: object }} input
 */
export function footballContext({ attack, defense, wingbackFatigue = 0, tuning }) {
  const openness = (attack.width + defense.transitionRisk + attack.press) / 3;
  const wall = defense.compactness * (1 - attack.width * 0.35);
  const overload = attack.centralNumbers - defense.centralNumbers;
  const tired = wingbackFatigue * defense.wingbackLoad;
  const box = attack.boxPresence - defense.boxPresence;
  let edge =
    (openness - 0.55) * tuning.kOpen -
    (wall - 0.55) * tuning.kWall +
    overload * tuning.kCentral +
    tired * tuning.kTired +
    box * tuning.kBox;
  if (attack.dampContext) edge *= 1 - attack.dampContext;
  return clamp(1 + edge, tuning.contextMin, tuning.contextMax);
}
