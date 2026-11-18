/**
 * A complete EXPERIMENTAL scenario for tests.
 * tools/balance-lab does not import this file and does not fill these values in itself.
 */
export function experimentalConfig(patch = {}) {
  return applyPatch(baseConfig(), patch);
}

function baseConfig() {
  return {
    label: 'EXPERIMENTAL',
    scenarioId: 'EXPERIMENTAL_fixture',
    notes: 'Test fixture. Not a game default.',
    seed: 1,
    repeats: 1,
    repeatSeedStep: 1,
    parameters: {
      teamSpd: { aggregation: 'sum', rounding: 'none' },
      spdTieBreak: { method: 'lowerSideId' },
      hp: {
        scope: 'perAvatar',
        pool: flat(10),
        defeatWhen: 'everyAvatarHpZero',
        floorAtZero: true,
        healCanExceedStarting: false,
        revive: false,
      },
      apCost: {
        byActionType: { ATK: 1, DEF: 1, Skill: 1 },
        avatarModifier: 'none',
        perCard: [],
      },
      damage: {
        atk: flat(10),
        defCard: { kind: 'noEffect', amount: null, stacks: null },
        incoming: { order: [], shieldUnused: null, zeroAmountConsumes: false },
      },
      deck: {
        size: 8,
        scope: 'perSide',
        includeAvatarCards: false,
        avatarCardCount: 0,
        avatarCardPosition: null,
        composition: [
          { actionType: 'ATK', count: 8 },
          { actionType: 'DEF', count: 0 },
          { actionType: 'Skill', count: 0 },
        ],
      },
      draw: {
        openingCount: 5,
        openingIncludesFirstTurn: true,
        openingOrder: 'sideAThenSideB',
        eachTurnCount: 0,
        timing: 'never',
        emptyDeck: 'stopDrawing',
        handFull: 'skipCard',
        order: 'listed',
      },
      discard: { playedCardsGoTo: 'removed' },
      actionLimit: {
        mode: 'apOnly',
        maxPlays: null,
        maxByType: { ATK: null, DEF: null, Skill: null },
      },
      skill: {
        kind: 'noEffect',
        amount: null,
        grantsAp: 0,
        stat: null,
        duration: null,
        stacks: null,
      },
      simultaneousDefeat: { method: 'lowerSideId', whenTeamSpdTied: null },
      turnCap: { maxTurns: 12, atCap: 'unresolved' },
      targeting: {
        actor: 'highestPowLiving',
        actorStatRead: 'base',
        tieBreak: 'partyOrder',
        atk: 'firstLivingEnemy',
        def: null,
        skill: null,
      },
    },
    sides: {
      A: side('LAB_SIDE_A', 'A', [3, 3, 2, 2], [1, 1, 1, 1], [4, 3, 2, 1]),
      B: side('LAB_SIDE_B', 'B', [1, 1, 1, 1], [0, 0, 0, 0], [1, 1, 1, 1]),
    },
    policies: {
      sideA: policy('always-ATK', ['ATK']),
      sideB: policy('always-ATK', ['ATK']),
    },
    policySweep: null,
  };
}

export function flat(amount) {
  return {
    kind: 'linear',
    constant: amount,
    terms: [],
    minimum: 0,
    maximum: null,
    statRead: 'base',
  };
}

export function policy(id, priority) {
  return { id, label: 'EXPERIMENTAL', priority };
}

function side(sideId, letter, pows, defs, spds) {
  return {
    sideId,
    members: pows.map((pow, index) => ({
      avatarId: `LAB_${letter}${index + 1}`,
      pow,
      def: defs[index],
      spd: spds[index],
    })),
  };
}

function applyPatch(target, patch) {
  const clone = structuredClone(target);
  for (const [key, value] of Object.entries(patch)) {
    if (isObject(value) && isObject(clone[key])) clone[key] = applyPatch(clone[key], value);
    else clone[key] = value === undefined ? clone[key] : structuredClone(value);
  }
  return clone;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
