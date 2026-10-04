export function parseAssetCatalog(value) {
    if (!Array.isArray(value) || !value.length || value.length > 16)
        throw new Error('Invalid asset catalog');
    const ids = new Set();
    return value.map((v) => {
        if (!v || typeof v !== 'object' || Array.isArray(v))
            throw new Error('Invalid asset record');
        const a = v;
        const integer = (n, min, max) => typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max;
        if (Object.keys(a).sort().join() !== 'crop,durationsMs,frames,height,id,role,source,width' || typeof a.id !== 'string' || !/^\w[\w-]{0,31}$/.test(a.id) || !/^[a-z][a-z0-9-]*$/.test(a.id) || ids.has(a.id) || !integer(a.width, 1, 1024) || !integer(a.height, 1, 1024) || !integer(a.frames, 1, 32) || a.width * a.height * a.frames > 8388608 || !Array.isArray(a.durationsMs) || a.durationsMs.length !== a.frames || !a.durationsMs.every(d => integer(d, 1, 10000)) || typeof a.source !== 'string' || typeof a.role !== 'string' || !['selectable cosmetic', 'reference only'].includes(a.role))
            throw new Error('Invalid asset fields');
        if (!a.crop || typeof a.crop !== 'object' || Array.isArray(a.crop))
            throw new Error('Invalid crop');
        const c = a.crop;
        if (Object.keys(c).sort().join() !== 'height,width,x,y' || !integer(c.x, 0, a.width - 1) || !integer(c.y, 0, a.height - 1) || !integer(c.width, 1, a.width) || !integer(c.height, 1, a.height) || c.x + c.width > a.width || c.y + c.height > a.height)
            throw new Error('Invalid crop bounds');
        ids.add(a.id);
        return { id: a.id, width: a.width, height: a.height, frames: a.frames, durationsMs: [...a.durationsMs], source: a.source, role: a.role, crop: { x: c.x, y: c.y, width: c.width, height: c.height } };
    });
}
