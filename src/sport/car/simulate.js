import { CAR_TRACKS, carTeams } from './roster.js';
import { simulateWeekend } from '../racing/weekend.js';

/**
 * Car weekend. Two entries per team. Qualifying sets the Grand Prix grid.
 * Sprint is optional and does not reshuffle that grid. Tyre plan is chosen
 * before the race; the sim does not demand a fixed number of stops.
 * @param {object} input
 */
export function simulateCar(input = {}) {
  const sprint = input.tactics?.sprint === true;
  return simulateWeekend({
    sport: 'car',
    seed: input.seed,
    home: input.home,
    away: input.away,
    field: input.field,
    tactics: input.tactics,
    tuning: input.tuning,
    defaults: carTeams(),
    tracks: CAR_TRACKS,
    sessions: sprint ? ['quali', 'sprint', 'gp'] : ['quali', 'gp'],
  });
}
