/**
 * @param {object} log
 */
export function formatBattleLog(log) {
  const lines = [
    `BATTLE ${log.battleId ?? 'unknown'}`,
    `Format: ${log.format ?? 'unknown'} v${log.version ?? '?'}`,
    `Ruleset: ${log.ruleset?.id ?? 'unknown'}`,
    `Ruleset Hash: ${log.ruleset?.hash ?? 'unknown'}`,
  ];
  if (log.label) lines.push(`Label: ${log.label}`);
  if (log.note) lines.push(`Note: ${log.note}`);
  if (log.setupResult && log.setupResult.status !== 'READY') {
    lines.push('');
    lines.push(`SETUP ${log.setupResult.status}`);
    if (log.setupResult.reason) lines.push(`Reason: ${log.setupResult.reason}`);
    if (log.setupResult.questionId) lines.push(`Question: ${log.setupResult.questionId}`);
  }
  for (const event of log.events ?? []) {
    lines.push('');
    lines.push(formatEvent(event));
  }
  lines.push('');
  lines.push(formatOutcome(log.finalState?.outcome));
  return `${lines.join('\n')}\n`;
}

/**
 * @param {object} diff
 */
export function formatDiff(diff) {
  if (!diff) return '';
  if (diff.equal) return 'EQUAL\nchanges: 0\n';
  const shown = diff.changes.slice(0, 40);
  const lines = ['DIFFERENT', `changes: ${diff.changes.length}`];
  for (const change of shown) {
    lines.push(change.path || '$');
    if (change.kind === 'added') lines.push(`  added: ${preview(change.right)}`);
    else if (change.kind === 'removed') lines.push(`  removed: ${preview(change.left)}`);
    else {
      lines.push(`  left: ${preview(change.left)}`);
      lines.push(`  right: ${preview(change.right)}`);
    }
  }
  if (diff.changes.length > shown.length) {
    lines.push(`… ${diff.changes.length - shown.length} more changes`);
  }
  return `${lines.join('\n')}\n`;
}

/**
 * @param {{ consistent: boolean, findings: object[] }} report
 */
export function formatReport(report) {
  const lines = [report.consistent ? 'CONSISTENT' : 'INCONSISTENT', `findings: ${report.findings.length}`];
  for (const finding of report.findings) {
    const where = finding.eventIndex === undefined ? '' : ` event ${finding.eventIndex}`;
    const phase = finding.phase ? ` ${finding.phase}` : '';
    lines.push(`${finding.code}${where}${phase}: ${finding.message}`);
    if (finding.diff && !finding.diff.equal) lines.push(formatDiff(finding.diff).trimEnd());
  }
  return `${lines.join('\n')}\n`;
}

/**
 * @param {object} event
 */
function formatEvent(event) {
  const before = event.before;
  const active = before?.activeSideId ?? 'unknown';
  const turn = String(before?.turnIndex ?? 0).padStart(2, '0');
  const lines = [`TURN ${turn}`, `Active Team: ${active}`, `AP: ${apText(before, active)}`];
  if (Array.isArray(before?.activeAvatarIds)) {
    lines.push(`Active Avatars: ${before.activeAvatarIds.join(', ')}`);
  }
  lines.push(`Action: ${actionName(event)}`);
  lines.push(`Result: ${event.result?.status ?? 'UNKNOWN'}`);
  if (event.result?.reason) lines.push(`Reason: ${event.result.reason}`);
  if (event.result?.questionId) lines.push(`Question: ${event.result.questionId}`);
  const cost = event.result?.cost ?? event.result?.play?.cost;
  if (Number.isInteger(cost)) lines.push(`Cost: ${cost}`);
  if (event.result && Object.prototype.hasOwnProperty.call(event.result, 'apAfter')) {
    const after = event.result.apAfter === null ? 'null' : String(event.result.apAfter);
    if (after !== apText(before, active)) lines.push(`AP After: ${after}`);
  }
  if (event.op === 'endTurn' && event.result?.status === 'TURN_ENDED') {
    lines.push(`Next Team: ${event.result.activeSideId}`);
    lines.push(`Next AP: ${event.result.ap}`);
  }
  return lines.join('\n');
}

/**
 * @param {object | null | undefined} before
 * @param {string} active
 */
function apText(before, active) {
  if (!before?.ap || !Object.prototype.hasOwnProperty.call(before.ap, active)) return 'n/a';
  if (before.ap[active] === null) return 'null';
  return String(before.ap[active]);
}

/**
 * @param {object} event
 */
function actionName(event) {
  const input = event.input ?? {};
  if (event.op === 'endTurn') return 'END_TURN';
  if (event.op === 'evaluate') return 'EVALUATE';
  if (event.op === 'mark') return `MARK ${input.avatarId} ${input.marker}=${input.value}`;
  if (typeof input.cardId === 'string') return input.cardId;
  return event.op ?? 'UNKNOWN';
}

/**
 * @param {object | undefined} outcome
 */
function formatOutcome(outcome) {
  if (!outcome) return 'OUTCOME unavailable';
  if (outcome.status !== 'decided') return `OUTCOME ${outcome.status}`;
  const lines = ['OUTCOME decided', `Winner: ${outcome.winnerSideId}`, `Loser: ${outcome.loserSideId}`];
  const verdict = Object.entries(outcome.verdict ?? {})
    .map(([side, value]) => `${side}=${value}`)
    .join(' ');
  if (verdict) lines.push(`Verdict: ${verdict}`);
  return lines.join('\n');
}

/**
 * @param {unknown} value
 */
function preview(value) {
  const text = JSON.stringify(value);
  if (text === undefined) return 'undefined';
  if (text.length > 180) return `${text.slice(0, 177)}...`;
  return text;
}
