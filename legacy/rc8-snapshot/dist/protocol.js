import { generateChunk, validateConfig, validateChunkCoord, CHUNK_SIZE } from './world.js';
const MAX_MESSAGE_BYTES = 1024;
function object(v) {
    if (typeof v !== 'object' || v === null || Array.isArray(v))
        throw new Error('Expected object');
    return v;
}
function keys(v, names) {
    if (Object.keys(v).length !== names.length || !names.every(n => Object.hasOwn(v, n)))
        throw new Error('Unexpected or missing fields');
}
function num(v) { if (typeof v !== 'number' || !Number.isFinite(v))
    throw new Error('Expected finite number'); return v; }
function config(v) {
    const o = object(v);
    keys(o, ['seed', 'generatorVersion']);
    if (o.generatorVersion !== 1)
        throw new Error('Unsupported generator version');
    const c = { seed: num(o.seed), generatorVersion: 1 };
    validateConfig(c);
    return c;
}
export function decodeMessage(text) {
    if (typeof text !== 'string' || text.length > MAX_MESSAGE_BYTES || new TextEncoder().encode(text).length > MAX_MESSAGE_BYTES)
        throw new Error('Message too large or not text');
    const o = object(JSON.parse(text));
    if (o.schema !== 1)
        throw new Error('Unsupported schema');
    if (o.type === 'world.manifest') {
        keys(o, ['schema', 'type', 'config']);
        return { schema: 1, type: o.type, config: config(o.config) };
    }
    if (o.type !== 'world.request' && o.type !== 'world.chunk')
        throw new Error('Unsupported message type');
    keys(o, o.type === 'world.request' ? ['schema', 'type', 'cx', 'cz'] : ['schema', 'type', 'config', 'cx', 'cz', 'serverTimeMs']);
    const cx = num(o.cx), cz = num(o.cz);
    validateChunkCoord(cx);
    validateChunkCoord(cz);
    if (o.type === 'world.request')
        return { schema: 1, type: o.type, cx, cz };
    const serverTimeMs = num(o.serverTimeMs);
    if (!Number.isSafeInteger(serverTimeMs) || serverTimeMs < 0)
        throw new Error('Invalid server time');
    return { schema: 1, type: o.type, config: config(o.config), cx, cz, serverTimeMs };
}
export function encodeMessage(message) {
    const text = JSON.stringify(message);
    decodeMessage(text);
    return text;
}
/** Host supplies authenticated, server-owned position. Never use position from request JSON. */
export function answerChunkRequest(text, world, player, serverTimeMs) {
    validateConfig(world);
    const m = decodeMessage(text);
    if (m.type !== 'world.request')
        throw new Error('Expected chunk request');
    if (!Number.isFinite(player.x) || !Number.isFinite(player.z))
        throw new Error('Invalid trusted player position');
    const cx = Math.floor(player.x / CHUNK_SIZE), cz = Math.floor(player.z / CHUNK_SIZE);
    if (Math.abs(m.cx - cx) > 2 || Math.abs(m.cz - cz) > 2)
        throw new Error('Chunk outside player interest area');
    return encodeMessage({ schema: 1, type: 'world.chunk', config: world, cx: m.cx, cz: m.cz, serverTimeMs });
}
/** Client accepts recipes only for its negotiated world; geometry stays reproducible. */
export function chunkFromMessage(text, expected) {
    validateConfig(expected);
    const m = decodeMessage(text);
    if (m.type !== 'world.chunk')
        throw new Error('Expected chunk recipe');
    if (m.config.seed !== expected.seed || m.config.generatorVersion !== expected.generatorVersion)
        throw new Error('World mismatch');
    return generateChunk(expected, m.cx, m.cz);
}
