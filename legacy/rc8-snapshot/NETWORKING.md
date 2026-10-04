# Local realm adapter contract

## Scope

The host binds 127.0.0.1 only. The exact served Origin and Host are required for upgrades. These checks limit accidental browser access from other sites; they do not authenticate a person or defend against another local process forging headers. No account system is present. HTTP/ws is used only for this loopback rehearsal; production transport and account authorization require a separate design.

GET / serves preview/realm.html. GET /socket is the WebSocket upgrade path. Only dist/ and preview/ assets are served. GET and HEAD are supported; other methods are rejected. Malformed request targets are rejected without stopping the server. This host is a development asset server, not a general-purpose static hosting service.

## Wire format

After the compatible client hello, the first outbound frame: {"kind":"welcome","id":"p1","contract":{...}}. Subsequent outbound frames use the strict RealmSnapshot version-1 schema. A welcome has no account/session credential. Public IDs are separate from server-private random connection IDs.

After the handshake, inbound frames are movement intents only: {"sequence":0,"dx":1,"dz":0}. Coordinates, player IDs, elapsed time and speed are not accepted input fields. Binary frames are rejected. Maximum inbound frame/message payload is 256 bytes, enforced by ws. Compression is disabled.

The host accepts at most 60 received messages in a one-second wall-clock window per connection before disconnecting it; WorldSession additionally limits processing to eight input packets per simulation tick. Validation and sequence rejection still apply. These are local rehearsal defaults, not measured Internet capacity targets. A paused simulation does not disable the wall-clock flood limit.

## Timing and queues

A monotonic performance.now clock drives the runtime, independent of input events. RealmRuntime advances at 20 Hz with the inherited four-step catch-up cap. Snapshots are emitted approximately at 10 Hz. Stalls discard excess simulation time; they do not create an unbounded backlog.

Before each server send, SocketFlowGate checks actual bufferedAmount plus the message's encoded byte count. Hard queue pressure terminates and removes the connection. Only welcome and state messages currently use this adapter; transient shedding remains a policy primitive. An actual saturated socket was not load-tested. The browser also closes if its input queue reaches 64 KiB.

Ping/pong probes run every 15 seconds; an unanswered prior ping causes removal at the next probe. Close/error paths release realm capacity. Server shutdown closes all connections and timers. Any realm advance/snapshot fault closes every peer and rejects further joins for that server instance. The host must be restarted; partial state is not resumed.

## Validation references

The implementation follows the ws API for HTTP upgrade handling, payload bounds, pong tracking and server cleanup. Runtime dependency is pinned in package-lock.json.

- https://github.com/websockets/ws
- https://github.com/websockets/ws/blob/master/doc/ws.md
- https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html

Before hosting: add verified authentication, action authorization, secure transport, session expiry/revocation, durable checkpoint/recovery semantics, real-browser checks and representative load tests. The present Origin check is not a substitute for those controls.

## v0.7.3 compatibility gate

The upgrade requires the wayfarer.realm.v1 subprotocol. Before movement, a client must send the strict hello from REALM-CONTRACT.json. Pending peers have a five-second default deadline and reserve connection capacity without creating a player. Rejections use close code 1008 and bounded reasons. See INTEROPERABILITY.md.
