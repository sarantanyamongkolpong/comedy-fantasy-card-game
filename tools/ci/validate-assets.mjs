import { resolve } from 'node:path';
import { annotate, formatCheck, invokedDirectly, publishSummary, repoRootFrom } from './lib/common.mjs';
import { validateAssets } from './lib/asset-validation.mjs';

function rootFromArgv() {
  const index = process.argv.indexOf('--root');
  if (index >= 0 && process.argv[index + 1]) return resolve(process.argv[index + 1]);
  return repoRootFrom(import.meta.url, 2);
}

export async function runAssetValidation(root = rootFromArgv()) {
  const result = validateAssets(root);
  publishSummary(formatCheck('ASSET_MANIFEST_VALIDATION', result), { checkName: 'ASSET_MANIFEST_VALIDATION' });
  if (!result.ok) {
    for (const entry of result.duplicates.slice(0, 20)) annotate(`duplicate asset id ${entry.id} in ${entry.location}`);
    for (const entry of result.missingPaths.slice(0, 20)) {
      annotate(`${entry.id} ${entry.path}: ${entry.message}`, entry.file);
    }
    for (const entry of result.invalidStatuses.slice(0, 20)) {
      annotate(`${entry.id} status ${entry.status} is outside the approved vocabulary`, entry.file);
    }
  }
  process.stdout.write(`ASSET_MANIFEST_VALIDATION: ${result.ok ? 'PASS' : 'FAIL'}\n`);
  return result.ok ? 0 : 1;
}

if (invokedDirectly(import.meta.url)) {
  runAssetValidation().then((code) => {
    process.exitCode = code;
  }).catch((error) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    publishSummary(`## ASSET_MANIFEST_VALIDATION\n\n**Result: FAIL**\n\nUnexpected error:\n\n\`\`\`\n${message}\n\`\`\`\n`, { checkName: 'ASSET_MANIFEST_VALIDATION' });
    process.stdout.write('ASSET_MANIFEST_VALIDATION: FAIL\n');
    process.exitCode = 1;
  });
}
