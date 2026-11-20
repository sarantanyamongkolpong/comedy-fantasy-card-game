import { OWNER_EVIDENCE_T253U } from '../schema/constants.js';

const LOCKED_MAPPING = '1:1';

function isStatsBag(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

/**
 * Copy legacy `pow` to `atk` 1:1 and keep `legacy.pow`.
 * The input is not mutated. A second call on the result is a no-op.
 * CORE-005 is LOCKED (Owner t253u). A different mapping is rejected.
 * @param {unknown} record
 */
export function migratePowToAtk(record) {
  if (arguments.length > 1) {
    throw new Error(
      `CORE-005 mapping is LOCKED to ${LOCKED_MAPPING} (${OWNER_EVIDENCE_T253U}). A replacement mapping is not accepted.`,
    );
  }
  if (!isStatsBag(record)) throw new TypeError('record must be an object');
  const clone = structuredClone(record);
  const stats = isStatsBag(clone.stats) ? clone.stats : clone;
  const migrated =
    isStatsBag(stats.legacy) && hasOwn(stats.legacy, 'pow') && hasOwn(stats, 'atk');
  if (migrated) return clone;

  if (!hasOwn(stats, 'pow')) return clone;
  const pow = stats.pow;
  if (pow !== null && !(Number.isInteger(pow) && pow >= 0)) {
    throw new TypeError('legacy pow must be null or a non-negative integer');
  }
  if (hasOwn(stats, 'atk') && stats.atk !== pow) {
    throw new Error(
      'CORE-005 conflict: atk and pow differ before legacy.pow is stored. Neither value was deleted.',
    );
  }

  const previousLegacy = isStatsBag(stats.legacy) ? stats.legacy : {};
  stats.legacy = { ...previousLegacy, pow };
  stats.atk = pow;
  stats.migration = {
    rule: 'CORE-005',
    mapping: LOCKED_MAPPING,
    status: 'LOCKED',
    evidence: OWNER_EVIDENCE_T253U,
  };
  if (clone !== stats && typeof clone.avatarId === 'string' && clone.schemaVersion === undefined) {
    clone.schemaVersion = 'v05';
    stats.migration.addedSchemaVersion = true;
  }
  return clone;
}

/**
 * Restore the pre-migration stat shape. `pow` and `legacy.pow` stay.
 * `atk` is removed only when it is the 1:1 copy of `legacy.pow`.
 * @param {unknown} record
 */
export function reversePowMigration(record) {
  if (!isStatsBag(record)) throw new TypeError('record must be an object');
  const clone = structuredClone(record);
  const stats = isStatsBag(clone.stats) ? clone.stats : clone;
  if (!isStatsBag(stats.legacy) || !hasOwn(stats.legacy, 'pow')) return clone;
  if (hasOwn(stats, 'atk') && stats.atk !== stats.legacy.pow) {
    throw new Error('CORE-005 reverse refused: atk is not the 1:1 copy of legacy.pow. Nothing was deleted.');
  }
  if (hasOwn(stats, 'pow') && stats.pow !== stats.legacy.pow) {
    throw new Error('CORE-005 reverse refused: pow and legacy.pow differ. Nothing was deleted.');
  }
  stats.pow = stats.legacy.pow;
  delete stats.atk;
  const addedSchemaVersion = stats.migration?.addedSchemaVersion === true;
  delete stats.migration;
  if (addedSchemaVersion && clone !== stats) delete clone.schemaVersion;
  return clone;
}
