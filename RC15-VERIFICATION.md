# Fresh rc.15 verification — 2026-10-04 UTC

Strict TypeScript and all four browser bundles passed. **245 Node tests passed**, zero failures/skips. Fresh Python tests: **2 passed**. Sprite asset catalog: **8 validated**; procedural wildlife meshes are covered by separate geometry/lifecycle tests.

New tests cover authored wildlife pools for all ten biomes, deterministic budgeted chunk placement, dry candidate ground, catalog immutability, bounded/reduced-motion poses, the playable realm population, all fourteen non-pickable/non-colliding rigs, invalid descriptors, stable mesh counts across hundreds of updates, streaming removal, full disposal and holding the last dry position. The atlas's actual UI module is tested for all named regions with its new non-attackable/no-loot text.

The current causeway population was enumerated from the actual construction terrain and contains every visual entry: bunny, rabbit, squirrel, fox, bird, pigeon, otter, ferret, groundhog, mole, shrew, mouse, hedgehog and duck. These are cosmetic NPCs, never fighters or player state.

Fresh WebSocket scripts rerun gathering, actual walking/banking, restart restoration, quest replay and maul combat/Strength-only training. The 740-event skilling replay retains hash `a3d7561390ce7b4d39f04cc49640e056093c3630a2a428d757468c23063843f1`; restart and combat recordings also complete. Evidence is under verification/rc15-*; previous rc evidence remains historical.

Authority is unchanged: 20 Hz, simulation revision 10, gameplay-save schema 3. No wildlife gameplay save, loot, hitpoints or target selection was introduced. Atlas placement surfaces do not make other regions playable multiplayer destinations.

Babylon testing uses NullEngine. GPU/device appearance, physical frame time, bird flight, climbing, swimming, burrowing and obstacle-aware wildlife navigation remain open refinements. PGlite worker/browser and production persistence gates remain as documented previously.

Packaging verifies ZIP CRC and every manifest hash. The ZIP's own hash is emitted externally.
