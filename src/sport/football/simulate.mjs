/**
 * Football auto sim (IFAB basis: 11 including a GK, two 45-minute halves).
 * Status: PROPOSED. Not a live match engine and not an official stat model.
 *
 * The player chooses the lineup, formation, and coach before kickoff.
 * Nothing in here reads the clock, the network, or Math.random. Same seed
 * and same input return the same events, score, MVP, and reward purse.
 *
 * Simplifications, all PROPOSED:
 *   - minute-by-minute chances, not a 22-player physics pitch
 *   - offside only when an advanced player is the one involved in the play
 *   - fouls do not reduce the XI (no sendings-off); a sub is one-for-one
 *   - optional extra time (tactics.extraTime); penalty shoot-outs are not run
 *   - shape is a small context multiplier, not a counter-pick table
 */
import { clamp, hashSeed, makeEvent, pickWeighted, sportError, createRng } from '../common/rng-and-events.mjs';
import { commentary } from './commentary.mjs';
import {
  ATTACK_WEIGHT,
  DEFENSE_WEIGHT,
  FORMATION_IDS,
  FORMATIONS,
  footballContext,
  isAdvancedRole,
  roleFamily,
  suitability,
} from './formations.mjs';
import { FOOTBALL_TUNING, mergeTuning } from './tuning.mjs';

const STAT_KEYS = Object.freeze(['Power', 'Def', 'Speed', 'Sta', 'Acc']);
const COACH_PASSIVES = new Set(['positional', 'highline', 'wingback', 'adaptive', 'none']);

/**
 * @param {{ seed: number | string, home: object, away: object, tactics: object, tuning?: object }} input
 */
export function simulateFootball(input) {
  if (!input || typeof input !== 'object') throw sportError('BAD_INPUT', 'simulateFootball expects an object');
  const tuning = mergeTuning(FOOTBALL_TUNING, input.tuning);
  const rng = createRng(input.seed);
  const tactics = input.tactics;
  if (!tactics || typeof tactics !== 'object') {
    throw sportError('BAD_TACTICS', 'pre-match tactics are required');
  }
  const home = buildSide(input.home, tactics.home, tuning, 'home');
  const away = buildSide(input.away, tactics.away, tuning, 'away');
  home.form = rollForm(rng, tuning);
  away.form = rollForm(rng, tuning);

  const events = [];
  const pitchLog = [];
  pitchLog.push(snapshot(0, home, away));
  events.push(makeEvent({
    t: 0,
    type: 'kickoff',
    actors: [home.parodyName, away.parodyName],
    text: commentary(rng, 'kickoff', { home: home.parodyName, away: away.parodyName }),
  }));

  playSpan(1, tuning.halfMinutes, home, away, tuning, rng, events, pitchLog);
  recover(home, tuning);
  recover(away, tuning);
  events.push(scoreEvent(45 * 60, 'half_time', home, away, rng));

  playSpan(46, tuning.halfMinutes, home, away, tuning, rng, events, pitchLog);
  let minutes = tuning.halfMinutes * 2;
  let extraTime = false;
  events.push(scoreEvent(minutes * 60, 'full_time', home, away, rng));

  if (tactics.extraTime === true && home.goals === away.goals) {
    extraTime = true;
    events.push(makeEvent({
      t: minutes * 60,
      type: 'extra_time_start',
      actors: [home.parodyName, away.parodyName],
      text: commentary(rng, 'extra_start', {}),
    }));
    playSpan(91, tuning.extraHalfMinutes, home, away, tuning, rng, events, pitchLog);
    recover(home, tuning);
    recover(away, tuning);
    events.push(scoreEvent(105 * 60, 'extra_time_half', home, away, rng));
    playSpan(106, tuning.extraHalfMinutes, home, away, tuning, rng, events, pitchLog);
    minutes = 120;
    events.push(scoreEvent(minutes * 60, 'extra_time_end', home, away, rng));
  }

  const goalEvents = events.filter((event) => event.type === 'goal').length;
  if (goalEvents !== home.goals + away.goals) {
    throw sportError('SIM_INVARIANT', 'goal events do not match the score');
  }

  const winner = home.goals === away.goals ? 'draw' : home.goals > away.goals ? 'home' : 'away';
  const mvp = pickMvp(home, away);
  return {
    events,
    result: {
      sport: 'football',
      status: 'PROPOSED',
      basis: 'IFAB',
      normalizedSeed: hashSeed(input.seed),
      score: { home: home.goals, away: away.goals },
      winner,
      mvp,
      minutes,
      extraTime,
      formations: { home: home.formationId, away: away.formationId },
      coachPassives: { home: home.coach.passive, away: away.coach.passive },
      subs: { home: home.subsUsed, away: away.subsUsed },
      box: { home: boxOf(home), away: boxOf(away) },
      pitchLog,
      rules: {
        basis: 'IFAB',
        status: 'PROPOSED',
        playersOnPitch: 11,
        halves: 2,
        minutesPerHalf: tuning.halfMinutes,
        dismissals: false,
        note: 'Sendings-off are not applied, so the pitch stays at 11. Penalty shoot-outs are not simulated.',
      },
    },
    rewards: rewardsFrom(tuning),
  };
}

function playSpan(start, length, home, away, tuning, rng, events, pitchLog) {
  for (let offset = 0; offset < length; offset += 1) {
    playMinute(start + offset, home, away, tuning, rng, events, pitchLog);
  }
}

function playMinute(minute, home, away, tuning, rng, events, pitchLog) {
  let beat = minute === 46 || minute === 106 ? 1 : 0;
  const stamp = () => (minute - 1) * 60 + beat++;

  const homeThreat = threatOf(home, away, tuning);
  const awayThreat = threatOf(away, home, tuning);
  const share = Math.sqrt(homeThreat) / (Math.sqrt(homeThreat) + Math.sqrt(awayThreat));
  const attack = rng.chance(share) ? home : away;
  const defense = attack === home ? away : home;
  const threat = attack === home ? homeThreat : awayThreat;
  const notableP = clamp(
    tuning.notableBase * (0.82 + 0.18 * (threat / tuning.threatNorm)),
    tuning.notableMin,
    tuning.notableMax,
  );

  if (!rng.chance(notableP)) {
    const actor = pickAttacker(attack, rng);
    events.push(makeEvent({
      t: stamp(),
      type: 'open_play',
      actors: [actor.parodyName],
      text: prefixed(minute, commentary(rng, 'open_play', { actor: actor.parodyName, team: attack.parodyName })),
    }));
  } else {
    resolveChance(minute, attack, defense, tuning, rng, events, stamp);
  }

  maybeInjure(home, minute, tuning, rng, events, stamp);
  maybeInjure(away, minute, tuning, rng, events, stamp);
  drain(home, tuning);
  drain(away, tuning);
  trySub(home, minute, tuning, rng, events, stamp);
  trySub(away, minute, tuning, rng, events, stamp);
  pitchLog.push(snapshot(minute, home, away));
}

function resolveChance(minute, attack, defense, tuning, rng, events, stamp) {
  const attacker = pickAttacker(attack, rng);
  const advanced = isAdvancedRole(attacker.slotRole);
  const offsideP = advanced
    ? tuning.offsideBase * attack.profile.press * (0.35 + defense.profile.transitionRisk)
    : 0;
  if (rng.chance(offsideP)) {
    attacker.offsides += 1;
    events.push(makeEvent({
      t: stamp(),
      type: 'offside',
      actors: [attacker.parodyName],
      text: prefixed(minute, commentary(rng, 'offside', { actor: attacker.parodyName })),
    }));
    return;
  }
  if (rng.chance(tuning.foulShare)) {
    const fouler = pickDefender(defense, rng);
    fouler.foulsCommitted += 1;
    attacker.foulsWon += 1;
    events.push(makeEvent({
      t: stamp(),
      type: 'foul',
      actors: [fouler.parodyName, attacker.parodyName],
      text: prefixed(minute, commentary(rng, 'foul', { actor: fouler.parodyName, victim: attacker.parodyName })),
    }));
    return;
  }

  attacker.shots += 1;
  const defenseRating = unitRating(defense, DEFENSE_WEIGHT, defenseSkill, tuning);
  const gk = keeper(defense);
  const gkScore = gkRating(defense, tuning);
  const { pGoal, pSave } = finishOdds(attacker, attack, defenseRating, gkScore, tuning);
  const roll = rng.next();
  if (roll < pGoal) {
    attacker.goals += 1;
    attacker.onTarget += 1;
    attack.goals += 1;
    const assist = pickAssist(attack, attacker, rng);
    if (assist) assist.assists += 1;
    const actors = assist
      ? [attacker.parodyName, assist.parodyName]
      : [attacker.parodyName];
    const text = assist
      ? commentary(rng, 'goal_assist', { actor: attacker.parodyName, assist: assist.parodyName, team: attack.parodyName })
      : commentary(rng, 'goal', { actor: attacker.parodyName, team: attack.parodyName });
    events.push(makeEvent({
      t: stamp(),
      type: 'goal',
      actors,
      text: prefixed(minute, text),
    }));
    return;
  }
  if (roll < pGoal + pSave) {
    attacker.onTarget += 1;
    gk.saves += 1;
    if (rng.chance(0.55)) pickDefender(defense, rng).tackles += 1;
    events.push(makeEvent({
      t: stamp(),
      type: 'save',
      actors: [gk.parodyName, attacker.parodyName],
      text: prefixed(minute, commentary(rng, 'save', { gk: gk.parodyName, actor: attacker.parodyName })),
    }));
    return;
  }
  if (rng.chance(0.4)) pickDefender(defense, rng).tackles += 1;
  events.push(makeEvent({
    t: stamp(),
    type: 'shot_miss',
    actors: [attacker.parodyName],
    text: prefixed(minute, commentary(rng, 'shot_miss', { actor: attacker.parodyName })),
  }));
}

function finishOdds(shooter, attack, defenseRating, gkScore, tuning) {
  const quality = attackSkill(shooter, attack.profile) * fatigueMul(shooter, tuning) * shooter.suitability;
  const skillEdge = (quality - defenseRating) / 100;
  const gkEdge = (gkScore - 50) / 100;
  let pGoal = tuning.goalBase + skillEdge * tuning.goalSlope - gkEdge * tuning.gkSlope;
  pGoal *= attack.form;
  pGoal = clamp(pGoal, tuning.goalMin, tuning.goalMax);
  let pSave = tuning.saveBase + gkEdge * tuning.saveSlope + ((defenseRating - 50) / 100) * 0.08;
  pSave = clamp(pSave, 0.08, 0.5);
  const sum = pGoal + pSave;
  if (sum > 0.92) {
    const scale = 0.92 / sum;
    pGoal *= scale;
    pSave *= scale;
  }
  return { pGoal, pSave };
}

function maybeInjure(team, minute, tuning, rng, events, stamp) {
  if (!rng.chance(tuning.injuryChance)) return;
  const victim = pickWeighted(rng, onPitch(team), (player) => 1.2 - player.stats.Sta / 110);
  victim.injured = true;
  victim.pool *= 0.5;
  events.push(makeEvent({
    t: stamp(),
    type: 'injury',
    actors: [victim.parodyName],
    text: prefixed(minute, commentary(rng, 'injury', { actor: victim.parodyName })),
  }));
}

function trySub(team, minute, tuning, rng, events, stamp) {
  if (team.subsUsed >= tuning.maxSubs) return;
  const bench = team.squad.filter((player) => player.available && !player.onPitch);
  if (bench.length === 0) return;
  const gk = keeper(team);
  const gkFrac = gk.pool / gk.poolMax;
  if ((gk.injured || gkFrac < tuning.gkSubStamina) && (minute >= tuning.subMinute || gk.injured)) {
    const replacement = bench
      .filter((player) => player.role === 'GK')
      .sort((a, b) => b.pool - a.pool || a.id.localeCompare(b.id))[0];
    if (replacement) {
      commitSub(team, gk, replacement, minute, rng, events, stamp);
      return;
    }
  }
  const tired = onPitch(team)
    .filter((player) => player.slotRole !== 'GK')
    .map((player) => ({ player, frac: player.pool / player.poolMax }))
    .sort((a, b) => a.frac - b.frac || a.player.id.localeCompare(b.player.id));
  const worst = tired[0];
  if (!worst) return;
  const urgent = worst.frac < tuning.urgentStamina || worst.player.injured;
  const windowOpen = minute >= tuning.subMinute && worst.frac <= tuning.subStamina;
  if (!urgent && !windowOpen) return;
  const ranked = bench
    .map((player) => ({
      player,
      fit: suitability(player.role, worst.player.slotRole) * (0.55 + 0.45 * (player.pool / player.poolMax)),
    }))
    .sort((a, b) => b.fit - a.fit || a.player.id.localeCompare(b.player.id));
  const incoming = ranked[0];
  if (!incoming) return;
  if (suitability(incoming.player.role, worst.player.slotRole) < 0.58 && !worst.player.injured) return;
  commitSub(team, worst.player, incoming.player, minute, rng, events, stamp);
}

function commitSub(team, outgoing, incoming, minute, rng, events, stamp) {
  incoming.onPitch = true;
  incoming.slotRole = outgoing.slotRole;
  incoming.suitability = suitability(incoming.role, outgoing.slotRole);
  outgoing.onPitch = false;
  outgoing.available = false;
  outgoing.slotRole = null;
  outgoing.injured = false;
  team.subsUsed += 1;
  events.push(makeEvent({
    t: stamp(),
    type: 'substitution',
    actors: [outgoing.parodyName, incoming.parodyName],
    text: prefixed(minute, commentary(rng, 'substitution', { out: outgoing.parodyName, inn: incoming.parodyName })),
  }));
}

function drain(team, tuning) {
  for (const player of onPitch(team)) {
    const family = roleFamily(player.slotRole);
    let load = tuning.roleDrain[family] ?? 1;
    if (family === 'WB' || family === 'FB') {
      const extra = family === 'WB' ? team.profile.wingbackLoad : team.profile.wingbackLoad * 0.45;
      load *= 0.85 + extra;
    }
    load *= 0.86 + team.profile.press * 0.3;
    load *= 1.12 - player.stats.Sta / 220;
    player.pool = Math.max(0, player.pool - tuning.drainPerMinute * load);
    player.minutes += 1;
  }
}

function recover(team, tuning) {
  for (const player of onPitch(team)) {
    const missing = player.poolMax - player.pool;
    player.pool = Math.min(player.poolMax, player.pool + missing * tuning.halftimeRecover);
  }
}

function threatOf(attack, defense, tuning) {
  const context = footballContext({
    attack: attack.profile,
    defense: defense.profile,
    wingbackFatigue: wingFatigue(defense),
    tuning,
  });
  const attackRating = unitRating(attack, ATTACK_WEIGHT, (player) => attackSkill(player, attack.profile), tuning);
  const defenseRating = unitRating(defense, DEFENSE_WEIGHT, defenseSkill, tuning);
  const gkScore = gkRating(defense, tuning);
  const volume = attackRating * (50 / Math.max(30, defenseRating));
  const keeperDrag = 1 + (50 - gkScore) / 260;
  return Math.max(1, volume * context * keeperDrag * attack.form);
}

function unitRating(team, weights, skillOf, tuning) {
  let sum = 0;
  let weightSum = 0;
  for (const player of onPitch(team)) {
    const weight = weights[roleFamily(player.slotRole)] ?? 0;
    if (weight <= 0) continue;
    sum += skillOf(player) * weight * fatigueMul(player, tuning) * player.suitability;
    weightSum += weight;
  }
  return weightSum > 0 ? sum / weightSum : 40;
}

function attackSkill(player, profile) {
  const skill = player.stats.Power * 0.5 + player.stats.Acc * 0.3 + player.stats.Speed * 0.2;
  const family = roleFamily(player.slotRole);
  if (profile.accBoost && (family === 'CM' || family === 'AM' || family === 'DM')) {
    return skill * (1 + profile.accBoost);
  }
  return skill;
}

function defenseSkill(player) {
  return player.stats.Def * 0.62 + player.stats.Speed * 0.23 + player.stats.Acc * 0.15;
}

function gkRating(team, tuning) {
  const gk = keeper(team);
  const skill = gk.stats.Def * 0.7 + gk.stats.Acc * 0.15 + gk.stats.Speed * 0.15;
  return skill * fatigueMul(gk, tuning);
}

function fatigueMul(player, tuning) {
  const fraction = player.poolMax > 0 ? player.pool / player.poolMax : 0;
  return tuning.fatigueFloor + (1 - tuning.fatigueFloor) * clamp(fraction, 0, 1);
}

function wingFatigue(team) {
  const wides = onPitch(team).filter((player) => {
    const family = roleFamily(player.slotRole);
    return family === 'WB' || family === 'FB';
  });
  if (wides.length === 0) return 0;
  const fraction = wides.reduce((sum, player) => sum + player.pool / player.poolMax, 0) / wides.length;
  return clamp(1 - fraction, 0, 1);
}

function onPitch(team) {
  return team.squad.filter((player) => player.onPitch);
}

function keeper(team) {
  const gk = onPitch(team).find((player) => player.slotRole === 'GK');
  if (!gk) throw sportError('SIM_INVARIANT', `${team.label} has no goalkeeper on the pitch`);
  return gk;
}

function pickAttacker(team, rng) {
  return pickWeighted(
    rng,
    onPitch(team).filter((player) => player.slotRole !== 'GK'),
    (player) => {
      const weight = ATTACK_WEIGHT[roleFamily(player.slotRole)] ?? 0.2;
      return weight * (0.45 + attackSkill(player, team.profile) / 100) * player.suitability;
    },
  );
}

function pickDefender(team, rng) {
  return pickWeighted(
    rng,
    onPitch(team).filter((player) => player.slotRole !== 'GK'),
    (player) => {
      const weight = DEFENSE_WEIGHT[roleFamily(player.slotRole)] ?? 0.2;
      return weight * (0.45 + player.stats.Def / 100);
    },
  );
}

function pickAssist(team, shooter, rng) {
  if (!rng.chance(0.58)) return null;
  const mates = onPitch(team).filter((player) => player.id !== shooter.id && player.slotRole !== 'GK');
  if (mates.length === 0) return null;
  return pickWeighted(rng, mates, (player) => {
    const weight = ATTACK_WEIGHT[roleFamily(player.slotRole)] ?? 0.3;
    return weight * (0.4 + player.stats.Acc / 100);
  });
}

function rollForm(rng, tuning) {
  return tuning.formMin + rng.next() * (tuning.formMax - tuning.formMin);
}

function snapshot(minute, home, away) {
  const homeIds = onPitch(home).map((player) => player.id);
  const awayIds = onPitch(away).map((player) => player.id);
  const homeGk = onPitch(home).find((player) => player.slotRole === 'GK' && player.role === 'GK');
  const awayGk = onPitch(away).find((player) => player.slotRole === 'GK' && player.role === 'GK');
  if (homeIds.length !== 11 || awayIds.length !== 11 || new Set(homeIds).size !== 11 || new Set(awayIds).size !== 11) {
    throw sportError('SIM_INVARIANT', `pitch is not 11v11 at minute ${minute}`);
  }
  if (!homeGk || !awayGk) throw sportError('SIM_INVARIANT', `a goalkeeper left the pitch at minute ${minute}`);
  return { minute, home: homeIds, away: awayIds, homeGk: homeGk.id, awayGk: awayGk.id };
}

function scoreEvent(t, type, home, away, rng) {
  const key = type === 'half_time' ? 'half_time' : type === 'full_time' ? 'full_time' : type === 'extra_time_half' ? 'extra_half' : 'extra_end';
  return makeEvent({
    t,
    type,
    actors: [home.parodyName, away.parodyName],
    text: commentary(rng, key, {
      home: home.parodyName,
      away: away.parodyName,
      homeGoals: home.goals,
      awayGoals: away.goals,
    }),
  });
}

function prefixed(minute, body) {
  return `${minute}' ${body}`;
}

function pickMvp(home, away) {
  const field = [...home.squad, ...away.squad].filter((player) => player.minutes > 0);
  field.sort((a, b) => {
    const rating = ratePlayer(b) - ratePlayer(a);
    if (rating !== 0) return rating;
    if (b.goals !== a.goals) return b.goals - a.goals;
    if (b.saves !== a.saves) return b.saves - a.saves;
    return a.id.localeCompare(b.id);
  });
  const mvp = field[0];
  const side = home.squad.includes(mvp) ? 'home' : 'away';
  return {
    side,
    id: mvp.id,
    parodyName: mvp.parodyName,
    rating: round3(ratePlayer(mvp)),
    balance: 'BALANCE_PLACEHOLDER',
    status: 'PROPOSED',
  };
}

function ratePlayer(player) {
  return (
    6 +
    player.goals * 1.55 +
    player.assists * 1.05 +
    player.saves * 0.12 +
    player.onTarget * 0.14 +
    player.tackles * 0.05 +
    player.minutes * 0.002 -
    player.offsides * 0.08
  );
}

function boxOf(team) {
  return team.squad.map((player) => ({
    id: player.id,
    parodyName: player.parodyName,
    role: player.role,
    minutes: player.minutes,
    goals: player.goals,
    assists: player.assists,
    shots: player.shots,
    onTarget: player.onTarget,
    saves: player.saves,
    foulsCommitted: player.foulsCommitted,
    foulsWon: player.foulsWon,
    tackles: player.tackles,
    offsides: player.offsides,
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
  const formationId = tacticsSide?.formation;
  if (!FORMATION_IDS.includes(formationId)) {
    throw sportError('BAD_FORMATION', `${label} formation must be one of ${FORMATION_IDS.join(', ')}`);
  }
  if (!Array.isArray(side.players) || side.players.length === 0) {
    throw sportError('BAD_ROSTER', `${label} players are required`);
  }
  if (side.bench != null && !Array.isArray(side.bench)) {
    throw sportError('BAD_ROSTER', `${label} bench must be an array`);
  }
  const formation = FORMATIONS[formationId];
  const seen = new Set();
  const squad = [...side.players, ...(side.bench ?? [])].map((raw) => {
    const id = readLabel(raw?.id, `${label} player id`);
    if (seen.has(id)) throw sportError('BAD_ROSTER', `${label} duplicate player id ${id}`);
    seen.add(id);
    if (typeof raw.role !== 'string' || !roleFamily(raw.role)) {
      throw sportError('BAD_ROSTER', `${label} player ${id} has an unknown role`);
    }
    const stats = readStats(raw);
    const pool = tuning.staminaPoolBase + stats.Sta * tuning.staminaPoolPerSta;
    return {
      id,
      parodyName: readLabel(raw.parodyName, id),
      role: raw.role,
      stats,
      balance: raw.balance ?? null,
      onPitch: false,
      available: true,
      slotRole: null,
      suitability: 1,
      pool,
      poolMax: pool,
      injured: false,
      minutes: 0,
      goals: 0,
      assists: 0,
      shots: 0,
      onTarget: 0,
      saves: 0,
      foulsCommitted: 0,
      foulsWon: 0,
      tackles: 0,
      offsides: 0,
    };
  });
  const ordered = tacticsSide.lineup
    ? lineupFromIds(squad, tacticsSide.lineup, label)
    : greedyLineup(squad, formation.slots, label);
  formation.slots.forEach((slot, index) => {
    const player = ordered[index];
    if (slot.role === 'GK' && player.role !== 'GK') {
      throw sportError('FOOTBALL_GK', `${label} goalkeeper slot requires a GK`);
    }
    player.onPitch = true;
    player.slotRole = slot.role;
    player.suitability = suitability(player.role, slot.role);
  });
  const starters = squad.filter((player) => player.onPitch);
  const gks = starters.filter((player) => player.role === 'GK' && player.slotRole === 'GK');
  if (starters.length !== 11 || gks.length !== 1) {
    throw sportError('FOOTBALL_LINEUP', `${label} must start 11 players including one GK`);
  }
  const coach = normalizeCoach(side.coach, label);
  return {
    id: readLabel(side.id, `${label} id`),
    label,
    parodyName: readLabel(side.parodyName, `${label} parodyName`),
    coach,
    formationId,
    profile: shapedProfile(formationId, coach.passive, tuning.coach),
    squad,
    subsUsed: 0,
    form: 1,
    goals: 0,
  };
}

function lineupFromIds(squad, lineupIds, label) {
  if (!Array.isArray(lineupIds) || lineupIds.length !== 11) {
    throw sportError('FOOTBALL_LINEUP', `${label} lineup must list 11 player ids`);
  }
  if (new Set(lineupIds).size !== 11) throw sportError('FOOTBALL_LINEUP', `${label} lineup repeats a player`);
  const byId = new Map(squad.map((player) => [player.id, player]));
  return lineupIds.map((playerId) => {
    const player = byId.get(playerId);
    if (!player) throw sportError('FOOTBALL_LINEUP', `${label} lineup id ${playerId} is not on the squad`);
    return player;
  });
}

function greedyLineup(squad, slots, label) {
  const remaining = squad.slice();
  const chosen = [];
  for (const slot of slots) {
    const ranked = remaining.slice().sort((a, b) => {
      const fit = suitability(b.role, slot.role) - suitability(a.role, slot.role);
      if (fit !== 0) return fit;
      return a.id.localeCompare(b.id);
    });
    const pick = slot.role === 'GK' ? ranked.find((player) => player.role === 'GK') : ranked[0];
    if (!pick) throw sportError(slot.role === 'GK' ? 'FOOTBALL_GK' : 'FOOTBALL_LINEUP', `${label} could not fill ${slot.role}`);
    chosen.push(pick);
    remaining.splice(remaining.indexOf(pick), 1);
  }
  return chosen;
}

function shapedProfile(formationId, passive, coachTuning) {
  const profile = { ...FORMATIONS[formationId].profile, dampContext: 0, accBoost: 0 };
  if (passive === 'positional') {
    profile.compactness = clamp(profile.compactness + coachTuning.positionalCompact, 0, 1);
    profile.accBoost = coachTuning.positionalAcc;
  } else if (passive === 'highline') {
    profile.press = clamp(profile.press + coachTuning.highlinePress, 0, 1);
    profile.transitionRisk = clamp(profile.transitionRisk + coachTuning.highlineTransition, 0, 1);
  } else if (passive === 'wingback') {
    if (formationId.startsWith('3-')) {
      profile.width = clamp(profile.width + coachTuning.wingbackWidth, 0, 1);
      profile.wingbackLoad = clamp(profile.wingbackLoad - coachTuning.wingbackRelief, 0, 1);
    } else {
      profile.compactness = clamp(profile.compactness + coachTuning.wingbackOtherCompact, 0, 1);
    }
  } else if (passive === 'adaptive') {
    profile.dampContext = coachTuning.adaptiveDamp;
  }
  return profile;
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
  if (!stats || typeof stats !== 'object') {
    throw sportError('DATA_MISSING', `${player?.id ?? '?'} is missing a stats object`);
  }
  const out = {};
  for (const key of STAT_KEYS) {
    const value = stats[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw sportError('DATA_MISSING', `${player.id ?? '?'} is missing finite stat ${key}`);
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

function round3(value) {
  return Math.round(value * 1000) / 1000;
}
