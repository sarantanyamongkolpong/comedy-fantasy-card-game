#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { loadCatalogs } from './catalog.js';
import { COLLECTION_BY_KIND, COLUMNS, KIND_BY_COLLECTION, normalizeKind } from './columns.js';
import { recordsFromCsv, recordsToCsv } from './csv.js';
import { defaultManifestPath, defaultTemplatesDir } from './paths.js';
import { formatJsonReport, formatTextReport } from './report.js';
import { loadTemplates, materializeCatalog } from './templates.js';
import { readManifest, validateCatalog } from './validate-catalog.js';

const CSV_FILE = Object.freeze({
  avatar: 'avatars.csv',
  'avatar-card': 'avatar-cards.csv',
  'action-card': 'action-cards.csv',
  equipment: 'equipment.csv',
});

const USAGE = `Usage:
  node tools/authoring/cli.js validate [--manifest <file>] [--no-manifest] [--format text|json|both] [--templates <dir>] <file-or-dir>...
  node tools/authoring/cli.js materialize [--out <file>] [--templates <dir>] <file-or-dir>...
  node tools/authoring/cli.js export (--kind <kind> --out <file.csv> | --out-dir <dir>) [--bom] [--templates <dir>] <catalog.json>
  node tools/authoring/cli.js import --kind <kind> [--out <file.json>] [--templates <dir>] <file.csv>

Kinds: avatar, avatar-card, action-card, equipment.
The schema in src/schema is the authority. This tool imports those validators.
Null and TBD stay null and TBD. An empty CSV cell does not become 0.
The Owner's Excel master stays outside this repo. CSV is a bridge only.
`;

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const args = {
    _: [],
    format: 'text',
    manifest: undefined,
    noManifest: false,
    bom: false,
    kind: undefined,
    out: undefined,
    outDir: undefined,
    templates: undefined,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--help' || token === '-h') {
      args.help = true;
      continue;
    }
    if (token === '--no-manifest') {
      args.noManifest = true;
      continue;
    }
    if (token === '--bom') {
      args.bom = true;
      continue;
    }
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[index + 1];
      if (next === undefined || next.startsWith('--')) {
        throw new Error(`Missing value for --${key}`);
      }
      index += 1;
      if (key === 'format') args.format = next;
      else if (key === 'manifest') args.manifest = next;
      else if (key === 'kind') args.kind = next;
      else if (key === 'out') args.out = next;
      else if (key === 'out-dir') args.outDir = next;
      else if (key === 'templates') args.templates = next;
      else throw new Error(`Unknown option --${key}`);
      continue;
    }
    args._.push(token);
  }
  return args;
}

/**
 * @param {string} text
 */
function writeOut(text, outPath) {
  if (!outPath) {
    process.stdout.write(text);
    return;
  }
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, text);
}

/**
 * @param {object} args
 */
function displayPath(file) {
  if (!file) return file;
  const rel = relative(process.cwd(), file);
  if (!rel || rel.startsWith('..')) return file;
  return rel;
}

function templatesFrom(args) {
  return loadTemplates(args.templates ? resolve(args.templates) : defaultTemplatesDir);
}

/**
 * @param {object} args
 */
function manifestFrom(args) {
  if (args.noManifest) return { manifest: null, manifestPath: null };
  const manifestPath = resolve(args.manifest ?? defaultManifestPath);
  return { manifest: readManifest(manifestPath), manifestPath };
}

/**
 * @param {object} args
 */
function commandValidate(args) {
  if (!['text', 'json', 'both'].includes(args.format)) {
    throw new Error(`Unknown --format "${args.format}". Expected text, json, or both.`);
  }
  if (args._.length === 0) throw new Error('validate needs a catalog file or directory');
  const catalog = loadCatalogs(args._.map((target) => resolve(target)));
  const { manifest, manifestPath } = manifestFrom(args);
  const { report } = validateCatalog(catalog, {
    templates: templatesFrom(args),
    manifest,
    manifestPath: displayPath(manifestPath),
    sources: catalog.sources.map(displayPath),
  });
  const text = formatTextReport(report);
  const json = formatJsonReport(report);
  if (args.format === 'json') process.stdout.write(json);
  else if (args.format === 'both') process.stdout.write(`${text}---\n${json}`);
  else process.stdout.write(text);
  return report.ok ? 0 : 1;
}

/**
 * @param {object} args
 */
function commandMaterialize(args) {
  if (args._.length === 0) throw new Error('materialize needs a catalog file or directory');
  const catalog = loadCatalogs(args._.map((target) => resolve(target)));
  const materialized = materializeCatalog(catalog, templatesFrom(args));
  writeOut(`${JSON.stringify(materialized, null, 2)}\n`, args.out ? resolve(args.out) : undefined);
  return 0;
}

/**
 * @param {object} args
 */
function commandExport(args) {
  if (args._.length !== 1) throw new Error('export needs one catalog JSON file');
  const catalog = loadCatalogs([resolve(args._[0])]);
  const materialized = materializeCatalog(catalog, templatesFrom(args));
  if (args.outDir) {
    if (args.kind || args.out) {
      throw new Error('export --out-dir writes every kind; do not combine it with --kind or --out');
    }
    const directory = resolve(args.outDir);
    mkdirSync(directory, { recursive: true });
    for (const [collection, kind] of Object.entries(KIND_BY_COLLECTION)) {
      const csv = recordsToCsv(materialized[collection], COLUMNS[kind], { bom: args.bom });
      writeFileSync(resolve(directory, CSV_FILE[kind]), csv);
    }
    return 0;
  }
  if (!args.kind || !args.out) throw new Error('export needs --kind and --out, or --out-dir');
  const kind = normalizeKind(args.kind);
  const collection = COLLECTION_BY_KIND[kind];
  const csv = recordsToCsv(materialized[collection], COLUMNS[kind], { bom: args.bom });
  writeOut(csv, resolve(args.out));
  return 0;
}

/**
 * @param {object} args
 */
function commandImport(args) {
  if (!args.kind) throw new Error('import needs --kind');
  if (args._.length !== 1) throw new Error('import needs one CSV file');
  const kind = normalizeKind(args.kind);
  const collection = COLLECTION_BY_KIND[kind];
  const text = readFileSync(resolve(args._[0]), 'utf8');
  const records = recordsFromCsv(text);
  const raw = { [collection]: records, hasAvatars: collection === 'avatars' };
  const materialized = materializeCatalog(raw, templatesFrom(args));
  const body = {
    kind,
    records: materialized[collection],
  };
  writeOut(`${JSON.stringify(body, null, 2)}\n`, args.out ? resolve(args.out) : undefined);
  return 0;
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n${USAGE}`);
    process.exit(2);
  }
  if (args.help) {
    process.stdout.write(USAGE);
    process.exit(0);
  }
  if (args._.length === 0) {
    process.stderr.write(USAGE);
    process.exit(2);
  }
  const [command, ...rest] = args._;
  args._ = rest;
  try {
    let code = 0;
    if (command === 'validate') code = commandValidate(args);
    else if (command === 'materialize') code = commandMaterialize(args);
    else if (command === 'export') code = commandExport(args);
    else if (command === 'import') code = commandImport(args);
    else {
      process.stderr.write(`Unknown command "${command}"\n${USAGE}`);
      process.exit(2);
    }
    process.exit(code);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(2);
  }
}

main();
