/** Host elapsed time enters here. Network messages must never call advance(). */
export const STEP_MS = 50;
export class FixedClock {
    remainderMs = 0;
    running = false;
    get pendingMs() { return this.remainderMs; }
    /** At most four steps per call. Excess elapsed time is discarded, not deferred. */
    advance(elapsedMs, step) {
        if (!Number.isFinite(elapsedMs) || elapsedMs < 0)
            throw new RangeError('Invalid elapsed time');
        if (this.running)
            throw new Error('Clock cannot be advanced recursively');
        const accepted = Math.min(elapsedMs, STEP_MS * 4);
        this.remainderMs += accepted;
        let steps = 0;
        this.running = true;
        try {
            while (this.remainderMs >= STEP_MS && steps < 4) {
                // Consume before dispatch: a failed callback is never silently replayed.
                this.remainderMs -= STEP_MS;
                steps++;
                step();
            }
        }
        finally {
            this.running = false;
        }
        return { steps, alpha: this.remainderMs / STEP_MS, droppedMs: elapsedMs - accepted };
    }
    reset() {
        if (this.running)
            throw new Error('Cannot reset during a step');
        this.remainderMs = 0;
    }
}
