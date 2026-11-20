import { run } from './lib/cli.mjs';

const code = run('workbook', process.argv.slice(2));
process.exitCode = code;
