import { el } from '../../js/dom.js';
import { artNode } from '../art.js';
import { BANNER_INFO, getTuning } from '../fixtures/index.js';
import { pityOf } from '../session.js';
import { noteRow, sportRoot, topBar } from '../shell.js';

export function renderGacha(ctx) {
  const tuning = getTuning();
  const banner = BANNER_INFO.find((row) => row.id === ctx.bannerId) ?? BANNER_INFO[0];
  const pity = pityOf(banner.id);
  const root = sportRoot('gacha', banner.sport);
  root.dataset.banner = banner.id;
  root.append(topBar({
    title: 'Sport Gacha',
    sub: `${banner.label} banner · own pity`,
    back: { label: 'Hub', action: 'hub', onClick: ctx.goHub },
  }));
  root.append(noteRow(ctx.notice || `Pull cost ${tuning.pullCostG} G · x10 ${tuning.pull10CostG} G · PROPOSED`));
  const banners = el('div', 'banner-row');
  for (const row of BANNER_INFO) {
    const node = ctx.nav(row.label, () => ctx.setBanner(row.id), { action: 'banner', sport: row.sport });
    if (row.id === banner.id) node.classList.add('is-selected');
    node.setAttribute('aria-pressed', row.id === banner.id ? 'true' : 'false');
    banners.append(node);
  }
  root.append(banners);
  const pityLine = el('p', 'pity-line', `Epic pity ${pity.epic} / ${tuning.pity.epic} · EX pity ${pity.ex} / ${tuning.pity.ex} · PROPOSED`);
  pityLine.dataset.pityEpic = String(pity.epic);
  pityLine.dataset.pityEx = String(pity.ex);
  root.append(pityLine);
  const pulls = el('div', 'pull-row');
  pulls.append(ctx.nav('Pull x1', () => ctx.pull(1), { action: 'pull-1', primary: true }));
  pulls.append(ctx.nav('Pull x10', () => ctx.pull(10), { action: 'pull-10', primary: true }));
  root.append(pulls);
  const reveals = ctx.reveals ?? [];
  if (reveals.length === 0) {
    root.append(el('div', 'reveal-empty', 'Pull to reveal N, R, Epic, or EX.'));
  } else {
    const row = el('div', 'reveal-row');
    row.dataset.revealCount = String(reveals.length);
    for (const card of reveals) {
      const tile = el('article', 'reveal-card');
      tile.dataset.reveal = card.rarity;
      tile.dataset.cardId = card.id;
      tile.append(artNode({ slot: 'portrait', subjectId: card.id }));
      const copy = el('div', 'reveal-copy');
      copy.append(el('p', 'rarity', card.rarity));
      copy.append(el('p', null, card.parodyName));
      copy.append(el('p', null, card.duplicate ? 'Duplicate · PROPOSED' : 'New · PROPOSED'));
      tile.append(copy);
      row.append(tile);
    }
    root.append(row);
  }
  return root;
}
