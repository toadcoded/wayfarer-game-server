import type { Skin } from './game-actions.js';
export declare const SKIN_TONES: readonly ["#f0cbb1", "#e7b18d", "#cb926b", "#aa704e", "#80513b", "#57372c"];
export declare const HAIR_COLORS: readonly ["#d69c43", "#664726", "#a5a099", "#634733", "#241e22", "#ae482d"];
export declare const EYE_COLORS: readonly ["#244798", "#433523", "#42715b", "#717d8a"];
export interface HeroAppearance {
    skinTone: number;
    hairColor: number;
    eyeColor: number;
    hairStyle: 'cropped' | 'swept' | 'long';
    facialHair: 'none' | 'stubble' | 'beard';
    makeup: 'none' | 'natural' | 'moonlit';
    build: 'lean' | 'balanced' | 'strong';
}
export declare function checkedAppearance(value: unknown): Readonly<HeroAppearance>;
export declare function appearanceForSkin(skin: Skin): Readonly<HeroAppearance>;
