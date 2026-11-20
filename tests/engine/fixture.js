import { sampleCard, proposedSampleRoster } from '../../src/engine/index.js';

export function padDeck(opening, fill) {
  const filler = fill ?? sampleCard({ cardId: 'ACT_SAMPLE_FILL', name: 'Fill', costAp: 1 });
  const deck = opening.map((card) => structuredClone(card));
  while (deck.length < 30) deck.push(structuredClone(filler));
  if (deck.length !== 30) throw new Error(`deck length ${deck.length}`);
  return deck;
}

export function roster(mutate) {
  return proposedSampleRoster().map((avatar, index) => {
    const next = structuredClone(avatar);
    next.passive = null;
    next.maxHp = 40;
    next.hp = 40;
    if (mutate) mutate(next, index);
    return next;
  });
}

export function matchInput(options = {}) {
  const player = options.player ?? roster();
  const enemy = options.enemy ?? roster();
  const playerSpd = options.playerSpd ?? [9, 0, 0, 0];
  const enemySpd = options.enemySpd ?? [0, 0, 0, 0];
  if (playerSpd) player.forEach((avatar, index) => { avatar.stats.spd = playerSpd[index]; });
  if (enemySpd) enemy.forEach((avatar, index) => { avatar.stats.spd = enemySpd[index]; });
  const playerId = options.playerId ?? 'player';
  const enemyId = options.enemyId ?? 'enemy';
  return {
    seed: options.seed ?? 1,
    shuffleDecks: options.shuffleDecks ?? false,
    matchId: options.matchId ?? 'm',
    config: options.config,
    teams: [
      { sideId: playerId, control: options.playerControl ?? 'human', avatars: player },
      { sideId: enemyId, control: options.enemyControl ?? 'ai', avatars: enemy },
    ],
    decks: {
      [playerId]: options.playerDeck ?? padDeck([]),
      [enemyId]: options.enemyDeck ?? padDeck([]),
    },
  };
}

export function handCard(state, sideId, cardId) {
  return state.sides[sideId].zones.hand.find((card) => card.cardId === cardId) ?? null;
}
