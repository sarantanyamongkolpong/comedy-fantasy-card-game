import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exampleTestBanners } from '../../src/gacha/test-config.js';
import { buildV05Content } from '../../src/schema/v05-samples.js';

const root = fileURLToPath(new URL('../..', import.meta.url));
const content = buildV05Content();
const banners = exampleTestBanners();

const files = [
  [
    'content/v05/avatars/justin-avatars.json',
    {
      contentTier: 'draft',
      warning: 'SAMPLE. Name and faction are LOCKED (Owner t253u 20 Nov 2026). Stats and skills are PROPOSED except Justina Moment active, which is LOCKED. Not PRODUCTION_READY.',
      avatars: content.avatars,
    },
  ],
  [
    'content/v05/actions/starter-actions.json',
    {
      contentTier: 'draft',
      warning: 'PLACEHOLDER action cards for a 30-card demo deck. Every number is PLACEHOLDER, not locked balance. Not PRODUCTION_READY.',
      actionCards: content.actions,
    },
  ],
  [
    'content/v05/decks/demo-mixed-deck.json',
    {
      contentTier: 'draft',
      warning: 'PLACEHOLDER 30-card mixed-faction deck. Not PRODUCTION_READY.',
      deck: content.deck,
    },
  ],
  [
    'content/v05/enemies/demo-battle.json',
    {
      contentTier: 'draft',
      warning: 'PLACEHOLDER enemy team. Stats are not locked balance. Not PRODUCTION_READY.',
      battle: content.enemies,
    },
  ],
  [
    'content/v05/hideout/house-tiers.json',
    {
      contentTier: 'draft',
      warning: 'House tier names are LOCKED. Furniture capacities are the sheet reference. Grant versus unlock-to-buy is PENDING_OWNER. Cabin base capacity is PENDING_OWNER.',
      houseTiers: content.houseTiers,
      mapDestinations: content.mapDestinations,
    },
  ],
  ['content/v05/gacha/TEST_ONLY_banners.json', banners],
];

for (const [relative, value] of files) {
  const full = join(root, relative);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, `${JSON.stringify(value, null, 2)}\n`);
}
