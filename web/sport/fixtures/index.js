/**
 * SINGLE IMPORT SWITCH.
 *
 * Sport screens import this module and nothing deeper.
 * Today it serves the fixture adapters in this folder.
 * When content/v06/sport and src/sport land, retarget the exports below
 * and leave the screen call sites alone.
 *
 * Expected live replacements:
 *   listPublicCards / getCard  -> content/v06/sport/index.json (parody fields only)
 *   simulateSport              -> src/sport/<sport>/sim.js
 *   pullSport / grantG         -> src/sport/gacha/sport-pull.js and src/sport/wallet
 */

export { getTuning } from './tuning.js';
export {
  AWAY,
  BANNERS,
  BANNER_INFO,
  SPORTS,
  STARTER_OWNED,
  getCard,
  listPublicCards,
  opponentsFor,
  poolForBanner,
  presentCard,
  sportMeta,
} from './catalog.js';
export { simulateSport } from './simulate.js';
export { emptyPity, grantG, pullSport } from './gacha.js';
