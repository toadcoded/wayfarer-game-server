import { checkedPersistentPlayerState } from './game-actions.js';
const MAX_SAVE_BYTES = 8192;
function object(value, keys) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error('Invalid player save');
    const r = value;
    if (Object.keys(r).length !== keys.length || !keys.every(k => Object.hasOwn(r, k)))
        throw new Error('Invalid player save fields');
    return r;
}
function coord(value) {
    if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 1_000_000)
        throw new Error('Invalid saved coordinate');
    return value;
}
export function checkedPlayerSave(value) {
    const r = object(value, ['version', 'position', 'gameplay']);
    if (r.version !== 1)
        throw new Error('Unsupported player save version');
    const p = object(r.position, ['x', 'z']);
    const gameplay = r.gameplay === null ? null : checkedPersistentPlayerState(r.gameplay);
    return { version: 1, position: { x: coord(p.x), z: coord(p.z) }, gameplay };
}
export function encodePlayerSave(value) {
    const text = JSON.stringify(checkedPlayerSave(value));
    if (new TextEncoder().encode(text).length > MAX_SAVE_BYTES)
        throw new Error('Player save exceeds byte budget');
    return text;
}
export function decodePlayerSave(text) {
    if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_SAVE_BYTES)
        throw new Error('Player save exceeds byte budget');
    return checkedPlayerSave(JSON.parse(text));
}
export function copyPlayerSave(value) {
    return decodePlayerSave(encodePlayerSave(value));
}
