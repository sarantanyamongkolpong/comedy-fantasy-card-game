import { artNode } from '../art.js';
import { SPORTS } from '../fixtures/index.js';
import { el } from '../../js/dom.js';
import { noteRow, sportRoot, topBar } from '../shell.js';

export function renderHub(ctx) {
  const root = sportRoot('hub');
  root.append(topBar({
    title: 'Sports Complex',
    sub: 'Four auto sports · PROPOSED',
    back: { label: 'Map', action: 'map', onClick: ctx.exitMap },
    actions: [
      { label: 'Roster', action: 'roster', onClick: ctx.goRoster },
      { label: 'Gacha', action: 'gacha', onClick: ctx.goGacha },
    ],
  }));
  root.append(noteRow(ctx.notice));
  const grid = el('div', 'hub-grid');
  for (const sport of SPORTS) {
    const tile = el('article', 'sport-tile');
    tile.dataset.sport = sport.id;
    const art = el('div', 'tile-art');
    art.append(artNode({ slot: 'tile', subjectId: sport.id }));
    tile.append(art);
    tile.append(el('h2', null, sport.label));
    tile.append(el('p', null, `${sport.blurb} · PROPOSED`));
    tile.append(ctx.nav('Enter', () => ctx.goPrep(sport.id), {
      action: 'prep',
      sport: sport.id,
      primary: true,
    }));
    grid.append(tile);
  }
  root.append(grid);
  return root;
}
