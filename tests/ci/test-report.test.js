import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { renderTestReport, reportTests } from '../../tools/ci/lib/summary-report.mjs';

function summary(counts, extra = {}) {
  return { type: 'test:summary', data: { success: counts.failed === 0, counts, duration_ms: 12, ...extra } };
}

test('a discovered passing suite renders PASS', () => {
  const collected = {
    files: [{
      file: '/repo/tests/schema.test.js',
      counts: { tests: 2, passed: 2, failed: 0, skipped: 0, todo: 0 },
      duration_ms: 4,
    }],
    failures: [],
    rollup: {
      success: true,
      counts: { tests: 2, passed: 2, failed: 0, skipped: 0, todo: 0 },
      duration_ms: 9,
    },
  };
  const rendered = renderTestReport(collected, { cwd: '/repo', nodeLabel: '22.23.4' });
  assert.equal(rendered.ok, true);
  assert.match(rendered.markdown, /### Node\.js 22\.23\.4/);
  assert.match(rendered.markdown, /\*\*Result: PASS\*\*/);
  assert.match(rendered.markdown, /tests\/schema\.test\.js/);
});

test('Node 20 pass and fail events count when test:summary is absent', () => {
  const collected = {
    files: [],
    failures: [],
    rollup: null,
    passed: 2,
    failed: 0,
    skipped: 1,
    buckets: [{ file: '/repo/tests/schema.test.js', passed: 2, failed: 0, skipped: 1 }],
  };
  const rendered = renderTestReport(collected, { cwd: '/repo', nodeLabel: '20.19.5' });
  assert.equal(rendered.ok, true);
  assert.equal(rendered.discovered, 3);
  assert.match(rendered.markdown, /\| 3 \| 2 \| 0 \| 1 \| — \|/);
  assert.match(rendered.markdown, /tests\/schema\.test\.js/);
});

test('zero discovered tests fail', () => {
  const rendered = renderTestReport({
    files: [],
    failures: [],
    rollup: { success: true, counts: { tests: 0, passed: 0, failed: 0, skipped: 0, todo: 0 }, duration_ms: 1 },
  }, { nodeLabel: '20' });
  assert.equal(rendered.ok, false);
  assert.match(rendered.markdown, /No tests were discovered/);
});

test('root-cause failures are listed and parent subtest failures are not double counted', async () => {
  async function* source() {
    yield { type: 'test:fail', data: { name: 'gamma fails', file: '/repo/tests/a.test.js', line: 5, details: { type: 'test', error: { message: '1 !== 2', failureType: 'testCodeFailure' } } } };
    yield { type: 'test:fail', data: { name: 'parent', file: '/repo/tests/a.test.js', line: 6, details: { type: 'test', error: { message: '1 subtest failed', failureType: 'subtestsFailed' } } } };
    yield summary({ tests: 2, passed: 0, failed: 2, skipped: 0, todo: 0 }, { file: '/repo/tests/a.test.js' });
    yield summary({ tests: 2, passed: 0, failed: 2, skipped: 0, todo: 0 });
  }
  const directory = mkdtempSync(join(tmpdir(), 'cfcg-summary-'));
  const summaryFile = join(directory, 'summary.md');
  try {
    const chunks = [];
    for await (const chunk of reportTests(source(), {
      checkName: 'SYSTEMS_TEST',
      nodeLabel: '20',
      summaryFile,
      cwd: '/repo',
    })) {
      chunks.push(chunk);
    }
    const text = readFileSync(summaryFile, 'utf8');
    assert.match(text, /\*\*Result: FAIL\*\*/);
    assert.match(text, /gamma fails/);
    assert.doesNotMatch(text, /1 subtest failed/);
    assert.match(chunks.join(''), /SYSTEMS_TEST \(Node\.js 20\): FAIL/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
