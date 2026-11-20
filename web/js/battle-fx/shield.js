/**
 * Shield is a pool on the avatar (`avatar.shield`), not a status id.
 * The ratio is presentation of that pool against max HP.
 */

export function shieldPool(unit, engineAvatar) {
  if (Number.isInteger(engineAvatar?.shield)) return Math.max(0, engineAvatar.shield);
  if (Number.isInteger(unit?.shield)) return Math.max(0, unit.shield);
  const rows = Array.isArray(unit?.statuses) ? unit.statuses : [];
  const status = rows.find((row) => row && (row.id === 'shield' || row.name === 'shield'));
  return Number.isInteger(status?.amount) ? Math.max(0, status.amount) : 0;
}

export function shieldRatio(shield, maxHp) {
  if (!Number.isInteger(shield) || shield <= 0) return 0;
  if (!Number.isInteger(maxHp) || maxHp <= 0) return 1;
  return Math.max(0, Math.min(1, shield / maxHp));
}

export function engineAvatarFor(match, unit) {
  const engine = match?.engine ?? match?.state;
  const avatars = engine?.sides?.[unit?.sideId]?.avatars;
  if (!Array.isArray(avatars) || !unit) return null;
  return avatars.find((avatar) => avatar.unitId === unit.instanceId)
    ?? avatars.find((avatar) => avatar.avatarId === unit.avatarId)
    ?? null;
}
