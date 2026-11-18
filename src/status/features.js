/**
 * Feature status for this prototype.
 * Allowed values: IMPLEMENTED, TESTED, BLOCKED_BY_DESIGN, NOT_IMPLEMENTED.
 * Rows that have automated tests use TESTED.
 */
export const FEATURES = Object.freeze([
  {
    id: 'schema',
    name: 'Data schema (Avatar, Faction, Stats, Avatar Card, Action Card, Equipment, Ownership, Asset Manifest entry, Variants)',
    status: 'TESTED',
    notes: 'JSON Schema plus runtime validators. Sample stats, rarity, and AP costs are null/TBD.',
  },
  {
    id: 'factions',
    name: 'Four factions and four starter avatars',
    status: 'TESTED',
    notes: 'Names and roles are the specified strings.',
  },
  {
    id: 'party',
    name: 'Party of 4 avatars per side',
    status: 'TESTED',
    notes: '',
  },
  {
    id: 'spd-start',
    name: 'Team with the highest SPD starts',
    status: 'TESTED',
    notes: 'Compares two team SPD numbers from rules.teamSpd. Aggregation is Q-SPD-AGG.',
  },
  {
    id: 'alternate',
    name: 'Teams alternate turns',
    status: 'TESTED',
    notes: '',
  },
  {
    id: 'ap',
    name: '5 AP refreshed at the start of that side\'s turn',
    status: 'TESTED',
    notes: 'Refresh assigns 5. Confirming leftover AP is Q-AP-LEFTOVER.',
  },
  {
    id: 'outcome',
    name: 'Victory and defeat detection',
    status: 'TESTED',
    notes: 'Uses rules.isSideDefeated. HP itself is Q-HP.',
  },
  {
    id: 'determinism',
    name: 'Deterministic battle log',
    status: 'TESTED',
    notes: 'The engine has no RNG.',
  },
  {
    id: 'hand',
    name: 'Hand size 5',
    status: 'TESTED',
    notes: 'The battle attaches one hand per side. Hand owner is Q-HAND-OWNER.',
  },
  {
    id: 'card-types',
    name: 'Action card types ATK, DEF, and Skill',
    status: 'TESTED',
    notes: '',
  },
  {
    id: 'afford',
    name: 'Affordability check and play validation against current AP',
    status: 'TESTED',
    notes: 'A null cost blocks through Q-AP-COST unless a rule returns an integer.',
  },
  {
    id: 'loader',
    name: 'Asset loader resolves by Asset ID',
    status: 'TESTED',
    notes: '',
  },
  {
    id: 'loader-layout',
    name: 'Anchors, pivots, and frame rects come from data files',
    status: 'TESTED',
    notes: '',
  },
  {
    id: 'loader-status',
    name: 'Missing ids and CONCEPT or PROTOTYPE statuses',
    status: 'TESTED',
    notes: 'Missing ids return MISSING_ID. CONCEPT and PROTOTYPE return an advisory.',
  },
  {
    id: 'deck-size',
    name: 'Deck size',
    status: 'BLOCKED_BY_DESIGN',
    questionId: 'Q-DECK-SIZE',
    notes: 'Q-DECK-SIZE',
  },
  {
    id: 'draw',
    name: 'Draw and discard rules',
    status: 'BLOCKED_BY_DESIGN',
    questionId: 'Q-DRAW-DISCARD',
    notes: 'Q-DRAW-DISCARD',
  },
  {
    id: 'ap-cost',
    name: 'AP costs of cards',
    status: 'BLOCKED_BY_DESIGN',
    questionId: 'Q-AP-COST',
    notes: 'Q-AP-COST',
  },
  {
    id: 'damage',
    name: 'Damage formula',
    status: 'BLOCKED_BY_DESIGN',
    questionId: 'Q-DAMAGE',
    notes: 'Q-DAMAGE',
  },
  {
    id: 'hp',
    name: 'HP representation',
    status: 'BLOCKED_BY_DESIGN',
    questionId: 'Q-HP',
    notes: 'Q-HP',
  },
  {
    id: 'spd-tie',
    name: 'SPD tie-break rule',
    status: 'BLOCKED_BY_DESIGN',
    questionId: 'Q-SPD-TIE',
    notes: 'Q-SPD-TIE',
  },
  {
    id: 'spd-agg',
    name: 'Team SPD aggregation',
    status: 'BLOCKED_BY_DESIGN',
    questionId: 'Q-SPD-AGG',
    notes: 'Q-SPD-AGG',
  },
  {
    id: 'action-limit',
    name: 'Per-turn action limits',
    status: 'BLOCKED_BY_DESIGN',
    questionId: 'Q-ACTION-LIMIT',
    notes: 'Q-ACTION-LIMIT',
  },
  {
    id: 'skill',
    name: 'Skill effects',
    status: 'BLOCKED_BY_DESIGN',
    questionId: 'Q-SKILL',
    notes: 'Q-SKILL',
  },
  {
    id: 'gacha',
    name: 'Gacha rates',
    status: 'BLOCKED_BY_DESIGN',
    questionId: 'Q-GACHA',
    notes: 'Q-GACHA',
  },
  {
    id: 'upgrade',
    name: 'Upgrade formulas',
    status: 'BLOCKED_BY_DESIGN',
    questionId: 'Q-UPGRADE',
    notes: 'Q-UPGRADE',
  },
  {
    id: 'simultaneous',
    name: 'Simultaneous defeat',
    status: 'BLOCKED_BY_DESIGN',
    questionId: 'Q-SIMULTANEOUS',
    notes: 'Q-SIMULTANEOUS',
  },
  {
    id: 'ui',
    name: 'UI and presentation',
    status: 'NOT_IMPLEMENTED',
    notes: 'CLI and data only.',
  },
  {
    id: 'auto',
    name: 'Auto battler',
    status: 'NOT_IMPLEMENTED',
    notes: 'Out of scope.',
  },
  {
    id: 'pixels',
    name: 'Pixel compositing and image decode',
    status: 'NOT_IMPLEMENTED',
    notes: 'The loader returns paths and data-driven placement. It does not decode PNGs.',
  },
]);

export function featuresMarkdown() {
  const lines = ['| Feature | Status | Notes |', '|---|---|---|'];
  for (const feature of FEATURES) {
    const notes = (feature.notes ?? '').replaceAll('|', '/');
    lines.push(`| ${feature.name} | ${feature.status} | ${notes} |`);
  }
  return lines.join('\n');
}
