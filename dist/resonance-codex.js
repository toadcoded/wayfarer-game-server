export const RESONANCE_NODES = [
    { id: 'cinder', rune: 'CI', name: 'Cinder', note: 'C', family: 'ember', color: '#ef5350', toneHz: 261.63, value: 174 },
    { id: 'flare', rune: 'FL', name: 'Flare', note: 'C♯', family: 'ember', color: '#ff8f32', toneHz: 277.18, value: 285 },
    { id: 'sunward', rune: 'SU', name: 'Sunward', note: 'D', family: 'solar', color: '#ffd93d', toneHz: 293.66, value: 369 },
    { id: 'verdant', rune: 'VE', name: 'Verdant', note: 'D♯', family: 'grove', color: '#38c96b', toneHz: 311.13, value: 396 },
    { id: 'bloom', rune: 'BL', name: 'Bloom', note: 'E', family: 'grove', color: '#15a65b', toneHz: 329.63, value: 258 },
    { id: 'tide', rune: 'TI', name: 'Tide', note: 'F', family: 'tide', color: '#2cb7c9', toneHz: 349.23, value: 417 },
    { id: 'skyglass', rune: 'SK', name: 'Skyglass', note: 'F♯', family: 'tide', color: '#338ee8', toneHz: 369.99, value: 147 },
    { id: 'dusk', rune: 'DU', name: 'Dusk', note: 'G', family: 'astral', color: '#5f62d8', toneHz: 392.00, value: 528 },
    { id: 'violet', rune: 'VI', name: 'Violet', note: 'G♯', family: 'astral', color: '#8e49d6', toneHz: 415.30, value: 582 },
    { id: 'moon', rune: 'MO', name: 'Moon', note: 'A', family: 'lunar', color: '#b05bd7', toneHz: 440.00, value: 963 },
    { id: 'rose', rune: 'RO', name: 'Rose', note: 'A♯', family: 'lunar', color: '#d95388', toneHz: 466.16, value: 693 },
    { id: 'lantern', rune: 'LA', name: 'Lantern', note: 'B', family: 'solar', color: '#ff6868', toneHz: 493.88, value: 714 }
];
export const RESONANCE_EFFECTS = [
    { id: 'lantern-bloom', name: 'Lantern Bloom', description: 'Attunes your next successful Woodcutting practice for one bonus resource and bonus XP.', durationMs: 8000 },
    { id: 'pathfinders-gleam', name: "Pathfinder's Gleam", description: 'Attunes your next completed Agility practice for bonus XP while the observatory traces your route.', durationMs: 6000 },
    { id: 'miners-echo', name: "Miner's Echo", description: 'Attunes your next successful Mining practice for one bonus resource and bonus XP.', durationMs: 7000 },
    { id: 'tide-whisper', name: 'Tide Whisper', description: 'Attunes your next successful Fishing practice for one bonus resource and bonus XP.', durationMs: 7000 },
    { id: 'ward-glimmer', name: 'Ward Glimmer', description: 'Empowers your next successful guard with bonus Defence XP before the attunement is consumed.', durationMs: 6000 },
    { id: 'starlight-trace', name: 'Starlight Trace', description: 'Attunes your next completed Magic practice for bonus XP while the PolyCodex draws an astral trace.', durationMs: 9000 }
];
export const RESONANCE_COOLDOWN_MS = 8000;
const nodeMap = new Map(RESONANCE_NODES.map(n => [n.id, n]));
export const isResonanceNodeId = (value) => typeof value === 'string' && nodeMap.has(value);
export const resonanceNode = (id) => nodeMap.get(id);
function hash32(text) { let h = 2166136261 >>> 0; for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
} return h >>> 0; }
export function checkedResonanceSelection(ids) {
    if (!Array.isArray(ids) || ids.length > 3)
        throw new RangeError('Resonance selection must contain at most three nodes');
    const out = [];
    for (const value of ids) {
        if (!isResonanceNodeId(value))
            throw new Error('Unknown resonance node');
        if (out.includes(value))
            throw new Error('Duplicate resonance node');
        out.push(value);
    }
    return out;
}
export function resolveResonanceChord(ids) {
    const selected = checkedResonanceSelection(ids);
    if (selected.length !== 3)
        throw new RangeError('A resonance chord requires exactly three nodes');
    const sorted = [...selected].sort((a, b) => RESONANCE_NODES.findIndex(n => n.id === a) - RESONANCE_NODES.findIndex(n => n.id === b));
    const key = sorted.join('+'), signature = hash32(key), effect = RESONANCE_EFFECTS[signature % RESONANCE_EFFECTS.length];
    const names = sorted.map(id => resonanceNode(id).name);
    return { key, nodes: sorted, name: `${names[0]} · ${names[1]} · ${names[2]}`, effect, signature };
}
export function resonanceCooldownRemaining(now, readyAt) { if (!Number.isFinite(now) || !Number.isFinite(readyAt))
    throw new RangeError('Invalid resonance time'); return Math.max(0, Math.ceil(readyAt - now)); }
export const resonanceEffect = (id) => { const effect = RESONANCE_EFFECTS.find(effect => effect.id === id); if (!effect)
    throw new Error('Unknown resonance effect'); return effect; };
export const isResonanceEffectId = (value) => typeof value === 'string' && RESONANCE_EFFECTS.some(effect => effect.id === value);
export function encodeResonanceCast(ids) { return resolveResonanceChord(ids).key; }
export function decodeResonanceCast(value) { if (typeof value !== 'string' || value.length > 96 || !/^[a-z-]+\+[a-z-]+\+[a-z-]+$/.test(value))
    throw new Error('Invalid resonance cast'); return resolveResonanceChord(value.split('+')); }
export const isResonanceCast = (value) => { try {
    decodeResonanceCast(value);
    return true;
}
catch {
    return false;
} };
