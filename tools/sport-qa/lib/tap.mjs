/**
 * Pull the file-level summary and failure names out of a Node TAP reporter log.
 * Summary lines are authoritative. `not ok` lines marked TODO or SKIP are not failures.
 * @param {string} output
 */
export function parseTap(output) {
  const summary = {
    tests: 0,
    pass: 0,
    fail: 0,
    cancelled: 0,
    skipped: 0,
    todo: 0,
    duration_ms: 0,
  };
  const keys = Object.keys(summary);
  for (const line of output.split('\n')) {
    const match = line.match(/^# (tests|pass|fail|cancelled|skipped|todo|duration_ms) (\d+(?:\.\d+)?)\s*$/);
    if (!match || !keys.includes(match[1])) continue;
    summary[match[1]] = Number(match[2]);
  }

  const failures = [];
  const lines = output.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const bad = line.match(/^not ok \d+ - (.*)$/);
    if (!bad) continue;
    const name = bad[1].trim();
    if (/# TODO\b/.test(name) || /# SKIP\b/.test(name)) continue;
    let error = '';
    let location = '';
    for (let k = i + 1; k < Math.min(lines.length, i + 40); k += 1) {
      const row = lines[k];
      if (/^(ok |not ok |# Subtest:|# tests )/.test(row)) break;
      const err = row.match(/^(\s+)error: (.*)$/);
      if (err && !error) {
        const value = err[2].replace(/^['"]|['"]$/g, '').trim();
        if (value === '|-' || value === '|') {
          const block = [];
          for (let j = k + 1; j < Math.min(lines.length, i + 80); j += 1) {
            if (!/^\s{4}\S/.test(lines[j]) && !/^\s{4}$/.test(lines[j])) break;
            block.push(lines[j].trim());
          }
          error = block.join(' ');
        } else {
          error = value;
        }
      }
      const loc = row.match(/^\s+location: ['"]([^'"]+)['"]/);
      if (loc) location = loc[1];
    }
    if (!error) error = location;
    failures.push({ name: name.replace(/ # TODO$|# SKIP$/, ''), error: error.slice(0, 500) });
  }

  return { summary, failures };
}
