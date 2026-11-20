/**
 * Deterministic AUTO battles on the shipped web matchup.
 * Tower and arena both build the content/v05 Justin team against an echo of
 * that same team. The mode string is recorded and does not change the engine.
 * Playback frame counts follow web/js/app.js: the opening enemy turn is instant,
 * then player AUTO steps one action at a time and the enemy turn animates as a batch.
 */

import { performance } from 'node:perf_hooks';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fightSignature } from '../../web/js/auto-play.js';
import { contentCatalog } from '../../web/js/content-catalog.js';
import { bindEngine } from '../../web/js/engine-session.js';
import { buildMatchInput, createStarterProfile } from '../../web/js/profile.js';
import * as engine from '../../src/engine/index.js';
import * as gacha from '../../src/gacha/index.js';
import * as save from '../../src/save/index.js';
import { artifactDir, repoRoot } from './lib/repo.mjs';

const api = bindEngine(engine, gacha, save, {
  playEnemyTurn: engine.playEnemyTurn,
  runAutoTurn: engine.runAutoTurn,
  chooseAutoActions: engine.chooseAutoActions,
});

export const MATCHUPS = Object.freeze([
  {
    id: 'content-v05-justin-echo',
    modes: ['tower', 'arena'],
    note: 'Mysterious Tower and Tournament Arena both call buildMatchInput with the starter Justin team and an echo of the same four avatars and the demo deck. No other legal roster is wired on this branch.',
  },
]);

function framesOf(result) {
  const count = Array.isArray(result?.log) ? result.log.length : 0;
  return Math.max(count, 1);
}

export function simulateMatch({ seed, preset = null, mode = 'tower', spinCap = 2000 }) {
  const profile = createStarterProfile(contentCatalog);
  const input = buildMatchInput(profile, contentCatalog, { seed, mode });
  const config = engine.defaultRuleConfig();
  if (preset) config.damage.preset = preset;
  input.config = config;
  input.matchId = `${mode}-${preset ?? 'current'}-${seed}`;
  const started = performance.now();
  let crash = null;
  let stall = null;
  let playbackFrames = 0;
  let spins = 0;
  let match = null;
  try {
    match = api.createMatch(input);
    if (match.phase === 'enemyTurn' && api.getOutcome(match).status !== 'decided') {
      api.playEnemyTurn(match);
    }
    let previous = '';
    while (spins < spinCap && match && api.getOutcome(match).status !== 'decided') {
      spins += 1;
      const signature = fightSignature(match);
      if (signature === previous) {
        stall = 'signature-unchanged';
        break;
      }
      previous = signature;
      if (match.phase === 'enemyTurn') {
        const enemy = api.playEnemyTurn(match);
        playbackFrames += framesOf(enemy);
        continue;
      }
      if (match.phase === 'mandatoryDiscard') {
        const playerDiscard = api.runAutoTurn(match, 'player');
        playbackFrames += framesOf(playerDiscard);
        if (match.phase === 'mandatoryDiscard') {
          const enemyDiscard = api.runAutoTurn(match, 'enemy');
          playbackFrames += framesOf(enemyDiscard);
        }
        continue;
      }
      const result = api.runAutoTurn(match, 'player', { maxActions: 1 });
      playbackFrames += framesOf(result);
      if (match.phase === 'enemyTurn') {
        const enemy = api.playEnemyTurn(match);
        playbackFrames += framesOf(enemy);
      }
    }
    if (!stall && match && api.getOutcome(match).status !== 'decided') stall = `spin-cap-${spinCap}`;
  } catch (error) {
    crash = error instanceof Error ? error.message : String(error);
  }
  const outcome = match ? api.getOutcome(match) : null;
  return {
    seed,
    preset: preset ?? 'current',
    mode,
    matchup: MATCHUPS[0].id,
    decided: outcome?.status === 'decided',
    winner: outcome?.winnerSideId ?? null,
    reason: outcome?.reason ?? null,
    turns: match?.turnIndex ?? null,
    spins,
    playbackFrames,
    stall,
    crash,
    cpuMs: Number((performance.now() - started).toFixed(2)),
    damagePresetApplied: match?.engine?.config?.damage?.preset ?? null,
    damageFormula: match?.engine?.config?.damage?.formula ?? null,
  };
}

function quantile(sorted, p) {
  if (sorted.length === 0) return null;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[index];
}

export function summarize(rows, playbackMsPerFrame = null) {
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.preset}|${row.mode}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const groupsOut = [];
  for (const [key, list] of groups) {
    const turns = list.map((row) => row.turns).filter((turn) => Number.isInteger(turn)).sort((a, b) => a - b);
    const sum = turns.reduce((total, turn) => total + turn, 0);
    const mean = turns.length ? sum / turns.length : 0;
    const variance = turns.length
      ? turns.reduce((total, turn) => total + (turn - mean) ** 2, 0) / turns.length
      : 0;
    const sd = Math.sqrt(variance);
    const p95 = quantile(turns, 0.95);
    const failures = list.filter((row) => row.crash || row.stall || row.decided !== true);
    const turnTail = list.filter((row) => Number.isInteger(row.turns) && row.turns >= (p95 ?? Infinity));
    groupsOut.push({
      key,
      matches: list.length,
      decided: list.filter((row) => row.decided).length,
      stalls: list.filter((row) => row.stall).length,
      crashes: list.filter((row) => row.crash).length,
      winners: list.reduce((bag, row) => {
        const name = row.winner ?? 'none';
        bag[name] = (bag[name] ?? 0) + 1;
        return bag;
      }, {}),
      turns: {
        min: turns[0] ?? null,
        max: turns.at(-1) ?? null,
        mean: Number(mean.toFixed(2)),
        sd: Number(sd.toFixed(2)),
        p95,
      },
      cpuMs: {
        min: Math.min(...list.map((row) => row.cpuMs)),
        max: Number(Math.max(...list.map((row) => row.cpuMs)).toFixed(2)),
        mean: Number((list.reduce((total, row) => total + row.cpuMs, 0) / list.length).toFixed(2)),
      },
      playbackFrames: {
        min: Math.min(...list.map((row) => row.playbackFrames)),
        max: Math.max(...list.map((row) => row.playbackFrames)),
        mean: Number((list.reduce((total, row) => total + row.playbackFrames, 0) / list.length).toFixed(1)),
      },
      failureSeeds: failures.map((row) => ({ seed: row.seed, stall: row.stall, crash: row.crash, decided: row.decided })),
      turnTailSeeds: turnTail.map((row) => row.seed),
    });
  }
  return {
    generatedAt: new Date().toISOString(),
    repoRoot,
    matchups: MATCHUPS,
    seeds: rows.length,
    playbackMsPerFrame,
    groups: groupsOut,
    rows: rows.map((row) => ({
      ...row,
      estimatedUiMs: playbackMsPerFrame == null ? null : Math.round(row.playbackFrames * playbackMsPerFrame),
    })),
  };
}

function parseArgs(argv) {
  const out = { seeds: 220, from: 1, presets: [null, 'flat_atk'], modes: ['tower'] };
  for (const arg of argv) {
    if (arg.startsWith('--seeds=')) out.seeds = Number(arg.slice('--seeds='.length));
    else if (arg.startsWith('--from=')) out.from = Number(arg.slice('--from='.length));
    else if (arg.startsWith('--presets=')) {
      out.presets = arg.slice('--presets='.length).split(',').map((item) => (item === 'current' || item === 'null' ? null : item));
    } else if (arg === '--both-modes') out.modes = ['tower', 'arena'];
  }
  return out;
}

export function runMatrix(options) {
  const rows = [];
  for (const preset of options.presets) {
    for (const mode of options.modes) {
      for (let index = 0; index < options.seeds; index += 1) {
        const seed = options.from + index;
        rows.push(simulateMatch({ seed, preset, mode }));
      }
    }
  }
  const repeat = simulateMatch({ seed: options.from, preset: options.presets[0], mode: options.modes[0] });
  const first = rows.find((row) => row.seed === options.from && row.preset === (options.presets[0] ?? 'current') && row.mode === options.modes[0]);
  const deterministic = first
    && first.turns === repeat.turns
    && first.winner === repeat.winner
    && first.playbackFrames === repeat.playbackFrames
    && first.crash === repeat.crash;
  return { rows, deterministic, repeat };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const { rows, deterministic } = runMatrix(options);
  const tower = rows.find((row) => row.seed === options.from && row.preset === 'current' && row.mode === 'tower')
    ?? simulateMatch({ seed: options.from, preset: null, mode: 'tower' });
  const arena = simulateMatch({ seed: options.from, preset: null, mode: 'arena' });
  const summary = summarize(rows);
  summary.deterministicRepeat = deterministic;
  summary.arenaMatchesTower = {
    seed: options.from,
    sameTurns: tower.turns === arena.turns,
    sameWinner: tower.winner === arena.winner,
    sameFrames: tower.playbackFrames === arena.playbackFrames,
    towerTurns: tower.turns,
    arenaTurns: arena.turns,
  };
  summary.options = {
    seeds: options.seeds,
    from: options.from,
    presets: options.presets.map((preset) => preset ?? 'current'),
    modes: options.modes,
  };
  const dir = artifactDir();
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'battle-sim.json');
  writeFileSync(file, `${JSON.stringify(summary)}\n`);
  const brief = {
    file,
    seeds: summary.seeds,
    deterministic,
    groups: summary.groups,
  };
  process.stdout.write(`${JSON.stringify(brief, null, 2)}\n`);
  if (!deterministic || summary.groups.some((group) => group.crashes > 0)) process.exitCode = 1;
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) main();
