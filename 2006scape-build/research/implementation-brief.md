# Implementation Brief — 2006-Era Fantasy MMO Build

**Author:** Manus AI  
**Decision:** Begin a new, clean-room, original game platform now. Do **not** treat the Drive corpus as a releasable 2006Scape build, cache, client, or launcher.

## Implementation position

The supplied Drive material is a mixed Polycodex/RSPS corpus rather than one verified, compatible 2006Scape release. Its strongest candidate for a runtime handoff is `polycodex-20260817T014332Z.tar.gz`, but it has not been compiled, authenticated, license-reviewed, or matched to a client. The cache material is tooling and source rather than a confirmed raw legacy cache. The supplied launcher documentation describes a Maven/RuneLite-derived flow, but no matching launcher or verified Java client artifact was found. Accordingly, the correct near-term product is an **original, server-authoritative fantasy MMORPG inspired only at a high level by 2006-era interaction and presentation**. [1]

> “Build now” means new code and original or expressly licensed content. It does not mean adapting, distributing, reverse engineering, or making the supplied RSPS-like corpus operational.

## What can be built now

| Workstream | Buildable now | Boundary |
|---|---|---|
| Game foundation | A modular-monolith game server, a versioned original protocol, deterministic movement/combat/inventory rules, PostgreSQL persistence, and synthetic development data. | The protocol must be newly designed and must accept player **intent**, not client-authoritative state. [2] |
| Account and operations | HTTPS account API, Argon2id password hashing, rate limiting, short-lived game admission tickets, staff MFA, role-based access control, and immutable audit events. | No production credentials or real player data in local development. [2] |
| Original client | A thin original client prototype that logs in, renders a small original test map, and exercises the new protocol. | Do not integrate a proprietary client, cache, map, protocol, or brand. [2] |
| Launcher | A TypeScript/Electron launcher prototype with a narrow preload API, local version slots, a signed test manifest, streamed hash-and-length validation, and health-confirmed rollback. | Use only files produced by this project and test keys. TUF-style update metadata is the recommended production model. [3] |
| Delivery safeguards | Containerized local dependencies, one-command bootstrap/test scripts, migrations, SBOM generation, signed asset manifests, CI checks, and provenance records. | Release only original/licensed assets and only after security, provenance, and test gates pass. [2] |

The Drive inventory can support a **read-only evidence and licensing review**. Store its file identifiers, checksums, and review conclusions outside the product runtime path. Do not copy the identified runtime bundle, cache-pipeline payloads, client material, maps, or RSPS protocol notes into the distributable repository until rights and compatibility have been independently established. [1]

## Decisions, confirmation, and legal ownership required

| Item | Needed from the user or rights holder | Implementation consequence until resolved |
|---|---|---|
| Product identity | Confirm whether the product is an original game with a new name and world, or whether the user claims rights to use “2006Scape” and related branding. | Use a temporary internal codename. Do not publish or package the 2006Scape name, marks, or visual identity. |
| Drive corpus | Provide an ownership and license chain for every codebase, map, cache, asset, protocol document, binary, and third-party dependency proposed for use. | Treat all corpus material as quarantined reference evidence. Do not build against or redistribute it. |
| Client/cache/protocol rights | Provide explicit authorization for any legacy client, cache, proprietary protocol, or derived game content. | Do not emulate proprietary protocols, decompile, bypass protections, ship proprietary content, or create anti-cheat bypass, injection, memory-modification, automation, or evasion tools. [2] [3] |
| Creative assets | Confirm ownership or commercial licenses for art, audio, fonts, icons, lore, names, and contributor work. | Create a world bible and an asset register for wholly original content. |
| Release governance | Confirm legal entity, privacy policy owner, support contact, target platforms, distribution accounts, domains, and data-retention expectations. | Restrict work to local development and non-public test artifacts. Do not collect telemetry by default. [3] |
| Operating model | Confirm initial player scale, staff roles, moderation requirements, and budget for code signing, Apple notarization, hosting, backups, and monitoring. | Keep architecture configurable, but defer production deployment and platform signing. |

Written confirmation should include the owner, asset or repository identifier, exact granted rights, territory and duration, sublicensing/distribution rights, modification rights, and third-party obligations. A lawyer should review any claim to legacy game code, content, branding, or protocol compatibility before that material changes status from quarantine to approved use.

## Recommended repository and file changes

Create a new repository, or a clearly separated clean-room root, rather than extending an unverified bundle in place. Keep any supplied archives in access-controlled evidence storage and out of Git history, build contexts, release artifacts, and CI runners.

```text
2006scape-build/                         # temporary working name only
├── README.md                             # clean-room scope and explicit exclusions
├── LICENSE                               # project license after owner selection
├── docs/
│   ├── product/world-bible.md            # original setting, terminology, visual direction
│   ├── legal/do-not-use-register.md      # prohibited names, assets, binaries, references
│   ├── provenance/asset-register.csv     # owner, license, source, checksum, approval
│   ├── provenance/contributor-attestations/
│   ├── protocol/v1.md                    # original protocol contract
│   ├── security/threat-model.md
│   └── operations/backup-and-restore.md
├── apps/
│   ├── game-server/                      # gateway and authoritative simulation
│   ├── account-api/                      # account, admission tickets, sessions
│   ├── admin-web/                        # separately authenticated staff controls
│   └── launcher/                         # Electron/TypeScript launcher
├── packages/
│   ├── domain/                           # deterministic game rules
│   ├── protocol/                         # shared schemas and contract tests
│   ├── persistence/                      # PostgreSQL repositories and migrations
│   ├── assets-manifest/                  # signed-manifest tooling
│   └── test-fixtures/                    # synthetic maps, accounts, and assets only
├── infra/
│   ├── compose.yaml                      # local PostgreSQL and dependencies
│   ├── migrations/
│   └── observability/
├── tools/
│   ├── dev-bootstrap
│   ├── verify-provenance
│   └── generate-sbom
├── .github/workflows/
│   ├── ci.yml                            # tests, lint, contract, SBOM, provenance gate
│   └── release.yml                       # approval-gated signed release only
├── SECURITY.md
├── CONTRIBUTING.md                        # clean-room and attestation requirements
└── .gitignore                            # excludes evidence archives, keys, caches, builds
```

Add a root `NOTICE-QUARANTINE.md` that records the Drive inventory report location and declares that the corpus is **not approved for import, compilation, distribution, or production use**. Add `docs/provenance/review-status.csv` with columns for identifier, checksum, claimed source, license evidence, legal reviewer, approval status, allowed use, and decision date. The known duplicated payloads may be recorded by checksum for traceability, but should not be committed as source or artifacts. [1]

The initial CI policy should fail a release when provenance fields are incomplete, prohibited identifiers are detected, unsigned assets are present, migrations are untested, the protocol contract changes without a version change, or SBOM/manifest generation fails. Production signing keys must remain outside ordinary CI workers and require audited approval. [2] [3]

## Next three implementation phases

### Phase 1 — Establish the clean-room baseline (weeks 1–2)

Create the repository structure, quarantine documentation, original world bible, asset/provenance registers, local container environment, and synthetic fixtures. Implement the server domain skeleton, PostgreSQL migrations, account authentication, and a versioned protocol specification. Deliver a reproducible `dev-bootstrap` command, unit tests for deterministic rules, and a legal/provenance gate that blocks unapproved content.

**Exit criteria:** The project runs locally from source with only synthetic/original assets. Every included dependency and asset has a recorded license or approval. No Drive corpus payload is required by the build.

### Phase 2 — Deliver a vertical slice and secure launcher prototype (weeks 3–6)

Implement one original playable loop: account creation, login, admission ticket, character creation, movement in a small original map, one interaction, inventory persistence, and audited staff support actions. Build a minimal original client and a launcher prototype that verifies a signed test manifest, installs to a side-by-side version slot, and rolls back after an unsuccessful health check. Add protocol contract tests, fuzzing of network input, migration/concurrency tests, and end-to-end tests.

**Exit criteria:** A fresh local machine can install the test build, complete the vertical slice, update from one approved test version to another, and safely roll back. The client cannot authoritatively alter movement, inventory, combat, or rewards.

### Phase 3 — Production hardening and controlled alpha (weeks 7–12)

Expand operational controls before public exposure. Add MFA-protected administration, least-privilege roles, dual approval for high-risk economy changes, encrypted backups, restore drills, load/soak testing, privacy-minimized opt-in diagnostics, and release signing. Prepare platform-specific distribution: Windows signing, macOS Developer ID signing/notarization/stapling, and signed Linux package or repository metadata. [3]

**Exit criteria:** Security review, backup restore drill, load target, accessibility review, incident runbooks, signed release manifest, SBOM, and legal/provenance review all pass. Controlled alpha begins only after the user confirms the operating and publishing decisions above.

## Immediate recommendation

Authorize **Phase 1 only** while the product name and any legacy-material rights are resolved. This provides real engineering progress without assuming compatibility or ownership that the inventory could not verify. If the user later supplies documented rights to specific material, evaluate each item through the provenance review process; do not use blanket approval based on folder names, documentation, or a successful compilation.

## References

[1]: file:///home/ubuntu/2006scape-build/research/drive-inventory.md "Drive inventory: Polycodex/RSPS corpus assessment"
[2]: file:///home/ubuntu/2006scape-build/research/architecture.md "Clean-room 2006-era MMO architecture"
[3]: file:///home/ubuntu/2006scape-build/research/launcher-review.md "Launcher and bootloader implementation review"
