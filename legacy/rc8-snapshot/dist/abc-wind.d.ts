export interface WindPoint {
    x: number;
    y: number;
    z: number;
}
export interface ABCWind {
    enabled: boolean;
    a: number;
    b: number;
    c: number;
    radius: number;
    height: number;
    center: WindPoint;
    pulseHz: number;
}
export declare const defaultABC: () => ABCWind;
export declare function validateABC(o: ABCWind): void;
/** Stylized cylindrical wind field, not a fluid-pressure solver. Y points upward. */
export declare function sampleABC(o: ABCWind, p: WindPoint, seconds: number): WindPoint;
export declare const ABC_PRESETS: Readonly<Record<string, Readonly<{
    a: number;
    b: number;
    c: number;
}>>>;
