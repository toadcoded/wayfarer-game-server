/** Screen-space intent transformed into the current camera plane, normalized. */
export declare function cameraDirection(right: number, forward: number, alpha: number): {
    dx: number;
    dz: number;
};
export declare function dampAngle(current: number, target: number, dt: number): number;
