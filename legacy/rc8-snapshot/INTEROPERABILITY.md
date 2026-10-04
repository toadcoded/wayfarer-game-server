# Client/server compatibility contract

## Connection lifecycle

1. Open ws://127.0.0.1:8081/socket from the exact served HTTP origin, offering `wayfarer.realm.v1`.
2. On open, send `encodeHello()` from `dist/realm-contract.js`.
3. Wait for a welcome; validate it with `decodeWelcome()`. Do not send movement before this step.
4. Decode subsequent snapshots using `decodeRealmSnapshot()` from `dist/replication.js`.
5. Send `encodeMoveIntent({sequence,dx,dz})` from `dist/movement.js`, increasing sequence per input.
6. On disconnect, discard the identity and pending input. A new connection starts a fresh handshake and character at the landing. No resume protocol exists.

REALM-CONTRACT.json is generated using `npm run contract:export` after building. It includes exact sample messages. The hello fits the existing 256-byte inbound transport budget; handshake parsing is strict on both sides. No optional extension fields are silently ignored.

## What is compared

The shared descriptor covers protocol version, world seed, generator version, scene revision, X/Z ground plane with Y-up metre convention, simulation tick milliseconds, and snapshot version. All fields must match exactly. The contract deliberately does not use package semver as proof of compatibility. A harmless package patch may remain compatible; a map, collider or physics change requires an appropriate descriptor revision even if the package change looks small.

The scene revision must be bumped when crossing geometry, collision placement, units or scene-generation semantics change incompatibly. A descriptor is a declared contract, not a cryptographic digest of every asset or source file. A dishonest or incorrectly labeled client can claim the descriptor; server authority must remain the final source of position and collision decisions.

## Rejection and resource handling

Missing or unsupported WebSocket subprotocols are rejected at HTTP upgrade. Browsers may expose only a generic connection failure for rejected upgrades. Once upgraded, invalid hello messages close with code 1008 and reason `invalid_handshake`; field mismatches use `incompatible_contract`; a silent client uses `handshake_timeout`.

Pending sockets reserve connection capacity without joining the realm. The default hello deadline is five seconds. Closing sockets continue to count against the underlying socket-capacity check until closed; a one-second termination fallback bounds rejection cleanup. A second hello after joining is invalid movement and cannot reset identity or sequence numbers.

The browser maps only known reason strings to user-facing text. It validates the welcome contract before storing its identity and accepting snapshots. Close events preserve compatibility-error text rather than replacing it with a generic reconnect prompt.

## Adapting a different client

An adapter must implement this wire contract and preserve the server-owned timing and identity boundaries. Coordinate adapters in the inherited code can translate selected grid frames; they do not establish semantic compatibility with a different terrain or physics engine. Ashfen, Manus and other reference branches are not connected merely by sharing these message fields.

No API credentials, Google connections, MCP server or external service is required for this local adapter. Accounts, verified authentication, encryption for public deployment, persistent state and cross-device tests remain separate work.

## Primary reference

WebSocket subprotocol selection is defined by RFC 6455. This rehearsal uses an application-specific private token; it does not claim IANA registration or interoperability with unrelated WebSocket applications.

https://www.rfc-editor.org/rfc/rfc6455
