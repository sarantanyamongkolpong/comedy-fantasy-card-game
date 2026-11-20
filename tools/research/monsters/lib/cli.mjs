/**
 * Shared command line for validate, build-workbook, and export-json.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assemble } from './assemble.mjs';
import { CATEGORIES } from './constants.mjs';
import { buildImportFile } from './export-game.mjs';
import { buildWorkbook } from './workbook.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(here, '../../../..');
export const defaultSchemaPath = resolve(repoRoot, 'docs/research/monsters/schema/monster.schema.json');

const HELP = `Monster research database tools

  node tools/research/monsters/validate.mjs --input <file> [more files] [options]
  node tools/research/monsters/build-workbook.mjs --input <file> --out <file.xlsx> [options]
  node tools/research/monsters/export-json.mjs --input <file> --out <file.json> [options]

Options:
  --input, -i <file>       Monster file. Repeat for each agent file. Positional paths work too.
  --lore <file>            Agent 08 lore links. Repeatable.
  --qa <file>              Agent 10 QA reviews. Repeatable.
  --inspirations <file>    Agents 01-05 inspirations.json. Repeatable.
  --schema <file>          Defaults to docs/research/monsters/schema/monster.schema.json
  --out, -o <file>         Workbook or import JSON. export-json accepts - for stdout.
  --json                   validate prints a JSON report. export-json still writes the file.
  --strict                 Warnings fail the run.
  --allow-invalid          Write the workbook or JSON even when checks fail, and exit 0.
  --help                   Show this help.

Sample paths Mira can pass once those agents publish:
  docs/research/monsters/creative/parody/sample_normal_elite.json
  docs/research/monsters/creative/bosses/sample_bosses.json
  docs/research/monsters/lore/sample_lore_links.json
  docs/research/monsters/qa/<qa file>.json

Exit 0: no errors (and no warnings in --strict).
Exit 1: schema, duplicate, or IP findings. A workbook is still written.
        An import JSON is written only with --allow-invalid, because an invalid
        record cannot satisfy the import schema.
Exit 2: bad arguments or a missing path.
`;

/**
 * @param {string[]} argv
 */
export function parseArgs(argv) {
  const args = {
    inputs: /** @type {string[]} */ ([]),
    lore: /** @type {string[]} */ ([]),
    qa: /** @type {string[]} */ ([]),
    inspirations: /** @type {string[]} */ ([]),
    schema: defaultSchemaPath,
    out: /** @type {string | null} */ (null),
    json: false,
    strict: false,
    allowInvalid: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--help' || token === '-h') args.help = true;
    else if (token === '--json') args.json = true;
    else if (token === '--strict') args.strict = true;
    else if (token === '--allow-invalid') args.allowInvalid = true;
    else if (token === '--input' || token === '-i') args.inputs.push(requireValue(argv, ++index, token));
    else if (token === '--lore') args.lore.push(requireValue(argv, ++index, token));
    else if (token === '--qa') args.qa.push(requireValue(argv, ++index, token));
    else if (token === '--inspirations') args.inspirations.push(requireValue(argv, ++index, token));
    else if (token === '--schema') args.schema = requireValue(argv, ++index, token);
    else if (token === '--out' || token === '-o') args.out = requireValue(argv, ++index, token);
    else if (token.startsWith('-')) throw new UsageError(`Unknown option ${token}`);
    else args.inputs.push(token);
  }
  return args;
}

/**
 * @param {'validate' | 'workbook' | 'export'} mode
 * @param {string[]} argv
 */
export function run(mode, argv) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n${HELP}`);
    return 2;
  }
  if (args.help) {
    process.stdout.write(HELP);
    return 0;
  }
  if (args.inputs.length + args.lore.length + args.qa.length + args.inspirations.length === 0) {
    process.stderr.write(`Missing input file.\n${HELP}`);
    return 2;
  }
  if ((mode === 'workbook' || mode === 'export') && !args.out) {
    process.stderr.write(`Missing --out.\n${HELP}`);
    return 2;
  }
  const result = assemble({
    inputs: args.inputs,
    lore: args.lore,
    qa: args.qa,
    inspirations: args.inspirations,
    schemaPath: args.schema,
    strict: args.strict,
  });
  if (result.exitCode === 2) {
    writeReport(result, args, mode);
    return 2;
  }
  if (mode === 'workbook' && args.out) {
    mkdirSync(dirname(resolve(args.out)), { recursive: true });
    writeFileSync(args.out, buildWorkbook(result));
  }
  if (mode === 'export' && args.out) {
    if (!result.ok && !args.allowInvalid) {
      writeReport(result, args, mode);
      process.stderr.write('Import JSON was not written. Pass --allow-invalid to write it anyway.\n');
      return 1;
    }
    let file;
    try {
      file = buildImportFile(result, { validate: result.ok });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      return 1;
    }
    const body = `${JSON.stringify(file, null, 2)}\n`;
    if (args.out === '-') process.stdout.write(body);
    else {
      mkdirSync(dirname(resolve(args.out)), { recursive: true });
      writeFileSync(args.out, body);
    }
  }
  writeReport(result, args, mode);
  if (args.allowInvalid) return 0;
  return result.ok ? 0 : 1;
}

/**
 * @param {object} result
 * @param {{ json: boolean, out: string | null }} args
 * @param {string} mode
 */
function writeReport(result, args, mode) {
  if (args.json && mode === 'validate') {
    process.stdout.write(`${JSON.stringify(jsonReport(result), null, 2)}\n`);
    return;
  }
  if (args.out === '-' && mode === 'export') {
    process.stderr.write(`${formatReport(result)}\n`);
    return;
  }
  const extra = mode === 'workbook' && args.out
    ? `Workbook: ${args.out}\n`
    : (mode === 'export' && args.out && (result.ok || args.allowInvalid) ? `Import JSON: ${args.out}\n` : '');
  process.stdout.write(`${formatReport(result)}\n${extra}`);
}

/** @param {object} result */
export function formatReport(result) {
  const lines = [
    'Monster research',
    `Records: ${result.records.length}`,
    `Errors: ${result.errors.length}`,
    `Warnings: ${result.warnings.length}`,
    `Notes: ${result.notes.length}`,
  ];
  for (const item of [...result.errors, ...result.warnings, ...result.notes]) {
    lines.push(`${String(item.severity).toUpperCase()} ${item.code} ${item.path} ${item.message}`);
  }
  lines.push(`Result: ${result.ok ? 'OK' : 'FAIL'}`);
  return lines.join('\n');
}

/** @param {object} result */
function jsonReport(result) {
  const counts = Object.fromEntries(CATEGORIES.map((category) => [
    category,
    result.records.filter((record) => record.category === category).length,
  ]));
  return {
    ok: result.ok,
    records: result.records.map((record) => record.monsterId ?? null),
    counts,
    errors: result.errors,
    warnings: result.warnings,
    notes: result.notes,
  };
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith('-')) throw new UsageError(`Missing value for ${flag}`);
  return value;
}

class UsageError extends Error {}
