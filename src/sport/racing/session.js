import { WEATHER_LABEL } from './validate.js';

function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function byId(a, b) {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

function byTime(a, b) {
  if (a.raceMs !== b.raceMs) return a.raceMs - b.raceMs;
  return byId(a, b);
}

/**
 * @param {object} entry
 * @param {0|1|2} weather
 * @param {object} tuning
 */
function gripFor(entry, weather, tuning) {
  const tyre = tuning.tyres[entry.tyre];
  let grip = weather === 0 ? tyre.dryGrip : weather === 1 ? tyre.dampGrip : tyre.wetGrip;
  grip -= entry.wear * tuning.wearGripLoss;
  if (entry.setup === 'Wet') grip += weather === 0 ? -6 : 8;
  if (entry.stamina != null && entry.stamina < tuning.moto.staminaPaceBelow) {
    grip -= Math.floor((tuning.moto.staminaPaceBelow - entry.stamina) / 2);
  }
  return clamp(grip, 30, 150);
}

/**
 * @param {object} entry
 * @param {{ straight: number, corner: number, accel: number }} sector
 */
function paceFor(entry, sector) {
  let speed = entry.stats.TopSpeed + entry.aeroBias;
  let handling = entry.stats.Handling - entry.aeroBias;
  let accel = entry.stats.Accel + Math.floor(entry.aggression / 5);
  if (entry.setup === 'Speed') {
    speed += 8;
    handling -= 6;
  } else if (entry.setup === 'Handling') {
    speed -= 6;
    handling += 8;
  }
  speed = clamp(speed, 1, 140);
  handling = clamp(handling, 1, 140);
  accel = clamp(accel, 1, 140);
  return speed * sector.straight + handling * sector.corner + accel * sector.accel;
}

function slick(tyre) {
  return tyre === 'S' || tyre === 'M' || tyre === 'H';
}

/**
 * One qualifying lap or one race session. Mutates the supplied runtime entries.
 * @param {object} options
 */
export function runSession(options) {
  const {
    kind,
    label,
    laps,
    entries,
    gridIds,
    track,
    tuning,
    sport,
    rng,
    clock,
    weather: openingWeather,
    weatherFlip,
  } = options;
  const events = [];
  let seq = 0;
  let cursor = clock;
  const sessionBase = clock;
  const weatherName = () => WEATHER_LABEL[weather];
  let weather = openingWeather;

  function emit(type, actors, text, at) {
    const t = at == null ? cursor : at;
    events.push({ t, type, actors: actors.slice(), text, seq });
    seq += 1;
    if (t > cursor) cursor = t;
  }

  emit('session_start', entries.map((entry) => entry.id), `${label} starts at ${track.parodyName}. The sky looks ${weatherName()}.`, sessionBase);

  let flipLap = null;
  if (kind === 'race' && weatherFlip !== false && track.flipPerMil > 0) {
    if (rng.int(1000) < track.flipPerMil) flipLap = 1 + rng.int(laps);
  }

  const gridIndex = new Map((gridIds ?? []).map((id, index) => [id, index]));
  const byStableId = entries.slice().sort(byId);
  let safetyCar = false;
  let safetyUsed = false;
  let previous = (gridIds ?? entries.map((entry) => entry.id)).slice();

  for (let lap = 1; lap <= laps; lap += 1) {
    if (flipLap === lap) {
      weather = weather < 2 ? weather + 1 : 1;
      emit(
        'weather',
        previous.slice(),
        `The sky changes its mind. ${track.parodyName} is now ${weatherName()}.`,
        sessionBase + (byStableId[0]?.raceMs ?? 0),
      );
    }
    if (kind === 'race' && !safetyUsed && tuning.safetyPerMil > 0 && rng.int(1000) < tuning.safetyPerMil) {
      safetyUsed = true;
      safetyCar = true;
    }

    for (const entry of byStableId) {
      if (entry.retired || kind !== 'race') continue;
      const planned = entry.pitPlan.includes(lap);
      const emergency = entry.wetResponse === 'box' && weather > 0 && slick(entry.tyre);
      if (!planned && !emergency) continue;
      const compound = planned
        ? (entry.pitTyres[entry.pitsDone] ?? entry.tyre)
        : (sport === 'car' && weather === 1 ? 'Inter' : 'Wet');
      entry.tyre = compound;
      entry.wear = 0;
      entry.pitsDone += 1;
      entry.raceMs += tuning.pitLossMs;
      const why = planned ? 'as planned' : 'because the clouds lied';
      emit(
        'pit',
        [entry.id],
        `${entry.parodyName} boxes for ${compound} tyres ${why} in the ${label}. The crew juggles the wheels.`,
        sessionBase + entry.raceMs,
      );
    }

    for (let sectorIndex = 0; sectorIndex < track.sectors.length; sectorIndex += 1) {
      const sector = track.sectors[sectorIndex];
      for (const entry of byStableId) {
        if (entry.retired) continue;
        const pace = Math.max(1500, paceFor(entry, sector));
        const grip = gripFor(entry, weather, tuning);
        const base = Math.floor(track.baseLapMs * sector.share / 100);
        let ms = Math.floor(base * 8000 / pace);
        ms = Math.floor(ms * 100 / grip);
        const span = tuning.noiseAmp * 2 + 1;
        ms += rng.int(span) - tuning.noiseAmp;
        if (kind === 'race' && lap === 1 && sectorIndex === 0) {
          ms += (gridIndex.get(entry.id) ?? 0) * tuning.gridPenaltyMs;
        }
        if (ms < 400) ms = 400;
        entry.raceMs += ms;
      }
    }

    for (const entry of byStableId) {
      if (entry.retired || kind !== 'race') continue;
      const tyre = tuning.tyres[entry.tyre];
      entry.wear += tyre.wear;
      const chance = Math.min(1000, tuning.dnfPerMil + entry.risk * tuning.riskStepPerMil);
      if (chance <= 0 || rng.int(1000) >= chance) continue;
      if (rng.int(100) < tuning.dnfSplit) {
        entry.retired = true;
        entry.dnfLap = lap;
        emit(
          'dnf',
          [entry.id],
          `${entry.parodyName} retires on lap ${lap} in a cloud of confetti and regret.`,
          sessionBase + entry.raceMs,
        );
      } else {
        const penalty = 800 + rng.int(1200);
        entry.raceMs += penalty;
        emit(
          'incident',
          [entry.id],
          `${entry.parodyName} takes a scenic detour on lap ${lap} and rejoins the snack queue.`,
          sessionBase + entry.raceMs,
        );
      }
    }

    if (kind === 'race' && safetyCar && !entries.some((entry) => entry.safetyNoted)) {
      const aliveIds = entries.filter((entry) => !entry.retired).sort(byTime).map((entry) => entry.id);
      emit(
        'safety_car',
        aliveIds,
        'A comedy safety car waddles out. The field bunches up like a queue for snacks.',
        sessionBase + (entries.find((entry) => !entry.retired)?.raceMs ?? 0),
      );
      for (const entry of entries) entry.safetyNoted = true;
      const alive = entries.filter((entry) => !entry.retired).sort(byTime);
      if (alive.length >= 2) {
        const leader = alive[0].raceMs;
        for (let index = 1; index < alive.length; index += 1) {
          const slot = leader + index * tuning.bunchGapMs;
          if (alive[index].raceMs > slot) alive[index].raceMs = Math.floor((alive[index].raceMs + slot) / 2);
        }
      }
    }

    for (const entry of byStableId) {
      if (entry.retired) continue;
      entry.lapsCompleted += 1;
      if (entry.stamina == null || kind !== 'race') continue;
      const before = entry.stamina;
      const burn = tuning.moto.staminaPerLap + Math.floor(entry.aggression / 2) + (weather === 2 ? 1 : 0);
      entry.stamina = Math.max(0, entry.stamina - burn);
      const crossed = (before >= 50 && entry.stamina < 50) || (before >= 20 && entry.stamina < 20);
      if (crossed) {
        emit(
          'stamina',
          [entry.id],
          `${entry.parodyName} is running on fumes (stamina ${entry.stamina}).`,
          sessionBase + entry.raceMs,
        );
      }
    }

    if (kind === 'race') {
      const now = entries.filter((entry) => !entry.retired).sort(byTime);
      const nowIds = now.map((entry) => entry.id);
      for (const id of nowIds) {
        const before = previous.indexOf(id);
        const after = nowIds.indexOf(id);
        if (before >= 0 && after < before) {
          const entry = entries.find((row) => row.id === id);
          emit(
            'overtake',
            [id],
            `${entry.parodyName} squirms up to P${after + 1} on lap ${lap}.`,
            sessionBase + entry.raceMs,
          );
        }
      }
      previous = nowIds;
      emit(
        'lap',
        nowIds,
        `Lap ${lap}: ${now.map((entry) => entry.parodyName).join(', ')}.`,
        sessionBase + (now[0]?.raceMs ?? cursor),
      );
    }
  }

  if (kind === 'quali') {
    const order = entries.slice().sort(byTime);
    for (const entry of order) {
      entry.qualiMs = entry.raceMs;
      emit('quali_lap', [entry.id], `${entry.parodyName} posts a qualifying lap.`, sessionBase + entry.qualiMs);
    }
    emit(
      'grid',
      order.map((entry) => entry.id),
      `Grid: ${order.map((entry) => entry.parodyName).join(', ')}.`,
      sessionBase + (order[order.length - 1]?.qualiMs ?? cursor),
    );
  } else {
    const classified = entries.filter((entry) => !entry.retired).sort(byTime);
    const retired = entries.filter((entry) => entry.retired);
    const leader = classified[0] ?? retired[0];
    emit(
      'finish',
      (classified.length > 0 ? classified : retired).map((entry) => entry.id),
      leader && !leader.retired
        ? `Chequered flag. ${leader.parodyName} wins the ${label}.`
        : `Chequered flag. Everybody already retired from the ${label}.`,
      sessionBase + (leader?.raceMs ?? cursor),
    );
  }

  return { events, clock: cursor, weather: WEATHER_LABEL[weather], safetyCar };
}

/**
 * Fresh race clocks. Qualifying time and the other session are kept aside by the caller.
 * @param {object[]} entries
 */
export function resetRace(entries) {
  for (const entry of entries) {
    entry.tyre = entry.startTyre;
    entry.wear = 0;
    entry.retired = false;
    entry.lapsCompleted = 0;
    entry.raceMs = 0;
    entry.dnfLap = null;
    entry.pitsDone = 0;
    entry.stamina = entry.staminaStart;
    entry.safetyNoted = false;
  }
}

/**
 * @param {object} source
 * @param {'car' | 'moto'} sport
 */
export function toRuntime(source, sport) {
  return {
    id: source.id,
    parodyName: source.parodyName,
    teamId: source.teamId,
    stats: {
      TopSpeed: source.stats.TopSpeed,
      Accel: source.stats.Accel,
      Handling: source.stats.Handling,
    },
    startTyre: source.strategy.tyre,
    tyre: source.strategy.tyre,
    pitPlan: source.strategy.pitPlan.slice(),
    pitTyres: source.strategy.pitTyres.slice(),
    pitsDone: 0,
    risk: source.strategy.risk,
    wetResponse: source.strategy.wetResponse,
    aeroBias: source.strategy.aeroBias,
    setup: sport === 'moto' ? source.setup : 'Balanced',
    aggression: sport === 'moto' ? source.aggression : 0,
    staminaStart: sport === 'moto' ? source.stamina : null,
    stamina: sport === 'moto' ? source.stamina : null,
    wear: 0,
    retired: false,
    lapsCompleted: 0,
    raceMs: 0,
    qualiMs: 0,
    dnfLap: null,
    safetyNoted: false,
  };
}
