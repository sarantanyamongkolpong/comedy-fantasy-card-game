import { run } from './lib/cli.mjs';

const code = run('export', process.argv.slice(2));
process.exitCode = code;
