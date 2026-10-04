import { Mesh, VertexData, StandardMaterial, Color3 } from '@babylonjs/core';
/** Real Babylon mesh adapter; caller owns scene, returned handle owns mesh/material. */
export function mountBabylonMesh(scene, id, data, updatable = false) {
    if (!data.positions.length || data.positions.length % 3 || !data.indices.length || data.indices.length % 3 || data.positions.length > 300000 || data.indices.length > 600000 ||
        !Array.from(data.positions).every(Number.isFinite) || !Array.from(data.indices).every(i => Number.isInteger(i) && i >= 0 && i < data.positions.length / 3) || !/^#[0-9a-f]{6}$/i.test(data.color))
        throw new Error('Invalid mesh data');
    const mesh = new Mesh(id, scene), material = new StandardMaterial(id + ':material', scene);
    try {
        material.diffuseColor = Color3.FromHexString(data.color);
        material.backFaceCulling = false;
        mesh.material = material;
        const vertices = new VertexData();
        vertices.positions = Array.from(data.positions);
        vertices.indices = Array.from(data.indices);
        const normals = [];
        VertexData.ComputeNormals(vertices.positions, vertices.indices, normals, { useRightHandedSystem: scene.useRightHandedSystem });
        vertices.normals = normals;
        vertices.applyToMesh(mesh, updatable);
        let disposed = false;
        return { mesh, update(positions) { if (disposed || !updatable || positions.length !== data.positions.length || !Array.from(positions).every(Number.isFinite))
                throw new Error('Invalid mesh update'); const normal = []; VertexData.ComputeNormals(positions, data.indices, normal, { useRightHandedSystem: scene.useRightHandedSystem }); mesh.updateVerticesData('position', positions, true); mesh.updateVerticesData('normal', normal); }, dispose() { if (!disposed) {
                disposed = true;
                mesh.dispose();
                material.dispose();
            } } };
    }
    catch (error) {
        mesh.dispose();
        material.dispose();
        throw error;
    }
}
