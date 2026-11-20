/**
 * Reward copy comes from the engine outcome.
 * Null G, loot, and items stay PENDING. They are not zero and not a grant.
 */
function pendingValue(value) {
  if (value == null) return 'PENDING';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value.length > 0) return value;
  return 'PENDING';
}

function pendingList(value) {
  if (value == null) return 'PENDING';
  if (Array.isArray(value)) return value.length ? value.map(String).join(', ') : 'none';
  return 'PENDING';
}

export function rewardLines(outcome) {
  const rewards = outcome?.rewards ?? null;
  const payload = rewards?.payload ?? null;
  const g = pendingValue(payload ? payload.G : null);
  const loot = payload && Object.prototype.hasOwnProperty.call(payload, 'loot')
    ? pendingList(payload.loot ?? null)
    : pendingList(payload?.items ?? null);
  const items = pendingList(payload?.items ?? null);
  return [
    { label: 'Result', value: outcome?.winnerSideId === 'player' ? 'Victory' : outcome?.status === 'decided' ? 'Defeat' : 'PENDING' },
    { label: 'Reason', value: outcome?.reason ?? 'PENDING' },
    { label: 'G', value: g, pending: g === 'PENDING' },
    { label: 'Loot', value: loot, pending: loot === 'PENDING' },
    { label: 'Items', value: items, pending: items === 'PENDING' },
    { label: 'Payload', value: rewards?.payloadStatus ?? payload?.status ?? 'PENDING' },
    { label: 'Times emitted', value: rewards ? String(rewards.timesEmitted) : 'PENDING' },
  ];
}
