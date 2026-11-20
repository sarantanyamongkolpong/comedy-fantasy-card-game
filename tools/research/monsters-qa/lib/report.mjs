import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { sourcePriority } from './check-sources.mjs';
import { assertAllowedWrite } from './repo.mjs';

/**
 * @param {object} input
 */
export function buildArtifacts(input) {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const records = input.agents.flatMap((agent) => agent.records);
  const parseErrors = records.filter((record) => record.parseError);
  const sources = input.sources || [];
  const dedupe = input.dedupe || [];
  const ip = input.ip || [];
  const sensitivity = input.sensitivity || [];
  const sensitivityById = new Map(sensitivity.map((row) => [`${row.agent}:${row.id}`, row]));

  const ipEntries = ip.map((row) => {
    const sens = sensitivityById.get(`${row.agent}:${row.id}`) || null;
    return {
      ...row,
      sensitivity: sens ? {
        level: sens.level,
        priority: sens.priority,
        reason: sens.reason,
        suggestedFix: sens.suggestedFix,
        hits: sens.hits,
      } : null,
    };
  });

  const findings = [
    ...sources.flatMap((row) => row.claims.map((claim) => finding(
      claim.priority || sourcePriority(claim.verdict),
      'source',
      claim.agent,
      claim.recordId,
      claim.path,
      `${claim.verdict}: ${row.url}`,
      claim.termsMissing?.length ? `Missing terms: ${claim.termsMissing.join(', ')}` : (row.flags || []).join(', '),
    ))).filter((item) => item.priority),
    ...dedupe.map((row) => finding(row.priority, 'dedupe', row.left.agent, row.left.id, row.left.path, row.kind, row.reason)),
    ...ipEntries.map((row) => finding(row.priority, 'ip', row.agent, row.id, row.path, row.risk, row.reason)),
    ...sensitivity.filter((row) => row.priority).map((row) => finding(row.priority, 'sensitivity', row.agent, row.id, row.path, row.level, row.reason)),
    ...parseErrors.map((row) => finding('P1', 'parse', row.agent, row.id, row.path, 'unreadable', row.parseError)),
  ].filter((item) => item.priority);

  const sourceAudit = {
    generatedAt,
    tool: 'tools/research/monsters-qa',
    disclaimer: 'URL verdicts are a research check. A verified page contains the claim’s key terms. It is not a legal or factual certification.',
    refs: input.agents.map(agentSummary),
    summary: sourceSummary(sources),
    urls: sources,
  };
  const ipAudit = {
    generatedAt,
    criteria: 'docs/research/monsters/qa/IP_REVIEW_GUIDE.md',
    disclaimer: 'Heuristic review for this project. Not a trademark search and not legal advice.',
    thresholds: input.thresholds || null,
    summary: {
      samples: ipEntries.length,
      high: ipEntries.filter((row) => row.risk === 'high').length,
      medium: ipEntries.filter((row) => row.risk === 'medium').length,
      low: ipEntries.filter((row) => row.risk === 'low').length,
      p0: ipEntries.filter((row) => row.priority === 'P0').length,
    },
    entries: ipEntries,
  };
  const dedupeAudit = { generatedAt, summary: { pairs: dedupe.length, p0: dedupe.filter((row) => row.priority === 'P0').length }, pairs: dedupe };
  const sensitivityAudit = {
    generatedAt,
    disclaimer: 'Editorial flags for worship, real tragedies, and ethnic caricature. A note on a research record means the source mentioned the subject. It is not by itself a failed source.',
    summary: {
      rows: sensitivity.length,
      high: sensitivity.filter((row) => row.level === 'high').length,
      review: sensitivity.filter((row) => row.level === 'review').length,
      note: sensitivity.filter((row) => row.level === 'note').length,
    },
    entries: sensitivity,
  };

  return {
    sourceAudit,
    ipAudit,
    dedupeAudit,
    sensitivityAudit,
    report: renderReport({ generatedAt, agents: input.agents, sourceAudit, ipAudit, dedupeAudit, sensitivityAudit, findings }),
    findings,
  };
}

/**
 * @param {string | null} priority
 * @param {string} kind
 * @param {string} agent
 * @param {string} id
 * @param {string} path
 * @param {string} verdict
 * @param {string} detail
 */
function finding(priority, kind, agent, id, path, verdict, detail) {
  return { priority, kind, agent, id, path, verdict, detail: detail || '' };
}

/**
 * @param {object} agent
 */
function agentSummary(agent) {
  return {
    agent: agent.id,
    branch: agent.branch,
    present: agent.present,
    ref: agent.ref,
    sha: agent.sha,
    files: agent.files,
    records: agent.records.length,
    error: agent.error || '',
  };
}

/**
 * @param {object[]} urls
 */
function sourceSummary(urls) {
  const summary = { urls: urls.length, verified: 0, failed: 0, partial: 0, blocked: 0, unrelated: 0, dead: 0, suspicious: 0, error: 0, unverified: 0 };
  for (const row of urls) {
    if (summary[row.verdict] != null) summary[row.verdict] += 1;
    if (row.verdict !== 'verified') summary.failed += 1;
  }
  return summary;
}

/**
 * @param {object} data
 */
function renderReport(data) {
  const lines = [];
  lines.push('# Monster research QA report');
  lines.push('');
  lines.push(`Generated: ${data.generatedAt}`);
  lines.push('');
  lines.push('This pass reads agents 01–08 with `git show`. It does not edit their branches. Verdicts are review heuristics for the monster research project. They are not legal advice and they are not a trademark clearance.');
  lines.push('');
  lines.push('P0 means a cited source is dead, unrelated, or looks fabricated, or a parody name repeats a protected or brand-distinctive name. P1 means the record needs a rewrite or a better source before it can be marked QA_PASSED. P2 is a distance or merge note.');
  lines.push('');
  lines.push('## Agents this pass');
  lines.push('');
  lines.push('| Agent | Branch | SHA | Files | Records |');
  lines.push('|---|---|---|---:|---:|');
  for (const agent of data.agents) {
    const sha = agent.sha ? agent.sha.slice(0, 12) : 'absent';
    const counted = (agent.records || []).filter((record) => record.kind !== 'empty-json' && !record.parseError).length;
    lines.push(`| ${agent.id} | ${agent.branch || agent.prefix} | ${sha} | ${agent.files?.length ?? 0} | ${counted} |`);
  }
  lines.push('');
  const counts = countPriorities(data.findings);
  lines.push(`Findings: **P0 ${counts.P0}**, **P1 ${counts.P1}**, **P2 ${counts.P2}**.`);
  lines.push('');
  lines.push(`Sources: ${data.sourceAudit.summary.urls} URLs, ${data.sourceAudit.summary.verified} verified, ${data.sourceAudit.summary.failed} failed or unverified.`);
  lines.push(`Creative samples in the IP table: ${data.ipAudit.summary.samples} (high ${data.ipAudit.summary.high}, medium ${data.ipAudit.summary.medium}, low ${data.ipAudit.summary.low}).`);
  lines.push('');
  lines.push('## P0');
  lines.push('');
  lines.push(renderFindings(data.findings.filter((item) => item.priority === 'P0')));
  lines.push('');
  lines.push('## P1');
  lines.push('');
  lines.push(renderGrouped(data.findings.filter((item) => item.priority === 'P1'), 'P1'));
  lines.push('');
  lines.push('## Per agent');
  lines.push('');
  for (const agent of data.agents) {
    lines.push(`### Agent ${agent.id} — ${agent.branch || agent.prefix}`);
    lines.push('');
    if (!agent.present) {
      lines.push('No remote branch at this pass.');
      lines.push('');
      continue;
    }
    if (agent.error) {
      lines.push(`Read error: ${agent.error}`);
      lines.push('');
    }
    const files = agent.files?.length ? agent.files.map((file) => `\`${file}\``).join(', ') : 'no text files under the owned prefix';
    lines.push(`SHA \`${agent.sha}\`. Files: ${files}.`);
    const own = data.findings.filter((item) => item.agent === agent.id);
    const inspirations = agent.records.filter((record) => record.kind === 'inspiration').length;
    const creative = agent.records.filter((record) => record.role === 'creative' && record.kind !== 'empty-json').length;
    const empty = agent.records.filter((record) => record.kind === 'empty-json');
    lines.push(`Inspirations ${inspirations}, creative records ${creative}, findings ${own.length}.`);
    if (empty.length) {
      lines.push(`JSON with no entry list (read, not a failed record): ${empty.map((record) => `\`${record.path}\``).join(', ')}.`);
    }
    if (own.length === 0) lines.push('No P0, P1, or P2 on the records loaded from this branch.');
    else lines.push(renderGrouped(own, `agent ${agent.id}`));
    lines.push('');
  }
  lines.push('## IP risk — phase-1 sample');
  lines.push('');
  const phase1 = data.ipAudit.entries.filter((row) => isPhase1Sample(row.id));
  const otherCreative = data.ipAudit.entries.filter((row) => !isPhase1Sample(row.id));
  if (phase1.length === 0) {
    lines.push('Agents 06 and 07 have not published the 15 normal/elite entries and 15 boss entries yet.');
  } else {
    lines.push(`${phase1.length} entries with ids M06-N / M06-E or BOS-MIN / BOS-MAIN / BOS-WORLD / BOS-SECRET. The phase-1 target is 30.`);
    lines.push('');
    lines.push(ipTable(phase1));
  }
  lines.push('');
  lines.push('## IP risk — other creative rows');
  lines.push('');
  if (otherCreative.length === 0) {
    lines.push('No other creative rows.');
  } else {
    const flagged = otherCreative.filter((row) => row.risk !== 'low' || row.priority || row.sensitivity);
    lines.push(`${otherCreative.length} other creative rows (research pitches and the name bank). ${flagged.length} are above low or carry a sensitivity flag. The rest are low and are listed only in \`ip_audit.json\`.`);
    lines.push('');
    lines.push(flagged.length === 0 ? 'None above low.' : ipTable(flagged));
  }
  lines.push('');
  lines.push('## Dedupe');
  lines.push('');
  lines.push(data.dedupeAudit.pairs.length === 0 ? 'No duplicate names or close concepts in the loaded records.' : renderPairs(data.dedupeAudit.pairs));
  lines.push('');
  lines.push('## Sensitivity');
  lines.push('');
  const actionable = data.sensitivityAudit.entries.filter((row) => row.level !== 'note');
  const notes = data.sensitivityAudit.entries.filter((row) => row.level === 'note');
  lines.push(actionable.length === 0 ? 'No sacred, tragedy, or stereotype flags above a note.' : renderSensitivity(actionable));
  lines.push('');
  lines.push(`Research notes (context, not a failed record): ${notes.length}.`);
  lines.push('');
  lines.push('## Reviewer pass');
  lines.push('');
  lines.push('These notes are from reading the phase-1 sample text. They are not extra tool thresholds. A low row can still be a watch.');
  lines.push('');
  lines.push('- **M06-N-003 Pestlehut** and **M06-N-004 Ledgermaw** each cite one URL, and both returned 403 (Britannica Scholars, British Museum schools page). The pages may be real. This pass could not read them, so those two entries have no verified source. Add a page the checker can read before QA_PASSED.');
  lines.push('- **M06-N-005 Claimbite** and **M06-N-006 Duty Puddle** name a protected game creature in the research block and refuse its signature shape in the art direction (no treasure chest; no teardrop, smile, or single bright color). The low score depends on the final art obeying those refusals.');
  lines.push('- **BOS-MAIN-05 Captain Encore** uses a transforming masked-rider pattern and says so in research. The picture refuses compound eyes, a motorcycle, and a copied belt. Do not let the final art pick those up.');
  lines.push('- **BOS-SECRET-02 Dame Compact** is the one sample the signature-visual rule raises: a compact, a ribbon costume, and a second pose. Leave off the school uniform, wand, and tiara, and consider a prop that is not a transformation compact.');
  lines.push('- **BOS-MAIN-04 Sir Stairweb** is far from the name Anansi. Do not add Akan religious iconography or a copied folk-art spider.');
  lines.push('- **BOS-WORLD-03 Sir Lotusbulk** takes the biblical beast and moves the joke to a loading dock. Do not mock the verse or the faith.');
  lines.push('- **Tubcritic** in the agent 06 name bank is the same name as agent 03’s pitch **Tub Critic**. It is not one of the 30 sample entries. Do not promote it.');
  lines.push('- Research notes for Kali, Wendigo, and the atomic-bomb context of a film monster stay in the source files. They are not comedy targets.');
  lines.push('');
  lines.push('## Reproduce');
  lines.push('');
  lines.push('```bash');
  lines.push('git fetch origin research/m01-classic-rpg research/m02-western research/m03-eastern research/m04-world-myth research/m05-anime-pop research/m06-parody research/m07-boss research/m08-lore');
  lines.push('node tools/research/monsters-qa/cli.mjs run --fetch');
  lines.push('```');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

/**
 * @param {object[]} findings
 */
function countPriorities(findings) {
  return {
    P0: findings.filter((item) => item.priority === 'P0').length,
    P1: findings.filter((item) => item.priority === 'P1').length,
    P2: findings.filter((item) => item.priority === 'P2').length,
  };
}

/**
 * @param {object[]} findings
 */
function renderFindings(findings) {
  if (findings.length === 0) return 'None.';
  return findings.map((item) => (
    `- **${item.priority}** ${item.kind} \`${item.agent}\` \`${item.id}\` (${item.verdict}) ${item.detail}`
  )).join('\n');
}

/**
 * Collapse blocked and unreachable source rows by host. Full rows stay in source_audit.json.
 * @param {object[]} findings
 * @param {string} label
 */
function renderGrouped(findings, label) {
  if (findings.length === 0) return 'None.';
  const grouped = findings.filter((item) => item.kind === 'source' && /^(blocked|error):/.test(item.verdict));
  const listed = findings.filter((item) => !grouped.includes(item));
  /** @type {Map<string, { count: number, sample: string }>} */
  const hosts = new Map();
  for (const item of grouped) {
    const split = item.verdict.indexOf(':');
    const verdict = item.verdict.slice(0, split);
    const url = item.verdict.slice(split + 1).trim();
    let host = 'unknown';
    try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { /* keep unknown */ }
    const key = `${verdict} ${host}`;
    const row = hosts.get(key) || { count: 0, sample: url };
    row.count += 1;
    hosts.set(key, row);
  }
  const lines = [];
  if (hosts.size > 0) {
    lines.push('Blocked or unreachable hosts are grouped. A block means the page could not be read. It is not a fabricated source. Every URL is in `source_audit.json`.');
    lines.push('');
    for (const [key, row] of [...hosts.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))) {
      lines.push(`- **P1** source \`${key}\` — ${row.count} URL(s). Example: ${row.sample}`);
    }
  }
  const cap = label.startsWith('agent') ? 25 : 60;
  if (listed.length > 0) {
    if (lines.length) lines.push('');
    lines.push(renderFindings(listed.slice(0, cap)));
    if (listed.length > cap) lines.push(`- ${listed.length - cap} more ${label} rows are in the JSON audits.`);
  }
  return lines.join('\n') || 'None.';
}

/**
 * @param {object[]} pairs
 */
function renderPairs(pairs) {
  return pairs.slice(0, 80).map((row) => (
    `- **${row.priority}** ${row.kind} (${row.score}): ${row.left.agent} “${row.left.name}” ↔ ${row.right.agent} “${row.right.name}”. ${row.reason}`
  )).join('\n');
}

/**
 * @param {object[]} rows
 */
function renderSensitivity(rows) {
  return rows.map((row) => (
    `- **${row.priority || row.level}** \`${row.agent}\` \`${row.id}\` “${row.name}”: ${row.reason} ${row.suggestedFix}`
  )).join('\n');
}

/**
 * @param {string} id
 */
function isPhase1Sample(id) {
  return /^M06-[NE]-\d+$/.test(id) || /^BOS-(MIN|MAIN|WORLD|SECRET)-\d+$/.test(id);
}

/**
 * @param {object[]} rows
 */
function ipTable(rows) {
  const lines = ['| Agent | ID | Parody name | Risk | Priority | Sensitivity | Why |', '|---|---|---|---|---|---|---|'];
  for (const row of rows) {
    const sens = row.sensitivity ? row.sensitivity.level : '';
    lines.push(`| ${row.agent} | ${cell(row.id)} | ${cell(row.parodyName || row.bossTitle)} | ${row.risk} | ${row.priority || ''} | ${sens} | ${cell(row.reason)} |`);
  }
  return lines.join('\n');
}

function cell(value) {
  return String(value ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
}

/**
 * @param {string} directory
 * @param {ReturnType<typeof buildArtifacts>} artifacts
 */
export function writeArtifacts(directory, artifacts) {
  const root = resolve(directory);
  const files = {
    'source_audit.json': artifacts.sourceAudit,
    'ip_audit.json': artifacts.ipAudit,
    'dedupe_audit.json': artifacts.dedupeAudit,
    'sensitivity_audit.json': artifacts.sensitivityAudit,
    'QA_REPORT.md': artifacts.report,
  };
  for (const [name, value] of Object.entries(files)) {
    const full = resolve(root, name);
    assertAllowedWrite(full);
    mkdirSync(dirname(full), { recursive: true });
    const body = typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`;
    writeFileSync(full, body);
  }
}
