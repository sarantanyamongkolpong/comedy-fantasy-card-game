/**
 * @param {object} report
 */
export function formatTextReport(report) {
  const lines = [];
  lines.push('Comedy Fantasy Card Game — content validation');
  lines.push(`Result: ${report.ok ? 'OK' : 'FAIL'}`);
  lines.push(`Sources: ${report.sources.length > 0 ? report.sources.join(', ') : '(memory)'}`);
  if (report.manifest.checked) {
    const partial = report.manifest.partial
      ? ` (partial snapshot, ${report.manifest.assetCount} of ${report.manifest.sourceAssetCount})`
      : '';
    lines.push(`Manifest: ${report.manifest.path} — ${report.manifest.assetCount} assets${partial}`);
  } else {
    lines.push('Manifest: not checked');
  }
  lines.push('');
  lines.push('Records');
  lines.push(`  avatars        ${report.counts.avatars}`);
  lines.push(`  avatar cards   ${report.counts.avatarCards}`);
  lines.push(`  action cards   ${report.counts.actionCards}`);
  lines.push(`  equipment      ${report.counts.equipment}`);
  lines.push('');
  const duplicates = report.errors.filter((error) => error.code === 'DUPLICATE').length;
  lines.push(`Errors: ${report.errors.length}`);
  lines.push(`Duplicates: ${duplicates}`);
  lines.push(`Warnings: ${report.warnings.length}`);
  if (report.notes.length > 0) {
    lines.push('');
    lines.push('Notes');
    for (const note of report.notes) lines.push(`  ${note}`);
  }
  if (report.errors.length > 0) {
    lines.push('');
    lines.push('Errors');
    for (const error of report.errors) {
      lines.push(`  ${error.code}  ${error.path}`);
      lines.push(`    ${error.message}`);
    }
  }
  if (report.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings');
    for (const warning of report.warnings) {
      lines.push(`  ${warning.code}  ${warning.path}`);
      lines.push(`    ${warning.message}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

/**
 * @param {object} report
 */
export function formatJsonReport(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}
