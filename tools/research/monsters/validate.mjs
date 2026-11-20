import { run } from './lib/cli.mjs';

const code = run('validate', process.argv.slice(2));
process.exitCode = code;
