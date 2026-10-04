# Wayfarer v0.8 rc.8 — Xam Kernel

This candidate builds on rc.7's authoritative movement, quest, inventory, combat and local-profile persistence with **Xam**, a protected server-owned autonomous training character. Xam is structurally outside player damage/retaliation paths, trains across a diverse skill registry with a strict five-minute-per-skill cap, exposes a server-only tool hook, and reports a liveliness heartbeat. It is not the final v0.8 release. The next public milestone after v0.8 remains v0.9.

## Start

Use Node 24. Run `npm ci`, then `npm start` for ephemeral multiplayer. For local saved profiles on macOS/Linux:

```sh
PROFILE_DB=./runtime/profiles.json npm start
```

On PowerShell, set `$env:PROFILE_DB="./runtime/profiles.json"` before `npm start`. Open the exact loopback address printed by the host. Separate browser profiles represent separate players. One signed profile can have one active realm socket. A reconnect can be denied while its disconnect save finishes; retry Join afterward.

## Play the slice

1. Join at Halden's near landing. Use arrows or the touch direction pad.
2. Accept Quiet Tithe, cross the causeway, gather three reed bundles and return to Halden.
3. Submit the reeds, claim one weapon, and equip it from Pack & equipment.
4. Return to the far landing and fight the Lantern Warden together. Attack with Space or the Attack button. Guard with G or the Guard button; shortcuts apply when focus is outside form controls.
5. Watch the orange warning ring and pulse countdown. Guard shortly before impact, or move more than 4 metres from the Warden. Return to Halden to heal.

| Weapon | Damage | Reach | Attack interval |
| --- | ---: | ---: | ---: |
| Unarmed | 4 | 3 m | 0.8 s |
| Reed blade | 7 | 3 m | 0.6 s |
| Ash staff | 9 | 8 m | 1.2 s |
| Granite maul | 16 | 3 m | 1.6 s |

The shared Warden has 80 health. Nearby living players trigger a 2-second pulse warning; impact deals 10 damage within 4 metres. Guard lasts 0.8 seconds, with a 1.8-second reuse interval. Characters have 40 health, recover from knockout after 5 seconds, and heal 4 health per second within 3 metres of Halden. Knockout does not remove equipment or prevent walking. Contributors still marked at defeat each receive one session victory; knockout clears contribution. The Warden returns after 8 seconds. Ranged players can attack outside the pulse ring. This is a cooperative training encounter, with no PvP, loot drops or combat currency.

Health, victories, Warden state and contribution reset with sessions/processes. Local profiles retain position, appearance, quest, inventory, equipment and gathering cooldown. Disconnecting gives fresh training health on rejoin. The client no longer overwrites a restored appearance at Join. ABC cape motion remains cosmetic; combat uses server-owned positions and equipped weapons, not cosmetic soft-body geometry.

## Verification and limits

Strict TypeScript/Babylon build and all **205 Node tests pass** using already-installed pinned dependencies. Fresh WebSocket restart and combat recordings replay deterministically. The combat transport check restores an item earned through the server reducer and verifies damage/cooldown over an actual socket.

**Fresh visual verification remains open:** bundled Chromium crashes with SIGSEGV before opening a page. Historical screenshots are not rc.7 evidence. This candidate's browser harness is included. No clean network dependency installation or physical mobile/browser matrix was completed.

The HMAC cookie and atomic JSON replacement are local development mechanisms, not production authentication or cloud storage. There is no transactional PostgreSQL, TLS gateway, account recovery/revocation, multi-process locking, durable world state, fsync-backed power-loss guarantee or automatic reconnect/resync. Unsaved progress can be lost on abrupt termination. The renderer remains a 2D canvas prototype with sprite characters and a simple Warden marker.

See `XAM.md`, `LANTERN-TRIALS.md`, `VERIFICATION.md`, `PERSISTENCE.md` and `V0.8-READINESS.md`. The simulation contract is revision 8; older client contracts are rejected.
