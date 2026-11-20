import { el } from '../../js/dom.js';
import { artNode } from '../art.js';
import { SPORTS } from '../live/index.js';
import { rosterPage } from '../session.js';
import { noteRow, personLabel, sportRoot, statLine, topBar } from '../shell.js';

const PAGE_SIZE = 8;

export function renderRoster(ctx) {
  const sport = ctx.rosterSport || 'football';
  const page = rosterPage(sport, ctx.rosterPage || 0, PAGE_SIZE);
  const root = sportRoot('roster', sport);
  root.append(topBar({
    title: 'Sport Roster',
    sub: 'Parody names · placeholder ratings',
    back: { label: 'Hub', action: 'hub', onClick: ctx.goHub },
  }));
  root.append(noteRow(ctx.notice || 'Ratings are PROPOSED placeholders.'));
  const filters = el('div', 'filter-row');
  for (const row of SPORTS) {
    const node = ctx.nav(row.label, () => ctx.setRosterSport(row.id), { action: 'roster-sport', sport: row.id });
    if (row.id === sport) node.classList.add('is-selected');
    filters.append(node);
  }
  root.append(filters);
  const grid = el('div', 'roster-grid');
  for (const card of page.cards) {
    const tile = el('article', 'roster-card');
    tile.dataset.cardId = card.id;
    tile.append(artNode({ slot: 'portrait', subjectId: card.id }));
    const copy = el('div');
    copy.append(el('h2', null, personLabel(card)));
    copy.append(el('p', null, `${card.rarity} · ${card.role} · ${card.team}`));
    copy.append(el('p', 'stats', statLine(card)));
    copy.append(el('p', 'tag-proposed', 'PROPOSED'));
    tile.append(copy);
    grid.append(tile);
  }
  root.append(grid);
  const pager = el('footer', 'pager-row');
  pager.append(ctx.nav('Prev', () => ctx.setRosterPage(page.page - 1), {
    action: 'page-prev',
    disabled: page.page <= 0,
  }));
  pager.append(el('p', 'pager-label', `Page ${page.page + 1} / ${page.pages} · PROPOSED`));
  pager.append(ctx.nav('Next', () => ctx.setRosterPage(page.page + 1), {
    action: 'page-next',
    disabled: page.page >= page.pages - 1,
  }));
  root.append(pager);
  return root;
}
