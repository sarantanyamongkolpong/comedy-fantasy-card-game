const RULE_ID = /\b(?:QA-\d+|CORE-\d+|GA-\d+|HOME-\d+|MAP-\d+|OPEN-\d+|OWNER-PLAT-\d+|AV_EX\d+|AUTO-\d+|D-ID|Target_Rule)\b/g;

const RANK = { fail: 0, todo: 1, skip: 2, pass: 3 };

/**
 * @param {string} output
 */
export function parseTap(output) {
  const tests = [];
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^(not )?ok \d+ - (.*)$/);
    if (!match) continue;
    let name = match[2];
    let status = match[1] ? 'fail' : 'pass';
    const directive = name.match(/ # (TODO|SKIP)(?: (.*))?$/);
    if (directive) {
      status = directive[1] === 'TODO' ? 'todo' : 'skip';
      name = name.slice(0, directive.index).trim();
    }
    if (/\.test\.(js|mjs)$/.test(name)) continue;
    tests.push({ name, status });
  }
  const summary = {};
  for (const key of ['tests', 'pass', 'fail', 'skipped', 'todo']) {
    const found = output.match(new RegExp(`^# ${key} (\\d+)$`, 'm'));
    if (found) summary[key] = Number(found[1]);
  }
  return { tests, summary };
}

/**
 * @param {{ fail?: number, todo?: number, skipped?: number, pass?: number }} summary
 */
export function overallStatus(summary) {
  if ((summary.fail ?? 0) > 0) return 'FAIL';
  if ((summary.todo ?? 0) > 0 || (summary.skipped ?? 0) > 0) return 'INCOMPLETE';
  if ((summary.pass ?? 0) > 0) return 'PASS';
  return 'FAIL';
}

/**
 * Strictest status wins so a passing constant check cannot hide a todo behavior test.
 * @param {{ name: string, status: string }[]} tests
 */
export function ruleMatrix(tests) {
  /** @type {Map<string, { status: string, tests: { name: string, status: string }[] }>} */
  const rules = new Map();
  for (const entry of tests) {
    const ids = entry.name.match(RULE_ID) ?? [];
    for (const id of new Set(ids)) {
      const row = rules.get(id) ?? { status: 'pass', tests: [] };
      row.tests.push(entry);
      if (RANK[entry.status] < RANK[row.status]) row.status = entry.status;
      rules.set(id, row);
    }
  }
  return [...rules.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'en'))
    .map(([id, row]) => ({ id, status: row.status.toUpperCase(), tests: row.tests }));
}

/**
 * @param {string} previous
 * @param {string} nodeVersion
 * @param {string} body
 */
export function upsertNodeSection(previous, nodeVersion, body) {
  const header = `## Node.js ${nodeVersion}`;
  const block = `${header}\n\n${body.trim()}\n`;
  const pattern = new RegExp(`## Node\\.js ${nodeVersion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n[\\s\\S]*?(?=\\n## Node\\.js |$)`);
  if (pattern.test(previous)) return previous.replace(pattern, `${block}\n`);
  return `${previous.trimEnd()}\n\n${block}`;
}

/**
 * @param {{ nodeVersion: string, status: string, summary: object, tests: { name: string, status: string }[], nestedRegression: string }} report
 */
export function renderNodeSection(report) {
  const summary = report.summary;
  const lines = [
    `**Result: ${report.status}**`,
    '',
    'INCOMPLETE means at least one test is still todo or skipped. It is not PASS. Todo and skip are not failures. FAIL is a real assertion failure. This report does not assign a ship status.',
    '',
    '| | count |',
    '| --- | --- |',
    `| pass | ${summary.pass ?? 0} |`,
    `| fail | ${summary.fail ?? 0} |`,
    `| todo | ${summary.todo ?? 0} |`,
    `| skip | ${summary.skipped ?? 0} |`,
    `| discovered | ${summary.tests ?? 0} |`,
    '',
  ];
  if (report.nestedRegression) {
    lines.push(report.nestedRegression, '');
  }
  const matrix = ruleMatrix(report.tests);
  lines.push('### Rule matrix', '', '| Rule | Status |', '| --- | --- |');
  for (const row of matrix) lines.push(`| ${row.id} | ${row.status} |`);
  lines.push('');
  const failing = report.tests.filter((entry) => entry.status === 'fail');
  if (failing.length > 0) {
    lines.push('### Failures', '');
    for (const entry of failing) lines.push(`- ${entry.name}`);
    lines.push('');
  }
  return lines.join('\n');
}
