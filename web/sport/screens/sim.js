import { el } from '../../js/dom.js';
import { sportMeta } from '../fixtures/index.js';
import { noteRow, sportRoot, topBar } from '../shell.js';

export function renderSim(ctx) {
  const sport = ctx.sport;
  const meta = sportMeta(sport);
  const sim = ctx.simulation;
  const events = sim?.events ?? [];
  const index = Math.min(ctx.eventIndex, Math.max(0, events.length - 1));
  const current = events[index];
  const root = sportRoot('sim', sport);
  root.dataset.eventIndex = String(index);
  root.dataset.playing = ctx.playing ? 'true' : 'false';
  root.append(topBar({
    title: `${meta?.label ?? sport} Auto Sim`,
    sub: 'Playback waits for Play · PROPOSED',
    back: { label: 'Hub', action: 'hub', onClick: ctx.goHub },
  }));
  root.append(noteRow(ctx.notice || 'Speed and Skip stay put. The log changes in place.'));
  const main = el('div', 'sim-main');
  main.append(board(current?.board, sim));
  const commentary = el('div', 'sim-commentary');
  commentary.append(el('p', null, current?.commentary || 'The booth is quiet until you press Play.'));
  main.append(commentary);
  const log = el('div', 'sim-log');
  const shown = events.slice(Math.max(0, index - 3), index + 1);
  shown.forEach((event, shownIndex) => {
    const line = el('p', shownIndex === shown.length - 1 ? 'is-current' : null, `${event.clock}  ${event.text}`);
    log.append(line);
  });
  main.append(log);
  root.append(main);
  const controls = el('footer', 'sport-controls');
  controls.append(ctx.nav(ctx.playing ? 'Pause' : 'Play', ctx.togglePlay, { action: 'play' }));
  for (const speed of [1, 2, 4]) {
    const node = ctx.nav(`Speed x${speed}`, () => ctx.setSpeed(speed), { action: 'speed', speed });
    if (ctx.speed === speed) node.classList.add('is-selected');
    node.setAttribute('aria-pressed', ctx.speed === speed ? 'true' : 'false');
    controls.append(node);
  }
  controls.append(ctx.nav('Skip', ctx.skipToResult, { action: 'skip' }));
  controls.append(ctx.nav('Result', ctx.showResult, { action: 'result', primary: true }));
  root.append(controls);
  return root;
}

function board(boardState, sim) {
  const node = el('div', 'sim-board');
  if (!boardState) {
    node.append(el('h2', null, 'Scoreboard'));
    node.append(el('p', null, 'PROPOSED'));
    return node;
  }
  if (boardState.kind === 'standings') {
    const ticker = boardState.rows.map((row) => `${row.place} ${row.name}`).join('   ');
    node.append(el('h2', null, ticker));
    node.append(el('p', null, `${sim?.result?.awayName ?? 'Field'} · standings · PROPOSED`));
    return node;
  }
  node.append(el('h2', null, `${boardState.homeName} ${boardState.home} — ${boardState.away} ${boardState.awayName}`));
  node.append(el('p', null, 'Scoreboard · PROPOSED'));
  return node;
}
