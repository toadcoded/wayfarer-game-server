/** Cosmetic twenty-minute cycle, starting at midnight. No gameplay clock mutation. */
export declare function daylightAt(timeMs: number): {
    phase: number;
    day: number;
    night: number;
};
