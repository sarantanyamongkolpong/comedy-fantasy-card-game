import {
  ART_BRANCH,
  ART_COMMIT,
  ART_PR,
  INTEGRATION_BRANCH,
  SYSTEMS_BASE,
  SYSTEMS_BRANCH,
  SYSTEMS_PR,
} from './constants.js';

function cell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function tally(rows, key = 'status') {
  const counts = {};
  for (const row of rows) counts[row[key]] = (counts[row[key]] ?? 0) + 1;
  return counts;
}

/**
 * CLI status table. Wording stays stable across git and ART_ROOT loads.
 * @param {object} audit
 */
export function formatAudit(audit) {
  const lines = [];
  const counts = tally(audit.checks);
  lines.push('Comedy Fantasy Card Game — art/systems contract');
  lines.push(`art: ${audit.artCommit} (${ART_BRANCH}, PR #${ART_PR})`);
  lines.push(`systems base: ${SYSTEMS_BASE} (${SYSTEMS_BRANCH}, PR #${SYSTEMS_PR})`);
  lines.push(
    `assets ${audit.counts.assets}; ${Object.entries(audit.counts.byStatus)
      .map(([status, count]) => `${status} ${count}`)
      .join(', ')}`,
  );
  lines.push(`checks: ${Object.entries(counts).map(([status, count]) => `${status} ${count}`).join(', ')}`);
  lines.push('This audit is not PRODUCTION_READY.');
  lines.push('');
  lines.push(' #  Check                            Status');
  audit.checks.forEach((check, index) => {
    lines.push(`${String(index + 1).padStart(2, ' ')}  ${check.name.padEnd(32, ' ')} ${check.status}`);
  });
  lines.push('');
  lines.push('Specific issues');
  for (const issue of audit.specificIssues) {
    lines.push(`- ${issue.name.padEnd(36, ' ')} ${issue.status}`);
  }
  lines.push('');
  lines.push(`REQUIRES_ART_CHANGE rows: ${audit.artChanges.length}`);
  const byIssue = tally(audit.artChanges, 'issue');
  lines.push(Object.entries(byIssue).map(([issue, count]) => `${issue} ${count}`).join(', '));
  return lines.join('\n');
}

/**
 * @param {object} audit
 */
export function renderCompatibilityReport(audit) {
  const checkCounts = tally(audit.checks);
  const lines = [];
  lines.push('# Art / systems compatibility report');
  lines.push('');
  lines.push('Cross-check of the Mira art prototype and the systems loader. No art file is copied into this branch. The branches are not merged.');
  lines.push('');
  lines.push('| | |');
  lines.push('|---|---|');
  lines.push(`| Art branch | \`${ART_BRANCH}\` |`);
  lines.push(`| Art commit | \`${ART_COMMIT}\` |`);
  lines.push(`| Art pull request | #${ART_PR}, open, not merged |`);
  lines.push(`| Systems base | \`${SYSTEMS_BRANCH}\` \`${SYSTEMS_BASE}\` |`);
  lines.push(`| Systems pull request | #${SYSTEMS_PR}, open, not merged |`);
  lines.push(`| Integration branch | \`${INTEGRATION_BRANCH}\` |`);
  lines.push(`| Manifest rows | ${audit.counts.assets} |`);
  lines.push(
    `| Status counts | ${Object.entries(audit.counts.byStatus)
      .map(([status, count]) => `${status} ${count}`)
      .join(', ')} |`,
  );
  lines.push(`| Check tally | ${Object.entries(checkCounts).map(([status, count]) => `${status} ${count}`).join(', ')} |`);
  lines.push('| Implementation | Tested adapter and audit. Not PRODUCTION_READY. |');
  lines.push('');
  lines.push('The adapter in `src/integration/` copies shared item keys into `asset_id`, bundles the two rig files, and resolves rig layer basenames to `assets/characters/<ID>/sprite/<file>`. It leaves pipe-delimited slots unchanged, so the loader still returns `AMBIGUOUS_SLOT` until the caller passes a hand. It does not add stats, rarity, or AP costs.');
  lines.push('');
  lines.push('## Per-check status');
  lines.push('');
  lines.push('| # | Check | Status |');
  lines.push('|---|---|---|');
  audit.checks.forEach((check, index) => {
    lines.push(`| ${index + 1} | ${cell(check.name)} | ${check.status} |`);
  });
  lines.push('');
  lines.push('## Specific issues');
  lines.push('');
  lines.push('| Issue | Status | Evidence |');
  lines.push('|---|---|---|');
  for (const issue of audit.specificIssues) {
    lines.push(`| ${cell(issue.name)} | ${issue.status} | ${cell(issue.evidence)} |`);
  }
  lines.push('');
  lines.push('## Check evidence');
  lines.push('');
  audit.checks.forEach((check, index) => {
    lines.push(`### ${index + 1}. ${check.name}`);
    lines.push('');
    lines.push(`Status: **${check.status}**`);
    lines.push('');
    for (const line of check.evidence) lines.push(`- ${line}`);
    lines.push('');
  });
  lines.push('## Placement sample');
  lines.push('');
  lines.push('`origin = anchor − pivot + fit`. `matches` compares that origin to `native_origin` when the item records one.');
  lines.push('');
  lines.push('| Equipment | Avatar | Slot | Anchor | Matches | Reason |');
  lines.push('|---|---|---|---|---|---|');
  for (const row of audit.placements) {
    lines.push(
      `| ${cell(row.equipmentId)} | ${cell(row.avatarId)} | ${cell(row.slot ?? '')} | ${cell(row.anchorName ?? '')} | ${cell(row.matches === null ? '' : row.matches)} | ${cell(row.reason ?? '')} |`,
    );
  }
  lines.push('');
  lines.push('## Art changes');
  lines.push('');
  lines.push(`${audit.artChanges.length} rows are listed in \`docs/REQUIRED_CHANGES_FOR_MIRA.md\`.`);
  lines.push('');
  const byIssue = tally(audit.artChanges, 'issue');
  for (const [issue, count] of Object.entries(byIssue)) {
    lines.push(`- ${issue}: ${count}`);
  }
  lines.push('');
  lines.push('## Known issues');
  lines.push('');
  for (const line of audit.observations) lines.push(`- ${line}`);
  lines.push('');
  lines.push('## How to run');
  lines.push('');
  lines.push('From the repository root, with the art ref available locally:');
  lines.push('');
  lines.push('```bash');
  lines.push('node --test --test-reporter spec');
  lines.push('node tools/integration/fetch-art-contract.mjs');
  lines.push('```');
  lines.push('');
  lines.push('`node --test` reads the pinned art commit with `git show`. The fetch script checks that commit out into a temporary worktree, runs `git merge --no-commit`, runs the same suite against the files on disk, aborts the merge, and deletes the worktree.');
  lines.push('');
  lines.push('## CLI preview');
  lines.push('');
  lines.push('```text');
  lines.push(formatAudit(audit));
  lines.push('```');
  lines.push('');
  return lines.join('\n');
}

/**
 * @param {object} audit
 */
export function renderRequiredChangesDoc(audit) {
  const lines = [];
  lines.push('# Required art changes for Mira');
  lines.push('');
  lines.push(`These rows are the art-side edits that make the contract explicit. They were read from \`${ART_BRANCH}\` at \`${ART_COMMIT}\`. This branch does not edit those files.`);
  lines.push('');
  lines.push('The systems adapter already loads the current JSON. Placement for single-slot items matches recorded native origins. The dagger stays unresolved until a hand is chosen. Shared items resolve when the loader looks them up by object key.');
  lines.push('');
  lines.push(`Rows: ${audit.artChanges.length}. Status of every row: REQUIRES_ART_CHANGE.`);
  lines.push('');
  const issues = [...new Set(audit.artChanges.map((row) => row.issue))];
  for (const issue of issues) {
    const rows = audit.artChanges.filter((row) => row.issue === issue);
    lines.push(`## ${issue}`);
    lines.push('');
    lines.push('| File | Record | Field | Current | Required | Note |');
    lines.push('|---|---|---|---|---|---|');
    for (const row of rows) {
      lines.push(
        `| ${cell(row.file)} | ${cell(row.record)} | ${cell(row.field)} | ${cell(row.current)} | ${cell(row.required)} | ${cell(row.note)} |`,
      );
    }
    lines.push('');
  }
  lines.push('## Machine-readable changes');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify(audit.artChanges, null, 2));
  lines.push('```');
  lines.push('');
  return lines.join('\n');
}
