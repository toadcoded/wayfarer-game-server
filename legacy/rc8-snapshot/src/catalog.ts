/** Proposed content, not a reconstruction of the existing game's source. */
export const BIOME_IDS = [
  'river-valley', 'grassland', 'desert', 'oasis-coast',
  'forest', 'mire', 'alpine', 'volcanic', 'cavern', 'tundra',
] as const;
export type BiomeId = typeof BIOME_IDS[number];
export type Weather = 'clear' | 'rain' | 'fog' | 'sandstorm' | 'snow' | 'ash';
export type PropKind = 'tree' | 'rock' | 'flower' | 'reed' | 'cactus' | 'palm' | 'crystal' | 'ruin';
export type LandmarkKind = 'stronghold' | 'garden' | 'barrow' | 'pyramid' | 'shrine' | 'bridge' | 'village';
export interface BiomeDefinition {
  id: BiomeId;
  name: string;
  themes: readonly string[];
  palette: { ground: string; accent: string; water: string; fog: string };
  terrain: { base: number; amplitude: number; wavelength: number; river: boolean };
  weather: readonly Weather[];
  props: readonly PropKind[];
  landmarks: readonly LandmarkKind[];
  resources: readonly string[];
  encounters: readonly string[];
  ambience: string; // symbolic asset key; your asset loader resolves it
}
const biome = (id: BiomeId, name: string, themes: string, colors: readonly [string,string,string,string],
  terrain: BiomeDefinition['terrain'], weather: readonly Weather[], props: readonly PropKind[],
  landmarks: readonly LandmarkKind[], resources: string[], encounters: string[], ambience: string): BiomeDefinition => ({
  id, name, themes: themes.split(' / '), palette: {ground:colors[0],accent:colors[1],water:colors[2],fog:colors[3]},
  terrain, weather, props, landmarks, resources, encounters, ambience,
});
export const BIOMES: Readonly<Record<BiomeId, BiomeDefinition>> = {
  'river-valley': biome('river-valley', 'Earthbound Valley',
    'river / scene / earthy-texture / earthbound-stronghold / hill-mountaintop / distant-hillsides / region-sorted-biome / fences / gates / walls / landscape-scenic-view / elegant-garden / beautiful-valley',
    ['#65824A','#B9A779','#457F91','#C9D5CA'], {base:5,amplitude:9,wavelength:180,river:true},
    ['clear','rain','fog'], ['tree','rock','flower','reed'], ['stronghold','garden','bridge'],
    ['river-reed','clay','driftwood'], ['river-otter','valley-boar'], 'ambience/river-valley'),
  grassland: biome('grassland', 'Barrow Meadow',
    'grassland-biome / terraform-reinforcements / naturalistic-environment / fantastically-magnificent-meadow / enclave-hilltop / ravine-barrows / rugged-burrows / ancient-graveyard',
    ['#78964C','#D0B98A','#527F83','#D3DBC0'], {base:7,amplitude:6,wavelength:220,river:false},
    ['clear','rain','fog'], ['flower','rock','tree','ruin'], ['barrow','village'],
    ['trail-bloom','flax','barrow-stone'], ['hare','burrow-wolf'], 'ambience/meadow'),
  desert: biome('desert', 'Red-Sand Dominion',
    'xeriscape-arid / desert-biome / fantasy-egypt / esoteric-glyphs / tombstone-caverns / redsand-pyramids / sunset-alley / sandy-highland-dunes / windy-sandstorm-wilderness',
    ['#B9744E','#E9C085','#428C91','#D8AD84'], {base:9,amplitude:12,wavelength:140,river:false},
    ['clear','sandstorm'], ['cactus','rock','ruin'], ['pyramid','shrine'],
    ['red-sand','sunstone','dry-resin'], ['sand-scarab','dune-stalker'], 'ambience/desert-wind'),
  'oasis-coast': biome('oasis-coast', 'Coconut Coves',
    'sunshine-beach / tropical-oasis / coconut-coves / palm-tree-resort / crocodile-streams / coral-lagoon / saltwind-boardwalk / mangrove-sanctuary',
    ['#C9B778','#67A375','#328C9D','#C0DDCF'], {base:2,amplitude:4,wavelength:180,river:true},
    ['clear','rain'], ['palm','reed','rock','flower'], ['village','bridge','garden'],
    ['coconut','salt','mangrove-wood'], ['crocodile','shore-crab'], 'ambience/tropical-shore'),
  forest: biome('forest', 'Elderwood Canopy',
    'ancient-forest / mossbound-roots / fern-gullies / woodland-sanctum / lantern-trails / hollow-tree-village / moonlit-grove',
    ['#355B38','#8A7650','#416A70','#9BAF9A'], {base:7,amplitude:8,wavelength:160,river:true},
    ['clear','rain','fog'], ['tree','flower','rock'], ['shrine','bridge'],
    ['elderwood','mushroom','amber'], ['stag','forest-wolf'], 'ambience/elderwood'),
  mire: biome('mire', 'Southern Mire',
    'southern-mire / peat-bog / crooked-willow / submerged-ruins / reed-labyrinth / firefly-marsh / sinking-causeway',
    ['#4F6144','#847851','#405C58','#A1AD91'], {base:1,amplitude:3,wavelength:200,river:true},
    ['fog','rain'], ['reed','tree','ruin'], ['bridge','shrine'],
    ['peat','bog-iron','marsh-herb'], ['marsh-toad','mire-crawler'], 'ambience/mire'),
  alpine: biome('alpine', 'Cloudbreak Heights',
    'alpine-ridge / glacier-pass / wind-carved-spires / cliffside-monastery / avalanche-gully / mountain-stronghold',
    ['#849083','#BCC5C3','#638B99','#DCE5EA'], {base:26,amplitude:22,wavelength:170,river:false},
    ['clear','snow','fog'], ['rock','tree','crystal'], ['stronghold','shrine'],
    ['granite','silver-ore','alpine-herb'], ['mountain-goat','frost-wolf'], 'ambience/alpine-wind'),
  volcanic: biome('volcanic', 'Emberfall Caldera',
    'obsidian-fields / basalt-fortress / ember-ravine / ashfall-wastes / geothermal-garden / cinder-forge',
    ['#514A46','#CF6A3D','#765A48','#A29489'], {base:16,amplitude:15,wavelength:130,river:false},
    ['clear','ash'], ['rock','crystal','ruin'], ['stronghold','shrine'],
    ['obsidian','sulfur','basalt'], ['ash-beetle','cinder-golem'], 'ambience/caldera'),
  cavern: biome('cavern', 'Luminous Underdeep',
    'crystal-caverns / fungal-grotto / subterranean-lake / buried-archive / stalactite-vault / echoing-catacombs',
    ['#514C66','#88BBAE','#466E87','#8F8AA5'], {base:-12,amplitude:5,wavelength:100,river:true},
    ['fog'], ['crystal','rock','ruin'], ['shrine','barrow'],
    ['quartz','glowcap','ancient-fragment'], ['cave-moth','stone-crawler'], 'ambience/underdeep'),
  tundra: biome('tundra', 'Aurora Expanse',
    'frozen-steppe / aurora-sky / frostbound-barrows / icebound-harbor / snowgrass-meadow / ancient-standing-stones',
    ['#B9C6BE','#788D8F','#608798','#D8E4E4'], {base:10,amplitude:5,wavelength:240,river:false},
    ['clear','snow','fog'], ['rock','ruin','tree'], ['barrow','village'],
    ['frost-moss','ice-crystal','weathered-bone'], ['snow-hare','white-wolf'], 'ambience/tundra'),
};
