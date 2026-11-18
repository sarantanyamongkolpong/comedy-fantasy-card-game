import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { FEATURE_STATUSES } from '../src/schema/constants.js';
import { FEATURES, featuresMarkdown } from '../src/status/features.js';

const DOC_ONLY = [
  'Q-AP-LEFTOVER',
  'Q-HAND-OWNER',
  'Q-PLAY-DESTINATION',
  'Q-TURN-LIMIT',
  'Q-TARGETING',
  'Q-RARITY',
  'Q-SLOT-ANCHOR',
];

test('feature rows use the status vocabulary and match the design questions', () => {
  assert.deepEqual(FEATURE_STATUSES, ['IMPLEMENTED', 'TESTED', 'BLOCKED_BY_DESIGN', 'NOT_IMPLEMENTED']);
  const used = new Set(FEATURES.map((feature) => feature.status));
  for (const status of used) assert.ok(FEATURE_STATUSES.includes(status), status);
  assert.ok(used.has('TESTED'));
  assert.ok(used.has('BLOCKED_BY_DESIGN'));
  assert.ok(used.has('NOT_IMPLEMENTED'));

  const doc = readFileSync(new URL('../docs/OPEN_DESIGN_DECISIONS.md', import.meta.url), 'utf8');
  const docIds = [...doc.matchAll(/^## (Q-[A-Z0-9-]+)/gm)].map((match) => match[1]);
  const docIdSet = new Set(docIds);
  assert.equal(docIds.length, docIdSet.size);
  const blocked = FEATURES.filter((feature) => feature.status === 'BLOCKED_BY_DESIGN');
  for (const feature of blocked) {
    assert.equal(typeof feature.questionId, 'string');
    assert.ok(docIdSet.has(feature.questionId), feature.questionId);
  }
  for (const id of docIds) {
    const listed = blocked.some((feature) => feature.questionId === id) || DOC_ONLY.includes(id);
    assert.equal(listed, true, id);
  }
  for (const id of DOC_ONLY) assert.ok(docIdSet.has(id), id);

  const report = readFileSync(new URL('../docs/SYSTEMS_PROGRESS_REPORT.md', import.meta.url), 'utf8');
  const table = report.match(/<!-- FEATURE_TABLE_START -->\n([\s\S]*?)\n<!-- FEATURE_TABLE_END -->/);
  assert.ok(table, 'progress report is missing the feature table markers');
  assert.equal(table[1], featuresMarkdown());
});

test('the public entrypoint loads', async () => {
  const api = await import('../src/index.js');
  assert.equal(typeof api.createBattle, 'function');
  assert.equal(typeof api.createAssetLoader, 'function');
  assert.equal(api.SAMPLE_AVATARS.length, 4);
  assert.equal(api.BASE_AP, 5);
  assert.equal(api.HAND_SIZE, 5);
  assert.equal(api.PARTY_SIZE, 4);
});
