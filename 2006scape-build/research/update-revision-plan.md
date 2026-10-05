# Updated Project Revision Plan — Polycodex / Wayfarer / Ashfen / Copper Lantern

**Audit date:** 2026-09-11

## Executive summary

The updated Google Drive audit found a real but limited change: the main `PolycodexServerClientApp` root increased from 3,213 to 3,214 direct non-trashed children. The core Go server, Java client, map/cache, companion, and build component folders remain materially unchanged, and the named Java client folder remains empty. The significant new material is documentation and a small Wayfarer branch, not evidence of a newly verified runnable 2006Scape release.

The Drive now contains the clean-room reports and build status as starred evidence artifacts. Five Wayfarer-titled records were identified, while no title-identifiable `Ashfen` or `Copper Lantern` record exists in the current accessible Drive scope. The new `editor.c` attachment is an exact upstream Git `v2.51.0-rc2` source file and is irrelevant to the game/launcher; it must remain evidence-only.

Apple's current release baseline is **iOS 26.6.2**. iOS 27 is announced for a future availability date and must not be treated as the current production baseline. The project can improve now through a responsive mobile web client/PWA, passkey-capable account flows, touch accessibility, controlled web caching, and opt-in web push. iOS does not provide a desktop-style Electron installer, arbitrary filesystem access, or authority to update/patch local game binaries.

## Verified changes

| Area | Verified state | Meaning |
|---|---|---|
| Drive root | 3,214 direct non-trashed children, net +1 from the prior 3,213 snapshot | Current root has one newly documented record, but historical moves/deletions cannot be reconstructed fully |
| Core components | Server, Java client, map/cache, companion, and build folder families match prior observations | No newly verified client/server/cache/launcher release |
| Java client | `03-Client-3D-Java` remains empty | Do not claim a recovered Java client |
| Wayfarer | Five starred records, including three archives and one immersion/remaster document | Candidate evidence branch; archive contents remain quarantined |
| Ashfen / Copper Lantern | No title-identifiable records found | Use as internal product codenames only; do not imply Drive source exists |
| Audit artifacts | Prior reports are present in Drive and starred | Useful evidence chain; keep them separate from runtime inputs |
| `editor.c` | Exact match to upstream Git `v2.51.0-rc2` | Evidence-only, irrelevant to game/launcher, not a product dependency |
| iOS | iOS 26.6.2 current; iOS 27 future/announced | Build and test current iOS support now; separate future-major validation |

## Safe reversible Drive changes proposed

These changes are intentionally limited to organization and metadata. They do not execute, extract, compile, redistribute, rename, or integrate supplied archives.

| Change | Scope | Reversible? | Requires confirmation? |
|---|---|---:|---:|
| Create a `00_AUDIT_AND_PROVENANCE` folder under the ingestion/care-package root | New folder only | Yes, trashable | Yes before creation |
| Move the generated audit/report Markdown, JSON, and NDJSON evidence files into that folder | Only identified generated evidence files | Yes, move-back | Yes before moving |
| Create a `01_CLEAN_ROOM_PHASE_1` folder for new original-project planning artifacts | New folder only | Yes, trashable | Yes before creation |
| Add a README/manifest that labels supplied runtime/cache/client archives as quarantined | New documentation only | Yes, trashable | Yes before creation |
| Add stars to approved evidence reports | Metadata only | Yes, reversible | Yes if applying in bulk |
| Modify or move Wayfarer/RSPS archives | Not proposed | N/A | Prohibited until artifact-specific rights review |

No item should be permanently deleted. Any future cleanup should use trash/archive with an explicit file list and a separate confirmation.

## Phase 1 revision backlog

1. **Create a clean-room repository root** using the Project Copper Lantern codename until product naming and branding are resolved.
2. **Add provenance controls:** `NOTICE-QUARANTINE.md`, `docs/provenance/review-status.csv`, exact hashes, contributor attestations, and a release gate that blocks unapproved assets and archives.
3. **Add original domain skeleton:** server-authoritative intent frames, deterministic movement, range-gated interaction, inventory mutation, and synthetic fixtures.
4. **Add a mobile-web shell:** responsive touch UI, Home Screen web-app manifest, service worker, cache versioning, explicit offline/error state, and no offline authority over progression or economy.
5. **Add account security hooks:** WebAuthn/passkey capability, secure password fallback if required, rate limiting, session revocation, and short-lived game-admission tickets.
6. **Add deterministic demo mode:** `?demo&seed=copper-lantern-slice-01`, fixed tick behavior, reproducible movement and interaction state, and screenshot verification.
7. **Add iOS test matrix:** physical iOS 26.6.2 device testing, Safari/Web Inspector checks, orientation, touch targets, text scaling, background/resume, network loss/recovery, Home Screen launch, and web-push consent.
8. **Defer desktop launcher integration:** implement only against clean-room project artifacts and synthetic signed manifests; do not use `editor.c`, Drive archives, or legacy client/cache materials.

## Acceptance tests

- A clean checkout builds without any Drive archive or proprietary/quarantined asset.
- Provenance validation fails when an unapproved archive, map, cache, protocol note, or binary enters the build context.
- The browser demo deterministically shows movement, an authorized interaction, and a server-confirmed inventory change.
- The mobile web shell works on iOS 26.6.2 with a stable HTTPS origin and recovers from network interruption without granting offline game authority.
- Passkey support is optional and consented; server-side authorization remains mandatory for all game state changes.
- The launcher proof verifies only project-produced signed artifacts and can roll back a failed test version.
- No connector mutation occurs without an exact target list, operation log, and confirmation for the proposed Drive changes.

## Connector status

Current session configuration did not expose matching connector entries through `manus-config config load`. Google Workspace CLI access is available for Drive/Docs reads, but GitHub, Box, Dropbox, iCloud, and generic cloud-search access must be discovered explicitly before use. Do not infer availability from user mentions or folder labels.

## Recommended next action

Approve or reject the exact reversible Drive organization table above. Until approval, keep the current Drive state unchanged and continue with local clean-room Phase 1 artifacts only.
