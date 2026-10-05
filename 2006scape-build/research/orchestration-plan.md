# Safe Orchestration Plan — Clean-Room Fantasy MMO

**Plan ID:** `ORCH-2006SCAPE-CLEANROOM-001`  
**Status:** Proposed; no connector, task, repository, cloud-storage, or source-artifact mutation was performed to create this plan.  
**Scope:** Evidence intake and Phase 1 clean-room work only. This is not authority to obtain, execute, compile, integrate, distribute, publish, or reverse-engineer the supplied corpus.

## Executive decision

The control plane must treat the supplied Drive corpus and local `combining.js` as **unapproved evidence**, rather than as product inputs. The immediate authorized path is a new, original game foundation using synthetic or independently licensed assets. The plan therefore separates (1) provider inventory, (2) provenance assessment, (3) Manus task creation, and (4) mutations into distinct state transitions with different identities, permissions, logs, and human approvals. The corpus must remain outside product source directories, Git history, CI/build contexts, runtime inputs, and release artifacts until an artifact-specific authorization gate passes.[1][3]

No current configuration evidence was provided for a Manus connector to Box, Dropbox, a cloud-search service, or GitHub, nor for a remote GitHub repository. This plan **does not claim any such connector exists**. A connector or project skill may be used only after the relevant discovery API returns an enabled, user-authorized identifier, and it must be explicitly attached to the individual task that needs it. If discovery yields no eligible connector, record `unavailable` and skip that provider; do not substitute a personal login, create a connector, request broad access, or use a browser session to work around the absence.

The clean-room baseline remains the only recommended engineering scope at this stage: original code, original protocol, synthetic/original test data, provenance records, and a non-production launcher design.[1][4]

## 1. Current evidence, boundaries, and initial provenance record

The available inventory describes a mixed Polycodex/RSPS workspace, not one verified release. It identifies 3,213 direct children under the main project folder, 4,600 accessible non-trashed records, a candidate runtime archive, multiple cache-pipeline revisions and exact duplicates, but no verified matching client/server pair or raw legacy cache.[2] This makes a source-free, clean-room first phase essential.

| Evidence item | Observed identifier or location | Integrity anchor available now | Handling status | Permitted use now |
|---|---|---|---|---|
| Main Drive corpus | `PolycodexServerClientApp` / `1qYDrO0MZD3Q5NKLtL8Y2BvJg4Nqz-6Ux` | Drive ID, inventory timestamp, metadata | **Read-only evidence** | Metadata inventory and provenance review only |
| Candidate runtime bundle | Drive ID `1akdazlTUu4xlkI6lUu-d59ymWKyHC95C` | Drive ID and observed size; no reviewed SHA-256 of retrieved bytes | **Quarantined** | Record as a claim; do not download to product paths, unpack, run, compile, or distribute |
| Latest observed cache-pipeline revision | Drive ID `11R9c_GUOB1TYXiROxxLZgLTRmr8giuDv`; MD5 `5d4d175f9f15a3a21a0fd111b6bb2e7a` | Drive-level duplicate relationship only | **Candidate for future isolated review** | Preserve metadata and duplicate links; no execution or integration |
| Offline-source archive | Drive ID `1EwqSAspoejPeMNFccPFkqhjFKMS_Y2H2` | Drive ID and observed size | **Quarantined** | Evidence only |
| Launcher/build notes | Google Docs named in the inventory | Drive/Docs IDs and text-export observations | **Read-only evidence** | Historical/security context; do not reuse URLs, certificates, configuration, client, or branding |
| Local `combining.js` | `/home/ubuntu/upload/combining.js` | SHA-256 `c27a2e1379eb7c30e81aa97ab9c21e269d9eaeab0104d2bbbb76ddfa0a27ec29`; 3,078 bytes | **Unapproved local evidence** | Record the hash and apparent Unicode-range-table role; do not copy, package, execute, or treat it as a dependency without origin/license review |
| Input reports | Paths in the source register below | SHA-256 values below | **Planning evidence** | Read-only planning and review |

The local `combining.js` appears to export combining/format Unicode code-point ranges. That functional observation is not source attribution, license evidence, security review, or authorization to include it in the game. Its lack of supplied provenance means it follows the same default-quarantine rule as an unknown Drive child.[3]

| Planning source | SHA-256 observed for this plan | Purpose |
|---|---|---|
| `implementation-brief.md` | `b6b1bc59fc7b88c78ede5c1ceffe09bcb239b70b97af1cda1d29527c2849ef01` | Clean-room decision and Phase 1 boundary |
| `drive-inventory.md` | `ed9648013ce9656a5150597518b323a569a972803c080c6007a99330bcc48d31` | Inventory, Drive IDs, duplicate/revision findings |
| `launcher-review.md` | `8e85a718b26e9d536a04e5c000a4e6709201fc23506c466e9682f4ec63d8e240` | Secure update, signing, privacy, and release requirements |
| `combining.js` | `c27a2e1379eb7c30e81aa97ab9c21e269d9eaeab0104d2bbbb76ddfa0a27ec29` | Unapproved local evidence artifact |

## 2. Operating choices for the controller

No recurring or autonomous implementation workflow should be enabled during the evidence and Phase 1 stage. Choose one of the following human-visible operating models before enabling a controller. Both retain the confirmation rules below.

| Approach | Tradeoffs | Cost | Setup complexity |
|---|---|---:|---:|
| **Manual, batch-oriented review ledger** | An operator runs a read-only inventory batch on demand, reviews a signed/hash-anchored report, and explicitly authorizes each next task. It is slower but gives the strongest legal, data-transfer, and budget control while rights are unresolved. | Lowest; only approved task runs incur API use. | Low |
| **Durable event-driven controller** | A small service accepts verified Manus task-status webhooks, maintains an idempotency ledger, and queues pre-approved read-only tasks. It reduces manual status checking but requires secure hosting, a database, webhook verification, monitoring, and an agreed approval policy. It must never auto-approve mutations. | Ongoing hosting and task/API cost. | Higher |

The first approach is appropriate for the present uncertainty. The second may be adopted only after the user approves its data flows, hosting, budget, owner, retention period, and escalation path. Do not use scheduled Manus sessions for frequent polling; if a future durable system is required, use verified event delivery where available and a dedicated controller rather than background work in this sandbox.[5]

## 3. Control-plane state machine

Every object in the controller—provider query, artifact, review, task, approval, and mutation—has a stable record and moves only forward through the states below. A blocked or rejected item never silently becomes eligible after a retry.

```text
DISCOVERED
  -> INVENTORIED_READ_ONLY
  -> HASHED_AND_PROVENANCE_RECORDED
  -> AWAITING_RIGHTS_AND_SCOPE_APPROVAL
  -> APPROVED_FOR_NAMED_LIMITED_USE
  -> ISOLATED_STATIC_REVIEW (only if separately approved)
  -> INTEGRATION_PROPOSAL
  -> USER_CONFIRMED_MUTATION
  -> EXECUTED_AND_AUDITED

Any failure, scope change, hash mismatch, missing authorization, secret finding,
or proprietary-content indication -> QUARANTINED / STOP
```

The `APPROVED_FOR_NAMED_LIMITED_USE` state is valid only when the record names the exact provider object ID, immutable retrieved SHA-256, revision/version, purpose, permitted actions, grantor and authority evidence, license scope, reviewer, decision date, expiration/revocation terms, and required downstream controls. Folder names, shared links, a successful build, MD5 duplicate matching, or a broad verbal claim never satisfy the gate.[3]

## 4. Separated workflows

### 4.1 Read-only provider inventory

Read-only inventory must collect the minimum facts needed to identify evidence and validate whether a capability is actually available. It must not download full archives by default, alter permissions, create documents, create repositories, or move/copy files. Store provider query parameters and result counts so an inventory is repeatable without treating search results as ownership proof.

| Provider or capability | Capability-discovery precondition | Permitted read-only operations | Required record | Explicitly excluded from this stage |
|---|---|---|---|---|
| **Manus API** | A server-side authorized API principal; first call is `connector.list` and `skill.list` | List available connectors/skills; later inspect task status/messages for controller-owned tasks | Timestamp, caller identity class, returned connector/skill IDs and names, scopes/availability if returned | Creating a connector, changing project defaults, task creation, webhook creation, confirmation of an action |
| **Google Drive** | The existing authorized Google Workspace path is available for the chosen principal; otherwise mark unavailable | List/search metadata in allowlisted folders; obtain file metadata; read/export explicitly selected Docs text | Drive ID, parent path as observed, MIME type, size, modified/revision fields where exposed, query, access date, export format and hash | Upload, create, edit, move, copy, trash, restore, download all files, change permissions, share, or permanently delete |
| **Google Docs** | Same as Drive; use the Docs API/CLI only for Docs operations | Read document metadata or a plain-text export needed for evidence | Document ID, revision/modified observation, exporter/version, export hash, reviewer conclusion | In-place edit, comment/suggestion changes, publish/share changes; no browser-based Docs editing |
| **GitHub** | An approved GitHub App/token or explicitly authorized `gh` identity; no assumption that a remote repository is configured | Repository metadata, default-branch and commit IDs, release/tag metadata, license/NOTICE/SBOM files, commit/tree hashes, read-only issue/PR context if needed | Host, owner/repo, immutable commit/tree/tag SHA, license-file hash, retrieval time, authenticated identity class | Repository creation, fork, clone into product tree, push, issue/PR/comment creation, workflow/configuration changes, secret changes, release publishing |
| **Box, Dropbox, cloud search** | `connector.list` returns a matching enabled connector **and** the user selects a named allowed scope | Search/list metadata and read selected text snippets or metadata within allowlisted folders | Connector ID, provider, allowed roots, query, object ID/revision, result/source URL, access date | Any operation if the connector is absent; uploads, sharing, moves, deletion, indexing changes, broad export/sync, browser-login workaround |

For Google Docs, a future approved in-place update must use the supported document batch-update operation to preserve comments and suggestions. A future new Google Doc should be generated locally as a `.docx` and uploaded/conversion performed only after the mutation confirmation described in Section 7. These are not actions authorized by this plan.[6]

A local inspection found that `/home/ubuntu/2006scape-build` is not presently a Git repository. Creating a Git repository, linking a remote, or importing its history is a mutation and cannot be inferred from the existence of the local directory.

### 4.2 Artifact provenance and quarantine

Provenance processing is a separate evidence operation, not a build step. It produces an append-only ledger entry under an access-controlled evidence location that is excluded from the product repository and CI/build contexts. A content hash identifies bytes; it does not prove the right to use those bytes.

**Canonical artifact record.** For each object, record: `artifact_key`, provider and connector ID, provider object ID, observed parent/location, canonical source URL if applicable, MIME type, byte length, provider revision/ETag/version where available, acquisition timestamp, SHA-256 of the exact reviewed bytes, MD5 only as an observed duplicate clue, cryptographic hash algorithm, export method, claimed author/source, rights-holder identity and authority evidence, license and obligations, classification, permitted scope, reviewer/approver, decision date, related artifacts, and revocation/expiration status. Hash a Google Doc export separately from the mutable Google Doc itself, and retain the document revision/modified observation that produced it.

**Controlled acquisition.** A full artifact retrieval is prohibited until the user confirms the exact artifact list and data transfer. After confirmation, acquire one named version into a non-executable, access-controlled evidence area; compute SHA-256 before any static parsing; record the hash; and compare it to the approval record. Never retrieve into `src/`, a repository checkout, Docker build context, package cache, launcher slot, or CI workspace. Do not execute, compile, install, or unpack an archive merely to establish provenance. Any later static unpacking or scanning needs a second, artifact-specific approval and an isolated non-production review environment.

**Deduplication.** The observed MD5 collision groups establish byte-identical Drive blobs only at inventory time; they do not identify the authoritative revision or merge rights. Select at most one canonical provider object for review once the same SHA-256 has been independently computed after retrieval. Preserve alternate IDs as references, and never use a duplicate to extend an authorization that did not name the canonical bytes.[2][3]

**Automatic stop conditions.** Mark the item quarantined and cease downstream work on a missing/mismatched SHA-256; unknown or conflicting rights holder; missing modification/distribution scope; proprietary client/cache/map/protocol or brand linkage; live credential/private key; suspicious executable or nested archive; undocumented dependency; incompatible license; unexplained generated content; or a request to combine artifacts. Quarantine means preserve the minimum evidence and hash, not delete, publish, or share the material.

### 4.3 Manus task creation and task controls

Task creation is a **resource and budget mutation**, but it is not permission for the task to mutate a third-party system. A task can begin only from a finalized read-only/provenance report and a user-approved task manifest.

1. **Discover before selection.** Call `connector.list` and `skill.list` under the controller identity. Save the responses in the run record. Select only connector IDs and skill IDs that are returned and explicitly approved for that task. Do not rely on project-default connectors; task messages must supply the exact approved connector list, because omitted connectors can inherit project defaults.[7]
2. **Use scoped task manifests.** Each manifest names the purpose, permitted sources/paths, provider query budget, input-report hashes, expected structured-output schema, selected connector/skill IDs, retention class, maximum cost/time, and a prohibitions block: no writes, no credential requests, no code execution, no browser connection, no downloads beyond named metadata/text export, no source integration, and no external communications.
3. **Create only read-only task types initially.** Examples are `inventory-delta`, `provenance-gap-analysis`, `license-evidence-questionnaire`, and `clean-room-phase-1-plan-review`. The task prompt must require references to immutable IDs/hashes and an explicit `unknown` value instead of inference.
4. **Minimize data transfer.** Do not upload raw Drive archives, local source files, tokens, private keys, customer data, or credentials to Manus. If an approved report needs to be attached, upload only the reviewed, redacted report using the documented file mechanism and record its hash and resulting temporary file ID. A file upload is itself an external data transfer and needs confirmation. Uploaded Manus files are temporary; the controller’s evidence store remains authoritative.[7]
5. **Collect results safely.** Prefer structured output for machine processing; validate against the expected JSON schema and reject unknown fields, disallowed provider IDs, unrecognized links, and mutation recommendations that lack a required approval ID. Persist the raw task result, parsed result, task ID, input manifest hash, model/profile if reported, connector/skill IDs, and completion timestamp.
6. **Handle waiting states conservatively.** A `messageAskUser` request is a question to present to the user. Any other confirmation event is held for the user. The controller must not call `task.confirmAction` with acceptance, `global_allow`, or `always_allow` automatically. A rejection must be recorded without attempting a blind retry.[8]

The Manus API documentation reviewed for this plan does not establish a native `task.create` idempotency key. The controller must therefore implement its own durable idempotency ledger and must not assume that retrying a timed-out creation is safe.

| Controller event | Required idempotency rule |
|---|---|
| Create a read-only inventory/provenance task | Compute `operation_key = SHA-256(canonical JSON of policy_version, task_type, sorted input artifact hashes, allowed provider IDs/queries, connector IDs, skill IDs, structured-output schema hash, and approval ID)`. Place a unique constraint on it before any API call. |
| Duplicate request with a completed/running task record | Return the stored task ID and current state; do not create another task. |
| API timeout or ambiguous `task.create` response | Mark `CREATE_UNKNOWN`, preserve request/correlation data, and **do not retry automatically**. An operator reconciles the result using the controller audit record and available task evidence, then explicitly elects resume, cancel, or a newly approved task. |
| Task message/webhook result delivery | Deduplicate on provider event ID when supplied; otherwise use a hash of verified raw payload plus task ID, event type, and timestamp bucket. Persist before acting; results are append-only. |
| Artifact inventory query | Key by provider, allowlisted scope, normalized query, cursor/page, observed provider revision, and inventory policy version. A repeat with the same key returns the stored snapshot unless an explicitly approved refresh is requested. |
| Provenance record | Key by provider object ID, immutable revision/ETag if available, export/retrieval method, and SHA-256. A changed hash/revision creates a new record and restarts approval. |
| Any mutation | Key by target, desired-state manifest hash, approval ID, and change window. If status is uncertain, stop and reconcile from the target system before retrying. Never make a compensating mutation automatically. |

For a future asynchronous controller, use Manus status webhooks rather than frequent polling. Webhook registration needs separate confirmation. The receiver must require HTTPS, verify `X-Webhook-Signature` with the documented RSA-SHA256 process over `timestamp.full-url.sha256(raw-body)`, reject a timestamp more than five minutes old, cache the public key with a bounded TTL, and place verified events into the idempotency ledger before processing.[9] This is a design requirement only; no endpoint or background service is created by this plan.

### 4.4 Controlled mutations

A mutation may be proposed only after the earlier state transitions pass. The controller prepares a human-readable change set and waits. It may not combine unrelated writes under one approval.

| Mutation class | Examples | Minimum required confirmation |
|---|---|---|
| **Task/API spend** | `task.create`, an attachment upload, webhook creation, a task continuation that enlarges scope | Approve exact task manifest, data classification, maximum cost/time, connector/skill IDs, and expiration; approve again if inputs, scope, or connector changes |
| **Google Drive/Docs** | Create/upload/convert a Doc; edit, comment, move, copy, trash, restore, share, or change access | Approve document/folder IDs, exact content diff or artifact hash, access recipients/role, retention, and rollback/restore plan |
| **GitHub** | Initialize/publish repository; create branch/commit/tag/issue/PR/release; push; alter Actions, branch protection, collaborators, deploy keys, or secrets | Approve repository owner/name, remote URL, complete diff and generated-artifact list, branch/target, workflow effects, visibility, license, reviewers, and release destination |
| **Box/Dropbox/cloud search** | Upload/sync/move/share/delete; alter index/schema/retention; invite users | Approve connector, exact objects/paths, recipients, data classification, retention, and external consequences |
| **Evidence acquisition/static review** | Download a named archive, extract to isolated review storage, run a static scanner | Approve exact provider object ID/revision, expected hash if known, review host, tool list, output recipients, and confirm non-execution/no integration |
| **Build, test, release, or launcher signing** | Compile, execute tests with non-synthetic assets, publish packages/TUF metadata, code-sign, notarize, promote a channel, issue rollback | Separate release-owner confirmation after legal/provenance/security gates; dual approval for production signing or target metadata; no automatic promotion |

Each confirmation must be single-use, signed/audited in the controller record, show the exact proposed effect, expire quickly, and bind to the desired-state manifest hash. A changed hash, changed recipient, changed repository, changed selected connector, or changed task prompt invalidates it. The user must see the decision outcome. Never request a broad “allow all future changes” authorization.

## 5. Least-privilege identities and access design

| System | Read-only identity | Mutating identity | Required restrictions |
|---|---|---|---|
| **Manus API** | Prefer OAuth with only `create_task` for a controller that must see only its own tasks; use it only after user authorization | Separate, time-bound operational identity; webhook management only if genuinely needed | Keep task-creation and webhook/admin capabilities separate. Do not use `manage_all_tasks` unless cross-task administration is explicitly approved. Explicitly attach approved connectors/skills; no inherited defaults. |
| **Google Drive/Docs** | Dedicated principal restricted to named evidence folders and metadata/content read scope | Separate identity or temporary elevation for one approved write | No domain-wide access, ownership transfer, broad sharing, or permanent deletion. Never use Drive membership as ownership proof. |
| **GitHub** | GitHub App or fine-grained token with repository metadata/contents read for named repositories only | Separate app/token with the minimal content/PR/release scope for the approved repository and branch | Deny administration, organization management, Actions secrets, packages, and workflow writes by default. Require protected branches and MFA for future release owners. |
| **Box/Dropbox/cloud search** | Connector-issued read-only scope limited to named root folders or source collections | Separate, short-lived, user-approved write scope | Do not request account-wide sync or management permissions. Search snippets are treated as untrusted and potentially sensitive. |
| **Evidence store and controller database** | Service identity reads only its own tenant/run partition | Separate append-only writer; break-glass access logged | Encrypt at rest, tenant/project partitioning, retention clock, audit trails, and no product build mount. |
| **Release/signing system** | No general read of private key material | Managed signing/HSM service receiving only a digest/sign request | Root/release keys are offline or HSM/key-vault protected, with thresholds and dual approval. CI never gets exportable signing keys.[4] |

Project skills should be discovered by `skill.list` and pinned in the task manifest by returned ID and observed version/name. Enable only the skills relevant to the task—for example, a Google Workspace capability for an approved Drive inventory task or a GitHub capability for an approved repository metadata review. Do not give a task a general browser, cloud-search, code-execution, or integration skill merely because it may be useful later. A forced skill must be separately named in the manifest and treated as an additional privilege.

## 6. Secrets, sensitive data, and logging

1. Keep Manus API credentials, OAuth refresh tokens, GitHub tokens, provider credentials, webhook keys, code-signing material, database credentials, and any discovered corpus secret in a managed secret store or provider-managed connection—not in Git, Google Docs, Drive files, Box/Dropbox, task prompts, task attachments, shell history, logs, screenshots, issue bodies, or this provenance ledger.
2. Use workload identity or short-lived credentials where supported. The controller retrieves a secret only at runtime, passes it directly to the required client, and logs a non-sensitive credential reference/version—not the value, header, URL query token, or decoded payload.
3. Store connector IDs and secret references separately from provenance exports. A connector ID is not a secret, but it can reveal an integration surface and should be access-controlled.
4. Scan only approved evidence copies in isolation for credentials. On any possible live credential/private key finding: stop processing, do not reproduce it in a report, limit access, notify the designated security owner, rotate/revoke through the owner, and record a redacted incident reference. Do not validate a discovered credential by using it.
5. Redact logs before support export. Use correlation IDs, hashes, provider object IDs, and error classes rather than file content or personal data. Retain read-only query logs and approvals only for the documented minimum period; delete through approved retention procedures, never by unlogged permanent deletion.
6. The secure launcher path must keep update-signing keys distinct from TLS, platform-signing, database, and server-authentication keys. CI receives scoped signing requests, not exportable long-lived keys.[4]

## 7. Initial task catalog and approval gates

The following catalog supplies the only candidate task categories for the current phase. It does not create any task.

| Task type | Inputs | Permitted output | Connector/skill policy | Confirmation gate |
|---|---|---|---|---|
| `capability-discovery` | No corpus content; provider names and policy | Connector/skill availability matrix, including `unavailable` results | Manus API discovery only | User approves the discovery call and identity; no connector activation |
| `drive-inventory-delta` | Named Drive folders/IDs and prior inventory hash | Metadata-only delta report; new/changed/removed item IDs and revisions | Google capability only if discovered and explicitly allowed | User approves folders, query budget, and report audience |
| `docs-evidence-export` | Explicit Docs IDs and purpose | Hash-anchored plain-text evidence export and redacted review notes | Google capability only; no edit access | User approves each document ID and external data transfer |
| `github-provenance-review` | Explicit `owner/repo@commit` or release/tag IDs | Commit/license/NOTICE/SBOM provenance gap report | GitHub capability only if discovered | User approves named public/private repositories and report use |
| `cloud-evidence-search` | Approved queries, source roots, sensitivity labels | Source-link and metadata/snippet list marked unverified | Box/Dropbox/cloud-search connector only if discovery returns it | User approves connector, source roots, queries, and snippet retention |
| `provenance-gap-analysis` | Hash-anchored inventory reports, no raw archives | Per-artifact evidence checklist, stop conditions, questions for rights holder | No external connector unless an approved report attachment is used | User approves inputs, task spend, structured output, and retention |
| `clean-room-phase-1-review` | Original requirements and approved planning documents | Repository plan, synthetic-fixture checklist, non-infringement exclusions | No legacy-artifact connector or attachment | User approves task manifest; output is advisory, not a repository write |

The controller’s structured output schema for provenance tasks should require at least: `artifact_key`, `provider_id`, `observed_revision`, `sha256`, `classification`, `rights_evidence_status`, `technical_review_status`, `allowed_use`, `blocking_conditions`, `required_confirmation_ids`, `citations`, and `confidence`. It must prohibit “approved” as a value unless an external approval record ID is supplied and independently verified by the controller.

## 8. Phase 1 implementation sequence

1. **User approves the governance baseline.** Confirm the product is original, choose an internal codename, nominate legal/provenance, security, release, and data owners, and approve the evidence-store location, retention, and access policy. No legacy branding or corpus payload enters the project.
2. **Run capability discovery once.** Under a read-only controller identity, list available Manus connectors and skills. Produce an availability matrix. If Google Drive/Docs, GitHub, Box, Dropbox, or cloud search is absent, mark it unavailable and do not attempt an alternative connection method.
3. **Create an immutable inventory snapshot.** Conduct only the approved metadata/text-export queries. Record object IDs, query scope, document/export revisions, hashes, and access dates. Do not bulk synchronize or download binary archives.
4. **Create provenance ledgers outside the build tree.** Capture the canonical record fields and map each item to read-only evidence, candidate, or quarantined. The original implementation repository should contain only original/approved work and a non-sensitive quarantine notice that points to a report location, not a copy of evidence archives.[1]
5. **Collect written rights evidence for a named artifact, if any.** Require the actual rights holder, exact artifact ID/hash, authority, modification/distribution/commercial scope, territory, duration, sublicensing, third-party obligations, and revocation contact. A lawyer reviews legacy game, client, cache, protocol, brand, and content risk before status changes.[1][3]
6. **Only after a new confirmation, conduct an isolated static review.** Retrieve the approved bytes into evidence storage, compute SHA-256, compare it with the authorization, create SBOM/license/secret/malware/static-analysis outputs, and build only with synthetic fixtures if all gates authorize that narrow test. A failed gate returns the item to quarantine.
7. **Create the original project only after a repository-write confirmation.** Initialize a new clean-room Git repository, add documented exclusions/provenance gates, create original modules and synthetic fixtures, and establish CI that blocks provenance gaps, prohibited identifiers, unsigned assets, and untested migrations. Do not seed from any corpus archive or `combining.js`.
8. **Defer launcher distribution and production automation.** The launcher may be designed with original test artifacts only. TUF metadata, signing, publishing, platform packaging, telemetry, and controlled alpha are later gated release operations requiring legal clearance, security review, and dual approval.[4]

## 9. Acceptance criteria and audit trail

Before Phase 1 is declared complete, the following must be demonstrable: the source tree builds from original/synthetic inputs only; no Drive/Box/Dropbox/cloud-search artifact is required by the build; every included dependency and asset has a recorded license/approval; every external inventory result has a provider ID/revision/hash or is explicitly labeled unknown; no secret exists in the repository, reports, task attachments, or logs; the controller can prove a task was not duplicated; and every mutation has a bound, single-use user confirmation and an outcome record.[1]

The audit ledger should retain, per run: policy version; operation key; actor and identity class; task/approval IDs; selected connector and skill IDs; provider scope and query; source/artifact hashes; input/output hashes; state transitions; webhook verification/deduplication result; error class; mutation diff/desired-state hash; confirmation record; timestamps; and redacted result location. It should not retain raw secrets, unnecessary corpus content, full personal data, or exportable signing material.

## References

[1]: [Implementation Brief — 2006-Era Fantasy MMO Build](./implementation-brief.md)  
[2]: [2006scape RSPS Build — Google Drive Inventory](./drive-inventory.md)  
[3]: [Authorized Integration Map — Drive Artifact Intake](./authorized-integration-map.md)  
[4]: [Desktop Launcher / Bootloader Review for a Legally Safe RSPS-Like Game](./launcher-review.md)  
[5]: [Automation and Scheduling guidance](https://manus.im)  
[6]: [Google Workspace CLI best practices](https://github.com/googleworkspace/cli)  
[7]: [Manus API `task.create`](https://open.manus.ai/docs/v2/task.create) and [connector discovery](https://open.manus.ai/docs/v2/connector.list)  
[8]: [Manus API task lifecycle and confirmations](https://open.manus.ai/docs/v2/task-lifecycle)  
[9]: [Manus API webhook security](https://open.manus.ai/docs/v2/webhooks-security)
