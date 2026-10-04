# Drive integration review — 2026-10-04 UTC

## Coverage and release authority

All 24 supplied folders were listed: 845 unique project items. A broader accessible metadata survey discovered 806 folders and 10,299 distinct items. Folder listings for `PolycodexServerClientApp` and its large `polycodex` child each reached the 1,000-item limit. Those listings are partial; this is not a claim that all Drive contents or ZIPs were inspected. No personal unrelated document content was reviewed.

The project metadata inventory is `verification/drive-project-inventory.csv`. Binary checks cover the selected archives in `verification/drive-archive-audit.json`; unselected archives remain unverified. The supplied-folder inventory includes 159 archives totaling approximately 18.4 GB. Forty-eight exceed the local 32 MiB download limit, including the 11.34 GB complete Drive bundle. They received metadata review only.

Wayfarer rc.12 continues the checked rc.11 source, 20 Hz authoritative runtime and simulation revision 10. It is a development candidate, not final v0.8 or a production mobile/desktop release. Existing archives remain preserved. A candidate filename or placement in `01_CANONICAL_BUILD` is not sufficient proof of authority.

## Archive integrity findings

The downloaded rc.11 archive is 6,938,258 bytes rather than the independently reconstructed 10,547,894-byte artifact. The downloaded rc.10 archive is 9,423,626 bytes rather than its historical 10,475,791-byte artifact. Both downloaded ZIPs lack their central directory and fail ZIP parsing. The root cause of truncation is unresolved; do not use them as runnable releases.

A separate copy of the incomplete rc.11 upload was preserved in `90_QUARANTINE`, file ID `166Lb49cmp6-BpB4n0KCqsblNScUl6HJQ`. Automatic approval review rejected overwriting the original rc.11 and promoting it into the canonical folder. The safer path is a new, independently named candidate upload, followed by download, byte-count, SHA-256 and ZIP CRC verification. No overwrite or canonical promotion was performed.

The reconstructed rc.11 matches its previous SHA-256 `dd66cee4432cf2f15b00ecebfb26d2de800e9de77f204171b813ac6fe0e9741f`. rc.9 passes CRC and matches the previous SHA-256. CRC proves archive integrity, not gameplay correctness or launch readiness.

## Integration decisions

| Material | Finding | Decision |
| --- | --- | --- |
| Wayfarer rc.9–rc.11 | Same authoritative TypeScript realm lineage; rc.10/rc.11 Drive transfers incomplete | Continue intact rc.11 source into rc.12; retain historical evidence separately |
| appworkspace.zip | Separate React/TanStack Start/Three/PGLite/better-auth project | Keep separate; no unreviewed authentication/database merge |
| Ashfen/Reedhaven cloud save | Authenticated `save.put` accepts client-provided JSON; server/db.ts performs unconditional upsert after separate revision read | Reject as authoritative gameplay persistence. Concurrent writers can pass the same read/check; account identity alone does not validate gameplay state |
| Ashfen multiplayer slice | Go gateway, Rust codec, separate protocol; rewards still described as client-local | Reference only; requires explicit contract adapter and server-owned rewards |
| Reedhaven playable spine | Small independent prototype | Reference only; no evidence it supersedes Wayfarer |
| NPC-loop materials | Cosmetic animation and separate timing proposals | Keep cosmetics separate from the 20 Hz gameplay clock |
| Papyrus/First Lantern launch docs | Different runtime and earlier incomplete feature scope | Keep as references; do not use their claims to certify Wayfarer |
| Desktop launcher/iOS research | Reference proposals, not tested app packages | Native release and device verification remain future gates |

## rc.12 implementation

- Skip hidden 2D terrain, characters and labels while the 3D renderer is active; preserve HUD updates and 2D fallback.
- Resize the 3D engine when viewport dimensions or pixel ratio change, rather than every rendered frame.
- Add WASD alongside arrow keys. Track keyboard keys and touch pointer IDs separately so releasing one source does not cancel another held source.
- Preserve focus guards, blur/visibility stop behavior, server-authoritative movement, bounded queues, private banks and persistence.

These changes reduce redundant work by inspection and tested call counts. They are not measured FPS or battery-life benchmarks. Real mobile/desktop GPU rendering remains unverified in this environment.

## Next implementation and launch gates

1. Recover/retransfer incomplete archives and verify every new upload by downloading it. Keep the 11 GB bundle outside automatic integration until a bounded archive inventory can be produced.
2. Introduce a persistence interface around server-owned validated exports, then implement transactional database writes with compare-and-swap revision protection and account/session ownership. Test competing writers and reconnect/expiry behavior before production use.
3. Exercise the shared browser client on physical iPhone/Android and desktop GPUs: touch cancellation, orientation, reduced motion, sustained frame time, memory, disconnect/rejoin and secure remote sockets. Native installers and signed update mechanisms are not implemented.
4. Expand the verified skilling/PvM spine through additional encounter patterns, profession-specific resources and server-owned rare reward tables. Cape-slot sacks and magnetic quivers remain design requirements, not completed gameplay features.
5. Final v0.8 requires reproducible packaging, complete fresh tests, device evidence and production identity/persistence gates. The next public version is v0.9; internal release candidates do not introduce v0.8.1 or v0.8.2.
