import { GameActions } from './game-actions.js';
import { FixedClock, STEP_MS } from './fixed-clock.js';
import { WorldSession } from './session.js';
import { MAX_PLAYERS, WORLD_LIMIT, checkedSnapshot } from './replication.js';
import { checkedPlayerSave } from './persistence.js';
import { XamController, isXamSkill } from './xam.js';
/** In-process authoritative realm. Authentication and sockets belong to its host adapter. */
export class RealmRuntime {
    committed;
    get session() { return this.committed.session; }
    clock = new FixedClock();
    identities = new Map();
    nextIdentity = 1;
    get tickNumber() { return this.committed.tick; }
    advancing = false;
    failed = false;
    pendingXamSkill;
    visibilityRadius;
    constructor(nav, options = {}) {
        const capacity = options.capacity ?? 32;
        this.visibilityRadius = options.visibilityRadius ?? 64;
        if (!Number.isInteger(capacity) || capacity < 1 || capacity > MAX_PLAYERS ||
            !Number.isFinite(this.visibilityRadius) || this.visibilityRadius <= 0 || this.visibilityRadius > 4096)
            throw new RangeError('Invalid realm options');
        const b = nav.options.bounds;
        if (Object.values(b).some(n => Math.abs(n) > WORLD_LIMIT))
            throw new RangeError('World exceeds replication bounds');
        const game = options.beacon ? new GameActions(options.beacon, options.camp) : undefined;
        const xam = options.beacon ? new XamController(nav, options.camp ?? options.beacon, options.beacon) : undefined;
        this.committed = { session: new WorldSession(nav, capacity), game, xam, tick: 0 };
    }
    get tick() { return this.tickNumber; }
    get size() { return this.identities.size; }
    get status() { return this.failed ? 'faulted' : 'active'; }
    requireActive() {
        if (this.failed)
            throw new Error('Realm faulted; replace it before continuing');
    }
    /** Host binds an opaque connection to a server-selected spawn. No client identity field. */
    join(connectionId, spawn, saved) {
        this.requireActive();
        if (typeof connectionId !== 'string' || !connectionId || connectionId.length > 128 || !Number.isSafeInteger(this.nextIdentity))
            throw new Error('Invalid connection');
        const restored = saved ? checkedPlayerSave(saved) : undefined;
        if (restored && (restored.position.x !== spawn.x || restored.position.z !== spawn.z))
            throw new Error('Saved spawn mismatch');
        const state = this.session.join(connectionId, spawn);
        if (Math.abs(state.position.y) > WORLD_LIMIT) {
            this.session.leave(connectionId);
            throw new RangeError('Spawn height exceeds replication bounds');
        }
        const id = `p${this.nextIdentity++}`;
        try {
            this.committed.game?.join(connectionId, id, restored?.gameplay ?? undefined);
        }
        catch (error) {
            this.session.leave(connectionId);
            throw error;
        }
        this.identities.set(connectionId, id);
        return { id, state };
    }
    receive(connectionId, packet) {
        if (this.failed || typeof packet !== 'string' || packet.length > 256 || new TextEncoder().encode(packet).length > 256)
            return false;
        try {
            if (JSON.parse(packet)?.kind === 'action')
                return this.committed.game?.receive(connectionId, packet) ?? false;
        }
        catch { }
        return this.session.receive(connectionId, packet);
    }
    leave(connectionId) {
        this.identities.delete(connectionId);
        this.committed.game?.leave(connectionId);
        return this.session.leave(connectionId);
    }
    stateFor(connectionId) { this.requireActive(); return this.session.snapshot(connectionId); }
    exportPlayer(connectionId) {
        this.requireActive();
        const movement = this.session.snapshot(connectionId);
        if (!movement)
            return;
        const gameplay = this.committed.game?.persistentState(connectionId) ?? null;
        return checkedPlayerSave({ version: 1, position: { x: movement.position.x, z: movement.position.z }, gameplay });
    }
    /** Called by the host's monotonic timer, never by packet handlers. Hook supports local bots/preview. */
    advance(elapsedMs, beforeTick) {
        this.requireActive();
        // Caller mistakes do not damage simulation state and do not fault the realm.
        if (!Number.isFinite(elapsedMs) || elapsedMs < 0)
            throw new RangeError('Invalid elapsed time');
        if (this.advancing)
            throw new Error('Realm cannot be advanced recursively');
        this.advancing = true;
        try {
            return this.clock.advance(elapsedMs, () => {
                if (this.tickNumber >= Math.floor(Number.MAX_SAFE_INTEGER / STEP_MS))
                    throw new Error('Realm clock exhausted');
                beforeTick?.();
                const session = this.session.stagedTick();
                const game = this.committed.game?.stagedCommit(c => session.snapshot(c)?.position);
                const tick = this.tickNumber + 1;
                const xam = this.committed.xam?.stagedAdvance(tick, this.pendingXamSkill);
                const players = [...this.identities].map(([connection, id]) => {
                    const state = session.snapshot(connection);
                    if (!state)
                        throw new Error('Missing candidate player');
                    return { id, position: state.position, lastInputSequence: state.lastInputSequence, blocked: state.blocked };
                });
                checkedSnapshot({ version: 1, tick, simulationTimeMs: tick * STEP_MS, players });
                game?.validate(players.map(p => p.id));
                if (game && game.inspection().tick !== tick)
                    throw new Error('Gameplay clock mismatch');
                // One logical commit: movement, gameplay outcomes and tick become visible together.
                this.committed = { session, game, xam, tick };
                this.pendingXamSkill = undefined;
            });
        }
        catch (error) {
            // Candidate player states were discarded. Trusted hook side effects are outside this transaction.
            this.failed = true;
            throw error;
        }
        finally {
            this.advancing = false;
        }
    }
    gameStateFor(connectionId) {
        this.requireActive();
        const snapshot = this.snapshotFor(connectionId);
        if (!snapshot)
            return undefined;
        const state = this.committed.game?.snapshot(connectionId, snapshot.players.map(p => p.id));
        return state ? { ...state, xam: this.committed.xam?.snapshot() ?? null } : undefined;
    }
    /** Detached last-good diagnostics. No connection identifiers or live mutable objects. */
    inspection() { return { tick: this.tickNumber, pendingMs: this.clock.pendingMs, nextIdentity: this.nextIdentity, players: [...this.identities].map(([connection, id]) => ({ id, ...this.session.inspection(connection) })).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0), game: this.committed.game?.inspection() ?? null, xam: this.committed.xam?.inspection(this.tickNumber) ?? null }; }
    /** Server-side tool hook only. No network packet maps to this method. */
    requestXamSkill(skill) { this.requireActive(); if (!this.committed.xam || !isXamSkill(skill))
        return false; this.pendingXamSkill = skill; return true; }
    get xamHealth() { return this.committed.xam?.health(this.tickNumber) ?? null; }
    get xamState() { return this.committed.xam?.snapshot() ?? null; }
    /** Preview resume discards a fractional tick; a production host normally keeps running. */
    resetClock() { this.requireActive(); this.clock.reset(); }
    snapshotFor(connectionId) {
        this.requireActive();
        const origin = this.session.snapshot(connectionId);
        if (!origin)
            return undefined;
        const players = [];
        for (const [connection, id] of this.identities) {
            const state = this.session.snapshot(connection);
            if (Math.hypot(state.position.x - origin.position.x, state.position.z - origin.position.z) <= this.visibilityRadius) {
                players.push({ id, position: state.position, lastInputSequence: state.lastInputSequence, blocked: state.blocked });
            }
        }
        return checkedSnapshot({ version: 1, tick: this.tickNumber, simulationTimeMs: this.tickNumber * STEP_MS, players });
    }
}
