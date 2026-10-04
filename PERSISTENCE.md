# Local profile persistence — v0.8 rc.6

This candidate adds a **local development persistence boundary**, not production account authentication.

## Enable it

```sh
PROFILE_DB=./runtime/profiles.json npm start
```

Without `PROFILE_DB`, the loopback realm behaves like earlier candidates and creates ephemeral session state.

With `PROFILE_DB` enabled:

- the HTTP host issues a server-signed `HttpOnly; SameSite=Strict` profile cookie;
- the WebSocket upgrade accepts only a cookie signed by this profile database;
- one local profile may have only one active realm socket at a time;
- character position, appearance, Quiet Tithe state, pack contents and equipped weapon are periodically saved and saved again on disconnect/graceful shutdown;
- a restarted process restores that server-owned profile after the browser presents its signed cookie;
- action sequence numbers, pending actions and transient result messages are deliberately **not** persisted;
- gathering cooldown is stored as remaining ticks, not an absolute realm tick, so restart does not create a stale timer;
- global shared scene state such as the beacon and reed-patch regeneration remains process-local in this candidate.

The JSON database contains a random HMAC secret plus versioned profile records. New database files are written with mode `0600`, and each update is written to a temporary file then atomically renamed. Writes are serialized so concurrent profile updates cannot silently overwrite one another.

## Identity boundary

The cookie value contains an opaque local account ID and an HMAC signature. The server never accepts an account ID from a gameplay packet. Tampered or unknown cookies cannot select another stored profile. The cookie is suitable only for loopback development because this host still uses plain HTTP/WS and has no real credential verification, TLS termination, recovery flow, password/passkey/OAuth system, revocation service or production session store.

Do not expose this local host to the Internet and do not describe the cookie as production authentication.

## Save schema

`src/persistence.ts` defines version 1 `PlayerSave` records:

- position: server-owned `x/z` location;
- gameplay: versioned private player state or null for realms without `GameActions`;
- gameplay includes appearance, quest progress and inventory/equipment;
- private transport connection IDs, cookies, HMACs, pending packets and transient result codes are excluded.

`GameActions` validates reward/item conservation both before export and on restore. The realm validates saved coordinates again through the navigation world before using them; the host falls back to the authored start if a saved location is no longer walkable.

## Replay interaction

Replay format v2 may include the **sanitized persisted gameplay state needed to reproduce a resumed simulation**, but never the profile cookie, account ID or transport connection ID. This keeps deterministic replay independent from authentication secrets.

The included `verification/session-replay-rc5-migrated.json` is a deterministic migration of the earlier rc.4 Chromium event capture into replay format v2/simulation revision 5. It preserves the 9,234 accepted/lifecycle events and ends at tick 4,293. It is regression evidence, **not a fresh rc.5 browser run**.

## Production work still required

Before real hosted accounts, replace the local JSON/cookie adapter with an authenticated gateway and durable transactional store. Required work includes TLS/WSS, real account ownership and recovery, session revocation, database migrations/backups, conflict policy, multi-process locking or a database transaction model, cloud staging, abuse/rate controls, observability and device/browser qualification.

## rc.6 boundaries

Reconnect is rejected while the prior disconnect save is pending. Periodic saves do not accumulate behind an outstanding write; admission is bounded when the queue is saturated. Shutdown throws after cleanup if saving failed. Cookies retain the prior one-year Max-Age policy; no revocation or production session-expiry service is implemented. Rename-based replacement is atomic but not a guarantee of recovery from power loss. Use a single process per profile file.
