/** Proposed content, not a reconstruction of the existing game's source. */
export declare const BIOME_IDS: readonly ["river-valley", "grassland", "desert", "oasis-coast", "forest", "mire", "alpine", "volcanic", "cavern", "tundra"];
export type BiomeId = typeof BIOME_IDS[number];
export type Weather = 'clear' | 'rain' | 'fog' | 'sandstorm' | 'snow' | 'ash';
export type PropKind = 'tree' | 'rock' | 'flower' | 'reed' | 'cactus' | 'palm' | 'crystal' | 'ruin';
export type LandmarkKind = 'stronghold' | 'garden' | 'barrow' | 'pyramid' | 'shrine' | 'bridge' | 'village';
export interface BiomeDefinition {
    id: BiomeId;
    name: string;
    themes: readonly string[];
    palette: {
        ground: string;
        accent: string;
        water: string;
        fog: string;
    };
    terrain: {
        base: number;
        amplitude: number;
        wavelength: number;
        river: boolean;
    };
    weather: readonly Weather[];
    props: readonly PropKind[];
    landmarks: readonly LandmarkKind[];
    resources: readonly string[];
    encounters: readonly string[];
    ambience: string;
}
export declare const BIOMES: Readonly<Record<BiomeId, BiomeDefinition>>;
