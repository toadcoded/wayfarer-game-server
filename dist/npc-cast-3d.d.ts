import { Scene } from '@babylonjs/core';
import { type NPCId } from './npc-prototypes.js';
/** Faceted prototype outfits. All adornments are cosmetic and owned by this rig. */
export declare function createNamedNPC3D(scene: Scene, id: string, kind: NPCId): {
    prototype: "halden" | "pin" | "mirella" | "branik" | "elowen" | "tovik" | "yarrow" | "kestrel";
    dispose(): void;
    root: import("@babylonjs/core").TransformNode;
    cape: import("@babylonjs/core").Mesh;
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
    appearance: Readonly<import("./hero-appearance.js").HeroAppearance>;
    details: readonly string[];
    joints: Readonly<{
        [x: string]: import("@babylonjs/core").TransformNode;
    }>;
    weapon: (value: string | null) => void;
    update: (position: import("./world.js").Point, now: number, paused?: boolean, wind?: number, gesture?: import("./hero-3d.js").HeroGesture) => void;
    disposed: boolean;
};
