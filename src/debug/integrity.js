import { canonicalString, sha256, sortValue } from './canonical.js';

/**
 * @param {object} log
 */
export function sealLog(log) {
  const body = { ...log };
  delete body.integrity;
  const hash = sha256(canonicalString(body));
  return sortValue({
    ...body,
    integrity: { algorithm: 'sha256', hash },
  });
}

/**
 * @param {object} log
 */
export function checkIntegrity(log) {
  if (!log || typeof log !== 'object' || Array.isArray(log)) return false;
  if (log.integrity?.algorithm !== 'sha256' || typeof log.integrity.hash !== 'string') return false;
  const body = { ...log };
  delete body.integrity;
  return sha256(canonicalString(body)) === log.integrity.hash;
}

/**
 * @param {object} log
 */
export function stringifyLog(log) {
  return `${JSON.stringify(sortValue(log), null, 2)}\n`;
}
