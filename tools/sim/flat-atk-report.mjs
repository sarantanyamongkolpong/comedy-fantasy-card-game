#!/usr/bin/env node
/**
 * Damage formula sim for Owner t269u (flat_atk, MVP_PROVISIONAL).
 *
 *   node tools/sim/flat-atk-report.mjs [--seeds 300] [--json out.json]
 *
 * Plays AUTO on both sides with the real engine, counts the web AUTO playback
 * steps exactly the way web/js/app.js startAutoLoop/animateLog does (one wait
 * per AUTO log entry: player turn is played one action per loop pass, the enemy
 * turn is one playEnemyTurn), and reports turns, finish rate, tank survival,
 * shield/regen/passive contribution, and the ablations used to check that each
 * mechanic still matters. Ablations change only the simulated copy of one
 * side; no card or avatar data file is changed.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as engine from '../../src/engine/index.js';
import { loadGameApi } from '../../web/js/game-api.js';
import { buildMatchInput, createStarterProfile } from '../../web/js/profile.js';
import { AUTO_TIMING } from '../../web/js/auto-play.js';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const SEEDS = Number(args[args.indexOf('--seeds') + 1]) || 300;
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const TURN_CAP = 400;

const api = await loadGameApi();
const catalog = api.catalog;
const profile = createStarterProfile(catalog);

function webInput(seed) {
  const input = buildMatchInput(profile, catalog, { seed, mode: 'tower' });
  return {
    seed,
    matchId: `sim-${seed}`,
    shuffleDecks: true,
    teams: input.teams.map((team) => ({
      sideId: team.sideId,
      control: team.sideId === 'enemy' ? 'ai' : 'human',
      avatars: structuredClone(team.members),
    })),
    decks: structuredClone(input.decks),
  };
}

const demo = JSON.parse(readFileSync(join(repo, 'content/v05/enemies/demo-battle.json'), 'utf8')).battle;
function demoEnemies() {
  return demo.enemies.map((row) => ({
    avatarId: row.enemyId,
    name: row.displayName,
    faction: catalog.factionName(row.factionId),
    factionId: row.factionId,
    role: row.role,
    rarity: row.rarity,
    stats: { atk: row.stats.atk, def: row.stats.def, spd: row.stats.spd },
    active: null,
    passive: null,
  }));
}

function sampleInput(seed) {
  const input = engine.proposedSampleMatchInput({ seed, playerControl: 'human', enemyControl: 'ai' });
  input.matchId = `sample-${seed}`;
  return input;
}

const MATCHUPS = {
  mirror_justins_starter: { label: 'Mirror Justins, content starter deck (web tower/arena path)', build: webInput },
  justins_vs_demo_battle: {
    label: 'Justins vs DEMO_BATTLE_001 placeholder enemies (content/v05/enemies), starter deck both sides',
    build(seed) {
      const input = webInput(seed);
      input.teams[1].avatars = demoEnemies();
      return input;
    },
  },
  mirror_justins_engine_sample_deck: {
    label: 'Mirror Justins, engine sample deck (src/engine/samples.js: real Guard shield 2, draw, recall)',
    build: sampleInput,
  },
};

const ABLATIONS = {
  none: () => {},
  no_shield: (avatars) => {
    for (const a of avatars) if (a.active?.effects) a.active.effects = a.active.effects.filter((e) => e.op !== 'shield');
  },
  no_taunt: (avatars) => {
    for (const a of avatars) if (a.active?.effects) a.active.effects = a.active.effects.filter((e) => e.op !== 'taunt');
  },
  no_regen: (avatars) => {
    for (const a of avatars) if (a.active?.effects) a.active.effects = a.active.effects.filter((e) => e.op !== 'regen');
  },
  no_passives: (avatars) => { for (const a of avatars) a.passive = null; },
};

function withConfig(input, preset) {
  return { ...input, config: engine.resolveRuleConfig(preset === undefined ? {} : { damage: { preset } }) };
}

/** Mirror of web/js/app.js startAutoLoop: counts animateLog waits. */
function playWebAuto(state) {
  let waits = 0;
  let loops = 0;
  const playerTurnWaits = [];
  const enemyTurnWaits = [];
  const count = (log) => Math.max(1, log.length);
  // startBattle: an enemy opening turn runs before the screen shows (no animation).
  if (state.activeSideId === 'enemy' && state.phase === 'action') engine.playEnemyTurn(state);
  let pTurn = 0;
  while (state.outcome.status !== 'decided' && state.turnIndex <= TURN_CAP && loops < 6000) {
    loops += 1;
    if (state.phase === 'action' && state.activeSideId === 'enemy') {
      const w = count(engine.playEnemyTurn(state).log); waits += w; enemyTurnWaits.push(w); continue;
    }
    if (state.phase === 'end_of_round_discard') {
      const logs = [...engine.runAutoTurn(state, 'player').log];
      if (state.phase === 'end_of_round_discard') logs.push(...engine.runAutoTurn(state, 'enemy').log);
      waits += count(logs); pTurn += count(logs); continue;
    }
    const r = engine.runAutoTurn(state, 'player', { maxActions: 1, shouldStop: () => false });
    const w = count(r.log); waits += w; pTurn += w;
    if (state.outcome.status === 'decided' || state.activeSideId !== 'player') { playerTurnWaits.push(pTurn); pTurn = 0; }
    if (state.phase === 'action' && state.activeSideId === 'enemy' && state.outcome.status !== 'decided') {
      const e = count(engine.playEnemyTurn(state).log); waits += e; enemyTurnWaits.push(e);
    }
  }
  return { waits, playerTurnWaits, enemyTurnWaits };
}

function analyse(state) {
  const log = state.log;
  const units = {};
  for (const side of state.sideOrder) {
    for (const u of state.sides[side].avatars) {
      units[`${side}:${u.avatarId}`] = { side, id: u.avatarId, role: u.role, maxHp: u.maxHp, curHp: u.maxHp, alive: u.alive, deathTurn: null, hits: 0, hpLost: 0, overkill: 0, absorbed: 0, regenHealed: 0 };
    }
  }
  const m = { plays: 0, shieldGranted: 0, absorbed: 0, totalDealt: 0, regenApplied: 0, regenHealed: 0, passiveProcs: 0, passiveMisses: 0, tauntsCast: 0, hitsInTauntWindow: 0, hitsOnTaunterInWindow: 0, tankShareOutsideWindow: 0, hitsOutsideWindow: 0 };
  let turn = 1;
  let activeSide = null;
  const deaths = [];
  const pendingActives = [];
  const tauntWindows = []; // { tauntSide, avatarKey, turn } -> opponent turn turn+1
  for (const e of log) {
    if (e.type === 'turn_start') { turn = e.turnIndex; activeSide = e.sideId; }
    if (e.type === 'active') pendingActives.push(e);
    if (e.type === 'play') {
      m.plays += 1;
      for (const act of pendingActives.splice(0)) {
        const actor = state.sides[e.sideId].avatars.find((u) => u.avatarId === act.avatarId);
        if (actor?.active?.effects?.some((x) => x.op === 'taunt')) { m.tauntsCast += 1; tauntWindows.push({ side: e.sideId, key: `${e.sideId}:${act.avatarId}`, turn }); }
      }
    }
    const key = e.sideId && e.avatarId ? `${e.sideId}:${e.avatarId}` : null;
    if (e.type === 'shield') m.shieldGranted += e.amount;
    if (e.type === 'damage') {
      m.totalDealt += e.dealt; m.absorbed += e.absorbed;
      const u = units[key]; if (u) { if (e.amount > 0) u.hits += 1; const real = Math.min(e.dealt, u.curHp); u.hpLost += real; u.overkill += e.dealt - real; u.curHp = e.hp; u.absorbed += e.absorbed; }
      const win = tauntWindows.find((w) => w.side === e.sideId && w.turn + 1 === turn && activeSide !== e.sideId && units[w.key]?.deathTurn === null);
      if (win) { m.hitsInTauntWindow += 1; if (win.key === key) m.hitsOnTaunterInWindow += 1; }
      else if (activeSide !== e.sideId) { m.hitsOutsideWindow += 1; if (units[key]?.role === 'Tank') m.tankShareOutsideWindow += 1; }
    }
    if (e.type === 'regen_applied') m.regenApplied += 1;
    if (e.type === 'regen_tick') { m.regenHealed += e.healed; const u = units[key]; if (u) { u.regenHealed += e.healed; u.curHp = e.hp; } }
    if (e.type === 'passive_proc') m.passiveProcs += 1;
    if (e.type === 'passive_miss') m.passiveMisses += 1;
    if (e.type === 'avatar_defeated') { const u = units[key]; if (u) { u.deathTurn = turn; deaths.push(key); } }
  }
  deaths.forEach((k, index) => { units[k].deathOrder = index + 1; });
  return { units: Object.values(units), m };
}

/** Fast loop: whole AUTO turns. Optional scripted regen for the player side. */
function playFast(state, { scriptedRegen = false } = {}) {
  let steps = 0;
  while (state.outcome.status !== 'decided' && state.turnIndex <= TURN_CAP && steps < 3000) {
    steps += 1;
    if (state.phase === 'end_of_round_discard') { for (const id of state.sideOrder) engine.runAutoTurn(state, id); continue; }
    if (state.activeSideId === 'enemy') { engine.playEnemyTurn(state); continue; }
    if (scriptedRegen) castRegenIfHurt(state, 'player');
    if (state.outcome.status !== 'decided') engine.runAutoTurn(state, 'player');
  }
}

/** A player who uses Justina's regen Skill when any living ally is at or below 70% HP. */
function castRegenIfHurt(state, sideId) {
  const side = state.sides[sideId];
  const healer = side.avatars.find((u) => u.alive && u.active?.effects?.some((e) => e.op === 'regen'));
  if (!healer) return;
  const hurt = side.avatars.some((u) => u.alive && u.hp <= 0.7 * u.maxHp);
  if (!hurt) return;
  if (side.avatars.some((u) => u.statuses.some((st) => st.kind === 'regen'))) return;
  for (const card of [...side.zones.hand]) {
    if (!card.effects?.some((e) => e.op === 'trigger_active')) continue;
    const action = { cardInstanceId: card.instanceId, actorAvatarId: healer.avatarId, targets: card.targetRule === 'Ally' ? [healer.avatarId] : [] };
    const r = engine.playAction(state, action);
    if (r.ok) return;
  }
}

function runOne(matchup, seed, { preset, ablation = 'none', loop = 'web', scriptedRegen = false } = {}) {
  const input = withConfig(MATCHUPS[matchup].build(seed), preset);
  ABLATIONS[ablation](input.teams[1].avatars);
  const state = engine.createMatch(input);
  const web = loop === 'web' ? playWebAuto(state) : (playFast(state, { scriptedRegen }), { waits: 0, playerTurnWaits: [], enemyTurnWaits: [] });
  const { units, m } = analyse(state);
  return {
    decided: state.outcome.status === 'decided',
    winner: state.outcome.winnerSideId ?? state.outcome.winner ?? null,
    turns: state.turnIndex,
    waits: web.waits,
    playerTurnWaits: web.playerTurnWaits,
    enemyTurnWaits: web.enemyTurnWaits,
    units,
    m,
  };
}

const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)]; };
const avg = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const r1 = (x) => Math.round(x * 10) / 10;

function summarise(rows) {
  const t = rows.map((r) => r.turns);
  const w = rows.map((r) => r.waits);
  const winP = rows.filter((r) => r.winner === 'player').length / rows.length;
  const byRole = {};
  for (const r of rows) for (const u of r.units) {
    const k = `${u.side}:${u.role}`;
    (byRole[k] ??= { n: 0, alive: 0, deathTurns: [], hits: [], hpLost: [], overkill: [], absorbed: [], deathOrder: [], maxHp: u.maxHp, regenHealed: [] });
    const b = byRole[k]; b.n += 1; if (u.deathTurn === null) b.alive += 1; else b.deathTurns.push(u.deathTurn);
    b.hits.push(u.hits); b.hpLost.push(u.hpLost); b.overkill.push(u.overkill); b.absorbed.push(u.absorbed); b.deathOrder.push(u.deathOrder ?? 5); b.regenHealed.push(u.regenHealed);
  }
  const roles = Object.fromEntries(Object.entries(byRole).map(([k, b]) => [k, {
    maxHp: b.maxHp, survivalPct: r1((100 * b.alive) / b.n), avgDeathTurn: r1(avg(b.deathTurns)), avgHits: r1(avg(b.hits)), avgHpLost: r1(avg(b.hpLost)), avgOverkill: r1(avg(b.overkill)), avgAbsorbed: r1(avg(b.absorbed)), avgDeathOrder: r1(avg(b.deathOrder)), avgRegenHealed: r1(avg(b.regenHealed)),
  }]));
  const sum = (f) => r1(avg(rows.map((r) => r.m[f])));
  return {
    n: rows.length,
    finishPct: r1((100 * rows.filter((r) => r.decided).length) / rows.length),
    within60Pct: r1((100 * rows.filter((r) => r.turns <= 60).length) / rows.length),
    playerWinPct: r1(100 * winP),
    turns: { min: Math.min(...t), avg: r1(avg(t)), median: pct(t, 0.5), p90: pct(t, 0.9), p95: pct(t, 0.95), max: Math.max(...t) },
    waits: { min: Math.min(...w), avg: r1(avg(w)), median: pct(w, 0.5), p90: pct(w, 0.9), p95: pct(w, 0.95), max: Math.max(...w) },
    avgWaitsPerTurn: r1(avg(rows.map((r) => r.waits / Math.max(1, r.turns)))),
    mechanics: Object.fromEntries(Object.keys(rows[0].m).map((k) => [k, sum(k)])),
    tauntRedirectPct: r1(100 * rows.reduce((a, r) => a + r.m.hitsOnTaunterInWindow, 0) / Math.max(1, rows.reduce((a, r) => a + r.m.hitsInTauntWindow, 0))),
    tankHitSharePctOutsideTaunt: r1(100 * rows.reduce((a, r) => a + r.m.tankShareOutsideWindow, 0) / Math.max(1, rows.reduce((a, r) => a + r.m.hitsOutsideWindow, 0))),
    roles,
  };
}

const part = args.includes('--part') ? args[args.indexOf('--part') + 1] : 'all';
const out = { seeds: SEEDS, part, timingMs: AUTO_TIMING.ms, matchups: {}, presets: {}, ablations: {} };
const mins = (rows) => Object.fromEntries(Object.entries(AUTO_TIMING.ms).map(([k, ms]) => {
  const w = rows.map((r) => r.waits);
  return [k, { min: r1(Math.min(...w) * ms / 60000), avg: r1(avg(w) * ms / 60000), median: r1(pct(w, 0.5) * ms / 60000), p90: r1(pct(w, 0.9) * ms / 60000), p95: r1(pct(w, 0.95) * ms / 60000), max: r1(Math.max(...w) * ms / 60000) }];
}));
for (const [name, def] of Object.entries(MATCHUPS)) {
  if (part !== 'all' && part !== name) continue;
  const rows = []; for (let s = 1; s <= SEEDS; s += 1) rows.push(runOne(name, s));
  const sum = summarise(rows);
  sum.label = def.label;
  sum.minutes = mins(rows);
  sum.avgPlayerWaitsPerPlayerTurn = r1(avg(rows.flatMap((r) => r.playerTurnWaits)));
  sum.avgEnemyWaitsPerEnemyTurn = r1(avg(rows.flatMap((r) => r.enemyTurnWaits)));
  out.matchups[name] = sum;
}
if (part === 'all' || part === 'presets') {
  for (const preset of [null, 'floor_25_pct_atk', 'floor_50_pct_atk', 'flat_atk']) {
    const rows = []; for (let s = 1; s <= SEEDS; s += 1) rows.push(runOne('mirror_justins_starter', s, { preset, loop: 'fast' }));
    const s = summarise(rows);
    out.presets[preset ?? 'legacy_floor1'] = { turns: s.turns, finishPct: s.finishPct, within60Pct: s.within60Pct, roles: { tank: s.roles['player:Tank'], dps: s.roles['player:DPS'] } };
  }
}
for (const matchup of ['mirror_justins_starter', 'mirror_justins_engine_sample_deck']) {
  if (part !== 'all' && part !== `ablations:${matchup}`) continue;
  const variants = [...Object.keys(ABLATIONS).map((a) => ({ name: `enemy_${a}`, opts: { ablation: a } })), { name: 'player_scripted_regen', opts: { scriptedRegen: true } }, { name: 'player_scripted_regen+enemy_no_regen', opts: { scriptedRegen: true, ablation: 'no_regen' } }];
  for (const v of variants) {
    const rows = []; for (let s = 1; s <= SEEDS; s += 1) rows.push(runOne(matchup, s, { ...v.opts, loop: 'fast' }));
    const s = summarise(rows);
    out.ablations[`${matchup}:${v.name}`] = { playerWinPct: s.playerWinPct, turns: s.turns, tauntRedirectPct: s.tauntRedirectPct, mechanics: s.mechanics };
  }
}
const text = JSON.stringify(out, null, 2);
if (jsonOut) writeFileSync(jsonOut, text);
else console.log(text);
