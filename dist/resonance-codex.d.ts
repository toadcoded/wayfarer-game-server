export declare const RESONANCE_NODES: readonly [{
    readonly id: "cinder";
    readonly rune: "CI";
    readonly name: "Cinder";
    readonly note: "C";
    readonly family: "ember";
    readonly color: "#ef5350";
    readonly toneHz: 261.63;
    readonly value: 174;
}, {
    readonly id: "flare";
    readonly rune: "FL";
    readonly name: "Flare";
    readonly note: "C♯";
    readonly family: "ember";
    readonly color: "#ff8f32";
    readonly toneHz: 277.18;
    readonly value: 285;
}, {
    readonly id: "sunward";
    readonly rune: "SU";
    readonly name: "Sunward";
    readonly note: "D";
    readonly family: "solar";
    readonly color: "#ffd93d";
    readonly toneHz: 293.66;
    readonly value: 369;
}, {
    readonly id: "verdant";
    readonly rune: "VE";
    readonly name: "Verdant";
    readonly note: "D♯";
    readonly family: "grove";
    readonly color: "#38c96b";
    readonly toneHz: 311.13;
    readonly value: 396;
}, {
    readonly id: "bloom";
    readonly rune: "BL";
    readonly name: "Bloom";
    readonly note: "E";
    readonly family: "grove";
    readonly color: "#15a65b";
    readonly toneHz: 329.63;
    readonly value: 258;
}, {
    readonly id: "tide";
    readonly rune: "TI";
    readonly name: "Tide";
    readonly note: "F";
    readonly family: "tide";
    readonly color: "#2cb7c9";
    readonly toneHz: 349.23;
    readonly value: 417;
}, {
    readonly id: "skyglass";
    readonly rune: "SK";
    readonly name: "Skyglass";
    readonly note: "F♯";
    readonly family: "tide";
    readonly color: "#338ee8";
    readonly toneHz: 369.99;
    readonly value: 147;
}, {
    readonly id: "dusk";
    readonly rune: "DU";
    readonly name: "Dusk";
    readonly note: "G";
    readonly family: "astral";
    readonly color: "#5f62d8";
    readonly toneHz: 392;
    readonly value: 528;
}, {
    readonly id: "violet";
    readonly rune: "VI";
    readonly name: "Violet";
    readonly note: "G♯";
    readonly family: "astral";
    readonly color: "#8e49d6";
    readonly toneHz: 415.3;
    readonly value: 582;
}, {
    readonly id: "moon";
    readonly rune: "MO";
    readonly name: "Moon";
    readonly note: "A";
    readonly family: "lunar";
    readonly color: "#b05bd7";
    readonly toneHz: 440;
    readonly value: 963;
}, {
    readonly id: "rose";
    readonly rune: "RO";
    readonly name: "Rose";
    readonly note: "A♯";
    readonly family: "lunar";
    readonly color: "#d95388";
    readonly toneHz: 466.16;
    readonly value: 693;
}, {
    readonly id: "lantern";
    readonly rune: "LA";
    readonly name: "Lantern";
    readonly note: "B";
    readonly family: "solar";
    readonly color: "#ff6868";
    readonly toneHz: 493.88;
    readonly value: 714;
}];
export type ResonanceNodeId = typeof RESONANCE_NODES[number]['id'];
export type ResonanceEffectId = 'lantern-bloom' | 'pathfinders-gleam' | 'miners-echo' | 'tide-whisper' | 'ward-glimmer' | 'starlight-trace';
export interface ResonanceEffect {
    id: ResonanceEffectId;
    name: string;
    description: string;
    durationMs: number;
}
export interface ResonanceChord {
    key: string;
    nodes: readonly [ResonanceNodeId, ResonanceNodeId, ResonanceNodeId];
    name: string;
    effect: ResonanceEffect;
    signature: number;
}
export declare const RESONANCE_EFFECTS: readonly ResonanceEffect[];
export declare const RESONANCE_COOLDOWN_MS = 8000;
export declare const isResonanceNodeId: (value: unknown) => value is ResonanceNodeId;
export declare const resonanceNode: (id: ResonanceNodeId) => {
    readonly id: "cinder";
    readonly rune: "CI";
    readonly name: "Cinder";
    readonly note: "C";
    readonly family: "ember";
    readonly color: "#ef5350";
    readonly toneHz: 261.63;
    readonly value: 174;
} | {
    readonly id: "flare";
    readonly rune: "FL";
    readonly name: "Flare";
    readonly note: "C♯";
    readonly family: "ember";
    readonly color: "#ff8f32";
    readonly toneHz: 277.18;
    readonly value: 285;
} | {
    readonly id: "sunward";
    readonly rune: "SU";
    readonly name: "Sunward";
    readonly note: "D";
    readonly family: "solar";
    readonly color: "#ffd93d";
    readonly toneHz: 293.66;
    readonly value: 369;
} | {
    readonly id: "verdant";
    readonly rune: "VE";
    readonly name: "Verdant";
    readonly note: "D♯";
    readonly family: "grove";
    readonly color: "#38c96b";
    readonly toneHz: 311.13;
    readonly value: 396;
} | {
    readonly id: "bloom";
    readonly rune: "BL";
    readonly name: "Bloom";
    readonly note: "E";
    readonly family: "grove";
    readonly color: "#15a65b";
    readonly toneHz: 329.63;
    readonly value: 258;
} | {
    readonly id: "tide";
    readonly rune: "TI";
    readonly name: "Tide";
    readonly note: "F";
    readonly family: "tide";
    readonly color: "#2cb7c9";
    readonly toneHz: 349.23;
    readonly value: 417;
} | {
    readonly id: "skyglass";
    readonly rune: "SK";
    readonly name: "Skyglass";
    readonly note: "F♯";
    readonly family: "tide";
    readonly color: "#338ee8";
    readonly toneHz: 369.99;
    readonly value: 147;
} | {
    readonly id: "dusk";
    readonly rune: "DU";
    readonly name: "Dusk";
    readonly note: "G";
    readonly family: "astral";
    readonly color: "#5f62d8";
    readonly toneHz: 392;
    readonly value: 528;
} | {
    readonly id: "violet";
    readonly rune: "VI";
    readonly name: "Violet";
    readonly note: "G♯";
    readonly family: "astral";
    readonly color: "#8e49d6";
    readonly toneHz: 415.3;
    readonly value: 582;
} | {
    readonly id: "moon";
    readonly rune: "MO";
    readonly name: "Moon";
    readonly note: "A";
    readonly family: "lunar";
    readonly color: "#b05bd7";
    readonly toneHz: 440;
    readonly value: 963;
} | {
    readonly id: "rose";
    readonly rune: "RO";
    readonly name: "Rose";
    readonly note: "A♯";
    readonly family: "lunar";
    readonly color: "#d95388";
    readonly toneHz: 466.16;
    readonly value: 693;
} | {
    readonly id: "lantern";
    readonly rune: "LA";
    readonly name: "Lantern";
    readonly note: "B";
    readonly family: "solar";
    readonly color: "#ff6868";
    readonly toneHz: 493.88;
    readonly value: 714;
};
export declare function checkedResonanceSelection(ids: readonly unknown[]): readonly ResonanceNodeId[];
export declare function resolveResonanceChord(ids: readonly unknown[]): ResonanceChord;
export declare function resonanceCooldownRemaining(now: number, readyAt: number): number;
export declare const resonanceEffect: (id: ResonanceEffectId) => ResonanceEffect;
export declare const isResonanceEffectId: (value: unknown) => value is ResonanceEffectId;
export declare function encodeResonanceCast(ids: readonly unknown[]): string;
export declare function decodeResonanceCast(value: unknown): ResonanceChord;
export declare const isResonanceCast: (value: unknown) => value is string;
