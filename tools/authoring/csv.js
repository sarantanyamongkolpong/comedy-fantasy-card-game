import { JSON_COLUMNS, NUMERIC_COLUMNS } from './columns.js';

/**
 * @param {string} text
 * @returns {string[][]}
 */
export function parseCsv(text) {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (inQuotes) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
          continue;
        }
        inQuotes = false;
        continue;
      }
      field += char;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      continue;
    }
    field += char;
  }
  if (inQuotes) throw new Error('CSV has an unclosed quote');
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * @param {object} record
 * @param {string} path
 */
function getPath(record, path) {
  const parts = path.split('.');
  let cursor = record;
  for (const part of parts) {
    if (cursor === null || cursor === undefined || typeof cursor !== 'object') return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

/**
 * @param {object} record
 * @param {string} path
 * @param {unknown} value
 */
function setPath(record, path, value) {
  const parts = path.split('.');
  let cursor = record;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (!Object.prototype.hasOwnProperty.call(cursor, part) || cursor[part] === null || typeof cursor[part] !== 'object') {
      cursor[part] = {};
    }
    cursor = cursor[part];
  }
  cursor[parts[parts.length - 1]] = value;
}

/**
 * Empty numeric and other scalar cells become null, never 0.
 * "0" is the integer 0. "TBD" and other non-canonical tokens stay strings.
 * @param {string} header
 * @param {string} raw
 */
export function parseCell(header, raw) {
  const text = raw.trim();
  if (JSON_COLUMNS.has(header)) {
    if (text === '') return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  if (text === '' || text === 'null') return null;
  if (NUMERIC_COLUMNS.has(header)) {
    if (/^-?\d+$/.test(text)) {
      const value = Number(text);
      if (Object.is(value, -0)) return text;
      if (String(value) !== text) return text;
      return value;
    }
    return text;
  }
  return text;
}

/**
 * @param {string} text
 * @returns {object[]}
 */
export function recordsFromCsv(text) {
  const rows = parseCsv(text);
  if (rows.length === 0) throw new Error('CSV is empty');
  const headers = rows[0].map((cell) => cell.trim());
  if (headers.some((header) => header.length === 0)) throw new Error('CSV header has an empty column');
  const seen = new Set();
  for (const header of headers) {
    if (seen.has(header)) throw new Error(`CSV header repeats "${header}"`);
    seen.add(header);
  }
  const records = [];
  for (let index = 1; index < rows.length; index += 1) {
    const cells = rows[index];
    if (cells.length === 1 && cells[0].trim() === '') continue;
    if (cells.length !== headers.length) {
      throw new Error(`CSV row ${index + 1} has ${cells.length} columns; header has ${headers.length}`);
    }
    const record = {};
    for (let column = 0; column < headers.length; column += 1) {
      const header = headers[column];
      const value = parseCell(header, cells[column]);
      if (value === undefined) continue;
      setPath(record, header, value);
    }
    records.push(record);
  }
  return records;
}

/**
 * @param {unknown} value
 */
function formatCell(column, value) {
  if (value === undefined) return '';
  if (JSON_COLUMNS.has(column)) return JSON.stringify(value);
  if (value === null) return '';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

/**
 * @param {string} value
 */
function escapeCell(value) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/**
 * @param {object[]} records
 * @param {readonly string[]} columns
 * @param {{ bom?: boolean }} [options]
 */
export function recordsToCsv(records, columns, options = {}) {
  const lines = [columns.map((column) => escapeCell(column)).join(',')];
  for (const record of records) {
    const cells = columns.map((column) => escapeCell(formatCell(column, getPath(record, column))));
    lines.push(cells.join(','));
  }
  const body = `${lines.join('\n')}\n`;
  return options.bom ? `\uFEFF${body}` : body;
}
