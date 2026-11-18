import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

/**
 * @returns {{ root: string, write: (relativePath: string, contents: string) => string, cleanup: () => void }}
 */
export function tempRepo() {
  const root = mkdtempSync(join(tmpdir(), 'cfcg-ci-'));
  writeFileSync(join(root, 'package.json'), '{ "type": "module" }\n');
  return {
    root,
    write(relativePath, contents) {
      const full = join(root, relativePath);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, contents);
      return full;
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}
