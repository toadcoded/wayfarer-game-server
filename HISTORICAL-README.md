# Wayfarer v0.8 rc.11 — Gathering, banking and PvM rewards

New playable repeatable loop: Woodcutting, Mining and Fishing at the far landing; private resource banking and tool crafting at Halden; one banked Warden essence per contributing clear. Starter/Artisan/Masterwork tools yield 1/2/3 resources per successful action. See `SKILLING.md` for recipes and the first route. Existing Seraphine/3D roster, quest-earned weapons and exclusive combat builds remain integrated.

Current verification: 231 Node tests, two Python tests, eight validated assets; fresh contract-10 transport/replay/profile checks, including actual walking out, gathering a full pack, walking back, depositing and reopening the local bank. Gameplay saves are schema 3 with strict migrations from 1/2. GPU appearance and mobile visual QA remain open. This is still an internal v0.8 candidate, not final v0.8 or v0.8.1. Earlier descriptions below are historical.

New multiplayer renderer: real Babylon meshes for all six appearances, detailed Seraphine, distinct idle/walk profiles, pinned animated capes, Halden/Warden rigs, moonlight, landing lanterns and navy/gold controls. Existing validated positions, collision and earned equipment remain authoritative. Run `npm ci && npm start`, then open the printed loopback address. Drag to orbit; wheel to zoom. WebGL-unavailable browsers and the offline preview retain 2D rendering.

Current evidence: 223 Node tests, two Python tests, eight validated assets and fresh network/profile/replay checks. Headless scene tests do not prove visual fidelity. Cloud Chromium reports `WebGL not supported`; GPU and mobile visual QA remain open. This is a prototype causeway, not the finished castle/cavern/academy references. Presentation-only changes retain simulation contract 9. See `3D-RENDERING.md`. Notes below are historical.

New: explicit, exclusive Attack/Strength/Defence/Magic training, server-owned damage XP, independent skill levels and a provisional combat-bracket display. Local gameplay-save schema 2 retains XP/mode and migrates old schema-1 saves. The starter maul has a Strength-only requirement, with no Attack requirement. Staff users must explicitly choose Magic mode. See `ACCOUNT-BUILDS.md` for rules and planned back-slot equipment.

Current verification: TypeScript/Babylon build and 218 Node tests pass. Fresh contract-9 WebSocket recordings test damage, exclusive XP, replay and local-profile reopening. Full browser rendering/mobile QA remains open. Contract revision is 9; old clients are rejected. rc.8/rc.7 notes below are historical, not current-contract evidence.

Seraphine — Moonlit Sentinel is selectable in both Appearance menus, replicated in multiplayer and retained in local saved profiles. The supplied transparent artwork remains unchanged: a single-pose sprite, not a rigged 3D model. Her pictured sword is cosmetic and grants no equipment or combat advantage. See `SERAPHINE.md`.

Fresh rc.8 verification: 208 Node tests, two Python tests and all eight asset files pass. Revision-8 WebSocket restart/combat recordings replay correctly. Simulation contract revision 8 rejects older clients. The rc.7 description/evidence below is historical; current results are in `verification/rc8-tests.txt` and `verification/rc8-*.json`. Browser rendering remains unverified. Artwork rights must be checked before public distribution.

This candidate adds server-owned training combat to rc.6's authoritative movement, quest, inventory and local-profile persistence. It is not the final v0.8 release. The next public milestone after v0.8 remains v0.9.

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

See `LANTERN-TRIALS.md`, `VERIFICATION.md`, `PERSISTENCE.md` and `V0.8-READINESS.md`. The simulation contract is revision 7; older client contracts are rejected.
