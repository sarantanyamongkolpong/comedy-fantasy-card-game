/**
 * Small OOXML workbook writer and reader.
 * exceljs and openpyxl are not installed, and this agent does not add
 * package dependencies. Node's zlib is enough for the research workbook.
 */

import { crc32, deflateRawSync, inflateRawSync } from 'node:zlib';

const DOS_TIME = 0;
const DOS_DATE = ((2026 - 1980) << 9) | (11 << 5) | 20;

/**
 * @param {{ name: string, rows: string[][], widths?: number[] }[]} sheets
 * @returns {Buffer}
 */
export function buildXlsx(sheets) {
  const shared = new SharedStrings();
  const files = [];
  const sheetParts = sheets.map((sheet, index) => {
    const path = `xl/worksheets/sheet${index + 1}.xml`;
    return { path, xml: sheetXml(sheet, shared) };
  });
  files.push({ name: '[Content_Types].xml', data: contentTypes(sheets.length) });
  files.push({ name: '_rels/.rels', data: rootRels() });
  files.push({ name: 'docProps/core.xml', data: coreProps() });
  files.push({ name: 'docProps/app.xml', data: appProps() });
  files.push({ name: 'xl/workbook.xml', data: workbookXml(sheets) });
  files.push({ name: 'xl/_rels/workbook.xml.rels', data: workbookRels(sheets.length) });
  files.push({ name: 'xl/styles.xml', data: stylesXml() });
  files.push({ name: 'xl/sharedStrings.xml', data: shared.toXml() });
  for (const part of sheetParts) files.push({ name: part.path, data: part.xml });
  return zip(files);
}

/**
 * @param {Buffer} buffer
 * @returns {{ name: string, rows: string[][] }[]}
 */
export function readXlsx(buffer) {
  const parts = unzip(buffer);
  const workbook = parts.get('xl/workbook.xml') ?? '';
  const rels = parts.get('xl/_rels/workbook.xml.rels') ?? '';
  const shared = parseSharedStrings(parts.get('xl/sharedStrings.xml') ?? '');
  const relById = new Map();
  for (const match of rels.matchAll(/<Relationship\b([^>]*)\/>/g)) {
    const id = attr(match[1], 'Id');
    const target = attr(match[1], 'Target');
    if (id && target) relById.set(id, target.replace(/^\//, ''));
  }
  const sheets = [];
  for (const match of workbook.matchAll(/<sheet\b([^>]*)\/>/g)) {
    const name = attr(match[1], 'name');
    const rel = attr(match[1], 'r:id') ?? attr(match[1], 'id');
    const target = relById.get(rel ?? '') ?? '';
    const path = target.startsWith('xl/') ? target : `xl/${target}`;
    sheets.push({ name: name ?? '', rows: parseSheet(parts.get(path) ?? '', shared) });
  }
  return sheets;
}

class SharedStrings {
  constructor() {
    this.values = [];
    this.index = new Map();
  }

  /** @param {string} value */
  add(value) {
    const text = sanitize(value);
    const existing = this.index.get(text);
    if (existing != null) return existing;
    const id = this.values.length;
    this.values.push(text);
    this.index.set(text, id);
    return id;
  }

  toXml() {
    const items = this.values.map((value) => {
      const space = /^\s|\s$|\n/.test(value) ? ' xml:space="preserve"' : '';
      return `<si><t${space}>${escapeXml(value)}</t></si>`;
    });
    return xml(
      `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${this.values.length}" uniqueCount="${this.values.length}">${items.join('')}</sst>`,
    );
  }
}

/**
 * @param {{ name: string, rows: string[][], widths?: number[] }} sheet
 * @param {SharedStrings} shared
 */
function sheetXml(sheet, shared) {
  const widthCount = Math.max(sheet.rows[0]?.length ?? 1, 1);
  const cols = [];
  for (let index = 0; index < widthCount; index += 1) {
    const width = sheet.widths?.[index] ?? 22;
    cols.push(`<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`);
  }
  const lastColumn = columnName(widthCount - 1);
  const lastRow = Math.max(sheet.rows.length, 1);
  const rows = sheet.rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      if (value == null || value === '') return '';
      const id = shared.add(String(value));
      const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
      const style = rowIndex === 0 ? ' s="1"' : '';
      return `<c r="${ref}" t="s"${style}><v>${id}</v></c>`;
    }).join('');
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  });
  return xml(
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
      `<dimension ref="A1:${lastColumn}${lastRow}"/>` +
      `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
      `<cols>${cols.join('')}</cols>` +
      `<sheetData>${rows.join('')}</sheetData>` +
      `<autoFilter ref="A1:${lastColumn}${lastRow}"/>` +
    `</worksheet>`,
  );
}

/** @param {{ name: string }[]} sheets */
function workbookXml(sheets) {
  const items = sheets.map((sheet, index) => (
    `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
  ));
  return xml(
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
      `<sheets>${items.join('')}</sheets>` +
    `</workbook>`,
  );
}

/** @param {number} count */
function workbookRels(count) {
  const sheets = [];
  for (let index = 0; index < count; index += 1) {
    sheets.push(`<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`);
  }
  const styleId = count + 1;
  const stringId = count + 2;
  return xml(
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      sheets.join('') +
      `<Relationship Id="rId${styleId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      `<Relationship Id="rId${stringId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>` +
    `</Relationships>`,
  );
}

function stylesXml() {
  return xml(
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
      `<fonts count="2">` +
        `<font><sz val="11"/><name val="Calibri"/></font>` +
        `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>` +
      `</fonts>` +
      `<fills count="3">` +
        `<fill><patternFill patternType="none"/></fill>` +
        `<fill><patternFill patternType="gray125"/></fill>` +
        `<fill><patternFill patternType="solid"><fgColor rgb="FF1F4E79"/><bgColor indexed="64"/></patternFill></fill>` +
      `</fills>` +
      `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
      `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
      `<cellXfs count="2">` +
        `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
        `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>` +
      `</cellXfs>` +
    `</styleSheet>`,
  );
}

/** @param {number} sheetCount */
function contentTypes(sheetCount) {
  const sheets = [];
  for (let index = 0; index < sheetCount; index += 1) {
    sheets.push(`<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);
  }
  return xml(
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
      `<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>` +
      sheets.join('') +
      `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>` +
      `<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>` +
    `</Types>`,
  );
}

function rootRels() {
  return xml(
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
      `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>` +
      `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>` +
    `</Relationships>`,
  );
}

function coreProps() {
  return xml(
    `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
      `<dc:title>Monster research database</dc:title>` +
      `<dc:creator>monster research tools</dc:creator>` +
      `<cp:lastModifiedBy>monster research tools</cp:lastModifiedBy>` +
      `<dcterms:created xsi:type="dcterms:W3CDTF">2026-11-20T00:00:00Z</dcterms:created>` +
      `<dcterms:modified xsi:type="dcterms:W3CDTF">2026-11-20T00:00:00Z</dcterms:modified>` +
    `</cp:coreProperties>`,
  );
}

function appProps() {
  return xml(
    `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>monster research tools</Application></Properties>`,
  );
}

/** @param {string} body */
function xml(body) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${body}`;
}

/** @param {string} value */
function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/** @param {string} value */
function sanitize(value) {
  return String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

/** @param {number} index */
export function columnName(index) {
  let n = index + 1;
  let name = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

/**
 * @param {{ name: string, data: string }[]} files
 */
function zip(files) {
  /** @type {Buffer[]} */
  const locals = [];
  /** @type {Buffer[]} */
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name, 'utf8');
    const raw = Buffer.from(file.data, 'utf8');
    const compressed = deflateRawSync(raw);
    const store = compressed.length >= raw.length;
    const method = store ? 0 : 8;
    const payload = store ? raw : compressed;
    const crc = crc32(raw) >>> 0;
    const local = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0x0800),
      u16(method),
      u16(DOS_TIME),
      u16(DOS_DATE),
      u32(crc),
      u32(payload.length),
      u32(raw.length),
      u16(name.length),
      u16(0),
      name,
      payload,
    ]);
    locals.push(local);
    centrals.push(Buffer.concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0x0800),
      u16(method),
      u16(DOS_TIME),
      u16(DOS_DATE),
      u32(crc),
      u32(payload.length),
      u32(raw.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ]));
    offset += local.length;
  }
  const central = Buffer.concat(centrals);
  const eocd = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(central.length),
    u32(offset),
    u16(0),
  ]);
  return Buffer.concat([...locals, central, eocd]);
}

/** @param {Buffer} buffer @returns {Map<string, string>} */
function unzip(buffer) {
  const eocd = findEocd(buffer);
  const count = buffer.readUInt16LE(eocd + 10);
  let cursor = buffer.readUInt32LE(eocd + 16);
  /** @type {Map<string, string>} */
  const files = new Map();
  for (let index = 0; index < count; index += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error('Bad zip central directory');
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.toString('utf8', cursor + 46, cursor + 46 + nameLength);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const payload = buffer.subarray(dataStart, dataStart + compressedSize);
    const raw = method === 0 ? payload : inflateRawSync(payload);
    files.set(name, Buffer.from(raw).toString('utf8'));
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

/** @param {Buffer} buffer */
function findEocd(buffer) {
  const min = Math.max(0, buffer.length - 22 - 0xffff);
  for (let offset = buffer.length - 22; offset >= min; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  throw new Error('Zip end of central directory not found');
}

/** @param {string} xmlText */
function parseSharedStrings(xmlText) {
  /** @type {string[]} */
  const values = [];
  for (const match of xmlText.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) {
    const texts = [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((item) => decodeXml(item[1]));
    values.push(texts.join(''));
  }
  return values;
}

/** @param {string} xmlText @param {string[]} shared */
function parseSheet(xmlText, shared) {
  /** @type {Map<number, Map<number, string>>} */
  const grid = new Map();
  let maxRow = 0;
  let maxColumn = 0;
  for (const match of xmlText.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const ref = attr(match[1], 'r');
    if (!ref) continue;
    const parsed = parseRef(ref);
    if (!parsed) continue;
    const type = attr(match[1], 't');
    const valueMatch = match[2] ? /<v>([\s\S]*?)<\/v>/.exec(match[2]) : null;
    let text = '';
    if (valueMatch) {
      const raw = decodeXml(valueMatch[1]);
      text = type === 's' ? (shared[Number(raw)] ?? '') : raw;
    }
    if (!grid.has(parsed.row)) grid.set(parsed.row, new Map());
    grid.get(parsed.row).set(parsed.column, text);
    maxRow = Math.max(maxRow, parsed.row);
    maxColumn = Math.max(maxColumn, parsed.column);
  }
  /** @type {string[][]} */
  const rows = [];
  for (let row = 1; row <= maxRow; row += 1) {
    const line = [];
    const cells = grid.get(row) ?? new Map();
    for (let column = 0; column <= maxColumn; column += 1) line.push(cells.get(column) ?? '');
    rows.push(line);
  }
  return rows;
}

/** @param {string} ref */
function parseRef(ref) {
  const match = /^([A-Z]+)([0-9]+)$/.exec(ref);
  if (!match) return null;
  let column = 0;
  for (const char of match[1]) column = column * 26 + (char.charCodeAt(0) - 64);
  return { column: column - 1, row: Number(match[2]) };
}

/** @param {string} source @param {string} name */
function attr(source, name) {
  const match = new RegExp(`${name}="([^"]*)"`).exec(source);
  return match ? decodeXml(match[1]) : null;
}

/** @param {string} text */
function decodeXml(text) {
  return text
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&');
}

function u16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function u32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0);
  return buffer;
}
