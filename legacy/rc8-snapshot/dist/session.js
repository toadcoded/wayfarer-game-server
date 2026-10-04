import { ServerWalker } from './movement.js';
/** Transport-neutral authority. Host binds connection identity; packets cannot select another player. */
export class WorldSession {
    nav;
    capacity;
    players = new Map();
    failed = false;
    get status() { return this.failed ? 'faulted' : 'active'; }
    requireActive() { if (this.failed)
        throw new Error('Session faulted; replace it before continuing'); }
    constructor(nav, capacity = 32) {
        this.nav = nav;
        this.capacity = capacity;
        if (!Number.isInteger(capacity) || capacity < 1 || capacity > 256)
            throw new Error('Invalid capacity');
    }
    join(connectionId, spawn) {
        this.requireActive();
        if (!connectionId || connectionId.length > 128 || this.players.has(connectionId) || this.players.size >= this.capacity)
            throw new Error('Join rejected');
        const walker = new ServerWalker(this.nav, spawn);
        this.players.set(connectionId, { walker, packets: 0 });
        return walker.snapshot();
    }
    receive(connectionId, message) {
        if (this.failed)
            return false;
        const player = this.players.get(connectionId);
        if (!player || player.packets >= 8)
            return false;
        player.packets++;
        try {
            return player.walker.receiveInput(message);
        }
        catch {
            return false;
        }
    }
    /** Compute a detached next session. No mutation of this session, even on failure. */
    stagedTick() {
        this.requireActive();
        const candidate = new WorldSession(this.nav, this.capacity);
        for (const [id, p] of this.players)
            candidate.players.set(id, { walker: p.walker.stagedAdvance(), packets: 0 });
        return candidate;
    }
    /** Standalone session API retains fail-stop behavior. RealmRuntime uses stagedTick(). */
    tick() {
        this.requireActive();
        try {
            const candidate = this.stagedTick();
            this.players = candidate.players;
            return this.committedState();
        }
        catch (error) {
            this.failed = true;
            throw error;
        }
    }
    inspection(connectionId) { return this.players.get(connectionId)?.walker.inspection(); }
    /** Detached last-good state for fault diagnostics; never used to resume a faulted session. */
    committedState() { return new Map([...this.players].map(([id, p]) => [id, p.walker.snapshot()])); }
    leave(connectionId) { return this.players.delete(connectionId); }
    snapshot(connectionId) { this.requireActive(); return this.players.get(connectionId)?.walker.snapshot(); }
}
