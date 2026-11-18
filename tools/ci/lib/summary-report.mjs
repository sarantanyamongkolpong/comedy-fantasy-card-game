import { basename, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownTable } from './common.mjs';

/**
 * Node 20 reports the file itself as a test whose name is the filename.
 * @param {object | undefined} data
 */
function isFileWrapper(data) {
  if (!data?.file || !data?.name) return false;
  return data.name === data.file || data.name === basename(data.file);
}

/**
 * Node 22 emits test:summary. Node 20 does not, so pass/fail events are counted too.
 * @param {AsyncIterable<{ type: string, data?: object }>} source
 */
export async function collectTestEvents(source) {
  const files = [];
  const failures = [];
  const buckets = new Map();
  let rollup = null;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  for await (const event of source) {
    if (event.type === 'test:summary') {
      if (event.data?.file) files.push(event.data);
      else rollup = event.data ?? null;
      continue;
    }
    if (event.type !== 'test:pass' && event.type !== 'test:fail') continue;
    const data = event.data ?? {};
    if (isFileWrapper(data)) continue;
    const failureType = data.details?.error?.failureType;
    if (failureType === 'subtestsFailed') continue;
    const file = data.file || '(unknown file)';
    const bucket = buckets.get(file) ?? { file, passed: 0, failed: 0, skipped: 0 };
    if (event.type === 'test:pass' && (data.skip || data.todo)) {
      skipped += 1;
      bucket.skipped += 1;
    } else if (event.type === 'test:pass') {
      passed += 1;
      bucket.passed += 1;
    } else {
      failed += 1;
      bucket.failed += 1;
      failures.push(data);
    }
    buckets.set(file, bucket);
  }
  return { files, failures, rollup, passed, failed, skipped, buckets: [...buckets.values()] };
}

/**
 * @param {string} file
 * @param {string} cwd
 */
function displayFile(file, cwd) {
  if (!file) return '(unknown file)';
  let path = file;
  if (path.startsWith('file://')) path = fileURLToPath(path);
  const rel = relative(cwd, path);
  if (!rel || rel.startsWith('..')) return path.split(sep).join('/');
  return rel.split(sep).join('/');
}

/**
 * @param {{ files: object[], failures: object[], rollup: object | null }} collected
 * @param {{ cwd?: string, nodeLabel?: string }} [options]
 */
export function renderTestReport(collected, options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const nodeLabel = options.nodeLabel ?? process.versions.node;
  const counts = collected.rollup?.counts;
  const eventTests = (collected.passed ?? 0) + (collected.failed ?? 0) + (collected.skipped ?? 0);
  const discovered = counts?.tests ?? eventTests;
  const passed = counts?.passed ?? collected.passed ?? 0;
  const failed = counts?.failed ?? collected.failed ?? collected.failures.length;
  const skipped = counts ? (counts.skipped ?? 0) + (counts.todo ?? 0) : (collected.skipped ?? 0);
  const duration = collected.rollup?.duration_ms ?? collected.files.reduce((sum, file) => sum + (file.duration_ms ?? 0), 0);
  const durationKnown = collected.rollup?.duration_ms != null || collected.files.some((file) => file.duration_ms != null);
  const success = collected.rollup ? collected.rollup.success !== false : failed === 0;
  const ok = discovered > 0 && failed === 0 && success;

  const summaryRows = collected.files.map((file) => [
    displayFile(file.file, cwd),
    String(file.counts?.passed ?? 0),
    String(file.counts?.failed ?? 0),
    String((file.counts?.skipped ?? 0) + (file.counts?.todo ?? 0)),
  ]);
  const bucketRows = (collected.buckets ?? []).map((bucket) => [
    displayFile(bucket.file, cwd),
    String(bucket.passed),
    String(bucket.failed),
    String(bucket.skipped),
  ]);
  const fileRows = (summaryRows.length > 0 ? summaryRows : bucketRows).sort((a, b) => a[0].localeCompare(b[0]));

  const failureLines = collected.failures.slice(0, 30).map((failure) => {
    const file = displayFile(failure.file, cwd);
    const line = failure.line ? `:${failure.line}` : '';
    const message = String(failure.details?.error?.message ?? 'failed').replace(/\s+/g, ' ').trim();
    return `- \`${file}${line}\` ${failure.name}: ${message}`;
  });

  const lines = [
    `### Node.js ${nodeLabel}`,
    '',
    `**Result: ${ok ? 'PASS' : 'FAIL'}**`,
    '',
  ];
  if (discovered === 0) {
    lines.push('No tests were discovered. `node --test` with no file list should find `*.test.js` files anywhere in the checkout, including later folders such as `tests/stress`, `tests/integration`, `content`, and `tools/replay`.', '');
  }
  lines.push(markdownTable(
    ['Tests', 'Passed', 'Failed', 'Skipped', 'Duration'],
    [[String(discovered), String(passed), String(failed), String(skipped), durationKnown ? `${Math.round(duration)} ms` : '—']],
  ), '');
  if (fileRows.length > 0) {
    lines.push('#### Files', '', markdownTable(['File', 'Passed', 'Failed', 'Skipped'], fileRows), '');
  }
  if (failureLines.length > 0) {
    lines.push('#### Failures', '', failureLines.join('\n'), '');
  }

  const annotations = collected.failures.slice(0, 30).map((failure) => {
    const file = displayFile(failure.file, cwd);
    const message = `${failure.name}: ${String(failure.details?.error?.message ?? 'failed').replace(/\s+/g, ' ').trim()}`;
    return { file, line: failure.line, message };
  });

  return { ok, markdown: lines.join('\n'), annotations, discovered, failed };
}

/**
 * @param {AsyncIterable<{ type: string, data?: object }>} source
 * @param {{ checkName?: string, nodeLabel?: string, summaryFile?: string, yieldMarkdown?: boolean, cwd?: string }} options
 */
export async function* reportTests(source, options = {}) {
  const collected = await collectTestEvents(source);
  const rendered = renderTestReport(collected, options);
  if (options.summaryFile) {
    const { appendFileSync } = await import('node:fs');
    const text = rendered.markdown.endsWith('\n') ? rendered.markdown : `${rendered.markdown}\n`;
    appendFileSync(options.summaryFile, text);
  }
  if (options.yieldMarkdown) yield `${rendered.markdown}\n`;
  const checkName = options.checkName || 'SYSTEMS_TEST';
  const nodeLabel = options.nodeLabel || process.versions.node;
  yield `${checkName} (Node.js ${nodeLabel}): ${rendered.ok ? 'PASS' : 'FAIL'}\n`;
  if (process.env.GITHUB_ACTIONS === 'true') {
    for (const failure of rendered.annotations) {
      const message = failure.message.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
      const line = failure.line ? `,line=${failure.line}` : '';
      yield `::error file=${failure.file}${line}::${message}\n`;
    }
  }
}
