/**
 * Thrown when a caller hits a rule the Owner has not designed yet.
 * `code` is always BLOCKED_BY_DESIGN. `questionId` matches docs/OPEN_DESIGN_DECISIONS.md.
 */
export class DesignBlockedError extends Error {
  /**
   * @param {string} topic
   * @param {string} questionId
   */
  constructor(topic, questionId) {
    super(`BLOCKED_BY_DESIGN: ${topic} (${questionId})`);
    this.name = 'DesignBlockedError';
    this.code = 'BLOCKED_BY_DESIGN';
    this.topic = topic;
    this.questionId = questionId;
  }
}
