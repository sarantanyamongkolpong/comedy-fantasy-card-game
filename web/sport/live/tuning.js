/**
 * Web adapter choices for the live Sport Complex wiring (integration/v06-sport).
 *
 * Every entry here is PROPOSED unless it says otherwise. Owner decisions (t282u) are marked
 * OWNER_DECIDED or MVP_PROVISIONAL and still need their listed review.
 * These fill contract gaps between content/v06/sport, src/sport, and web/sport.
 * Numbers are BALANCE_PLACEHOLDER. Change them here, not in the screens.
 */

export const ADAPTER_TUNING = Object.freeze({
  status: 'PROPOSED',
  balance: 'BALANCE_PLACEHOLDER',

  /**
   * New-player starting G when the profile has no G balance at all.
   * MVP_PROVISIONAL (Owner decision t282u #4). Economy Balance review still required.
   */
  previewStartingG: 8000,
  previewStartingGStatus: Object.freeze({ status: 'MVP_PROVISIONAL', source: 't282u #4', pending: 'Economy Balance review' }),

  /**
   * Starter roster. Mirrors the web stream's fixture starter (same parody names),
   * re-keyed to content IDs. Football takes the whole Banquet Select XI exhibition side so an 11 with one GK can be fielded.
   */
  starter: Object.freeze({
    football: Object.freeze({ teams: Object.freeze(['Banquet Select XI']), coachIds: Object.freeze(['SPC_FOOTBALL_COA_001', 'SPC_FOOTBALL_COA_002', 'SPC_FOOTBALL_COA_003', 'SPC_FOOTBALL_COA_004']) }),
    basket: Object.freeze({ ids: Object.freeze(['SPC_BASKET_ATH_001', 'SPC_BASKET_ATH_002', 'SPC_BASKET_ATH_004', 'SPC_BASKET_ATH_005', 'SPC_BASKET_ATH_006']), coachIds: Object.freeze(['SPC_BASKET_COA_001', 'SPC_BASKET_COA_002', 'SPC_BASKET_COA_003']) }),
    car: Object.freeze({ ids: Object.freeze(['SPC_CAR_ENT_001', 'SPC_CAR_ENT_002', 'SPC_CAR_ENT_003', 'SPC_CAR_ENT_004']) }),
    moto: Object.freeze({ ids: Object.freeze(['SPC_MOTO_ENT_001', 'SPC_MOTO_ENT_002', 'SPC_MOTO_ENT_003', 'SPC_MOTO_ENT_004']) }),
  }),

  /** Opponents: the original sides the data stream marks as opponents / fill-ins. */
  opponents: Object.freeze({
    football: Object.freeze({ team: 'Gherkin Rovers', formation: '4-3-3' }),
    basket: Object.freeze({ team: 'Gravy Garden', scheme: '2-3-zone', pace: 'balanced' }),
    car: Object.freeze({ field: 'all-other-content-teams' }),
    moto: Object.freeze({ field: 'all-other-content-teams' }),
  }),

  /** The player's squad label in sims and results. */
  homeName: 'Your Complex',
  homeRaceTeamId: 'SPC_PLAYER_COMPLEX',

  /**
   * Coach passives. content/v06/sport has no passive field yet. These keys map the
   * web stream's fixture coach notes onto the sim's passive vocabulary. Original coaches get "none".
   */
  coachPassive: Object.freeze({
    SPC_FOOTBALL_COA_001: 'positional',
    SPC_FOOTBALL_COA_002: 'highline',
    SPC_FOOTBALL_COA_003: 'wingback',
    SPC_FOOTBALL_COA_004: 'adaptive',
    SPC_BASKET_COA_001: 'movement',
    SPC_BASKET_COA_002: 'discipline',
    SPC_BASKET_COA_003: 'clutch',
  }),
  coachPassiveLabel: Object.freeze({
    positional: 'Positional build.',
    highline: 'High press.',
    wingback: 'Wingback width.',
    adaptive: 'Adaptive bench.',
    movement: 'Movement offense.',
    discipline: 'Rotation discipline.',
    clutch: 'Clutch subs.',
    none: 'No passive.',
  }),

  /** Web choice keys -> sim ids. */
  basketScheme: Object.freeze({ man: 'man-to-man', zone: '2-3-zone', matchup: 'matchup-zone' }),
  basketPace: Object.freeze({ slow: 'grind', even: 'balanced', fast: 'push' }),
  tyre: Object.freeze({ soft: 'S', medium: 'M', hard: 'H', inter: 'Inter', wet: 'Wet' }),
  motoSetup: Object.freeze({ speed: 'Speed', handling: 'Handling', balanced: 'Balanced', wet: 'Wet' }),
  /** The car sim has no setup preset; the web setup chip feeds its aeroBias (-30..30). */
  carAeroBias: Object.freeze({ speed: 4, balanced: 0, handling: -4 }),

  /** Playback: keep at most this many events so x1 stays near content matchLengths.playbackSeconds (800 ms per event). */
  playbackMsPerEvent: 800,
});
