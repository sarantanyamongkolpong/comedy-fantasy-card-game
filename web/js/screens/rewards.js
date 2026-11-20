import { bindImage, findAsset } from '../assets.js';
import { button, el, shell } from '../dom.js';

export function renderRewards(ctx) {
  const outcome = ctx.match ? ctx.api.getOutcome(ctx.match) : null;
  const won = outcome?.winnerSideId === 'player';
  const body = el('div', 'rewards');
  const art = findAsset(ctx.manifest, { slot: 'screen-art', subjectId: 'rewards' });
  if (art) {
    const img = el('img', 'rewards-art');
    img.alt = '';
    bindImage(img, art);
    body.append(img);
  }
  body.append(el('h2', null, won ? 'The echo takes a nap.' : 'Your team takes a nap.'));
  body.append(el('p', 'lede', won
    ? 'You win. The tower hands you bragging rights and zero locked loot. There is no loot table yet.'
    : 'You lose. The kettle is on at the hideout. Still no locked loot — nothing to double-claim.'));
  body.append(el('p', 'fine', 'This result screen shows once for this fight. Leaving it stamps the fight as claimed.'));
  body.append(button('Back to the Hideout', () => ctx.claimAndLeave()));
  return shell(ctx, won ? 'Victory lap' : 'Consolation cocoa', body);
}
