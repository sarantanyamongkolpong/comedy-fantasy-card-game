/**
 * Assemble docs/production/QA_PERF_REPORT.md from tools/qa/artifacts.
 * Reads only. Does not edit product code.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { artifactDir, repoRoot } from './lib/repo.mjs';

function readJson(name) {
  const file = join(artifactDir(), name);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf8'));
}

function kb(bytes) {
  if (!Number.isInteger(bytes)) return '—';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function seconds(ms) {
  if (!Number.isFinite(ms)) return '—';
  return `${(ms / 1000).toFixed(1)}s`;
}

function countSeverity(findings) {
  const bag = { P0: 0, P1: 0, P2: 0 };
  for (const item of findings ?? []) bag[item.severity] = (bag[item.severity] ?? 0) + 1;
  return bag;
}

function dedupeFindings(findings) {
  const map = new Map();
  for (const item of findings ?? []) {
    const key = `${item.severity}|${item.area}|${item.message}`;
    if (!map.has(key)) map.set(key, { ...item, viewports: [] });
    const viewport = item.viewport ?? '—';
    if (!map.get(key).viewports.includes(viewport)) map.get(key).viewports.push(viewport);
  }
  return [...map.values()];
}

function baselineTable(baseline) {
  if (!baseline) return '_Baseline artifact missing._\n';
  const lines = ['| Command | Node | Tests | Pass | Fail | Skip | Todo | Cancelled | Exit | Duration |', '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|'];
  for (const row of baseline.runs) {
    lines.push(`| \`${row.command}\` | ${row.node} | ${row.tests} | ${row.pass} | ${row.fail} | ${row.skipped} | ${row.todo} | ${row.cancelled} | ${row.exit} | ${row.duration} |`);
  }
  return `${lines.join('\n')}\n`;
}

function simSection(sim, msPerFrame) {
  if (!sim) return '_Battle simulation artifact missing._\n';
  const lines = [];
  lines.push(`Seeds recorded: **${sim.seeds}**. Deterministic repeat of the first seed: **${sim.deterministicRepeat ? 'yes' : 'NO'}**.`);
  if (sim.arenaMatchesTower) {
    lines.push(`Arena vs tower at seed ${sim.arenaMatchesTower.seed}: same turns **${sim.arenaMatchesTower.sameTurns}**, same winner **${sim.arenaMatchesTower.sameWinner}**, same playback frames **${sim.arenaMatchesTower.sameFrames}** (tower ${sim.arenaMatchesTower.towerTurns} turns, arena ${sim.arenaMatchesTower.arenaTurns} turns).`);
  }
  lines.push('The only wired matchup is the content/v05 Justin starter team against an echo of itself. Mysterious Tower and Tournament Arena both use that roster. `flat_atk` is applied with `damage.preset` and is not the shipped default.');
  lines.push('');
  lines.push('| Preset / mode | Matches | Decided | Stalls | Crashes | Turn min | Turn mean | Turn p95 | Turn max | CPU mean | Frames mean |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const group of sim.groups ?? []) {
    lines.push(`| ${group.key.replaceAll('|', ' / ')} | ${group.matches} | ${group.decided} | ${group.stalls} | ${group.crashes} | ${group.turns.min} | ${group.turns.mean} | ${group.turns.p95} | ${group.turns.max} | ${seconds(group.cpuMs.mean)} | ${group.playbackFrames.mean} |`);
  }
  lines.push('');
  lines.push(`Estimated UI wall clock uses the measured median toast gap (**${msPerFrame ?? 'unmeasured'} ms** per playback frame) times the frame count from the same AUTO loop the page runs. Engine CPU time is the headless simulation, not the animation.`);
  lines.push('');
  lines.push('| Seed | Preset | Turns | Frames | Winner | Stall | Crash | Engine CPU | Est. UI |');
  lines.push('|---:|---|---:|---:|---|---|---|---:|---:|');
  for (const row of sim.rows ?? []) {
    const est = msPerFrame == null ? null : Math.round(row.playbackFrames * msPerFrame);
    lines.push(`| ${row.seed} | ${row.preset} | ${row.turns ?? '—'} | ${row.playbackFrames} | ${row.winner ?? '—'} | ${row.stall ?? ''} | ${row.crash ?? ''} | ${seconds(row.cpuMs)} | ${seconds(est)} |`);
  }
  lines.push('');
  for (const group of sim.groups ?? []) {
    const tails = (group.turnTailSeeds ?? group.outlierSeeds ?? []).join(', ') || 'none';
    const failures = (group.failureSeeds ?? []).map((item) => `${item.seed} ${item.stall || item.crash || 'undecided'}`).join('; ') || 'none';
    lines.push(`- \`${group.key.replaceAll('|', ' / ')}\` turn tail (p95 and above): ${tails}`);
    lines.push(`- \`${group.key.replaceAll('|', ' / ')}\` stalls/crashes/undecided: ${failures}`);
  }
  return `${lines.join('\n')}\n`;
}

function uiSection(ui) {
  if (!ui) return '_UI coverage artifact missing._\n';
  const counts = countSeverity(ui.findings);
  const lines = [];
  lines.push(`Screenshots: **${ui.screenshots?.length ?? 0}**. Findings before de-dupe: P0 ${counts.P0}, P1 ${counts.P1}, P2 ${counts.P2}.`);
  lines.push('');
  lines.push('### Playback samples (1280×720)');
  lines.push('');
  lines.push('| Preset | Delay | Elapsed | Rewards | Toast changes | Median gap | Last turn | Page errors |');
  lines.push('|---|---:|---:|---|---:|---:|---|---:|');
  for (const row of ui.playback ?? []) {
    lines.push(`| ${row.preset} | ${row.delayMs} ms | ${seconds(row.elapsedMs)} | ${row.reachedRewards} | ${row.toastChanges} | ${row.medianToastGapMs ?? '—'} ms | ${row.lastTurn ?? '—'} | ${row.pageErrors?.length ?? 0} |`);
  }
  const perf = ui.performance;
  if (perf) {
    lines.push('');
    lines.push('### First load, memory, FPS (headless Chrome, 1280×720)');
    lines.push('');
    lines.push('| Signal | Value |');
    lines.push('|---|---|');
    lines.push(`| Navigation duration | ${perf.load?.durationMs ?? '—'} ms |`);
    lines.push(`| DOM content loaded | ${perf.load?.domContentLoadedMs ?? '—'} ms |`);
    lines.push(`| Load event | ${perf.load?.loadEventMs ?? '—'} ms |`);
    lines.push(`| Resource count | ${perf.load?.resourceCount ?? '—'} |`);
    lines.push(`| Transfer size | ${kb(perf.load?.transferSize)} |`);
    lines.push(`| Decoded body size | ${kb(perf.load?.decodedBodySize)} |`);
    lines.push(`| FPS on home | ${perf.fpsHome?.fps ?? '—'} (${perf.fpsHome?.frames ?? '—'} frames) |`);
    lines.push(`| FPS in battle | ${perf.fpsBattle?.fps ?? '—'} (${perf.fpsBattle?.frames ?? '—'} frames) |`);
    lines.push(`| JS heap home | ${kb(perf.heapHome?.jsHeapUsedSize)} |`);
    lines.push(`| JS heap battle | ${kb(perf.heapBattle?.jsHeapUsedSize)} |`);
  }
  lines.push('');
  lines.push('### Findings');
  lines.push('');
  const unique = dedupeFindings(ui.findings);
  if (unique.length === 0) lines.push('No P0/P1/P2 findings recorded by the harness.');
  else {
    lines.push('| Sev | Area | Viewport | Detail |');
    lines.push('|---|---|---|---|');
    for (const item of unique) {
      const where = (item.viewports ?? [item.viewport ?? '—']).join(', ');
      lines.push(`| ${item.severity} | ${item.area} | ${where} | ${String(item.message).replaceAll('|', '/')} |`);
    }
  }
  lines.push('');
  lines.push('### Screenshot index');
  lines.push('');
  for (const file of ui.screenshots ?? []) lines.push(`- \`${file}\``);
  return `${lines.join('\n')}\n`;
}

function assetSection(asset, build) {
  if (!asset) return '_Asset audit artifact missing._\n';
  const lines = [];
  lines.push('| Item | Value |');
  lines.push('|---|---|');
  lines.push(`| Manifest entries | ${asset.assetEntries} |`);
  lines.push(`| Missing manifest or CSS paths | ${asset.missing.length} |`);
  lines.push(`| Duplicate asset ids | ${asset.duplicateIds.length} |`);
  lines.push(`| Shipped files under web/assets | ${asset.shippedFiles} (${kb(asset.shippedBytes)}) |`);
  lines.push(`| Unique referenced bytes | ${kb(asset.referencedBytes)} |`);
  lines.push(`| Static catalog total (html+css+js+manifest+referenced) | ${kb(asset.staticFirstLoadEstimate.total)} |`);
  lines.push(`| Oversize rasters (≥ ${kb(asset.oversizeThresholdBytes)}) | ${asset.oversize.length} |`);
  if (build) {
    lines.push(`| web/dist/playable.html | ${kb(build.bytes)} |`);
    lines.push(`| Build exit | ${build.exit} |`);
  }
  lines.push('');
  if (asset.oversize.length) {
    lines.push('Oversize:');
    lines.push('');
    for (const file of asset.oversize) lines.push(`- \`${file.path}\` ${kb(file.bytes)}`);
    lines.push('');
  }
  if (asset.missing.length) {
    lines.push('Missing:');
    lines.push('');
    for (const file of asset.missing) lines.push(`- \`${file.path}\` from \`${file.manifest}\` (${file.assetId ?? 'css'})`);
    lines.push('');
  }
  lines.push('Largest shipped files:');
  lines.push('');
  lines.push('| Path | Bytes |');
  lines.push('|---|---:|');
  for (const file of asset.largest ?? []) lines.push(`| \`${file.path}\` | ${file.bytes} |`);
  lines.push('');
  lines.push(asset.staticFirstLoadEstimate.note);
  return `${lines.join('\n')}\n`;
}

function streamSection(phase2) {
  const lines = [];
  lines.push('Phase 1 ran on `prod/wave-base` only. Stream branches are merged only inside a local throwaway worktree and are never pushed.');
  lines.push('');
  lines.push('| Stream | Branch | State on this pass | SHA | Commits ahead of wave-base | Merged locally | Conflicts | Notes |');
  lines.push('|---|---|---|---|---:|---|---:|---|');
  const known = [
    ['A', 'prod/a-card-art'],
    ['B', 'prod/b-hideout'],
    ['C', 'prod/c-inventory'],
    ['D', 'prod/d-gacha'],
    ['E', 'prod/e-battle-polish'],
    ['F', 'prod/f-sport-art'],
    ['G', 'prod/g-world-content'],
  ];
  const byBranch = new Map((phase2?.streams ?? []).map((stream) => [stream.branch, stream]));
  for (const [id, branch] of known) {
    const stream = byBranch.get(branch);
    if (!stream) {
      lines.push(`| ${id} | \`${branch}\` | not fetched this pass | — | — | — | — | waiting for the next poll |`);
      continue;
    }
    const ahead = stream.commitsBeyondWaveBase?.length ?? stream.commits?.length ?? 0;
    const state = !stream.present ? 'branch missing on origin' : ahead === 0 ? 'no commits beyond wave-base' : stream.merged ? 'merged in throwaway' : 'merge conflict';
    const conflictFiles = (stream.conflicts ?? []).join(', ');
    const note = !stream.present
      ? 'not on origin this poll'
      : conflictFiles
        ? `conflict in ${conflictFiles}`
        : stream.merged
          ? 'included in the throwaway harness'
          : '';
    lines.push(`| ${id} | \`${branch}\` | ${state} | \`${stream.sha ? stream.sha.slice(0, 12) : '—'}\` | ${ahead} | ${stream.merged ? 'yes' : 'no'} | ${stream.conflicts?.length ?? 0} | ${note.replaceAll('|', '/')} |`);
  }
  return `${lines.join('\n')}\n`;
}

function phase2PassSection(pass) {
  if (!pass) return '';
  const lines = [];
  lines.push('## Phase 2 pass');
  lines.push('');
  lines.push(`Pass ${pass.pass} at ${pass.generatedAt}. Throwaway worktree only. Not pushed. Included streams: ${(pass.included ?? []).join(', ') || 'none'}.`);
  if (pass.final) lines.push('This is the final pass. Every stream tip matches the previous poll and each branch has commits beyond prod/wave-base, so polling stops.');
  if (pass.prior) lines.push(pass.prior);
  if (pass.npmTest) {
    const row = pass.npmTest;
    lines.push(`\`npm test\` on the merged tree, Node ${row.node}: tests ${row.tests}, pass ${row.pass}, fail ${row.fail}, skip ${row.skipped}, todo ${row.todo}, exit ${row.exit}, ${row.duration}.`);
  }
  if (pass.assets) {
    const asset = pass.assets;
    lines.push(`Asset audit on the merged tree: missing ${asset.missing}, oversize ${asset.oversize}, shipped ${asset.shipped}, referenced ${asset.referenced}, static catalog ${asset.staticCatalog}.`);
  }
  lines.push('');
  lines.push('| Stream | Sev | Finding |');
  lines.push('|---|---|---|');
  for (const item of pass.findings ?? []) {
    lines.push(`| ${item.stream} | ${item.severity} | ${String(item.message).replaceAll('|', '/')} |`);
  }
  if (pass.screenshots?.length) {
    lines.push('');
    lines.push('Merged-tree screenshots:');
    lines.push('');
    for (const file of pass.screenshots) lines.push(`- \`${file}\``);
  }
  return `${lines.join('\n')}\n`;
}

export function renderReport() {
  const baseline = readJson('baseline.json');
  const sim = readJson('battle-sim.json');
  const ui = readJson('ui-coverage.json');
  const asset = readJson('asset-audit.json');
  const phase2 = readJson('phase2-merge.json');
  const phase2Pass = readJson('phase2-pass.json');
  const build = readJson('playable-build.json');
  const msPerFrame = ui?.playbackMsPerFrame ?? null;
  const head = baseline?.head ?? '7cbf071a15d2da747ba5f9c100696a805860271e';
  const body = `# QA and performance report

Agent H. Base \`prod/wave-base\` @ \`${head}\`. Damage preset under test: \`flat_atk\` (Owner choice, MVP_PROVISIONAL). This file is the QA record. It does not mark the game PRODUCTION_READY, LOCKED, or OWNER_APPROVED.

Updated ${new Date().toISOString()}.

## Baseline

Clean \`npm test\` / \`npm run test:acceptance\` on this checkout before Agent H tests are counted. Playwright was not installed for that run, so four \`npm test\` cases skip and four acceptance cases stay todo.

${baseline?.notes ?? ''}

${baselineTable(baseline)}

Named skips on the clean Node 22 run:

- AUTO uses the engine export and starts off
- enabling AUTO drives runAutoTurn without a manual card
- switching AUTO off during an action hands the turn back
- map opens Prep Battle and Start Battle is the labelled primary control

Named todos on the clean Node 22 run:

- OWNER-PLAT-04 world map anchors stay fixed across landscape viewports (expects \`web/src/map/layout.js\`, which this tree does not use; the live map is \`web/js/map-layout.js\`)
- QA-10 map layout export is the OWNER-PLAT-04 hook (same missing path)
- QA-10 e2e smoke Deck Battle Rewards — Playwright is not installed
- QA-10 full loop — Playwright or Chrome is not installed

The ownership note of 411/0/3 does not match this checkout. The measured total is 411 tests with 403 pass, 0 fail, 4 skip, 4 todo on Node 22.

## Battle simulations

${simSection(sim, msPerFrame)}

Full rows also live in \`tools/qa/artifacts/battle-sim.json\`.

## UI coverage

Viewports: 844×390, 667×375, 915×412, 1280×720, 932×430, 1024×768, plus one portrait shot at 390×844 for the rotate overlay.

Checked on each landscape viewport: card and character geometry, touch size, map → prep → battle → rewards → map, stash avatars/actions/tokens, gacha pity and G charge against \`content/v05/gacha/TEST_ONLY_banners.json\`, AUTO toggle, save/load round trip, rewards copy.

Hand-card name plates and cost badges did not overlap. Every measured button was at least 44 CSS px. Battle character sprites do overlap: the same pairs repeat at about 0.16 and 0.36 of the smaller sprite on every landscape viewport. The 1280×720 battle shot still shows eight readable fighters, five hand cards, and the AUTO control. Prep shows the four Justins, a 30/30 deck, and START BATTLE.

The locked Sports Complex draws its name and the words "Coming soon" in the same absolute box (\`.hotspot-label\` and \`.hotspot-lock\` both sit at left 4px, right 4px, bottom 6px). The two strings fully overlap, so the label is not readable. Map art and the other building labels do paint once the images have decoded.

The gacha pull log is drawn over the avatar booth. After Pull 1, a normal click cannot reach that booth's Pull 10. The harness sent the click through the DOM node. Pity then read 11/100 and 11/200, G charged stayed 0, and the weights on screen stayed N 100. That is a hit-target bug, not an odds change.

The rewards screen shows the winner, the engine reason, G / Loot / Items as PENDING, and times emitted. One sampled fight was a defeat (\`all_avatars_defeated\`). The line that says the result is shown once is low contrast on the cream sheet.

${uiSection(ui)}

## Assets and transfer

${assetSection(asset, build)}

## Per-stream findings

${streamSection(phase2)}
${phase2PassSection(phase2Pass)}

## Severity on the wave-base client

P0 is a crash, a broken required path, or a silent gacha odds, pity, or cost change. P1 is a stall, a missing battle sprite or hand, a control under 24 CSS px, or a pull log that covers Pull 10. P2 is a control under the 44 CSS px target, a character overlap that still leaves most of the sprite visible, stacked map labels, or an asset over the 400 KB raster budget.

Agent H tests added after the clean baseline:

- \`tests/prod/h/gacha-ledger.test.js\` locks the published TEST weights, null \`costG\`, pity 100/200, and \`chargedG: 0\`.
- \`tests/prod/h/battle-sim-smoke.test.js\` replays seed 4 for the current formula and for \`flat_atk\`.

No product file is edited by this branch.
`;
  const out = join(repoRoot, 'docs', 'production', 'QA_PERF_REPORT.md');
  mkdirSync(join(repoRoot, 'docs', 'production'), { recursive: true });
  writeFileSync(out, body.endsWith('\n') ? body : `${body}\n`);
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(`${renderReport()}\n`);
}
