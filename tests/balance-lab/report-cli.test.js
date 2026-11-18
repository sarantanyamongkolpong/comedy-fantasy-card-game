import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { experimentalConfig } from './fixture.js';
import { BATTLE_COLUMNS, battleRow, toCsv } from '../../tools/balance-lab/report.js';
import { loadScenario } from '../../tools/balance-lab/load.js';
import { runScenario } from '../../tools/balance-lab/simulate.js';
import { main } from '../../tools/balance-lab/cli.js';

const repoRoot = new URL('../../', import.meta.url);

test('CSV export uses the battle columns and one row per repeat', () => {
  const report = runScenario(experimentalConfig({ repeats: 2 }));
  const csv = toCsv(report.battles.map(battleRow));
  const lines = csv.trim().split('\n');
  assert.equal(lines[0], BATTLE_COLUMNS.join(','));
  assert.equal(lines.length, 3);
  assert.match(lines[1], /^EXPERIMENTAL_fixture,EXPERIMENTAL,0,/);
  assert.equal(JSON.parse(JSON.stringify(report)).recommendedConfig, undefined);
});

test('the CLI validates, runs, and rejects a scenario that omits HP', () => {
  const directory = mkdtempSync(join(tmpdir(), 'balance-lab-'));
  const good = join(directory, 'EXPERIMENTAL_cli.json');
  const bad = join(directory, 'EXPERIMENTAL_bad.json');
  writeFileSync(good, `${JSON.stringify(experimentalConfig({ scenarioId: 'EXPERIMENTAL_cli' }))}\n`);
  const broken = experimentalConfig({ scenarioId: 'EXPERIMENTAL_bad' });
  delete broken.parameters.hp;
  writeFileSync(bad, `${JSON.stringify(broken)}\n`);

  const ok = main(['validate', good], buffers());
  assert.equal(ok, 0);

  const ran = buffers();
  assert.equal(main(['run', good, '--out', directory], ran), 0);
  assert.match(ran.out, /EXPERIMENTAL balance lab/);
  assert.match(ran.out, /average turns: 1/);
  const written = JSON.parse(readFileSync(join(directory, 'EXPERIMENTAL_cli.report.json'), 'utf8'));
  assert.equal(written.summary.winsA, 1);
  const csv = readFileSync(join(directory, 'EXPERIMENTAL_cli.battles.csv'), 'utf8');
  assert.match(csv, /apSpentA/);

  const rejected = buffers();
  assert.equal(main(['validate', bad], rejected), 1);
  assert.match(rejected.err, /Q-HP/);
  assert.equal(main(['nope'], buffers()), 2);
});

test('the CLI compare and sweep commands write reports for the sample scenarios', () => {
  const directory = mkdtempSync(join(tmpdir(), 'balance-lab-'));
  const attrition = new URL('../../tools/balance-lab/scenarios/EXPERIMENTAL_attrition.json', import.meta.url).pathname;
  const burst = new URL('../../tools/balance-lab/scenarios/EXPERIMENTAL_burst.json', import.meta.url).pathname;
  const status = spawnSync(
    process.execPath,
    ['tools/balance-lab/cli.js', 'compare', attrition, burst, '--out', directory],
    { cwd: repoRoot.pathname, encoding: 'utf8' },
  );
  assert.equal(status.status, 0, status.stderr);
  assert.match(status.stdout, /delta average turns/);
  const compareFile = join(directory, 'EXPERIMENTAL_compare_attrition_vs_burst.report.json');
  const body = JSON.parse(readFileSync(compareFile, 'utf8'));
  assert.equal(body.label, 'EXPERIMENTAL');
  assert.ok(body.deltas.averageTurns > 10);
  assert.equal(body.leftReport, undefined);

  const sweep = spawnSync(process.execPath, ['tools/balance-lab/cli.js', 'sweep', burst, '--out', directory], {
    cwd: repoRoot.pathname,
    encoding: 'utf8',
  });
  assert.equal(sweep.status, 0, sweep.stderr);
  assert.match(sweep.stdout, /always-ATK/);
  const sweepCsv = readFileSync(join(directory, 'EXPERIMENTAL_burst.sweep.csv'), 'utf8');
  assert.match(sweepCsv, /policyA,policyB/);
  assert.equal(sweepCsv.trim().split('\n').length, 10);
});

test('committed sample reports match a fresh run of the same scenario', () => {
  for (const name of ['EXPERIMENTAL_attrition', 'EXPERIMENTAL_burst', 'EXPERIMENTAL_stalemate', 'EXPERIMENTAL_unreachable']) {
    const config = loadScenario(new URL(`../../tools/balance-lab/scenarios/${name}.json`, import.meta.url));
    const fresh = runScenario(config);
    const committed = JSON.parse(
      readFileSync(new URL(`../../tools/balance-lab/reports/${name}.report.json`, import.meta.url), 'utf8'),
    );
    assert.deepEqual(committed, fresh);
  }
});

test('the contrasting samples disagree on length and both stay decided', () => {
  const attrition = runScenario(
    loadScenario(new URL('../../tools/balance-lab/scenarios/EXPERIMENTAL_attrition.json', import.meta.url)),
  );
  const burst = runScenario(loadScenario(new URL('../../tools/balance-lab/scenarios/EXPERIMENTAL_burst.json', import.meta.url)));
  assert.deepEqual(
    attrition.battles.map((battle) => battle.turns),
    [27, 29, 29],
  );
  assert.equal(attrition.summary.winsA, 3);
  assert.ok(attrition.battles.every((battle) => battle.seedConsumed));
  assert.deepEqual(attrition.summary.neverPlayedAcrossBattles, []);
  assert.equal(burst.summary.averageTurns, 1);
  assert.equal(burst.summary.winsA, 3);
  assert.ok(burst.battles.every((battle) => battle.seedConsumed === false));
  assert.ok(burst.summary.averageTurns < attrition.summary.averageTurns);
});

function buffers() {
  const io = { out: '', err: '' };
  io.stdout = { write(chunk) { io.out += chunk; } };
  io.stderr = { write(chunk) { io.err += chunk; } };
  return io;
}
