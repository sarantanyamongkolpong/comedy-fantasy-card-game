/**
 * Sport Complex art catalog.
 * Parody names and card ids follow origin/sport/v06-data docs/sport_v06/PARODY_NAMES.md
 * at 7b4ffccc9f16106b0674dceee8ed4d42090f0e49. Real identities are not stored here.
 * Athlete "lean" pairs tint silhouette placeholders only. Crest, venue, and track
 * colours follow the sheet's specific material notes (not famous kits or liveries).
 */

export const PARODY_SOURCE = {
  ref: 'origin/sport/v06-data:docs/sport_v06/PARODY_NAMES.md',
  commit: '7b4ffccc9f16106b0674dceee8ed4d42090f0e49',
  nameStatus: 'PROPOSED',
};

export const LEAN = {
  'lilac and pewter': ['#C7B4D6', '#8E9099', '#5C4E6A'],
  'mustard yellow and charcoal': ['#E1B43A', '#2C2A28', '#F4E2A8'],
  'toasted gold and herb green': ['#C9893A', '#3E6B45', '#F0D7A4'],
  'mint and porcelain': ['#A9D8C8', '#F4F7F6', '#2F6D62'],
  'cream and parsley green': ['#F3E6C4', '#3F6B45', '#FBF6EA'],
  'mango and lime': ['#F0A03A', '#B7D36A', '#FFF1D2'],
  'beet purple and cream': ['#7A3E62', '#F6E7D4', '#C46B8A'],
  'sea-glass and sand': ['#7EB8B0', '#E6D2B5', '#F7F3EA'],
  'buttermilk yellow and cocoa': ['#F0D78A', '#6B4226', '#FFF6DC'],
  'teapot blue and steam white': ['#6FA4C4', '#F7FBFD', '#2E5870'],
  'berry purple and seed gold': ['#6E3B73', '#E2B34A', '#F6E7F4'],
  'lemon pith and leaf green': ['#F3E7A8', '#6A8F4E', '#FFFBE8'],
  'dusk peach and ink': ['#F0B59A', '#241C28', '#F8E3D6'],
  'brine green and cork brown': ['#7EA37A', '#8A5A3A', '#E5F0DC'],
  'pond green and koi orange': ['#2F6D62', '#E07A3A', '#E7F2EF'],
  'wheat gold and tomato blush': ['#E2C27A', '#D4726A', '#FBF3E2'],
};

export const CARD = {
  w: 1024,
  h: 1536,
  portrait: { x: 132, y: 168, w: 760, h: 680 },
  name: { x: 132, y: 884, w: 760, h: 92 },
  badge: { x: 78, y: 64, w: 108, h: 108 },
  rules: { x: 120, y: 1168, w: 784, h: 248 },
  stat: { y: 1004, h: 136, x: 120, w: 784, gap: 14 },
};

export const TOKEN = { w: 512, h: 512, cx: 256, cy: 256, outer: 228, hole: 156 };

export function statWindows(count) {
  const { x, w, gap, y, h } = CARD.stat;
  const width = (w - gap * (count - 1)) / count;
  return Array.from({ length: count }, (_, index) => ({
    x: Math.round((x + index * (width + gap)) * 100) / 100,
    y,
    w: Math.round(width * 100) / 100,
    h,
  }));
}

export const SPORT = {
  football: {
    id: 'football',
    stats: ['Power', 'Def', 'Speed', 'Sta', 'Acc'],
    accent: '#2F8F55',
    accentSoft: '#D7EBD0',
    emblem: 'ball',
  },
  basket: {
    id: 'basket',
    stats: ['Shooting', 'Def', 'Spd', 'Sta'],
    accent: '#E07A2F',
    accentSoft: '#F8E2CC',
    emblem: 'hoop',
  },
  car: {
    id: 'car',
    stats: ['TopSpeed', 'Accel', 'Handling'],
    accent: '#C4554A',
    accentSoft: '#F3DDD4',
    emblem: 'wheel',
  },
  moto: {
    id: 'moto',
    stats: ['TopSpeed', 'Accel', 'Handling'],
    accent: '#3A6EA5',
    accentSoft: '#D5E4F2',
    emblem: 'helmet',
  },
};

export const RARITIES = ['N', 'R', 'Epic', 'EX'];

function person(sport, kind, id, name, role, team, lean, ipReview) {
  return {
    cardId: `SPC_${sport}_${kind}_${id}`,
    name,
    role,
    team,
    lean,
    ipReview,
    pose: poseFor(kind, role),
    placeholder: true,
  };
}

function poseFor(kind, role) {
  if (kind === 'COA') return 'coach';
  if (kind === 'ENT') return 'helmet';
  if (kind === 'VEH') return role === 'motorcycle' ? 'bike' : 'car';
  const value = role.toUpperCase();
  if (value === 'GK') return 'gk';
  if (value.includes('CB')) return 'block';
  if (value.includes('RB') || value.includes('LB') || value.includes('WB')) return 'run';
  if (value === 'DM') return 'shield';
  if (value === 'CM') return 'stride';
  if (value === 'AM') return 'play';
  if (value.includes('/')) return 'drift';
  if (value === 'LW' || value === 'RW') return 'cut';
  if (value === 'ST') return 'leap';
  if (value === 'PG') return 'dribble';
  if (value === 'SG') return 'shoot';
  if (value === 'SF') return 'wingrun';
  if (value === 'PF/C' || value === 'C') return 'tall';
  if (value === 'PF') return 'boxout';
  return 'stride';
}

const L = (name) => name;

export const PEOPLE = [
  person('FOOTBALL', 'ATH', '001', 'Theo Court-Tea', 'GK', 'Banquet Select XI', L('lilac and pewter'), true),
  person('FOOTBALL', 'ATH', '002', 'Ash-Raf Haki-Mi', 'RB/RWB', 'Banquet Select XI', L('mustard yellow and charcoal'), true),
  person('FOOTBALL', 'ATH', '003', 'Virgil Van Brick', 'CB', 'Banquet Select XI', L('toasted gold and herb green'), true),
  person('FOOTBALL', 'ATH', '004', 'Willy Patchwork', 'CB', 'Banquet Select XI', L('lilac and pewter'), true),
  person('FOOTBALL', 'ATH', '005', 'Noodle Mendez', 'LB/LWB', 'Banquet Select XI', L('lilac and pewter'), true),
  person('FOOTBALL', 'ATH', '006', 'Carousel Six', 'DM', 'Banquet Select XI', L('mustard yellow and charcoal'), false),
  person('FOOTBALL', 'ATH', '007', 'Penne Al-Dente', 'CM', 'Banquet Select XI', L('mint and porcelain'), false),
  person('FOOTBALL', 'ATH', '008', 'Jude Belly-Ham', 'AM', 'Banquet Select XI', L('cream and parsley green'), true),
  person('FOOTBALL', 'ATH', '009', 'Vinnie Juicebox Jr.', 'LW', 'Banquet Select XI', L('mango and lime'), true),
  person('FOOTBALL', 'ATH', '010', 'Earl Haa-Landlord', 'ST', 'Banquet Select XI', L('beet purple and cream'), true),
  person('FOOTBALL', 'ATH', '011', 'Lemon Yammal', 'RW', 'Banquet Select XI', L('mango and lime'), true),
  person('FOOTBALL', 'ATH', '012', 'Killian Map-Pay', 'ST/LW', 'Banquet Select XI', L('sea-glass and sand'), true),
  person('FOOTBALL', 'ATH', '013', 'Lion Messo', 'ST/RW', 'Banquet Select XI', L('sea-glass and sand'), true),
  person('FOOTBALL', 'ATH', '014', 'Pickle Palms', 'GK', 'Gherkin Rovers', L('buttermilk yellow and cocoa'), false),
  person('FOOTBALL', 'ATH', '015', 'Crust Crumb', 'RB', 'Gherkin Rovers', L('teapot blue and steam white'), false),
  person('FOOTBALL', 'ATH', '016', 'Brine Wall', 'CB', 'Gherkin Rovers', L('mint and porcelain'), false),
  person('FOOTBALL', 'ATH', '017', 'Jar Lid', 'CB', 'Gherkin Rovers', L('berry purple and seed gold'), false),
  person('FOOTBALL', 'ATH', '018', 'Vinegar Lane', 'LB', 'Gherkin Rovers', L('mango and lime'), false),
  person('FOOTBALL', 'ATH', '019', 'Seed Pocket', 'DM', 'Gherkin Rovers', L('lemon pith and leaf green'), false),
  person('FOOTBALL', 'ATH', '020', 'Relish Pass', 'CM', 'Gherkin Rovers', L('dusk peach and ink'), false),
  person('FOOTBALL', 'ATH', '021', 'Mustard Through', 'AM', 'Gherkin Rovers', L('brine green and cork brown'), false),
  person('FOOTBALL', 'ATH', '022', 'Dill Whip', 'LW', 'Gherkin Rovers', L('toasted gold and herb green'), false),
  person('FOOTBALL', 'ATH', '023', 'Gherkin Strike', 'ST', 'Gherkin Rovers', L('teapot blue and steam white'), false),
  person('FOOTBALL', 'ATH', '024', 'Crunch Cross', 'RW', 'Gherkin Rovers', L('toasted gold and herb green'), false),
  person('FOOTBALL', 'ATH', '025', 'Spare Cask', 'GK', 'Gherkin Rovers', L('toasted gold and herb green'), false),
  person('FOOTBALL', 'ATH', '026', 'Oak Barrel', 'CB', 'Gherkin Rovers', L('cream and parsley green'), false),
  person('FOOTBALL', 'ATH', '027', 'Sweet Relish', 'ST', 'Gherkin Rovers', L('pond green and koi orange'), false),
  person('FOOTBALL', 'ATH', '028', 'Side Salad', 'LW', 'Gherkin Rovers', L('teapot blue and steam white'), false),
  person('FOOTBALL', 'COA', '001', 'Pepper Gourd-ola', 'coach', 'Metro Blueprints Athletic', L('berry purple and seed gold'), true),
  person('FOOTBALL', 'COA', '002', 'Hansy Flicker', 'coach', 'Catalonia Coffee Club', L('cream and parsley green'), true),
  person('FOOTBALL', 'COA', '003', 'Tony Count-Té', 'coach', 'Dockside Noodles', L('toasted gold and herb green'), true),
  person('FOOTBALL', 'COA', '004', 'Carlo Anchovy-Lotti', 'coach', 'Royal Meringue FC', L('mustard yellow and charcoal'), true),
  person('FOOTBALL', 'COA', '005', 'Brine Whistle', 'coach', 'Gherkin Rovers', L('mint and porcelain'), false),
  person('FOOTBALL', 'COA', '006', 'Menu Card', 'coach', 'Banquet Select XI', L('pond green and koi orange'), false),
  person('BASKET', 'ATH', '001', 'Stew Currywurst', 'PG', 'Hardwood Exhibition', L('toasted gold and herb green'), true),
  person('BASKET', 'ATH', '002', 'Nikola Yogurt', 'C', 'Hardwood Exhibition', L('wheat gold and tomato blush'), true),
  person('BASKET', 'ATH', '003', 'Victor Wobble-yama', 'C', 'Hardwood Exhibition', L('lemon pith and leaf green'), true),
  person('BASKET', 'ATH', '004', 'Shy Gorgeous Salamander', 'SG', 'Hardwood Exhibition', L('lemon pith and leaf green'), true),
  person('BASKET', 'ATH', '005', 'Yannis Alphabet-Soup', 'PF', 'Hardwood Exhibition', L('lemon pith and leaf green'), true),
  person('BASKET', 'ATH', '006', 'LeBrawn Jams', 'SF', 'Hardwood Exhibition', L('berry purple and seed gold'), true),
  person('BASKET', 'ATH', '007', 'Kaitlyn Cluck', 'PG', 'Hardwood Exhibition', L('dusk peach and ink'), true),
  person('BASKET', 'ATH', '008', 'Ay-Jay Wobble-Son', 'PF/C', 'Hardwood Exhibition', L('cream and parsley green'), true),
  person('BASKET', 'ATH', '009', 'Brianna Stew-Pot', 'PF', 'Hardwood Exhibition', L('dusk peach and ink'), true),
  person('BASKET', 'ATH', '010', 'Angel Rice-Bowl', 'PF', 'Hardwood Exhibition', L('beet purple and cream'), true),
  person('BASKET', 'ATH', '011', 'Biscuit Handle', 'PG', 'Hardwood Exhibition', L('pond green and koi orange'), false),
  person('BASKET', 'ATH', '012', 'Gravy Wing', 'SF', 'Hardwood Exhibition', L('dusk peach and ink'), false),
  person('BASKET', 'ATH', '013', 'Ladle Post', 'C', 'Hardwood Exhibition', L('wheat gold and tomato blush'), false),
  person('BASKET', 'ATH', '014', 'Whisk Point', 'PG', 'Gravy Garden', L('mint and porcelain'), false),
  person('BASKET', 'ATH', '015', 'Pan Flash', 'SG', 'Gravy Garden', L('toasted gold and herb green'), false),
  person('BASKET', 'ATH', '016', 'Roux Wing', 'SF', 'Gravy Garden', L('cream and parsley green'), false),
  person('BASKET', 'ATH', '017', 'Stock Block', 'PF', 'Gravy Garden', L('pond green and koi orange'), false),
  person('BASKET', 'ATH', '018', 'Dumpling Post', 'C', 'Gravy Garden', L('berry purple and seed gold'), false),
  person('BASKET', 'ATH', '019', 'Crumb Shot', 'SG', 'Gravy Garden', L('lemon pith and leaf green'), false),
  person('BASKET', 'ATH', '020', 'Broth Board', 'PF', 'Gravy Garden', L('lemon pith and leaf green'), false),
  person('BASKET', 'ATH', '021', 'Oven Seal', 'C', 'Gravy Garden', L('toasted gold and herb green'), false),
  person('BASKET', 'COA', '001', 'Chef Stevie Stir', 'coach', 'Golden Snack Wafflers', L('wheat gold and tomato blush'), false),
  person('BASKET', 'COA', '002', 'Gregg Popcorn-Vich', 'coach', 'Sideline Workshop', L('lilac and pewter'), true),
  person('BASKET', 'COA', '003', 'Becky Ham-Bun', 'coach', 'Sideline Workshop', L('berry purple and seed gold'), true),
  person('BASKET', 'COA', '004', 'Clipboard Crumb', 'coach', 'Hardwood Exhibition', L('sea-glass and sand'), false),
  person('BASKET', 'COA', '005', 'Timer Ladle', 'coach', 'Gravy Garden', L('cream and parsley green'), false),
  person('CAR', 'ENT', '001', 'Lando Nori-Rice', 'driver', 'Papaya Peel Racing', L('berry purple and seed gold'), true),
  person('CAR', 'ENT', '002', 'Oscar Pie-Astro', 'driver', 'Papaya Peel Racing', L('mango and lime'), true),
  person('CAR', 'ENT', '003', 'Charlie LaCrêpe', 'driver', 'Scarlet Spaghetti Works', L('sea-glass and sand'), true),
  person('CAR', 'ENT', '004', 'Lewie Ham-a-Ton', 'driver', 'Scarlet Spaghetti Works', L('wheat gold and tomato blush'), true),
  person('CAR', 'ENT', '005', 'Georgie Rustle', 'driver', 'Silver Spoon GP', L('brine green and cork brown'), true),
  person('CAR', 'ENT', '006', 'Kimi Anti-Noodle', 'driver', 'Silver Spoon GP', L('lilac and pewter'), true),
  person('CAR', 'ENT', '007', 'Max Verstomper', 'driver', 'Thunder Moo Motorsport', L('toasted gold and herb green'), true),
  person('CAR', 'ENT', '008', 'Isaac Hat-Jar', 'driver', 'Thunder Moo Motorsport', L('wheat gold and tomato blush'), true),
  person('CAR', 'ENT', '009', 'Nico Hula-Burger', 'driver', 'Noodle Torque Racing', L('lemon pith and leaf green'), true),
  person('CAR', 'ENT', '010', 'Gabe Burrito-Letto', 'driver', 'Noodle Torque Racing', L('beet purple and cream'), true),
  person('CAR', 'ENT', '011', 'Carlos Saucez', 'driver', 'Royal Blueberries GP', L('pond green and koi orange'), true),
  person('CAR', 'ENT', '012', 'Alex All-Bun', 'driver', 'Royal Blueberries GP', L('buttermilk yellow and cocoa'), true),
  person('CAR', 'ENT', '013', 'Crumbly McGear', 'driver', 'Biscuit Axle Club', L('toasted gold and herb green'), false),
  person('CAR', 'ENT', '014', 'Toffee Treadwell', 'driver', 'Biscuit Axle Club', L('toasted gold and herb green'), false),
  person('CAR', 'ENT', '015', 'Dill Driftwood', 'driver', 'Pickle Piston Works', L('lemon pith and leaf green'), false),
  person('CAR', 'ENT', '016', 'Gherkin Gearbox', 'driver', 'Pickle Piston Works', L('mint and porcelain'), false),
  person('CAR', 'ENT', '017', 'Maple Apex', 'driver', 'Waffle Wing Union', L('toasted gold and herb green'), false),
  person('CAR', 'ENT', '018', 'Butter Chicane', 'driver', 'Waffle Wing Union', L('brine green and cork brown'), false),
  person('CAR', 'ENT', '019', 'Sandy Hairpin', 'driver', 'Coconut Coast GP', L('teapot blue and steam white'), false),
  person('CAR', 'ENT', '020', 'Reef Downforce', 'driver', 'Coconut Coast GP', L('sea-glass and sand'), false),
  person('CAR', 'ENT', '021', 'Steamer Straight', 'driver', 'Dumpling Draft Team', L('lemon pith and leaf green'), false),
  person('CAR', 'ENT', '022', 'Soy Sauceover', 'driver', 'Dumpling Draft Team', L('wheat gold and tomato blush'), false),
  person('CAR', 'VEH', '001', 'Zesteroid V1', 'car', 'Papaya Peel Racing', L('mint and porcelain'), false),
  person('CAR', 'VEH', '002', 'Pasta Rocket', 'car', 'Scarlet Spaghetti Works', L('brine green and cork brown'), false),
  person('CAR', 'VEH', '003', 'Teaspoon Turbo', 'car', 'Silver Spoon GP', L('buttermilk yellow and cocoa'), false),
  person('CAR', 'VEH', '004', 'Moo-Boost', 'car', 'Thunder Moo Motorsport', L('pond green and koi orange'), false),
  person('CAR', 'VEH', '005', 'Pretzel Drive', 'car', 'Noodle Torque Racing', L('mint and porcelain'), false),
  person('CAR', 'VEH', '006', 'Berry Burner', 'car', 'Royal Blueberries GP', L('mustard yellow and charcoal'), false),
  person('CAR', 'VEH', '007', 'Crumb Coupe', 'car', 'Biscuit Axle Club', L('buttermilk yellow and cocoa'), false),
  person('CAR', 'VEH', '008', 'Brine Bullet', 'car', 'Pickle Piston Works', L('wheat gold and tomato blush'), false),
  person('CAR', 'VEH', '009', 'Syrup Dart', 'car', 'Waffle Wing Union', L('dusk peach and ink'), false),
  person('CAR', 'VEH', '010', 'Husk Hammer', 'car', 'Coconut Coast GP', L('buttermilk yellow and cocoa'), false),
  person('CAR', 'VEH', '011', 'Bao Booster', 'car', 'Dumpling Draft Team', L('mint and porcelain'), false),
  person('MOTO', 'ENT', '001', 'Mako Mayhem', 'rider', 'Red Quack Works', L('sea-glass and sand'), false),
  person('MOTO', 'ENT', '002', 'Paco Bagnetti', 'rider', 'Red Quack Works', L('brine green and cork brown'), false),
  person('MOTO', 'ENT', '003', 'Fabio Fourturn', 'rider', 'Blue Melody Works', L('berry purple and seed gold'), true),
  person('MOTO', 'ENT', '004', 'Pedro Acoaster', 'rider', 'Orange Anvil Motors', L('mango and lime'), true),
  person('MOTO', 'ENT', '005', 'Jorge Martian', 'rider', 'Purple Petal Moto', L('cream and parsley green'), true),
  person('MOTO', 'ENT', '006', 'Brady Blender', 'rider', 'Orange Anvil Motors', L('dusk peach and ink'), false),
  person('MOTO', 'ENT', '007', 'Marco Buzzachi', 'rider', 'Purple Petal Moto', L('mustard yellow and charcoal'), true),
  person('MOTO', 'ENT', '008', 'Horizon Mirage', 'rider', 'Sakura Forge', L('dusk peach and ink'), true),
  person('MOTO', 'ENT', '009', 'Torak Razzle', 'rider', 'Blue Melody Works', L('sea-glass and sand'), false),
  person('MOTO', 'ENT', '010', 'Ayo Oguramen', 'rider', 'Late Bloom Garage', L('lemon pith and leaf green'), true),
  person('MOTO', 'ENT', '011', 'Nectar Shift', 'rider', 'Late Bloom Garage', L('beet purple and cream'), false),
  person('MOTO', 'ENT', '012', 'Koi Cascade', 'rider', 'Sakura Forge', L('lemon pith and leaf green'), false),
  person('MOTO', 'ENT', '013', 'Ramen Knee', 'rider', 'Noodle Knee Sliders', L('berry purple and seed gold'), false),
  person('MOTO', 'ENT', '014', 'Udon Apex', 'rider', 'Noodle Knee Sliders', L('lilac and pewter'), false),
  person('MOTO', 'ENT', '015', 'Palm Visor', 'rider', 'Coconut Visor Club', L('toasted gold and herb green'), false),
  person('MOTO', 'ENT', '016', 'Reef Tuck', 'rider', 'Coconut Visor Club', L('sea-glass and sand'), false),
  person('MOTO', 'ENT', '017', 'Bao Lean', 'rider', 'Dumpling Lean Works', L('mustard yellow and charcoal'), false),
  person('MOTO', 'ENT', '018', 'Gyoza Hairpin', 'rider', 'Dumpling Lean Works', L('buttermilk yellow and cocoa'), false),
  person('MOTO', 'ENT', '019', 'Dill Tuck', 'rider', 'Pickle Fairing Co', L('mango and lime'), false),
  person('MOTO', 'ENT', '020', 'Spear Gasket', 'rider', 'Pickle Fairing Co', L('teapot blue and steam white'), false),
  person('MOTO', 'ENT', '021', 'Maple Knee', 'rider', 'Waffle Trail Gang', L('mustard yellow and charcoal'), false),
  person('MOTO', 'ENT', '022', 'Butter Apex', 'rider', 'Waffle Trail Gang', L('lilac and pewter'), false),
  person('MOTO', 'VEH', '001', 'RubberDuck V-Quack', 'motorcycle', 'Red Quack Works', L('brine green and cork brown'), false),
  person('MOTO', 'VEH', '002', 'Petal-26', 'motorcycle', 'Purple Petal Moto', L('beet purple and cream'), false),
  person('MOTO', 'VEH', '003', 'Hammer Sixteen', 'motorcycle', 'Orange Anvil Motors', L('teapot blue and steam white'), false),
  person('MOTO', 'VEH', '004', 'Echo V4', 'motorcycle', 'Blue Melody Works', L('sea-glass and sand'), false),
  person('MOTO', 'VEH', '005', 'Phoenix 213', 'motorcycle', 'Sakura Forge', L('brine green and cork brown'), false),
  person('MOTO', 'VEH', '006', 'Night Petal', 'motorcycle', 'Late Bloom Garage', L('mint and porcelain'), false),
  person('MOTO', 'VEH', '007', 'Broth Blade', 'motorcycle', 'Noodle Knee Sliders', L('lemon pith and leaf green'), false),
  person('MOTO', 'VEH', '008', 'Shell Shock', 'motorcycle', 'Coconut Visor Club', L('mint and porcelain'), false),
  person('MOTO', 'VEH', '009', 'Steam Slider', 'motorcycle', 'Dumpling Lean Works', L('toasted gold and herb green'), false),
  person('MOTO', 'VEH', '010', 'Brine Rocket', 'motorcycle', 'Pickle Fairing Co', L('wheat gold and tomato blush'), false),
  person('MOTO', 'VEH', '011', 'Syrup Snake', 'motorcycle', 'Waffle Trail Gang', L('buttermilk yellow and cocoa'), false),
];

function team(sport, id, name, motif, palette, note) {
  return { cardId: `SPC_${sport}_TEA_${id}`, name, motif, palette, note, sport: sport.toLowerCase() };
}

const C = (primary, secondary, accent) => ({ primary, secondary, accent });

export const TEAMS = [
  team('FOOTBALL', '001', 'Royal Meringue FC', 'meringue', C('#F7F1E6', '#C23B55', '#E7C98A'), 'White and raspberry dollop crown. Not a copied badge.'),
  team('FOOTBALL', '002', 'Catalonia Coffee Club', 'cup', C('#4A2E24', '#F4E6D8', '#C47B3A'), 'Espresso and foam only. No flag stripes.'),
  team('FOOTBALL', '003', 'Metro Blueprints Athletic', 'hardhat', C('#E7D7B8', '#2EAEB8', '#E1B43A'), 'Graph paper and cyan ink. Not a sky-blue kit.'),
  team('FOOTBALL', '004', 'Dockside Noodles', 'cleat', C('#E6C36A', '#2F7C86', '#F3E2C0'), 'Wheat noodles and harbor teal.'),
  team('FOOTBALL', '005', 'Banquet Select XI', 'cloche', C('#D4B15A', '#FBF3E2', '#8A9AA4'), 'Cloche platter. Original exhibition side.'),
  team('FOOTBALL', '006', 'Gherkin Rovers', 'gherkin', C('#6B8F3A', '#8FCBB8', '#E6D2B5'), 'Gherkin and pea. Original opponent club.'),
  team('BASKET', '001', 'Golden Snack Wafflers', 'waffle', C('#E2A23A', '#F7F1E8', '#C47B3A'), 'Waffle iron. No bridge, no skyline.'),
  team('BASKET', '002', 'Denver Dino Nuggets', 'nugget', C('#D9A441', '#3E6B45', '#F3E6C4'), 'Crunchy nugget. No mountain logo.'),
  team('BASKET', '003', 'LA Latte-Makers', 'latte', C('#F7F1E8', '#4A2E24', '#C4A484'), 'Latte foam star. Milk and espresso only.'),
  team('BASKET', '004', 'Indiana Flavor', 'chili', C('#D4532B', '#F0A03A', '#B7D36A'), 'Chili and mango-lime rays. No copied mark.'),
  team('BASKET', '005', 'Hardwood Exhibition', 'plank', C('#C4894A', '#F4F1EA', '#E2B34A'), 'Court plank and chalk whistle.'),
  team('BASKET', '006', 'Gravy Garden', 'gravy', C('#8A5A3A', '#6A8F4E', '#F7FBFD'), 'Gravy boat in a herb bed.'),
  team('BASKET', '007', 'Sideline Workshop', 'whistle', C('#C4A484', '#E2B34A', '#F4F1EA'), 'Workbench, pencil, whistle.'),
  team('CAR', '001', 'Papaya Peel Racing', 'peel', C('#F6F1E4', '#6A8F4E', '#F3E07A'), 'Pith and leaf. Not a famous orange livery.'),
  team('CAR', '002', 'Scarlet Spaghetti Works', 'fork', C('#D4726A', '#F6E7D4', '#3E6B45'), 'Marinara blush and cream. Not a pure racing red.'),
  team('CAR', '003', 'Silver Spoon GP', 'spoon', C('#C5CCD3', '#C7B4D6', '#F7F4EF'), 'Pewter and lavender. Not a silver-arrow suit.'),
  team('CAR', '004', 'Thunder Moo Motorsport', 'moo', C('#F0D78A', '#6B4226', '#E7EEF4'), 'Buttermilk and cocoa. Not an energy-drink look.'),
  team('CAR', '005', 'Noodle Torque Racing', 'twist', C('#E2B34A', '#C9893A', '#F7F4EF'), 'Baked gold and mustard noodle.'),
  team('CAR', '006', 'Royal Blueberries GP', 'berry', C('#5C2E6B', '#E2B34A', '#F6E7D4'), 'Deep berry. Not a royal-blue livery.'),
  team('CAR', '007', 'Biscuit Axle Club', 'biscuit', C('#E2C27A', '#F0D78A', '#6B4226'), 'Biscuit with an axle.'),
  team('CAR', '008', 'Pickle Piston Works', 'piston', C('#6B8F3A', '#C5CCD3', '#F6E7D4'), 'Pickle used as a piston.'),
  team('CAR', '009', 'Waffle Wing Union', 'wing', C('#C9893A', '#E2A23A', '#FBF3E2'), 'Waffle with wings.'),
  team('CAR', '010', 'Coconut Coast GP', 'coconut', C('#6B4226', '#E6D2B5', '#F7FBFD'), 'Coconut on a wave.'),
  team('CAR', '011', 'Dumpling Draft Team', 'dumpling', C('#F3E6C4', '#E7C9A0', '#D4726A'), 'Pleated dumpling.'),
  team('MOTO', '001', 'Red Quack Works', 'duck', C('#F2C84B', '#E07A2F', '#2F6D73'), 'Rubber duck in a tuck. No shield logo.'),
  team('MOTO', '002', 'Purple Petal Moto', 'petal', C('#C7B4D6', '#F7F4EF', '#6A8F4E'), 'Lilac petal. No manufacturer mark.'),
  team('MOTO', '003', 'Orange Anvil Motors', 'anvil', C('#3E4650', '#E07A3A', '#F2D2A2'), 'Iron and spark. Not a copied orange brand.'),
  team('MOTO', '004', 'Blue Melody Works', 'note', C('#3A6EA5', '#F4F0E6', '#C6A15B'), 'Musical note. Not a tuning-fork mark.'),
  team('MOTO', '005', 'Sakura Forge', 'blossom', C('#E7A3B8', '#E07A4A', '#2C3338'), 'Blossom bird. Not a wing badge.'),
  team('MOTO', '006', 'Late Bloom Garage', 'bloom', C('#3A2A4A', '#E2B34A', '#C7B4D6'), 'Night-opening flower.'),
  team('MOTO', '007', 'Noodle Knee Sliders', 'slider', C('#E6C36A', '#2F7C86', '#F3E2C0'), 'Noodle bent into a knee slider.'),
  team('MOTO', '008', 'Coconut Visor Club', 'visor', C('#E6D2B5', '#F7F4EF', '#6A8F4E'), 'Coconut wearing a visor.'),
  team('MOTO', '009', 'Dumpling Lean Works', 'lean', C('#F3E6C4', '#C9893A', '#FBF6EA'), 'Dumpling leaning into a turn.'),
  team('MOTO', '010', 'Pickle Fairing Co', 'fairing', C('#6B8F3A', '#2C3338', '#F6E7D4'), 'Pickle used as a fairing.'),
  team('MOTO', '011', 'Waffle Trail Gang', 'trail', C('#C9893A', '#F0D78A', '#241C28'), 'Waffle with a winding trail.'),
];

function venue(sport, id, name, teamName, roof, sky, bowl, seat, trim, night = false) {
  return {
    cardId: `SPC_${sport}_VEN_${id}`,
    name,
    teamName,
    roof,
    sky,
    bowl,
    seat,
    trim,
    night,
    sport: sport.toLowerCase(),
  };
}

export const VENUES = [
  venue('FOOTBALL', '001', 'Sangria Bernaboo Dome', 'Royal Meringue FC', 'punch', ['#F6C7A0', '#F8E2C4', '#87B7C6'], '#F4E2B0', '#E07A2F', '#C23B55'),
  venue('FOOTBALL', '002', 'Camp Noodle Colosseum', 'Catalonia Coffee Club', 'pasta', ['#F7D7A4', '#F3E6C8', '#E7B08A'], '#F0D78A', '#D4726A', '#6A8F4E'),
  venue('FOOTBALL', '003', 'Eddy-Tea-Had Stadium', 'Metro Blueprints Athletic', 'teacup', ['#F0B59A', '#E7C9B8', '#6A7E92'], '#F7F4EF', '#2EAEB8', '#241C28'),
  venue('FOOTBALL', '004', "Auntie's Field", 'Dockside Noodles', 'parlour', ['#D7C4E0', '#E7D7C8', '#A9B0B8'], '#C7B4D6', '#E7A3B8', '#8E9099'),
  venue('FOOTBALL', '005', 'Pickle Park', 'Gherkin Rovers', 'jars', ['#E7D4F0', '#F6E7C4', '#8E9A6A'], '#6E3B73', '#E2B34A', '#6B8F3A'),
  venue('BASKET', '001', 'Cheese Center', 'Hardwood Exhibition', 'cheese', ['#241C28', '#F0B59A', '#F8E3D6'], '#F0D78A', '#E2A23A', '#C47B3A', true),
  venue('BASKET', '002', 'Bowl Arena', null, 'cereal', ['#F6E7D4', '#E7C9C0', '#C46B8A'], '#F7F1E8', '#7A3E62', '#F6E7D4'),
  venue('BASKET', '003', 'Crouton Arena', null, 'crouton', ['#E5F0DC', '#E7D3B0', '#8A5A3A'], '#C9893A', '#6B8F3A', '#F3E6C4'),
  venue('BASKET', '004', 'Flavor Court', 'Indiana Flavor', 'awning', ['#FFFBE8', '#F3E7A8', '#B7D36A'], '#F0A03A', '#D4532B', '#6A8F4E'),
  venue('BASKET', '005', 'Gravy Greenhouse', 'Gravy Garden', 'glass', ['#F8E3D6', '#E7C4A8', '#241C28'], '#8A5A3A', '#6A8F4E', '#F0B59A'),
];

function pts(pairs) {
  return pairs.map(([x, y]) => ({ x, y }));
}

export const TRACKS = [
  {
    cardId: 'SPC_CAR_TRK_001',
    sport: 'car',
    name: 'Mozza Speedway',
    cue: 'Long melted-cheese straights. Not a traced speed circuit.',
    sky: ['#FBF6EA', '#F3E6C4', '#7FA88A'],
    ground: '#E7F0DC',
    infield: '#F7F1E4',
    runoff: '#E7C98A',
    asphalt: '#3A332C',
    edge: '#FBF6EA',
    night: false,
    landmark: 'cheese',
    points: pts([[10, 42], [28, 24], [72, 24], [90, 42], [90, 62], [74, 78], [58, 68], [42, 80], [26, 76], [10, 60]]),
    elev: [0.18, 0.16, 0.16, 0.18, 0.2, 0.22, 0.24, 0.22, 0.2, 0.18],
  },
  {
    cardId: 'SPC_CAR_TRK_002',
    sport: 'car',
    name: 'Monocle Harbor Loop',
    cue: 'Tight streets inside a monocle harbor. Not a traced street circuit.',
    sky: ['#F0D78A', '#E6D2B5', '#7EB8B0'],
    ground: '#E7D7C4',
    infield: '#8FCBB8',
    runoff: '#C4A484',
    asphalt: '#2C3338',
    edge: '#F7F4EF',
    night: false,
    landmark: 'monocle',
    points: pts([[22, 28], [40, 16], [62, 18], [78, 30], [86, 48], [78, 66], [62, 80], [42, 82], [24, 70], [14, 52], [16, 36]]),
    elev: [0.2, 0.2, 0.22, 0.24, 0.22, 0.2, 0.18, 0.18, 0.2, 0.2, 0.2],
  },
  {
    cardId: 'SPC_CAR_TRK_003',
    sport: 'car',
    name: 'Sushi-Zag Circuit',
    cue: 'Sushi zigzag with wasabi corners. Not a traced figure-eight park.',
    sky: ['#F0B59A', '#F8E3D6', '#241C28'],
    ground: '#F4E7D8',
    infield: '#F7F1E8',
    runoff: '#7A3E62',
    asphalt: '#2A2428',
    edge: '#F6E7D4',
    night: false,
    landmark: 'wasabi',
    points: pts([[14, 58], [28, 28], [44, 48], [58, 22], [74, 40], [88, 26], [84, 58], [70, 74], [48, 68], [30, 82], [14, 74]]),
    elev: [0.3, 0.42, 0.34, 0.5, 0.38, 0.46, 0.32, 0.28, 0.3, 0.24, 0.28],
  },
  {
    cardId: 'SPC_CAR_TRK_004',
    sport: 'car',
    name: 'Silver Spoonstone',
    cue: 'A spoon bent into sustained fast corners. Pewter and lavender.',
    sky: ['#E7EEF4', '#C7B4D6', '#8E9099'],
    ground: '#D5D8DE',
    infield: '#E4E7F2',
    runoff: '#C9893A',
    asphalt: '#3E4650',
    edge: '#F7F4EF',
    night: false,
    landmark: 'spoon',
    points: pts([[18, 30], [36, 16], [58, 20], [78, 34], [90, 50], [78, 66], [58, 80], [36, 82], [18, 68], [10, 50], [14, 38]]),
    elev: [0.28, 0.34, 0.4, 0.46, 0.42, 0.36, 0.3, 0.26, 0.24, 0.26, 0.28],
  },
  {
    cardId: 'SPC_CAR_TRK_005',
    sport: 'car',
    name: 'Spa-ghetti Summit',
    cue: 'Noodle mountain elevation and tomato mist. Not a copied forest climb.',
    sky: ['#F0D78A', '#E7C4A8', '#8A5A3A'],
    ground: '#C4A484',
    infield: '#E7D3B0',
    runoff: '#D4726A',
    asphalt: '#3A332C',
    edge: '#FBF3E2',
    night: false,
    landmark: 'noodles',
    points: pts([[18, 82], [36, 74], [28, 58], [46, 50], [36, 34], [54, 24], [74, 28], [86, 46], [74, 64], [84, 80], [58, 88], [34, 86]]),
    elev: [0.2, 0.32, 0.46, 0.55, 0.7, 0.86, 0.74, 0.58, 0.44, 0.3, 0.22, 0.18],
  },
  {
    cardId: 'SPC_CAR_TRK_006',
    sport: 'car',
    name: 'Singa-Pour Night Loop',
    cue: 'Night-market lanterns and a pouring teapot. No real skyline.',
    sky: ['#1C2430', '#3A4A62', '#E6D2B5'],
    ground: '#243038',
    infield: '#1E3336',
    runoff: '#7EB8B0',
    asphalt: '#12161C',
    edge: '#F7F3EA',
    night: true,
    landmark: 'teapot',
    points: pts([[16, 22], [38, 16], [40, 34], [66, 30], [70, 16], [88, 24], [90, 46], [72, 50], [76, 70], [88, 80], [64, 86], [46, 74], [44, 58], [26, 62], [20, 82], [10, 70], [12, 46]]),
    elev: [0.2, 0.2, 0.22, 0.22, 0.24, 0.22, 0.2, 0.2, 0.18, 0.16, 0.16, 0.18, 0.2, 0.2, 0.18, 0.2, 0.2],
  },
  {
    cardId: 'SPC_MOTO_TRK_001',
    sport: 'moto',
    name: 'Mushgello Valley',
    cue: 'Mushroom valley and one long straight. Not a traced valley circuit.',
    sky: ['#F0D7A4', '#E7F0DC', '#3E6B45'],
    ground: '#C9D8B4',
    infield: '#E7F2DF',
    runoff: '#C9893A',
    asphalt: '#2C3330',
    edge: '#FBF6EA',
    night: false,
    landmark: 'mushroom',
    points: pts([[8, 70], [28, 74], [50, 72], [72, 74], [92, 66], [90, 48], [76, 30], [56, 20], [36, 28], [18, 44], [10, 58]]),
    elev: [0.22, 0.24, 0.26, 0.28, 0.34, 0.46, 0.4, 0.32, 0.26, 0.22, 0.2],
  },
  {
    cardId: 'SPC_MOTO_TRK_002',
    sport: 'moto',
    name: 'Sausage Ring',
    cue: 'A ring of grilled sausages and tight bends. Not a traced map.',
    sky: ['#E6D2B5', '#F7F3EA', '#7EB8B0'],
    ground: '#E7D7C4',
    infield: '#F3E0C0',
    runoff: '#E1B43A',
    asphalt: '#3A332C',
    edge: '#FBF6EA',
    night: false,
    landmark: 'sausage',
    points: pts([[50, 12], [72, 18], [88, 36], [78, 48], [90, 64], [74, 82], [50, 90], [26, 82], [12, 64], [24, 50], [12, 34], [28, 18]]),
    elev: [0.3, 0.28, 0.26, 0.32, 0.28, 0.24, 0.22, 0.24, 0.28, 0.34, 0.3, 0.3],
  },
  {
    cardId: 'SPC_MOTO_TRK_003',
    sport: 'moto',
    name: 'Pillow Island',
    cue: 'Pillow runoff and a flowing quilt. Not a traced coastal circuit.',
    sky: ['#F4E2A8', '#E7E2D6', '#8E9099'],
    ground: '#E6D2B5',
    infield: '#F7F1E8',
    runoff: '#7EB8B0',
    asphalt: '#3E4650',
    edge: '#FBF6EA',
    night: false,
    landmark: 'pillow',
    points: pts([[22, 36], [42, 16], [68, 20], [86, 40], [82, 62], [62, 82], [36, 80], [16, 60], [14, 44]]),
    elev: [0.26, 0.3, 0.34, 0.32, 0.28, 0.24, 0.22, 0.24, 0.26],
  },
  {
    cardId: 'SPC_MOTO_TRK_004',
    sport: 'moto',
    name: 'Ramen Temple Raceway',
    cue: 'Noodle temple gate and a bowl grandstand. Heavy-braking bowls, original geometry.',
    sky: ['#F6E7F4', '#E2B34A', '#6E3B73'],
    ground: '#E7C9A0',
    infield: '#FBF3E2',
    runoff: '#C23B55',
    asphalt: '#2C2428',
    edge: '#FBF6EA',
    night: false,
    landmark: 'gate',
    points: pts([[12, 36], [40, 18], [70, 20], [90, 36], [84, 52], [90, 68], [68, 84], [38, 82], [12, 66], [8, 50]]),
    elev: [0.24, 0.22, 0.24, 0.36, 0.28, 0.4, 0.26, 0.22, 0.3, 0.26],
  },
  {
    cardId: 'SPC_MOTO_TRK_005',
    sport: 'moto',
    name: 'Canal Zigzag',
    cue: 'Canal boats parked into an S. Brick and water. Not a traced historic circuit.',
    sky: ['#F6E7D4', '#E7C9C0', '#7A3E62'],
    ground: '#C4A484',
    infield: '#7EB8B0',
    runoff: '#F6E7D4',
    asphalt: '#3A332C',
    edge: '#FBF3E2',
    night: false,
    landmark: 'boat',
    points: pts([[16, 24], [40, 18], [56, 34], [40, 50], [62, 64], [82, 54], [88, 72], [66, 86], [38, 80], [18, 68], [12, 48], [14, 34]]),
    elev: [0.22, 0.24, 0.3, 0.28, 0.34, 0.3, 0.26, 0.22, 0.2, 0.22, 0.24, 0.22],
  },
  {
    cardId: 'SPC_MOTO_TRK_006',
    sport: 'moto',
    name: 'Corners of Chaos',
    cue: 'Stacked comic corners plus one long straight. Confetti and chalk. No real tower.',
    sky: ['#E7F2EF', '#F0D78A', '#E07A3A'],
    ground: '#D7E4D4',
    infield: '#FBF6EA',
    runoff: '#E07A3A',
    asphalt: '#243038',
    edge: '#F7F3EA',
    night: false,
    landmark: 'confetti',
    points: pts([[8, 74], [36, 80], [64, 78], [90, 70], [86, 52], [70, 44], [78, 28], [60, 18], [42, 30], [34, 46], [20, 36], [10, 52]]),
    elev: [0.18, 0.2, 0.28, 0.46, 0.62, 0.7, 0.78, 0.66, 0.5, 0.4, 0.3, 0.22],
  },
];

/** Vertical tactic board, goalkeeper toward the bottom. Coordinates are 0–1. */
export const FORMATIONS = [
  {
    id: '4-3-3',
    contentId: 'SPC_FOOTBALL_TAC_001',
    markers: [
      ['GK', 0.5, 0.9],
      ['RB', 0.82, 0.74], ['RCB', 0.62, 0.76], ['LCB', 0.38, 0.76], ['LB', 0.18, 0.74],
      ['RCM', 0.72, 0.52], ['CM', 0.5, 0.5], ['LCM', 0.28, 0.52],
      ['RW', 0.8, 0.24], ['ST', 0.5, 0.2], ['LW', 0.2, 0.24],
    ],
  },
  {
    id: '4-2-3-1',
    contentId: 'SPC_FOOTBALL_TAC_002',
    markers: [
      ['GK', 0.5, 0.9],
      ['RB', 0.82, 0.74], ['RCB', 0.62, 0.76], ['LCB', 0.38, 0.76], ['LB', 0.18, 0.74],
      ['RDM', 0.64, 0.58], ['LDM', 0.36, 0.58],
      ['RW', 0.8, 0.4], ['AM', 0.5, 0.38], ['LW', 0.2, 0.4],
      ['ST', 0.5, 0.18],
    ],
  },
  {
    id: '3-5-2',
    contentId: 'SPC_FOOTBALL_TAC_003',
    markers: [
      ['GK', 0.5, 0.9],
      ['RCB', 0.7, 0.76], ['CB', 0.5, 0.78], ['LCB', 0.3, 0.76],
      ['RWB', 0.88, 0.52], ['RCM', 0.64, 0.5], ['CM', 0.5, 0.46], ['LCM', 0.36, 0.5], ['LWB', 0.12, 0.52],
      ['RST', 0.62, 0.22], ['LST', 0.38, 0.22],
    ],
  },
  {
    id: '4-4-2',
    contentId: 'SPC_FOOTBALL_TAC_004',
    markers: [
      ['GK', 0.5, 0.9],
      ['RB', 0.82, 0.74], ['RCB', 0.62, 0.76], ['LCB', 0.38, 0.76], ['LB', 0.18, 0.74],
      ['RM', 0.84, 0.48], ['RCM', 0.62, 0.5], ['LCM', 0.38, 0.5], ['LM', 0.16, 0.48],
      ['RST', 0.62, 0.22], ['LST', 0.38, 0.22],
    ],
  },
  {
    id: '3-4-3',
    contentId: 'SPC_FOOTBALL_TAC_005',
    markers: [
      ['GK', 0.5, 0.9],
      ['RCB', 0.7, 0.76], ['CB', 0.5, 0.78], ['LCB', 0.3, 0.76],
      ['RWB', 0.88, 0.5], ['RCM', 0.64, 0.5], ['LCM', 0.36, 0.5], ['LWB', 0.12, 0.5],
      ['RW', 0.78, 0.22], ['ST', 0.5, 0.18], ['LW', 0.22, 0.22],
    ],
  },
];

export const SCHEMES = [
  {
    id: 'man',
    name: 'man-to-man',
    contentId: 'SPC_BASKET_TAC_001',
    markers: [[0.5, 0.62], [0.28, 0.48], [0.72, 0.48], [0.38, 0.3], [0.62, 0.3]],
    ghosts: [[0.5, 0.78], [0.22, 0.62], [0.78, 0.62], [0.36, 0.42], [0.64, 0.42]],
  },
  {
    id: 'two-three',
    name: '2-3 zone',
    contentId: 'SPC_BASKET_TAC_002',
    markers: [[0.36, 0.58], [0.64, 0.58], [0.22, 0.32], [0.5, 0.26], [0.78, 0.32]],
    ghosts: [],
  },
  {
    id: 'matchup',
    name: 'matchup zone',
    contentId: 'SPC_BASKET_TAC_003',
    markers: [[0.5, 0.66], [0.24, 0.48], [0.76, 0.48], [0.38, 0.28], [0.62, 0.28]],
    ghosts: [],
    zones: [[0.5, 0.66, 0.18], [0.24, 0.48, 0.14], [0.76, 0.48, 0.14], [0.5, 0.28, 0.22]],
  },
];

export const PITCH = {
  view: { w: 1050, h: 680 },
  side: {
    w: 1600,
    h: 700,
    farLeft: [300, 260],
    farRight: [1300, 260],
    nearRight: [1500, 560],
    nearLeft: [100, 560],
  },
};

export const COURT = {
  view: { w: 840, h: 450 },
  side: {
    w: 1600,
    h: 700,
    farLeft: [340, 250],
    farRight: [1260, 250],
    nearRight: [1480, 560],
    nearLeft: [120, 560],
  },
};

export function sportOfCard(cardId) {
  if (cardId.includes('_FOOTBALL_')) return 'football';
  if (cardId.includes('_BASKET_')) return 'basket';
  if (cardId.includes('_CAR_')) return 'car';
  if (cardId.includes('_MOTO_')) return 'moto';
  return null;
}

export const BUDGETS = {
  frame: 110_000,
  token: 48_000,
  interior: 80_000,
  slot: 22_000,
  team: 28_000,
  venue: 240_000,
  track: 200_000,
  'track-side': 110_000,
  pitch: 160_000,
  court: 160_000,
  prematch: 240_000,
  layout: 70_000,
  formation: 55_000,
  scheme: 55_000,
  icon: 20_000,
  scoreboard: 100_000,
  tower: 90_000,
  result: 240_000,
  podium: 80_000,
  hub: 280_000,
  portal: 70_000,
  gantry: 40_000,
};
