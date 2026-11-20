/**
 * Parody car roster and venues from the v0.6 research pack.
 * Stats are synthetic BALANCE_PLACEHOLDER values. They are not telemetry.
 * Real identities are not stored here.
 */

function car(id, parodyName, teamId, teamName, carName, top, accel, handling) {
  return {
    id,
    parodyName,
    teamId,
    teamName,
    carName,
    stats: { TopSpeed: top, Accel: accel, Handling: handling },
    balance: 'BALANCE_PLACEHOLDER',
    status: 'PROPOSED',
  };
}

export const CAR_ROSTER = Object.freeze([
  car('SPC_CAR_ENTRY_001', 'Lando Nori-Rice', 'CAR_PAPAYA_PEEL', 'Papaya Peel Racing', 'Zesteroid V1', 74, 70, 68),
  car('SPC_CAR_ENTRY_002', 'Oscar Pie-Astro', 'CAR_PAPAYA_PEEL', 'Papaya Peel Racing', 'Zesteroid V1', 70, 66, 76),
  car('SPC_CAR_ENTRY_003', 'Charlie LaCrêpe', 'CAR_SCARLET_SPAGHETTI', 'Scarlet Spaghetti Works', 'Pasta Rocket', 78, 72, 64),
  car('SPC_CAR_ENTRY_004', 'Lewie Ham-a-Ton', 'CAR_SCARLET_SPAGHETTI', 'Scarlet Spaghetti Works', 'Pasta Rocket', 73, 69, 71),
  car('SPC_CAR_ENTRY_005', 'Georgie Rustle', 'CAR_SILVER_SPOON', 'Silver Spoon GP', 'Teaspoon Turbo', 69, 67, 80),
  car('SPC_CAR_ENTRY_006', 'Kimi Anti-Noodle', 'CAR_SILVER_SPOON', 'Silver Spoon GP', 'Teaspoon Turbo', 77, 74, 62),
  car('SPC_CAR_ENTRY_007', 'Max Verstomper', 'CAR_THUNDER_MOO', 'Thunder Moo Motorsport', 'Moo-Boost', 80, 76, 66),
  car('SPC_CAR_ENTRY_008', 'Isaac Hat-Jar', 'CAR_THUNDER_MOO', 'Thunder Moo Motorsport', 'Moo-Boost', 71, 73, 74),
  car('SPC_CAR_ENTRY_009', 'Nico Hula-Burger', 'CAR_NOODLE_TORQUE', 'Noodle Torque Racing', 'Pretzel Drive', 68, 70, 72),
  car('SPC_CAR_ENTRY_010', 'Gabe Burrito-Letto', 'CAR_NOODLE_TORQUE', 'Noodle Torque Racing', 'Pretzel Drive', 75, 78, 63),
  car('SPC_CAR_ENTRY_011', 'Carlos Saucez', 'CAR_ROYAL_BLUEBERRIES', 'Royal Blueberries GP', 'Berry Burner', 72, 65, 77),
  car('SPC_CAR_ENTRY_012', 'Alex All-Bun', 'CAR_ROYAL_BLUEBERRIES', 'Royal Blueberries GP', 'Berry Burner', 66, 71, 79),
]);

function track(id, parodyName, baseLapMs, wetPerMil, dampPerMil, flipPerMil, sectors) {
  return { id, parodyName, baseLapMs, wetPerMil, dampPerMil, flipPerMil, sectors, balance: 'BALANCE_PLACEHOLDER', status: 'PROPOSED' };
}

export const CAR_TRACKS = Object.freeze([
  track('MOZZA_SPEEDWAY', 'Mozza Speedway', 76000, 30, 70, 20, [
    { straight: 78, corner: 8, accel: 14, share: 36 },
    { straight: 22, corner: 58, accel: 20, share: 32 },
    { straight: 64, corner: 16, accel: 20, share: 32 },
  ]),
  track('MONOCLE_HARBOR', 'Monocle Harbor Loop', 94000, 20, 60, 10, [
    { straight: 15, corner: 70, accel: 15, share: 34 },
    { straight: 10, corner: 75, accel: 15, share: 33 },
    { straight: 20, corner: 60, accel: 20, share: 33 },
  ]),
  track('SUSHI_ZAG', 'Sushi-Zag Circuit', 88000, 80, 120, 40, [
    { straight: 35, corner: 45, accel: 20, share: 34 },
    { straight: 30, corner: 50, accel: 20, share: 33 },
    { straight: 40, corner: 40, accel: 20, share: 33 },
  ]),
  track('SILVER_SPOONSTONE', 'Silver Spoonstone', 86000, 90, 140, 50, [
    { straight: 45, corner: 40, accel: 15, share: 34 },
    { straight: 25, corner: 55, accel: 20, share: 33 },
    { straight: 40, corner: 40, accel: 20, share: 33 },
  ]),
  track('SPAGHETTI_SUMMIT', 'Spa-ghetti Summit', 104000, 180, 220, 160, [
    { straight: 55, corner: 25, accel: 20, share: 36 },
    { straight: 20, corner: 55, accel: 25, share: 34 },
    { straight: 35, corner: 40, accel: 25, share: 30 },
  ]),
  track('SINGA_POUR', 'Singa-Pour Night Loop', 98000, 70, 150, 30, [
    { straight: 30, corner: 50, accel: 20, share: 34 },
    { straight: 15, corner: 65, accel: 20, share: 33 },
    { straight: 25, corner: 50, accel: 25, share: 33 },
  ]),
]);

/** Six parody constructors, two entries each. */
export function carTeams() {
  const order = [];
  const grouped = new Map();
  for (const entry of CAR_ROSTER) {
    if (!grouped.has(entry.teamId)) {
      grouped.set(entry.teamId, []);
      order.push(entry.teamId);
    }
    grouped.get(entry.teamId).push(entry);
  }
  return order.map((teamId) => {
    const entries = grouped.get(teamId);
    return { teamId, parodyName: entries[0].teamName, entries };
  });
}
