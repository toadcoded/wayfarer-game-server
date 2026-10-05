import { Mesh, Vector3, Scene, type LinesMesh } from '@babylonjs/core';
import { type RealmWeather } from './realm-weather.js';
import { type VisualQuality } from './visual-surface.js';
/** Bounded sky/cloud/rain dressing. All weather transitions are smoothed to avoid flashing. */
export declare class RealmSky3D {
    private scene;
    private seed;
    private skyPaint;
    private light;
    private cloudWater;
    private lastClock;
    get daylight(): {
        phase: number;
        day: number;
        night: number;
    };
    readonly dome: Mesh;
    readonly clouds: Mesh;
    readonly rain: LinesMesh;
    private moon;
    private stars;
    private materials;
    private lines;
    private lastRain;
    private frozenTime;
    private disposed;
    constructor(scene: Scene, seed: number);
    update(timeMs: number, focus: Vector3, paused: boolean, quality: VisualQuality, retro: boolean): RealmWeather;
    dispose(): void;
}
