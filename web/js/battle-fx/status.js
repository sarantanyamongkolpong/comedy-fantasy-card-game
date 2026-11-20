/**
 * Status paintings follow the kinds the engine already stores.
 * debuff is painted only when a status already uses that name.
 * There is no debuff op in the rules, and this module does not add one.
 */

import { shieldPool } from './shield.js';

function collectNames(unit, engineAvatar) {
  const names = new Set();
  for (const status of unit?.statuses ?? []) {
    if (status?.id) names.add(String(status.id));
    if (status?.name) names.add(String(status.name));
  }
  for (const status of engineAvatar?.statuses ?? []) {
    if (status?.kind) names.add(String(status.kind));
  }
  return names;
}

export function statusFlags(unit, engineAvatar) {
  const names = collectNames(unit, engineAvatar);
  const buff = names.has('buff')
    || names.has('next_attack')
    || [...names].some((name) => name.endsWith('Buff'));
  return {
    shield: shieldPool(unit, engineAvatar) > 0,
    taunt: names.has('taunt'),
    regen: names.has('regen'),
    buff,
    debuff: names.has('debuff'),
  };
}
