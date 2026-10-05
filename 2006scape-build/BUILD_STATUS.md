# 2006Scape / Polycodex Build Status

## Current status

This workspace contains a read-only inventory and implementation brief for the supplied Google Drive and repository material. No remote Drive files, Google Docs, GitHub repositories, or connector configuration were modified.

The supplied corpus is **not a verified single runnable 2006Scape release**. It contains a `PolycodexServerClientApp` workspace with server, client, map/cache, companion, and build folders; several archives; launcher/build notes; and a separate minimal Polycodex GitHub repository. The strongest runtime handoff candidate identified by inventory is `polycodex-20260817T014332Z.tar.gz`, but compatibility, provenance, licenses, compilation, and runtime behavior remain unverified.

## Safe implementation boundary

The recommended build is a clean-room, server-authoritative, 2006-era fantasy MMORPG inspired by the requested period, using only original or expressly licensed code, assets, branding, and data. The project must not decompile or redistribute proprietary game assets, emulate a proprietary protocol without permission, bypass protections, inject into or modify third-party clients, or include automation/anti-cheat evasion.

## Recommended phases

1. **Foundation:** establish a new versioned protocol, server-authoritative simulation core, account service, PostgreSQL persistence, synthetic seed data, original world bible, provenance ledger, local bootstrap, and contract tests.
2. **Launcher and controlled alpha:** build an Electron/TypeScript launcher with signed TUF-style metadata, verified artifacts, atomic install slots, rollback, platform signing, consent-gated telemetry, and a small original client slice.
3. **Hardening and release:** add admin RBAC/MFA, audited economy operations, load/soak and restore tests, SBOM/build provenance, release gates, staged rollout, and documented incident response.

## Files

- `research/drive-inventory.md` — supplied Drive inventory and evidence/unknowns
- `research/architecture.md` — clean-room server/client architecture
- `research/launcher-review.md` — secure launcher and updater design
- `research/implementation-brief.md` — synthesized implementation plan
- `inventory/drive-metadata.ndjson` — metadata for supplied Drive IDs
- `inventory/project-children.json` — discovered project-folder children
- `docs/` — locally exported document material used for inspection

## Decision required before source integration

Before integrating any archive, cache, client, protocol, or launcher artifact from Drive, document the user's ownership/license authority and the exact artifact(s) approved for use. Until then, treat those materials as quarantined reference data only.
