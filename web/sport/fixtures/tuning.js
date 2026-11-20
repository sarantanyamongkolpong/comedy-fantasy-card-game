/**
 * One tuning file for every PROPOSED sport number the preview shows.
 * Status stays PROPOSED. Nothing here is an official measurement.
 */

export const TUNING = Object.freeze({
  status: 'PROPOSED',
  balance: 'BALANCE_PLACEHOLDER',
  previewStartingG: 8000,
  pullCostG: 100,
  pull10CostG: 900,
  pity: Object.freeze({ epic: 100, ex: 200 }),
  weights: Object.freeze([
    Object.freeze({ rarity: 'N', weight: 700 }),
    Object.freeze({ rarity: 'R', weight: 220 }),
    Object.freeze({ rarity: 'Epic', weight: 70 }),
    Object.freeze({ rarity: 'EX', weight: 10 }),
  ]),
  rewards: Object.freeze({ football: 240, basket: 180, car: 300, moto: 280 }),
  football: Object.freeze({
    coachBonus: 2,
    formations: Object.freeze({
      '4-3-3': Object.freeze({ attack: 4, defend: -1, blurb: 'Wide forwards. PROPOSED.' }),
      '4-2-3-1': Object.freeze({ attack: 2, defend: 2, blurb: 'Double screen, one striker. PROPOSED.' }),
      '3-5-2': Object.freeze({ attack: 3, defend: 1, blurb: 'Wingbacks and two strikers. PROPOSED.' }),
      '4-4-2': Object.freeze({ attack: 1, defend: 3, blurb: 'Two compact lines. PROPOSED.' }),
      '3-4-3': Object.freeze({ attack: 5, defend: -2, blurb: 'Three forwards, thin flanks. PROPOSED.' }),
    }),
  }),
  basket: Object.freeze({
    schemes: Object.freeze({
      man: Object.freeze({ label: 'Man-to-man', defend: 2, blurb: 'Chase your match. PROPOSED.' }),
      zone: Object.freeze({ label: '2-3 zone', defend: 3, blurb: 'Pack the paint. PROPOSED.' }),
      matchup: Object.freeze({ label: 'Matchup zone', defend: 1, blurb: 'A zone that knows names. PROPOSED.' }),
    }),
    paces: Object.freeze({
      slow: Object.freeze({ label: 'Slow', factor: 0.86, blurb: 'Fewer trips up the floor. PROPOSED.' }),
      even: Object.freeze({ label: 'Even', factor: 1, blurb: 'A steady clock. PROPOSED.' }),
      fast: Object.freeze({ label: 'Fast', factor: 1.14, blurb: 'More shots, more wheeze. PROPOSED.' }),
    }),
  }),
  car: Object.freeze({
    laps: 8,
    tyres: Object.freeze({
      soft: Object.freeze({ label: 'Soft', speed: 4 }),
      medium: Object.freeze({ label: 'Medium', speed: 2 }),
      hard: Object.freeze({ label: 'Hard', speed: 0 }),
      inter: Object.freeze({ label: 'Inter', speed: 1 }),
      wet: Object.freeze({ label: 'Wet', speed: -1 }),
    }),
    setups: Object.freeze({
      speed: Object.freeze({ label: 'Speed', top: 4, handle: -2 }),
      balanced: Object.freeze({ label: 'Balanced', top: 1, handle: 1 }),
      handling: Object.freeze({ label: 'Handling', top: -2, handle: 4 }),
    }),
  }),
  moto: Object.freeze({
    laps: 8,
    tyres: Object.freeze({
      soft: Object.freeze({ label: 'Soft', speed: 3, handle: 1 }),
      medium: Object.freeze({ label: 'Medium', speed: 2, handle: 2 }),
      hard: Object.freeze({ label: 'Hard', speed: 1, handle: 0 }),
      wet: Object.freeze({ label: 'Wet', speed: 0, handle: 3 }),
    }),
    setups: Object.freeze({
      speed: Object.freeze({ label: 'Speed', top: 4, handle: -1 }),
      handling: Object.freeze({ label: 'Handling', top: -1, handle: 4 }),
      balanced: Object.freeze({ label: 'Balanced', top: 1, handle: 1 }),
      wet: Object.freeze({ label: 'Wet', top: -2, handle: 3 }),
    }),
  }),
});

export function getTuning() {
  return TUNING;
}
