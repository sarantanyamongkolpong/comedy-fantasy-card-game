/**
 * Fixture catalog. Mirrors the card record in docs/sport_v06/CONTRACTS.md.
 * `real` is private metadata for the adapter contract. Presenters strip it.
 * Screens must import the public lists from ./index.js, never render `real`.
 */

const SNAPSHOT = '2026-11-20';

function ref(name, url, season) {
  return { name, url, season, snapshotDate: SNAPSHOT };
}

function fiction() {
  return { name: null, url: null, season: null, snapshotDate: null };
}

function clamp(value) {
  return Math.max(36, Math.min(96, value));
}

function placeholderStats(sport, role, nnn) {
  const bump = (nnn * 5) % 13;
  if (sport === 'football') {
    const forward = role === 'ST' || role === 'LW' || role === 'RW';
    const back = role === 'GK' || role === 'CB' || role === 'LB' || role === 'RB';
    return {
      Power: clamp((forward ? 76 : 50) + bump),
      Def: clamp((back ? 80 : 46) + (nnn % 7)),
      Speed: clamp(58 + bump),
      Sta: clamp(62 + (nnn % 9)),
      Acc: clamp(60 + (bump % 8)),
    };
  }
  if (sport === 'basket') {
    const shooter = role === 'PG' || role === 'SG' || role === 'SF';
    return {
      Shooting: clamp((shooter ? 78 : 64) + bump),
      Def: clamp((role === 'C' || role === 'PF' ? 80 : 58) + (nnn % 6)),
      Spd: clamp(66 + (bump % 9)),
      Sta: clamp(70 + (nnn % 8)),
    };
  }
  return {
    TopSpeed: clamp(74 + bump),
    Accel: clamp(68 + (nnn % 11)),
    Handling: clamp(64 + (bump % 10)),
  };
}

function makeCard(def) {
  const id = `SPC_${def.code}_${def.role}_${def.nnn}`;
  return {
    id,
    sport: def.sport,
    role: def.role,
    parodyName: def.parodyName,
    vehicleName: def.vehicleName ?? null,
    rarity: def.rarity,
    team: def.team,
    stats: def.role === 'COACH' ? null : placeholderStats(def.sport, def.role, Number(def.nnn)),
    balance: 'BALANCE_PLACEHOLDER',
    status: 'PROPOSED',
    art: { slot: 'portrait', subjectId: id, placeholder: true },
    passive: def.passive ?? null,
    real: def.real,
  };
}

const CARD_DEFS = [
  { sport: 'football', code: 'FOOTBALL', role: 'GK', nnn: '001', parodyName: 'Theo Court-Tea', rarity: 'Epic', team: 'Royal Meringue FC', owned: true, real: ref('Thibaut Courtois', 'https://www.uefa.com/uefachampionsleague/clubs/players/250011668--thibaut-courtois/', 'UCL 2026/27') },
  { sport: 'football', code: 'FOOTBALL', role: 'RB', nnn: '001', parodyName: 'Ash-Raf Haki-Mi', rarity: 'R', team: 'Royal Meringue FC', owned: true, real: ref('Achraf Hakimi', 'https://www.uefa.com/uefachampionsleague/clubs/players/250088061--achraf-hakimi/', 'UCL 2026/27') },
  { sport: 'football', code: 'FOOTBALL', role: 'CB', nnn: '001', parodyName: 'Virgil Van Brick', rarity: 'Epic', team: 'Liver-Pool Noodles', owned: true, real: ref('Virgil van Dijk', 'https://www.uefa.com/uefachampionsleague/clubs/players/50327420--virgil-van-dijk/', 'UCL 2026/27') },
  { sport: 'football', code: 'FOOTBALL', role: 'CB', nnn: '002', parodyName: 'Willy Patchwork', rarity: 'R', team: 'Royal Meringue FC', owned: true, real: ref('Willian Pacho', 'https://www.uefa.com/uefachampionsleague/clubs/players/250174126--willian-pacho/', 'UCL 2026/27') },
  { sport: 'football', code: 'FOOTBALL', role: 'LB', nnn: '001', parodyName: 'Noodle Mendez', rarity: 'N', team: 'Royal Meringue FC', owned: true, real: ref('Nuno Mendes', 'https://www.uefa.com/uefachampionsleague/clubs/players/250136465--nuno-mendes/', 'UCL 2026/27') },
  { sport: 'football', code: 'FOOTBALL', role: 'DM', nnn: '001', parodyName: 'Rodri-Go Round', rarity: 'R', team: 'Metro Blueprints Athletic', owned: true, real: ref('Rodri', 'https://www.uefa.com/uefachampionsleague/clubs/players/250082664--rodri/', 'UCL 2026/27') },
  { sport: 'football', code: 'FOOTBALL', role: 'CM', nnn: '001', parodyName: 'Pedri-Pasta', rarity: 'N', team: 'Catalonia Coffee Club', owned: true, real: ref('Pedri', 'https://www.uefa.com/uefachampionsleague/clubs/players/250143693--pedri/', 'UCL 2026/27') },
  { sport: 'football', code: 'FOOTBALL', role: 'AM', nnn: '001', parodyName: 'Jude Belly-Ham', rarity: 'Epic', team: 'Royal Meringue FC', owned: true, real: ref('Jude Bellingham', 'https://www.uefa.com/uefachampionsleague/clubs/players/250128377--jude-bellingham/', 'UCL 2026/27') },
  { sport: 'football', code: 'FOOTBALL', role: 'LW', nnn: '001', parodyName: 'Vinnie Juicebox Jr.', rarity: 'R', team: 'Royal Meringue FC', owned: true, real: ref('Vinicius Junior', 'https://www.uefa.com/uefachampionsleague/clubs/players/250121533--vinicius-junior/', 'UCL 2026/27') },
  { sport: 'football', code: 'FOOTBALL', role: 'ST', nnn: '001', parodyName: 'Earl Haa-Landlord', rarity: 'EX', team: 'Metro Blueprints Athletic', owned: true, real: ref('Erling Haaland', 'https://www.uefa.com/uefachampionsleague/clubs/players/250103758--erling-haaland/', 'UCL 2026/27') },
  { sport: 'football', code: 'FOOTBALL', role: 'RW', nnn: '001', parodyName: 'Lemon Yammal', rarity: 'N', team: 'Catalonia Coffee Club', owned: true, real: ref('Lamine Yamal', 'https://www.uefa.com/uefachampionsleague/clubs/players/250176450--lamine-yamal/statistics/', 'UCL 2026/27') },
  { sport: 'football', code: 'FOOTBALL', role: 'ST', nnn: '002', parodyName: 'Killian Map-Pay', rarity: 'Epic', team: 'Royal Meringue FC', owned: true, real: ref('Kylian Mbappe', 'https://www.uefa.com/uefachampionsleague/clubs/players/250076574--kylian-mbappe/', 'UCL 2026/27') },
  { sport: 'football', code: 'FOOTBALL', role: 'ST', nnn: '003', parodyName: 'Lion Messo', rarity: 'EX', team: 'Royal Meringue FC', owned: false, real: ref('Lionel Messi', 'https://www.mlssoccer.com/news/inter-miami-cf-forward-lionel-messi-wins-2026-mls-golden-boot-presented-by-audi', 'MLS 2026') },
  { sport: 'football', code: 'FOOTBALL', role: 'GK', nnn: '002', parodyName: 'Netty Spare-Gloves', rarity: 'N', team: 'Your Complex', owned: true, real: fiction() },
  { sport: 'football', code: 'FOOTBALL', role: 'COACH', nnn: '001', parodyName: 'Pepper Gourd-ola', rarity: 'Epic', team: 'Metro Blueprints Athletic', owned: true, passive: 'Positional build. PROPOSED.', real: ref('Pep Guardiola', 'https://www.uefa.com/uefachampionsleague/news/0280-17c6b1ac9a53-0dc7fbd642da-1000--in-the-zone-city-slickers/', 'UCL') },
  { sport: 'football', code: 'FOOTBALL', role: 'COACH', nnn: '002', parodyName: 'Hansy Flicker', rarity: 'R', team: 'Catalonia Coffee Club', owned: true, passive: 'High press. PROPOSED.', real: ref('Hansi Flick', 'https://www.uefa.com/uefachampionsleague/news/0298-1d89b8face21-7d7daaad2e8e-1000--meet-the-champions-league-semi-finalists/', 'UCL') },
  { sport: 'football', code: 'FOOTBALL', role: 'COACH', nnn: '003', parodyName: 'Tony Count-Té', rarity: 'R', team: 'Royal Meringue FC', owned: true, passive: 'Three-back wingbacks. PROPOSED.', real: ref('Antonio Conte', 'https://www.uefa.com/uefachampionsleague/news/027a-1672a7a4bb35-e53198f581e7-1000--round-of-16-meet-the-teams/', 'UCL') },
  { sport: 'football', code: 'FOOTBALL', role: 'COACH', nnn: '004', parodyName: 'Carlo Anchovy-Lotti', rarity: 'Epic', team: 'Royal Meringue FC', owned: true, passive: 'Adaptive bench coat. PROPOSED.', real: ref('Carlo Ancelotti', 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/carlo-ancelotti-brazil-attacking-options', 'FIFA profile') },

  { sport: 'basket', code: 'BASKET', role: 'PG', nnn: '001', parodyName: 'Stew Currywurst', rarity: 'R', team: 'Golden Snack Wafflers', owned: true, real: ref('Stephen Curry', 'https://www.nba.com/stats/leaders?Season=2024-25&SeasonType=Regular+Season&StatCategory=AST', 'NBA 2024/25') },
  { sport: 'basket', code: 'BASKET', role: 'C', nnn: '001', parodyName: 'Nikola Yogurt', rarity: 'EX', team: 'Denver Dino Nuggets', owned: true, real: ref('Nikola Jokic', 'https://www.nba.com/nuggets/news/nikola-jokic-named-to-kia-all-nba-first-team-3', 'NBA 2024/25') },
  { sport: 'basket', code: 'BASKET', role: 'C', nnn: '002', parodyName: 'Victor Wobble-yama', rarity: 'Epic', team: 'Denver Dino Nuggets', owned: false, real: ref('Victor Wembanyama', 'https://www.nba.com/stats/leaders?Season=2024-25&SeasonType=Regular+Season&StatCategory=BLK', 'NBA 2024/25') },
  { sport: 'basket', code: 'BASKET', role: 'SG', nnn: '001', parodyName: 'Shy Gorgeous Salamander', rarity: 'Epic', team: 'Golden Snack Wafflers', owned: true, real: ref('Shai Gilgeous-Alexander', 'https://www.nba.com/news/kia-nba-most-valuable-player-award-2024-25-shai-gilgeous-alexander', 'NBA 2024/25') },
  { sport: 'basket', code: 'BASKET', role: 'PF', nnn: '001', parodyName: 'Yannis Alphabet-Soup', rarity: 'R', team: 'Golden Snack Wafflers', owned: true, real: ref('Giannis Antetokounmpo', 'https://www.nba.com/bucks/news/giannis-antetokounmpo-named-eastern-conference-player-of-the-week-24', 'NBA 2024/25') },
  { sport: 'basket', code: 'BASKET', role: 'SF', nnn: '001', parodyName: 'LeBrawn Jams', rarity: 'Epic', team: 'LA Latte-Makers', owned: true, real: ref('LeBron James', 'https://www.nba.com/lakers/news/lebron-james-named-to-2024-25-all-nba-second-team-052325', 'NBA 2024/25') },
  { sport: 'basket', code: 'BASKET', role: 'PG', nnn: '002', parodyName: 'Kaitlyn Cluck', rarity: 'R', team: 'Indiana Flavor', owned: false, real: ref('Caitlin Clark', 'https://fever.wnba.com/news/indiana-fever-guards-caitlin-clark-and-kelsey-mitchell-named-to-2026-all-wnba-first-team', 'WNBA 2026') },
  { sport: 'basket', code: 'BASKET', role: 'PF', nnn: '002', parodyName: 'Ay-Jay Wobble-Son', rarity: 'EX', team: 'Indiana Flavor', owned: false, real: ref('Aja Wilson', 'https://www.wnba.com/news/wilson-named-2026-most-valuable-player', 'WNBA 2026') },
  { sport: 'basket', code: 'BASKET', role: 'PF', nnn: '003', parodyName: 'Brianna Stew-Pot', rarity: 'N', team: 'LA Latte-Makers', owned: false, real: ref('Breanna Stewart', 'https://liberty.wnba.com/roster', 'WNBA 2026') },
  { sport: 'basket', code: 'BASKET', role: 'PF', nnn: '004', parodyName: 'Angel Rice-Bowl', rarity: 'N', team: 'Indiana Flavor', owned: false, real: ref('Angel Reese', 'https://www.wnba.com/news/reese-named-2026-defensive-player-of-the-year', 'WNBA 2026') },
  { sport: 'basket', code: 'BASKET', role: 'COACH', nnn: '001', parodyName: 'Chef Stevie Stir', rarity: 'Epic', team: 'Golden Snack Wafflers', owned: true, passive: 'Movement offense. PROPOSED.', real: ref('Steve Kerr', 'https://www.nba.com/warriors/news/warriors-head-coach-steve-kerr-earns-600th-career-win-20260316', 'NBA') },
  { sport: 'basket', code: 'BASKET', role: 'COACH', nnn: '002', parodyName: 'Gregg Popcorn-Vich', rarity: 'R', team: 'Denver Dino Nuggets', owned: true, passive: 'Rotation discipline. PROPOSED.', real: ref('Gregg Popovich', 'https://www.nba.com/spurs/news/gregg-popovich-transitions-to-spurs-president-of-basketball-operations', 'NBA') },
  { sport: 'basket', code: 'BASKET', role: 'COACH', nnn: '003', parodyName: 'Becky Ham-Bun', rarity: 'N', team: 'Indiana Flavor', owned: true, passive: 'Clutch subs. PROPOSED.', real: ref('Becky Hammon', 'https://aces.wnba.com/head-coach-becky-hammon', 'WNBA') },

  { sport: 'car', code: 'CAR', role: 'ENTRY', nnn: '001', parodyName: 'Lando Nori-Rice', vehicleName: 'Zesteroid V1', rarity: 'Epic', team: 'Papaya Peel Racing', owned: true, real: ref('Lando Norris', 'https://www.formula1.com/en/drivers/lando-norris', '2026') },
  { sport: 'car', code: 'CAR', role: 'ENTRY', nnn: '002', parodyName: 'Oscar Pie-Astro', vehicleName: 'Zesteroid V1', rarity: 'R', team: 'Papaya Peel Racing', owned: true, real: ref('Oscar Piastri', 'https://www.formula1.com/en/drivers/oscar-piastri', '2026') },
  { sport: 'car', code: 'CAR', role: 'ENTRY', nnn: '003', parodyName: 'Charlie LaCrêpe', vehicleName: 'Pasta Rocket', rarity: 'Epic', team: 'Scarlet Spaghetti Works', owned: true, real: ref('Charles Leclerc', 'https://www.formula1.com/en/drivers/charles-leclerc', '2026') },
  { sport: 'car', code: 'CAR', role: 'ENTRY', nnn: '004', parodyName: 'Lewie Ham-a-Ton', vehicleName: 'Pasta Rocket', rarity: 'EX', team: 'Scarlet Spaghetti Works', owned: true, real: ref('Lewis Hamilton', 'https://www.formula1.com/en/drivers/lewis-hamilton', '2026') },
  { sport: 'car', code: 'CAR', role: 'ENTRY', nnn: '005', parodyName: 'Georgie Rustle', vehicleName: 'Teaspoon Turbo', rarity: 'R', team: 'Silver Spoon GP', owned: false, real: ref('George Russell', 'https://www.formula1.com/en/drivers/george-russell', '2026') },
  { sport: 'car', code: 'CAR', role: 'ENTRY', nnn: '006', parodyName: 'Kimi Anti-Noodle', vehicleName: 'Teaspoon Turbo', rarity: 'N', team: 'Silver Spoon GP', owned: false, real: ref('Kimi Antonelli', 'https://www.formula1.com/en/drivers/kimi-antonelli', '2026') },
  { sport: 'car', code: 'CAR', role: 'ENTRY', nnn: '007', parodyName: 'Max Verstomper', vehicleName: 'Moo-Boost', rarity: 'EX', team: 'Thunder Moo Motorsport', owned: false, real: ref('Max Verstappen', 'https://www.formula1.com/en/drivers/max-verstappen', '2026') },
  { sport: 'car', code: 'CAR', role: 'ENTRY', nnn: '008', parodyName: 'Isaac Hat-Jar', vehicleName: 'Moo-Boost', rarity: 'R', team: 'Thunder Moo Motorsport', owned: false, real: ref('Isack Hadjar', 'https://www.formula1.com/en/drivers/isack-hadjar', '2026') },
  { sport: 'car', code: 'CAR', role: 'ENTRY', nnn: '009', parodyName: 'Nico Hula-Burger', vehicleName: 'Pretzel Drive', rarity: 'R', team: 'Noodle Torque Racing', owned: false, real: ref('Nico Hulkenberg', 'https://www.formula1.com/en/drivers/nico-hulkenberg', '2026') },
  { sport: 'car', code: 'CAR', role: 'ENTRY', nnn: '010', parodyName: 'Gabe Burrito-Letto', vehicleName: 'Pretzel Drive', rarity: 'N', team: 'Noodle Torque Racing', owned: false, real: ref('Gabriel Bortoleto', 'https://www.formula1.com/en/drivers/gabriel-bortoleto', '2026') },
  { sport: 'car', code: 'CAR', role: 'ENTRY', nnn: '011', parodyName: 'Carlos Saucez', vehicleName: 'Berry Burner', rarity: 'Epic', team: 'Royal Blueberries GP', owned: false, real: ref('Carlos Sainz', 'https://www.formula1.com/en/drivers/carlos-sainz', '2026') },
  { sport: 'car', code: 'CAR', role: 'ENTRY', nnn: '012', parodyName: 'Alex All-Bun', vehicleName: 'Berry Burner', rarity: 'N', team: 'Royal Blueberries GP', owned: false, real: ref('Alexander Albon', 'https://www.formula1.com/en/drivers/alexander-albon', '2026') },

  { sport: 'moto', code: 'MOTO', role: 'ENTRY', nnn: '001', parodyName: 'Mako Mayhem', vehicleName: 'RubberDuck V-Quack', rarity: 'EX', team: 'Red Quack Works', owned: true, real: ref('Marc Marquez', 'https://www.motogp.com/en/riders/marc-marquez/23e50438-a657-4fb0-a190-3262b5472f29', '2026') },
  { sport: 'moto', code: 'MOTO', role: 'ENTRY', nnn: '002', parodyName: 'Paco Bagnetti', vehicleName: 'RubberDuck V-Quack', rarity: 'Epic', team: 'Red Quack Works', owned: true, real: ref('Francesco Bagnaia', 'https://www.motogp.com/en/riders/francesco-bagnaia/66b78301-5826-4986-b11e-fa68a7bd77a7', '2026') },
  { sport: 'moto', code: 'MOTO', role: 'ENTRY', nnn: '003', parodyName: 'Fabio Fourturn', vehicleName: 'Echo V4', rarity: 'Epic', team: 'Blue Melody Works', owned: true, real: ref('Fabio Quartararo', 'https://www.motogp.com/en/riders/fabio-quartararo/bf95d959-6a60-44f1-84b5-ded861e62578', '2026') },
  { sport: 'moto', code: 'MOTO', role: 'ENTRY', nnn: '004', parodyName: 'Pedro Acoaster', vehicleName: 'Hammer Sixteen', rarity: 'R', team: 'Orange Anvil Motors', owned: true, real: ref('Pedro Acosta', 'https://www.motogp.com/en/riders/pedro-acosta/ea39a0af-95d3-4a37-81a7-f332efdb9216', '2026') },
  { sport: 'moto', code: 'MOTO', role: 'ENTRY', nnn: '005', parodyName: 'Jorge Martian', vehicleName: 'Petal-26', rarity: 'EX', team: 'Purple Petal Moto', owned: false, real: ref('Jorge Martin', 'https://www.motogp.com/en/riders/jorge-martin/5b9af34e-da94-4ca2-9c4c-6be0fc8b1bbc', '2026') },
  { sport: 'moto', code: 'MOTO', role: 'ENTRY', nnn: '006', parodyName: 'Brady Blender', vehicleName: 'Hammer Sixteen', rarity: 'R', team: 'Orange Anvil Motors', owned: false, real: ref('Brad Binder', 'https://www.motogp.com/en/riders/brad-binder/ade5ef32-01ea-487c-95ca-491544a668ed', '2026') },
  { sport: 'moto', code: 'MOTO', role: 'ENTRY', nnn: '007', parodyName: 'Marco Buzzachi', vehicleName: 'Petal-26', rarity: 'R', team: 'Purple Petal Moto', owned: false, real: ref('Marco Bezzecchi', 'https://www.motogp.com/en/riders/marco-bezzecchi/e622ec5b-5ccf-457c-a67f-ec028f0ddf6e', '2026') },
  { sport: 'moto', code: 'MOTO', role: 'ENTRY', nnn: '008', parodyName: 'Joan Mirage', vehicleName: 'Phoenix 213', rarity: 'N', team: 'Sakura Forge', owned: false, real: ref('Joan Mir', 'https://www.motogp.com/en/riders/joan-mir/f55f9c34-8621-437b-ae04-ae2418720204', '2026') },
  { sport: 'moto', code: 'MOTO', role: 'ENTRY', nnn: '009', parodyName: 'Torak Razzle', vehicleName: 'Echo V4', rarity: 'Epic', team: 'Blue Melody Works', owned: false, real: ref('Toprak Razgatlioglu', 'https://www.motogp.com/en/riders/toprak-razgatlioglu/c883a3b8-17ce-419d-b71b-32c252f6fc7e', '2026') },
  { sport: 'moto', code: 'MOTO', role: 'ENTRY', nnn: '010', parodyName: 'Ayo Oguramen', vehicleName: 'Petal-26', rarity: 'N', team: 'Purple Petal Moto', owned: false, real: ref('Ai Ogura', 'https://www.motogp.com/en/riders/ai-ogura/244b6f51-ac33-40ee-876d-9401dc9d1346', '2026') },
];

const RAW_CARDS = CARD_DEFS.map((def) => makeCard(def));

function opponent(sport, code, role, nnn, parodyName, team, vehicleName = null) {
  const card = makeCard({
    sport,
    code,
    role,
    nnn,
    parodyName,
    vehicleName,
    rarity: 'N',
    team,
    real: fiction(),
  });
  return card;
}

const RAW_OPPONENTS = {
  football: [
    ['GK', '901', 'Puddle Net'],
    ['RB', '901', 'Mud Boot'],
    ['CB', '901', 'Clay Wall'],
    ['CB', '902', 'Sod Story'],
    ['LB', '901', 'Left Puddle'],
    ['CM', '901', 'Drain Cover'],
    ['CM', '902', 'Mid Puddle'],
    ['CM', '903', 'Splash Pass'],
    ['LW', '901', 'Wide Puddle'],
    ['ST', '901', 'Goal Puddle'],
    ['RW', '901', 'Right Puddle'],
  ].map(([role, nnn, parodyName]) => opponent('football', 'FOOTBALL', role, nnn, parodyName, 'Puddle United')),
  basket: [
    ['PG', '901', 'Gravy Dish'],
    ['SG', '901', 'Ladle Arc'],
    ['SF', '901', 'Broth Wing'],
    ['PF', '901', 'Dumpling Post'],
    ['C', '901', 'Stock Pot'],
  ].map(([role, nnn, parodyName]) => opponent('basket', 'BASKET', role, nnn, parodyName, 'Gravy City Hoops')),
  car: [
    opponent('car', 'CAR', 'ENTRY', '901', 'Crumb McLeft', 'Biscuit Brake Club', 'Digestive Dart'),
    opponent('car', 'CAR', 'ENTRY', '902', 'Crumb McRight', 'Biscuit Brake Club', 'Digestive Dart'),
  ],
  moto: [
    opponent('moto', 'MOTO', 'ENTRY', '901', 'Sid Spoon', 'Spoonslide', 'Spoonframe'),
    opponent('moto', 'MOTO', 'ENTRY', '902', 'Sid Fork', 'Spoonslide', 'Spoonframe'),
  ],
};

export const SPORTS = Object.freeze([
  Object.freeze({ id: 'football', label: 'Football', blurb: '11 vs 11, one keeper', bannerId: 'SPORT_FOOTBALL', venue: 'Sangria Bernaboo Dome' }),
  Object.freeze({ id: 'basket', label: 'Basketball', blurb: '5 on the court', bannerId: 'SPORT_BASKET', venue: 'Cheese Center' }),
  Object.freeze({ id: 'car', label: 'Car Racing', blurb: '2 cars, one plan', bannerId: 'SPORT_CAR', venue: 'Mozza Speedway' }),
  Object.freeze({ id: 'moto', label: 'Motorcycle', blurb: '2 bikes, one plan', bannerId: 'SPORT_MOTO', venue: 'Mushgello Valley' }),
]);

export const BANNER_INFO = Object.freeze(SPORTS.map((sport) => Object.freeze({
  id: sport.bannerId,
  sport: sport.id,
  label: sport.label,
})));

export const BANNERS = Object.freeze(BANNER_INFO.map((banner) => banner.id));

export const STARTER_OWNED = Object.freeze(
  CARD_DEFS.filter((def) => def.owned).map((def) => `SPC_${def.code}_${def.role}_${def.nnn}`),
);

export const AWAY = Object.freeze({
  football: Object.freeze({ name: 'Puddle United', formation: '4-3-3' }),
  basket: Object.freeze({ name: 'Gravy City Hoops', scheme: 'zone' }),
  car: Object.freeze({ name: 'Biscuit Brake Club' }),
  moto: Object.freeze({ name: 'Spoonslide' }),
});

export function presentCard(card) {
  if (!card) return null;
  return {
    id: card.id,
    sport: card.sport,
    role: card.role,
    parodyName: card.parodyName,
    vehicleName: card.vehicleName ?? null,
    rarity: card.rarity,
    team: card.team,
    stats: card.stats ? { ...card.stats } : null,
    balance: card.balance,
    status: card.status,
    art: { ...card.art },
    passive: card.passive ?? null,
  };
}

export function listPublicCards() {
  return RAW_CARDS.map((card) => presentCard(card));
}

export function getCard(id) {
  return presentCard(RAW_CARDS.find((card) => card.id === id) ?? null);
}

export function opponentsFor(sport) {
  return (RAW_OPPONENTS[sport] ?? []).map((card) => presentCard(card));
}

export function poolForBanner(bannerId) {
  const sport = BANNER_INFO.find((banner) => banner.id === bannerId)?.sport;
  return listPublicCards().filter((card) => card.sport === sport);
}

export function sportMeta(sportId) {
  return SPORTS.find((sport) => sport.id === sportId) ?? null;
}

/** Test-only: real names that must never reach a presenter or a sim string. */
export function privateRealNames() {
  const names = [];
  for (const card of RAW_CARDS) {
    if (card.real?.name) names.push(card.real.name);
  }
  return names;
}
