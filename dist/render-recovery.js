/** One renderer owner; stale/closed loads are released and frame faults permit retry. */
export class RenderRecovery {
    renderer;
    pending;
    epoch = 0;
    closed = false;
    mode = 'fallback';
    get current() { return this.renderer; }
    get state() { return this.mode; }
    release(value) { try {
        value?.dispose();
    }
    catch { /* Cleanup failure cannot prevent fallback. */ } }
    load(factory) { if (this.closed)
        return Promise.resolve(undefined); if (this.renderer)
        return Promise.resolve(this.renderer); if (this.pending)
        return this.pending; const epoch = ++this.epoch; this.mode = 'loading'; const pending = Promise.resolve().then(factory).then(value => { if (this.closed || epoch !== this.epoch) {
        this.release(value);
        return undefined;
    } this.renderer = value; this.mode = 'ready'; return value; }).catch(() => { if (!this.closed && epoch === this.epoch)
        this.mode = 'fallback'; return undefined; }).finally(() => { if (this.pending === pending)
        this.pending = undefined; }); this.pending = pending; return pending; }
    run(update) { if (!this.renderer)
        return false; try {
        update(this.renderer);
        return true;
    }
    catch {
        const old = this.renderer;
        this.renderer = undefined;
        this.mode = 'fallback';
        this.release(old);
        return false;
    } }
    close() { if (this.closed)
        return; this.closed = true; this.epoch++; this.mode = 'closed'; const old = this.renderer; this.renderer = undefined; this.release(old); }
}
