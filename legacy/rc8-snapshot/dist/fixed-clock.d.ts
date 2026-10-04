/** Host elapsed time enters here. Network messages must never call advance(). */
export declare const STEP_MS = 50;
export interface ClockAdvance {
    steps: number;
    alpha: number;
    droppedMs: number;
}
export declare class FixedClock {
    private remainderMs;
    private running;
    get pendingMs(): number;
    /** At most four steps per call. Excess elapsed time is discarded, not deferred. */
    advance(elapsedMs: number, step: () => void): ClockAdvance;
    reset(): void;
}
