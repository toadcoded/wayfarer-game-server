# Clean-Room Continuation Plan — Next Steps for the 2006scape Build

**Author:** Manus AI  
**Date:** 2026-09-11  
**Status:** Action plan; no source, connector, account, repository, or release mutation is authorized by this document.

## Executive direction

Proceed with a **new, original, clean-room browser vertical slice** under the temporary internal label **Project Copper Lantern**. The immediate objective is a local, demonstrable proof in which a player moves through the original Sable Fen Waypost scene, gathers one original resource through a server-authoritative interaction, and receives one server-confirmed inventory item. The supplied Drive corpus and local `combining.js` remain evidence only. They must not enter the product repository, build context, runtime, asset pipeline, protocol, launcher, or release artifacts.[1] [2] [3]

The work should advance through explicit gates rather than through parallel attempts to make the legacy corpus runnable. The current materials do not establish a rights-cleared, coherent, or releasable product, and the dated runtime bundle remains quarantined. Access to a folder, an archive name, a duplicate checksum, or a successful build would not establish a right to integrate or distribute its contents.[1] [2]

> **Immediate decision:** authorize clean-room Phase 1 only. Do not authorize Drive-archive acquisition, extraction, execution, source integration, desktop distribution, public release, or production automation at this time.

## Current constraints and missing authorization

The following conditions block particular work. They are not administrative details; they are delivery gates.

| Missing item | What is known | Required action before the related work begins | Blocked work |
|---|---|---|---|
| **Artifact-specific rights authorization** | No supplied Drive item is cleared for product use. The corpus is mixed and includes runtime, map, client, plugin, cache, and protocol-risk material. | Obtain a verifiable, written authorization from the actual rights holder that names the exact provider ID, immutable SHA-256, revision, intended use, grantor authority, and rights to copy, modify, compile, distribute, and commercially use the item. Complete third-party, asset, legal, security, and release reviews. | Any integration, compilation, execution, extraction, redistribution, or use of Drive-originated artifacts. |
| **User confirmation for controlled mutations** | The workspace has no authorization to create a repository, make a task that incurs spend, upload a file, download/archive-review a corpus item, or publish a build. | Give a single-use approval bound to the named operation, exact inputs/hashes, destination, scope, budget/time limit, and rollback plan. | Repository initialization, task creation, evidence acquisition, external upload, build/release, signing, and publishing. |
| **Connector/identity discovery** | There is no verified configured connector for GitHub, Box, Dropbox, cloud search, or a remote GitHub repository. Google Drive/Docs availability must also be confirmed for the intended principal. | Run `connector.list` and `skill.list` under an approved read-only identity. Record returned IDs, scopes, availability, and approved use. Attach only the returned, user-approved IDs to each task. If unavailable, record `unavailable`; do not use personal logins, browser workarounds, or create connectors. | Provider inventory, Docs export, GitHub provenance review, Box/Dropbox/cloud search, and any controller workflow. |
| **Governance owners and evidence policy** | Legal/provenance, security, release, and data/privacy owners have not been nominated in the supplied findings. An evidence store and retention/access policy are not approved. | Name owners; approve an access-controlled evidence location outside the product build tree; set retention, access, redaction, incident escalation, and approval-record policies. | Any rights review, static evidence review, release governance, telemetry decision, or production signing design. |
| **Product identity and platform-signing governance** | *Project Copper Lantern* is an internal working label only. No approved public identity, privacy owner/notice, signing accounts, or production key-custody decision is recorded. | Clear product name/brand and user-facing identity; approve privacy ownership and notice; establish platform developer accounts and HSM/managed-signing, threshold, rotation, and dual-approval policies. | Public launcher, controlled alpha, telemetry transport, native packaging, signing, notarization, and public release. |

`/home/ubuntu/upload/combining.js` is unapproved local evidence rather than a product dependency. It is a Unicode combining-codepoint range table and has no supplied license or ownership connection to any Drive artifact. It remains outside scope unless it later receives a separate intake record and approval.[1] [4]

## Sequenced action plan

The plan deliberately separates the **clean-room implementation path** from the **evidence/authorization path**. Clean-room work may proceed after the Phase 0 decision without waiting for legacy-artifact rights clearance. The evidence path may proceed only through approved, read-only steps and never becomes a shortcut around the clean-room boundary.

| Sequence | Workstream | Deliverable | Source boundary | Acceptance test |
|---:|---|---|---|---|
| 0 | **Governance decision** | Signed/recorded Phase 1 charter identifying the internal codename; legal/provenance, security, release, and data owners; evidence-store location; retention; access controls; and the explicit no-legacy-input rule. | Use the reports as planning evidence only. Do not copy any Drive/local corpus file into a repository or build tree. | Owners and escalation contacts are named; the charter states that only original, synthetic, or expressly approved inputs may enter the product; a user gives a scoped approval to begin Phase 1. |
| 1 | **Capability and connector discovery** | Read-only availability matrix for Manus skills/connectors and approved provider scopes. | Query only the controller/capability layer after user approval. No connector creation, browser-login workaround, provider write, archive download, or broad sync. | The record contains discovery timestamp, identity class, connector/skill IDs, scopes/availability, and `unavailable` for every absent provider. No task inherits unreviewed default connectors. |
| 2 | **Evidence and provenance control** | Append-only evidence register outside the product tree, seeded with known Drive IDs, classifications, and the `combining.js` SHA-256; a non-sensitive quarantine notice for the future repository. | Read-only metadata and specifically approved Docs text exports only. Drive children and new revisions default to quarantine; no binary retrieval by default. | Each record has provider object ID, observed revision/location, access date, classification, allowed use, SHA-256 when lawfully acquired, rights status, stop conditions, reviewer, and recheck date. |
| 3 | **Clean-room repository baseline** | A new repository containing an original README/charter, `DO_NOT_USE` or equivalent quarantine rules, contributor attestation, provenance and asset registers, dependency policy, CI source-boundary checks, and synthetic fixtures only. | Create only after a separate repository-write confirmation. Do not seed it from the local workspace corpus, Drive archive, protocol notes, map/cache material, or `combining.js`. | Repository scan and CI show no prohibited archive paths, legacy names, proprietary assets, Drive payloads, or unapproved runtime inputs. Every dependency has a license record and every runtime asset manifest entry has approval fields/checksum. |
| 4 | **Copper Lantern shell and navigation proof** | WebDev static React/Babylon client shell; one full-screen canvas; original Sable Fen Waypost grid; camera; picking; and server-approved route response using an original v1 contract. | Use newly authored TypeScript, procedural meshes, original data, and synthetic service fixtures only. Do not reproduce legacy maps, names, packet layouts, login flows, or behavior. | React strict-mode mount produces one engine/render loop and clean disposal. Three known picks map to expected tiles; blocked/out-of-bounds moves reject; the same fixture state produces the same server-approved route; the avatar does not cross blockers. |
| 5 | **Authoritative interaction and state proof** | Local slice service, protocol schemas/fixtures, admission-ticket test flow, idempotent `move.intent` and `interact.intent` handlers, and one durable inventory mutation. | The browser sends intent only. It may not assert position, inventory, reward, currency, or world mutation. The protocol is project-authored, versioned JSON over WebSocket, not a reconstructed third-party protocol. | Forged state fields fail schema validation or are ignored. Out-of-range gathering rejects. A repeated gather command produces one item and one inventory revision. Reconnect renders the authoritative snapshot. |
| 6 | **Original visual target and asset provenance** | Approved original 16:9 reference image; original texture set; `ASSETS.md`; central asset register; procedural surveyor, reed, water, ground, tree, plinth, and HUD implementation. | Generate only from the approved Copper Lantern briefs; retain generation output outside the code repository and upload only approved runtime assets. No copied, traced, extracted, or third-party game art, symbols, map data, fonts, music, UI, or branding. | Asset records contain prompt, tool/version, date, creator/reviewer, output path, storage URL, SHA-256, intended use, ownership status, approval date, and rejection notes. Browser logs show no failed asset requests; review finds no copied wording, symbols, or recognizably prohibited motifs. |
| 7 | **Deterministic demonstration and quality gate** | `?demo&seed=copper-lantern-slice-01`, event trace, normal-play test checklist, screenshot evidence, `PLAN.md`, `STRUCTURE.md`, `MEMORY.md`, `ASSETS.md`, and local runbook. | Demo is visibly labeled `DEMO FIXTURE — NO ACCOUNT DATA`, uses the same semantic command path, and is excluded from production admission. It does not alter meshes or inventory directly to fake success. | Two fresh demo runs produce byte-identical normalized event traces/final state. At 14 seconds, screenshots visibly show original scene, movement or route state, harvested reeds, one item, and `1 / 8` inventory. `pnpm check`, `pnpm build`, domain/protocol/determinism/lifecycle/provenance tests, and runtime-log inspection pass. |
| 8 | **Launcher design and development proof only** | Complete launcher M0–M2 with synthetic game fixtures: hardened Electron shell, typed narrow IPC, maintained TUF client/metadata policy, bounded download/verifier, atomic slots, readiness nonce, rollback, and fault-injection tests. | Install and launch only project-produced or expressly licensed artifacts. No Drive runtime/client/cache/map/protocol, arbitrary executable, plug-in, process injection/control, custom cryptography, security bypass, or production key material. | Renderer has no Node, filesystem, shell, or arbitrary network authority. Invalid metadata/packages fail closed. Interrupted updates never launch staging/partial files. Candidate becomes last-known-good only after nonce/release/protocol readiness and the signed stability window. |
| 9 | **Release readiness (deferred)** | M3–M4 platform packages, SBOM/provenance, privacy-default controls, controlled-alpha operational runbooks, signing audit trail, and incident/key-compromise drills. | No public distribution before all legal, provenance, identity, privacy, platform, security, and signing gates pass. TUF verification and platform signing are complementary; neither cures a rights defect. | Windows/macOS/Linux clean-machine tests pass for selected platforms; packages and launcher identities match signed policy; optional diagnostics send no network events before opt-in; signing uses approved managed/HSM controls; dual release approval is recorded. |

## Workstream instructions and decision gates

### 1. Start with governance, not corpus recovery

The next user action should be to approve the **Phase 1 clean-room charter** and appoint the responsible owners. This creates an accountable boundary before code, evidence retrieval, or external services are involved. The implementation repository and evidence store must be separate. The evidence store preserves hashes and review conclusions; it is not mounted into CI, the game runtime, packaging, or launcher slots.[1] [3]

Once owners are named, authorize a single read-only capability-discovery operation. This should confirm, rather than assume, available Manus connectors and skills. Any future task must name the approved connector/skill IDs, input hashes, allowed provider roots/queries, no-write constraints, expected structured-output schema, maximum time/cost, and retention class. Task creation or attachments are themselves spend/data-transfer mutations and require their own scoped user confirmation.[3]

### 2. Maintain the artifact quarantine indefinitely unless an exact gate passes

Treat the Drive corpus as a set of individual evidence records. A candidate cannot be approved at the folder, family, duplicate, or filename level. For any future integration proposal, the authorization record must bind the exact provider ID and retrieved SHA-256 to an intended limited use, with a verified authority chain, rights scope, third-party/dependency/creative-asset evidence, static security review, and release-owner approval.[1]

The dated runtime bundle (`1akdazlTUu4xlkI6lUu-d59ymWKyHC95C`) remains **quarantined**. It must not be executed, unpacked into a project tree, compiled, distributed, or used for a client, cache, map, protocol, plugin, launcher, or configuration input. The cache-pipeline, offline-source, site, and companion-stub archives are only conditional candidates for a later *isolated static review* after artifact-specific written authorization. A successful technical result never substitutes for rights clearance.[1]

If the user later seeks a review of one candidate, require two discrete confirmations: first for acquisition of the exact object into an access-controlled, non-executable evidence store and SHA-256 capture; second for any static unpacking/scanning. The review must use synthetic/original fixtures, retain SBOM/license/secret/malware findings, and stop on a hash mismatch, rights gap, secret, suspicious executable, prohibited client/cache/map/protocol linkage, unreviewed binary, or incompatible license.[1] [3]

### 3. Build the browser slice in five checkpointed increments

After the repository-write confirmation, implement the Copper Lantern slice in five short checkpoints: (1) clean-room WebDev shell and empty canvas; (2) static map, camera, picking, and accepted route; (3) service admission and authoritative gathering/inventory state; (4) approved original textures, procedural props/avatar, HUD, and interaction feedback; and (5) deterministic demo, screenshots, tests, checkpoint, and provenance review.[2]

The required gameplay proof is intentionally narrow: on an original 14 × 12 map, the player moves from the entry bridge to mirrorglass reeds around a static obstacle, gathers only while within 1.8 meters, and receives exactly one server-confirmed mirrorglass bundle. The browser renders server snapshots and accepted route data; it does not grant items or alter the world. The demo uses a fixed 100 ms tick and must visibly move, gather, switch the reeds to harvested state, and update the inventory from `0 / 8` to `1 / 8` over 14 seconds.[2]

Do not start desktop packaging, launcher distribution, public accounts, analytics, or a public game release from this slice. The slice is a clean-room technical proof and an art/provenance checkpoint, not an authorization to ship.[2]

### 4. Keep the launcher after, and independent from, the browser proof

Launcher work begins only after the clean-room project has original/synthetic fixtures to package. The appropriate first target is the development-only M0–M2 proof: hardened Electron process separation; a frozen typed IPC surface; a maintained TUF library; signed development metadata; immutable artifact-first publication; restrictive staging; atomic version slots; one-time readiness nonce; rollback; and failure-path testing.[4]

Production readiness is expressly later. M3 requires product/legal identity, platform signing accounts, provenance, SBOM, and release controls. M4 requires an approved privacy owner/notice and retention policy, an incident owner, and production signing governance. Optional diagnostics, crash reports, and product analytics remain off by default. No launcher feature may load plug-ins, accept arbitrary executables, self-elevate, modify security controls, inject into other processes, or integrate Drive-originated runtime material.[4]

## Phase gates and stop rules

| Gate | Advancement condition | Stop / fallback rule |
|---|---|---|
| **G0 — Charter approved** | Scoped user approval names Phase 1, owners, evidence-store policy, clean-room exclusions, and repository-write decision. | Without approval, retain planning state only; do not create repository, task, connector, or external artifact. |
| **G1 — Capability verified** | Discovery returns an enabled, user-authorized connector/skill ID needed for a specifically approved read-only task. | If absent, record `unavailable`; do not enable, configure, or bypass with another login/browser session. |
| **G2 — Clean-room baseline passes** | New repository uses original/synthetic inputs, has provenance/asset registers, and CI rejects prohibited paths/identifiers and unapproved assets. | Any corpus leakage, unapproved dependency, missing license, or provenance gap blocks implementation until removed/remediated. |
| **G3 — Vertical-slice behavior passes** | All route, authority, idempotency, asset, deterministic-demo, build/type, browser lifecycle, and screenshot checks pass. | A failed risk slice blocks visual/content polish; fix the bounded risk before proceeding. |
| **G4 — Evidence item eligible for isolated review** | Exact hash and ID, written rights scope, third-party provenance, legal/security approval, and new acquisition/static-review confirmation are all present. | Quarantine immediately on any gap, mismatch, secret, suspicious payload, prohibited linkage, scope expansion, or approval expiry. |
| **G5 — Launcher development proof passes** | Synthetic fixture validates TUF trust, artifact verification, atomic installation, readiness promotion, floor-compliant rollback, and hardened IPC. | Preserve last-known-good synthetic release or fail safely; no publishing, signing, or platform rollout. |
| **G6 — Controlled alpha / release eligible** | Legal/product identity, asset/code provenance, privacy, operational ownership, platform signing, SBOM, clean-machine evidence, and dual approval are complete. | Keep artifacts in development-only use. No promotion, signing, public download, account rollout, or telemetry activation. |

## First approval packet for the user

To make the plan executable without broad permissions, the user should provide one narrowly scoped approval packet containing the following decisions:

1. Confirm that the product will be an **original clean-room fantasy MMORPG** and authorize only Phase 1 browser-slice work using original/synthetic code, data, assets, and protocol.
2. Approve or replace the temporary internal label **Project Copper Lantern**; this does not authorize public branding.
3. Name the legal/provenance, security, release, and data/privacy owners, plus a contact for rights-holder questions.
4. Approve an evidence-store location outside the future repository and its retention/access policy.
5. Decide whether to authorize one read-only connector/skill discovery. If yes, state the permitted identity, maximum scope, and that no connector configuration, provider write, archive download, task attachment, or task creation is included unless separately approved.
6. Decide whether to authorize initialization of a new clean-room Git repository. If yes, specify the repository owner/name, visibility, license, initial branch, intended remote, and the complete initial file set/diff for review.

This packet intentionally does **not** seek permission to use any Drive archive, create/configure a connector, publish code, upload evidence, execute unknown material, generate a public build, create accounts, collect telemetry, sign packages, or release a launcher.

## Definition of the next completed milestone

The next milestone is complete when the clean-room project has a verified browser-slice checkpoint, not when legacy code appears to run. It must build from original/synthetic inputs only; clearly document and enforce its quarantine boundary; demonstrate server-authoritative move-and-gather behavior; reproduce the 14-second deterministic demo; retain provenance for every included dependency and asset; and provide tests, screenshots, an implementation memory log, and a local runbook.[2] [3]

A desktop launcher, public alpha, and source integration remain separate future milestones with their own authorization, security, provenance, privacy, platform-signing, and release-governance gates.[1] [4]

## References

[1]: file:///home/ubuntu/2006scape-build/research/authorized-integration-map.md "Authorized Integration Map — Drive Artifact Intake"
[2]: file:///home/ubuntu/2006scape-build/research/vertical-slice-plan.md "Project Copper Lantern — First Playable Browser/Client Vertical Slice"
[3]: file:///home/ubuntu/2006scape-build/research/orchestration-plan.md "Safe Orchestration Plan — Clean-Room Fantasy MMO"
[4]: file:///home/ubuntu/2006scape-build/research/launcher-backlog.md "Clean-Room TypeScript/Electron Launcher Backlog"
[5]: file:///home/ubuntu/2006scape-build/BUILD_STATUS.md "2006Scape / Polycodex Build Status"
