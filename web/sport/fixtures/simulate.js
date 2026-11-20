/**
 * Fixture auto-sims. Pure and deterministic per seed.
 * Contract: simulateSport({ seed, home, away|field, tactics, tuning })
 * -> { events:[{ t, type, actors, text }], result, rewards }
 * Extra clock, commentary, and board fields are display-only.
 * Strings are built from parodyName only.
 */

import { getTuning } from './tuning.js';
import { hashSeed, mulberry32 } from './rng.js';

function avg(cards, key) {
  const values = cards.map((card) => card?.stats?.[key]).filter((value) => typeof value === 'number');
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length) % list.length];
}

function nameOf(card) {
  return card?.parodyName ?? 'Someone';
}

function byId(cards, id) {
  return cards.find((card) => card.id === id) ?? null;
}

export function simulateSport(input = {}) {
  const sport = input.sport;
  const seed = input.seed ?? 1;
  const rng = mulberry32(hashSeed(`${sport}:${seed}`));
  const tuning = input.tuning ?? getTuning();
  const home = input.home ?? [];
  const away = input.away ?? input.field ?? [];
  const tactics = input.tactics ?? {};
  if (sport === 'football') return simFootball({ seed, rng, tuning, home, away, tactics, eventId: input.eventId });
  if (sport === 'basket') return simBasket({ seed, rng, tuning, home, away, tactics, eventId: input.eventId });
  if (sport === 'car' || sport === 'moto') return simRace({ sport, seed, rng, tuning, home, away, tactics, eventId: input.eventId });
  throw new Error(`Unknown sport "${sport}"`);
}

function packageResult({ sport, seed, events, result, tuning, eventId }) {
  return {
    sport,
    seed: String(seed),
    events,
    result,
    rewards: {
      G: tuning.rewards[sport],
      status: 'PROPOSED',
      eventId: eventId ?? `SPORT_${sport.toUpperCase()}_${hashSeed(seed)}`,
    },
  };
}

function simFootball({ seed, rng, tuning, home, away, tactics, eventId }) {
  const shape = tuning.football.formations[tactics.formation] ?? tuning.football.formations['4-3-3'];
  const coach = tactics.coach ?? byId(home, tactics.coachId) ?? home.find((card) => card.role === 'COACH');
  const coachName = coach?.parodyName ?? 'The coat on the bench';
  const attack = avg(home.filter((card) => card.role !== 'COACH'), 'Power')
    + avg(home, 'Acc') * 0.25
    + shape.attack
    + (coach ? tuning.football.coachBonus : 0);
  const defend = avg(away, 'Def') + (shape.defend > 0 ? 0 : 1);
  const homeChance = Math.max(0.08, Math.min(0.42, (attack - defend + 28) / 140));
  const awayChance = Math.max(0.06, Math.min(0.32, 0.22 - shape.defend * 0.02));
  let homeScore = 0;
  let awayScore = 0;
  const scorers = [];
  const minutes = [0, 8, 16, 27, 36, 45, 53, 64, 73, 82, 90];
  const outfield = home.filter((card) => card.role !== 'GK' && card.role !== 'COACH');
  const keeper = home.find((card) => card.role === 'GK');
  const awayOut = away.filter((card) => card.role !== 'GK');
  const events = minutes.map((minute, index) => {
    let type = 'play';
    let text = `${nameOf(pick(rng, outfield))} keeps the joke moving.`;
    let commentary = pick(rng, [
      'The grass is doing its best impression of a carpet.',
      'Both benches nod like they planned this.',
      'A pass arrives fashionably, then late.',
    ]);
    const actors = [];
    if (index === 0) {
      type = 'kickoff';
      text = `Kickoff at ${tactics.venue ?? 'the complex'}. ${coachName} has already pointed at three spaces.`;
      commentary = `${coachName} murmurs a positional build. PROPOSED coach note, not a prophecy.`;
      if (coach) actors.push(coach.id);
    } else if (minute === 45) {
      type = 'halftime';
      text = 'Halftime. Someone brought oranges and a speech.';
      commentary = 'Stamina takes attendance. PROPOSED fatigue, still on the pitch.';
    } else if (minute === 90) {
      type = 'fulltime';
      text = 'Full time. The whistle ends the argument.';
      commentary = homeScore === awayScore
        ? 'A draw. Both sides claim the moral punchline.'
        : 'The scoreboard keeps the last word.';
    } else if (rng() < homeChance) {
      type = 'goal';
      homeScore += 1;
      const scorer = pick(rng, outfield);
      scorers.push(scorer);
      actors.push(scorer.id);
      text = `GOAL. ${nameOf(scorer)} sends the net a strongly worded letter.`;
      commentary = pick(rng, [
        `${nameOf(scorer)} celebrates like the rent came due in their favor.`,
        `The keeper files the shot under "absolutely not again".`,
      ]);
    } else if (rng() < awayChance) {
      type = 'goal';
      awayScore += 1;
      const scorer = pick(rng, awayOut);
      actors.push(scorer.id);
      text = `GOAL the other way. ${nameOf(scorer)} of ${scorer.team} finds the punchline.`;
      commentary = 'Your Complex looks at the shape they picked and the shape they got.';
    } else if (rng() < 0.55) {
      type = 'save';
      const shot = pick(rng, outfield);
      actors.push(shot.id);
      if (keeper) actors.push(keeper.id);
      text = `${nameOf(shot)} winds up. ${nameOf(keeper)} files it under not today.`;
      commentary = 'A save with the body language of a librarian.';
    } else {
      type = 'miss';
      const shot = pick(rng, outfield);
      actors.push(shot.id);
      const tired = (shot.stats?.Sta ?? 70) < 66 && minute > 70;
      text = tired
        ? `${nameOf(shot)} fades late. The shot asks for a nap.`
        : `${nameOf(shot)} picks out the crossbar and only the crossbar.`;
      commentary = tired
        ? 'Stamina sends a polite invoice. PROPOSED, and a little wheezy.'
        : 'So close the woodwork learned their name.';
    }
    return {
      t: minute,
      clock: minute === 45 ? 'HT' : minute === 90 ? 'FT' : `${minute}'`,
      type,
      actors,
      text,
      commentary,
      board: { kind: 'score', home: homeScore, away: awayScore, homeName: 'Your Complex', awayName: away[0]?.team ?? 'Visitors' },
    };
  });
  const tally = new Map();
  for (const scorer of scorers) tally.set(scorer.id, (tally.get(scorer.id) ?? 0) + 1);
  let mvp = outfield[0];
  let best = -1;
  for (const card of outfield) {
    const score = (tally.get(card.id) ?? 0) * 10 + (card.stats?.Power ?? 0) / 100;
    if (score > best) {
      best = score;
      mvp = card;
    }
  }
  const winner = homeScore === awayScore ? 'draw' : homeScore > awayScore ? 'home' : 'away';
  return packageResult({
    sport: 'football',
    seed,
    events,
    tuning,
    eventId,
    result: {
      score: { home: homeScore, away: awayScore },
      standings: null,
      winner,
      mvp: mvp ? { id: mvp.id, parodyName: mvp.parodyName } : null,
      homeName: 'Your Complex',
      awayName: away[0]?.team ?? 'Visitors',
      formation: tactics.formation ?? '4-3-3',
      coach: coachName,
    },
  });
}

function simBasket({ seed, rng, tuning, home, away, tactics, eventId }) {
  const scheme = tuning.basket.schemes[tactics.scheme] ?? tuning.basket.schemes.man;
  const pace = tuning.basket.paces[tactics.pace] ?? tuning.basket.paces.even;
  const coach = tactics.coach ?? byId(home, tactics.coachId) ?? home.find((card) => card.role === 'COACH');
  const players = home.filter((card) => card.role !== 'COACH');
  const visitors = away.filter((card) => card.role !== 'COACH');
  const homeBase = avg(players, 'Shooting') + avg(players, 'Spd') * 0.15;
  const awayBase = avg(visitors, 'Shooting') + avg(visitors, 'Spd') * 0.15;
  let homeScore = 0;
  let awayScore = 0;
  const points = new Map();
  const quarters = [1, 2, 3, 4];
  const events = [];
  events.push({
    t: 0,
    clock: 'Q1 10:00',
    type: 'tip',
    actors: players[0] ? [players[0].id] : [],
    text: `Tip. ${scheme.label}. Pace ${pace.label}. Five stay on the court.`,
    commentary: `${coach?.parodyName ?? 'The coach'} diagrams a triangle that is mostly a joke. PROPOSED.`,
    board: { kind: 'score', home: 0, away: 0, homeName: 'Your Complex', awayName: visitors[0]?.team ?? 'Visitors' },
  });
  for (const quarter of quarters) {
    const burst = Math.round((16 + rng() * 8) * pace.factor);
    const answer = Math.round((15 + rng() * 8) * (1 + scheme.defend * 0.01));
    const homeAdd = Math.max(8, Math.round(burst * (homeBase / 80)));
    const awayAdd = Math.max(8, Math.round(answer * (awayBase / 86)));
    homeScore += homeAdd;
    awayScore += awayAdd;
    const star = pick(rng, players);
    points.set(star.id, (points.get(star.id) ?? 0) + homeAdd);
    events.push({
      t: quarter * 10,
      clock: `Q${quarter} 0:00`,
      type: 'quarter',
      actors: [star.id],
      text: `End of quarter ${quarter}. ${nameOf(star)} did the loud part of the maths.`,
      commentary: pick(rng, [
        'The shot clock clears its throat and then its conscience.',
        'A rebound auditions for a second career as a pass.',
        'Nobody fouled out. The court still holds five.',
      ]),
      board: { kind: 'score', home: homeScore, away: awayScore, homeName: 'Your Complex', awayName: visitors[0]?.team ?? 'Visitors' },
    });
  }
  let overtime = 0;
  while (homeScore === awayScore && overtime < 3) {
    overtime += 1;
    const homeAdd = 2 + Math.floor(rng() * 4);
    const awayAdd = 2 + Math.floor(rng() * 3);
    homeScore += homeAdd;
    awayScore += awayAdd;
    if (homeScore === awayScore) homeScore += 1;
    const star = pick(rng, players);
    points.set(star.id, (points.get(star.id) ?? 0) + homeAdd);
    events.push({
      t: 40 + overtime * 5,
      clock: `OT${overtime}`,
      type: 'overtime',
      actors: [star.id],
      text: `Overtime ${overtime}. ${nameOf(star)} refuses the draw.`,
      commentary: 'Five on five still. The extra minutes did not invent a sixth starter.',
      board: { kind: 'score', home: homeScore, away: awayScore, homeName: 'Your Complex', awayName: visitors[0]?.team ?? 'Visitors' },
    });
  }
  let mvp = players[0];
  let best = -1;
  for (const card of players) {
    const score = points.get(card.id) ?? 0;
    if (score > best) {
      best = score;
      mvp = card;
    }
  }
  const winner = homeScore === awayScore ? 'draw' : homeScore > awayScore ? 'home' : 'away';
  return packageResult({
    sport: 'basket',
    seed,
    events,
    tuning,
    eventId,
    result: {
      score: { home: homeScore, away: awayScore },
      standings: null,
      winner,
      mvp: mvp ? { id: mvp.id, parodyName: mvp.parodyName } : null,
      homeName: 'Your Complex',
      awayName: visitors[0]?.team ?? 'Visitors',
      scheme: scheme.label,
      pace: pace.label,
      coach: coach?.parodyName ?? 'No coach',
    },
  });
}

function simRace({ sport, seed, rng, tuning, home, away, tactics, eventId }) {
  const rules = tuning[sport];
  const tyre = rules.tyres[tactics.tyre] ?? rules.tyres.medium;
  const setup = rules.setups[tactics.setup] ?? rules.setups.balanced;
  const field = [...home, ...away].filter((card) => card.role === 'ENTRY' || card.stats?.TopSpeed != null);
  const rows = field.map((card) => ({ card, dnf: false, time: 0, note: 'running' }));
  const events = [];
  events.push({
    t: 0,
    clock: 'Grid',
    type: 'grid',
    actors: field.map((card) => card.id),
    text: `Grid at ${tactics.venue ?? 'the circuit'}. Tyre ${tyre.label}. Setup ${setup.label}.`,
    commentary: 'Two entries a side. Neither is allowed to be a spare excuse.',
    board: standingsBoard(rows),
  });
  const laps = rules.laps;
  for (let lap = 1; lap <= laps; lap += 1) {
    for (const row of rows) {
      if (row.dnf) continue;
      const stats = row.card.stats ?? {};
      const handle = (stats.Handling ?? 60) + (setup.handle ?? 0) + (tyre.handle ?? 0);
      const top = (stats.TopSpeed ?? 70) + (setup.top ?? 0) + (tyre.speed ?? 0);
      row.time += Math.max(48, 120 - top * 0.45 - handle * 0.2 + rng() * 4);
      const risk = rng();
      if (risk < 0.06 && rows.filter((item) => item.dnf).length < field.length - 1) {
        row.dnf = true;
        row.note = 'DNF';
        row.time += 1000;
      } else {
        row.note = 'running';
      }
    }
    const leader = [...rows].sort(byRace)[0];
    events.push({
      t: lap,
      clock: `Lap ${lap}`,
      type: rows.some((row) => row.dnf && row.note === 'DNF') ? 'lap' : 'lap',
      actors: [leader.card.id],
      text: leader.dnf
        ? `${nameOf(leader.card)} is not leading, because the leaders are still moving.`
        : `${nameOf(leader.card)} leads on the ${leader.card.vehicleName ?? 'machine'}.`,
      commentary: raceJoke(rng, rows, lap),
      board: standingsBoard(rows),
    });
  }
  const ordered = [...rows].sort(byRace);
  const winner = ordered.find((row) => !row.dnf) ?? ordered[0];
  const homeIds = new Set(home.map((card) => card.id));
  const bestHome = ordered.find((row) => homeIds.has(row.card.id) && !row.dnf) ?? ordered.find((row) => homeIds.has(row.card.id));
  return packageResult({
    sport,
    seed,
    events,
    tuning,
    eventId,
    result: {
      score: null,
      standings: ordered.map((row, index) => ({
        place: row.dnf ? 'DNF' : index + 1,
        id: row.card.id,
        parodyName: row.card.parodyName,
        vehicleName: row.card.vehicleName,
        team: row.card.team,
        dnf: row.dnf,
        side: homeIds.has(row.card.id) ? 'home' : 'away',
      })),
      winner: winner?.card?.parodyName ?? 'nobody',
      mvp: bestHome ? { id: bestHome.card.id, parodyName: bestHome.card.parodyName } : null,
      homeName: 'Your Complex',
      awayName: away[0]?.team ?? 'Visitors',
      tyre: tyre.label,
      setup: setup.label,
    },
  });
}

function byRace(a, b) {
  if (a.dnf !== b.dnf) return a.dnf ? 1 : -1;
  return a.time - b.time;
}

function standingsBoard(rows) {
  const ordered = [...rows].sort(byRace);
  return {
    kind: 'standings',
    rows: ordered.map((row, index) => ({
      place: row.dnf ? 'DNF' : String(index + 1),
      name: row.card.parodyName,
      detail: row.dnf ? 'DNF' : (row.card.vehicleName ?? row.card.team),
    })),
  };
}

function raceJoke(rng, rows, lap) {
  const retired = rows.find((row) => row.dnf);
  if (retired && lap > 2 && rng() < 0.7) {
    return `${nameOf(retired.card)} retires the ${retired.card.vehicleName ?? 'machine'} and the excuse. DNF is theirs alone.`;
  }
  return pick(rng, [
    'The tyre strategy is a suggestion the asphalt is still reading.',
    'Two machines, two tempers, one very opinionated corner.',
    'Setup notes flutter. The lap does not wait for handwriting.',
  ]);
}
