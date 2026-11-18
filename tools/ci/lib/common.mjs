import { appendFileSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKIP_DIRECTORIES = new Set(['.git', 'node_modules', 'coverage']);

/**
 * @param {unknown} value
 */
export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * @param {string} root
 * @param {string} file
 */
export function relativePosix(root, file) {
  return relative(root, file).split(sep).join('/');
}

/**
 * @param {string} root
 * @param {string} file
 * @param {string} directory
 */
export function isUnder(root, file, directory) {
  const rel = relativePosix(root, file);
  return rel === directory || rel.startsWith(`${directory}/`);
}

/**
 * @param {string} root
 * @param {string} extension
 * @returns {string[]}
 */
export function walkFiles(root, extension) {
  const files = [];
  function visit(directory) {
    let entries;
    try {
      entries = readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const full = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRECTORIES.has(entry.name)) continue;
        visit(full);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(extension)) files.push(full);
    }
  }
  visit(root);
  files.sort();
  return files;
}

/**
 * @param {string} file
 * @returns {{ ok: true, value: unknown } | { ok: false, error: string }}
 */
export function readJsonFile(file) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * @param {string} importMetaUrl
 * @param {number} levelsUp
 */
export function repoRootFrom(importMetaUrl, levelsUp) {
  return fileURLToPath(new URL(`../`.repeat(levelsUp), importMetaUrl));
}

export function invokedDirectly(importMetaUrl) {
  if (!process.argv[1]) return false;
  return realpathSync(fileURLToPath(importMetaUrl)) === realpathSync(process.argv[1]);
}

/**
 * @param {string[]} headers
 * @param {string[][]} rows
 */
export function markdownTable(headers, rows) {
  const render = (cells) => `| ${cells.map((cell) => String(cell ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ')} |`;
  return [render(headers), render(headers.map(() => '---')), ...rows.map((row) => render(row))].join('\n');
}

/**
 * @param {string} markdown
 * @param {{ stdout?: boolean }} [options]
 */
export function publishSummary(markdown, options = {}) {
  const text = markdown.endsWith('\n') ? markdown : `${markdown}\n`;
  if (options.stdout !== false) process.stdout.write(`${text}\n`);
  const expectedCheck = options.checkName;
  const activeCheck = process.env.CI_CHECK_NAME;
  const sameCheck = !expectedCheck || !activeCheck || expectedCheck === activeCheck;
  if (sameCheck && process.env.CI_WRITE_SUMMARY === '1' && process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
  }
}

/**
 * @param {string} name
 * @param {{ ok: boolean, notices?: string[], sections?: { title?: string, table?: { headers: string[], rows: string[][] }, body?: string }[] }} result
 */
export function formatCheck(name, result) {
  const lines = [`## ${name}`, '', `**Result: ${result.ok ? 'PASS' : 'FAIL'}**`, ''];
  for (const notice of result.notices ?? []) {
    lines.push(`> ${notice}`, '');
  }
  for (const section of result.sections ?? []) {
    if (section.title) lines.push(`### ${section.title}`, '');
    if (section.table) lines.push(markdownTable(section.table.headers, section.table.rows), '');
    if (section.body) lines.push(section.body, '');
  }
  return lines.join('\n');
}

/**
 * @param {string} message
 * @param {string} [file]
 */
export function annotate(message, file) {
  if (process.env.GITHUB_ACTIONS !== 'true') return;
  const safe = String(message).replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
  const loc = file ? ` file=${file}` : '';
  process.stdout.write(`::error${loc}::${safe}\n`);
}

/**
 * @param {string[][]} rows
 * @param {number} [limit]
 */
export function capRows(rows, limit = 30) {
  if (rows.length <= limit) return rows;
  const extra = rows.length - limit;
  return [...rows.slice(0, limit), [`… ${extra} more`, 'FAIL', 'See the job log for the full list']];
}
