import { Scene, TransformNode, Mesh } from '@babylonjs/core';
import { type HeroAppearance } from './hero-appearance.js';
import type { Point } from './world.js';
import type { Skin } from './game-actions.js';
export type HeroGesture = 'idle' | 'wave' | 'chop' | 'sneeze' | 'play' | 'brace' | 'aim' | 'focus' | 'balance';
export declare const HERO_PROFILES: Readonly<{
    seraphine: Readonly<{
        coat: "#253b96";
        trim: "#e9b74e";
        hair: "#d69c43";
        skin: "#efbd96";
        idle: 0.022;
        stride: 0.48;
        cape: 0.22;
        cadence: 1.15;
    }>;
    adventurer: Readonly<{
        coat: "#384c7e";
        trim: "#c9a45e";
        hair: "#664726";
        skin: "#d1a078";
        idle: 0.017;
        stride: 0.6;
        cape: 0.1;
        cadence: 1;
    }>;
    elder: Readonly<{
        coat: "#455842";
        trim: "#c4b477";
        hair: "#a5a099";
        skin: "#c5a688";
        idle: 0.012;
        stride: 0.25;
        cape: 0.04;
        cadence: 0.7;
    }>;
    traveler: Readonly<{
        coat: "#455b67";
        trim: "#b3aa80";
        hair: "#665b48";
        skin: "#d2a17c";
        idle: 0.018;
        stride: 0.55;
        cape: 0.16;
        cadence: 1.05;
    }>;
    villager: Readonly<{
        coat: "#55764a";
        trim: "#b5a27a";
        hair: "#634733";
        skin: "#d3a783";
        idle: 0.026;
        stride: 0.42;
        cape: 0.07;
        cadence: 0.9;
    }>;
    vector: Readonly<{
        coat: "#637895";
        trim: "#b8c7cf";
        hair: "#494b54";
        skin: "#d0af92";
        idle: 0.015;
        stride: 0.5;
        cape: 0.08;
        cadence: 1;
    }>;
}>;
/** Procedural faceted prototype rig; all motion is cosmetic and never changes collision. */
export declare function createHero3D(scene: Scene, id: string, skin: Skin, customAppearance?: HeroAppearance, wardrobe?: {
    coat: string;
    trim: string;
}): {
    root: TransformNode;
    cape: Mesh;
    profile: Readonly<{
        skin: "#f0cbb1" | "#e7b18d" | "#cb926b" | "#aa704e" | "#80513b" | "#57372c";
        hair: "#d69c43" | "#664726" | "#a5a099" | "#634733" | "#241e22" | "#ae482d";
        coat: string;
        trim: string;
        idle: 0.022;
        stride: 0.48;
        cape: 0.22;
        cadence: 1.15;
    } | {
        skin: "#f0cbb1" | "#e7b18d" | "#cb926b" | "#aa704e" | "#80513b" | "#57372c";
        hair: "#d69c43" | "#664726" | "#a5a099" | "#634733" | "#241e22" | "#ae482d";
        coat: string;
        trim: string;
        idle: 0.017;
        stride: 0.6;
        cape: 0.1;
        cadence: 1;
    } | {
        skin: "#f0cbb1" | "#e7b18d" | "#cb926b" | "#aa704e" | "#80513b" | "#57372c";
        hair: "#d69c43" | "#664726" | "#a5a099" | "#634733" | "#241e22" | "#ae482d";
        coat: string;
        trim: string;
        idle: 0.012;
        stride: 0.25;
        cape: 0.04;
        cadence: 0.7;
    } | {
        skin: "#f0cbb1" | "#e7b18d" | "#cb926b" | "#aa704e" | "#80513b" | "#57372c";
        hair: "#d69c43" | "#664726" | "#a5a099" | "#634733" | "#241e22" | "#ae482d";
        coat: string;
        trim: string;
        idle: 0.018;
        stride: 0.55;
        cape: 0.16;
        cadence: 1.05;
    } | {
        skin: "#f0cbb1" | "#e7b18d" | "#cb926b" | "#aa704e" | "#80513b" | "#57372c";
        hair: "#d69c43" | "#664726" | "#a5a099" | "#634733" | "#241e22" | "#ae482d";
        coat: string;
        trim: string;
        idle: 0.026;
        stride: 0.42;
        cape: 0.07;
        cadence: 0.9;
    } | {
        skin: "#f0cbb1" | "#e7b18d" | "#cb926b" | "#aa704e" | "#80513b" | "#57372c";
        hair: "#d69c43" | "#664726" | "#a5a099" | "#634733" | "#241e22" | "#ae482d";
        coat: string;
        trim: string;
        idle: 0.015;
        stride: 0.5;
        cape: 0.08;
        cadence: 1;
    }>;
    appearance: Readonly<HeroAppearance>;
    details: readonly string[];
    joints: Readonly<{
        [x: string]: TransformNode;
    }>;
    weapon: (value: string | null) => void;
    update: (position: Point, now: number, paused?: boolean, wind?: number, gesture?: HeroGesture) => void;
    dispose(): void;
    readonly disposed: boolean;
};
