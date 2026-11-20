/**
 * Basketball auto sim (FIBA basis: 5 on court, 4×10 minute quarters,
 * 5-minute overtime, 24-second shot clock, 8-second backcourt, foul-out at 5).
 * Status: PROPOSED. Not an official box score.
 *
 * The player chooses the five, the bench, the defensive scheme, the pace,
 * and the coach before the tip. The sim is pure: one seed, one result.
 *
 * Simplifications, all PROPOSED:
 *   - possessions, not a full 24-second spatial model
 *   - no and-one; a shooting foul is free throws only
 *   - a non-shooting foul before the team bonus ends the trip and the same
 *     side starts a fresh shot clock
 *   - offensive rebounds reset the shot clock to tuning.shotClockReset
 *     (default 24 — this file does not assert a 14-second reset)
 *   - foul-out always leaves 5 on court: a legal bench player checks in,
 *     otherwise the fouled-out player is held so the side never drops to 4
 *   - overtime repeats until the score splits; a capped safety free throw
 *     exists only so a broken tuning cannot loop forever
 */
import { clamp, createRng, hashSeed, makeEvent, pickWeighted, sportError } from '../common/rng-and-events.mjs';
import { commentary } from './commentary.mjs';
import {
  PACE_IDS,
  POSITIONS,
  REBOUND_WEIGHT,
  SCHEME_IDS,
  SCHEMES,
  SHOT_WEIGHT,
  basketContest,
} from './schemes.mjs';
import { BASKET_TUNING, mergeTuning } from './tuning.mjs';

const STAT_KEYS = Object.freeze(['Shooting', 'Def', 'Spd', 'Sta']);
const COACH_PASSIVES = new Set(['movement', 'discipline', 'clutch', 'none']);

/**
 * @param {{ seed: number | string, home: object, away: object, tactics: object, tuning?: object }} input
 */
export function simulateBasket(input) {
  if (!input || typeof input !== 'object') throw sportError('BAD_INPUT', 'simulateBasket expects an object');
  const tuning = mergeTuning(BASKET_TUNING, input.tuning);
  const rng = createRng(input.seed);
  const tactics = input.tactics;
  if (!tactics || typeof tactics !== 'object') throw sportError('BAD_TACTICS', 'pre-match tactics are required');

  const home = buildSide(input.home, tactics.home, tuning, 'home');
  const away = buildSide(input.away, tactics.away, tuning, 'away');
  home.night = (rng.next() - 0.5) * 2 * tuning.nightAmp;
  away.night = (rng.next() - 0.5) * 2 * tuning.nightAmp;

  const events = [];
  const lineupSamples = [];
  let t = 0;
  let trips = 0;
  let safetyUsed = false;
  const pushSample = (when = t) => lineupSamples.push(sample(when, home, away));
  pushSample();

  const q1Start = tipWinner(home, away, rng);
  events.push(makeEvent({
    t: 0,
    type: 'tip',
    actors: [center(q1Start).parodyName, q1Start.parodyName],
    text: commentary(rng, 'tip', { actor: center(q1Start).parodyName, team: q1Start.parodyName }),
  }));

  const q1Other = q1Start === home ? away : home;
  const openings = [q1Start, q1Other, q1Start, q1Other];
  for (let quarter = 0; quarter < tuning.quarters; quarter += 1) {
    const label = `Q${quarter + 1}`;
    t = playPeriod({
      label,
      seconds: tuning.quarterSeconds,
      offense: openings[quarter],
      home,
      away,
      t,
      tuning,
      rng,
      events,
      onSample: pushSample,
      countTrip: () => {
        trips += 1;
      },
    });
  }

  let overtimePeriods = 0;
  while (home.points === away.points) {
    if (overtimePeriods >= tuning.maxOvertimePeriods) {
      safetyUsed = true;
      const winnerSide = tipWinner(home, away, rng);
      const shooter = onCourt(winnerSide).slice().sort((a, b) => a.id.localeCompare(b.id))[0];
      winnerSide.points += 1;
      shooter.points += 1;
      events.push(makeEvent({
        t,
        type: 'ot_safety',
        actors: [shooter.parodyName],
        text: commentary(rng, 'safety', { actor: shooter.parodyName }),
      }));
      break;
    }
    overtimePeriods += 1;
    const offense = tipWinner(home, away, rng);
    events.push(makeEvent({
      t,
      type: 'overtime',
      actors: [home.parodyName, away.parodyName],
      text: commentary(rng, 'overtime', { n: overtimePeriods }),
    }));
    events.push(makeEvent({
      t,
      type: 'tip',
      actors: [center(offense).parodyName, offense.parodyName],
      text: commentary(rng, 'tip', { actor: center(offense).parodyName, team: offense.parodyName }),
    }));
    t = playPeriod({
      label: `OT${overtimePeriods}`,
      seconds: tuning.overtimeSeconds,
      offense,
      home,
      away,
      t,
      tuning,
      rng,
      events,
      onSample: pushSample,
      countTrip: () => {
        trips += 1;
      },
    });
  }

  const winner = home.points === away.points ? 'draw' : home.points > away.points ? 'home' : 'away';
  if (!safetyUsed && winner === 'draw') {
    throw sportError('SIM_INVARIANT', 'basketball ended level without using the overtime safety');
  }
  events.push(makeEvent({
    t,
    type: 'final',
    actors: [home.parodyName, away.parodyName],
    text: commentary(rng, 'final', { home: home.parodyName, away: away.parodyName, homeScore: home.points, awayScore: away.points }),
  }));
  pushSample();

  const regulationSeconds = tuning.quarterSeconds * tuning.quarters;
  const elapsed = regulationSeconds + overtimePeriods * tuning.overtimeSeconds;
  if (!safetyUsed && t !== elapsed) {
    throw sportError('SIM_INVARIANT', `game clock ended at ${t}, expected ${elapsed}`);
  }

  return {
    events,
    result: {
      sport: 'basketball',
      status: 'PROPOSED',
      basis: 'FIBA',
      normalizedSeed: hashSeed(input.seed),
      score: { home: home.points, away: away.points },
      winner,
      mvp: pickMvp(home, away),
      overtimePeriods,
      safetyUsed,
      possessions: trips,
      schemes: { home: home.scheme.id, away: away.scheme.id },
      paces: { home: home.paceId, away: away.paceId },
      coachPassives: { home: home.coach.passive, away: away.coach.passive },
      subs: { home: home.subsUsed, away: away.subsUsed },
      foulOuts: { home: home.foulOuts, away: away.foulOuts },
      box: { home: boxOf(home), away: boxOf(away) },
      lineupSamples,
      closingLineup: { home: onCourt(home).map((player) => player.id), away: onCourt(away).map((player) => player.id) },
      clock: {
        regulationSeconds,
        overtimeSeconds: overtimePeriods * tuning.overtimeSeconds,
        elapsed: t,
      },
      rules: {
        basis: 'FIBA',
        status: 'PROPOSED',
        onCourt: 5,
        quarterSeconds: tuning.quarterSeconds,
        quarters: tuning.quarters,
        overtimeSeconds: tuning.overtimeSeconds,
        shotClockSeconds: tuning.shotClock,
        backcourtSeconds: tuning.backcourtSeconds,
        foulOut: tuning.foulOut,
        note: 'Foul-out substitutes a legal bench player. With nobody legal left, the player is held so the court never becomes 4 or 6. And-one baskets are not simulated.',
      },
    },
    rewards: rewardsFrom(tuning),
  };
}

function playPeriod({ label, seconds, offense, home, away, t, tuning, rng, events, onSample, countTrip }) {
  let clock = seconds;
  home.teamFouls = 0;
  away.teamFouls = 0;
  let guard = 0;
  events.push(makeEvent({
    t,
    type: 'period_start',
    actors: [home.parodyName, away.parodyName],
    text: commentary(rng, 'period_start', {
      period: label,
      home: home.parodyName,
      away: away.parodyName,
      homeScore: home.points,
      awayScore: away.points,
    }),
  }));

  while (clock > 0) {
    guard += 1;
    if (guard > 500) throw sportError('SIM_INVARIANT', `${label} possession loop did not finish`);
    const defense = offense === home ? away : home;
    const late = (label === 'Q4' || label.startsWith('OT')) && clock <= tuning.clutchSeconds;
    home.clutch = late;
    away.clutch = late;
    const played = resolvePossession({
      label,
      clock,
      offense,
      defense,
      home,
      away,
      eventT: t + (seconds - clock),
      tuning,
      rng,
      events,
      onSample,
    });
    clock -= played.seconds;
    const now = t + (seconds - clock);
    tiredSub(home, now, true, tuning, rng, events, onSample);
    tiredSub(away, now, true, tuning, rng, events, onSample);
    countTrip();
    if (!played.keepOffense) offense = defense;
  }
  if (clock !== 0) throw sportError('SIM_INVARIANT', `${label} clock ended at ${clock}`);

  const endT = t + seconds;
  recover(home, tuning);
  recover(away, tuning);
  tiredSub(home, endT, false, tuning, rng, events, onSample, home, away);
  tiredSub(away, endT, false, tuning, rng, events, onSample, home, away);
  events.push(makeEvent({
    t: endT,
    type: 'period_end',
    actors: [home.parodyName, away.parodyName],
    text: commentary(rng, 'period_end', {
      period: label,
      home: home.parodyName,
      away: away.parodyName,
      homeScore: home.points,
      awayScore: away.points,
    }),
  }));
  onSample(endT);
  return endT;
}

function resolvePossession({ label, clock, offense, defense, home, away, eventT, tuning, rng, events, onSample }) {
  const continuing = offense.continueTrip === true;
  offense.continueTrip = false;
  if (!continuing) offense.reboundChain = 0;
  const pace = offense.pace;
  const clockCap = continuing ? tuning.shotClockReset : tuning.shotClock;
  let kind = 'play';
  let seconds;
  if (!continuing && rng.chance(pace.backcourt)) {
    kind = 'backcourt';
    seconds = Math.min(tuning.backcourtSeconds, clock);
  } else if (!continuing && rng.chance(pace.violation)) {
    kind = 'shot_clock';
    seconds = Math.min(tuning.shotClock, clock);
  } else {
    const spread = rng.next() + rng.next() - 1;
    seconds = Math.round(pace.mean + spread * pace.spread);
    seconds = clamp(seconds, Math.min(pace.min, clockCap), clockCap);
    seconds = Math.min(clock, Math.max(1, seconds));
  }
  drain(home, seconds, tuning);
  drain(away, seconds, tuning);
  const at = eventT + seconds;
  const clockLabel = formatClock(label, clock - seconds);
  const handler = pickHandler(offense, rng);

  if (kind === 'backcourt') {
    handler.turnovers += 1;
    events.push(makeEvent({
      t: at,
      type: 'backcourt',
      actors: [handler.parodyName],
      text: commentary(rng, 'backcourt', { clock: clockLabel, actor: handler.parodyName }),
    }));
    return { seconds, keepOffense: false };
  }
  if (kind === 'shot_clock') {
    handler.turnovers += 1;
    events.push(makeEvent({
      t: at,
      type: 'shot_clock',
      actors: [handler.parodyName],
      text: commentary(rng, 'shot_clock', { clock: clockLabel, actor: handler.parodyName }),
    }));
    return { seconds, keepOffense: false };
  }

  const offenseHandle = rating(offense, (player) => player.stats.Shooting * 0.65 + player.stats.Spd * 0.35, tuning);
  const defenseHandle = rating(defense, (player) => player.stats.Def, tuning);
  const tovP = clamp(tuning.tovBase + ((defenseHandle - offenseHandle) / 100) * tuning.tovEdge, 0.05, 0.24);
  if (rng.chance(tovP)) {
    const loser = pickHandler(offense, rng);
    loser.turnovers += 1;
    if (rng.chance(tuning.stealShare)) {
      const thief = pickDefender(defense, null, rng);
      thief.steals += 1;
      events.push(makeEvent({
        t: at,
        type: 'steal',
        actors: [thief.parodyName, loser.parodyName],
        text: commentary(rng, 'steal', { clock: clockLabel, actor: thief.parodyName, victim: loser.parodyName }),
      }));
    } else {
      events.push(makeEvent({
        t: at,
        type: 'turnover',
        actors: [loser.parodyName],
        text: commentary(rng, 'turnover', { clock: clockLabel, actor: loser.parodyName }),
      }));
    }
    return { seconds, keepOffense: false };
  }

  const foulP = clamp(tuning.foulBase * pace.foul, 0, 0.95);
  if (rng.chance(foulP)) {
    const keep = resolveFoul({
      label,
      clockLabel,
      at,
      offense,
      defense,
      home,
      away,
      tuning,
      rng,
      events,
      onSample,
    });
    return { seconds, keepOffense: keep };
  }

  const shot = resolveShot({
    clockLabel,
    at,
    offense,
    defense,
    tuning,
    rng,
    events,
  });
  return { seconds, keepOffense: shot.keepOffense };
}

function resolveFoul({ clockLabel, at, offense, defense, home, away, tuning, rng, events, onSample }) {
  const shooter = pickShooter(offense, rng, tuning);
  const kind = rng.chance(threeRate(shooter, defense, tuning)) ? 'three' : 'two';
  const fouler = pickFouler(defense, rng, tuning);
  if (!fouler) {
    events.push(makeEvent({
      t: at,
      type: 'foul',
      actors: [shooter.parodyName],
      text: commentary(rng, 'foul', { clock: clockLabel, actor: shooter.parodyName, fouls: tuning.foulOut }),
    }));
    return false;
  }
  defense.teamFouls += 1;
  fouler.fouls += 1;
  const shooting = rng.chance(tuning.shootingFoulShare);
  const bonus = defense.teamFouls >= tuning.teamFoulBonus;
  events.push(makeEvent({
    t: at,
    type: 'foul',
    actors: [fouler.parodyName, shooter.parodyName],
    text: commentary(rng, 'foul', { clock: clockLabel, actor: fouler.parodyName, fouls: fouler.fouls }),
  }));
  let freeThrows = 0;
  if (shooting) freeThrows = kind === 'three' ? 3 : 2;
  else if (bonus) freeThrows = 2;
  shootFreeThrows(shooter, offense, freeThrows, clockLabel, at, tuning, rng, events);
  if (fouler.fouls >= tuning.foulOut) {
    sendToBench(defense, fouler, at, tuning, rng, events, onSample);
  }
  return !shooting && !bonus;
}

function shootFreeThrows(shooter, offense, count, clockLabel, at, tuning, rng, events) {
  const probability = clamp(tuning.ftBase + ((shooter.stats.Shooting - 50) / 100) * tuning.ftSlope, 0.4, 0.93);
  for (let index = 0; index < count; index += 1) {
    shooter.freeThrowsAttempted += 1;
    if (rng.chance(probability)) {
      shooter.freeThrowsMade += 1;
      shooter.points += 1;
      offense.points += 1;
      events.push(makeEvent({
        t: at,
        type: 'free_throw_make',
        actors: [shooter.parodyName],
        text: commentary(rng, 'free_make', { clock: clockLabel, actor: shooter.parodyName }),
      }));
    } else {
      events.push(makeEvent({
        t: at,
        type: 'free_throw_miss',
        actors: [shooter.parodyName],
        text: commentary(rng, 'free_miss', { clock: clockLabel, actor: shooter.parodyName }),
      }));
    }
  }
}

function resolveShot({ clockLabel, at, offense, defense, tuning, rng, events }) {
  const shooter = pickShooter(offense, rng, tuning);
  const kind = rng.chance(threeRate(shooter, defense, tuning)) ? 'three' : 'two';
  const star = starPlayer(offense).id === shooter.id;
  const contest = basketContest({
    kind,
    scheme: defense.scheme,
    shooterIsStar: star,
    defSpread: defSpread(defense),
    fatigue: meanTired(defense),
    tuning,
  });
  const defender = pickDefender(defense, star ? shooter : null, rng);
  const probability = makeProbability({ shooter, kind, contest, defender, offense, tuning });
  shooter.shots += 1;
  if (rng.chance(probability)) {
    const points = kind === 'three' ? 3 : 2;
    shooter.makes += 1;
    shooter.points += points;
    offense.points += points;
    const assist = pickAssist(offense, shooter, rng, tuning);
    const actors = assist ? [shooter.parodyName, assist.parodyName] : [shooter.parodyName];
    const text = assist
      ? commentary(rng, 'assisted', { clock: clockLabel, actor: shooter.parodyName, assist: assist.parodyName })
      : commentary(rng, kind === 'three' ? 'make3' : 'make2', { clock: clockLabel, actor: shooter.parodyName });
    events.push(makeEvent({
      t: at,
      type: kind === 'three' ? 'make3' : 'make2',
      actors,
      text,
    }));
    return { keepOffense: false };
  }

  if (rng.chance(tuning.blockChance * (0.7 + defender.stats.Def / 100))) {
    defender.blocks += 1;
    events.push(makeEvent({
      t: at,
      type: 'block',
      actors: [defender.parodyName, shooter.parodyName],
      text: commentary(rng, 'block', { clock: clockLabel, actor: defender.parodyName, shooter: shooter.parodyName }),
    }));
  } else {
    events.push(makeEvent({
      t: at,
      type: 'shot_miss',
      actors: [shooter.parodyName],
      text: commentary(rng, 'miss', { clock: clockLabel, actor: shooter.parodyName }),
    }));
  }
  return rebound({ offense, defense, at, tuning, rng, events });
}

function rebound({ offense, defense, at, tuning, rng, events }) {
  offense.reboundChain += 1;
  const offP = clamp(
    tuning.offRebBase + bigShare(offense) * 0.06 - defense.scheme.reboundHelp,
    0.1,
    0.42,
  );
  const offensive = offense.reboundChain <= tuning.maxOffRebChain && rng.chance(offP);
  if (offensive) {
    const grabber = pickRebounder(offense, rng);
    grabber.rebounds += 1;
    events.push(makeEvent({
      t: at,
      type: 'rebound',
      actors: [grabber.parodyName],
      text: commentary(rng, 'rebound_off', { actor: grabber.parodyName }),
    }));
    offense.continueTrip = true;
    return { keepOffense: true };
  }
  offense.reboundChain = 0;
  const grabber = pickRebounder(defense, rng);
  grabber.rebounds += 1;
  events.push(makeEvent({
    t: at,
    type: 'rebound',
    actors: [grabber.parodyName],
    text: commentary(rng, 'rebound_def', { actor: grabber.parodyName }),
  }));
  return { keepOffense: false };
}

function sendToBench(team, outgoing, t, tuning, rng, events, onSample) {
  outgoing.fouledOut = true;
  team.foulOuts += 1;
  const bench = team.squad.filter((player) => !player.onCourt && !player.fouledOut && player.fouls < tuning.foulOut);
  if (bench.length === 0) {
    outgoing.held = true;
    outgoing.onCourt = true;
    events.push(makeEvent({
      t,
      type: 'foul_out_held',
      actors: [outgoing.parodyName],
      text: commentary(rng, 'foul_out_held', { actor: outgoing.parodyName }),
    }));
    onSample(t);
    return;
  }
  const incoming = bench
    .slice()
    .sort((a, b) => subRank(b, outgoing.slot) - subRank(a, outgoing.slot) || a.id.localeCompare(b.id))[0];
  swap(team, outgoing, incoming, t, rng, events, 'foul_out');
  onSample(t);
}

function makeProbability({ shooter, kind, contest, defender, offense, tuning }) {
  const base = kind === 'three' ? tuning.make3 : tuning.make2;
  const skill = (shooter.stats.Shooting - 50) / 100;
  const contestEdge = (contest - 0.5) * tuning.contestWeight;
  const defEdge = (defender.stats.Def - 50) / 100 * tuning.defWeight;
  let coachBonus = 0;
  if (offense.coach.passive === 'movement') coachBonus += tuning.coach.movementMake;
  if (offense.coach.passive === 'clutch' && offense.clutch) coachBonus += tuning.coach.clutchMake;
  const fit = shooter.position === shooter.slot ? 1 : 0.92;
  let probability = base + skill * tuning.skillWeight - contestEdge - defEdge + offense.pace.quality + offense.night + coachBonus;
  probability *= fatigueMul(shooter, tuning) * fit;
  const floor = kind === 'three' ? 0.16 : 0.28;
  const cap = kind === 'three' ? 0.52 : 0.72;
  return clamp(probability, floor, cap);
}

function threeRate(shooter, defense, tuning) {
  let rate = tuning.threeBase;
  if (shooter.position === 'PG' || shooter.position === 'SG') rate += tuning.threeGuard;
  if (shooter.position === 'C' || shooter.position === 'PF') rate -= tuning.threeBig;
  if (defense.scheme.key === 'zone') rate += tuning.threeZoneBump;
  rate -= (defense.scheme.perimeterContest - 0.5) * 0.08;
  return clamp(rate, 0.12, 0.55);
}

function tiredSub(team, t, respectClutch, tuning, rng, events, onSample, home, away) {
  if (respectClutch && team.clutch && team.coach.passive !== 'clutch') return;
  const bench = team.squad.filter((player) => !player.onCourt && !player.fouledOut && player.fouls < tuning.foulOut);
  if (bench.length === 0) return;
  const tired = onCourt(team)
    .map((player) => ({ player, frac: player.pool / player.poolMax }))
    .sort((a, b) => a.frac - b.frac || a.player.id.localeCompare(b.player.id))[0];
  if (!tired || tired.frac > tuning.subFrac) return;
  const incoming = bench.slice().sort((a, b) => subRank(b, tired.player.slot) - subRank(a, tired.player.slot) || a.id.localeCompare(b.id))[0];
  if (incoming.pool / incoming.poolMax < tuning.subFresh) return;
  swap(team, tired.player, incoming, t, rng, events, 'substitution');
  onSample(t);
}

function swap(team, outgoing, incoming, t, rng, events, type) {
  const slot = outgoing.slot;
  outgoing.onCourt = false;
  outgoing.slot = null;
  incoming.onCourt = true;
  incoming.slot = slot;
  team.subsUsed += 1;
  const key = type === 'foul_out' ? 'foul_out' : 'substitution';
  events.push(makeEvent({
    t,
    type,
    actors: [outgoing.parodyName, incoming.parodyName],
    text: commentary(rng, key, { out: outgoing.parodyName, inn: incoming.parodyName }),
  }));
}

function subRank(player, slot) {
  const fit = player.position === slot ? 1 : 0.82;
  const fresh = player.poolMax > 0 ? player.pool / player.poolMax : 0;
  const room = (5 - player.fouls) / 5;
  return fit * (0.45 + 0.55 * fresh) * (0.35 + 0.65 * room);
}

function drain(team, seconds, tuning) {
  const coachDrain = team.coach.passive === 'discipline' ? tuning.coach.disciplineDrain : 1;
  const schemeTax = 1 + team.scheme.staminaTax;
  for (const player of onCourt(team)) {
    const staFactor = 1.08 - player.stats.Sta / 250;
    player.pool = Math.max(0, player.pool - seconds * tuning.drainPerSecond * team.pace.drain * coachDrain * staFactor * schemeTax);
    player.seconds += seconds;
  }
}

function recover(team, tuning) {
  for (const player of team.squad) {
    if (!player.onCourt) continue;
    player.pool = Math.min(player.poolMax, player.pool + tuning.quarterRecover);
  }
}

function rating(team, skillOf, tuning) {
  const players = onCourt(team);
  const total = players.reduce((sum, player) => sum + skillOf(player) * fatigueMul(player, tuning), 0);
  return total / players.length;
}

function fatigueMul(player, tuning) {
  const fraction = player.poolMax > 0 ? player.pool / player.poolMax : 0;
  return tuning.fatigueFloor + (1 - tuning.fatigueFloor) * clamp(fraction, 0, 1);
}

function meanTired(team) {
  const players = onCourt(team);
  const fraction = players.reduce((sum, player) => sum + player.pool / player.poolMax, 0) / players.length;
  return clamp(1 - fraction, 0, 1);
}

function defSpread(team) {
  const values = onCourt(team).map((player) => player.stats.Def);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const deviation = values.reduce((sum, value) => sum + Math.abs(value - mean), 0) / values.length;
  return deviation / 100;
}

function bigShare(team) {
  const bigs = onCourt(team).filter((player) => player.slot === 'PF' || player.slot === 'C').length;
  return bigs / 5;
}

function onCourt(team) {
  return team.squad.filter((player) => player.onCourt);
}

function center(team) {
  return onCourt(team).find((player) => player.slot === 'C') ?? onCourt(team)[0];
}

function starPlayer(team) {
  return onCourt(team).slice().sort((a, b) => b.stats.Shooting - a.stats.Shooting || a.id.localeCompare(b.id))[0];
}

function pickShooter(team, rng, tuning) {
  return pickWeighted(rng, onCourt(team), (player) => {
    const fit = player.position === player.slot ? 1 : 0.84;
    return SHOT_WEIGHT[player.slot] * (0.35 + player.stats.Shooting / 80) * fit * fatigueMul(player, tuning);
  });
}

function pickHandler(team, rng) {
  return pickWeighted(rng, onCourt(team), (player) => {
    const guard = player.slot === 'PG' || player.slot === 'SG' ? 1.4 : 0.7;
    return guard * (0.4 + player.stats.Spd / 100);
  });
}

function pickDefender(team, star, rng) {
  const players = onCourt(team);
  if (star && team.scheme.key === 'man') {
    return players.slice().sort((a, b) => b.stats.Def - a.stats.Def || a.id.localeCompare(b.id))[0];
  }
  return pickWeighted(rng, players, (player) => 0.45 + player.stats.Def / 100);
}

function pickFouler(team, rng, tuning) {
  const eligible = onCourt(team).filter((player) => player.fouls < tuning.foulOut && !player.held);
  if (eligible.length === 0) return null;
  return pickWeighted(rng, eligible, (player) => 0.55 + (100 - player.stats.Def) / 80);
}

function pickRebounder(team, rng) {
  return pickWeighted(rng, onCourt(team), (player) => REBOUND_WEIGHT[player.slot] * (0.5 + player.stats.Def / 120));
}

function pickAssist(team, shooter, rng, tuning) {
  if (!rng.chance(tuning.assistRate)) return null;
  const mates = onCourt(team).filter((player) => player.id !== shooter.id);
  if (mates.length === 0) return null;
  const helper = pickWeighted(rng, mates, (player) => {
    const guard = player.slot === 'PG' ? 1.45 : 1;
    return guard * (0.4 + player.stats.Spd / 100);
  });
  helper.assists += 1;
  return helper;
}

function tipWinner(home, away, rng) {
  const homeTip = center(home).stats.Spd + center(home).stats.Def;
  const awayTip = center(away).stats.Spd + center(away).stats.Def;
  return rng.chance(homeTip / (homeTip + awayTip)) ? home : away;
}

function formatClock(label, remaining) {
  const safe = Math.max(0, remaining);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${label} ${minutes}:${String(seconds).padStart(2, '0')}`;
}

function sample(t, home, away) {
  const homeIds = onCourt(home).map((player) => player.id);
  const awayIds = onCourt(away).map((player) => player.id);
  if (homeIds.length !== 5 || awayIds.length !== 5 || new Set(homeIds).size !== 5 || new Set(awayIds).size !== 5) {
    throw sportError('SIM_INVARIANT', 'court is not five distinct players per side');
  }
  return { t, home: homeIds, away: awayIds };
}

function pickMvp(home, away) {
  const field = [...home.squad, ...away.squad].filter((player) => player.seconds > 0);
  if (field.length === 0) throw sportError('SIM_INVARIANT', 'nobody played');
  field.sort((a, b) => {
    const rating = ratePlayer(b) - ratePlayer(a);
    if (rating !== 0) return rating;
    if (b.points !== a.points) return b.points - a.points;
    return a.id.localeCompare(b.id);
  });
  const mvp = field[0];
  return {
    side: home.squad.includes(mvp) ? 'home' : 'away',
    id: mvp.id,
    parodyName: mvp.parodyName,
    rating: Math.round(ratePlayer(mvp) * 1000) / 1000,
    balance: 'BALANCE_PLACEHOLDER',
    status: 'PROPOSED',
  };
}

function ratePlayer(player) {
  return player.points + player.rebounds * 1.1 + player.assists * 1.4 + player.steals * 1.3 + player.blocks * 1.2 - player.turnovers * 0.7;
}

function boxOf(team) {
  return team.squad.map((player) => ({
    id: player.id,
    parodyName: player.parodyName,
    position: player.position,
    seconds: player.seconds,
    points: player.points,
    rebounds: player.rebounds,
    assists: player.assists,
    steals: player.steals,
    blocks: player.blocks,
    turnovers: player.turnovers,
    fouls: player.fouls,
    fouledOut: player.fouledOut,
    held: player.held,
    shots: player.shots,
    makes: player.makes,
    freeThrowsMade: player.freeThrowsMade,
    freeThrowsAttempted: player.freeThrowsAttempted,
    balance: player.balance,
  }));
}

function rewardsFrom(tuning) {
  const G = tuning.rewards?.G;
  if (typeof G !== 'number' || !Number.isFinite(G) || G < 0) {
    throw sportError('BAD_TUNING', 'tuning.rewards.G must be a non-negative finite number');
  }
  return { G, status: 'PROPOSED', balance: 'BALANCE_PLACEHOLDER' };
}

function buildSide(side, tacticsSide, tuning, label) {
  if (!side || typeof side !== 'object') throw sportError('BAD_ROSTER', `${label} team is required`);
  if (!Array.isArray(side.players) || side.players.length === 0) {
    throw sportError('BAD_ROSTER', `${label} players are required`);
  }
  if (side.bench != null && !Array.isArray(side.bench)) throw sportError('BAD_ROSTER', `${label} bench must be an array`);
  const schemeId = tacticsSide?.scheme;
  if (!SCHEME_IDS.includes(schemeId)) {
    throw sportError('BAD_SCHEME', `${label} scheme must be one of ${SCHEME_IDS.join(', ')}`);
  }
  const paceId = tacticsSide?.pace;
  if (!PACE_IDS.includes(paceId) || !tuning.pace[paceId]) {
    throw sportError('BAD_PACE', `${label} pace must be one of ${PACE_IDS.join(', ')}`);
  }
  const seen = new Set();
  const squad = [...side.players, ...(side.bench ?? [])].map((raw) => {
    const id = readLabel(raw?.id, `${label} player id`);
    if (seen.has(id)) throw sportError('BAD_ROSTER', `${label} duplicate player id ${id}`);
    seen.add(id);
    if (!POSITIONS.includes(raw.position)) {
      throw sportError('BASKET_POSITIONS', `${label} player ${id} needs a position of ${POSITIONS.join(', ')}`);
    }
    const stats = readStats(raw);
    const pool = tuning.staminaBase + stats.Sta * tuning.staminaPerSta;
    return {
      id,
      parodyName: readLabel(raw.parodyName, id),
      position: raw.position,
      stats,
      balance: raw.balance ?? null,
      onCourt: false,
      slot: null,
      pool,
      poolMax: pool,
      fouls: 0,
      fouledOut: false,
      held: false,
      seconds: 0,
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      shots: 0,
      makes: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
    };
  });
  const starters = tacticsSide.lineup
    ? lineupFromIds(squad, tacticsSide.lineup, label)
    : greedyLineup(squad, label);
  for (const player of starters) {
    player.onCourt = true;
    player.slot = player.position;
  }
  const slots = starters.map((player) => player.position).sort();
  if (slots.join(',') !== POSITIONS.slice().sort().join(',')) {
    throw sportError('BASKET_POSITIONS', `${label} starters must be one PG, SG, SF, PF, and C`);
  }
  return {
    id: readLabel(side.id, `${label} id`),
    label,
    parodyName: readLabel(side.parodyName, `${label} parodyName`),
    coach: normalizeCoach(side.coach, label),
    scheme: SCHEMES[schemeId],
    paceId,
    pace: tuning.pace[paceId],
    squad,
    points: 0,
    teamFouls: 0,
    subsUsed: 0,
    foulOuts: 0,
    reboundChain: 0,
    night: 0,
    clutch: false,
  };
}

function lineupFromIds(squad, lineupIds, label) {
  if (!Array.isArray(lineupIds) || lineupIds.length !== 5) {
    throw sportError('BASKET_LINEUP', `${label} lineup must list 5 player ids`);
  }
  if (new Set(lineupIds).size !== 5) throw sportError('BASKET_LINEUP', `${label} lineup repeats a player`);
  const byId = new Map(squad.map((player) => [player.id, player]));
  return lineupIds.map((playerId) => {
    const player = byId.get(playerId);
    if (!player) throw sportError('BASKET_LINEUP', `${label} lineup id ${playerId} is not on the squad`);
    return player;
  });
}

function greedyLineup(squad, label) {
  const remaining = squad.slice();
  const chosen = [];
  for (const position of POSITIONS) {
    const pool = remaining.filter((player) => player.position === position);
    if (pool.length === 0) throw sportError('BASKET_POSITIONS', `${label} has no ${position} to start`);
    pool.sort((a, b) => b.stats.Shooting - a.stats.Shooting || a.id.localeCompare(b.id));
    const pick = pool[0];
    chosen.push(pick);
    remaining.splice(remaining.indexOf(pick), 1);
  }
  return chosen;
}

function normalizeCoach(coach, label) {
  if (!coach) return { id: null, parodyName: null, passive: 'none' };
  const passive = coach.passive ?? 'none';
  if (!COACH_PASSIVES.has(passive)) throw sportError('BAD_COACH', `${label} coach passive is not recognized`);
  return {
    id: coach.id ?? null,
    parodyName: coach.parodyName ? readLabel(coach.parodyName, `${label} coach`) : null,
    passive,
  };
}

function readStats(player) {
  const stats = player?.stats;
  if (!stats || typeof stats !== 'object') throw sportError('DATA_MISSING', `${player?.id ?? '?'} is missing a stats object`);
  const out = {};
  for (const key of STAT_KEYS) {
    const value = stats[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw sportError('DATA_MISSING', `${player?.id ?? '?'} is missing finite stat ${key}`);
    }
    out[key] = clamp(value, 0, 100);
  }
  return out;
}

function readLabel(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw sportError('BAD_ROSTER', `${label} must be a non-empty string`);
  }
  return value;
}
