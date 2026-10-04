import { type NPCPlacement } from './npc-prototypes.js';
import { AbstractEngine } from '@babylonjs/core';
import { type VisualQuality } from './visual-surface.js';
import type { Point } from './world.js';
import type { GameState } from './game-actions.js';
/** Alternate renderer consumes only validated/interpolated server state. */
export declare class Realm3D {
    private canvas;
    private engine;
    private scene;
    private camera;
    private heroes;
    private lastPaint;
    private disposed;
    private warden;
    private halden;
    private ring;
    private harvestPainting;
    private painting;
    readonly castPlacements: NPCPlacement[];
    private cast;
    private sky;
    private weather;
    private weatherChunks;
    private wetMaterials;
    private moistureAt;
    private npcDetails;
    get weatherState(): {
        kind: "clear" | "cloudy" | "rain" | "mist";
        humidity: number;
        cloudWater: number;
        rain: number;
        wetness: number;
        fogDensity: number;
        wind: number;
    } | undefined;
    private viewport;
    private ambientLight;
    private keyLight;
    private shadows;
    private waterMaterials;
    private pipeline;
    private quality;
    private contextLost;
    private ambience;
    private retro;
    private flashes;
    private ambientText;
    private grass;
    private metricsAt;
    private cachedMetrics;
    get worldMetrics(): {
        meshes: number;
        triangles: number;
        grassTufts: number;
        fps: number;
    };
    private wildlife;
    private practiceYard;
    private xamId;
    private xamSkill;
    setXam(id: string | undefined, skill: string | undefined): void;
    projectLabel(position: Point): {
        x: number;
        y: number;
        visible: boolean;
    };
    private follow;
    private followId;
    private followTime;
    movementDirection(right: number, forward: number): {
        dx: number;
        dz: number;
    };
    zoomCamera(factor: number): void;
    resetCamera(): void;
    get wildlifeCount(): number;
    get ambienceText(): string | undefined;
    setFlashes(enabled: boolean): void;
    setRetro(enabled: boolean): void;
    get renderState(): "recovering" | "ready";
    setQuality(quality: VisualQuality): void;
    static create(canvas: HTMLCanvasElement): Realm3D;
    retryArtwork(): void;
    get artworkState(): {
        title: "The Causeway Adventurer" | "Harvest Festival";
        state: "loading" | "ready" | "unavailable" | "placeholder";
    }[];
    constructor(canvas: HTMLCanvasElement, engine?: AbstractEngine, attachControls?: boolean);
    update(players: readonly {
        id: string;
        position: Point;
    }[], game: GameState | undefined, local: string | undefined, now: number, paused: boolean, wind?: number): void;
    dispose(): void;
}
