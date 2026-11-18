import { resolve } from 'node:path';
import { annotate, formatCheck, invokedDirectly, publishSummary, repoRootFrom } from './lib/common.mjs';
import { validateRepository } from './lib/repository-structure.mjs';

function rootFromArgv() {
  const index = process.argv.indexOf('--root');
  if (index >= 0 && process.argv[index + 1]) return resolve(process.argv[index + 1]);
  return repoRootFrom(import.meta.url, 2);
}

export async function runRepositoryValidation(root = rootFromArgv()) {
  const result = await validateRepository(root);
  publishSummary(formatCheck('REPOSITORY_STRUCTURE', result), { checkName: 'REPOSITORY_STRUCTURE' });
  if (!result.ok) {
    for (const file of result.missingOrEmpty.slice(0, 20)) annotate(`required file missing or empty: ${file}`, file);
    for (const diff of result.diffs.slice(0, 20)) {
      annotate(`protected constant ${diff.key} changed. Snapshot ${JSON.stringify(diff.expected)}. Runtime ${JSON.stringify(diff.actual)}.`);
    }
  }
  process.stdout.write(`REPOSITORY_STRUCTURE: ${result.ok ? 'PASS' : 'FAIL'}\n`);
  return result.ok ? 0 : 1;
}

if (invokedDirectly(import.meta.url)) {
  runRepositoryValidation().then((code) => {
    process.exitCode = code;
  }).catch((error) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    publishSummary(`## REPOSITORY_STRUCTURE\n\n**Result: FAIL**\n\nUnexpected error:\n\n\`\`\`\n${message}\n\`\`\`\n`, { checkName: 'REPOSITORY_STRUCTURE' });
    process.stdout.write('REPOSITORY_STRUCTURE: FAIL\n');
    process.exitCode = 1;
  });
}
