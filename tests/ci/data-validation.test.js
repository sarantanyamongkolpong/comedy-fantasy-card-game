import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { validateData } from '../../tools/ci/lib/data-validation.mjs';
import { tempRepo } from './temp-repo.js';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

function avatar(id, nameEn = 'Sir Potlid') {
  return {
    avatarId: id,
    nameEn,
    nameTh: 'เซอร์ฝาหม้อ',
    factionId: 'FAC_AEG',
    role: 'Tank',
    stats: { pow: null, def: null, spd: null, valueStatus: 'TBD' },
    rarity: null,
  };
}

test('the systems checkout parses, has unique character ids, and matches the schema', async () => {
  const result = await validateData(repoRoot);
  assert.deepEqual(result.parseErrors, []);
  assert.deepEqual(result.characterDuplicates, []);
  assert.deepEqual(result.schemaErrors, []);
  assert.deepEqual(result.loadErrors, []);
  assert.equal(result.ok, true);
  assert.ok(result.jsonFiles >= 7);
  assert.ok(result.characterCount >= 4);
  assert.ok(result.recordsChecked >= 4);
});

test('duplicate avatar records fail even when each record is schema-valid', async () => {
  const repo = tempRepo();
  try {
    repo.write('content/roster.json', JSON.stringify([avatar('AVT_AEG_001'), avatar('AVT_AEG_001', 'Copy')]));
    const result = await validateData(repo.root);
    assert.equal(result.ok, false);
    assert.equal(result.schemaErrors.length, 0);
    assert.equal(result.characterDuplicates.length, 1);
    assert.equal(result.characterDuplicates[0].id, 'AVT_AEG_001');
  } finally {
    repo.cleanup();
  }
});

test('the same character id in two content files is a duplicate', async () => {
  const repo = tempRepo();
  try {
    repo.write('content/a.json', JSON.stringify(avatar('AVT_AEG_099', 'One')));
    repo.write('content/b.json', JSON.stringify(avatar('AVT_AEG_099', 'Two')));
    const result = await validateData(repo.root);
    assert.equal(result.ok, false);
    assert.equal(result.characterDuplicates[0].id, 'AVT_AEG_099');
    assert.equal(result.characterDuplicates[0].locations.length, 2);
  } finally {
    repo.cleanup();
  }
});

test('a new unique avatar record is accepted', async () => {
  const repo = tempRepo();
  try {
    repo.write('content/roster.json', JSON.stringify(avatar('AVT_AEG_099', 'New Lid')));
    const result = await validateData(repo.root);
    assert.equal(result.ok, true);
    assert.equal(result.characterCount, 1);
  } finally {
    repo.cleanup();
  }
});

test('character index keys must be unique inside one JSON file', async () => {
  const repo = tempRepo();
  try {
    repo.write('content/rigs.json', JSON.stringify({
      rigs: [
        { characters: { AVT_AEG_001: { anchors: { head: [1, 2] } } } },
        { characters: { AVT_AEG_001: { anchors: { head: [3, 4] } } } },
      ],
    }));
    const result = await validateData(repo.root);
    assert.equal(result.ok, false);
    assert.equal(result.characterDuplicates[0].id, 'AVT_AEG_001');
  } finally {
    repo.cleanup();
  }
});

test('manifest owner references are not character definitions', async () => {
  const repo = tempRepo();
  try {
    repo.write('docs/ASSET_MANIFEST.json', JSON.stringify({
      manifest_version: 1,
      project: 'Comedy Fantasy Card Game',
      characters: { AVT_AEG_001: 'Sir Potlid' },
      assets: [{
        asset_id: 'FRAME_A',
        path: 'assets/frame.png',
        type: 'card_frame',
        owner: 'AVT_AEG_001',
        status: 'PROTOTYPE',
      }],
    }));
    const result = await validateData(repo.root);
    assert.equal(result.ok, true);
    assert.equal(result.characterCount, 0);
  } finally {
    repo.cleanup();
  }
});

test('invalid JSON fails parse, and an unknown action type fails schema', async () => {
  const repo = tempRepo();
  try {
    repo.write('content/broken.json', '{');
    repo.write('content/card.json', JSON.stringify({
      cardId: 'ACT_BAD',
      cardKind: 'action_card',
      actionType: 'ATTACK',
      name: null,
      apCost: null,
      costStatus: 'TBD',
      effectId: null,
      rarity: null,
    }));
    const result = await validateData(repo.root);
    assert.equal(result.ok, false);
    assert.equal(result.parseErrors.length, 1);
    assert.match(result.parseErrors[0].file, /content\/broken\.json/);
    assert.ok(result.schemaErrors.some((error) => error.message.includes('ATK, DEF, or Skill') || error.location.includes('actionType')));
  } finally {
    repo.cleanup();
  }
});

test('catalog modules with two records of one avatar id fail', async () => {
  const repo = tempRepo();
  try {
    repo.write('src/avatars/catalog.js', `export const SAMPLE_AVATARS = ${JSON.stringify([avatar('AVT_PHA_001', 'Nox'), avatar('AVT_PHA_001', 'Nox Again')])};\n`);
    const result = await validateData(repo.root);
    assert.equal(result.ok, false);
    assert.equal(result.characterDuplicates[0].id, 'AVT_PHA_001');
    assert.ok(result.characterDuplicates[0].locations.every((location) => location.startsWith('src/avatars/catalog.js')));
  } finally {
    repo.cleanup();
  }
});

test('data validation CLI passes on this checkout', () => {
  const run = spawnSync(process.execPath, ['tools/ci/validate-data.mjs'], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  assert.match(run.stdout, /DATA_VALIDATION: PASS/);
  assert.match(run.stdout, /\*\*Result: PASS\*\*/);
});
