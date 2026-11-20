import { bindImage, findAsset } from '../assets.js';
import { chromeButton, paintFrame } from '../chrome.js';
import { el, shell } from '../dom.js';
import { rewardLines } from '../reward-lines.js';

export function renderRewards(ctx) {
  const outcome = ctx.match ? ctx.api.getOutcome(ctx.match) : null;
  const won = outcome?.winnerSideId === 'player';
  const body = el('div', 'rewards');
  body.dataset.screen = 'rewards';
  const treasure = findAsset(ctx.manifest, { slot: 'reward-cutout', subjectId: 'treasure' });
  if (treasure) {
    const img = el('img', 'reward-treasure');
    img.alt = '';
    bindImage(img, treasure);
    body.append(img);
  }
  const coins = findAsset(ctx.manifest, { slot: 'reward-vfx', subjectId: 'coin' });
  if (coins) {
    const img = el('img', 'reward-coins');
    img.alt = '';
    bindImage(img, coins);
    body.append(img);
  }
  const sheet = el('aside', 'reward-sheet');
  const copy = el('div', 'sheet-body');
  paintFrame(sheet, ctx.manifest, 'detail');
  copy.append(el('h2', null, won ? 'The echo takes a nap.' : 'Your team takes a nap.'));
  copy.append(el('p', 'lede', won
    ? 'You win. The tower records the result below. Loot stays pending until a table exists.'
    : 'You lose. The kettle is on at the hideout. The result below is the only record.'));
  const list = el('dl', 'reward-lines');
  for (const line of rewardLines(outcome)) {
    const row = el('div', line.pending ? 'reward-line is-pending' : 'reward-line');
    row.append(el('dt', null, line.label));
    row.append(el('dd', null, line.value));
    list.append(row);
  }
  copy.append(list);
  copy.append(el('p', 'fine', 'This result screen shows once for this fight. Leaving it stamps the fight as claimed.'));
  copy.append(chromeButton(ctx.manifest, 'Back to the Hideout', () => ctx.claimAndLeave(), { variant: 'primary', icon: 'home' }));
  sheet.append(copy);
  body.append(sheet);
  const view = shell(ctx, won ? 'Victory lap' : 'Consolation cocoa', body);
  const bg = findAsset(ctx.manifest, { slot: 'bg-rewards', subjectId: 'room' });
  if (bg) {
    const img = el('img', 'scene-bg');
    img.alt = '';
    bindImage(img, bg, { eager: true });
    view.prepend(img);
    view.classList.add('has-scene');
  }
  return view;
}
