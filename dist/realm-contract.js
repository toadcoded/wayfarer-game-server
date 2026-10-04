/** Private rehearsal subprotocol; application compatibility is checked before any realm join. */
export const REALM_SUBPROTOCOL = 'wayfarer.realm.v2';
export const REALM_CONTRACT = Object.freeze({
    protocolVersion: 2, simulationRevision: 15, worldSeed: 20260928, generatorVersion: 1, sceneRevision: 2,
    coordinateSystem: 'xz-y-up-metres', tickMs: 50, snapshotVersion: 1,
});
export class CompatibilityError extends Error {
    code;
    constructor(code) {
        super(code);
        this.code = code;
    }
}
function object(value, keys) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new CompatibilityError('invalid_handshake');
    const r = value;
    if (Object.keys(r).length !== keys.length || !keys.every(k => Object.hasOwn(r, k)))
        throw new CompatibilityError('invalid_handshake');
    return r;
}
function parse(text) {
    if (typeof text !== 'string' || text.length > 512 || new TextEncoder().encode(text).length > 512)
        throw new CompatibilityError('invalid_handshake');
    try {
        return JSON.parse(text);
    }
    catch {
        throw new CompatibilityError('invalid_handshake');
    }
}
function contract(value) {
    const expected = REALM_CONTRACT, r = object(value, Object.keys(expected));
    if (!Object.entries(expected).every(([k, v]) => r[k] === v))
        throw new CompatibilityError('incompatible_contract');
    return { ...expected };
}
export function encodeHello() { return JSON.stringify({ kind: 'hello', contract: REALM_CONTRACT }); }
export function decodeHello(text) {
    const r = object(parse(text), ['kind', 'contract']);
    if (r.kind !== 'hello')
        throw new CompatibilityError('invalid_handshake');
    return contract(r.contract);
}
export function encodeWelcome(id) {
    if (!/^p[1-9][0-9]{0,15}$/.test(id))
        throw new CompatibilityError('invalid_handshake');
    return JSON.stringify({ kind: 'welcome', id, contract: REALM_CONTRACT });
}
export function decodeWelcome(text) {
    const r = object(parse(text), ['kind', 'id', 'contract']);
    if (r.kind !== 'welcome' || typeof r.id !== 'string' || !/^p[1-9][0-9]{0,15}$/.test(r.id))
        throw new CompatibilityError('invalid_handshake');
    return { id: r.id, contract: contract(r.contract) };
}
export function compatibilityMessage(reason) {
    switch (reason) {
        case 'incompatible_contract': return 'Client and server use different world or protocol versions. Reload the matching release.';
        case 'invalid_handshake': return 'Connection rejected: the compatibility handshake was invalid.';
        case 'handshake_timeout': return 'Compatibility handshake timed out. Try joining again.';
        default: return 'Disconnected. Join again to start at the landing.';
    }
}
