export interface RealmWeather {
    kind: 'clear' | 'cloudy' | 'rain' | 'mist';
    humidity: number;
    cloudWater: number;
    rain: number;
    wetness: number;
    fogDensity: number;
    wind: number;
}
/** Cosmetic shared-clock field. Never grants resources, changes traction or mutates save data. */
export declare function realmWeather(seed: number, timeMs: number): RealmWeather;
/** Small per-chunk cosmetic cache; one climate evaluation per second, maximum16 entries. */
export declare class WeatherChunkCache {
    private seed;
    private bucket;
    private base;
    private values;
    constructor(seed: number);
    get size(): number;
    at(timeMs: number, cx: number, cz: number): {
        kind: "clear" | "cloudy" | "rain" | "mist";
        humidity: number;
        cloudWater: number;
        rain: number;
        wetness: number;
        fogDensity: number;
        wind: number;
    };
    clear(): void;
}
