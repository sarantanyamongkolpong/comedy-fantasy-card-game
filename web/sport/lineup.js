/** Pitch geometry and lineup assignment. Pure: no DOM, no real-name fields. */

export const SLOT_W = 168;
export const SLOT_H = 116;
export const PITCH_W = 1080;
export const PITCH_H = 744;

export const FORMATIONS = Object.freeze({
  '4-3-3': Object.freeze([
    Object.freeze(['LW', 'ST', 'RW']),
    Object.freeze(['CM', 'CM', 'CM']),
    Object.freeze(['LB', 'CB', 'CB', 'RB']),
    Object.freeze(['GK']),
  ]),
  '4-2-3-1': Object.freeze([
    Object.freeze(['ST']),
    Object.freeze(['LW', 'AM', 'RW']),
    Object.freeze(['DM', 'DM']),
    Object.freeze(['LB', 'CB', 'CB', 'RB']),
    Object.freeze(['GK']),
  ]),
  '3-5-2': Object.freeze([
    Object.freeze(['ST', 'ST']),
    Object.freeze(['LWB', 'CM', 'CM', 'CM', 'RWB']),
    Object.freeze(['CB', 'CB', 'CB']),
    Object.freeze(['GK']),
  ]),
  '4-4-2': Object.freeze([
    Object.freeze(['ST', 'ST']),
    Object.freeze(['LM', 'CM', 'CM', 'RM']),
    Object.freeze(['LB', 'CB', 'CB', 'RB']),
    Object.freeze(['GK']),
  ]),
  '3-4-3': Object.freeze([
    Object.freeze(['LW', 'ST', 'RW']),
    Object.freeze(['LM', 'CM', 'CM', 'RM']),
    Object.freeze(['CB', 'CB', 'CB']),
    Object.freeze(['GK']),
  ]),
});

export const FORMATION_IDS = Object.freeze(Object.keys(FORMATIONS));

export const FOOT_COMPAT = Object.freeze({
  GK: Object.freeze(['GK']),
  LB: Object.freeze(['LB', 'LWB', 'RB']),
  RB: Object.freeze(['RB', 'RWB', 'LB']),
  CB: Object.freeze(['CB', 'DM']),
  LWB: Object.freeze(['LB', 'LWB', 'LW', 'LM']),
  RWB: Object.freeze(['RB', 'RWB', 'RW', 'RM']),
  DM: Object.freeze(['DM', 'CM', 'CB']),
  CM: Object.freeze(['CM', 'DM', 'AM']),
  AM: Object.freeze(['AM', 'CM', 'LW', 'RW']),
  LM: Object.freeze(['LW', 'LB', 'CM', 'LM']),
  RM: Object.freeze(['RW', 'RB', 'CM', 'RM']),
  LW: Object.freeze(['LW', 'LM', 'ST']),
  RW: Object.freeze(['RW', 'RM', 'ST']),
  ST: Object.freeze(['ST', 'LW', 'RW', 'AM']),
});

export const BASKET_ROLES = Object.freeze(['PG', 'SG', 'SF', 'PF', 'C']);

export const BASKET_COMPAT = Object.freeze({
  PG: Object.freeze(['PG', 'SG']),
  SG: Object.freeze(['SG', 'PG', 'SF']),
  SF: Object.freeze(['SF', 'SG', 'PF']),
  PF: Object.freeze(['PF', 'C', 'SF']),
  C: Object.freeze(['C', 'PF']),
});

export function flatRoles(formation) {
  return FORMATIONS[formation].flat();
}

export function placeRows(rows, width = PITCH_W, height = PITCH_H, buttonW = SLOT_W, buttonH = SLOT_H) {
  const placed = [];
  const gapY = (height - rows.length * buttonH) / (rows.length + 1);
  rows.forEach((roles, rowIndex) => {
    const gapX = (width - roles.length * buttonW) / (roles.length + 1);
    const y = gapY + rowIndex * (buttonH + gapY);
    roles.forEach((role, col) => {
      placed.push({
        role,
        index: placed.length,
        x: gapX + col * (buttonW + gapX),
        y,
        w: buttonW,
        h: buttonH,
      });
    });
  });
  return placed;
}

export function assignByRole(roles, cards, compatMap, previousIds = []) {
  const used = new Set();
  const previous = previousIds
    .map((id) => cards.find((card) => card.id === id))
    .filter(Boolean);
  const ordered = [...previous, ...cards];
  return roles.map((role) => {
    const compat = compatMap[role] ?? [role];
    let found = null;
    if (role === 'GK') {
      found = ordered.find((card) => card.role === 'GK' && !used.has(card.id)) ?? null;
    } else {
      for (const wanted of compat) {
        found = ordered.find((card) => card.role === wanted && card.role !== 'GK' && !used.has(card.id)) ?? null;
        if (found) break;
      }
      if (!found) {
        found = ordered.find((card) => card.role !== 'GK' && card.role !== 'COACH' && card.role !== 'ENTRY' && !used.has(card.id)) ?? null;
      }
    }
    if (found) used.add(found.id);
    return found;
  });
}

export function cycleId(slots, index, role, cards, compatMap) {
  const current = slots[index];
  const blocked = new Set(slots.filter((id, slotIndex) => slotIndex !== index));
  const compat = compatMap[role] ?? [role];
  const options = cards.filter((card) => {
    if (blocked.has(card.id)) return false;
    if (role === 'GK') return card.role === 'GK';
    if (card.role === 'GK' || card.role === 'COACH' || card.role === 'ENTRY') return false;
    return compat.includes(card.role);
  });
  if (options.length === 0) return current;
  const ids = options.map((card) => card.id);
  const at = ids.indexOf(current);
  if (at < 0) return ids[0];
  return ids[(at + 1) % ids.length];
}

export function cycleEntry(slots, index, cards) {
  const blocked = new Set(slots.filter((id, slotIndex) => slotIndex !== index && id));
  const options = cards.filter((card) => !blocked.has(card.id));
  if (options.length === 0) return slots[index];
  const ids = options.map((card) => card.id);
  const at = ids.indexOf(slots[index]);
  if (at < 0) return ids[0];
  return ids[(at + 1) % ids.length];
}

export function featuredStat(card) {
  if (!card?.stats) return null;
  const preferred = {
    GK: 'Def',
    CB: 'Def',
    LB: 'Speed',
    RB: 'Speed',
    LWB: 'Speed',
    RWB: 'Speed',
    DM: 'Def',
    CM: 'Acc',
    AM: 'Acc',
    LM: 'Speed',
    RM: 'Speed',
    LW: 'Speed',
    RW: 'Speed',
    ST: 'Power',
    PG: 'Shooting',
    SG: 'Shooting',
    SF: 'Shooting',
    PF: 'Def',
    C: 'Def',
    ENTRY: 'TopSpeed',
  };
  const key = preferred[card.role] ?? Object.keys(card.stats)[0];
  if (key == null || card.stats[key] == null) return null;
  return { key, value: card.stats[key] };
}

export function buildDefaultLineups(owned) {
  const footballers = owned.filter((card) => card.sport === 'football' && card.role !== 'COACH');
  const footCoach = owned.find((card) => card.sport === 'football' && card.role === 'COACH');
  const basketPlayers = owned.filter((card) => card.sport === 'basket' && card.role !== 'COACH');
  const basketCoach = owned.find((card) => card.sport === 'basket' && card.role === 'COACH');
  const cars = owned.filter((card) => card.sport === 'car');
  const motos = owned.filter((card) => card.sport === 'moto');
  const footSlots = assignByRole(flatRoles('4-3-3'), footballers, FOOT_COMPAT);
  const basketSlots = assignByRole(BASKET_ROLES, basketPlayers, BASKET_COMPAT);
  return {
    football: {
      formation: '4-3-3',
      coachId: footCoach?.id ?? null,
      slots: footSlots.map((card) => card?.id ?? null),
    },
    basket: {
      scheme: 'man',
      pace: 'even',
      coachId: basketCoach?.id ?? null,
      slots: basketSlots.map((card) => card?.id ?? null),
    },
    car: {
      tyre: 'medium',
      setup: 'balanced',
      slots: [cars[0]?.id ?? null, cars[1]?.id ?? null],
    },
    moto: {
      tyre: 'medium',
      setup: 'balanced',
      slots: [motos[0]?.id ?? null, motos[1]?.id ?? null],
    },
  };
}
