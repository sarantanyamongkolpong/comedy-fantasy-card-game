/**
 * Review heuristics. A hit is a reason for a human to rename or redraw.
 * Nothing in this list is a determination that a trademark is registered.
 */

/** Tokens that do not make a name distinctive on their own. */
export const GENERIC_TOKENS = new Set(`
  slime goblin orc ogre troll skeleton zombie ghost spirit dragon drake wyrm wolf
  bat spider rat imp demon devil angel knight warrior mage wizard witch rogue thief
  hunter guardian beast creature monster boss elite mini world secret tower echo
  corrupted wild cat dog bird fish bear lion tiger snake crab frog toadstool
  man boy girl kid sword shield staff blade bow axe king queen lord lady sir dame
  dark shadow light fire ice water wind earth thunder storm night day great ancient
  elder young little big super ultra mega neo true false red blue green black white
  golden gold funny silly weird cute scary cool hero villain undead elemental golem
  baby metal doctor prince princess duke cyber mech holy chaos order power legendary
  mythic epic rare common fantasy comedy parody card game towerborn
`.split(/\s+/).filter(Boolean));

/** Generic coat-of-paint words. "Dark" + a character token is still that character. */
export const MODIFIERS = new Set(`
  dark shadow super ultra mega neo toon young evil black red blue green white gold
  golden true false lord king queen sir baby metal doctor mr mrs miss ms boy girl
  kid ultimate corrupted echo great ancient little big captain prince princess cyber
  mech holy chaos the alpha beta ex new old bald ashen tattooed caped
`.split(/\s+/).filter(Boolean));

/** Locked v0.5 identity strings. A new monster does not reuse them. */
export const CANON_NAMES = Object.freeze([
  Object.freeze({ id: 'aegis', name: 'Aegis Dominion' }),
  Object.freeze({ id: 'phantom', name: 'Phantom Blades' }),
  Object.freeze({ id: 'celestial', name: 'Celestial Nexus' }),
  Object.freeze({ id: 'sanctuary', name: 'Sanctuary Order' }),
  Object.freeze({ id: 'tower', name: 'Mysterious Tower' }),
  Object.freeze({ id: 'justin-case', name: 'Justin Case' }),
  Object.freeze({ id: 'justin-time', name: 'Justin Time' }),
  Object.freeze({ id: 'potlid', name: 'Sir Potlid' }),
  Object.freeze({ id: 'nox', name: 'Nox Squeak' }),
]);

export const STUDIO_NAMES = Object.freeze([
  'square enix', 'nintendo', 'game freak', 'disney', 'pixar', 'marvel', 'dc comics',
  'studio ghibli', 'ghibli', 'blizzard', 'capcom', 'fromsoftware', 'from software',
  'hoyoverse', 'mihoyo', 'atlus', 'sega', 'bandai', 'toei', 'mappa', 'ufotable',
  'wit studio', 'games workshop', 'cd projekt', 'santa monica', 'warner', 'lucasfilm',
  'pokemon company', 'the pokemon company',
]);

/**
 * Franchise titles, character names, and signature moves.
 * scope `short` = names, titles, and ability names only (the phrase is also ordinary English).
 * ambiguous = do not fire on an idiom; fire on the bare word or that word plus a modifier.
 */
export const FRANCHISE_TERMS = Object.freeze([
  term('pokemon', 'Pokémon', 'house', 'pokemon'),
  term('pokémon', 'Pokémon', 'house', 'pokemon'),
  term('nintendo', 'Nintendo', 'house', 'nintendo'),
  term('game freak', 'Game Freak', 'house', 'pokemon'),
  term('pikachu', 'Pikachu', 'character', 'pokemon'),
  term('charizard', 'Charizard', 'character', 'pokemon'),
  term('disney', 'Disney', 'house', 'disney'),
  term('pixar', 'Pixar', 'house', 'disney'),
  term('marvel', 'Marvel', 'house', 'marvel'),
  term('mickey mouse', 'Mickey Mouse', 'character', 'disney'),
  term('mickey', 'Mickey', 'character', 'disney'),
  term('final fantasy', 'Final Fantasy', 'house', 'ff'),
  term('sephiroth', 'Sephiroth', 'character', 'ff'),
  term('cloud strife', 'Cloud Strife', 'character', 'ff'),
  term('buster sword', 'Buster Sword', 'emblem', 'ff'),
  term('chocobo', 'Chocobo', 'character', 'ff'),
  term('moogle', 'Moogle', 'character', 'ff'),
  term('square enix', 'Square Enix', 'house', 'square'),
  term('dragon quest', 'Dragon Quest', 'house', 'dq'),
  term('the legend of zelda', 'The Legend of Zelda', 'house', 'zelda'),
  term('zelda', 'Zelda', 'character', 'zelda'),
  term('ganondorf', 'Ganondorf', 'character', 'zelda'),
  term('ganon', 'Ganon', 'character', 'zelda'),
  term('hyrule', 'Hyrule', 'setting', 'zelda'),
  term('triforce', 'Triforce', 'emblem', 'zelda'),
  term('master sword', 'Master Sword', 'emblem', 'zelda'),
  term('link', 'Link', 'character', 'zelda', { ambiguous: true, scope: 'short' }),
  term('super mario', 'Super Mario', 'house', 'mario'),
  term('mushroom kingdom', 'Mushroom Kingdom', 'setting', 'mario'),
  term('mario', 'Mario', 'character', 'mario'),
  term('luigi', 'Luigi', 'character', 'mario'),
  term('bowser', 'Bowser', 'character', 'mario'),
  term('peach', 'Peach', 'character', 'mario', { ambiguous: true, scope: 'short' }),
  term('toad', 'Toad', 'character', 'mario', { ambiguous: true, scope: 'short' }),
  term('sonic the hedgehog', 'Sonic the Hedgehog', 'house', 'sonic'),
  term('sega', 'Sega', 'house', 'sonic'),
  term('sonic', 'Sonic', 'character', 'sonic', { scope: 'short' }),
  term('warhammer', 'Warhammer', 'house', 'gw'),
  term('games workshop', 'Games Workshop', 'house', 'gw'),
  term('space marine', 'Space Marine', 'character', 'gw', { scope: 'short' }),
  term('skaven', 'Skaven', 'character', 'gw'),
  term('dungeons and dragons', 'Dungeons & Dragons', 'house', 'dnd'),
  term('wizards of the coast', 'Wizards of the Coast', 'house', 'dnd'),
  term('beholder', 'Beholder', 'character', 'dnd'),
  term('mind flayer', 'Mind Flayer', 'character', 'dnd'),
  term('illithid', 'Illithid', 'character', 'dnd'),
  term('magic the gathering', 'Magic: The Gathering', 'house', 'mtg'),
  term('planeswalker', 'Planeswalker', 'character', 'mtg'),
  term('blizzard entertainment', 'Blizzard Entertainment', 'house', 'blizzard'),
  term('warcraft', 'Warcraft', 'house', 'blizzard'),
  term('world of warcraft', 'World of Warcraft', 'house', 'blizzard'),
  term('league of legends', 'League of Legends', 'house', 'riot'),
  term('genshin impact', 'Genshin Impact', 'house', 'hoyo'),
  term('genshin', 'Genshin', 'house', 'hoyo'),
  term('paimon', 'Paimon', 'character', 'hoyo'),
  term('hoyoverse', 'HoYoverse', 'house', 'hoyo'),
  term('mihoyo', 'miHoYo', 'house', 'hoyo'),
  term('star wars', 'Star Wars', 'house', 'starwars'),
  term('darth vader', 'Darth Vader', 'character', 'starwars'),
  term('lightsaber', 'Lightsaber', 'emblem', 'starwars'),
  term('jedi', 'Jedi', 'character', 'starwars'),
  term('sith', 'Sith', 'character', 'starwars'),
  term('skywalker', 'Skywalker', 'character', 'starwars'),
  term('harry potter', 'Harry Potter', 'house', 'hp'),
  term('hogwarts', 'Hogwarts', 'setting', 'hp'),
  term('voldemort', 'Voldemort', 'character', 'hp'),
  term('dumbledore', 'Dumbledore', 'character', 'hp'),
  term('lord of the rings', 'The Lord of the Rings', 'house', 'lotr'),
  term('gandalf', 'Gandalf', 'character', 'lotr'),
  term('sauron', 'Sauron', 'character', 'lotr'),
  term('frodo', 'Frodo', 'character', 'lotr'),
  term('hobbit', 'Hobbit', 'character', 'lotr', { ambiguous: true, scope: 'short' }),
  term('game of thrones', 'Game of Thrones', 'house', 'got'),
  term('studio ghibli', 'Studio Ghibli', 'house', 'ghibli'),
  term('totoro', 'Totoro', 'character', 'ghibli'),
  term('sanrio', 'Sanrio', 'house', 'sanrio'),
  term('hello kitty', 'Hello Kitty', 'character', 'sanrio'),
  term('dark souls', 'Dark Souls', 'house', 'from'),
  term('elden ring', 'Elden Ring', 'house', 'from'),
  term('bloodborne', 'Bloodborne', 'house', 'from'),
  term('malenia', 'Malenia', 'character', 'from'),
  term('praise the sun', 'Praise the Sun', 'move', 'from'),
  term('resident evil', 'Resident Evil', 'house', 'capcom'),
  term('monster hunter', 'Monster Hunter', 'house', 'capcom', { scope: 'short' }),
  term('kingdom hearts', 'Kingdom Hearts', 'house', 'kh'),
  term('keyblade', 'Keyblade', 'emblem', 'kh'),
  term('persona', 'Persona', 'house', 'atlus', { ambiguous: true, scope: 'short' }),
  term('shin megami tensei', 'Shin Megami Tensei', 'house', 'atlus'),
  term('hee-ho', 'Hee-ho', 'move', 'atlus'),
  term('dragon ball', 'Dragon Ball', 'house', 'db'),
  term('goku', 'Goku', 'character', 'db'),
  term('vegeta', 'Vegeta', 'character', 'db'),
  term('kamehameha', 'Kamehameha', 'move', 'db'),
  term('saiyan', 'Saiyan', 'character', 'db'),
  term('one piece', 'One Piece', 'house', 'op', { ambiguous: true, scope: 'short' }),
  term('luffy', 'Luffy', 'character', 'op'),
  term('พิคาชู', 'Pikachu', 'character', 'pokemon'),
  term('ปิกาจู', 'Pikachu', 'character', 'pokemon'),
  term('โปเกมอน', 'Pokémon', 'house', 'pokemon'),
  term('มาริโอ', 'Mario', 'character', 'mario'),
  term('เซฟิรอธ', 'Sephiroth', 'character', 'ff'),
  term('นารูโตะ', 'Naruto', 'character', 'naruto'),
  term('โกคู', 'Goku', 'character', 'db'),
  term('ลูฟี่', 'Luffy', 'character', 'op'),
  term('naruto', 'Naruto', 'character', 'naruto'),
  term('sasuke', 'Sasuke', 'character', 'naruto'),
  term('sharingan', 'Sharingan', 'move', 'naruto'),
  term('rasengan', 'Rasengan', 'move', 'naruto'),
  term('demon slayer', 'Demon Slayer', 'house', 'kimetsu'),
  term('kimetsu', 'Kimetsu', 'house', 'kimetsu'),
  term('tanjiro', 'Tanjiro', 'character', 'kimetsu'),
  term('nezuko', 'Nezuko', 'character', 'kimetsu'),
  term('jujutsu kaisen', 'Jujutsu Kaisen', 'house', 'jjk'),
  term('gojo', 'Gojo', 'character', 'jjk'),
  term('attack on titan', 'Attack on Titan', 'house', 'aot'),
  term('evangelion', 'Evangelion', 'house', 'eva'),
  term('gundam', 'Gundam', 'house', 'gundam'),
  term('sailor moon', 'Sailor Moon', 'character', 'sailormoon'),
  term('digimon', 'Digimon', 'house', 'digimon'),
  term('agumon', 'Agumon', 'character', 'digimon'),
  term('yu-gi-oh', 'Yu-Gi-Oh!', 'house', 'ygo'),
  term('yugioh', 'Yu-Gi-Oh!', 'house', 'ygo'),
  term('one punch man', 'One-Punch Man', 'house', 'opm'),
  term('saitama', 'Saitama', 'character', 'opm', { ambiguous: true, scope: 'short' }),
  term('chainsaw man', 'Chainsaw Man', 'house', 'csm'),
  term('my hero academia', 'My Hero Academia', 'house', 'mha'),
  term('plus ultra', 'Plus Ultra', 'move', 'mha'),
  term('spy x family', 'Spy x Family', 'house', 'spyxfam'),
  term('death note', 'Death Note', 'house', 'dn'),
  term('fullmetal alchemist', 'Fullmetal Alchemist', 'house', 'fma'),
  term('hunter x hunter', 'Hunter x Hunter', 'house', 'hxh'),
  term('jojo', "JoJo's Bizarre Adventure", 'house', 'jojo', { ambiguous: true, scope: 'short' }),
  term('the witcher', 'The Witcher', 'house', 'witcher'),
  term('geralt', 'Geralt', 'character', 'witcher'),
  term('god of war', 'God of War', 'house', 'gow', { scope: 'short' }),
  term('kratos', 'Kratos', 'character', 'gow', { ambiguous: true, scope: 'short' }),
  term('minecraft', 'Minecraft', 'house', 'mc'),
  term('creeper', 'Creeper', 'character', 'mc', { ambiguous: true, scope: 'short' }),
]);

/**
 * Co-occurring visual groups. highAt = signature design. mediumAt = partial.
 * Word "slime" alone is generic; the teardrop mascot combination is the flag.
 */
export const SIGNATURE_VISUALS = Object.freeze([
  Object.freeze({
    id: 'electric-cheek-mouse',
    label: 'yellow rodent, red cheek circles, lightning-bolt tail',
    highAt: 4,
    mediumAt: 3,
    groups: Object.freeze([
      Object.freeze([/yellow|golden/]),
      Object.freeze([/mouse|rat|rodent/]),
      Object.freeze([/red cheek|cheek pouch|circular cheek|circle cheek|red circles on/]),
      Object.freeze([/lightning|thunderbolt|bolt-shaped tail|spark tail|black-tipped tail|black tipped tail/]),
    ]),
  }),
  Object.freeze({
    id: 'blue-hedgehog-shoes',
    label: 'blue hedgehog with red shoes and white gloves',
    highAt: 3,
    mediumAt: 2,
    groups: Object.freeze([
      Object.freeze([/blue hedgehog|hedgehog/]),
      Object.freeze([/red shoe|red sneaker/]),
      Object.freeze([/white glove/]),
    ]),
  }),
  Object.freeze({
    id: 'mario-plumber',
    label: 'red cap, mustache, blue overalls',
    highAt: 3,
    mediumAt: 2,
    groups: Object.freeze([
      Object.freeze([/red cap|red hat/]),
      Object.freeze([/mustache|moustache/]),
      Object.freeze([/blue overall|plumber|white glove/]),
    ]),
  }),
  Object.freeze({
    id: 'dq-teardrop-slime',
    label: 'blue teardrop slime with a simple smiling face',
    highAt: 4,
    mediumAt: 3,
    groups: Object.freeze([
      Object.freeze([/teardrop|onion-shaped|onion shaped|droplet-shaped|droplet shaped/]),
      Object.freeze([/slime|gelatin|jelly/]),
      Object.freeze([/smile|smiling|grin|cute face|dot eyes/]),
      Object.freeze([/blue|cyan|teal/]),
    ]),
  }),
  Object.freeze({
    id: 'orange-gi-spiky',
    label: 'spiky hair, orange gi, and a series-specific attack or nimbus',
    highAt: 3,
    mediumAt: 3,
    groups: Object.freeze([
      Object.freeze([/spiky hair|spiked hair/]),
      Object.freeze([/orange gi|orange uniform|orange martial/]),
      Object.freeze([/kamehameha|flying nimbus|nimbus cloud|super saiyan|monkey tail/]),
    ]),
  }),
  Object.freeze({
    id: 'straw-hat-stretch',
    label: 'straw hat plus a rubber stretching body',
    highAt: 2,
    mediumAt: 2,
    groups: Object.freeze([
      Object.freeze([/straw hat/]),
      Object.freeze([/stretch(?:ing|y)? (?:arm|limb|body)|rubber (?:body|arm|limb)|gum-gum|gum gum/]),
    ]),
  }),
  Object.freeze({
    id: 'vader-mask',
    label: 'black full-face helmet, cape, and breathing apparatus',
    highAt: 3,
    mediumAt: 2,
    groups: Object.freeze([
      Object.freeze([/black helmet|full-face helmet|full face mask/]),
      Object.freeze([/cape/]),
      Object.freeze([/breathing|chest box|respirator/]),
    ]),
  }),
  Object.freeze({
    id: 'web-mask',
    label: 'red and blue web-pattern mask with large eye lenses',
    highAt: 3,
    mediumAt: 2,
    groups: Object.freeze([
      Object.freeze([/red and blue|red-and-blue/]),
      Object.freeze([/web pattern|spider-web|spider web/]),
      Object.freeze([/mask/]),
    ]),
  }),
  Object.freeze({
    id: 'witcher-medallion',
    label: 'white hair, two swords, wolf medallion',
    highAt: 3,
    mediumAt: 2,
    groups: Object.freeze([
      Object.freeze([/white hair/]),
      Object.freeze([/two swords|twin swords/]),
      Object.freeze([/wolf medallion/]),
    ]),
  }),
  Object.freeze({
    id: 'kratos-ash',
    label: 'bald head, red tattoos, chained blades',
    highAt: 3,
    mediumAt: 3,
    groups: Object.freeze([
      Object.freeze([/bald/]),
      Object.freeze([/red tattoo/]),
      Object.freeze([/chained blade|chain blade|leviathan axe/]),
    ]),
  }),
  Object.freeze({
    id: 'zelda-tunic',
    label: 'green tunic and pointed cap plus a Triforce or Master Sword',
    highAt: 3,
    mediumAt: 3,
    groups: Object.freeze([
      Object.freeze([/green tunic|green cap|green pointed/]),
      Object.freeze([/pointed cap|pointed hat|long green hat/]),
      Object.freeze([/triforce|master sword|hyrule/]),
    ]),
  }),
  Object.freeze({
    id: 'magical-girl-compact',
    label: 'transformation compact, ribbon costume, and a second pose',
    highAt: 4,
    mediumAt: 3,
    groups: Object.freeze([
      Object.freeze([/\bcompact\b|brooch/]),
      Object.freeze([/\bribbon/]),
      Object.freeze([/transform|henshin|second pose|second form|after the change/]),
      Object.freeze([/school uniform|sailor collar|magic wand|tiara/]),
    ]),
  }),
]);

export const SENSITIVITY_NOTES = Object.freeze({
  sacred: 'Living objects of worship are a poor comedy target. Keep the culture\'s folklore creature, and leave the deity\'s name in the research block.',
  tragedy: 'A real mass death is not a boss joke. Use a fictional tower accident.',
  stereotype: 'The joke has to be the creature, not an ethnic caricature.',
});

/**
 * Editorial sensitivity list for this project. Levels:
 * high = revise before QA_PASSED; review = a person should look; note = context for creators.
 * research vs creative can differ. Documenting a deity in a source record is not the same
 * as naming a killable comedy monster after that deity.
 */
export const SENSITIVITY_TERMS = Object.freeze([
  sens('sacred-allah', 'sacred', 'high', 'note', /\ballah\b|อัลลอฮ์/),
  sens('sacred-yahweh', 'sacred', 'high', 'note', /\b(yahweh|jehovah)\b/),
  sens('sacred-muhammad', 'sacred', 'high', 'note', /\b(muhammad|mohammed|mohammad)\b|มุฮัมมัด/),
  sens('sacred-jesus', 'sacred', 'high', 'note', /\bjesus christ\b|\bjesus of nazareth\b|พระเยซู/),
  sens('sacred-buddha', 'sacred', 'high', 'note', /\b(the buddha|gautama|siddhartha)\b|\bbuddha\b|พระพุทธเจ้า/),
  sens('sacred-ganesha', 'sacred', 'high', 'note', /\bganesha\b|\bganesh\b|พระพิฆเนศ/),
  sens('sacred-shiva', 'sacred', 'high', 'note', /\bshiva\b|พระศิวะ/),
  sens('sacred-vishnu', 'sacred', 'high', 'note', /\bvishnu\b|พระวิษณุ/),
  sens('sacred-krishna', 'sacred', 'high', 'note', /\bkrishna\b|พระกฤษณะ/),
  sens('sacred-durga', 'sacred', 'high', 'note', /\bdurga\b/),
  sens('sacred-lakshmi', 'sacred', 'high', 'note', /\blakshmi\b/),
  sens('sacred-guanyin', 'sacred', 'high', 'note', /\b(guanyin|kuan yin|quan yin|avalokiteshvara)\b|เจ้าแม่กวนอิม/),
  sens('sacred-kali', 'sacred', 'review', 'note', /\bkali\b|พระแม่กาลี/),
  sens('sacred-amaterasu', 'sacred', 'review', 'note', /\bamaterasu\b/),
  sens('sacred-skinwalker', 'sacred', 'high', 'high', /\bskinwalker\b|\byee naaldlooshii\b/),
  sens('sacred-wendigo', 'sacred', 'review', 'review', /\bwendigo\b|\bwindigo\b/),
  sens('sacred-dreamtime', 'sacred', 'review', 'note', /\bdreamtime\b/),
  sens('tragedy-holocaust', 'tragedy', 'high', 'review', /\bholocaust\b|\bauschwitz\b|\bbirkenau\b|\bshoah\b/),
  sens('tragedy-911', 'tragedy', 'high', 'review', /\b9\/11\b|\bseptember 11\b|\bsep\.? 11,? 2001\b/),
  sens('tragedy-school', 'tragedy', 'high', 'review', /\b(sandy hook|columbine|school shooting)\b/),
  sens('tragedy-genocide', 'tragedy', 'high', 'review', /\bkhmer rouge\b|\bkilling fields\b|\brwanda genocide\b|\bnanjing massacre\b|\brape of nanking\b/),
  sens('tragedy-atomic', 'tragedy', 'review', 'note', /\bhiroshima\b|\bnagasaki\b/),
  sens('tragedy-towers', 'tragedy', 'review', 'note', /\bworld trade center\b|\btwin towers\b/),
  sens('stereotype-slur-chingchong', 'stereotype', 'high', 'high', /ching chong/),
  sens('stereotype-slant', 'stereotype', 'high', 'high', /slant-?eyed|slanted eyes|slant eye/),
  sens('stereotype-facepaint', 'stereotype', 'high', 'high', /\b(blackface|yellowface|brownface)\b/),
  sens('stereotype-towel', 'stereotype', 'high', 'high', /\btowelhead\b/),
  sens('stereotype-ooga', 'stereotype', 'high', 'high', /ooga booga/),
  sens('stereotype-gypsy', 'stereotype', 'high', 'high', /\bgyps(?:y|ies)\b/),
  sens('stereotype-redskin', 'stereotype', 'high', 'high', /\bredskin\b/),
  sens('stereotype-coolie', 'stereotype', 'high', 'high', /\bcoolie\b/),
  sens('stereotype-indian-giver', 'stereotype', 'high', 'high', /indian giver/),
  sens('stereotype-savage-tribe', 'stereotype', 'high', 'high', /\b(savage|primitive) tribe\b/),
  sens('stereotype-trait', 'stereotype', 'high', 'high', /\b(arab|muslim|jewish|mexican|chinese|japanese|african|indian|romani|asian)\b[^.\n]{0,40}\b(greedy|lazy|dirty|terrorist|sneaky|stingy)\b/),
  sens('stereotype-trait-rev', 'stereotype', 'high', 'high', /\b(greedy|lazy|dirty|terrorist|sneaky|stingy)\b[^.\n]{0,40}\b(arab|muslim|jewish|mexican|chinese|japanese|african|indian|romani|asian)\b/),
]);

/**
 * @param {string} phrase
 * @param {string} label
 * @param {string} kind
 * @param {string} family
 * @param {{ ambiguous?: boolean, scope?: 'short' | 'any', phrase?: string }} [options]
 */
function term(phrase, label, kind, family, options = {}) {
  return Object.freeze({
    phrase: options.phrase ?? phrase,
    label,
    kind,
    family,
    ambiguous: Boolean(options.ambiguous),
    scope: options.scope ?? 'any',
  });
}

/**
 * @param {string} id
 * @param {'sacred' | 'tragedy' | 'stereotype'} category
 * @param {'high' | 'review' | 'note'} creative
 * @param {'high' | 'review' | 'note'} research
 * @param {RegExp} pattern
 */
function sens(id, category, creative, research, pattern) {
  const flags = pattern.flags.includes('i') ? pattern.flags : `${pattern.flags}i`;
  return Object.freeze({
    id,
    category,
    creative,
    research,
    pattern: new RegExp(pattern.source, flags),
    note: SENSITIVITY_NOTES[category],
  });
}
