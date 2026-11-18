import { readFileSync } from 'node:fs';
import { ConfigError } from './errors.js';
import { assertConfig } from './validate-config.js';

/**
 * @param {string} file
 */
export function loadScenario(file) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new ConfigError([
      { path: file, message: `invalid JSON: ${error.message}`, questionId: null },
    ]);
  }
  return assertConfig(parsed);
}
