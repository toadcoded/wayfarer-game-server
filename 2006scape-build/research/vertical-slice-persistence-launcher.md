# Persistence and Launcher Sequencing — Vertical-Slice Track

**Track ID:** `persistence-launcher`  
**Track title:** Persistence and launcher sequencing  
**Author:** Manus AI  
**Scope:** Minimum durable state and delivery sequencing for the Copper Lantern clean-room vertical slice. This is a design and acceptance report only. It does not import, compile, run, or operationalize any Drive, legacy, RSPS, cache, client, or launcher material.

## Decision

Build **server persistence, restore evidence, and a direct developer launch path before an original launcher prototype**. The first launcher work should be a deliberately small, test-only update proof of concept only after the project can package and directly start a wholly original client that completes a meaningful synthetic-account smoke path. At that point, a signed test manifest, local version slots, readiness confirmation, and rollback can be tested against real project artifacts rather than against a placeholder downloader.

The vertical slice needs a narrow PostgreSQL-backed source of truth for account identity, a character snapshot, tutorial/progression markers, inventory, idempotent authoritative commands, and an auditable mutation trail. It does **not** need persistence for motion poses, cosmetic preview state, decorative instances, renderer settings, or arbitrary client UI state. The client code repeatedly defines those areas as presentation-only, while the guide and safe-area configuration require server enforcement for completion, rewards, safety, and persistence. [3] [4] [5] [6]

> **Sequencing rule:** The launcher must deliver only build artifacts produced by the clean-room project. It is not a mechanism for making an unverified client, cache, legacy launcher, Drive archive, or reverse-engineered protocol usable.

## Current-state observations

The declared Go world package is an in-memory domain model. `World.Validate` verifies levels and connectors, and `World.Traverse` validates a transition intent and returns a proposed result. It does not own a database connection, authentication, repository interface, transaction boundary, durable command receipt, or mutation of a stored player record. `TransitionRevision` and `CommandID` are useful starting points, but neither is durably checked for replay protection. The existing tests verify only in-memory world validation and traversal rejection conditions. [1] [2]

The declared client files establish useful state boundaries. The guide states that completion and rewards are server-authoritative. The safe-area file expressly calls itself presentation/onboarding configuration and says the server must independently enforce admission, safe-zone, combat, and persistence rules. `PlayerAppearance` is versioned and sanitizable, but its own comments require server-side ownership validation. The motion controller, generated micro-details, and presentation plan all explicitly exclude authoritative location, collision, inventory, and outcome changes. These are strong reasons to persist only compact authoritative snapshots and to regenerate visual-only data from the current client build. [3] [4] [5] [6] [7]

The authored Ashfen JSON declares `sourceBoundary: "original-authored-clean-room-content"` and supplies original level/connector identifiers. That declaration is useful metadata, but it is not by itself a provenance approval. The project must record an approved content fingerprint and source approval outside the runtime payload before treating the content as releasable. Its level IDs and connector IDs are appropriate values for the slice's **location references**, not a reason to persist copied map data inside every character row. [8]

The repository listing shows `NOTICE-QUARANTINE.md` and `src/Polycodex/README.md`, as well as the clean-room source folders. This assessment did not inspect, build, link, copy, or use the latter path. The implementation brief describes the Drive corpus as unverified and quarantined, and requires that it stay out of runtime paths, build contexts, release artifacts, and CI runners. The declared repository currently has no persistence package, migration directory, account API, launcher application, client package manifest, signed-manifest tooling, health endpoint, or restore-test harness. [9]

The implementation brief places the original vertical loop—account creation, login, admission, character creation, movement, one interaction, and inventory persistence—before the launcher exit criteria. The launcher review similarly requires an ownership/release-policy gate and a fixed development launch path before verified-update, atomic-install, and rollback stages. [9] [10]

## Minimum persistence boundary

### Authoritative data that must survive a restart

The slice should use one PostgreSQL database owned by the authoritative game service. It should create only the following durable records initially. All client-supplied data is an **intent** or a candidate cosmetic patch; the service validates it against its own world/content rules and persists only the accepted resulting state.

| Record | Minimum fields | Purpose and constraints |
|---|---|---|
| `schema_migrations` | `version`, `applied_at`, `checksum`, `source_revision` | Proves which ordered migration set produced a database. Migration checksums must be immutable once applied. |
| `accounts` | UUID `id`, normalized development-safe handle, `password_hash` or external-test-auth subject, `status`, `is_synthetic`, `created_at`, `updated_at` | Separates account identity from characters. Store password hashes only; never store a plaintext password, session token, or legacy credentials. A vertical slice may support one character per account while retaining the relationship. |
| `account_sessions` | UUID `id`, `account_id`, hashed refresh/admission-token identifier, `expires_at`, `revoked_at`, `created_at` | Supports short-lived admission/session validation and explicit revocation. Store opaque-token hashes, not bearer tokens. This may be omitted only while all local testing uses a deliberately isolated, short-lived development authentication adapter. |
| `characters` | UUID `id`, `account_id`, clean-room display name, `appearance_version`, `appearance_json`, `world_space_id`, `level_id`, `tile_x`, `tile_y`, `facing`, `location_content_revision`, `state_revision`, `created_at`, `updated_at` | The canonical player snapshot. Enforce a unique `account_id` for the one-character slice. Require integer tile bounds through service validation, not client trust. `state_revision` is optimistic-concurrency state, distinct from the world's graph revision. |
| `character_tutorial_steps` | `character_id`, `guide_package_id`, `step_id`, `completed_at`, `completion_content_revision` | Records server-verified guide completion. A primary key on `(character_id, guide_package_id, step_id)` makes duplicate completion harmless. Use the existing original guide IDs, not free-form client strings. |
| `character_discoveries` | `character_id`, `world_space_id`, `landmark_id`, `discovered_at`, `content_revision` | Supports the overview's discovered-landmark count without persisting renderer markers or arbitrary map state. |
| `inventory_stacks` | UUID `id`, `character_id`, original `item_definition_id`, `slot`, `quantity`, `state_revision`, `updated_at` | Provides the required persistent inventory loop. Use a unique `(character_id, slot)` and a positive quantity check. Initial slice items must come from a versioned, approved original item-definition list. Do not store game assets/blobs in this table. |
| `command_receipts` | `character_id`, client `command_id`, `command_kind`, request fingerprint, resulting `state_revision`, serialized minimal result, `accepted_at`, `expires_at` | Makes retried mutation intents idempotent. A unique `(character_id, command_id)` is required. The request fingerprint detects a command ID reused with a different payload. Retain long enough to cover admission/session retry windows; purge under an explicit retention job. |
| `character_mutation_audit` | monotonically ordered `id`, `character_id`, optional `account_id`, `command_id`, `kind`, `before_revision`, `after_revision`, actor type, compact approved detail, `created_at` | Gives support and restore investigation a durable, non-secret record of character-changing actions. Keep it compact and redact credentials, tokens, chat, raw client payloads, and unnecessary IP data. |
| `content_releases` | `content_revision`, artifact/content SHA-256, schema version, provenance record reference, approval state, activated_at | Binds location/progression rows to an approved clean-room content revision. Only `approved` content can be activated. This is a release-control table, not a cache/archive importer. |

This is a **minimum**, not an economy, social, moderation, trade, mail, quest, guild, telemetry, or production identity schema. Those domains should not be created as empty tables merely because an MMORPG may eventually need them. Staff identity and broader account-recovery flows should remain out of the vertical-slice database until their security requirements are designed.

### State deliberately excluded from the database

Do not persist `PlayerMotionController` memory or poses. Do not persist deterministic decorative detail instances, lighting variations, HUD map-open state, camera position, cosmetic preview changes that are not confirmed, or arbitrary client graphics settings. The only appearance state retained is the confirmed, server-sanitized `PlayerAppearance` document with its schema version. Cosmetic state must remain unable to affect stats, collision, movement, rewards, permissions, or progression. [5] [6] [7]

Do not write a player's location every render frame. Persist only accepted transitions and gameplay-affecting checkpoints: character creation, confirmed appearance, server-approved move arrival when the location is a durable checkpoint, connector traversal, tutorial completion, interaction result, inventory change, and controlled logout/disconnect recovery. The authoritative service may maintain ephemeral session position in memory between checkpoints, but it must use an atomic transaction when committing a location, inventory, tutorial step, receipt, and audit entry that belong to one command.

### Required transactional behavior

A mutation handler should load the character row using a row lock or a `state_revision` compare-and-swap. It must first find an existing command receipt; an identical retry returns the stored outcome, while a conflicting reuse is rejected. It must validate the request against the server's loaded content revision, world graph, player location, safe-area policy, and item definitions. It then commits the changed character/inventory/progression rows, receipt, and audit entry in one database transaction.

For connector traversal specifically, use the existing `World.Traverse` result only as a domain validation step. The persistence application service must reload the character, verify its durable tile and relevant content/graph revision, call `Traverse`, set the returned `To` tile and next state revision, and insert the command receipt/audit record atomically. If a content release no longer contains the saved level/tile, do not silently place the player somewhere arbitrary: log a migration/repair decision and use a reviewed safe fallback spawn in the original Welcome Garden or other approved safe location.

### Migration and compatibility policy

Use forward-only, numbered SQL migrations. Each migration must have an explicit down/recovery note in its header, but the normal production path is restore-plus-forward-migrate rather than automatic destructive down migrations. Add `contentSchemaVersion` and `protocolVersion` to the server's readiness response and to future update metadata. A release that cannot safely read the active database migration level or the approved content revision must report **not ready** and must not admit players.

## Synthetic development accounts and fixtures

All development accounts must be generated from source-controlled **non-secret fixture definitions** and provisioned only by an environment-gated bootstrap command. They must have UUIDs/handles in a reserved `dev-` namespace, `is_synthetic = true`, no real email address, no production personal data, no imported account data, and no deployment outside development/test. Test authentication secrets should be randomly generated for each local reset or injected by the test runner; they must never be committed as shared plaintext credentials.

Create five small fixture personas, all using original Copper Lantern content:

| Persona | Seeded state | Test value |
|---|---|---|
| `dev-newcomer` | Fresh account; default appearance; Welcome Garden spawn; no completed steps; empty starter inventory. | Character creation, safe admission, appearance confirmation, first tutorial state. |
| `dev-personalized` | Confirmed appearance and early guide steps. | Appearance JSON round trip and idempotent tutorial completion. |
| `dev-departing` | Eligible to use the departure gate with an approved checkpoint. | Server-gated safe-area exit and persisted connector/location result. |
| `dev-returning` | A discovered landmark and one original inventory stack. | Restored inventory, overview discovery, and content-version compatibility. |
| `dev-retry` | A known command-receipt fixture. | Duplicate command delivery, stale revision, and command-ID conflict rejection. |

Fixture content should include only hand-authored test accounts, original item IDs, the declared clean-room guide, and approved clean-room map/content metadata. Do not seed names, coordinates, definitions, assets, or packets from an unverified corpus. The seed command must fail closed unless `COPPER_LANTERN_ENV` is exactly `development` or `test`, the database name has a designated test prefix, and `ALLOW_SYNTHETIC_SEED=1` is set. It should print synthetic record counts and content revision, never credentials or token material.

## Restore design and drills

Persistence is not accepted because a backup file exists. It is accepted when the project can restore a known synthetic state into an isolated database and exercise it through the service.

The first restore drill should perform the following controlled sequence:

1. Start an empty isolated PostgreSQL database and apply every migration.
2. Seed the five synthetic personas and execute deterministic slice mutations: confirmed appearance, a safe-area tutorial completion, one accepted interaction/inventory change, and an approved connector traversal.
3. Capture a logical backup with its SHA-256, migration head, `content_releases` fingerprint, creation time, and fixture run ID. Keep the encrypted backup only in the designated test artifact store; test records must contain no production data.
4. Restore the backup into a fresh isolated database, run migrations if a forward-compatible migration is part of the test, and verify canonical queries for each persona. Compare stable fields and ordered audit facts while excluding volatile timestamps and generated session IDs.
5. Start the service against the restored database. Its readiness endpoint must report the expected migration head and approved content revision. Log in as `dev-returning`, prove the restored appearance/tutorial/inventory/location, and submit one valid idempotent follow-on intent.
6. Test the failure case separately: a corrupted backup checksum, missing required migration, unavailable/withdrawn content revision, or incompatible schema must fail before admission and preserve the original backup/evidence.

Record elapsed restore time and data recovered in a machine-readable test result. Until operational recovery objectives are approved, use a development target of **no loss of the deterministic fixture state and a completed isolated restore in 15 minutes or less**. This is a development test target, not a production service-level commitment. A production plan later needs encrypted backups, retention, access control, a defined recovery point objective (RPO), a recovery time objective (RTO), and periodic drills using production-appropriate controls. The implementation brief already identifies encrypted backups and restore drills as pre-alpha hardening requirements. [9]

## Health checks and admission boundary

Implement three health surfaces, each with a narrow purpose:

| Surface | Required success condition | Must not do |
|---|---|---|
| `GET /livez` | Process event loop is alive. | Query the database or claim that the server can admit players. |
| `GET /readyz` | Database connection works; migration head is expected; approved clean-room content loads and validates; world graph validates; required signing/configuration identifiers are available; no mandatory dependency is degraded. Return build, protocol, migration, and content revision identifiers, not secrets. | Expose account counts, database DSNs, tokens, paths, private keys, or unapproved content details. |
| Authenticated test admission/handshake | A synthetic test account receives a short-lived ticket and completes the original protocol's version/content compatibility check. | Treat a TCP connection, renderer start, or client self-report alone as durable release health. |

The Go domain package should keep its deterministic validation free of HTTP and SQL concerns. A separate service composition layer should invoke `World.Validate` during readiness and wire persistence repositories to request handlers. The safe-area server policy must be represented in authoritative content/service code before the `dev-newcomer` is admitted; the client configuration alone cannot enforce it. [1] [4]

## When to add the original launcher prototype

**Do not add the launcher prototype at the current repository state.** There is no original client application artifact, persistence-backed login loop, backend readiness endpoint, release package layout, or test-manifest tool to validate. Building an updater now would test only the updater shell and could create pressure to fill it with prohibited or unreviewed inputs.

Add a test-only launcher proof of concept after all of the following gates pass:

1. **Clean-room gate:** `NOTICE-QUARANTINE.md`, the do-not-use register, an asset/content provenance register, and a CI provenance scan block unapproved runtime inputs. The full build can run without `src/Polycodex`, Drive archives, legacy clients/caches, or legacy protocol documentation in its build context.
2. **Slice gate:** an original client built from this repository can directly start from a fixed development directory, authenticate a synthetic account, enter the original Welcome Garden, confirm an appearance, perform one server-authoritative interaction, persist/reload inventory or progress, and exit cleanly.
3. **Persistence gate:** migrations, concurrency/idempotency tests, and the isolated synthetic restore drill pass; `/readyz` exposes compatible build/protocol/migration/content identifiers.
4. **Packaging gate:** CI produces an immutable, original test game package with an artifact hash, byte length, target OS/architecture, release ID, source revision, SBOM, and provenance decision. The package has no dynamic content source, external legacy dependency, arbitrary executable path, or post-install shell command.
5. **Release-contract gate:** the team has defined a test-only signing key custody procedure, a version-slot state format, a health nonce protocol, an explicit signed security floor, and a human-readable rollback/runbook policy.

This is normally the **second half of vertical-slice delivery**, after durable play state is working but before public alpha. It aligns with the implementation brief's Phase 2 criteria: a new test build must update, complete the slice, and safely roll back. Full platform packaging, public signing identities, notarization, production key custody, and public distribution remain later hardening work. [9] [10]

## Signed test manifests, installation, health confirmation, and rollback

### Signed test manifests

Use a real TUF-compatible test repository and a maintained verifier rather than inventing a `latest.json` signature scheme. The launcher embeds only the **test root public metadata**. Test private keys are generated for the test environment, excluded from Git and build artifacts, scoped to test channels, and never reused for production, TLS, database, account, or platform code-signing purposes. The production design should use threshold and delegated roles; the test proof of concept may use a simplified but separate role/key set only if it still tests expiry, versions, signatures, and key authorization. [10]

Each approved test target must bind exactly one immutable original game package to: product identifier, `channel: test`, `releaseId`, game version, minimum launcher version, `protocolVersion`, `contentSchemaVersion`, platform, architecture, package format, byte length, SHA-256, source revision, SBOM/provenance references, and an explicit approved rollback relationship if any. Metadata must include version and expiry. The launcher must persist the highest trusted metadata versions and signed minimum acceptable version so that a previously valid but stale test manifest cannot silently downgrade a client.

Negative fixtures must prove rejection of an altered hash or length, expired timestamp, stale metadata version, unauthorized role/key, inadequate signature threshold, wrong product/channel/platform/architecture, malformed target path, unallowlisted origin, and a package that contains an unapproved provenance record. These fixtures themselves must be original test files.

### Slot state and health confirmation

Install only a verified full package into a new application-owned `versions/<releaseId>/` directory. Download to a restrictive temporary directory; stream-check length and digest; perform structural/platform signature checks as applicable; then atomically activate a version slot. Keep user preferences and game data outside version directories. A small atomic launcher state file should contain at least `currentReleaseId`, `previousReleaseId`, `lastKnownGoodReleaseId`, `channel`, `highestTrustedMetadataVersions`, `minimumAcceptableReleaseId`, `pendingHealth`, and bounded consecutive failure counters.

A process spawn is not health. For an online test run, the launcher creates a one-time local health nonce and starts the verified game from the selected slot with fixed arguments. The original client must return the nonce together with the selected `releaseId`, protocol/content schema identifiers, and a readiness result only after it has loaded its verified local original content and completed a non-mutating compatibility handshake with a ready server. The launcher validates the nonce and identifiers, observes the process for a bounded settling interval, and only then marks the release as `lastKnownGood`.

Network unavailability must be classified as **offline/deferred**, not as a crash-loop failure. A user must not be rolled back simply because an optional online probe cannot run. An actual launch failure includes an unexpected early process exit, missing/mismatched nonce, a protocol/content incompatibility from a ready server, or a verified client failure before the settling interval. Diagnostics remain local by default and must be scrubbed of account tokens, credentials, paths, and personal data. Optional telemetry remains opt-in and minimal. [10]

### Rollback policy

After a small, documented consecutive-failure threshold for a pending release, select `previousReleaseId` only if it remains locally verified and is not below the signed security floor. Perform the pointer/state change atomically, preserve user data, show the user the failed and selected version, and offer retry or a diagnostic export. A release becomes withdrawn when new signed metadata removes/replaces it; no manifest or UI text may instruct the launcher to execute arbitrary repair commands.

Keep these two policies distinct:

* **Operational rollback** returns to a previous locally verified slot when the pending release is broken.
* **Security rollback prevention** rejects stale metadata and releases below the signed minimum. It overrides operational convenience unless a specifically signed, human-approved exception permits a safe older target.

Test power/process loss during download, extraction, activation, health confirmation, and rollback. Every interruption must leave the last known-good slot launchable and the local state parseable. The launcher review specifically calls for side-by-side slots, atomic state, bounded crash-loop handling, and avoidance of rollback to known-vulnerable releases. [10]

## Concrete next files and types

The following additions are deliberately small and live only in new clean-room paths. Names are proposals; they do not authorize any import from existing quarantined paths.

| Proposed path | Concrete type or responsibility | First acceptance evidence |
|---|---|---|
| `src/cleanroom-world/persistence/migrations/001_vertical_slice.sql` | Creates the minimum tables, constraints, indexes, migration metadata, and non-destructive baseline. | Empty database migrates once; second run is a no-op or cleanly reported by migration tooling. |
| `src/cleanroom-world/persistence/models.go` | `Account`, `CharacterSnapshot`, `InventoryStack`, `TutorialStep`, `CommandReceipt`, `ContentRelease`, `MutationAudit`. | Serialization round-trip and validation tests; no SQL in domain types. |
| `src/cleanroom-world/persistence/repository.go` | Transactional interfaces: `CharacterRepository`, `CommandReceiptRepository`, `ContentReleaseRepository`, `WithTransaction`. | In-memory fake supports domain/service unit tests without weakening production semantics. |
| `src/cleanroom-world/persistence/postgres/` | PostgreSQL implementation with parameterized queries, row locking/CAS, migrations, and transaction management. | Concurrent duplicate intent test produces one mutation and repeatable receipt result. |
| `src/cleanroom-world/service/character_service.go` | Applies authoritative appearance confirmation, tutorial completion, interaction, and traversal. | Unsafe location/appearance/command requests reject without partial writes. |
| `src/cleanroom-world/service/content_gate.go` | Resolves approved content revision, validates safe fallback spawn, and prevents admission on unapproved/mismatched content. | Withdrawn or invalid content produces a not-ready/admission denial result. |
| `src/cleanroom-world/http/health.go` | Liveness and readiness handlers with a versioned, secret-free response model. | Integration test fails readiness on DB/migration/world/content faults. |
| `src/cleanroom-world/testfixtures/synthetic_accounts.go` and `testdata/` | Environment-gated synthetic personas and original item/content fixture references. | Test database receives only `is_synthetic` records in a reserved namespace. |
| `src/cleanroom-world/restore/restore_test.go` plus `tools/test-restore` | Isolated logical backup/restore orchestration and canonical-state verification. | Restore evidence records checksum, timing, migration/content heads, and smoke result. |
| `docs/provenance/content-register.csv` and `docs/provenance/review-status.csv` | Content source, checksum, author/license evidence, approval, and allowed runtime use. | CI refuses a release if current content fingerprint lacks an approved record. |
| `docs/operations/backup-and-restore.md` | Backup encryption/retention assumptions, drill command, evidence format, failures, and escalation. | A new engineer can run the synthetic drill without Drive material. |
| `apps/launcher/` *(only after the launcher gates)* | Original Electron/TypeScript main process, narrow preload, TUF adapter, downloader/verifier, slot installer, state store, and test UI. | It launches one locally fixed original package before update code is enabled. |
| `apps/launcher/src/shared/schemas.ts` *(after gates)* | Schemas for target metadata, local slot state, health nonce/result, and user-visible status. | Malformed cross-process/metadata inputs are rejected. |
| `apps/launcher/test/fixtures/tuf/` *(after gates)* | Original signed test metadata and negative fixtures; private test keys remain outside Git. | Valid fixture installs; every negative fixture rejects. |
| `tools/release/verify-cleanroom-provenance` *(after gates)* | Fails release preparation for unapproved paths, hashes, identifiers, provenance gaps, or banned runtime sources. | CI blocks an intentionally added quarantined-file reference. |

The immediate code order is: **migration/types and repository contracts; synthetic fixtures; authoritative character service; health/readiness; restore drill; direct original-client smoke test; then launcher test proof of concept**. The initial launcher should not include differential patching, plug-ins, user-selected executable paths, arbitrary URLs, privileged services, background start-up, anti-cheat drivers, or telemetry by default. [10]

## Acceptance criteria

### Persistence vertical slice

1. A fresh empty database migrates to the expected head using only new clean-room migrations. A second migration attempt is safe and the migration checksum history is verifiable.
2. `dev-newcomer` can be created from synthetic fixtures, receive a default server-approved appearance and Welcome Garden location, confirm a sanitized appearance, complete one guide step, and resume that state after service restart.
3. The server—not the client—accepts or rejects safe-area departure, connector traversal, tutorial completion, and inventory mutation. A rejected request leaves no location, inventory, tutorial, receipt, or audit partial write.
4. A repeated identical command ID returns the original result without duplicating inventory/progress. Reusing that command ID with a different intent is rejected. Concurrent updates demonstrate one winning state revision and a deterministic retry path.
5. Presentation-only pose/detail/HUD data are absent from persistence tests and cannot affect stored authoritative values.
6. Content revision mismatch, invalid saved tile, or withdrawn content results in a controlled not-ready/admission or reviewed fallback path, never an unchecked client-selected location.

### Synthetic data and restore

1. The development bootstrap refuses non-development/test environments and non-test database names, writes only synthetic records, and emits no plaintext secrets.
2. The documented restore drill restores a checksum-verified backup to an isolated database, proves the five personas' canonical state, and completes a login/authoritative smoke action against the restored service.
3. Corrupt backup, migration mismatch, and invalid/withdrawn content revision tests fail closed before player admission. The previous evidence/backup remains intact.
4. Drill evidence contains run ID, tool versions, migration head, content hash/revision, checksum result, elapsed time, and pass/fail result, but no bearer tokens or personal data.

### Launcher prototype, only after prerequisite gates

1. The launcher accepts one valid original test package whose full TUF-compatible trust chain, target hash/length, platform, channel, and release compatibility validate.
2. It rejects every specified negative manifest/package fixture and never starts an unverified package.
3. Interrupted download/extraction/activation preserves a launchable last-known-good slot. State writes are atomic and restrictive.
4. A release becomes last known good only after the nonce-bound client readiness signal and settling interval. Offline/deferred health is not counted as a crash.
5. A pending release that reaches the documented failure threshold rolls back only to a verified release above the signed security floor, preserves user data, and shows a clear local explanation.
6. CI confirms that launcher/game packages, manifests, fixtures, test keys, SBOM, and provenance records are clean-room/original or explicitly licensed. It blocks references to Drive, legacy, cache, proprietary-client, or unapproved runtime inputs.

## Risks and controls

| Risk | Why it matters now | Required control |
|---|---|---|
| Persisting client authority | The declared client code is presentation-oriented; trusting it would permit location/progress/inventory fraud. | Keep all outcome validation and durable mutation in the server service transaction. |
| Schema grows into an untestable MMO platform | Premature economy/social/moderation tables increase migration and recovery risk without slice value. | Freeze scope to the minimum tables; add a domain only with a tested game loop and restore story. |
| Command retries duplicate rewards or moves | `World.Traverse` already carries a command ID, but has no persistent receipt. | Unique receipt + request fingerprint + atomic mutation/audit transaction. |
| Content changes strand a saved character | Locations are keyed to level/tile identifiers that may change across original content revisions. | Persist content revision; validate at admission; use a reviewed safe fallback and audit migration decision. |
| Backups are assumed rather than recoverable | A dump without compatibility/restore proof does not protect player state. | Isolated synthetic restore drill on every migration/release candidate; record evidence. |
| Launcher is built before a real original artifact exists | It could devolve into a generic downloader or invite prohibited runtime inputs. | Gate launcher POC on direct original slice, persistence, provenance, package, and health contracts. |
| Signed metadata becomes a single-key or replay weakness | A bare signature or HTTPS-only manifest allows stale/altered release risks. | TUF-compatible metadata, role separation, expiry/version checks, security floor, and negative fixtures. |
| False health success or harmful rollback | A child process launch is insufficient, and offline users should not be punished. | Nonce-bound ready protocol plus settling interval; classify offline as deferred; distinguish operational rollback from security policy. |
| Quarantined material leaks through build/release paths | A copied archive, transitive reference, or CI artifact breaks the clean-room boundary. | Path allowlists, provenance/content registers, SBOM, source scans, no quarantined build context, and release fail-closed gates. |
| Synthetic fixtures become real account data | Shared dev credentials or real email addresses create needless privacy/security exposure. | Generated per-reset secrets, synthetic-only marker, reserved namespace, environment/database guard, and no production export. |

## Clean-room provenance boundary

The boundary is behavioral and technical, not merely a disclaimer. The vertical-slice service, its tests, the direct developer launch path, backups, signed-manifest fixtures, and future launcher must be reproducible from the declared clean-room source plus documented original/licensed dependencies. Nothing in the quarantined Drive/legacy corpus may be copied into source, generated assets, map/content definitions, protocol schemas, account records, test fixtures, build cache, CI runner, release package, manifest target, diagnostic bundle, or update repository.

A self-declared `sourceBoundary` field is insufficient. Before a content release is active, the content register should identify its source path/revision, SHA-256, creator/rights basis, review decision/date, allowed use, and approving role. The CI gate should compare the active `content_releases` hash with that record and reject absent, revoked, or non-runtime-approved entries. A separate do-not-use register should list prohibited legacy names, identifiers, domains, package names, binaries, cache extensions, artwork/audio fingerprints where available, and exact quarantine paths. It must be designed to prevent accidental inclusion without treating unverified reference material as a design specification. [8] [9] [10]

The project may retain a read-only inventory/checksum/review conclusion for unverified materials outside the product runtime. A later documented rights decision for a specific item requires a fresh provenance and technical review; it does not retroactively authorize a folder, archive, or related material. Until then, the correct implementation input is only newly authored or expressly licensed clean-room material.

## References

[1]: file:///home/ubuntu/2006scape-build/src/cleanroom-world/world.go "Copper Lantern clean-room world authority model"
[2]: file:///home/ubuntu/2006scape-build/src/cleanroom-world/world_test.go "Copper Lantern world authority tests"
[3]: file:///home/ubuntu/2006scape-build/src/cleanroom-client/beginner-guide-package.ts "Copper Lantern beginner guide package"
[4]: file:///home/ubuntu/2006scape-build/src/cleanroom-client/beginner-safe-area.ts "Copper Lantern beginner-safe area configuration"
[5]: file:///home/ubuntu/2006scape-build/src/cleanroom-client/player-appearance.ts "Copper Lantern player appearance model"
[6]: file:///home/ubuntu/2006scape-build/src/cleanroom-client/player-motion.ts "Copper Lantern player motion presentation layer"
[7]: file:///home/ubuntu/2006scape-build/src/cleanroom-client/world-detail-pass.ts "Copper Lantern world detail and overview presentation"
[8]: file:///home/ubuntu/2006scape-build/src/cleanroom-world/content/ashfen-expansion-v1.json "Copper Lantern Ashfen clean-room content declaration"
[9]: file:///home/ubuntu/2006scape-build/research/implementation-brief.md "Implementation Brief — 2006-Era Fantasy MMO Build"
[10]: file:///home/ubuntu/2006scape-build/research/launcher-review.md "Desktop Launcher / Bootloader Review for a Legally Safe RSPS-Like Game"
