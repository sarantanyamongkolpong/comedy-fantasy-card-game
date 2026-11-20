/**
 * AUTO timing is PROPOSED. The decisions come from the engine's runAutoTurn.
 * This file does not choose cards.
 */

export const AUTO_TIMING = Object.freeze({
  status: 'PROPOSED',
  ms: Object.freeze({ slow: 960, normal: 640, fast: 320 }),
});

export function speedChoices(rules) {
  const options = rules?.autoPolicy?.speed?.options;
  if (Array.isArray(options) && options.length > 0 && options.every((item) => typeof item === 'string')) return options;
  return ['slow', 'normal', 'fast'];
}

export function autoDelayMs(speed, overrideMs) {
  if (Number.isInteger(overrideMs) && overrideMs >= 0) return overrideMs;
  return AUTO_TIMING.ms[speed] ?? AUTO_TIMING.ms.normal;
}

export function actionCaption(entry) {
  if (!entry) return 'Auto';
  if (typeof entry === 'string') return entry;
  if (entry.text) return String(entry.text);
  const card = entry.cardId ?? entry.cardInstanceId;
  if (entry.kind === 'play' || entry.type === 'play') return `${entry.actorAvatarId ?? 'Avatar'} plays ${card ?? 'a card'}`;
  if (entry.kind === 'discard_voluntary') return `Toss ${card ?? 'a card'}`;
  if (entry.kind === 'mandatory_discard') return 'Discard down to hand size';
  if (entry.kind === 'end_turn' || entry.type === 'end_turn') return 'End turn';
  return String(entry.kind || entry.type || 'Auto action');
}

export function fightSignature(match) {
  const units = (match?.units ?? []).map((unit) => `${unit.instanceId}:${unit.hp}:${unit.ko ? 1 : 0}`).join(',');
  const hand = (match?.zones?.player?.hand ?? []).map((card) => card.instanceId).join(',');
  return `${match?.phase ?? ''}|${match?.turnIndex ?? ''}|${hand}|${units}`;
}
