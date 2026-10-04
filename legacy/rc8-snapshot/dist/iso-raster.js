/** Static orthographic depth buffer; centroid sorting cannot resolve intersecting surfaces. */
export function rasterIso(width, height, faces, project) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > 16777216)
        throw new Error('Invalid raster bounds');
    const bytes = new Uint8ClampedArray(width * height * 4), depth = new Float32Array(width * height);
    depth.fill(-Infinity);
    for (let i = 0; i < bytes.length; i += 4) {
        bytes[i] = 20;
        bytes[i + 1] = 41;
        bytes[i + 2] = 35;
        bytes[i + 3] = 255;
    }
    for (const f of faces) {
        if (f.points.length !== 3 || !/^#[0-9a-f]{6}$/i.test(f.color))
            throw new Error('Invalid raster face');
        const [a, b, c] = f.points.map(p => ({ ...project(p), depth: p.x + p.y + p.z }));
        const denominator = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
        if (Math.abs(denominator) < 1e-8)
            continue;
        const minX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x))), maxX = Math.min(width - 1, Math.ceil(Math.max(a.x, b.x, c.x))), minY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y))), maxY = Math.min(height - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
        const color = Number.parseInt(f.color.slice(1), 16);
        for (let y = minY; y <= maxY; y++)
            for (let x = minX; x <= maxX; x++) {
                const u = ((b.y - c.y) * (x + .5 - c.x) + (c.x - b.x) * (y + .5 - c.y)) / denominator, v = ((c.y - a.y) * (x + .5 - c.x) + (a.x - c.x) * (y + .5 - c.y)) / denominator, w = 1 - u - v;
                if (u < -1e-6 || v < -1e-6 || w < -1e-6)
                    continue;
                const z = u * a.depth + v * b.depth + w * c.depth, n = y * width + x;
                if (z < depth[n])
                    continue;
                depth[n] = z;
                bytes[n * 4] = (color >> 16) & 255;
                bytes[n * 4 + 1] = (color >> 8) & 255;
                bytes[n * 4 + 2] = color & 255;
            }
    }
    return bytes;
}
