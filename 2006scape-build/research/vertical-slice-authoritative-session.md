# Authoritative Session and Protocol Boundary

**Track:** `authoritative-session`  
**Scope:** Smallest server-authoritative vertical slice for admission, movement, appearance confirmation, guide progress, overview reads, and connector traversal.  
**Status:** Design recommendation based only on the declared local project files. No Drive, legacy RSPS, cache, proprietary protocol, or other unverified material was imported, compiled, or operationalized.

## Decision

Build a **new, versioned session protocol** around an authoritative Go simulation. The client sends bounded requests and intents; it never supplies a position to commit, a route to trust, a world/overview record to persist, an appearance entitlement, or a completed guide state that has gameplay consequences. The server returns canonical snapshots and typed rejections.

The smallest useful loop is:

1. The account service issues a short-lived, single-use admission ticket after authentication. The game server verifies and atomically consumes that ticket, chooses a server-owned spawn, and creates an active session.
2. An active session can submit one-cardinal-step movement intents. The server checks the current tile, the authoritative navigation cell, and the current navigation revision before changing location.
3. At a server-defined mirror interaction point, the client confirms a closed, catalog-backed appearance selection. The server validates it, persists the canonical selection, and marks the corresponding guide observation.
4. The client may acknowledge strictly informational guide material. World-affecting guide milestones are derived from server-observed events rather than claimed by the client.
5. The client may request an overview. The server creates the overview from the avatar location and authoritative discovery/connector data; it does not accept client-supplied markers or region facts.
6. The client inspects a connector, then submits a traversal intent. The server checks the current endpoint, topology revision, availability, policy gate, and—where required—a short-lived inspection confirmation before atomically moving the avatar.

This is deliberately an **intent protocol**, not a replica of any earlier game protocol. It follows the clean-room brief’s requirement that a new protocol accept intent rather than client-authoritative state.[1]

## Current-state observations

The declared files already establish an appropriate authority boundary, but do not yet implement a session boundary.

| Area | What exists | Consequence for this track |
|---|---|---|
| World topology | `World` owns levels, walkability/support cells, connectors, `GraphRevision`, validation, and a pure `Traverse` evaluator. `Traverse` verifies command ID, graph revision, connector availability, and the player’s origin, then returns a destination; it does not persist player state or deduplicate commands.[2] | Preserve `World` as pure topology/rule data. Add a session application service that owns admission, state mutation, idempotency, and persistence. |
| Existing topology tests | Tests cover validation, a valid stairs transition, stale graph rejection, locked connectors, unsupported cells, and connector kinds.[3] | Extend rather than replace the topology test style. Add session-level contract tests for state mutation, revisions, ticket use, and wire behavior. |
| Beginner area | The client declares a protected welcome garden at `welcome-garden-ground`, spawn tile `(6,8)`, a mirror at `(8,8)`, and a departure gate at `(12,8)`. Its header explicitly states that admission, safe-zone, combat, and persistence must be server-enforced independently.[4] | Create a server-owned, original starter-world manifest or Go fixture with those semantic interaction IDs. Do not make the TypeScript presentation file the runtime authority. |
| Guide | The guide says movement completion is reaching a **server-approved** destination; overview, cosmetic confirmation, portal inspection, and departure have explicit completion signals. It also says guidance is client-presented while completion and rewards remain server-authoritative.[5] | Model guide completion provenance. Derive movement, overview, appearance, inspection, and traversal milestones on the server. Treat camera/pocketbook acknowledgements as non-rewarding UX records. |
| Appearance | Client appearance is explicitly cosmetic-only. Its patcher accepts presentation data, clamps material values, and says server code must validate cosmetic ownership.[6] | The game protocol must use closed selection IDs and a server catalog, not raw hexadecimal colors, arbitrary material payloads, renderer morphs, or client unlock claims. |
| Motion and rendering | Player motion is pose-only and never changes world position, collision, inventory, or outcomes. World micro-details and presentation metadata similarly cannot create collision or authority.[7] [8] [9] | The session protocol contains tiles, action/transition outcomes, and cosmetic selections only. It must contain no pose transforms, renderer offsets, decorative detail instances, or client collision data. |
| Overview | The client has `RealmOverview`/HUD types with active world space, level, markers, breadcrumbs, and objectives; these are currently presentation constructors.[8] | The overview must become a server-produced projection filtered by server-known location, discovery, and connector availability. |
| Content validation | The Ashfen JSON labels itself `original-authored-clean-room-content`, but it is not loaded by the examined Go code. By inspection, `watchtower-roof-ladder` points to a missing listed destination cell `(5,6)`, and `tunnel-crawl-branch` terminates on a crawl cell although current `World.Validate` requires a portal landing for non-door connectors. The present Go validator would reject either translation as written.[2] [10] | Do not use this JSON as vertical-slice runtime input until a separate original-content loader and validation fixture are made consistent. This track should use a small server-owned synthetic/starter fixture that passes `World.Validate`. |

There are two naming/version seams that should not be silently bridged. The presentation plan identifies a realm named `copper-lantern-realm-01` and a welcome level, while the expansion content uses `ashfen-frontier`; client safe-area data uses `sable-fen`.[4] [9] [10] The server must select one `WorldInstanceID` and content revision at admission. The client may render labels supplied by the server, but cannot select a world space by sending a string.

There is also a guide-policy seam. The safe-area configuration says protection lasts until `cosmetic-confirmed`, while the guide has eight steps and calls departure optional.[4] [5] The smallest safe policy is therefore: **appearance confirmation is the only gameplay gate for the beginner departure connector; all other guide milestones inform the UI and do not grant power, rewards, or access.** This honors the stated protected-area setting without converting optional reading or camera use into an access-control requirement.

## Authoritative model and trust boundary

> **Server authority means that a client request asks for an outcome, while only the server evaluates current state and commits the resulting state.** A response is a snapshot of that committed result, not confirmation that client data was accepted as truth.

The game server should receive only a verified admission ticket from the account boundary, then use one authenticated transport connection for a session. Authentication details, password handling, and account creation are out of this track. The game server must never receive a reusable password or trust a launcher update decision as login authorization; the launcher review makes the same distinction between build support and server enforcement.[11]

The server retains the following authoritative state per avatar:

- Active session identity, account/avatar binding, expiry, and a single-session policy.
- Canonical location, level, world instance, direction derived from accepted movement, and revision counters.
- Canonical cosmetic selection, appearance catalog revision, and appearance revision.
- Guide package/version and milestone records with a provenance of `observed` or `acknowledged`.
- Discovery records needed to filter the overview.
- A bounded command-receipt ledger keyed by command ID and request digest.
- Short-lived connector inspection confirmations, bound to the avatar, connector, direction, graph revision, and session.

The client may retain a prediction for responsive rendering, but must reconcile it to the authoritative snapshot. Its predicted path, interpolation, motion pose, camera state, cosmetics preview, overview layout, marker positions, and UI completion animations are all disposable presentation state. The motion and appearance source files support this split because they already prohibit presentation state from changing collision or gameplay.[6] [7]

## Smallest command loop

The protocol should start at `session/v1`. A single command envelope carries a protocol version, opaque command ID, and exactly one tagged command body. Decode only after a maximum message-size check and strict JSON/schema validation. Reject unknown fields and command kinds in version 1 rather than accepting “future” data loosely.

```text
Unauthenticated
  └─ AdmissionRequest(ticket) ──success──> Active(session snapshot)
                                              │
                                              ├─ MoveIntent ─────────────> committed snapshot
                                              ├─ ConfirmAppearanceIntent ─> committed snapshot
                                              ├─ GuideProgressIntent ────> committed snapshot or no-op receipt
                                              ├─ OverviewRequest ────────> overview projection (+ snapshot if guide changes)
                                              ├─ InspectConnectorRequest ─> connector description + confirmation token
                                              └─ TraverseIntent ─────────> committed snapshot

Active ── disconnect/expiry/revocation ──> Closed
```

### 1. Login admission

`AdmissionRequest` contains a short-lived signed ticket, a supported `ProtocolVersion`, and a client build identifier used only to apply the server’s independently maintained compatibility policy. It contains no requested spawn tile, appearance, guide completion, or account role.

The admission service must validate ticket signature/key ID, issuer, audience, expiry, nonce, account/avatar binding, and protocol/build compatibility. It must atomically mark the ticket nonce consumed before an active session is returned. It then loads the avatar under a per-avatar lock or serializable transaction. A valid persisted location is retained only when it belongs to the selected world instance and passes current world validation; otherwise the server selects the configured protected spawn. For a first avatar, the server selects a deterministic point within the configured server-side welcome spawn rule, not a tile supplied by the client.

The admission response creates a random session ID/token, returns an authoritative `SessionSnapshot`, and supplies the current content/topology revisions. The ticket itself, its signature, and any account credential must never be echoed. A second login policy should be explicit: reject when an active lease exists, or invalidate the old lease atomically. For this slice, rejecting `avatar-already-active` is simpler and avoids duplicated command streams.

### 2. Movement intent

Use a single-tile cardinal movement command first. It is smaller, deterministic, easy to test, and cannot hide teleportation in a client route.

```go
type MoveIntent struct {
    CommandID                CommandID
    ExpectedLocationRevision uint64
    KnownNavigationRevision  uint64
    Direction                Direction // north, east, south, west
}
```

The server derives the target from the current canonical tile and direction. It verifies that the session is active, that `KnownNavigationRevision` equals the selected world’s current navigation revision, that the expected location revision matches, that the target remains on the current level, and that the target cell is in bounds and walkable. Normal movement never crosses a connector or level boundary. The server commits exactly the derived target and facing, increments `LocationRevision` and aggregate `StateRevision`, writes a command receipt in the same transaction, and emits the snapshot.

This design intentionally does not accept `x`, `y`, level ID, a movement speed, a route array, a collision claim, or animation state. A later authoritative pathfinding feature can add a separate bounded destination command, but it should be a new command kind that returns a server-calculated path or advances on server ticks. It must not turn the current intent into a trusted client route.

### 3. Appearance confirmation

The client may preview freely, but confirmation must occur only at a server-defined `cosmetic-mirror` interaction point, such as the Stillwater Mirror. The server checks reachability/adjacency against authoritative tile and interaction data; an `atMirror: true` field from the client is never sufficient.

```go
type ConfirmAppearanceIntent struct {
    CommandID                CommandID
    ExpectedAppearanceRevision uint64
    KnownAppearanceCatalogRevision uint64
    InteractionID            InteractionID // must resolve to cosmetic-mirror
    Selection                AppearanceSelection
}

type AppearanceSelection struct {
    SchemaVersion      uint16
    GenderPresentation GenderPresentationID
    BodyArchetype      BodyArchetypeID
    FaceShape          FaceShapeID
    EyeShape           EyeShapeID
    HairStyle          HairStyleID
    PaletteID          PaletteID
    ScarIDs            []CosmeticID
    Freckles           bool
    FacialHairStyle    FacialHairStyleID
    OutfitIDs          []CosmeticID
}
```

`AppearanceSelection` is closed over a server catalog. Catalog entries define compatibility, feature limits, and ownership/unlock rules. The slice may provide an original starter catalog where all starter entries are allowed. It must reject raw colors, arbitrary material arrays, renderer texture keys, arbitrary strings, and body dimensions; those can expand visual attack surface and conflict with the client file’s own warning that the server must validate ownership.[6]

On success, the server canonicalizes and persists the selection, increments `AppearanceRevision` and `StateRevision`, and records `shape-character` as an `observed` guide milestone in the same transaction. It never adjusts hitboxes, movement, combat, permissions, clearance, rewards, or the player’s world tile.

### 4. Guide progress

The guide state is a UX ledger, not an entitlement system. Its package ID and allowed step IDs are server-owned values. No guide command can directly award items, currency, combat power, unlock a dungeon, change safe-area policy, or bypass connector checks.

```go
type GuideProgressIntent struct {
    CommandID            CommandID
    ExpectedGuideRevision uint64
    GuidePackageID       string
    StepID               GuideStepID
    Acknowledgement      *GuideAcknowledgement // only for client-visible steps
}

type GuideCompletionSource string
const (
    GuideObserved     GuideCompletionSource = "observed"
    GuideAcknowledged GuideCompletionSource = "acknowledged"
)
```

The server resolves completion by step class:

| Guide step | Source of truth in this slice | Completion rule |
|---|---|---|
| `look-around` | Client acknowledgement only | Record as `acknowledged`; it is informational and has no gameplay effect. |
| `move` | Accepted movement events | Mark `observed` only when the server places the avatar on a configured guide destination. |
| `open-overview` | Successful `OverviewRequest` | Mark `observed` on first successful authoritative overview response. |
| `shape-character` | Successful appearance confirmation | Mark `observed` in the confirmation transaction. |
| `read-pocketbook` | Client acknowledgement of an allowlisted page ID | Record as `acknowledged`; no reward or gate follows from it. |
| `try-safe-interaction` | Not yet implemented | Do not allow a client claim to complete it. Keep it pending until an authoritative interaction-result command exists. |
| `learn-portal` | Successful `InspectConnectorRequest` for the departure gate | Mark `observed`. |
| `leave-garden` | Successful departure traversal | Mark `observed` after the committed transition. |

A direct `GuideProgressIntent` is accepted only for the two informational classes and only with the current package/version and an allowlisted page/acknowledgement shape. For observed classes, it returns `guide-evidence-required`; the relevant command owns the state transition. Duplicate completion is a successful idempotent no-op with the existing completion record. Steps do not need to be completed in order because the current guide says departure is optional and the only required protected-area gate is appearance confirmation.[4] [5]

### 5. Overview request

```go
type OverviewRequest struct {
    CommandID             CommandID
    KnownContentRevision  uint64
    KnownDiscoveryRevision uint64
}
```

This is a read request, not an upload of `RealmOverview`. The server projects: current world instance and level, canonical active player tile, public landmarks for the level, discovered landmarks, connector markers, connector availability, and an authoritative breadcrumb. It must use semantic marker/interaction IDs and may include server-approved labels. The client decides icon art, map layout, colors, and animation. This aligns with the existing presentation rule that the player marker remains visually dominant, without making the presentation plan authoritative.[8] [9]

The first successful request may atomically record the `open-overview` observed milestone. If it does, return a normal overview response plus the changed snapshot/revisions. If it does not, it is read-only and does not increment `StateRevision`. A stale `KnownContentRevision` should yield a fresh projection marked `resyncRequired`, not a stale-data mutation; the client can replace its cached overview.

### 6. Connector inspection and traversal

Inspection is the smallest safe precondition for a deliberate portal transition. It exposes the connector ID, kind, origin/destination level labels appropriate to the avatar, availability, and a non-secret policy message. For connectors requiring confirmation, it returns an unguessable short-lived confirmation token. The token binds session ID, avatar ID, connector ID, origin tile, traversal direction, graph revision, and expiry. It is single-use.

```go
type InspectConnectorRequest struct {
    CommandID          CommandID
    ConnectorID        string
    KnownGraphRevision uint64
}

type TraverseIntent struct {
    CommandID                CommandID
    ConnectorID              string
    ExpectedLocationRevision uint64
    KnownGraphRevision       uint64
    ConfirmationToken        string // required only by connector policy
}
```

Traversal resolves the connector direction from the authoritative current tile. A bidirectional connector may be used from `From` to `To` or, when `Bidirectional` is true, from `To` to `From`; the returned origin/destination must reflect that resolved direction. This corrects a current gap: `Connector.Bidirectional` exists, but the examined `World.Traverse` accepts only `player.Tile == connector.From`.[2] The world loader may normalize each valid bidirectional connector into two directed edges, or `ResolveConnectorTraversal` may derive a directed edge at evaluation time. Choose one representation and use it consistently for validation, overview, inspection, and execution.

The server then verifies the active session, command receipt, expected location revision, exact current endpoint, graph revision, connector existence/kind, open and unlocked status, clearance/content validity, confirmation token when configured, and any explicit policy gate. The beginner departure policy checks a canonical appearance-confirmed fact, not a guide text acknowledgement. A successful traversal atomically changes tile/level, increments `LocationRevision`, `TransitionRevision`, and `StateRevision`, consumes the confirmation token, records `leave-garden` when applicable, and stores the receipt. A locked dungeon is rejected without state change.

## Revisions, receipts, and transactional rules

Every revision is server-generated, unsigned 64-bit, monotonically increasing, and starts at one. Revision zero means “no known revision” and is never accepted for a mutating operation after admission. Revision numbers are logical concurrency markers, not client timestamps.

| Revision / record | Owner and increment rule | Client use |
|---|---|---|
| `StateRevision` | Avatar state; increment once for every successful persistent state transaction, including a first-time derived guide completion. | Snapshot ordering and resync detection. Do not use as the sole per-command precondition. |
| `LocationRevision` | Avatar location; increment for accepted cardinal movement and accepted connector traversal. | Required by movement and traversal intents. |
| `AppearanceRevision` | Appearance selection; increment only after a canonical appearance commit. | Required by appearance confirmation. |
| `GuideRevision` | Guide completion ledger; increment when a new acknowledged or observed milestone is persisted. | Required by informational guide acknowledgement; returned after all derived completions. |
| `TransitionRevision` | Connector transitions; increment only on an accepted traversal. | Returned for transition animation/reconciliation and audit. |
| `NavigationRevision` | Server-owned walkability/grid content for the selected world. | Required by movement. Mismatch rejects the mutation and asks for snapshot resync. |
| `GraphRevision` | Server-owned connector graph/availability content. Existing `World.GraphRevision` can serve this role after directed-edge semantics are fixed.[2] | Required by inspect/traverse. Mismatch rejects the mutation and asks for refresh. |
| `AppearanceCatalogRevision` | Server-owned allowed cosmetics and combinations. | Required by appearance confirmation. Mismatch rejects and returns catalog/snapshot refresh metadata. |
| Command receipt | Per avatar, keyed by command ID plus canonical request digest. Stored with the mutation/rejection outcome in the same transaction. | Same ID and digest returns the original response; same ID with a different digest is rejected. |

The admission snapshot must include world instance ID, protocol version, all current revisions, canonical avatar location, appearance, safe-area status, guide ledger, and content revision. It may omit undiscovered overview data. Every state-changing success returns the new snapshot or a compact delta containing enough values to reconstruct it; for the first vertical slice, return the full snapshot to keep reconciliation simple.

For a mutating command, the processing order is fixed: authenticate the session; enforce size/rate limits; look up the command receipt; validate the relevant expected revision and current world data; evaluate the authoritative rule; write avatar state, guide side effects, confirmation-token consumption where applicable, and receipt in one transaction; then publish the response. A stale or rejected command must not partially change guide state, location, appearance, or token validity. Store bounded terminal rejection receipts as well as success receipts so retries do not become alternate executions; a client must use a new command ID after correcting a rejected request.

Do not use the client clock for expiry, guide timestamps, ticket expiry, or cooldown policy. Use server time. Keep one per-avatar command serialization mechanism—an actor/mailbox, keyed mutex plus database transaction, or serializable row lock—so a movement and traversal race cannot commit two incompatible locations.

## Typed rejection contract

Return a stable code, a safe short message key, the command ID, and resynchronization metadata when relevant. Do not expose stack traces, ticket claims, database keys, hidden connector prerequisites, or raw authorization decisions.

| Command | Required rejection cases |
|---|---|
| Admission | `unsupported-protocol`, `unsupported-build`, `ticket-malformed`, `ticket-invalid`, `ticket-expired`, `ticket-replayed`, `ticket-audience-mismatch`, `avatar-already-active`, `avatar-unavailable`, `world-unavailable`, `rate-limited`. |
| Any active-session command | `session-missing`, `session-expired`, `session-revoked`, `message-too-large`, `invalid-schema`, `unknown-command`, `command-id-reused-with-different-payload`, `rate-limited`. |
| Movement | `stale-location-revision`, `stale-navigation-revision`, `invalid-direction`, `target-out-of-bounds`, `target-not-walkable`, `movement-crosses-connector`, `movement-not-allowed`. |
| Appearance | `stale-appearance-revision`, `stale-appearance-catalog`, `unknown-interaction`, `not-at-cosmetic-mirror`, `unsupported-appearance-schema`, `invalid-appearance-selection`, `cosmetic-not-entitled`, `appearance-payload-too-large`. |
| Guide | `unknown-guide-package`, `unknown-guide-step`, `stale-guide-revision`, `guide-evidence-required`, `invalid-guide-acknowledgement`, `guide-step-not-supported`. |
| Overview | `stale-content-revision` only as a resync signal where a strict view is requested; otherwise return `resyncRequired: true` with the fresh view. Never reject merely because a marker is undiscovered—omit it. |
| Inspection / traversal | `stale-graph-revision`, `unknown-connector`, `not-at-connector-origin`, `connector-direction-not-allowed`, `connector-unavailable`, `connector-locked`, `connector-policy-not-met`, `confirmation-required`, `confirmation-invalid`, `confirmation-expired`, `confirmation-already-used`, `stale-location-revision`. |

The rejection vocabulary should be constants in the protocol package and should be contract-tested. Existing `fmt.Errorf` strings in `World` are useful internal diagnostics but are not a safe wire contract.[2]

## Concrete next files and Go types

Keep the topology package clean and add the smallest authority layer beside it. These are proposed files, not instructions to import or reuse any legacy material.

| Next file | Purpose | Principal types/functions |
|---|---|---|
| `src/cleanroom-world/session_types.go` | Canonical session/avartar state and typed commands. | `SessionID`, `CommandID`, `WorldInstanceID`, `AvatarState`, `SessionSnapshot`, `Revisions`, `AdmissionRequest`, `MoveIntent`, `ConfirmAppearanceIntent`, `GuideProgressIntent`, `OverviewRequest`, `InspectConnectorRequest`, `TraverseIntent`, `CommandReceipt`, `RejectionCode`. |
| `src/cleanroom-world/session_service.go` | Per-avatar serialized application service; no network parsing. | `SessionService.Admit`, `ApplyMove`, `ConfirmAppearance`, `AcknowledgeGuide`, `BuildOverview`, `InspectConnector`, `Traverse`, `Close`. |
| `src/cleanroom-world/session_repository.go` | Persistence boundary that makes state/receipt/token changes atomic. | `AvatarRepository.WithAvatarTx`, `ConsumeAdmissionTicket`, `PutCommandReceipt`, `ConsumeConfirmation`, `SaveAvatar`. Use an in-memory test implementation first. |
| `src/cleanroom-world/session_content.go` | Server-owned original starter catalog, guide evidence policy, interaction points, spawn rule, and connector policy. | `SessionContent`, `InteractionPoint`, `AppearanceCatalog`, `GuideDefinition`, `ConnectorPolicy`, `StarterWorldInstance`. |
| `src/cleanroom-world/world.go` | Small targeted topology changes. | Add `NavigationRevision`; add `ResolveConnectorTraversal(playerTile, connectorID)` or normalize directed edges; retain `Validate` as a content gate. Do not put account/session state in `World`. |
| `src/cleanroom-world/protocol_v1.go` | Strict transport DTOs and conversion into domain types. | `ClientEnvelopeV1`, `ServerEnvelopeV1`, `DecodeStrict`, `EncodeSnapshot`, `EncodeRejection`. Keep transport JSON separate from domain structs. |
| `src/cleanroom-world/session_contract_test.go` | Wire/domain contract tests and golden JSON fixtures. | Commands, responses, rejection codes, unknown-field behavior, and version compatibility tests. |
| `src/cleanroom-world/session_service_test.go` | Deterministic authority and concurrency tests. | Admission, serial command application, revisions, idempotency, guide derivation, overview filtering, and connector policy tests. |
| `docs/protocol/session-v1.md` | Human-readable, original protocol specification and compatibility rules. | Version policy, schema field tables, response/rejection meanings, and examples using synthetic identifiers only. |
| `src/cleanroom-world/content/starter_session_fixture_test.go` | Test-only original world fixture that passes `World.Validate`. | Welcome garden cells, mirror, departure connector, guide target, and an intentionally locked connector. Do not load the currently inspected Ashfen JSON until a separate loader validation track resolves its inconsistencies. |

The following core types show the intended separation. Field details can evolve, but their authority ownership should not.

```go
type Revisions struct {
    State             uint64
    Location          uint64
    Appearance        uint64
    Guide             uint64
    Transition        uint64
    Navigation        uint64
    Graph             uint64
    AppearanceCatalog uint64
}

type AvatarState struct {
    AvatarID       string
    AccountID      string
    WorldInstance  WorldInstanceID
    Tile           Tile
    Facing         Direction
    Appearance     AppearanceSelection
    Guide          GuideState
    Discovery      DiscoveryState
    Revisions      Revisions
}

type GuideState struct {
    PackageID   string
    PackageRev  uint64
    Completed   map[GuideStepID]GuideCompletion
}

type GuideCompletion struct {
    Source GuideCompletionSource
    AtStateRevision uint64
}

type CommandReceipt struct {
    CommandID     CommandID
    RequestDigest [32]byte
    Outcome       CommandOutcome // accepted or rejected
    Response      []byte         // canonical encoded response or durable result record
    ExpiresAt     time.Time
}
```

Use a server-selected `WorldInstanceID` outside `Tile` until topology is explicitly upgraded. The existing `Tile` includes only coordinates and level ID, so it cannot by itself distinguish two instances that reuse level names.[2]

## Contract-test plan

The vertical slice is acceptable only when the following contract tests pass using synthetic/original fixtures. These tests should exercise the protocol decoder and the service separately; no test may import, compile, or contact a legacy client/cache/protocol.

| Test group | Contract assertion |
|---|---|
| Admission | A valid unconsumed ticket produces an active session, server-chosen protected spawn, complete revision snapshot, and no echoed ticket. Expired, wrong-audience, malformed, replayed, and concurrent duplicate ticket use are rejected. |
| Strict boundary | Unknown JSON fields, wrong scalar types, oversized strings/arrays, duplicate object fields if the decoder can detect them, unsupported protocol versions, and unknown command kinds reject before state evaluation. |
| Movement authority | A valid cardinal intent moves one derived walkable tile. Diagonal, zero/invalid direction, teleport coordinates, route arrays, blocked/out-of-bounds targets, level changes, stale location revisions, and stale navigation revisions leave state unchanged. |
| Movement idempotency/concurrency | Repeating an accepted command ID and identical digest returns byte-equivalent logical outcome without another revision increment. Reusing its ID with a different payload rejects. Two simultaneous commands based on one location revision result in at most one committed location change. |
| Appearance authority | At the server mirror, a current catalog-backed starter selection persists canonically, increments only the appearance/state/guide revisions required, and never alters tile/collision/gameplay fields. Unknown IDs, raw colors/materials, unowned cosmetic IDs, stale catalog/revision, too many scars/outfits, and off-mirror confirmation reject without mutation. |
| Guide provenance | Movement, overview, appearance, inspect, and departure derive their listed `observed` milestones. A client cannot directly claim them. Informational camera/pocketbook acknowledgements are recorded as `acknowledged`, produce no reward/access change, and are idempotent. `try-safe-interaction` returns `guide-step-not-supported` until an authoritative interaction command exists. |
| Overview projection | The response reports the canonical avatar level/tile and only server-authorized/public/discovered markers. A fabricated client marker cannot appear because no marker field exists in the request. A first response marks overview observed once; subsequent reads do not bump state. |
| Connector inspection | Inspection fails away from either valid endpoint or on a stale graph. A valid departure inspection returns a confirmation bound to that session/avatar/connector/direction/graph revision and expires or becomes invalid after use/topology change. |
| Connector traversal | Valid configured departure traversal changes level/tile once, increments location/transition/state, consumes confirmation, and marks departure observed. Origin mismatch, stale graph/location, locked/unavailable connector, invalid/expired/reused confirmation, and missing appearance gate reject with no partial mutation. Test both directions for every bidirectional connector and reject reverse use for one-way connectors. |
| Content gate | The starter fixture validates under `World.Validate`. A fixture with a missing endpoint, unsupported cell, wrong support, unknown connector kind, or invalid clearance fails before admission. Add a regression that the current unmodified Ashfen source is not loaded by this slice; if a future loader is introduced, it must report the identified invalid references rather than silently repairing them. |
| Fuzz/property tests | Fuzz strict decoding and all command payloads for panic freedom, bounded memory use, no acceptance of unknown fields, and no state mutation after any rejection. Property-test that every accepted committed tile is a walkable authoritative cell and every completed observed milestone has a corresponding accepted event. |

## Acceptance criteria

The track is complete when all of the following are demonstrably true:

1. A newly designed `session/v1` contract and Go authority service exist without a dependency on Drive, legacy RSPS, cache, proprietary client, legacy protocol, or unverified artifact.
2. Admission uses short-lived, audience-bound, single-use tickets, chooses a server-owned spawn, and returns a canonical snapshot without exposing ticket material.
3. The only location-changing commands are server-evaluated one-tile movement and server-evaluated connector traversal. No client position, route, speed, collision, level, or animation state is committed.
4. Appearance confirmation is allowed only at an authoritative mirror and accepts only a server-catalog selection. It has no gameplay effect beyond the explicit beginner departure gate.
5. Guide milestones have provenance. Server-observable events are not client-claimable, informational acknowledgements do not grant power, and unsupported interaction progress is explicitly deferred.
6. Overview data is server-projected from current authoritative location/discovery/topology. Client overview data is never persisted as world truth.
7. Connector inspection/traversal uses current topology revisions, correct bidirectional semantics, policy gating, and one-use confirmation where configured. A failure cannot partially move the avatar or complete a guide step.
8. All state-changing commands are idempotent by command ID and digest, revision-checked at the correct domain boundary, transactionally committed with their receipts, and serialized per avatar.
9. The contract-test plan passes with a wholly original/synthetic server fixture, including malformed-input, stale-revision, replay, race, and topology-invalid cases.
10. The existing Ashfen JSON remains outside the vertical-slice runtime path until a separate clean-room content-loader/validation decision resolves its current incompatibilities with `World.Validate`.[2] [10]

## Risks and mitigations

| Risk | Why it matters | Mitigation / decision gate |
|---|---|---|
| Client and server identifiers drift | Safe-area, guide, presentation, and expansion files currently use related but non-identical world/level terminology.[4] [5] [9] [10] | Establish `SessionContent` as the authoritative ID registry; add contract fixtures that fail on unknown guide, interaction, level, and connector IDs. Do not infer aliases at runtime. |
| Connector semantics remain incomplete | `Bidirectional` is not honored by current traversal, and current content includes endpoints incompatible with validation.[2] [10] | Complete `ResolveConnectorTraversal` and test directed edges before enabling any content beyond the starter fixture. Fail content load rather than auto-correcting it. |
| Client cosmetic payload becomes an injection surface | The current presentation model has free-form color/material strings intended for rendering.[6] | Use closed catalog IDs over the wire, strict decode limits, and server canonicalization. Keep renderer materials client-local. |
| Guide is mistaken for security policy | Client acknowledgements such as reading or camera use cannot be independently proven and should remain optional.[5] | Separate UX progress from authorization. Gate departure only on canonical appearance confirmation plus explicit connector policy. |
| Duplicate/reordered network delivery | Retries and reconnects can otherwise double-apply movement or traversal. | Persist command ID/digest/outcome atomically, use scoped revisions, and make responses replayable from the receipt ledger. |
| Session races across devices/connections | Two streams can commit inconsistent avatar locations. | Enforce one active lease initially and serialize commands per avatar; make session revocation/expiry explicit. |
| Stale client content | A client can show a connector or walkable cell that changed on the server. | Require navigation/graph/catalog revisions on mutations; return explicit resync metadata and authoritative snapshot. |
| Scope creep into combat, inventory, or generic interactions | Those systems add economic and security consequences before the boundary is proven. | Keep this track to the six named flows. Treat `try-safe-interaction` as deferred until its own authoritative command/result contract is designed. |
| Clean-room/provenance regression | A tempting shortcut could connect the server to unverified corpus material. | Keep runtime fixtures original/synthetic, retain the quarantine boundary, and add CI checks that no forbidden Drive paths/artifacts enter build inputs, consistent with the implementation brief.[1] |

## Recommended implementation order

First add the server-owned starter fixture, `NavigationRevision`, directed connector resolution, and content validation tests. Second implement admission, immutable snapshots, and command receipt persistence with an in-memory repository. Third add one-step movement and its stale/idempotency/race tests. Fourth add mirror-bound appearance and guide derivation. Fifth add overview projection. Sixth add inspection, confirmation tokens, and departure traversal. Only after that loop passes end-to-end should the project add generic interaction, longer pathing, persistence backing, additional maps, or economy/combat systems.

This order yields a narrow but real session loop while preserving the decisive boundary: **the server owns world truth; the client presents and requests.**

## References

[1]: file:///home/ubuntu/2006scape-build/research/implementation-brief.md "Implementation Brief — 2006-Era Fantasy MMO Build"
[2]: file:///home/ubuntu/2006scape-build/src/cleanroom-world/world.go "Current clean-room world topology and traversal implementation"
[3]: file:///home/ubuntu/2006scape-build/src/cleanroom-world/world_test.go "Current clean-room world topology tests"
[4]: file:///home/ubuntu/2006scape-build/src/cleanroom-client/beginner-safe-area.ts "Beginner-safe login area presentation configuration"
[5]: file:///home/ubuntu/2006scape-build/src/cleanroom-client/beginner-guide-package.ts "Beginner guide package and pocketbook content"
[6]: file:///home/ubuntu/2006scape-build/src/cleanroom-client/player-appearance.ts "Original player appearance data and surface materials"
[7]: file:///home/ubuntu/2006scape-build/src/cleanroom-client/player-motion.ts "Original procedural player motion"
[8]: file:///home/ubuntu/2006scape-build/src/cleanroom-client/world-detail-pass.ts "Micro-detail and overview presentation data"
[9]: file:///home/ubuntu/2006scape-build/src/cleanroom-client/world-presentation-organization.ts "World presentation organization"
[10]: file:///home/ubuntu/2006scape-build/src/cleanroom-world/content/ashfen-expansion-v1.json "Ashfen expansion original-authored clean-room content manifest"
[11]: file:///home/ubuntu/2006scape-build/research/launcher-review.md "Desktop Launcher / Bootloader Review for a Legally Safe RSPS-Like Game"
