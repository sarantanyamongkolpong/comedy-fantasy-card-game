/**
 * LIVE IMPORT SWITCH for web/sport (integration/v06-sport).
 * Screens and session import from here. The web stream's fixture adapters were removed at
 * integration (their catalog carried real names); there is no runtime fallback.
 */
export { getTuning, AWAY, BANNERS, BANNER_INFO, SPORTS, STARTER_OWNED, getCard, listPublicCards, opponentsFor, poolForBanner, presentCard, sportMeta, cardsOfSport, teamsOf, CONTENT } from './catalog.js';
export { simulateSport, highlight } from './simulate.js';
export { emptyPity, grantG, pityView, previewGrant, pullSport, starterRosterEntry, liveGachaTuning } from './economy.js';
export { ADAPTER_TUNING } from './tuning.js';
export const SPORT_SOURCE = Object.freeze({ data: 'content/v06/sport', sim: 'src/sport', status: 'PROPOSED' });
