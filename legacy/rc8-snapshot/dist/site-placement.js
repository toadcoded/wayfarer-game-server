function near(b, x, z, r) {
    return x >= b.minX - r && x <= b.maxX + r && z >= b.minZ - r && z <= b.maxZ + r;
}
/** New site overlay only: preserve the generator, stable IDs and source chunk object. */
export function reserveSites(chunk, plans) {
    const boxes = plans.flatMap(p => [...p.earthworkBounds, ...p.surfaces.map(s => s.bounds)]);
    return { ...chunk,
        props: chunk.props.filter(p => !boxes.some(b => near(b, p.position.x, p.position.z, 4))),
        landmarks: chunk.landmarks.filter(l => !boxes.some(b => near(b, l.position.x, l.position.z, l.radius))),
    };
}
