import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  PARTY_SIZE,
  HAND_SIZE,
  BASE_AP,
  FACTION_RECORDS,
  CARD_ACTION_TYPES,
  ASSET_STATUSES,
} from '../../src/schema/constants.js';
import { hashProtected, validateRepository } from '../../tools/ci/lib/repository-structure.mjs';
import { tempRepo } from './temp-repo.js';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

const APPROVED = {
  partySize: 4,
  handSize: 5,
  baseAp: 5,
  factions: [
    { factionId: 'FAC_AEG', name: 'Aegis Dominion', role: 'Tank' },
    { factionId: 'FAC_PHA', name: 'Phantom Blades', role: 'DPS' },
    { factionId: 'FAC_CEL', name: 'Celestial Nexus', role: 'Magic' },
    { factionId: 'FAC_SAN', name: 'Sanctuary Order', role: 'Support' },
  ],
  cardActionTypes: ['ATK', 'DEF', 'Skill'],
  statuses: ['CONCEPT', 'PROTOTYPE', 'QA_PASSED', 'PRODUCTION_READY', 'INTEGRATED'],
};

function constantsModule(overrides = {}) {
  const values = { ...APPROVED, ...overrides };
  return `export const PARTY_SIZE = ${JSON.stringify(values.partySize)};
export const HAND_SIZE = ${JSON.stringify(values.handSize)};
export const BASE_AP = ${JSON.stringify(values.baseAp)};
export const FACTION_RECORDS = Object.freeze(${JSON.stringify(values.factions)});
export const CARD_ACTION_TYPES = Object.freeze(${JSON.stringify(values.cardActionTypes)});
export const ASSET_STATUSES = Object.freeze(${JSON.stringify(values.statuses)});
`;
}

function snapshot(values = APPROVED, sha256 = hashProtected(values)) {
  return `${JSON.stringify({ ...values, sha256, source: 'test snapshot' }, null, 2)}\n`;
}

function writeRequired(repo, { constants = constantsModule(), protectedJson = snapshot() } = {}) {
  for (const file of [
    'README.md',
    'docs/CI.md',
    'docs/DATA_SCHEMA.md',
    'docs/INTEGRATION_NOTES_FOR_MIRA.md',
    'docs/OPEN_DESIGN_DECISIONS.md',
    'docs/SYSTEMS_PROGRESS_REPORT.md',
    'docs/SYSTEMS_REPO_AUDIT.md',
    'src/schema/game.schema.json',
    'src/schema/validate.js',
  ]) {
    repo.write(file, `# ${file}\n`);
  }
  repo.write('src/schema/constants.js', constants);
  repo.write('tools/ci/protected-constants.json', protectedJson);
}

test('approved constants match the snapshot and do not freeze unfinished rules', () => {
  const file = JSON.parse(readFileSync(new URL('../../tools/ci/protected-constants.json', import.meta.url), 'utf8'));
  assert.equal(file.partySize, 4);
  assert.equal(file.handSize, 5);
  assert.equal(file.baseAp, 5);
  assert.deepEqual(file.factions, APPROVED.factions);
  assert.deepEqual(file.cardActionTypes, ['ATK', 'DEF', 'Skill']);
  assert.deepEqual(file.statuses, APPROVED.statuses);
  assert.equal(file.sha256, hashProtected(APPROVED));
  assert.equal(file.deckSize, undefined);
  assert.equal(file.hp, undefined);
  assert.equal(file.damage, undefined);
  assert.equal(file.gachaRate, undefined);
  assert.equal(PARTY_SIZE, file.partySize);
  assert.equal(HAND_SIZE, file.handSize);
  assert.equal(BASE_AP, file.baseAp);
  assert.deepEqual(FACTION_RECORDS.map((row) => ({ factionId: row.factionId, name: row.name, role: row.role })), file.factions);
  assert.deepEqual([...CARD_ACTION_TYPES], file.cardActionTypes);
  assert.deepEqual([...ASSET_STATUSES], file.statuses);
});

test('this checkout has the required docs and matching constants', async () => {
  const result = await validateRepository(repoRoot);
  assert.deepEqual(result.missingOrEmpty, []);
  assert.deepEqual(result.diffs, []);
  assert.equal(result.ok, true);
});

test('a missing required doc fails', async () => {
  const repo = tempRepo();
  try {
    writeRequired(repo);
    const result = await validateRepository(repo.root);
    assert.equal(result.ok, true);
    repo.write('docs/CI.md', '   \n');
    const emptied = await validateRepository(repo.root);
    assert.equal(emptied.ok, false);
    assert.ok(emptied.missingOrEmpty.includes('docs/CI.md'));
  } finally {
    repo.cleanup();
  }
});

test('runtime drift and a stale sha256 fail', async () => {
  const repo = tempRepo();
  try {
    writeRequired(repo, { constants: constantsModule({ partySize: 3 }) });
    const drifted = await validateRepository(repo.root);
    assert.equal(drifted.ok, false);
    assert.equal(drifted.diffs[0].key, 'partySize');
    assert.equal(drifted.diffs[0].actual, 3);
    assert.equal(drifted.diffs[0].expected, 4);

    const broken = tempRepo();
    try {
      const values = { ...APPROVED };
      writeRequired(broken, { protectedJson: snapshot(values, 'deadbeef') });
      const hashed = await validateRepository(broken.root);
      assert.equal(hashed.ok, false);
      assert.match(hashed.sections.at(-1).table.rows[0][2], /sha256 does not match/);
    } finally {
      broken.cleanup();
    }
  } finally {
    repo.cleanup();
  }
});

test('repository structure CLI passes on this checkout', () => {
  const run = spawnSync(process.execPath, ['tools/ci/validate-repository.mjs'], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  assert.match(run.stdout, /REPOSITORY_STRUCTURE: PASS/);
});
