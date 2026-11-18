/**
 * A scenario file was rejected. `errors` lists every problem found in that pass.
 * A missing undecided parameter includes the question id from docs/OPEN_DESIGN_DECISIONS.md.
 */
export class ConfigError extends Error {
  /**
   * @param {{ path: string, message: string, questionId: string | null }[]} errors
   */
  constructor(errors) {
    const lines = errors.map((error) => {
      const question = error.questionId ? ` [${error.questionId}]` : '';
      return `- ${error.path}${question}: ${error.message}`;
    });
    const noun = errors.length === 1 ? 'problem' : 'problems';
    super(`EXPERIMENTAL config rejected (${errors.length} ${noun}):\n${lines.join('\n')}`);
    this.name = 'ConfigError';
    this.errors = errors;
  }
}
