export declare const BRIGHTNESS_STEPS: readonly [70, 85, 100, 115, 130];
export type Brightness = (typeof BRIGHTNESS_STEPS)[number];
export declare const SOUNDTRACKS: readonly ["reedhaven", "mire", "none"];
export type SoundtrackId = (typeof SOUNDTRACKS)[number];
export type AudioPreferences = {
    muted: boolean;
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    soundtrack: SoundtrackId;
};
export type AshfenPreferences = {
    brightness: Brightness;
    audio: AudioPreferences;
    reduceEffects: boolean;
    largeUi: boolean;
    showMinimap: boolean;
};
export declare const DEFAULT_PREFERENCES: AshfenPreferences;
export declare const clampVolume: (value: unknown, fallback?: number) => number;
export declare function normalizePreferences(input: unknown): AshfenPreferences;
export declare const audioGain: (audio: AudioPreferences, channel: "music" | "sfx") => number;
