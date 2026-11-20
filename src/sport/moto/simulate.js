import { MOTO_TRACKS, motoTeams } from './roster.js';
import { simulateWeekend } from '../racing/weekend.js';

/**
 * Motorcycle weekend. One qualifying grid is reused for the Sprint and the
 * Grand Prix. Each rider is one entry (one bike). Setup is a preset chosen
 * before the start. Stamina is a sim-only value and is not a card stat.
 * @param {object} input
 */
export function simulateMoto(input = {}) {
  return simulateWeekend({
    sport: 'moto',
    seed: input.seed,
    home: input.home,
    away: input.away,
    field: input.field,
    tactics: input.tactics,
    tuning: input.tuning,
    defaults: motoTeams(),
    tracks: MOTO_TRACKS,
    sessions: ['quali', 'sprint', 'gp'],
  });
}
