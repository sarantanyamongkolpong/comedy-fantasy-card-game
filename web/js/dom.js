export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function button(label, onClick, className = 'hit') {
  const node = el('button', className, label);
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
}

export function shell(ctx, title, body, options = {}) {
  const root = el('section', 'screen');
  const bar = el('header', 'topbar');
  if (options.back) bar.append(button('Back', () => ctx.goto(options.back), 'hit'));
  const heading = el('div', 'title-block');
  heading.append(el('h1', 'title', title));
  heading.append(el('p', 'badge', ctx.api.source === 'mock'
    ? 'MOCK engine · SAMPLE data · not PRODUCTION_READY'
    : 'Live engine · not PRODUCTION_READY'));
  bar.append(heading);
  root.append(bar, body);
  if (ctx.notice) {
    const note = el('p', 'toast', ctx.notice);
    root.append(note);
  }
  if (ctx.modal) root.append(ctx.modal);
  return root;
}

export function modal(title, bodyNode, actions) {
  const wrap = el('div', 'modal');
  const panel = el('div', 'modal-panel');
  panel.append(el('h2', null, title));
  panel.append(bodyNode);
  const row = el('div', 'modal-actions');
  for (const action of actions) row.append(button(action.label, action.onClick, action.className ?? 'hit'));
  panel.append(row);
  wrap.append(panel);
  return wrap;
}
