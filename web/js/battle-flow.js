/** UI selection for battle. Cancel clears this object and does not call the engine. */

export function emptySelection() {
  return {
    mode: 'idle',
    cardInstanceId: null,
    actorAvatarId: null,
    targetId: null,
  };
}

export function beginCard(card) {
  return {
    mode: 'pickActor',
    cardInstanceId: card.instanceId,
    actorAvatarId: null,
    targetId: null,
  };
}

export function chooseActor(selection, actorId, needsEnemy) {
  return {
    ...selection,
    mode: needsEnemy ? 'pickTarget' : 'confirmPlay',
    actorAvatarId: actorId,
    targetId: null,
  };
}

export function chooseTarget(selection, targetId) {
  return {
    ...selection,
    mode: 'confirmPlay',
    targetId,
  };
}

export function cancelSelection() {
  return emptySelection();
}

/**
 * Cancel returns the same match reference and a fresh idle selection.
 * It must not be wired to playAction / discardVoluntary.
 */
export function cancelPlay(match) {
  return { match, selection: emptySelection(), calledEngine: false };
}
