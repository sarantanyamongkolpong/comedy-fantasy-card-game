import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { repoRoot } from '../../tools/authoring/paths.js';

function run(args) {
  return spawnSync(process.execPath, ['tools/authoring/cli.js', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

test('validate prints text and JSON and exits 0 for the starter catalog', () => {
  const result = run([
    'validate',
    'content/examples',
    '--manifest',
    'tests/authoring/fixtures/example-asset-index.json',
    '--format',
    'both',
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Result: OK/);
  assert.match(result.stdout, /เซอร์ฝาหม้อ|avatars        4/);
  const json = JSON.parse(result.stdout.split('---\n')[1]);
  assert.equal(json.ok, true);
  assert.equal(json.counts.equipment, 17);
  assert.equal(json.errors.length, 0);
});

test('validate without a manifest still accepts the starter records', () => {
  const result = run(['validate', 'content/examples/starter-catalog.json', '--no-manifest', '--format', 'json']);
  assert.equal(result.status, 0, result.stderr);
  const json = JSON.parse(result.stdout);
  assert.equal(json.ok, true);
  assert.equal(json.manifest.checked, false);
});

test('validate exits 1 when a record is wrong', () => {
  const directory = mkdtempSync(join(tmpdir(), 'authoring-cli-'));
  const file = join(directory, 'bad.json');
  writeFileSync(
    file,
    JSON.stringify({
      avatars: [
        {
          extends: 'avatar',
          avatarId: 'AVT_AEG_001',
          nameEn: 'Sir Potlid',
          nameTh: 'เซอร์ฝาหม้อ',
          factionId: 'FAC_AEG',
          rigId: 'humanoid_heavy',
        },
        {
          extends: 'avatar',
          avatarId: 'AVT_AEG_001',
          nameEn: 'Sir Potlid',
          nameTh: 'เซอร์ฝาหม้อ',
          factionId: 'FAC_AEG',
          rigId: 'humanoid_heavy',
        },
      ],
    }),
  );
  const result = run(['validate', file, '--no-manifest', '--format', 'text']);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /Result: FAIL/);
  assert.match(result.stdout, /DUPLICATE/);
  assert.match(result.stdout, /AVT_AEG_001/);
});

test('import and export keep Thai names and null AP costs', () => {
  const directory = mkdtempSync(join(tmpdir(), 'authoring-bridge-'));
  const exported = run([
    'export',
    '--kind',
    'action-card',
    '--out',
    join(directory, 'actions.csv'),
    'content/examples/starter-catalog.json',
  ]);
  assert.equal(exported.status, 0, exported.stderr);
  const csv = readFileSync(join(directory, 'actions.csv'), 'utf8');
  assert.match(csv, /ACT_SCHEMA_SKILL,action_card,Skill,,,TBD/);
  const imported = run([
    'import',
    '--kind',
    'action-card',
    '--out',
    join(directory, 'actions.json'),
    join(directory, 'actions.csv'),
  ]);
  assert.equal(imported.status, 0, imported.stderr);
  const body = JSON.parse(readFileSync(join(directory, 'actions.json'), 'utf8'));
  assert.equal(body.records[0].apCost, null);
  assert.equal(body.records[0].name, null);
  assert.equal(body.records[0].costStatus, 'TBD');
  assert.equal(body.records[2].actionType, 'Skill');
  assert.notEqual(body.records[0].apCost, 0);

  const avatars = run([
    'import',
    '--kind',
    'avatar',
    'content/examples/csv/avatars.csv',
  ]);
  assert.equal(avatars.status, 0, avatars.stderr);
  const avatarBody = JSON.parse(avatars.stdout);
  assert.equal(avatarBody.records[0].nameTh, 'เซอร์ฝาหม้อ');
  assert.equal(avatarBody.records[0].stats.pow, null);
  assert.equal(avatarBody.records[0].rarity, null);
  assert.equal(avatarBody.records[1].nameTh, 'น็อกซ์ รองเท้าดัง');
  assert.equal(avatarBody.records[2].nameTh, 'มาดามดาวตก');
  assert.equal(avatarBody.records[3].nameTh, 'ซิสเตอร์พลาสเตอร์');
});

test('usage errors exit 2', () => {
  const bare = run([]);
  assert.equal(bare.status, 2);
  assert.match(bare.stderr, /Usage:/);
  const unknown = run(['frobnicate']);
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /Unknown command/);
  const missing = run(['validate', 'content/missing-catalog.json', '--no-manifest']);
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /Cannot parse|ENOENT|no catalog/i);
});
