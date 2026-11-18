import { reportTests } from './lib/summary-report.mjs';

/**
 * Node.js test reporter. Writes a markdown section for $GITHUB_STEP_SUMMARY
 * when CI_WRITE_SUMMARY=1, and always yields a PASS/FAIL line.
 * @param {AsyncIterable<{ type: string, data?: object }>} source
 */
export default async function* githubSummaryReporter(source) {
  const writeSummary = process.env.CI_WRITE_SUMMARY === '1' && process.env.GITHUB_STEP_SUMMARY;
  yield* reportTests(source, {
    checkName: process.env.CI_CHECK_NAME || 'SYSTEMS_TEST',
    nodeLabel: process.env.CI_NODE_LABEL || process.versions.node,
    summaryFile: writeSummary ? process.env.GITHUB_STEP_SUMMARY : '',
    yieldMarkdown: !writeSummary,
    cwd: process.cwd(),
  });
}
