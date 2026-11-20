/**
 * Three defensive schemes from the v0.6 basketball brief.
 * Status: PROPOSED. Strengths are gameplay inferences (paint vs perimeter,
 * chasing a star, synergy), not a rock-paper-scissors chart and not an
 * official coaching grade.
 */
import { clamp } from '../common/rng-and-events.mjs';

export const SCHEME_IDS = Object.freeze(['man-to-man', '2-3-zone', 'matchup-zone']);

export const PACE_IDS = Object.freeze(['grind', 'balanced', 'push']);

export const POSITIONS = Object.freeze(['PG', 'SG', 'SF', 'PF', 'C']);

export const SCHEMES = Object.freeze({
  'man-to-man': Object.freeze({
    id: 'man-to-man',
    key: 'man',
    label: 'man-to-man',
    paintProtection: 0.5,
    perimeterContest: 0.6,
    eliteChase: 1,
    staminaTax: 0.07,
    synergyNeed: 0.15,
    reboundHelp: 0,
  }),
  '2-3-zone': Object.freeze({
    id: '2-3-zone',
    key: 'zone',
    label: '2-3 zone',
    paintProtection: 0.72,
    perimeterContest: 0.36,
    eliteChase: 0,
    staminaTax: 0.03,
    synergyNeed: 0.2,
    reboundHelp: 0.08,
  }),
  'matchup-zone': Object.freeze({
    id: 'matchup-zone',
    key: 'matchup',
    label: 'matchup zone',
    paintProtection: 0.6,
    perimeterContest: 0.52,
    eliteChase: 0.45,
    staminaTax: 0.05,
    synergyNeed: 0.9,
    reboundHelp: 0.04,
  }),
});

/** Shot-selection weight by the slot the player is filling. */
export const SHOT_WEIGHT = Object.freeze({
  PG: 0.92,
  SG: 1.16,
  SF: 1.05,
  PF: 0.96,
  C: 0.84,
});

/** Rebound weight by slot. */
export const REBOUND_WEIGHT = Object.freeze({
  PG: 0.62,
  SG: 0.74,
  SF: 1,
  PF: 1.22,
  C: 1.4,
});

/**
 * Contest level in about 0.15–0.9. Higher means a harder shot.
 * Man-to-man adds a chase on the best shooter. A 2-3 zone protects the paint
 * and yields the arc. Matchup zone loses contest when Def ratings are uneven.
 *
 * @param {{ kind: 'two' | 'three', scheme: object, shooterIsStar: boolean, defSpread: number, fatigue: number, tuning: object }} input
 */
export function basketContest({ kind, scheme, shooterIsStar, defSpread, fatigue, tuning }) {
  let contest = kind === 'three' ? scheme.perimeterContest : scheme.paintProtection;
  if (scheme.key === 'man' && shooterIsStar) contest += tuning.starChase * scheme.eliteChase;
  if (scheme.key === 'matchup') {
    contest -= Math.min(tuning.matchupSpreadCap, Math.max(0, defSpread) * scheme.synergyNeed);
  }
  if (scheme.key === 'zone' && kind === 'three') contest -= 0.02;
  contest -= Math.max(0, fatigue) * scheme.staminaTax;
  return clamp(contest, 0.15, 0.9);
}
