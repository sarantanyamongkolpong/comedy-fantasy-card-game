import { resolveRules } from '../design/blocked-rules.js';
import { validateOwnership, validationResult } from '../schema/validate.js';

/** Sample ownership row. Acquisition source stays null because gacha rates are undesigned. */
export const SAMPLE_OWNERSHIP = Object.freeze({
  ownershipId: 'OWN_SAMPLE_AVT_AEG_001',
  ownerId: 'PLAYER_SAMPLE',
  subjectKind: 'avatar',
  subjectId: 'AVT_AEG_001',
  quantity: null,
  source: null,
  sourceStatus: 'TBD',
});

/**
 * @param {unknown} record
 */
export function createOwnership(record) {
  const result = validationResult(validateOwnership(record));
  if (!result.ok) {
    const error = new Error('Invalid ownership');
    error.errors = result.errors;
    throw error;
  }
  return structuredClone(record);
}

/**
 * Acquisition rolls are blocked. Pass a gachaRate rule only from a test.
 * @param {unknown} record
 * @param {Record<string, Function>} [rules]
 */
export function rollAcquisition(record, rules = {}) {
  const resolved = resolveRules(rules);
  return resolved.gachaRate(record);
}
