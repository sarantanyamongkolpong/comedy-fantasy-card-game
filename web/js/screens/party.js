import { button, el, shell } from '../dom.js';
import { battleReady, setTeamSlot, toggleDeckCard } from '../profile.js';
import { actionModel, avatarModel, renderCard } from '../render-card.js';
import { factionName } from '../sample-catalog.js';

export function renderParty(ctx) {
  const body = el('div', 'party');
  const tabs = el('div', 'row');
  for (const [id, label] of [['team', 'Team of 4'], ['deck', 'Action deck']]) {
    const chip = button(label, () => ctx.setPartyTab(id), 'hit slim');
    if (ctx.partyTab === id) chip.classList.add('is-selected');
    tabs.append(chip);
  }
  body.append(tabs);
  const ready = battleReady(ctx.profile, ctx.api.catalog);
  const messages = el('div', 'messages');
  for (const message of ready.messages) {
    messages.append(el('p', `msg msg-${message.level}`, message.text));
  }
  body.append(messages);
  body.append(ctx.partyTab === 'deck' ? deckBuilder(ctx) : teamSelect(ctx));
  return shell(ctx, 'Team & Deck', body, { back: 'home' });
}

function teamSelect(ctx) {
  const wrap = el('div', 'team-select');
  wrap.append(el('p', 'lede', 'Four seats. Mix the factions. The game will not scold you for a rainbow team — FAC cards only complain later, at the moment you try to play them.'));
  const seats = el('div', 'seats');
  ctx.profile.team.forEach((instanceId, index) => {
    const owned = ctx.profile.avatars.find((avatar) => avatar.instanceId === instanceId);
    const def = owned ? ctx.api.catalog.avatarById(owned.avatarId) : null;
    const seat = el('div', 'seat');
    seat.append(el('p', 'fine', `Seat ${index + 1}`));
    if (def) {
      seat.append(renderCard(ctx.manifest, avatarModel(def), { onClick: () => ctx.setReplacing(index) }));
      seat.append(el('p', 'fine', `${factionName(def.factionId)} · ${def.role}`));
    }
    seats.append(seat);
  });
  wrap.append(seats);
  wrap.append(el('p', 'fine', ctx.replacing == null
    ? 'Tap a seated avatar, then tap a replacement below. Existing *_001 avatars stay in the stash with TBD stats.'
    : `Choosing a replacement for seat ${ctx.replacing + 1}.`));
  const bench = el('div', 'card-grid');
  for (const owned of ctx.profile.avatars) {
    if (ctx.profile.team.includes(owned.instanceId)) continue;
    const def = ctx.api.catalog.avatarById(owned.avatarId);
    if (!def) continue;
    bench.append(renderCard(ctx.manifest, avatarModel(def), {
      disabled: !def.battleLegal,
      reason: def.battleLegal ? '' : 'Stats TBD',
      onClick: () => {
        if (ctx.replacing == null) {
          ctx.setNotice('Tap a seated avatar first.');
          ctx.redraw();
          return;
        }
        const result = setTeamSlot(ctx.profile, ctx.replacing, owned.instanceId);
        ctx.setNotice(result.ok ? `${def.name} takes the seat.` : result.reason);
        if (result.ok) ctx.setReplacing(null);
        ctx.persist();
        ctx.redraw();
      },
    }));
  }
  wrap.append(bench);
  return wrap;
}

function deckBuilder(ctx) {
  const wrap = el('div', 'deck-builder');
  wrap.append(el('p', 'lede', 'Exactly 30 action cards. Not 29. Not 31. Duplicates are allowed until CORE-040 grows a number.'));
  const inDeck = el('div', 'card-grid deck-strip');
  for (const instanceId of ctx.profile.deck) {
    const owned = ctx.profile.actions.find((action) => action.instanceId === instanceId);
    const def = owned ? ctx.api.catalog.cardById(owned.cardId) : null;
    if (!def) continue;
    inDeck.append(renderCard(ctx.manifest, actionModel(def), {
      onClick: () => {
        const result = toggleDeckCard(ctx.profile, instanceId);
        ctx.setNotice(result.ok ? `Removed ${def.name}.` : result.reason);
        ctx.persist();
        ctx.redraw();
      },
    }));
  }
  wrap.append(el('h2', null, `In the deck (${ctx.profile.deck.length})`));
  wrap.append(inDeck);
  const spare = ctx.profile.actions.filter((action) => !ctx.profile.deck.includes(action.instanceId));
  wrap.append(el('h2', null, `On the shelf (${spare.length})`));
  const shelf = el('div', 'card-grid');
  for (const owned of spare) {
    const def = ctx.api.catalog.cardById(owned.cardId);
    if (!def) continue;
    shelf.append(renderCard(ctx.manifest, actionModel(def), {
      onClick: () => {
        const result = toggleDeckCard(ctx.profile, owned.instanceId);
        ctx.setNotice(result.ok ? `Added ${def.name}.` : result.reason);
        ctx.persist();
        ctx.redraw();
      },
    }));
  }
  if (spare.length === 0) shelf.append(el('p', 'fine', 'The shelf is empty. Gacha (TEST) can cough up more copies.'));
  wrap.append(shelf);
  return wrap;
}
