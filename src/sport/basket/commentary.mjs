/**
 * Comedic basketball lines. Templates interpolate parody names only.
 * Status: PROPOSED.
 */

/** @type {Record<string, string[]>} */
export const BASKET_LINES = {
  tip: [
    'Tip. {actor} sends it toward {team}. The night has a favorite for about one second.',
  ],
  period_start: [
    '{period} starts. {home} {homeScore}, {away} {awayScore}.',
  ],
  period_end: [
    'End of {period}. {home} {homeScore}, {away} {awayScore}.',
  ],
  make2: [
    '{clock}. {actor} lays it in. The rim nods.',
    '{clock}. {actor} finishes at the rim and the scoreboard agrees.',
  ],
  make3: [
    '{clock}. {actor} lets a three fly. The net does a small happy cough.',
    '{clock}. {actor} from the arc. Somewhere a defender files a complaint.',
  ],
  assisted: [
    '{clock}. {assist} finds {actor}, and the ball never asks questions.',
  ],
  miss: [
    '{clock}. {actor} rises. The ball consults the rim and declines.',
    '{clock}. {actor} misses. The rebound becomes everyone\'s problem.',
  ],
  block: [
    '{clock}. {actor} sends {shooter}\'s shot back to sender.',
  ],
  free_make: [
    '{clock}. {actor} makes the free throw. The gym holds one polite clap.',
  ],
  free_miss: [
    '{clock}. {actor} rims the free throw out. Even the stripe looks embarrassed.',
  ],
  rebound_off: [
    '{actor} keeps it alive on the glass.',
  ],
  rebound_def: [
    '{actor} grabs the board and the trip changes hands.',
  ],
  turnover: [
    '{clock}. {actor} donates the ball. No receipt.',
  ],
  steal: [
    '{clock}. {actor} picks {victim}\'s pocket and looks innocent.',
  ],
  shot_clock: [
    '{clock}. Shot clock. {actor} held the ball like a warm pastry until 24 ran out.',
  ],
  backcourt: [
    '{clock}. Backcourt. {actor} failed the eight-second errand. Turnover.',
  ],
  foul: [
    '{clock}. Foul on {actor}, number {fouls}. The notebook is unimpressed.',
  ],
  foul_out: [
    'Foul out. {out} sits after 5. {inn} checks in. Five remain five.',
  ],
  foul_out_held: [
    'Foul out, but {actor} has nobody legal to hand the spot to, so the five stay five.',
  ],
  substitution: [
    'Sub. {out} to the bench, {inn} onto the floor. Still five.',
  ],
  overtime: [
    'Overtime {n}. The scoreboard refused to pick a favorite. Five more minutes.',
  ],
  final: [
    'Final. {home} {homeScore}, {away} {awayScore}.',
  ],
  safety: [
    'The overtime cap is a PROPOSED safety valve. {actor} settles it with one free throw.',
  ],
};

/**
 * @param {{ nextInt: (count: number) => number }} rng
 * @param {string} key
 * @param {Record<string, string | number>} vars
 */
export function commentary(rng, key, vars) {
  const bank = BASKET_LINES[key];
  if (!bank || bank.length === 0) throw new Error(`missing basketball commentary bank: ${key}`);
  const template = bank[rng.nextInt(bank.length)];
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    if (vars[name] == null) throw new Error(`basketball commentary ${key} missing {${name}}`);
    return String(vars[name]);
  });
}
