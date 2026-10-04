# rc.24 fresh verification · 2026-10-04

Strict TypeScript compilation and browser bundles succeeded. Complete suite: **288 passed, 0 failed, 0 skipped** (verification/rc24-tests.log).

New checks verify that the framed painting contains six non-pickable/noncolliding meshes, disposes all owned materials and geometry, and that the actual realm host serves the original JPEG with image/jpeg MIME type and byte-for-byte equality. The illustration retains its original 1122 × 1402 aspect ratio and bytes. The wall stands 1.6 metres behind Tovik, outside the central walking lane. It is decorative and introduces no collision or server actions.

All existing NPC, gameplay, identity, persistence and client tests remain passing. Previous rc.23 network replay evidence is historical and was not regenerated for this artwork-only change. Browser and phone visual review remains open; NullEngine checks do not verify GPU image appearance. In the 2D fallback this new 3D painting is not drawn.

Packaging performs ZIP CRC and per-file SHA-256 verification and is repeated to establish reproducibility.
