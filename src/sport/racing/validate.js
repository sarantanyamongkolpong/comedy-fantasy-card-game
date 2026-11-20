const CAR_TYRES = new Set(['S', 'M', 'H', 'Inter', 'Wet']);
const MOTO_TYRES = new Set(['S', 'M', 'H', 'Wet']);
const SETUPS = new Set(['Speed', 'Handling', 'Balanced', 'Wet']);
const STAT_KEYS = ['TopSpeed', 'Accel', 'Handling'];

/**
 * @param {string} message
 * @param {string} code
 */
export function fail(message, code) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function intIn(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

/**
 * @param {object} entry
 * @param {string} teamId
 * @param {'car' | 'moto'} sport
 * @param {number} maxLap
 */
export function normalizeEntry(entry, teamId, sport, maxLap) {
  if (!entry || typeof entry.id !== 'string' || entry.id.length === 0) fail('entry id is required', 'BAD_ENTRY');
  if (typeof entry.parodyName !== 'string' || entry.parodyName.trim().length === 0) {
    fail(`entry ${entry.id} needs a parodyName`, 'BAD_ENTRY');
  }
  if (entry.teamId != null && entry.teamId !== teamId) {
    fail(`entry ${entry.id} teamId does not match its team`, 'BAD_ENTRY');
  }
  const stats = {};
  for (const key of STAT_KEYS) {
    if (!intIn(entry.stats?.[key], 0, 100)) {
      fail(`${entry.id} ${key} must be an integer from 0 to 100`, 'BAD_STATS');
    }
    stats[key] = entry.stats[key];
  }
  const strategy = entry.strategy && typeof entry.strategy === 'object' ? entry.strategy : {};
  const tyres = sport === 'moto' ? MOTO_TYRES : CAR_TYRES;
  const tyre = strategy.tyre ?? entry.tyre ?? 'M';
  if (!tyres.has(tyre)) fail(`${entry.id} tyre is not legal for ${sport}`, 'BAD_STRATEGY');
  const pitPlan = strategy.pitPlan ?? [];
  if (!Array.isArray(pitPlan) || pitPlan.some((lap) => !intIn(lap, 1, maxLap))) {
    fail(`${entry.id} pitPlan laps must be integers from 1 to ${maxLap}`, 'BAD_STRATEGY');
  }
  if (new Set(pitPlan).size !== pitPlan.length) fail(`${entry.id} pitPlan repeats a lap`, 'BAD_STRATEGY');
  const pitTyres = strategy.pitTyres ?? [];
  if (!Array.isArray(pitTyres) || pitTyres.some((compound) => !tyres.has(compound))) {
    fail(`${entry.id} pitTyres has a compound that is not legal for ${sport}`, 'BAD_STRATEGY');
  }
  const aeroBias = strategy.aeroBias ?? 0;
  if (!intIn(aeroBias, -30, 30)) fail(`${entry.id} aeroBias must be an integer from -30 to 30`, 'BAD_STRATEGY');
  const risk = strategy.risk ?? 0;
  if (!intIn(risk, 0, 40)) fail(`${entry.id} risk must be an integer from 0 to 40`, 'BAD_STRATEGY');
  const wetResponse = strategy.wetResponse ?? 'stay';
  if (wetResponse !== 'stay' && wetResponse !== 'box') fail(`${entry.id} wetResponse must be stay or box`, 'BAD_STRATEGY');
  const setup = entry.setup ?? strategy.setup ?? 'Balanced';
  if (sport === 'moto' && !SETUPS.has(setup)) fail(`${entry.id} setup must be Speed, Handling, Balanced, or Wet`, 'BAD_STRATEGY');
  const aggression = entry.aggression ?? strategy.aggression ?? 0;
  if (!intIn(aggression, 0, 30)) fail(`${entry.id} aggression must be an integer from 0 to 30`, 'BAD_STRATEGY');
  let stamina = null;
  if (sport === 'moto') {
    stamina = entry.stamina ?? 100;
    if (!intIn(stamina, 0, 100)) fail(`${entry.id} stamina must be an integer from 0 to 100`, 'BAD_STRATEGY');
  }
  return {
    id: entry.id,
    parodyName: entry.parodyName,
    teamId,
    stats,
    strategy: { tyre, pitPlan: pitPlan.slice(), pitTyres: pitTyres.slice(), aeroBias, risk, wetResponse },
    setup: sport === 'moto' ? setup : 'Balanced',
    aggression: sport === 'moto' ? aggression : 0,
    stamina,
  };
}

/**
 * @param {object} team
 * @param {string} label
 * @param {'car' | 'moto'} sport
 * @param {number} maxLap
 */
export function normalizeTeam(team, label, sport, maxLap) {
  if (!team || typeof team.teamId !== 'string' || team.teamId.length === 0) {
    fail(`${label} teamId is required`, 'BAD_TEAM');
  }
  if (!Array.isArray(team.entries) || team.entries.length !== 2) {
    fail(`${label} needs exactly 2 entries`, 'BAD_TEAM');
  }
  const entries = team.entries.map((entry) => normalizeEntry(entry, team.teamId, sport, maxLap));
  if (entries[0].id === entries[1].id) fail(`${label} entries must be different`, 'BAD_ENTRY');
  return {
    teamId: team.teamId,
    parodyName: typeof team.parodyName === 'string' && team.parodyName.length > 0 ? team.parodyName : team.teamId,
    entries,
  };
}

/**
 * @param {{ teamId: string, entries: { id: string }[] }[]} teams
 */
export function assertUniqueGrid(teams) {
  const teamsSeen = new Set();
  const ids = new Set();
  for (const team of teams) {
    if (teamsSeen.has(team.teamId)) fail(`duplicate team ${team.teamId}`, 'BAD_TEAM');
    teamsSeen.add(team.teamId);
    for (const entry of team.entries) {
      if (ids.has(entry.id)) fail(`duplicate entry ${entry.id}`, 'BAD_ENTRY');
      ids.add(entry.id);
    }
  }
}

/**
 * @param {object[]} tracks
 * @param {string | null | undefined} trackId
 */
export function resolveTrack(tracks, trackId) {
  if (trackId == null) return tracks[0];
  const track = tracks.find((row) => row.id === trackId);
  if (!track) fail(`unknown track ${trackId}`, 'BAD_TRACK');
  return track;
}

/**
 * Forecast weather is a seeded uncertainty, not a promise.
 * @param {object} tactics
 * @param {object} track
 * @param {ReturnType<import('./rng.js').createRng>} rng
 */
export function resolveWeather(tactics, track, rng) {
  const choice = tactics?.weather ?? 'forecast';
  if (choice === 'dry') return 0;
  if (choice === 'damp') return 1;
  if (choice === 'wet') return 2;
  if (choice !== 'forecast') fail('weather must be dry, damp, wet, or forecast', 'BAD_WEATHER');
  const roll = rng.int(1000);
  if (roll < track.wetPerMil) return 2;
  if (roll < track.wetPerMil + track.dampPerMil) return 1;
  return 0;
}

export const WEATHER_LABEL = ['dry', 'damp', 'wet'];
