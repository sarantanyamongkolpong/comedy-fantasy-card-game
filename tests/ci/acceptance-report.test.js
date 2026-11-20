import assert from 'node:assert/strict';
import test from 'node:test';
import { overallStatus, parseTap, ruleMatrix } from '../../tools/ci/lib/acceptance-report.mjs';

test('acceptance TAP parser separates pass, fail, and todo', () => {
  const parsed = parseTap(`
ok 1 - CORE-007 BASE_AP is 5
ok 2 - QA-01 CORE-009 action deck count is 30 # TODO src/engine/index.js not landed
not ok 3 - QA-05 CORE-015 AP 0 does not auto end the turn
ok 4 - /repo/tests/acceptance/v05/qa-01-deck-hand.test.js
# tests 4
# pass 2
# fail 1
# skipped 0
# todo 1
`);
  assert.equal(parsed.tests.length, 3);
  assert.equal(parsed.summary.pass, 2);
  assert.equal(parsed.summary.fail, 1);
  assert.equal(parsed.summary.todo, 1);
  assert.equal(overallStatus(parsed.summary), 'FAIL');
  const matrix = ruleMatrix(parsed.tests);
  const byId = Object.fromEntries(matrix.map((row) => [row.id, row.status]));
  assert.equal(byId['CORE-007'], 'PASS');
  assert.equal(byId['CORE-009'], 'TODO');
  assert.equal(byId['QA-01'], 'TODO');
  assert.equal(byId['CORE-015'], 'FAIL');
  assert.equal(byId['QA-05'], 'FAIL');
});

test('INCOMPLETE is not PASS when todos remain', () => {
  assert.equal(overallStatus({ pass: 4, fail: 0, todo: 2, skipped: 0 }), 'INCOMPLETE');
  assert.equal(overallStatus({ pass: 4, fail: 0, todo: 0, skipped: 0 }), 'PASS');
  assert.equal(overallStatus({ pass: 0, fail: 0, todo: 0, skipped: 0 }), 'FAIL');
});

test('AUTO rule ids from Owner t261u stay in the matrix', () => {
  const matrix = ruleMatrix([
    { name: 'AUTO-01 Owner t261u AUTO completes a match without manual input — not landed', status: 'todo' },
    { name: 'AUTO-04 Owner t261u toggle-off returns control mid-turn', status: 'pass' },
  ]);
  const byId = Object.fromEntries(matrix.map((row) => [row.id, row.status]));
  assert.equal(byId['AUTO-01'], 'TODO');
  assert.equal(byId['AUTO-04'], 'PASS');
});

test('a passing check does not hide a todo for the same rule', () => {
  const matrix = ruleMatrix([
    { name: 'D-ID Owner t253u AVT_AEG_001 identities unchanged', status: 'pass' },
    { name: 'D-ID Owner t253u Justins are new records — not landed', status: 'todo' },
  ]);
  assert.equal(matrix[0].id, 'D-ID');
  assert.equal(matrix[0].status, 'TODO');
});
