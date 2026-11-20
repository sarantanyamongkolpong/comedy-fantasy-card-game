import { assertSeed, createRng, mixSeed } from './rng.js';
import { resetRace, runSession, toRuntime } from './session.js';
import { resolveTuning } from './tuning.js';
import { assertUniqueGrid, fail, normalizeTeam, resolveTrack, resolveWeather } from './validate.js';

function byId(a, b) {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

function byRaceTime(a, b) {
  if (a.raceMs !== b.raceMs) return a.raceMs - b.raceMs;
  return byId(a, b);
}

function assertTrack(track) {
  if (!track || !Array.isArray(track.sectors) || track.sectors.length !== 3) fail('track needs 3 sectors', 'BAD_TRACK');
  const share = track.sectors.reduce((sum, sector) => sum + sector.share, 0);
  if (share !== 100) fail(`${track.id} sector shares must sum to 100`, 'BAD_TRACK');
  for (const sector of track.sectors) {
    if (sector.straight + sector.corner + sector.accel !== 100) {
      fail(`${track.id} sector weights must sum to 100`, 'BAD_TRACK');
    }
  }
}

function classify(entries) {
  const fin = entries.filter((entry) => !entry.retired).sort(byRaceTime);
  const dnf = entries.filter((entry) => entry.retired).sort((a, b) => {
    if (b.lapsCompleted !== a.lapsCompleted) return b.lapsCompleted - a.lapsCompleted;
    if (b.raceMs !== a.raceMs) return b.raceMs - a.raceMs;
    return byId(a, b);
  });
  return [...fin, ...dnf];
}

function snapshot(entries) {
  return classify(entries).map((entry, index) => ({
    id: entry.id,
    parodyName: entry.parodyName,
    teamId: entry.teamId,
    position: index + 1,
    timeMs: entry.raceMs,
    status: entry.retired ? 'DNF' : 'FIN',
    lapsCompleted: entry.lapsCompleted,
    stamina: entry.stamina,
  }));
}

function award(rows, table) {
  return rows.map((row, index) => ({
    ...row,
    points: row.status === 'FIN' ? (table[index] ?? 0) : 0,
  }));
}

function opponentsFrom(input, homeTeam, defaults, sport, maxLap) {
  if (input.field != null && input.away != null) fail('pass away or field, not both', 'BAD_FIELD');
  if (input.field != null || input.away != null) {
    const raw = input.field ?? input.away;
    const list = Array.isArray(raw) ? raw : [raw];
    return list.map((team, index) => normalizeTeam(team, `field[${index}]`, sport, maxLap));
  }
  if (input.tactics?.fillField === false) return [];
  const homeIds = new Set(homeTeam.entries.map((entry) => entry.id));
  return defaults
    .filter((team) => team.teamId !== homeTeam.teamId && team.entries.every((entry) => !homeIds.has(entry.id)))
    .map((team, index) => normalizeTeam(team, `field[${index}]`, sport, maxLap));
}

/**
 * Qualifying, optional sprint, and Grand Prix. Pure: same seed and input, same result.
 * Team points are the sum of that team's two entries. One retirement does not forfeit the other.
 * @param {object} input
 */
export function simulateWeekend(input) {
  const sport = input.sport;
  if (sport !== 'car' && sport !== 'moto') fail('sport must be car or moto', 'BAD_SPORT');
  const seed = assertSeed(input.seed);
  const tuning = resolveTuning(input.tuning);
  const sessions = input.sessions;
  if (!Array.isArray(sessions) || sessions[0] !== 'quali' || sessions[sessions.length - 1] !== 'gp') {
    fail('sessions must start with quali and end with gp', 'BAD_RACE');
  }
  const lapsOf = {
    quali: 1,
    sprint: tuning[sport].sprintLaps,
    gp: tuning[sport].gpLaps,
  };
  for (const name of sessions) {
    const laps = lapsOf[name];
    if (!Number.isInteger(laps) || laps < 1 || laps > tuning.maxLaps) fail(`${name} laps are out of range`, 'BAD_RACE');
  }
  const homeTeam = normalizeTeam(input.home, 'home', sport, lapsOf.gp);
  const opponents = opponentsFrom(input, homeTeam, input.defaults ?? [], sport, lapsOf.gp);
  const teams = [homeTeam, ...opponents];
  assertUniqueGrid(teams);
  const track = resolveTrack(input.tracks, input.tactics?.trackId);
  assertTrack(track);
  const weather = resolveWeather(input.tactics, track, createRng(mixSeed(seed, 'weather')));
  const entries = teams.flatMap((team) => team.entries.map((entry) => toRuntime(entry, sport)));
  const labels = { quali: 'Qualifying', sprint: 'Sprint', gp: 'Grand Prix' };
  let clock = 0;
  const bundle = [];
  let qualiRows = [];
  let sprintRows = null;
  let gpRows = [];
  let sprintSafety = false;
  let gpSafety = false;
  let sprintWeather = weather;
  let gpWeather = weather;
  const gridIds = () => entries.slice().sort((a, b) => a.qualiMs - b.qualiMs || byId(a, b)).map((entry) => entry.id);

  for (const name of sessions) {
    const rng = createRng(mixSeed(seed, name));
    if (name !== 'quali') resetRace(entries);
    const ran = runSession({
      kind: name === 'quali' ? 'quali' : 'race',
      label: labels[name],
      laps: lapsOf[name],
      entries,
      gridIds: name === 'quali' ? null : gridIds(),
      track,
      tuning,
      sport,
      rng,
      clock,
      weather,
      weatherFlip: input.tactics?.weatherFlip,
    });
    bundle.push(...ran.events);
    clock = ran.clock + 1;
    if (name === 'quali') qualiRows = snapshot(entries);
    if (name === 'sprint') {
      sprintRows = award(snapshot(entries), tuning.points[sport].sprint);
      sprintSafety = ran.safetyCar;
      sprintWeather = ran.weather;
    }
    if (name === 'gp') {
      gpRows = award(snapshot(entries), tuning.points[sport].gp);
      gpSafety = ran.safetyCar;
      gpWeather = ran.weather;
    }
  }

  const qualiIds = qualiRows.map((row) => row.id);
  const drivers = entries.map((entry) => {
    const sprint = sprintRows?.find((row) => row.id === entry.id) ?? null;
    const gp = gpRows.find((row) => row.id === entry.id);
    const row = {
      id: entry.id,
      parodyName: entry.parodyName,
      teamId: entry.teamId,
      grid: qualiIds.indexOf(entry.id) + 1,
      sprintPosition: sprint ? sprint.position : null,
      gpPosition: gp.position,
      sprintPoints: sprint ? sprint.points : 0,
      gpPoints: gp.points,
      points: (sprint ? sprint.points : 0) + gp.points,
      sprintStatus: sprint ? sprint.status : null,
      status: gp.status,
      dnf: gp.status === 'DNF',
      timeMs: gp.status === 'FIN' ? gp.timeMs : null,
    };
    if (sport === 'moto') row.stamina = gp.stamina;
    return row;
  });
  drivers.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (a.gpPosition !== b.gpPosition) return a.gpPosition - b.gpPosition;
    return byId(a, b);
  });
  const teamRows = teams.map((team) => {
    const members = team.entries.map((entry) => drivers.find((driver) => driver.id === entry.id));
    return {
      teamId: team.teamId,
      parodyName: team.parodyName,
      points: members.reduce((sum, driver) => sum + driver.points, 0),
      sprintPoints: members.reduce((sum, driver) => sum + driver.sprintPoints, 0),
      gpPoints: members.reduce((sum, driver) => sum + driver.gpPoints, 0),
      drivers: members.map((driver) => driver.id),
      forfeit: false,
    };
  });
  teamRows.sort((a, b) => b.points - a.points || (a.teamId < b.teamId ? -1 : a.teamId > b.teamId ? 1 : 0));
  const finished = drivers.some((driver) => driver.status === 'FIN' || driver.sprintStatus === 'FIN');
  const leader = finished ? drivers[0] : null;
  const face = leader
    ? { id: leader.id, parodyName: leader.parodyName, teamId: leader.teamId, points: leader.points }
    : null;
  const homePoints = drivers.filter((driver) => driver.teamId === homeTeam.teamId).reduce((sum, driver) => sum + driver.points, 0);
  const claimIds = entries.map((entry) => entry.id).sort().join('.');
  const events = bundle
    .sort((a, b) => a.t - b.t || a.seq - b.seq)
    .map(({ t, type, actors, text }) => ({ t, type, actors, text }));

  return {
    events,
    result: {
      standings: { drivers, teams: teamRows },
      winner: face,
      mvp: face
        ? { ...face, reason: 'PROPOSED: most weekend points, then the better Grand Prix place' }
        : null,
      forfeit: false,
      points: {
        balance: 'BALANCE_PLACEHOLDER',
        status: 'PROPOSED',
        gp: tuning.points[sport].gp.slice(),
        sprint: sessions.includes('sprint') ? tuning.points[sport].sprint.slice() : null,
      },
      quali: qualiRows.map((row, index) => ({ id: row.id, parodyName: row.parodyName, timeMs: row.timeMs, grid: index + 1 })),
      sprint: sprintRows
        ? { grid: qualiIds.slice(), order: sprintRows, safetyCar: sprintSafety, weather: sprintWeather }
        : null,
      gp: { grid: qualiIds.slice(), order: gpRows, safetyCar: gpSafety, weather: gpWeather },
    },
    rewards: {
      G: tuning.rewards.participationG + homePoints * tuning.rewards.perPointG,
      status: 'PROPOSED',
      balance: 'BALANCE_PLACEHOLDER',
      claimId: `SPORT_${sport.toUpperCase()}_${seed}_${track.id}_${homeTeam.teamId}_${claimIds}`,
    },
    meta: {
      seed,
      sport,
      trackId: track.id,
      balance: 'BALANCE_PLACEHOLDER',
      status: 'PROPOSED',
      sessions: sessions.slice(),
      laps: { quali: 1, sprint: sessions.includes('sprint') ? lapsOf.sprint : 0, gp: lapsOf.gp },
    },
  };
}
