# Clean-Room TypeScript/Electron Launcher Backlog

**Author:** Manus AI  
**Status:** Implementation-ready backlog for a development launcher; **not** authority to distribute a public product  
**Scope:** `apps/launcher`, `packages/assets-manifest`, `packages/test-fixtures`, project documentation, scripts, and CI files created by the clean-room project.

## Decision and delivery boundary

This backlog converts the launcher review into a small, defensible Electron implementation. The launcher installs and starts **only project-produced or expressly licensed artifacts** selected from the project’s signed update repository. It does not compile, import, package, wrap, download, inspect, or launch any supplied Drive corpus artifact, legacy client/cache, third-party game payload, proprietary protocol component, brand asset, or user-selected executable. The Drive corpus remains evidence-only and outside Git, package build contexts, release artifacts, and runtime paths. [1] [2]

The first working milestone is a **development-only proof of concept**: one original/synthetic game fixture for each supported platform, signed test update metadata, immutable full-package download, verified side-by-side installation, readiness-confirmed health promotion, and safe operational rollback. Production distribution remains blocked on the implementation brief’s ownership, provenance, product identity, privacy, platform-account, and signing-governance gates. [1]

> **Trust rule:** Transport security retrieves repository bytes. Threshold-signed TUF metadata authorizes a precise artifact. The Electron main process verifies and installs it. The renderer can display status and request a bounded operation, but it never selects a URL, path, executable, update version, or trust decision.

## Clean-room file plan

All files below are proposed new files beneath the clean-room repository. The prefix `example-game` is an internal placeholder and must be replaced only after product-name clearance. No file path references `/home/ubuntu/upload/combining.js`, the Drive inventory payloads, or a legacy runtime.

| Area | Clean-room files | Responsibility | Non-negotiable boundary |
|---|---|---|---|
| Launcher desktop application | `apps/launcher/src/main/main.ts`, `apps/launcher/src/main/windows.ts`, `apps/launcher/src/preload/index.ts`, `apps/launcher/src/renderer/*` | Electron lifecycle, locked-down window, typed status UI | Renderer has no Node integration, direct network, filesystem, shell, or child-process capability. |
| Trusted update core | `apps/launcher/src/main/updater/{update-service,tuf-client,selection-policy,downloader,verifier,installer,state-store,health,platform}.ts` | Metadata refresh, selection, download, artifact/package validation, slots, launch, rollback | All trusted decisions and writes run in main process only. |
| Shared contracts | `apps/launcher/src/shared/{schemas,types,errors}.ts` | Zod schemas, discriminated state, IPC request/status types | Shared contracts do not expose arbitrary paths, URLs, commands, or raw error data to the renderer. |
| Telemetry/privacy | `apps/launcher/src/main/telemetry/{consent,events,redaction,transport}.ts`, `apps/launcher/src/renderer/settings.tsx` | Local consent, event allowlist, local diagnostic export | Optional diagnostics are disabled until deliberate opt-in. |
| Update-metadata tooling | `packages/assets-manifest/src/{targets-custom,release-policy}.ts`, `packages/assets-manifest/schemas/targets-custom.schema.json`, `scripts/publish-metadata.ts` | Schema validation and artifact-first metadata publication | Production uses maintained TUF tooling; this package does not implement cryptographic signatures. |
| Synthetic fixtures | `packages/test-fixtures/launcher/{game-fixture,metadata,keys,packages}/` | Original test executable, invalid metadata/packages, non-production test keys | Fixtures contain only synthetic/project-created content; test private keys never ship. |
| Release checks | `scripts/{verify-release,generate-sbom,verify-provenance}.ts`, `.github/workflows/{launcher-ci,launcher-release}.yml` | Clean release verification, SBOM/provenance, approval-gated promotion | Release workflow requests signing from a controlled service; it does not store exportable production keys. |
| Documentation/runbooks | `docs/security/{launcher-threat-model,update-key-custody,rollback-runbook,key-compromise-runbook}.md`, `docs/privacy/launcher-privacy.md`, `docs/release/launcher-packaging.md` | Security owner, incident response, retention, platform release proof | Documentation must retain the clean-room exclusions and release gates. |

### Runtime directory layout

The application writes only under an application-owned user-data root. Installer packages are placed by the operating system in their normal platform locations; the launcher does not self-elevate or alter system security settings.

```text
<app-data>/
├── state.json                 # atomically replaced, mode 0600 where supported
├── state.json.bak             # last parseable state; never a trust bypass
├── metadata/                  # TUF client cache and trusted-root state
├── downloads/                 # restrictive temporary files; deleted after terminal outcome
├── staging/<releaseId>/       # extraction only; never executable as an active slot
├── versions/<releaseId>/      # complete, verified, immutable-by-launcher version slot
├── preferences/               # user settings, including telemetry consent
├── user-data/                 # game data, separate from release slots
└── logs/                      # local, redacted, retention-bounded logs
```

`releaseId` is an opaque, immutable ASCII identifier validated by schema (`^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`). It is never treated as a path fragment before validation. The launcher rejects symlinks, hard-link escapes where detectable, duplicate paths after normalization, absolute paths, `..` traversal, and entries outside a staging/slot root during archive extraction.

## Architecture and security boundary

### Electron process model

`main.ts` creates a single primary window with `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` where compatible, a restrictive Content Security Policy, no remote module, and navigation plus `window.open` deny-by-default handlers. The UI is bundled locally; it must not load release notes, remote HTML, or game content into a privileged BrowserWindow. Human-readable release notes are rendered as sanitized plain text or a tightly sanitized local representation and have no authority over update or launch actions. [2]

`preload/index.ts` exposes a frozen `window.launcher` object with only these methods:

```ts
getStatus(): Promise<LauncherStatus>
checkForUpdate(): Promise<CommandResult>
downloadApprovedUpdate(): Promise<CommandResult>
installApprovedUpdate(): Promise<CommandResult>
launch(): Promise<CommandResult>
retryHealthCheck(): Promise<CommandResult>
getPrivacySettings(): Promise<PrivacySettings>
setOptionalDiagnostics(enabled: boolean): Promise<CommandResult>
exportSupportDiagnostics(): Promise<SupportExportResult>
onStatus(listener: (status: LauncherStatus) => void): Unsubscribe
```

Each IPC handler validates a fixed request schema, binds the request to the current main-process state, applies rate limits, and returns a typed error code without unredacted filesystem paths, URLs, tokens, or stack traces. There is intentionally no IPC endpoint for `exec`, arbitrary URL fetch, raw filesystem access, opening a user-provided game directory, loading plug-ins, modifying another process, changing certificate validation, or bypassing signature checks.

### Signature-verification boundary

The project must use a maintained JavaScript/TypeScript TUF client after dependency/security review. `tuf-client.ts` is a narrow adapter around that library. It must not reimplement canonicalization, key-ID calculation, Ed25519, threshold signature verification, root rotation, expiry, or delegated-role verification. Node `crypto` is limited to streamed local digest comparison when required by the artifact verifier; it is not a substitute for TUF trust-chain verification. [2]

| Step | Owner | Required assertion | Failure behavior |
|---|---|---|---|
| Bootstrap trust | Packaged launcher / TUF client | Embedded, versioned root metadata and approved root public keys are present. A root rotation has required signatures from both old and new root rules. | Stop update flow. Do not accept downloaded replacement root metadata outside TUF rules. |
| Refresh metadata | `tuf-client.ts` in main process | Validate `timestamp`, `snapshot`, `targets`, and delegated targets in TUF order, threshold, version, expiry, hashes/lengths, role delegation, and persistent anti-rollback state. | Retain current verified slot; show a non-sensitive update-verification error. |
| Select target | `selection-policy.ts` in main process | Match exactly one target on product, stable channel, platform, architecture, compatible launcher version, package format, and signed security floor. | Reject ambiguity, mismatch, stale/minimum-violating release, or unsupported migration. |
| Retrieve target | `downloader.ts` in main process | Use HTTPS only, allowlisted origins only, redirects disabled or revalidated at each hop, restrictive temp file, byte cap equal to metadata length. | Delete partial temp file; leave active slot untouched. |
| Verify package | `verifier.ts` and platform adapter in main process | Exact byte length and SHA-256 match signed target metadata; archive structure is safe; native package signature/publisher policy passes platform checks. | Delete staging/download; do not extract or launch. |
| Activate and launch | `installer.ts` and `health.ts` in main process | Fully verified slot has been atomically made current; executable path and fixed arguments derive only from slot manifest. | Use last known-good slot or recover state; never launch unverified staging. |

The TUF repository must have independently scoped root, timestamp, snapshot, and targets/delegated-targets roles. The development repository can use clearly labeled ephemeral test keys. Production key custody, threshold, rotation, revocation, and recovery procedures are tracked below and require an owner-approved design review before stable distribution. [2]

## Signed target custom manifest schema

Production update metadata is standard TUF metadata; this project-specific payload lives only in each TUF `targets` entry’s `custom` object. It is therefore covered by the verified targets/delegated-targets signature, snapshot, timestamp, version, and expiration checks. It is **not** a free-standing `latest.json`, and it is never trusted because it arrived over TLS.

The schema shall be implemented at `packages/assets-manifest/schemas/targets-custom.schema.json`, with a matching Zod schema in `packages/assets-manifest/src/targets-custom.ts`. The TUF adapter must separately enforce all standard TUF fields, including target path, target length, and target hashes. A schema-valid target is not sufficient unless its enclosing TUF chain verifies.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schemas.example-game.invalid/launcher/targets-custom/v1.json",
  "title": "Example Game launcher target custom metadata v1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion", "product", "channel", "gameVersion", "releaseId",
    "launcherMinVersion", "platform", "arch", "format", "protocolVersion",
    "contentSchemaVersion", "publisher", "health", "security"
  ],
  "properties": {
    "schemaVersion": { "const": 1 },
    "product": { "const": "example-game" },
    "channel": { "enum": ["stable", "beta", "development"] },
    "gameVersion": {
      "type": "string",
      "pattern": "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?$"
    },
    "releaseId": { "type": "string", "pattern": "^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$" },
    "launcherMinVersion": { "type": "string", "minLength": 1, "maxLength": 64 },
    "platform": { "enum": ["win32", "darwin", "linux"] },
    "arch": { "enum": ["x64", "arm64"] },
    "format": { "enum": ["msix", "exe", "msi", "dmg", "pkg", "deb", "rpm", "appimage"] },
    "protocolVersion": { "type": "integer", "minimum": 1 },
    "contentSchemaVersion": { "type": "integer", "minimum": 1 },
    "publisher": {
      "type": "object",
      "additionalProperties": false,
      "required": ["displayName", "platformIdentity"],
      "properties": {
        "displayName": { "type": "string", "minLength": 1, "maxLength": 200 },
        "platformIdentity": { "type": "string", "minLength": 1, "maxLength": 512 }
      }
    },
    "health": {
      "type": "object",
      "additionalProperties": false,
      "required": ["readyTimeoutSeconds", "stabilityWindowSeconds", "maxConsecutiveStartFailures"],
      "properties": {
        "readyTimeoutSeconds": { "type": "integer", "minimum": 15, "maximum": 300 },
        "stabilityWindowSeconds": { "type": "integer", "minimum": 30, "maximum": 900 },
        "maxConsecutiveStartFailures": { "type": "integer", "minimum": 1, "maximum": 3 }
      }
    },
    "security": {
      "type": "object",
      "additionalProperties": false,
      "required": ["minimumAllowedReleaseId", "rollbackOf"],
      "properties": {
        "minimumAllowedReleaseId": { "type": "string", "pattern": "^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$" },
        "rollbackOf": { "type": ["string", "null"], "pattern": "^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$" }
      }
    },
    "migration": {
      "type": "object",
      "additionalProperties": false,
      "required": ["required", "kind"],
      "properties": {
        "required": { "type": "boolean" },
        "kind": { "enum": ["none", "user-data-compatible", "manual-support-required"] }
      }
    },
    "releaseNotes": {
      "type": "object",
      "additionalProperties": false,
      "required": ["text"],
      "properties": { "text": { "type": "string", "maxLength": 12000 } }
    }
  }
}
```

The installer’s `slot-manifest.json` is generated locally only after the TUF target and package validation pass. It records normalized release identity, the verified target path/hash/length, extracted file list and hashes, package identity result, install time, and the fixed relative launch executable. It is not a new signature authority and cannot authorize an artifact on its own. Its role is recovery, audit, and pre-launch structural validation.

## Atomic slots and durable state

### Slot transaction

Full immutable packages are the only update mechanism in the first release. Differential patches, in-place writes to the active release, executable self-modification, arbitrary post-install commands, plug-ins, and background auto-start are out of scope. [2]

| Transaction stage | Required operation | Durability / security condition | Recoverable result |
|---|---|---|---|
| `checking` | Refresh and verify TUF chain, select one target. | Persist trusted metadata state through TUF client before target use. | Existing active slot remains launchable. |
| `downloading` | Create new temp file in `<app-data>/downloads`; stream bytes while updating SHA-256 and enforcing exact length. | Owner-only directory/permissions where supported; no executable bit; delete on mismatch. | Partial files are untrusted and disposable. |
| `verifying` | Verify digest/length, safe archive structure, and platform package signature/publisher. | No extraction or activation before all checks pass. | Existing active slot remains launchable. |
| `staging` | Extract into a new unique staging directory; reject links/escape paths; verify declared structure/file list. | Write and `fsync` extracted files/directories where platform APIs permit. | Delete failed staging tree. |
| `slot-ready` | Write local slot manifest, flush it, then rename staging directory to `versions/<releaseId>` on the same filesystem. | Rename is atomic only within one filesystem; never cross-volume move. | A complete slot exists or no slot exists. |
| `activating` | Atomically replace `state.json` with a new state that sets candidate/current and preserves previous/lastKnownGood. | Write `state.<random>.tmp` mode 0600, flush file, rename, then flush parent directory where supported. | On restart, state parser picks valid primary or last valid backup; it never activates staging. |
| `launching` | Resolve fixed executable from verified slot manifest, ensure it is still beneath slot root, spawn with fixed arguments. | No shell; `shell: false`; sanitized environment; current-user privileges only. | Candidate health evaluation begins. |

State updates use a monotonic `stateRevision` and checksum (integrity/corruption detection, not a replacement for signed metadata). The launcher validates state against a Zod schema before use. A corrupt state file causes a recovery UI that enumerates only complete locally verified slot manifests and prefers a signed-security-floor-compliant last-known-good slot. It never scans arbitrary directories or accepts a user-provided executable as recovery input.

```ts
interface LauncherStateV1 {
  schemaVersion: 1;
  stateRevision: number;
  channel: "stable" | "beta" | "development";
  current: ReleaseRef | null;
  candidate: CandidateRef | null;
  previous: ReleaseRef | null;
  lastKnownGood: ReleaseRef | null;
  highestTrustedMetadata: Record<string, number>;
  minimumAllowedReleaseId: string | null;
  updatedAt: string;
}

interface ReleaseRef {
  releaseId: string;
  targetPath: string;
  gameVersion: string;
  platform: "win32" | "darwin" | "linux";
  arch: "x64" | "arm64";
  verifiedAt: string;
}

interface CandidateRef extends ReleaseRef {
  startedAt: string | null;
  readyAt: string | null;
  consecutiveStartFailures: number;
  healthStatus: "pending" | "ready" | "healthy" | "failed" | "rolled-back";
}
```

## Rollback health check and launch protocol

A candidate slot is **verified** after metadata, target, package, structure, and activation checks. It is **last known good** only after a game process launched from that slot proves readiness and survives its signed stability window. Verification and health are intentionally separate states.

The original game fixture/client must provide a local readiness proof over an ephemeral loopback IPC endpoint created by the launcher. The launcher passes a one-time, random 256-bit nonce using a controlled inherited handle or private argument/environment mechanism appropriate to the platform; it does not expose the endpoint outside loopback or log the nonce. The client sends one schema-validated message only after its own startup checks complete:

```json
{
  "type": "launcher.ready.v1",
  "releaseId": "2026.09.11.1",
  "protocolVersion": 1,
  "nonce": "base64url-one-time-value"
}
```

The health service checks the nonce with constant-time comparison, exact candidate `releaseId`, expected protocol version, process identity/exit state, and timeout. A message cannot mark an unrelated or older release healthy. The launcher then watches the process through the signed `stabilityWindowSeconds`. It marks `lastKnownGood` only after that window completes without unexpected exit.

| Event | Launcher behavior | State effect |
|---|---|---|
| Candidate does not send valid readiness before timeout | Kill only the candidate process, record one failed start, retain previous slot. | Candidate remains not-good; failure count increments. |
| Candidate exits before stability window | Record one failed start; preserve redacted local diagnostic record if enabled. | Candidate remains not-good; failure count increments. |
| Candidate reaches stability window | Promote candidate to `lastKnownGood`; clear candidate failure count. | `current` and `lastKnownGood` become candidate. |
| Failures reach signed `maxConsecutiveStartFailures` | Select `previous` or `lastKnownGood` only if its slot manifest validates and it complies with the signed security floor. Show versioned explanation and explicit retry/reinstall actions. | Mark candidate `rolled-back`; active selection becomes approved prior slot. |
| Prior slot is below signed minimum or withdrawn | Do not auto-launch it. Direct user to signed replacement/recovery path and status information. | Launcher remains safe but unavailable until approved release is acquired. |
| Launcher dies at any transaction point | On restart, remove incomplete temp/staging paths, parse durable state, revalidate referenced slot manifest before launch. | Never assume candidate health; last known-good remains preferred. |

An **operational rollback** is a locally installed, verified, security-floor-compliant prior slot after candidate failure. It is not permission to accept stale TUF metadata or a downgraded vulnerable build. A security withdrawal is performed by new threshold-signed metadata that removes or supersedes the affected target and raises the signed minimum release policy when necessary. [2]

## Concrete backlog

The following tickets are ordered by dependency. Story-point estimates are deliberately omitted; sizing depends on the selected maintained TUF library, packaging toolchain, and supported platform matrix.

| ID | Priority | Depends on | Deliverable | Acceptance criteria |
|---|---|---:|---|---|
| LCH-001 | P0 | — | **Clean-room launcher charter and exclusions.** Create `apps/launcher/README.md`, `docs/security/launcher-threat-model.md`, and update provenance/quarantine registers. | Repository scan and CI prove that no Drive archive, proprietary client/cache/protocol note, third-party brand, or `/upload` payload is in source, fixtures, build context, or release artifacts. Charter bans plug-ins, arbitrary game paths, injection, process manipulation, privileged services, and security-control bypasses. |
| LCH-002 | P0 | LCH-001 | **Electron/TypeScript hardened shell.** Establish package manager lockfile, Electron Forge/equivalent maintained packaging, main/preload/renderer structure, CSP, and static UI. | Automated inspection asserts `contextIsolation: true`, `nodeIntegration: false`, no `remote`, navigation/window creation deny-by-default, and no renderer import of Node, `child_process`, or `fs`. App starts from a synthetic local fixture only. |
| LCH-003 | P0 | LCH-001 | **Shared schemas and typed IPC.** Implement `LauncherStatus`, commands, typed errors, Zod validation, and a frozen preload bridge. | Fuzzed/malformed IPC cannot cause shell, filesystem, network, path, or update-policy execution. Renderer receives status only; every method is allowlisted and schema-validated. |
| LCH-004 | P0 | LCH-001 | **TUF dependency decision and root bootstrap.** Select a maintained TUF JS/TS client; document version, license, update cadence, and supported root rotation behavior. Add development root metadata/test public keys. | A test can refresh valid root metadata and rejects wrong key ID, bad signature, insufficient root threshold, expired root, and invalid dual-signature root rotation. No private production key appears in repository, test artifact, environment file, or CI log. |
| LCH-005 | P0 | LCH-004 | **TUF adapter and update policy.** Implement `tuf-client.ts` and persisted trusted-metadata versions. | Adapter validates root → timestamp → snapshot → targets/delegations, thresholds, expiry, version monotonicity, hash/length bindings, and metadata cache. It rejects stale/freeze, mix-and-match, replay, wrong role, expired, and unauthorized metadata fixtures. |
| LCH-006 | P0 | LCH-005 | **Signed target custom schema and selector.** Implement the JSON/Zod schema above and `selection-policy.ts`. | Only exactly one target that matches product/channel/platform/arch/launcher version/package format/security floor is chosen. Unknown custom fields, noncanonical release IDs, invalid SemVer, ambiguous targets, stale minimum, unsupported migration, and cross-channel targets fail closed. |
| LCH-007 | P0 | LCH-006 | **Artifact-first publish tooling.** Implement `scripts/publish-metadata.ts` using test signing service interfaces and release record inputs. | Pipeline uploads immutable artifacts, independently recomputes hashes/lengths, validates custom schema, signs targets then snapshot then timestamp, and exposes timestamp last. Promotion reuses byte-identical beta artifact; stable cannot silently consume beta metadata/key authority. |
| LCH-008 | P0 | LCH-006 | **Bounded downloader.** Stream allowlisted HTTPS target bytes to restrictive temporary storage. | Test server proves exact-length/hash success and rejects wrong origin, redirect, HTTP, extra bytes, short bytes, timeout, resume mismatch, disk error, and process kill. Partial bytes never appear in a version slot or executable path. |
| LCH-009 | P0 | LCH-008 | **Artifact/package verifier.** Implement streamed digest check, archive/extraction safety, fixed slot launch manifest generation, and platform-adapter contract. | Fails closed for changed bytes/length, zip-slip/path traversal, absolute path, duplicate normalized path, symlink escape, missing declared executable, unsigned/tampered package, wrong publisher, and wrong package identity. No hand-written signature-verification implementation is introduced. |
| LCH-010 | P0 | LCH-009 | **Atomic slots and state store.** Implement same-filesystem staging, slot rename, atomic state replacement, recovery, and slot garbage-collection policy. | Fault-injection tests terminate launcher during every state transition. A fresh restart has either the prior complete slot or a complete new slot; it never launches staging/partial files. User preferences and `user-data` persist across code rollback. |
| LCH-011 | P0 | LCH-010 | **Launch allowlist and health protocol.** Implement fixed launch descriptor, no-shell spawn, loopback readiness handshake, stability timer, and failure accounting. | A valid synthetic fixture becomes last known good only after nonce/release/protocol readiness and full stability window. Wrong nonce, wrong release, malformed handshake, timeout, early exit, orphan process, and process crash do not promote a candidate. |
| LCH-012 | P0 | LCH-011 | **Operational rollback and security floor.** Implement rollback selector, candidate crash loop threshold, signed minimum policy, and recovery UI. | At the signed threshold, launcher returns only to a verified floor-compliant prior slot and shows versions/reason. It refuses automatic downgrade to withdrawn/below-floor slot and preserves data/settings. A manual retry cannot reset anti-rollback metadata state. |
| LCH-013 | P1 | LCH-002, LCH-009 | **Windows package lane.** Produce original game/launcher MSIX as primary output; optionally document signed EXE/MSI bootstrapper only if needed. | Development: package identity/signature validation fixture passes. Production gate: package/installers timestamp-signed, subject identity matches signed target policy and legal identity, clean Windows VM installation/launch/update/rollback passes, and signing audit record is attached. |
| LCH-014 | P1 | LCH-002, LCH-009 | **macOS package lane.** Produce universal or per-architecture `.app` distributed in `.dmg`/`.pkg`. | Development: nested-code identity adapter fixture passes. Production gate: every nested component is Developer ID-signed with Hardened Runtime, notarized, stapled, validated on clean Intel and/or Apple Silicon targets, and identity matches signed target policy. |
| LCH-015 | P1 | LCH-002, LCH-009 | **Linux package lane.** Produce `.deb`/`.rpm` signed repository packages for supported distributions; keep AppImage optional and explicit. | Repository metadata/package signature and fingerprint verification pass. Portable AppImage has detached signature plus hash verification and defaults auto-update off. No `curl | sh` installer, elevation, security exception, or arbitrary package repository is used. |
| LCH-016 | P0 | LCH-003 | **Privacy-by-default controls.** Implement local consent, settings, allowlisted events, redaction, and visible support-diagnostics export. | First run defaults optional diagnostics/crash reports/product analytics to off. Enabling is explicit, revocable, and equally presented with “Not now.” Network tests prove opt-out sends no optional event; support bundle has visible/redacted contents and requires a user click. |
| LCH-017 | P1 | LCH-016 | **Operational telemetry transport and retention.** Implement only after privacy owner approves a notice, endpoint, processor/access model, and retention schedule. | Schema permits only `{releaseId, stage, result, coarseOS, errorClass, coarseTimestamp}` plus rotating non-advertising install pseudonym when truly required. It rejects accounts/emails/IP persistence, paths, tokens, hardware fingerprints, memory dumps, chat, screenshots, and game content. Automated retention/deletion/access tests pass. |
| LCH-018 | P0 | LCH-004–LCH-012 | **Fixture matrix and deterministic integration tests.** Build entirely synthetic valid and malicious repository/package/game fixtures. | CI runs offline/locally against fixtures and covers all P0 negative paths in the verification matrix below. Fixtures include no production signing material or unapproved content. |
| LCH-019 | P1 | LCH-007, LCH-013–LCH-015 | **Release engineering gates.** Add SBOM, provenance, dependency/license/secret scanning, source/build provenance, immutable artifact record, branch protections, and release approval workflow. | Release fails if provenance/register incomplete, prohibited identifiers found, lockfile differs, SBOM fails, metadata/schema invalid, package identity mismatch, no clean-machine proof, or required approvals/audit record absent. Signing is performed via scoped workload identity/HSM/managed signing service, not CI-held long-lived secrets. |
| LCH-020 | P1 | LCH-012, LCH-019 | **Incident and recovery drills.** Write and exercise rollback, target withdrawal, key compromise/root rotation, repository outage, and recovery-installer procedures. | Tabletop plus test-repository drill produces retained evidence. Root/release key compromise can be disabled, threshold rotation published, bad target removed, status notice issued, and a separately platform-signed recovery installer verified without deleting user data. |

### Milestones and release gates

| Milestone | Included tickets | Demonstrable outcome | Gate to advance |
|---|---|---|---|
| M0 — Clean-room basis | LCH-001–003 | Hardened local Electron UI and fixed synthetic fixture launch. | Clean-room/provenance policy passes; no update/network distribution. |
| M1 — Verified update proof | LCH-004–009, LCH-018 | Valid signed development update installs; all malformed metadata/artifact cases fail closed. | TUF and verifier tests pass from clean environment. |
| M2 — Recovery proof | LCH-010–012, LCH-018 | Interruption-safe A/B slots with readiness-confirmed promotion and bounded rollback. | Fault injection proves preservation of an approved last known-good slot and security floor. |
| M3 — Release candidates | LCH-013–015, LCH-019 | Platform-native development packages plus clean-machine validation evidence. | Legal/product/platform signing accounts, provenance, SBOM, and release controls approved. |
| M4 — Controlled-alpha readiness | LCH-016–017, LCH-020 | Privacy-default launcher, documented diagnostics, recovery and key-compromise drills. | Privacy notice/owner, retention controls, incident owner, and production signing governance approved. |

## Platform packaging backlog policy

The launcher itself and every game package/installer are independently signed. Repository verification is not replaced by platform signing, and platform signing is not replaced by repository verification. The platform adapter verifies native identity only after target metadata selects the expected `publisher.platformIdentity`; it does not parse untrusted metadata as a command.

| Platform | Initial supported packaging contract | Main-process adapter checks | Production evidence required |
|---|---|---|---|
| Windows | Signed MSIX/MSIX bundle; signed EXE/MSI only where documented deployment need exists. | Platform, x64/arm64 match, MSIX publisher/identity equals signed target policy, valid trusted signature/timestamp according to Windows APIs. | Certificate/signing audit; package identity match; install, update, rollback, uninstall behavior on a clean supported Windows VM. |
| macOS | Signed and notarized `.app` in stapled `.dmg` or signed `.pkg`; universal or separately targeted binaries. | Expected architecture, Developer ID team/subject identity, nested-code validation result, notarization/Gatekeeper validation result. | Developer ID and Hardened Runtime proof, notarization/stapling log, clean Mac validation; no user instruction to bypass Gatekeeper. |
| Linux | Signed `.deb`/`.rpm` repository for named distributions; AppImage only as a separately signed portable path. | Expected package manager/repository signature or detached portable signature, fingerprint policy, architecture. | Repository metadata/package signature proof; independently published fingerprint; clean supported distro update/rollback procedure. |

A normal launcher runs as the current user. It does not install drivers, kernel extensions, background agents, broad firewall rules, antivirus exclusions, or privileged services. It never tells users to disable SmartScreen, Gatekeeper, antivirus, or other operating-system safeguards. [2]

## Privacy defaults and data contract

The core launcher works without telemetry. The default first-run setting is `optionalDiagnostics: false`, `crashReports: false`, and `productAnalytics: false`. There is no advertising identifier, persistent hardware fingerprint, account linkage, or background collection. Essential local update state exists to complete the update transaction; it stays on device unless the user explicitly sends diagnostics or a separately approved narrowly scoped essential-health event is enabled by documented policy. [2]

| Data operation | Default | Permit only if | Must never contain |
|---|---|---|---|
| Local launcher logs | On, local and bounded | Redaction runs before write; retention limit is enforced; user can inspect/export relevant support material. | Passwords, admission/session tokens, authorization headers, full URLs with query data, raw user paths, account details, chat, game content. |
| Update-health event | Off until privacy/reliability decision is approved | An allowlisted, minimized schema, TLS, access controls, rotating pseudonym only if essential, documented 30-day-or-less retention subject to legal review. | IP address retention, email/account ID, advertising/device fingerprint, installed-app inventory, hardware serials, raw error payload. |
| Crash reporting | Off | Separate informed opt-in, preview/category explanation, secret scrubber, sampling, short retention, user revocation. | Full memory dumps, screenshots, save data, local files, chat, keystrokes, raw network payloads. |
| Product analytics | Off | Informed, revocable opt-in with purpose/retention documented. | Session replay, unrelated SDK collection, data sale/sharing, account-linked behavioral profile. |
| Support diagnostic bundle | User initiated only | Local ZIP manifest lists content; redaction complete; user picks destination and separately chooses upload. | Silent upload, remote access, credentials/tokens, unredacted raw log archive. |

The privacy settings screen gives equal visual weight to **Share optional diagnostics** and **Not now**, immediately explains each category, provides a privacy-notice link, and supports withdrawal at any time. Any server collection must be separately designed for purpose limitation, data minimization, retention, access control, deletion/access requests, and relevant jurisdictional requirements. [2]

## Verification matrix

LCH-018 must classify tests by assurance layer. Unit tests alone do not prove platform trust or interruption recovery; clean-environment integration tests and platform virtual-machine tests are required before a platform is release-ready.

| Layer | Required test cases | Pass condition |
|---|---|---|
| Schema/unit | Custom metadata validation; SemVer/release ID validation; status/IPC schemas; state migration; redaction; no unknown fields; target selection. | Inputs outside schema/policy fail closed and return stable, non-sensitive error codes. |
| TUF trust integration | Valid chain; expired timestamp/snapshot/targets; stale metadata version; freeze/replay; bad root rotation; wrong delegated role; unauthorized key; insufficient threshold; mix-and-match hash/version. | Only a current, complete threshold-signed chain produces a candidate target. |
| Network/downloader | HTTPS allowlist; redirect; wrong origin; proxy/certificate error; slow stream; oversized/short stream; changed byte; disconnect/resume; disk full. | Incomplete/untrusted bytes are deleted or quarantined and never reach a slot. |
| Artifact/install | Exact digest/length; archive traversal; absolute/duplicate normalized path; symlink/hard-link escape; tampered native package; publisher mismatch; wrong OS/arch; missing fixed launch target. | No invalid artifact can be extracted, activated, or launched. |
| Durability/fault injection | Kill/power-loss simulation during download, verify, extraction, slot rename, every state write, activation, spawn, readiness, and garbage collection. | Restart preserves a parseable state and a valid last known-good slot; staging is never executable. |
| Health/rollback | Valid readiness; wrong/expired nonce; wrong release/protocol; readiness timeout; early crash; crash-loop threshold; previous slot absent; below-floor prior slot; withdrawn target. | Promotion occurs only after valid stable health; rollback only selects verified floor-compliant release. |
| Electron/IPC security | Renderer script attempts navigation, popup, direct Node API, unbounded IPC, arbitrary command/path/URL, release-notes markup injection. | All attempts are blocked; no privileged action or policy modification occurs. |
| Privacy | Default first run; opt-in; opt-out after opt-in; crash disabled; support export; redaction corpus containing secrets/paths/tokens. | Optional telemetry performs no network request without consent; export is user initiated and redacted. |
| Platform VM | Windows package identity/signature; macOS code signature/notarization/staple; Linux repository/portable signature; clean install/update/rollback. | OS-native trust checks pass for supported targets, identity matches signed policy, and no bypass/elevation instruction is needed. |
| Release/operational | SBOM/provenance; reproducibility/pinned lockfile; signing audit; stale/bad target withdrawal; root/release key compromise; repository outage; recovery installer. | Release gate rejects missing evidence; drill restores an approved update path and preserves user data. |

## Definition of done and deferred work

A backlog item is complete only when its code, documentation, tests, synthetic fixtures, and CI gate are merged together; reviewers can reproduce the result without unapproved content; and its failure case preserves the existing verified release or fails safely. A stable release additionally requires a legal/provenance record, approved privacy and incident owners, platform signing evidence, SBOM/provenance, clean-machine test evidence, and release-approval audit trail. [1] [2]

The following are explicitly deferred: binary/differential patches; plug-in loading; portable arbitrary executable launch; multiple unreviewed mirrors; background autostart; auto-elevation; custom crypto; custom TUF signature verification; self-modifying code; anti-cheat drivers; injection/hooking/memory or packet modification; VM/debugger evasion; and all integration with legacy or Drive-originated game material. Any proposal to add one requires a fresh threat, privacy, legal/provenance, and release-governance review.

## References

[1]: file:///home/ubuntu/2006scape-build/research/implementation-brief.md "Implementation Brief — 2006-Era Fantasy MMO Build"
[2]: file:///home/ubuntu/2006scape-build/research/launcher-review.md "Desktop Launcher / Bootloader Review for a Legally Safe RSPS-Like Game"
[3]: file:///home/ubuntu/2006scape-build/research/drive-inventory.md "2006scape RSPS Build — Google Drive Inventory"
