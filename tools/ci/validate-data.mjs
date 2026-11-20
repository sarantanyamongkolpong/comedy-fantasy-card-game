import { resolve } from 'node:path';
import { annotate, formatCheck, invokedDirectly, publishSummary, repoRootFrom } from './lib/common.mjs';
import { validateData } from './lib/data-validation.mjs';

function rootFromArgv() {
  const index = process.argv.indexOf('--root');
  if (index >= 0 && process.argv[index + 1]) return resolve(process.argv[index + 1]);
  return repoRootFrom(import.meta.url, 2);
}

export async function runDataValidation(root = rootFromArgv()) {
  const result = await validateData(root);
  publishSummary(formatCheck('DATA_VALIDATION', result), { checkName: 'DATA_VALIDATION' });
  if (!result.ok) {
    for (const error of result.parseErrors.slice(0, 20)) annotate(`${error.file}: ${error.message}`, error.file);
    for (const entry of result.characterDuplicates.slice(0, 20)) {
      annotate(`duplicate character id ${entry.id}: ${entry.locations.join(', ')}`);
    }
    for (const error of result.schemaErrors.slice(0, 20)) annotate(`${error.location}: ${error.message}`);
    for (const error of result.draftErrors.slice(0, 20)) annotate(`${error.location}: ${error.message}`);
    for (const error of result.productionErrors.slice(0, 20)) annotate(`${error.location}: ${error.message}`);
    for (const message of result.loadErrors.slice(0, 20)) annotate(message);
  }
  process.stdout.write(`DATA_VALIDATION: ${result.ok ? 'PASS' : 'FAIL'}\n`);
  return result.ok ? 0 : 1;
}

if (invokedDirectly(import.meta.url)) {
  runDataValidation().then((code) => {
    process.exitCode = code;
  }).catch((error) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    publishSummary(`## DATA_VALIDATION\n\n**Result: FAIL**\n\nUnexpected error:\n\n\`\`\`\n${message}\n\`\`\`\n`, { checkName: 'DATA_VALIDATION' });
    process.stdout.write('DATA_VALIDATION: FAIL\n');
    process.exitCode = 1;
  });
}
