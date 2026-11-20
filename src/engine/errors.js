/**
 * @param {string} reason
 * @param {string} [message]
 */
export function gameError(reason, message) {
  const error = new Error(message ?? reason);
  error.reason = reason;
  return error;
}
