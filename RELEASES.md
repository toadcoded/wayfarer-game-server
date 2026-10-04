## v1.0.0 — 2026-10-04

Persistent single-realm server release: SQLite guest/Xam saves, HTTPS deployment stack, exclusive authority lease, public request safeguards, process recovery tests, backup/migration tools and deployment runbook. See README.md and V1-VERIFICATION.md for current evidence and limits.

## Current candidate: 0.8.0-rc.5

This is preparation for the single public v0.8 release. It is not v0.8.2. Final v0.8 remains untagged; the following public release is v0.9. See PROVENANCE.md for the archive chain and V0.8-READINESS.md for open gates.

# Current: v0.8 consolidation candidate

The v0.8 final release is not yet tagged. See README.md and V0.8-READINESS.md. The historical records below are retained as evidence, not rewritten history.

# Wayfarer artifact lineage

These versions describe different kinds of deliverables. They are not all integrated game releases. Original ZIPs remain unchanged. This inventory does not invent missing Git tags or a missing source tree.

| Version | Kind | Evidence and relationship |
|---|---|---|
| 0.1 | World module | Supplied wayfarer-world-typescript.zip declares 0.1.0 |
| 0.2 | Walking expansion | Supplied typescript2 and typescript3 archives are byte-identical, both declare 0.2.0 |
| 0.3 | Construction expansion | Functionality inherited through 0.4; supplied typescript3 filename is not proof of a distinct 0.3 archive |
| 0.4 | Executable scaffold | Supplied wayfarer-v0.4(1).zip is the extraction baseline for the rebuilt runtime |
| 0.5 | Preparation | Isolated references and integration guidance, not an integrated runtime |
| 0.6 | Preparation | Documents and patch references, not an integrated runtime |
| 0.7 research/handoff | Design/recovery | Original claimed working tree was unavailable; historical claims remain separate |
| 0.7 runtime | Rebuilt executable | Fixed-clock realm subset; 70-test verification recorded in retained audit output |
| 0.7.1 runtime | Stabilization | Fail-stop fault handling layered on rebuilt 0.7; 76 passing tests |
| 0.7.2 runtime | Local transport rehearsal | Real WebSocket adapter, shared crossing scene and browser-client wiring; 87 passing tests |
| 0.7.3 runtime | Compatibility contract | Required subprotocol and pre-join world handshake; 96 passing tests |
| 0.7.4 runtime | Movement presentation | Bounded interpolation and stale-connection behavior; 104 passing tests |
| 0.7.5 runtime | World atlas | Ten biome-backed realm stories, terrain samples and planned itineraries; 109 passing tests |
| 0.7.6 runtime | Terrain survey | Local slope/water screening, open components and candidate arrival patches; 115 passing tests |
| 0.7.7 runtime | Character presentation | Human sprite selection, spring motion, rounded meshes and supplied-asset studio; 122 passing tests |
| 0.7.8 runtime | Mesh and assets | Bounded asset fetch, Babylon cloth lab, compression and Python validation; 130 Node tests and 2 Python tests |
| 0.7.9 runtime | Multitool vectors | Shared local tool dispatch and bounded point-based cloth controls; 136 passing Node tests |
| 0.7.9-abc.1 | Experimental variant | Spatial ABC fields and pulse/preset controls; 143 passing Node tests; not v0.8 |
| 0.8 rc.2 | Research candidate | Atomic movement/gameplay tick, replay and research consolidation |
| 0.8 rc.3 | Reedhaven candidate | Quiet Tithe authoritative quest/resource loop |
| 0.8 rc.4 | Inventory candidate | Private 20-slot pack and cosmetic equipment |
| 0.8 rc.5 | Identity/persistence candidate | Versioned local player saves and signed local identity boundary |

Use package.json and this inventory, not informal download suffixes, to identify a release. audit/upload-inventory-v07.json records the supplied archive hashes. SHA256SUMS.json records this release's packaged file hashes.

No complete commit/tag history has been recovered. Establish one authoritative repository before concurrent branch development. Preserve prior ZIPs as immutable recovery artifacts rather than changing their internal version labels.

## Gate before expanding multiplayer

Complete real-browser/mobile interaction checks in an environment with a working browser runtime. Keep the new fault regressions. The local two-client transport milestone now covers server-owned spawn, heartbeat/disconnect behavior, queue limits and socket integration tests. Authentication and hosted multi-user operation remain future work. Durable recovery requires a separate checkpoint design.
