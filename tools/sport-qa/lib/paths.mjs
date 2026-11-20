import { fileURLToPath } from 'node:url';

/** Repo root. SPORT_QA_ROOT points at a throwaway merge without moving this checkout. */
export function repoRoot() {
  if (process.env.SPORT_QA_ROOT) return process.env.SPORT_QA_ROOT;
  return fileURLToPath(new URL('../../../', import.meta.url));
}
