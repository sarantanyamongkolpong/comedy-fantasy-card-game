#!/usr/bin/env node
/**
 * Phase 1 diagnostics for PR #54 (flat_atk, Regen AUTO, Bulwark Shield +2).
 * Read-only: changes no card, avatar, or rule data. Balance is NOT changed here.
 *
 *   node tools/sim/p1-diagnostics.mjs [--seeds 100] [--cap 400] [--out dir]
 *
 * Writes (in --out, default ./p1-evidence):
 *   provenance.json  git SHA, dirty flag, Node version, command, config hash
 *   per-seed.json    one row per seed x variant (winner, turns, starter, final HP/shield)
 *   summary.json     win %, finish %, turn stats, win % split by who moved first
 *   trace-seed-<n>.json  last 40 turns of state for every seed that hits the cap
 *
 * Variants (fast whole-turn AUTO loop, both sides use the same runAutoTurn policy):
 *   shield2       default config (flat_atk + Bulwark Shield +2)
 *   legacy_def1   bulwark.enabled = false (Bulwark stays DEF +1)
 *   swapped       shield2 with the two teams' sideOrder swapped (side-position bias check)
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as engine from '../../src/engine/index.js';
import { loadGameApi } from '../../web/js/game-api.js';
import { buildMatchInput, createStarterProfile } from '../../web/js/profile.js';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const SEEDS = Number(opt('--seeds', 100));
const CAP = Number(opt('--cap', 400));
const OUT = resolve(opt('--out', 'p1-evidence'));
mkdirSync(OUT, { recursive: true });

const api = await loadGameApi();
const catalog = api.catalog;
const profile = createStarterProfile(catalog);

function mirrorInput(seed, { swap = false } = {}) {
  const input = buildMatchInput(profile, catalog, { seed, mode: 'tower' });
  const teams = input.teams.map((team) => ({
    sideId: team.sideId,
    control: team.sideId === 'enemy' ? 'ai' : 'human',
    avatars: structuredClone(team.members),
  }));
  return {
    seed,
    matchId: `p1-${seed}`,
    shuffleDecks: true,
    teams: swap ? [teams[1], teams[0]] : teams,
    decks: structuredClone(input.decks),
  };
}

function withConfig(input, bulwarkEnabled) {
  const damage = { preset: 'flat_atk', ...(bulwarkEnabled === false ? { bulwark: { enabled: false } } : {}) };
  return { ...input, config: engine.resolveRuleConfig({ damage }) };
}

function snapshot(state) {
  const row = { turn: state.turnIndex, active: state.activeSideId };
  for (const id of state.sideOrder) {
    const side = state.sides[id];
    row[id] = {
      ap: side.ap,
      hand: side.zones.hand.length,
      draw: side.zones.draw.length,
      units: side.avatars.map((u) => ({
        id: u.avatarId, role: u.role, hp: u.hp, maxHp: u.maxHp, shield: u.shield,
        statuses: (u.statuses ?? []).map((s) => `${s.kind}${s.stat ? `:${s.stat}` : ''}${s.amount !== undefined ? `:${s.amount}` : ''}`),
      })),
    };
  }
  return row;
}

function play(input, { trace = false } = {}) {
  const state = engine.createMatch(input);
  const frames = [];
  let steps = 0;
  const actions = { player: {}, enemy: {} };
  while (state.outcome.status !== 'decided' && state.turnIndex <= CAP && steps < 4000) {
    steps += 1;
    if (state.phase === 'end_of_round_discard') { for (const id of state.sideOrder) engine.runAutoTurn(state, id); continue; }
    const side = state.activeSideId;
    if (trace) frames.push(snapshot(state));
    const r = engine.runAutoTurn(state, side);
    for (const a of r.log) {
      const key = a.kind === 'play' ? `${a.priority}:${a.cardId}` : a.kind;
      actions[side][key] = (actions[side][key] ?? 0) + 1;
    }
  }
  const finalHp = Object.fromEntries(state.sideOrder.map((id) => [id, state.sides[id].avatars.reduce((s, u) => s + Math.max(0, u.hp), 0)]));
  return {
    decided: state.outcome.status === 'decided',
    winner: state.outcome.winnerSideId ?? state.outcome.winner ?? null,
    turns: state.turnIndex,
    starter: state.startingSideId,
    firstInOrder: state.sideOrder[0],
    finalHp,
    actions,
    frames: trace ? frames.slice(-40) : undefined,
  };
}

const VARIANTS = {
  shield2: (seed) => withConfig(mirrorInput(seed), true),
  legacy_def1: (seed) => withConfig(mirrorInput(seed), false),
  swapped: (seed) => withConfig(mirrorInput(seed, { swap: true }), true),
};

const rows = [];
const traces = [];
for (const [variant, build] of Object.entries(VARIANTS)) {
  for (let seed = 1; seed <= SEEDS; seed += 1) {
    const result = play(build(seed));
    const { frames, actions, ...rest } = result;
    rows.push({ variant, seed, ...rest });
    if (!result.decided && variant === 'shield2') {
      const t = play(build(seed), { trace: true });
      traces.push(seed);
      writeFileSync(join(OUT, `trace-seed-${seed}.json`), JSON.stringify({ seed, variant, actions: t.actions, frames: t.frames }, null, 1));
    }
  }
}

const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)]; };
const r1 = (x) => Math.round(x * 10) / 10;
const summary = {};
for (const variant of Object.keys(VARIANTS)) {
  const set = rows.filter((r) => r.variant === variant);
  const t = set.map((r) => r.turns);
  const win = (rs, side) => r1((100 * rs.filter((r) => r.winner === side).length) / Math.max(1, rs.length));
  const starterPlayer = set.filter((r) => r.starter === 'player');
  const starterEnemy = set.filter((r) => r.starter === 'enemy');
  summary[variant] = {
    n: set.length,
    finishPct: r1((100 * set.filter((r) => r.decided).length) / set.length),
    playerWinPct: win(set, 'player'),
    enemyWinPct: win(set, 'enemy'),
    starterWinPct: r1((100 * set.filter((r) => r.decided && r.winner === r.starter).length) / Math.max(1, set.filter((r) => r.decided).length)),
    firstInSideOrderWinPct: r1((100 * set.filter((r) => r.decided && r.winner === r.firstInOrder).length) / Math.max(1, set.filter((r) => r.decided).length)),
    startedBy: { player: starterPlayer.length, enemy: starterEnemy.length },
    playerWinPctWhenPlayerStarts: win(starterPlayer, 'player'),
    playerWinPctWhenEnemyStarts: win(starterEnemy, 'player'),
    turns: { min: Math.min(...t), avg: r1(t.reduce((a, b) => a + b, 0) / t.length), median: pct(t, 0.5), p95: pct(t, 0.95), max: Math.max(...t) },
    undecidedSeeds: set.filter((r) => !r.decided).map((r) => r.seed),
  };
}

const sh = (cmd) => { try { return execSync(cmd, { cwd: repo, encoding: 'utf8' }).trim(); } catch { return null; } };
const configHash = createHash('sha256').update(JSON.stringify(engine.resolveRuleConfig({ damage: { preset: 'flat_atk' } }))).digest('hex');
const provenance = {
  gitSha: sh('git rev-parse HEAD'),
  gitDirty: (sh('git status --porcelain -- src content web') ?? '') !== '',
  node: process.version,
  command: `node tools/sim/p1-diagnostics.mjs ${args.join(' ')}`.trim(),
  seeds: SEEDS,
  turnCap: CAP,
  ruleConfigSha256: configHash,
  generatedAt: new Date().toISOString(),
};
const write = (name, data) => {
  const text = JSON.stringify(data, null, 1);
  writeFileSync(join(OUT, name), text);
  return createHash('sha256').update(text).digest('hex');
};
provenance.artifacts = { 'per-seed.json': write('per-seed.json', rows), 'summary.json': write('summary.json', summary), traces };
writeFileSync(join(OUT, 'provenance.json'), JSON.stringify(provenance, null, 1));
console.log(JSON.stringify({ provenance, summary }, null, 1));
