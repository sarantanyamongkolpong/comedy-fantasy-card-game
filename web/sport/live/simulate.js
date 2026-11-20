/**
 * Live sims. Calls the real src/sport engines and adds display-only fields
 * (clock, commentary, board, awayName, standings rows) for the web screens.
 * The sim result itself is not changed; the full event log stays on `fullEvents`.
 * Inputs carry parody names only.
 */
import { simulateFootball } from '../../../src/sport/football/index.mjs';
import { simulateBasket } from '../../../src/sport/basket/index.mjs';
import { simulateCar } from '../../../src/sport/car/index.js';
import { simulateMoto } from '../../../src/sport/moto/index.js';
import { hashSeed } from '../../../src/sport/common/rng-and-events.mjs';
import { CONTENT, getCard, opponentsFor, teamsOf } from './catalog.js';
import { ADAPTER_TUNING as T } from './tuning.js';

const SIM_FORMATION_SLOTS = {
  '4-3-3': ['GK', 'RB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CM', 'RW', 'ST', 'LW'],
  '4-2-3-1': ['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'DM', 'RW', 'AM', 'LW', 'ST'],
  '3-5-2': ['GK', 'CB', 'CB', 'CB', 'RWB', 'CM', 'DM', 'CM', 'LWB', 'ST', 'ST'],
  '4-4-2': ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CM', 'LM', 'ST', 'ST'],
  '3-4-3': ['GK', 'CB', 'CB', 'CB', 'RWB', 'CM', 'CM', 'LWB', 'RW', 'ST', 'LW'],
};

function player(card) {
  return { id: card.id, parodyName: card.parodyName, role: card.role, position: card.role, stats: { ...card.stats }, balance: 'BALANCE_PLACEHOLDER' };
}

function coachOf(card) {
  if (!card) return null;
  return { id: card.id, parodyName: card.parodyName, passive: card.passiveKey ?? 'none' };
}

/** Order the 11 chosen cards to the sim's slot list by role, then fill leftovers in order. */
function footballLineup(cards, formation, webRoles) {
  const slots = SIM_FORMATION_SLOTS[formation];
  const pool = cards.map((card, index) => ({ card, webRole: webRoles[index] }));
  const used = new Set();
  const take = (test) => {
    const hit = pool.find((row) => !used.has(row.card.id) && test(row));
    if (hit) used.add(hit.card.id);
    return hit?.card ?? null;
  };
  const ordered = slots.map((role) => (role === 'GK'
    ? take((row) => row.card.role === 'GK')
    : take((row) => row.webRole === role && row.card.role !== 'GK')));
  return ordered.map((card) => card ?? take((row) => row.card.role !== 'GK')).map((card) => card.id);
}

function footballAway(homeIds) {
  const all = opponentsFor('football').filter((card) => card.role !== 'COACH');
  const free = all.filter((card) => !homeIds.has(card.id));
  const squad = free.filter((card) => card.role === 'GK').length > 0 && free.length >= 11 ? free : all;
  const coach = opponentsFor('football').find((card) => card.role === 'COACH') ?? null;
  return { squad, coach };
}

function decorateBall(sim, sport, homeCards, awayCards, awayName) {
  const homeNames = new Set(homeCards.map((card) => card.parodyName));
  const awayNames = new Set(awayCards.map((card) => card.parodyName));
  let home = 0;
  let away = 0;
  const points = sport === 'football'
    ? { goal: 1 }
    : { make2: 2, make3: 3, free_throw_make: 1 };
  const events = sim.events.map((event) => {
    const value = points[event.type] ?? 0;
    if (value) {
      const actor = event.actors?.[0];
      if (homeNames.has(actor) && !awayNames.has(actor)) home += value;
      else if (awayNames.has(actor) && !homeNames.has(actor)) away += value;
    }
    const text = stripClock(event.text);
    return {
      ...event,
      rawText: event.text,
      text,
      clock: sport === 'football' ? footballClock(event) : basketClock(event, sim),
      commentary: text,
      board: { kind: 'score', home, away, homeName: T.homeName, awayName },
    };
  });
  const last = events[events.length - 1];
  if (last) last.board = { ...last.board, home: sim.result.score.home, away: sim.result.score.away };
  return events;
}

function footballClock(event) {
  if (event.type === 'kickoff') return "0'";
  if (event.type === 'half_time') return 'HT';
  if (event.type === 'full_time') return 'FT';
  if (event.type === 'extra_time_end') return 'AET';
  return `${Math.floor(event.t / 60) + 1}'`;
}

function basketClock(event, sim) {
  const rules = sim.result?.rules ?? {};
  const q = rules.quarterSeconds ?? 600;
  const quarters = rules.quarters ?? 4;
  const ot = rules.overtimeSeconds ?? 300;
  const t = event.t;
  if (event.type === 'final') return 'Final';
  const prefix = /^(Q\d|OT\d*) (\d+:\d+)\./.exec(event.text ?? '');
  if (prefix) return `${prefix[1]} ${prefix[2]}`;
  if (event.type === 'period_end') {
    const label = /End of (Q\d|OT\d*)/.exec(event.text ?? '');
    return label ? `End ${label[1]}` : 'Break';
  }
  if (t < q * quarters) {
    const period = Math.min(quarters, Math.floor(t / q) + 1);
    const left = q * period - t;
    return `Q${period} ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  }
  return `OT${Math.floor((t - q * quarters) / Math.max(1, ot)) + 1}`;
}

/** Display text without the clock prefix the sim already writes (the log shows the clock column). */
function stripClock(text) {
  return String(text ?? '')
    .replace(/^\d+'(\+\d+)?\s+/, '')
    .replace(/^(Q\d|OT\d*) \d+:\d+\.\s+/, '');
}

const KEY_TYPES = new Set([
  'kickoff', 'goal', 'save', 'half_time', 'full_time', 'extra_time_start', 'extra_time_half', 'extra_time_end', 'injury', 'substitution', 'offside',
  'tip', 'period_start', 'period_end', 'overtime', 'make3', 'block', 'steal', 'final', 'foul_out_held', 'ot_safety',
  'session_start', 'grid', 'lap', 'pit', 'weather', 'finish', 'dnf', 'retire', 'safety_car', 'overtake',
]);

/** Keep every key event, then fill evenly with the rest, up to `cap`. First and last always stay. */
export function highlight(events, cap) {
  if (events.length <= cap) return events.slice();
  const keep = new Set([0, events.length - 1]);
  events.forEach((event, index) => { if (KEY_TYPES.has(event.type)) keep.add(index); });
  if (keep.size > cap) {
    const ranked = [...keep].sort((a, b) => a - b);
    const step = ranked.length / cap;
    const thinned = new Set([0, events.length - 1]);
    for (let i = 0; thinned.size < cap && i < ranked.length; i += 1) thinned.add(ranked[Math.floor(i * step)]);
    for (const index of ranked) {
      const type = events[index].type;
      if (thinned.size >= cap) break;
      if (type === 'goal' || type === 'finish' || type === 'grid') thinned.add(index);
    }
    // Scoring and finish events must always be visible.
    events.forEach((event, index) => { if (event.type === 'goal' || event.type === 'finish' || event.type === 'half_time' || event.type === 'full_time') thinned.add(index); });
    return [...thinned].sort((a, b) => a - b).map((index) => events[index]);
  }
  const rest = events.map((_, index) => index).filter((index) => !keep.has(index));
  const room = cap - keep.size;
  const step = rest.length / Math.max(1, room);
  for (let i = 0; i < room; i += 1) keep.add(rest[Math.floor(i * step)]);
  return [...keep].sort((a, b) => a - b).map((index) => events[index]);
}

function playbackCap(sport) {
  const lengths = CONTENT.tuning.matchLengths[sport] ?? {};
  const seconds = lengths.playbackSecondsMax ?? lengths.playbackSeconds ?? 80;
  return Math.max(20, Math.floor((seconds * 1000) / T.playbackMsPerEvent));
}

/**
 * Match reward (OWNER_DECIDED t282u #6, values PROPOSED / BALANCE_PLACEHOLDER as in source).
 * Primary source: the win/draw/loss and placement table in content/v06/sport/tuning.json
 * (eventRewardsG). A sport with no complete table row falls back to the sim purse and says so.
 * Football/basket: result for the home side. Car/moto (PROPOSED): the better-placed of your two
 * entries in the Grand Prix; dnf only when neither finished. One payout per match (claimId).
 */
const RESULT_KEYS = {
  football: ['win', 'draw', 'loss'],
  basket: ['win', 'draw', 'loss'],
  car: ['first', 'second', 'third', 'classified', 'dnf'],
  moto: ['first', 'second', 'third', 'classified', 'dnf'],
};

export function rewardTable(sport) {
  const row = CONTENT.tuning?.eventRewardsG?.[sport];
  const keys = RESULT_KEYS[sport] ?? [];
  if (!row || !keys.every((key) => Number.isInteger(row[key]) && row[key] >= 0)) return null;
  return Object.fromEntries(keys.map((key) => [key, row[key]]));
}

export function resultKey(sport, simResult, homeIds) {
  if (sport === 'football' || sport === 'basket') {
    const { home, away } = simResult.score ?? {};
    if (!Number.isFinite(home) || !Number.isFinite(away)) return null;
    return home > away ? 'win' : home < away ? 'loss' : 'draw';
  }
  const order = simResult.gp?.order ?? [];
  const mine = order.filter((row) => homeIds.has(row.id) && row.status === 'FIN');
  if (!mine.length) return order.some((row) => homeIds.has(row.id)) ? 'dnf' : null;
  const best = Math.min(...mine.map((row) => row.position));
  return best === 1 ? 'first' : best === 2 ? 'second' : best === 3 ? 'third' : 'classified';
}

function rewardPack(sim, sport, eventId, homeIds = new Set()) {
  const table = rewardTable(sport);
  const key = table ? resultKey(sport, sim.result, homeIds) : null;
  const fromTable = Boolean(table && key && key in table);
  return {
    G: fromTable ? table[key] : sim.rewards.G,
    source: fromTable ? 'content/v06/sport/tuning.json#eventRewardsG' : 'sim-purse',
    resultKey: key,
    fallbackReason: fromTable ? null : (table ? 'result not mapped' : 'reward table missing for this sport'),
    status: 'PROPOSED',
    balance: 'BALANCE_PLACEHOLDER',
    decision: 'OWNER_DECIDED t282u #6',
    eventId,
    claimId: `sport-reward:${eventId}`,
  };
}

function runFootball({ seed, eventId, home, tactics }) {
  const formation = tactics.formation ?? '4-3-3';
  const homeIds = new Set(home.map((card) => card.id));
  const benchCards = (tactics.bench ?? []).filter((card) => !homeIds.has(card.id) && card.role !== 'COACH');
  const away = footballAway(homeIds);
  const awayName = T.opponents.football.team;
  const sim = simulateFootball({
    seed,
    home: { id: 'HOME', parodyName: T.homeName, coach: coachOf(tactics.coach), players: home.map(player), bench: benchCards.slice(0, 7).map(player) },
    away: { id: 'AWAY', parodyName: awayName, coach: coachOf(away.coach), players: away.squad.map(player) },
    tactics: {
      home: { formation, lineup: footballLineup(home, formation, tactics.webRoles ?? []) },
      away: { formation: T.opponents.football.formation },
    },
  });
  const fullEvents = decorateBall(sim, 'football', [...home, ...benchCards], away.squad, awayName);
  return { sim, fullEvents, awayName };
}

function runBasket({ seed, home, tactics }) {
  const homeIds = new Set(home.map((card) => card.id));
  const benchCards = (tactics.bench ?? []).filter((card) => !homeIds.has(card.id) && card.role !== 'COACH');
  const all = opponentsFor('basket');
  const awayPlayers = all.filter((card) => card.role !== 'COACH' && !homeIds.has(card.id));
  const awayCoach = all.find((card) => card.role === 'COACH') ?? null;
  const awayName = T.opponents.basket.team;
  const scheme = T.basketScheme[tactics.scheme] ?? 'man-to-man';
  const pace = T.basketPace[tactics.pace] ?? 'balanced';
  const sim = simulateBasket({
    seed,
    home: { id: 'HOME', parodyName: T.homeName, coach: coachOf(tactics.coach), players: home.map(player), bench: benchCards.slice(0, 7).map(player) },
    away: { id: 'AWAY', parodyName: awayName, coach: coachOf(awayCoach), players: awayPlayers.slice(0, 5).map(player), bench: awayPlayers.slice(5).map(player) },
    tactics: {
      home: { scheme, pace, lineup: home.map((card) => card.id) },
      away: { scheme: T.opponents.basket.scheme, pace: T.opponents.basket.pace },
    },
  });
  const fullEvents = decorateBall(sim, 'basket', [...home, ...benchCards], awayPlayers, awayName);
  return { sim, fullEvents, awayName };
}

function raceEntry(card, sport, tactics) {
  const tyre = T.tyre[tactics.tyre] ?? 'M';
  const entry = {
    id: card.id,
    parodyName: card.parodyName,
    stats: { TopSpeed: card.stats.TopSpeed, Accel: card.stats.Accel, Handling: card.stats.Handling },
    strategy: { tyre: sport === 'moto' && tyre === 'Inter' ? 'Wet' : tyre },
  };
  if (sport === 'car') entry.strategy.aeroBias = T.carAeroBias[tactics.setup] ?? 0;
  if (sport === 'moto') entry.setup = T.motoSetup[tactics.setup] ?? 'Balanced';
  return entry;
}

function fieldEntry(card, sport) {
  const entry = { id: card.id, parodyName: card.parodyName, stats: { TopSpeed: card.stats.TopSpeed, Accel: card.stats.Accel, Handling: card.stats.Handling } };
  if (sport === 'moto') entry.setup = 'Balanced';
  return entry;
}

function runRace({ sport, seed, home, tactics }) {
  const homeIds = new Set(home.map((card) => card.id));
  const field = teamsOf(sport)
    .filter((team) => Array.isArray(team.entryIds) && team.entryIds.length === 2 && team.entryIds.every((id) => !homeIds.has(id)))
    .map((team) => ({ teamId: team.id, parodyName: team.parodyName, entries: team.entryIds.map((id) => fieldEntry(getCard(id), sport)) }));
  const input = {
    seed: hashSeed(String(seed)),
    home: { teamId: T.homeRaceTeamId, parodyName: T.homeName, entries: home.map((card) => raceEntry(card, sport, tactics)) },
    field,
    tactics: { sprint: false },
  };
  const sim = sport === 'car' ? simulateCar(input) : simulateMoto(input);
  const nameById = new Map();
  const vehicleById = new Map();
  const teamById = new Map([[T.homeRaceTeamId, T.homeName]]);
  for (const card of [...home, ...field.flatMap((team) => team.entries.map((entry) => getCard(entry.id)))]) {
    nameById.set(card.id, card.parodyName);
    vehicleById.set(card.id, card.vehicleName);
  }
  for (const team of field) teamById.set(team.teamId, team.parodyName);
  let board = { kind: 'standings', rows: [] };
  const fullEvents = sim.events.map((event, index) => {
    let text = event.text;
    const ordered = event.type === 'lap' || event.type === 'grid' || event.type === 'finish';
    if (ordered) {
      const ids = event.actors ?? [];
      board = {
        kind: 'standings',
        rows: ids.slice(0, 3).map((id, place) => ({ place: place + 1, name: nameById.get(id) ?? id })),
        mine: ids.map((id, place) => (homeIds.has(id) ? { place: place + 1, name: nameById.get(id) } : null)).filter(Boolean),
      };
      if (event.type === 'lap' || event.type === 'grid') {
        const head = event.text.split(':')[0];
        const top = board.rows.map((row) => `P${row.place} ${row.name}`).join(', ');
        const mine = board.mine.map((row) => `P${row.place} ${row.name}`).join(', ');
        text = `${head}: ${top}${mine ? ` · yours ${mine}` : ''}.`;
      }
    }
    return { ...event, rawText: event.text, text, clock: raceClock(event, sim, index), commentary: text, board };
  });
  const standings = sim.result.standings.drivers.map((row, index) => ({
    place: index + 1,
    dnf: row.dnf,
    id: row.id,
    parodyName: row.parodyName,
    vehicleName: vehicleById.get(row.id) ?? null,
    team: teamById.get(row.teamId) ?? row.teamId,
    points: row.points,
    mine: homeIds.has(row.id),
  }));
  // Display only: 20+ qualifying-lap lines would bury the start, so playback keeps pole and your two entries.
  let poleShown = false;
  const playback = fullEvents.filter((event) => {
    if (event.type !== 'quali_lap') return true;
    const mine = (event.actors ?? []).some((id) => homeIds.has(id));
    if (mine) return true;
    if (!poleShown) { poleShown = true; return true; }
    return false;
  });
  return { sim, fullEvents, playback, awayName: 'The grid', standings };
}

function raceClock(event) {
  if (event.type === 'session_start') return 'Start';
  if (event.type === 'grid') return 'Grid';
  if (event.type === 'finish') return 'Flag';
  const lap = /^Lap (\d+)/.exec(event.text);
  if (lap) return `Lap ${lap[1]}`;
  const s = Math.floor(event.t / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Contract shape: simulateSport({ sport, seed, eventId, home, away|field, tactics })
 * -> { sport, seed, events, result, rewards, fullEvents, raw }
 */
export function simulateSport(input = {}) {
  const sport = input.sport;
  const seed = input.seed ?? 1;
  const eventId = input.eventId ?? `SPORT_${String(sport).toUpperCase()}_${hashSeed(String(seed))}`;
  const home = input.home ?? [];
  const tactics = input.tactics ?? {};
  let run;
  if (sport === 'football') run = runFootball({ seed, eventId, home, tactics });
  else if (sport === 'basket') run = runBasket({ seed, home, tactics });
  else if (sport === 'car' || sport === 'moto') run = runRace({ sport, seed, home, tactics });
  else throw new Error(`Unknown sport "${sport}"`);
  const { sim, fullEvents, awayName } = run;
  const result = { ...sim.result, awayName };
  if (run.standings) result.standings = run.standings;
  if (sport === 'football' || sport === 'basket') {
    result.mvp = sim.result.mvp ? { ...sim.result.mvp } : null;
  }
  return {
    sport,
    seed: String(seed),
    status: 'PROPOSED',
    engine: 'src/sport',
    events: highlight(run.playback ?? fullEvents, playbackCap(sport)),
    fullEvents,
    result,
    rewards: rewardPack(sim, sport, eventId, new Set(home.map((card) => card.id))),
  };
}
