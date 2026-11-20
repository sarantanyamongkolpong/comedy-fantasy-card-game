/**
 * Parody motorcycle roster and venues from the v0.6 research pack.
 * Stats are synthetic BALANCE_PLACEHOLDER values. Rider stamina is not a stat
 * on these cards; the sim tracks it as a weekend-only number.
 * The sheet has 10 riders and does not give every parody make a pair, so the
 * default grid is the four complete pairs. Joan Mirage and Ayo Oguramen stay
 * in the roster for a caller-built team.
 */

function rider(id, parodyName, teamId, teamName, bikeName, top, accel, handling) {
  return {
    id,
    parodyName,
    teamId,
    teamName,
    bikeName,
    stats: { TopSpeed: top, Accel: accel, Handling: handling },
    balance: 'BALANCE_PLACEHOLDER',
    status: 'PROPOSED',
  };
}

export const MOTO_ROSTER = Object.freeze([
  rider('SPC_MOTO_ENTRY_001', 'Mako Mayhem', 'MOTO_RED_QUACK', 'Red Quack Works', 'RubberDuck V-Quack', 76, 80, 78),
  rider('SPC_MOTO_ENTRY_002', 'Paco Bagnetti', 'MOTO_RED_QUACK', 'Red Quack Works', 'RubberDuck V-Quack', 74, 70, 73),
  rider('SPC_MOTO_ENTRY_003', 'Fabio Fourturn', 'MOTO_BLUE_MELODY', 'Blue Melody Works', 'Echo V4', 72, 77, 81),
  rider('SPC_MOTO_ENTRY_004', 'Pedro Acoaster', 'MOTO_ORANGE_ANVIL', 'Orange Anvil Motors', 'Hammer Sixteen', 78, 82, 70),
  rider('SPC_MOTO_ENTRY_005', 'Jorge Martian', 'MOTO_PURPLE_PETAL', 'Purple Petal Moto', 'Petal-26', 80, 79, 68),
  rider('SPC_MOTO_ENTRY_006', 'Brady Blender', 'MOTO_ORANGE_ANVIL', 'Orange Anvil Motors', 'Hammer Sixteen', 73, 81, 72),
  rider('SPC_MOTO_ENTRY_007', 'Marco Buzzachi', 'MOTO_PURPLE_PETAL', 'Purple Petal Moto', 'Petal-26', 71, 74, 80),
  rider('SPC_MOTO_ENTRY_008', 'Joan Mirage', 'MOTO_SAKURA_FORGE', 'Sakura Forge', 'Phoenix 213', 70, 72, 75),
  rider('SPC_MOTO_ENTRY_009', 'Torak Razzle', 'MOTO_BLUE_MELODY', 'Blue Melody Works', 'Echo V4', 77, 83, 74),
  rider('SPC_MOTO_ENTRY_010', 'Ayo Oguramen', 'MOTO_PURPLE_PETAL', 'Purple Petal Moto', 'Petal-26', 72, 73, 79),
]);

const PAIR_IDS = [
  ['MOTO_RED_QUACK', 'SPC_MOTO_ENTRY_001', 'SPC_MOTO_ENTRY_002'],
  ['MOTO_BLUE_MELODY', 'SPC_MOTO_ENTRY_003', 'SPC_MOTO_ENTRY_009'],
  ['MOTO_ORANGE_ANVIL', 'SPC_MOTO_ENTRY_004', 'SPC_MOTO_ENTRY_006'],
  ['MOTO_PURPLE_PETAL', 'SPC_MOTO_ENTRY_005', 'SPC_MOTO_ENTRY_007'],
];

/** Four parody teams of two. Incomplete sheet pairs are left out of the default grid. */
export function motoTeams() {
  const byId = new Map(MOTO_ROSTER.map((entry) => [entry.id, entry]));
  return PAIR_IDS.map(([teamId, left, right]) => {
    const entries = [byId.get(left), byId.get(right)];
    return { teamId, parodyName: entries[0].teamName, entries };
  });
}

function track(id, parodyName, baseLapMs, wetPerMil, dampPerMil, flipPerMil, sectors) {
  return { id, parodyName, baseLapMs, wetPerMil, dampPerMil, flipPerMil, sectors, balance: 'BALANCE_PLACEHOLDER', status: 'PROPOSED' };
}

export const MOTO_TRACKS = Object.freeze([
  track('MUSHGELLO_VALLEY', 'Mushgello Valley', 92000, 40, 80, 20, [
    { straight: 70, corner: 15, accel: 15, share: 36 },
    { straight: 28, corner: 52, accel: 20, share: 32 },
    { straight: 48, corner: 30, accel: 22, share: 32 },
  ]),
  track('SAUSAGE_RING', 'Sausage Ring', 86000, 50, 90, 20, [
    { straight: 12, corner: 73, accel: 15, share: 34 },
    { straight: 10, corner: 75, accel: 15, share: 33 },
    { straight: 18, corner: 62, accel: 20, share: 33 },
  ]),
  track('PILLOW_ISLAND', 'Pillow Island', 84000, 70, 120, 40, [
    { straight: 55, corner: 30, accel: 15, share: 34 },
    { straight: 40, corner: 40, accel: 20, share: 33 },
    { straight: 50, corner: 30, accel: 20, share: 33 },
  ]),
  track('BURI_RAMEN', 'Buri-Ramen Raceway', 90000, 60, 100, 30, [
    { straight: 62, corner: 18, accel: 20, share: 36 },
    { straight: 24, corner: 46, accel: 30, share: 32 },
    { straight: 36, corner: 34, accel: 30, share: 32 },
  ]),
  track('SWITCHBACK_S', 'Switchback S-Bend', 88000, 80, 110, 40, [
    { straight: 22, corner: 58, accel: 20, share: 34 },
    { straight: 18, corner: 62, accel: 20, share: 33 },
    { straight: 26, corner: 50, accel: 24, share: 33 },
  ]),
  track('CORNERS_OF_CHAOS', 'Corners of Chaos', 96000, 90, 130, 50, [
    { straight: 48, corner: 32, accel: 20, share: 34 },
    { straight: 20, corner: 55, accel: 25, share: 33 },
    { straight: 40, corner: 35, accel: 25, share: 33 },
  ]),
]);
