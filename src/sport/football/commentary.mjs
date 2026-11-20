/**
 * Comedic football lines. Templates interpolate caller-supplied parody names
 * and team parody names only. No real athlete, coach, or club names live here.
 * Status: PROPOSED.
 */

/** @type {Record<string, string[]>} */
export const FOOTBALL_LINES = {
  kickoff: [
    'Kickoff. {home} and {away} shake imaginary hands and then ignore each other.',
    'The whistle tweets. {home} roll the ball at {away} like a polite dare.',
  ],
  open_play: [
    '{actor} checks both shoulders, then picks the boring pass. The grass approves.',
    '{team} circulate the ball like a shared snack nobody wants to finish.',
    'A quiet minute. Someone yells for the switch and nobody switches.',
    '{actor} takes a touch, loses a debate with the ball, and starts over.',
  ],
  shot_miss: [
    '{actor} winds up. The shot applies for a passport and leaves the ground.',
    '{actor} shoots. The ball chooses a life in the stands.',
    'Effort from {actor}. The frame stays innocent.',
  ],
  save: [
    '{gk} gets a glove on it and the net stays unemployed.',
    '{gk} smothers {actor}\'s shot and looks personally offended.',
    'Save. {gk} punches the danger into next week. {actor} shrugs.',
  ],
  goal: [
    'GOAL. {actor} finishes and the net makes a small surprised noise.',
    'GOAL. {actor} tucks it in like a room-service tray. {team} enjoy this.',
    'GOAL. {actor} finds the corner the goalkeeper had rented to someone else.',
  ],
  goal_assist: [
    'GOAL. {actor} finishes. {assist} claims the assist and also the celebration.',
    'GOAL. {assist} slides it, {actor} taps it, the scoreboard does arithmetic.',
  ],
  foul: [
    '{actor} clips {victim}. Free kick. Everybody stays on the grass — eleven remain eleven.',
    'Whistle. {actor} arrives late to {victim}. No one is sent off.',
  ],
  offside: [
    'Offside. {actor} was in the play, not just standing ahead. The flag goes up like a napkin.',
    'Flag. {actor} took part too early. The attack is politely cancelled.',
  ],
  injury: [
    '{actor} sits down and negotiates with a leg. The sponge arrives with opinions.',
    '{actor} pulls up. The bench suddenly looks like a vacation.',
  ],
  substitution: [
    'Sub. {out} trudges off with jelly legs. {inn} jogs on still fizzing.',
    '{out} off, {inn} on. The shape stays full. Eleven in, eleven out.',
  ],
  half_time: [
    'Half time. {home} {homeGoals}, {away} {awayGoals}. Oranges are imaginary and still refreshing.',
  ],
  full_time: [
    'Full time. {home} {homeGoals}, {away} {awayGoals}.',
  ],
  extra_start: [
    'Still level. Extra time, two short halves. A shoot-out is not part of this sim.',
  ],
  extra_half: [
    'Extra-time interval. {home} {homeGoals}, {away} {awayGoals}. Legs file a complaint.',
  ],
  extra_end: [
    'Extra time ends. {home} {homeGoals}, {away} {awayGoals}. Penalties stay in the rulebook, not in this log.',
  ],
};

/**
 * @param {{ nextInt: (count: number) => number }} rng
 * @param {string} key
 * @param {Record<string, string | number>} vars
 */
export function commentary(rng, key, vars) {
  const bank = FOOTBALL_LINES[key];
  if (!bank || bank.length === 0) {
    throw new Error(`missing football commentary bank: ${key}`);
  }
  const template = bank[rng.nextInt(bank.length)];
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    if (vars[name] == null) throw new Error(`football commentary ${key} missing {${name}}`);
    return String(vars[name]);
  });
}
