const FIXTURE_LABEL = 'TEST-ONLY';

/**
 * The CLI only records rulesets that declare themselves as fixtures.
 * Engine defaults may stay unlabelled because they are the throwing hooks.
 * @param {{ id: string, label?: string }} ruleset
 * @param {{ entries: { key: string, kind: string, label: string | null }[] }} described
 */
export function assertFixtureRuleset(ruleset, described) {
  if (ruleset.label !== FIXTURE_LABEL) {
    throw new Error(`Refusing ruleset ${ruleset.id}: label must be ${FIXTURE_LABEL}`);
  }
  for (const entry of described.entries) {
    if (entry.kind === 'ENGINE_DEFAULT') continue;
    if (entry.label !== FIXTURE_LABEL) {
      throw new Error(`Refusing rule ${entry.key}: injected rules must be labelled ${FIXTURE_LABEL}`);
    }
  }
}
