import { el } from '../../js/dom.js';
import { sportMeta } from '../live/index.js';
import { noteRow, sportRoot, topBar } from '../shell.js';

export function renderResult(ctx) {
  const sim = ctx.simulation;
  const result = sim?.result;
  const meta = sportMeta(sim?.sport);
  const root = sportRoot('result', sim?.sport);
  root.append(topBar({
    title: `${meta?.label ?? 'Sport'} Result`,
    sub: 'Preview result · PROPOSED',
    back: { label: 'Back to Hub', action: 'hub', onClick: ctx.goHub, primary: true },
  }));
  const reward = sim?.rewards;
  const granted = ctx.granted;
  root.append(noteRow(granted?.duplicate
    ? `Reward already on the ledger. ${reward?.G ?? 0} G · PROPOSED`
    : `Granted ${granted?.G ?? reward?.G ?? 0} G · PROPOSED`));
  const body = el('div', 'result-body');
  const score = el('section', 'result-panel');
  score.append(el('h2', null, result?.awayName ? `Your Complex vs ${result.awayName}` : 'Result'));
  if (result?.score) {
    score.append(el('p', 'score-xl', `${result.score.home} — ${result.score.away}`));
    const winner = result.winner === 'draw' ? 'Draw' : result.winner === 'home' ? 'Your Complex' : result.awayName;
    score.append(el('p', null, `${winner} · PROPOSED`));
  } else {
    const rows = (result?.standings ?? []).filter((row, index) => index < 5 || row.mine);
    for (const row of rows) {
      const place = row.dnf ? 'DNF' : row.place;
      const line = el('p', `stand-row${row.mine ? ' is-mine' : ''}`, `${place}  ${row.parodyName}${row.vehicleName ? ` · ${row.vehicleName}` : ''} · ${row.team}${row.points ? ` · ${row.points} pts` : ''}`);
      if (row.mine) line.dataset.mine = 'true';
      score.append(line);
    }
    score.append(el('p', null, 'Standings · PROPOSED'));
  }
  body.append(score);
  const side = el('section', 'result-panel');
  side.append(el('h2', null, 'MVP'));
  side.append(el('p', 'score-xl', result?.mvp?.parodyName ?? 'None'));
  side.dataset.mvp = result?.mvp?.parodyName ?? '';
  side.append(el('p', null, 'MVP · PROPOSED'));
  side.append(el('h2', null, 'G reward'));
  side.append(el('p', 'score-xl', `+${reward?.G ?? 0} G`));
  side.append(el('p', null, 'PROPOSED'));
  side.dataset.reward = String(reward?.G ?? 0);
  body.append(side);
  root.append(body);
  return root;
}
