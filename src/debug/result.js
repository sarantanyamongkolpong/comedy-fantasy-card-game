import { DesignBlockedError } from '../index.js';
import { reasonForQuestion } from './reasons.js';

/**
 * JSON result for an exception raised by the public battle API.
 * @param {unknown} error
 */
export function toResult(error) {
  if (error instanceof DesignBlockedError) {
    return {
      ok: false,
      status: 'BLOCKED_BY_DESIGN',
      code: error.code,
      reason: reasonForQuestion(error.questionId),
      questionId: error.questionId,
      topic: error.topic,
      message: error.message,
    };
  }
  const reason = typeof error?.reason === 'string' ? error.reason : 'ERROR';
  return {
    ok: false,
    status: 'ERROR',
    code: typeof error?.code === 'string' ? error.code : null,
    reason,
    message: error instanceof Error ? error.message : String(error),
  };
}
