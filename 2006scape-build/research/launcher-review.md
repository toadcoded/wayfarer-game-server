# Desktop Launcher / Bootloader Review for a Legally Safe RSPS-Like Game

**Author:** Manus AI  
**Purpose:** Security, distribution, privacy, and implementation requirements for an independently owned desktop game and its launcher.  
**Status:** Recommended baseline for design review; obtain qualified local legal advice before release.

## Executive conclusion

A launcher for an **independently developed, RSPS-like game** can be engineered as a conventional signed desktop application, but it should be treated as a high-value software-delivery component rather than a simple downloader. Its minimum security boundary is: a signed, independently built launcher verifies signed update metadata; it verifies the exact artifact hash, length, platform, and publisher identity before installation; it installs atomically; and it can recover from a bad release without silently reintroducing a known-vulnerable version. Transport Layer Security (TLS) is necessary but is not an update-authenticity control by itself.

The project should use only original or appropriately licensed game code, art, audio, names, and network services. It must not ship, wrap, modify, download, or depend on a proprietary publisher's client, cache, assets, protocol implementation, credentials, or anti-cheat. It must not offer bypass, injection, memory modification, process concealment, debugger evasion, or techniques intended to defeat a publisher's technical controls. The cited Jagex terms are an especially clear example of why a project should maintain that separation: they reserve intellectual-property rights, prohibit replacement or modified client/server software and server emulators, and restrict bypassing technical measures.[6] [7] This document is therefore a product-security specification, not an opinion that a particular game concept, name, content set, or distribution is legally permissible.

The practical recommendation is an **Electron + Node/TypeScript** launcher with a small main-process updater, a TUF-compatible update repository, platform-native code signing, and opt-in, minimal operational telemetry. Electron is suitable where a TypeScript desktop UI is desired, provided the updater and renderer are deliberately separated. Electron itself advises signing distributed applications and notes that macOS automatic update support requires a signed application.[2]

## Scope, decision gate, and non-negotiable product boundary

For this review, *RSPS-like* means a game that may evoke a classic browser/MMORPG progression style but is independently authored and operated. The launcher may install and start only binaries and assets produced by the project or received under a written license that expressly permits the intended redistribution, modification, and commercial use. The project should retain a software bill of materials (SBOM), source provenance, and license record for every shipped component.

Before implementing the launcher, the release owner should complete a documented legal/content clearance gate. That gate should confirm original branding; clear ownership or licenses for all code and media; no use of another publisher's client, cache, game data, account system, or network protocol specification derived through prohibited reverse engineering; trademark clearance; privacy notices; consumer-law and age/parental-consent review where applicable; and takedown/contact procedures. A replacement name and visual identity are not enough if underlying copyrighted code or assets are copied.

| Allowed design direction | Do not do | Why the distinction matters |
|---|---|---|
| Ship a launcher and game executable compiled from project-owned source, plus original or licensed content. | Bundle, download, patch, deobfuscate, wrap, re-host, or launch a proprietary client, cache, asset archive, or executable. | A launcher cannot cure infringement or a license breach in the payload it distributes. |
| Use a clean-room, documented protocol designed by the project for its own servers. | Copy, infer from proprietary code, or imitate an official service's proprietary protocol, authentication, or update format where that work is restricted. | Technical compatibility work can create contractual and intellectual-property risk; obtain counsel before relying on any interoperability exception. |
| Operate fair-play controls on the project's own service: server-side validation, rate limits, account moderation, and clear rules. | Build or distribute anti-cheat bypasses, injectors, DLL loaders, memory readers/writers, packet manipulation, automation/bots, VM or debugger detection designed to evade another product's controls, or instructions for defeating them. | These features are inappropriate for a legally safe launcher and materially raise abuse, contractual, and anti-circumvention risk. |
| Refer to the product using its independently cleared name. | Use third-party game names, logos, trade dress, screenshots, music, or marketing copy in the launcher or distribution listing without permission. | Disclaimers do not substitute for trademark or copyright clearance. |

The legal boundary should be enforced technically. The launcher allowlist should contain only the project’s own HTTPS repository domains and public keys. It should not accept arbitrary game URLs, user-supplied executable paths, plug-in DLLs, or unsigned “community mirrors.” It should not scan for, modify, or attach to other games’ processes.

## Security objectives and threat model

The security objective is to ensure that a user who installs a genuine launcher runs only a release authorized by the project, for the correct operating system and CPU architecture, while preserving a working prior release if the new one fails. The system should resist a compromised content-delivery network (CDN), a malicious mirror, TLS termination misconfiguration, a replayed old manifest, a repository signing-key compromise, a corrupted partial download, a faulty release, and a compromised CI worker. It cannot fully protect a host already controlled by local malware, but signed packages and native platform protections materially improve provenance and user warning behavior.

The Update Framework (TUF) is a useful model because it adds trusted keys, artifact hashes, metadata signatures, monotonically increasing versions, and expiration to update decisions. Its documented threat model includes freeze attacks, rollback attacks, mix-and-match attacks, and repository/key compromise.[1] The launcher should implement TUF using a maintained implementation where feasible instead of inventing a format and verifier. A simple `latest.json` protected only by HTTPS or a single static signature is insufficient.

| Threat | Required mitigation | Launcher decision |
|---|---|---|
| CDN/mirror serves altered executable | Verify trusted metadata signature, artifact length, and SHA-256/SHA-512 before activation; retain HTTPS and certificate validation. | Reject; display a non-sensitive verification error; do not execute. |
| Attacker replays an older valid release | Enforce TUF metadata versions and expiry; persist the highest trusted metadata version and enforce a signed minimum acceptable version. | Reject stale metadata or artifact unless a specific signed rollback policy authorizes it. |
| One online key is compromised | Use delegated roles and thresholds; keep root and release-approval keys offline/HSM-backed; rotate and revoke through signed root metadata. | Do not let a single online CDN/upload credential authorize every platform. |
| Partial/corrupt download or disk interruption | Download into a restrictive temporary directory; hash before use; atomically rename a complete version directory; never patch the live executable in place. | Preserve the current version and retry. |
| Bad release/crash loop | Use staged channels, post-launch health confirmation, A/B installs, and an approved rollback record. | Switch to the previous verified slot after a bounded failure threshold; show the user what happened. |
| Compromised build runner/dependency | Reproducible/pinned builds where practical; lockfiles, dependency review, SBOM, protected release pipeline, isolated signing, two-person approval. | Fail release promotion; revoke affected metadata/artifacts if needed. |
| Renderer or content compromise | Keep update verification and filesystem writes in the Electron main process; expose a narrow, validated IPC API; do not enable Node integration for remote/HTML content. | Treat UI content as untrusted and never let it choose arbitrary update paths. |

## Secure update architecture

### Trust roots and key custody

The installed launcher must embed an initial **root metadata** document and its root public keys. Root metadata identifies the signing keys, thresholds, and roles that are trusted to rotate trust. Use modern, well-reviewed signatures such as Ed25519, a canonical serialization defined by the TUF implementation, and separate keys for separate purposes. Do not reuse the TLS private key, Windows/Apple signing key, database credentials, or server-authentication key for update signing.

A defensible initial layout is a three-of-five offline root threshold; a two-of-three offline release/targets threshold; an online timestamp key in a hardware security module (HSM) or managed key vault; and delegated targets keys per product/channel/platform. The exact number may be reduced for a very small team, but a production design should still require independent approval for high-impact operations. Store recovery material offline and test restoration. The CI system receives only short-lived credentials to request a signing operation; it never receives exportable root private keys.

| TUF-style role | Authority | Recommended custody and cadence |
|---|---|---|
| `root` | Defines trusted keys, roles, and thresholds; authorizes key rotation. | Offline threshold keys; short emergency procedure; rotate on compromise or planned governance change. |
| `timestamp` | Points to the current snapshot and expires quickly, limiting freeze attacks. | Online signing service/HSM; narrowly scoped; expiry measured in hours or a few days. |
| `snapshot` | Binds the current versions/hashes of targets metadata. | Release service; expiry measured in days; signed for each promotion. |
| `targets` and delegated targets | Authorize named launcher/game artifacts and their hashes. | Offline or controlled release signing; delegation by `stable`, `beta`, OS, and product; expiry measured in weeks. |

Key compromise procedures must be written before launch. They must include taking the affected signing service offline, issuing a threshold-signed root rotation, withdrawing/revoking bad target metadata, publishing a signed incident notice, and releasing a manually downloadable, independently signed recovery installer if existing clients cannot trust the online channel. Never remotely delete user files or silently disable an installed game merely because telemetry is unavailable.

### Repository and update transaction

Host immutable artifacts by content address or release path on an HTTPS origin behind a CDN. Publish metadata only after all referenced artifacts are present and verified. Promote releases in this order: upload artifacts, verify artifact hashes from an isolated release worker, sign targets, sign snapshot, sign timestamp last, then make timestamp visible. This prevents a client from seeing metadata that points to a missing artifact.

On every check, the launcher first refreshes and validates metadata in the TUF order: root (only accepted with the required existing-root and new-root signatures during rotation), timestamp, snapshot, targets, then any delegated targets. It verifies each role’s threshold, key ID, version, expiration, and expected hash/length. It selects exactly one artifact matching its product, channel, operating system, architecture, and launcher compatibility. Only then does it download the artifact. After download, it verifies length and a cryptographic digest against trusted target metadata, verifies any platform package signature, extracts into a fresh version directory, performs local structural checks, and atomically changes the active pointer.

Use TLS 1.2+ with ordinary hostname validation, HSTS on web endpoints, redirect restrictions, a strict allowlist of repository origins, and no user-configurable certificate or proxy bypass. Certificate pinning is optional and operationally brittle; it should not replace signed metadata. Do not accept unsigned fallback metadata “when the update server is having trouble,” and do not blindly follow URLs placed in untrusted web content.

### Version manifest specification

In production, `timestamp.json`, `snapshot.json`, and `targets.json` should be standard TUF metadata rather than a bespoke manifest. The following is an illustrative **targets entry** to make the payload contract explicit. It is signed through the targets metadata envelope; the launcher must validate the full TUF chain, not only this object.

```json
{
  "_type": "targets",
  "version": 184,
  "expires": "2026-11-01T00:00:00Z",
  "targets": {
    "game/1.8.2/win32-x64/game-1.8.2.msix": {
      "length": 284918731,
      "hashes": {
        "sha256": "<64-lowercase-hex-characters>"
      },
      "custom": {
        "product": "example-game",
        "channel": "stable",
        "gameVersion": "1.8.2",
        "launcherMinVersion": "1.4.0",
        "platform": "win32",
        "arch": "x64",
        "format": "msix",
        "artifactPublisher": "CN=Example Game Studios, O=Example Game Studios",
        "releaseId": "2026-10-18.1",
        "releaseNotesUrl": "https://updates.example.invalid/notes/1.8.2",
        "rollbackOf": null
      }
    }
  }
}
```

Use Semantic Versioning for the launcher and game where it accurately expresses compatibility. Add an immutable `releaseId` to distinguish rebuilds or emergency withdrawals, and use explicit `protocolVersion`/`contentSchemaVersion` fields if game-client/server or save-data compatibility needs different rules. The server must enforce game build support independently; the launcher’s update decision is not an authorization system.

Every target must include the immutable filename/path, byte length, hash, product, channel, platform, architecture, package format, release ID, minimum launcher version, and any migration requirements. Avoid arbitrary post-install shell commands in metadata. If platform signing information is included, treat it as an additional policy check—platform verification must still use the operating system’s trust APIs. Release notes are display-only and must be rendered as untrusted content; they cannot control launch, update, or external commands.

### Rollback, recovery, and release withdrawal

Install each game version side-by-side in an application-owned directory such as `versions/<releaseId>/`. Maintain a small, integrity-protected local state file containing `current`, `previous`, `lastKnownGood`, the selected channel, and health status. Make state updates atomic: write a new file with restrictive permissions, flush it, then rename it. Store preferences and user-generated data outside the release directories so that rolling back code does not erase player data.

A release becomes **last known good** only after the new game starts, reaches a defined readiness signal, and remains healthy long enough to avoid immediately classifying a crash as success. The launcher should count only a small number of consecutive start failures for the new build. On reaching that threshold, it should choose the previous verified slot, show an explanation and version numbers, preserve diagnostic logs subject to the privacy setting, and offer retry/reinstall. It must never roll back automatically from a fixed defect to a known security-vulnerable build unless a human-approved, signed exception explicitly allows that release.

Rollback needs two separate policies. An *operational rollback* selects a previously downloaded, verified artifact when a new release is broken. A *security rollback-prevention policy* rejects stale signed metadata and versions below a signed minimum. TUF’s monotonic metadata and expiry defend against the latter category of rollback/freeze attack.[1] For an emergency withdrawal, publish new signed metadata that removes the bad target, raises the minimum version if necessary, and maps affected builds to an approved replacement. Keep an out-of-band status page and manually signed recovery installer for clients stranded by an updater bug.

## Platform packaging and code signing

The product should ship native packages per platform rather than a single unsigned archive. Packaging is a user-trust and operating-system compatibility requirement, not an artifact-integrity substitute: repository metadata validates what the launcher downloads; platform code signing tells the operating system and user who published the installed application.

| Platform | Recommended output | Required release controls | Notes |
|---|---|---|---|
| Windows | Signed MSIX/MSIX bundle as the primary managed installer; optionally a signed EXE/MSI bootstrapper for environments where MSIX is unsuitable. | Sign packages/installers and timestamp signatures; validate publisher identity in CI; retain signing audit logs. | Windows requires an MSIX package to have a valid trusted signing certificate. Microsoft recommends managed Azure Artifact Signing for production MSIX signing.[4] |
| macOS | Universal or separate arm64/x64 signed `.app` in a stapled `.dmg` or signed `.pkg`. | Sign every nested executable/framework with Developer ID, enable Hardened Runtime, notarize using `notarytool`, staple the ticket, and validate on a clean Mac. | Apple states that notarization checks Developer ID-signed software and produces a ticket Gatekeeper can use; it requires valid signing, Developer ID, hardened runtime, and timestamping.[3] |
| Linux | Prefer a distribution-native `.deb`/`.rpm` repository signed with a project repository key; publish an AppImage only with detached/minisign-style signature and verified hash. | Sign repository metadata/packages; publish key fingerprint through independent channels; never rely on `curl | sh`. | Linux does not provide one uniform desktop trust surface. Make manual verification clear and keep auto-update opt-in/explicit for portable builds. |

Sign the **launcher**, the **game package**, and all installers with the appropriate platform mechanism. Timestamp all signatures so releases remain verifiable after certificate expiration. Ensure the application’s displayed publisher, Windows certificate subject/MSIX identity, macOS Developer ID identity, website legal entity, privacy notice, and support contact agree. A mismatch is an incident, not a cosmetic detail.

Electron’s official documentation explains that unsigned macOS and Windows applications trigger OS safeguards and that a distributable Electron app should be signed.[2] macOS direct distribution needs both code signing and notarization; its notarization workflow supports apps, disk images, and installer packages.[3] On Windows, self-signed certificates are acceptable for development only; the package must be trusted on the target device for successful deployment.[4]

Do not ship driver installers, kernel extensions, privileged services, or always-on background agents unless a separately reviewed game feature makes them indispensable. A normal launcher should run as the current user, request elevation only for an explicit native installer operation, and never weaken operating-system protections, disable antivirus, add security exclusions, change firewall rules broadly, or tell users to bypass Gatekeeper/SmartScreen.

## Telemetry and privacy requirements

Telemetry is not required for the launcher’s core function. The default should be **no behavioral analytics** and no unique persistent advertising identifier. Allow a minimal, transparent operational mode if necessary to measure service health: launcher version, update channel, operating system family/architecture, update stage/result/error class, anonymized release ID, and coarse timestamp. Design the data schema so that IP addresses, account names, email addresses, full hardware fingerprint, local paths, installed application lists, screen contents, keystrokes, chat, passwords, tokens, raw crash memory, and game content are not collected.

The European Commission summarizes GDPR principles as lawfulness/fairness/transparency, purpose limitation, data minimization, storage limitation, security, and accountability; it also states that, where possible, anonymous data is preferable.[5] Even if GDPR does not apply to every user, these are sound default controls. Consult counsel on jurisdiction-specific lawful bases, consent, children’s privacy, cross-border transfers, and breach obligations.

| Telemetry category | Default | Acceptable implementation | Prohibited or high-risk implementation |
|---|---|---|---|
| Update health | Essential only if genuinely needed for reliability; explain in the privacy notice. | Event: `{releaseId, stage, result, coarseOS, errorClass}`; rotate pseudonymous install ID; aggregate daily. | Device fingerprinting, persistent cross-product advertising ID, raw URLs/paths, or logs containing access tokens. |
| Crash reports | **Off by default** unless a clear opt-in or another reviewed lawful basis applies. | Show preview/categories; scrub secrets; sampled upload; short retention. | Silent upload of full memory dumps, save files, chat, local files, screenshots, or network payloads. |
| Product analytics | **Off by default**; enable only through informed, revocable opt-in. | Aggregated feature/use counters without account linkage; respect `Do Not Track` where relevant. | Sale/sharing of data, session replay, invasive engagement SDKs, or data collection unrelated to stated purpose. |
| Support diagnostics | User-initiated export. | Local ZIP with redaction, visible contents, and expiration; upload only after user action. | Background collection or remote support access without explicit, session-specific consent. |

Give the user a concise first-run choice with equal prominence for “Share optional diagnostics” and “Not now.” Provide a settings page that changes the choice, explains each category, exposes the privacy notice, and supports deletion/access requests where required. Separate game-account identity from launcher operational events; if linkage is unavoidable, document purpose, lawful basis, retention, access controls, recipients/processors, transfer locations, and deletion workflow. Encrypt telemetry in transit; encrypt sensitive records at rest; enforce role-based access; set short retention (for example, 30 days for identifiable operational events and 90 days for opted-in crash reports, subject to business and legal review); and review processor contracts.

## Release engineering and signing controls

A release pipeline should be reproducible enough to explain exactly which source revision and dependencies produced each artifact. Pin Node and package-manager versions; commit a lockfile; prohibit unreviewed post-install scripts in the release environment; run dependency, secret, malware, and license scanning; create an SBOM (SPDX or CycloneDX); and attach build provenance, source commit, build timestamp, artifact hashes, and approval records to the release record. Build in an isolated runner and upload artifacts to immutable storage before any metadata is signed.

Use separate development, beta, and stable repositories/channels. Beta clients must never consume stable signing authority, and stable clients must not silently enroll in beta. Promotion should re-use exactly the previously built artifact rather than rebuild it for stable. Require protected branches, mandatory review, multifactor authentication (MFA) for source control/release accounts, and two-person approval for production target metadata. Audit access to signing services and test signature verification in a clean virtual machine during every release.

CI should not have a long-lived `.p12`, Apple API key, root key, or Windows hardware token secret in an environment variable. Prefer managed signing services or an HSM/key vault with workload identity, scopes restricted to the intended artifact type/publisher, signing audit logs, rate limits, and emergency disablement. The Windows signing recommendation should be evaluated against current vendor eligibility and jurisdiction; the implementation must retain a documented manual recovery path if managed cloud signing is unavailable.[4]

## Minimal Node/TypeScript implementation plan

### Architecture

Use Electron with TypeScript and Electron Forge or an equivalent maintained packaging tool. Keep all trusted update logic in the Electron **main process** or a separately launched, signed helper. The renderer receives a strictly typed status model over a narrow preload/IPC surface and has no direct filesystem, shell, child-process, or arbitrary-network authority. Use `contextIsolation: true`, `nodeIntegration: false`, a restrictive Content Security Policy, and a navigation/window-open allowlist. The game process is started only from an already verified, application-owned version directory with fixed arguments.

A TUF client library for JavaScript/TypeScript, such as the maintained `@tufjs/client` family after verifying its current maintenance and compatibility, should own metadata parsing and verification. Wrap it behind a project interface rather than calling an auto-update library directly. Electron’s updater integration may manage platform mechanics, but it must not replace the TUF trust checks described above. Use Node’s `crypto` only for local hash/stream verification or where the selected TUF implementation calls it; do not implement signature verification from scratch.

```text
src/
  main/
    main.ts                 # Electron lifecycle; no untrusted update decisions
    updater/
      update-service.ts     # orchestration/state machine
      tuf-client.ts         # TUF adapter and policy checks
      downloader.ts         # streamed, size-capped download to temp dir
      verifier.ts           # hash, package identity, structural checks
      installer.ts          # atomic version-slot activation/rollback
      state-store.ts        # atomic local state and health outcomes
      platform.ts           # OS/arch/package signature adapters
    telemetry/
      consent.ts            # local choice and data minimization gate
      events.ts             # allowlisted event schema and scrubber
    ipc.ts                  # typed, allowlisted UI messages
  preload/
    index.ts                # minimal `window.launcher` API
  renderer/
    app.tsx                 # status UI only
  shared/
    schemas.ts              # zod/JSON schemas for all cross-boundary data
scripts/
  build.ts                  # deterministic build inputs
  publish-metadata.ts       # artifact-first, TUF metadata last
  verify-release.ts         # clean-machine/artifact checks
```

### Delivery sequence

| Phase | Deliverable and acceptance criterion |
|---|---|
| 1. Ownership and release policy | Written content/license inventory, brand clearance record, no-proprietary-client policy, incident/rollback runbook, privacy notice draft, and security owner. Do not code distribution before this gate passes. |
| 2. Launcher hardening skeleton | Signed development builds; Electron main/preload/renderer separation; `contextIsolation`; no arbitrary shell/filesystem IPC; status UI; local settings; a game launch from a fixed development directory. |
| 3. Verified update proof of concept | TUF test repository with root/timestamp/snapshot/targets roles; one small signed fixture per OS; negative tests for wrong hash, expired metadata, wrong role, replayed metadata, wrong platform, and incomplete download. The launcher must reject every negative fixture. |
| 4. Atomic installation and rollback | Side-by-side slots, durable state file, health confirmation, crash-loop handling, manual retry, controlled downgrade policy, and tests that kill the launcher during download/extraction/activation. |
| 5. Packaging and CI | Windows, macOS, and Linux artifacts; platform signing/notarization; SBOM/provenance; isolated build and signing; release promotion; clean-VM smoke test; signature, publisher, hash, and startup verification. |
| 6. Privacy and operations | Explicit telemetry consent; allowlisted schemas/redaction; retention jobs; access controls; status page; key-compromise/revocation drill; quarterly restore/update/rollback exercise. |

A first implementation should deliberately avoid differential/binary patching, plug-in support, self-modifying code, privileged services, custom anti-cheat drivers, multiple update sources, and background auto-start. Begin with full immutable package downloads, a single stable channel, and a small number of platform/architecture combinations. Add features only after their new trust and privacy effects are reviewed.

### Essential test cases

The release test suite should use fixtures and clean virtual machines to prove the following. It should install and launch a valid signed package. It should reject an invalid target hash, a changed byte length, expired timestamp metadata, stale metadata version, unauthorized signing key, insufficient signature threshold, wrong product/channel/architecture, redirect to an unallowlisted origin, malformed release notes, and an unsigned/tampered native package. It should survive network loss and power/process termination during every update stage without losing the last known-good version. It should roll back after the defined crash threshold, preserve user settings, and prevent a downgrade below the signed security floor. It should also prove that opting out of analytics sends no optional telemetry and that support diagnostics require a user action.

## Explicit exclusions

The following requirements are intentional exclusions from the launcher roadmap. The launcher must not include official/proprietary game clients, cached assets, servers, account credentials, code, brands, logos, music, data files, emulators, or reverse-engineered protocol components. It must not download content from an official publisher’s domains or accept a user-provided installation as a source. It must not claim affiliation, compatibility, endorsement, or authorization without a written agreement.

It must not create, publish, support, or link to tools that bypass or weaken anti-cheat, copy protection, DRM, access controls, account protections, or operating-system protections. That includes process injection, hook loaders, memory editing, packet interception/modification, macro/bot automation, debugger/VM/anti-analysis evasion, driver-based concealment, sandbox escape, credential harvesting, or disabling security software. For the project’s own game, fairness and abuse prevention should instead be primarily server-authoritative: validate actions and economy transitions server-side, rate-limit sensitive operations, make moderation decisions auditable, and use transparent player-facing rules.

## Release-readiness checklist

A production launch is ready only when the project can answer “yes” to all of these questions: Are the shipped code, assets, names, and distribution rights documented? Is every release artifact authorized by threshold-signed, non-expired metadata and verified locally before activation? Are signing keys separated, non-exportable where feasible, auditable, and recoverable? Are Windows packages signed and trusted, macOS applications Developer ID-signed/notarized/stapled, and Linux packages/repositories signed? Can a corrupted update or release crash return the user to a verified last known-good version without bypassing a security floor? Is optional telemetry off without consent, minimized when enabled, documented, retained briefly, and access-controlled? Has the project tested an update compromise, key rotation, emergency withdrawal, and clean-device recovery? If any answer is “no,” the feature should remain in pre-release rather than being labeled production-ready.

## References

[1]: https://theupdateframework.io/docs/overview/ "Overview | TUF - The Update Framework"
[2]: https://www.electronjs.org/docs/latest/tutorial/code-signing "Code Signing | Electron"
[3]: https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution "Notarizing macOS software before distribution | Apple Developer Documentation"
[4]: https://learn.microsoft.com/en-us/windows/msix/package/signing-package-overview "Sign an MSIX package | Microsoft Learn"
[5]: https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en "Principles of personal data processing under the GDPR | European Commission"
[6]: https://legal.jagex.com/docs/terms/terms-and-conditions "Terms & Conditions | Jagex Legal Portal"
[7]: https://legal.jagex.com/docs/terms/eula "End User Licence Agreement | Jagex Legal Portal"
