# Fresh rc.14 verification — 2026-10-04 UTC

Strict TypeScript, Babylon bundles and PGlite worker/plugin bundles passed. All **241 Node tests passed**, with zero failures or skips. Python tests: **2 passed**. Asset catalog: **8 validated**; procedural prop geometry is tested separately from that sprite catalog.

New checks cover all eleven deterministic detail kinds and unique seeded placement, all ambient event types across the schedule, pause suppression, hundreds of finite animation updates with constant mesh count, stationary mesh batching, complete node/material disposal, character blinks and gestures, reduced-motion neutralization and exact heartbeat age thresholds. The existing real-socket/stub-DOM client test also checks the live heartbeat and hidden-page resting display.

Fresh live transport recordings rerun actual collision-world walking, twelve gathers, banking, failed crafting without material spend and durable reopen. The 740-event skilling replay completes with unchanged hash `a3d7561390ce7b4d39f04cc49640e056093c3630a2a428d757468c23063843f1`; the reopened profile replay completes with hash `88f6305e318eb0cbf7c08dc4ddc14df8e4284254d1571d55e6cf01398ccd930d`. Quest replay and earned-maul transport/profile checks also passed. Logs and recordings are retained under `verification/rc14-*`.

The user-linked rc.13 ZIP was downloaded: 16,272,266 bytes, SHA-256 `1b3800697e215c2c215cb39e178a1a43732db1f5cce0b69d954ae0d3a43917b7`, CRC passed. That verified baseline was extended; the linked file was not overwritten.

Simulation revision 10, gameplay-save schema 3 and authoritative 20 Hz behavior are unchanged. Ambient decoration, local NPC gestures and event timing have no gameplay authority. PGlite remains a local visual-quality preference store.

Tests use Babylon NullEngine, not physical GPUs. Real device appearance, retro styling taste, accessibility of the final mobile layout, browser worker/IndexedDB behavior and sustained performance remain unverified. The host-health button uses the existing rehearsal endpoint; this is not a production launch certification. The wider atlas is not populated by this two-landing detail pass.

The packaging script verifies ZIP CRC and all per-file hashes. Its externally emitted ZIP hash can be checked against the downloadable archive.
