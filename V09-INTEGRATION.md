# Wayfarer v0.9 rc.1 — Artwork & recovery consolidation

This candidate continues directly from v0.8 rc.25 and preserves the playable causeway, eight named friendly NPCs, wildlife, articulated characters, cape motion, 23 skill drills, gathering, training combat, inventory, local profile persistence, PGlite visual preferences, weather, daylight, shallow wading and the comfortable HUD. It is a tested local prototype candidate, not a finished production MMORPG.

## Added artwork

The original Harvest Festival JPEG hangs in a landscape wood-and-gold frame on a decorative wall near Mirella. The original adventurer painting remains behind Tovik. Both image files are served locally as image/jpeg and retain their supplied bytes and proportions. Art-directory entries restrict renderer selection to bundled known assets; JSON provenance files record dimensions and SHA-256. The festival depicted in the illustration is artwork, not an implemented event or its XP/item rewards. Both walls remain outside the centre walking lane and do not create new collision or gameplay actions.

## Recovery paths

| Surface | Behavior |
| --- | --- |
| Graphics module unavailable | Keep the existing 2D canvas visible; expose Retry 3D in Settings |
| Renderer frame throws | Dispose the renderer, remove its overlay and return to 2D drawing without disconnecting gameplay |
| Repeated graphics retry | Coalesce in-progress loads; retain one renderer owner |
| Page closes while renderer loads | Release the late renderer; prevent a stale canvas from becoming active |
| Cleanup throws | Continue fallback rather than stopping recovery |
| Painting texture fails | Keep its frame and a neutral canvas, report unavailable and allow Reload paintings |
| Older texture callback arrives | Ignore callbacks from an older load attempt or disposed painting |
| Settings data corrupt/over 1KB | Use bounded defaults; reject unsupported sizes/heights |
| Browser blocks storage/quota | Keep settings controls operable in memory |
| Hidden/mis-sized HUD | Reset interface layout restores Normal size, 55% height and both overlays |
| Frame-loop error | Schedule subsequent frames and retain controls/connection |

Settings also displays the current height percentage and painting load status. The graphics factory releases its engine when scene initialization fails. Gameplay transport, identity, XP and profile schemas remain server-owned and unchanged by this visual/recovery pass. Simulation contract stays revision 15, scene revision 2 and save schema 5; v0.9 is a release label, not a new wire protocol.

## Verified and remaining scope

Strict compilation/browser bundles, 297 Node tests, real WebSocket practice/gathering/combat/travel/persistence captures and deterministic replay passed. Two Python tests and eight source asset checks also passed. HTTP tests verify both original JPEGs byte-for-byte. A real Babylon NullEngine realm frame failure is injected, its meshes/materials are released, and a fresh scene resumes painting. This establishes code ownership and recovery behavior, not a GPU screenshot or real device frame-time result.

Actual Chromium/WebGL and iOS/desktop visual review remains open, including texture failure callbacks under real browser networking, shadow appearance, fallback transitions and touch comfort. Production authentication, cloud transactional persistence, load/security testing and full gameplay systems for the practice-only skills remain outstanding. New friendly NPC shops/services are still cosmetic dialogue. Water uses highlights, not actual scene reflections. No cloud deployment or production readiness is claimed.

Launch locally with npm ci then npm start; open the printed loopback origin. The runtime is deliberately local: desktop/mobile shipping requires a separate authenticated deployment gate. Historical README and verification files are retained for traceability; use V09-VERIFICATION.md for this candidate's fresh evidence.
