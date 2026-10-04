import { STEP_MS } from './fixed-clock.js';
export const MAX_SNAPSHOT_BYTES = 131072;
export const MAX_PLAYERS = 256;
export const WORLD_LIMIT = 1_000_000;
function record(value, keys) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error('Expected object');
    const r = value;
    if (Object.keys(r).length !== keys.length || !keys.every(k => Object.hasOwn(r, k)))
        throw new Error('Unexpected fields');
    return r;
}
function integer(value, minimum = 0) {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum)
        throw new Error('Invalid integer');
    return value;
}
function coordinate(value) {
    if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > WORLD_LIMIT)
        throw new Error('Invalid coordinate');
    return value;
}
export function checkedSnapshot(value) {
    const r = record(value, ['version', 'tick', 'simulationTimeMs', 'players']);
    const tick = integer(r.tick), simulationTimeMs = integer(r.simulationTimeMs);
    if (r.version !== 1 || simulationTimeMs !== tick * STEP_MS)
        throw new Error('Snapshot version or clock mismatch');
    if (!Array.isArray(r.players) || r.players.length > MAX_PLAYERS)
        throw new Error('Invalid player count');
    const ids = new Set();
    const players = r.players.map((value) => {
        const p = record(value, ['id', 'position', 'lastInputSequence', 'blocked']);
        if (typeof p.id !== 'string' || !/^p[1-9][0-9]{0,15}$/.test(p.id) || ids.has(p.id))
            throw new Error('Invalid or duplicate player id');
        ids.add(p.id);
        const position = record(p.position, ['x', 'y', 'z']);
        if (typeof p.blocked !== 'boolean')
            throw new Error('Invalid blocked flag');
        return {
            id: p.id,
            position: { x: coordinate(position.x), y: coordinate(position.y), z: coordinate(position.z) },
            lastInputSequence: integer(p.lastInputSequence, -1), blocked: p.blocked,
        };
    });
    return { version: 1, tick, simulationTimeMs, players };
}
export function decodeRealmSnapshot(text) {
    if (typeof text !== 'string' || text.length > MAX_SNAPSHOT_BYTES || new TextEncoder().encode(text).length > MAX_SNAPSHOT_BYTES)
        throw new Error('Snapshot exceeds byte budget');
    return checkedSnapshot(JSON.parse(text));
}
export function encodeRealmSnapshot(snapshot) {
    const text = JSON.stringify(checkedSnapshot(snapshot));
    if (new TextEncoder().encode(text).length > MAX_SNAPSHOT_BYTES)
        throw new Error('Snapshot exceeds byte budget');
    return text;
}
