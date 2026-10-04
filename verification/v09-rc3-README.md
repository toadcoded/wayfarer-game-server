# Wayfarer v0.9 rc.3 — unified world / protected Xam

This candidate safely reconciles the supplied v0.9 rc.2 and v0.8 rc.8 archives into one package. The v0.9 runtime remains the sole active authority; the complete rc.8 tree is preserved under `legacy/rc8-snapshot/` so no source/content is lost and no second authority is accidentally started. The newer Xam agent keeps v0.9's real movement, XP, quest, gathering, persistence and content loops while inheriting rc.8's hard protection contract: server-only protected membership, no Warden targeting/damage, explicit nonblocking/no-auto-retaliate identity, and a five-minute focus ceiling. See [UNIFIED-WORLD-MERGE.md](UNIFIED-WORLD-MERGE.md) and [RC3-VERIFICATION.md](RC3-VERIFICATION.md).

203 dependency-independent Node tests pass locally, including new Xam merge/protection tests. The remaining dependency-backed modules require the pinned `ws`, Babylon, PGlite and esbuild packages and were not falsely reported as fresh passes in this environment.

Earlier candidate notes below are historical.

## Historical: v0.9 rc.2

Adds Xam as one autonomous server-controlled training NPC. He uses normal movement, XP and content rules, owns his inventory/bank, persists progress, and offers Examine only. The standalone local server keeps ticking without human players while Xam is enabled. No offline XP or cloud uptime guarantee. See [XAM.md](XAM.md) and [XAM-VERIFICATION.md](XAM-VERIFICATION.md).

Run npm ci then npm start. Xam saves by default to runtime/xam.json; XAM_DB overrides his save path. Existing artwork, NPCs, comfortable HUD and recovery work remain included.

Earlier candidate notes below are historical.

# Wayfarer v0.9 rc.1 — Artwork & Recovery

Adds your Harvest Festival painting near Mirella while retaining the adventurer portrait. Consolidates graphics fallback/retry, stale-load cleanup, artwork reload/status, HUD layout reset and bounded preference parsing. All prior gameplay and art systems remain included. See [V09-INTEGRATION.md](V09-INTEGRATION.md) and [V09-VERIFICATION.md](V09-VERIFICATION.md).

297 tests passed, plus fresh real multiplayer replay/persistence checks. This is a local release candidate; actual browser/phone visual review and production deployment gates remain open. Run npm ci then npm start and open the printed local origin.

Earlier candidate notes below are historical.

# Wayfarer v0.8 rc.25 — Comfortable HUD & shallow wading

Adds in-game Settings, close/reopen controls, panel sizing and overlay visibility, gradual cosmetic daylight, bounded character shadows and water highlights. Shared server/client navigation allows grounded wading up to 45cm and blocks deeper water. All NPCs and the framed artwork remain included. See COMFORT-AND-WADING.md and RC25-VERIFICATION.md. This remains a release candidate; browser/phone visual review is open.

Earlier candidate notes below are historical.

# Wayfarer v0.8 rc.24 — Framed world artwork

The supplied adventurer illustration hangs in a gold and wood frame on a small decorative tavern wall behind Tovik on the far causeway landing. The original JPEG is bundled locally. The wall is visual dressing outside the central walking lane, with no collision or gameplay rewards. All rc.23 NPCs remain present. Browser/phone visual review remains open.

Earlier candidate notes below are historical.

# Wayfarer v0.8 rc.23 — NPC prototype cast

Adds eight named friendly map characters inspired by the supplied prototype sheet, checked placement, distinctive procedural outfits, a clockwork rabbit and local nearby conversation controls. Halden keeps the existing camp mechanics; Pin and Branik reuse ambient actors. See [NPC-CAST.md](NPC-CAST.md) for scope and [RC23-VERIFICATION.md](RC23-VERIFICATION.md) for fresh checks. Run `npm ci`, then `npm start` to launch the local realm; open the host’s realm page on desktop or mobile.

Earlier candidate notes below are historical. rc.23 remains a v0.8 release candidate, not a production MMO release.

# Wayfarer v0.8 rc.22 — Sky, weather and wildlife detail

The playable realm now has a faceted gradient sky dome, moon, stars, a merged cloud layer and quality-bounded rain. A single seeded cosmetic weather field coordinates cloud water, humidity, precipitation, lingering dampness and fog. Surface tints darken slightly while damp, then dry gradually. A small per-chunk cache samples local moisture once per second, with at most sixteen entries. All moisture values are normalized visual indices, not physical water quantities.

Every existing wildlife species has upgraded visible detail: inner ears and haunches for rabbits/rodents, fox chest/ankle markings, mustelid cheeks, digging paws/claws, bird breast colours and a pigeon neck band. Eyes blink and tails move. Static geometry batches within joint/material groups; wildlife remains nonattackable, noncolliding and without drops. Halden and the Warden have distinct cosmetic staffs, badges and pouches. Existing articulated character rigs, capes and practice gestures remain intact.

Rain has one reusable line mesh with up to 64 streaks (24/48/64 nonzero streaks by quality); clouds are one merged mesh. The entire added sky layer has five render meshes. Pause secondary motion freezes the climate and disables animated rain. Fog and rain remain cosmetic and never alter movement, traction, stamina, resource output, combat or saved progression. No claim of physical hydrology, volumetric clouds, atmospheric mass conservation or measured GPU optimization is made.

**283 Node tests pass**, including strict TypeScript/browser bundles. New tests cover continuous bounded weather, lingering wetness, chunk cache isolation/invalidation, sky/rain budget and disposal, reduced motion and detailed wildlife batching/blink reset. Two Python tests, eight asset validations and five fresh real-WebSocket/replay workflows pass. Replay hashes remain identical to rc.21 for the same gameplay captures. Simulation contract remains14 and save schema5.

Start: `npm ci`, then `npm start`; open the exact printed loopback address. Optional local profiles: `PROFILE_DB=runtime/profiles.json npm start`. Physical browser/phone/GPU visual review remains open. See SKY-WEATHER-WILDLIFE.md and RC22-VERIFICATION.md.

---

Earlier release notes below are historical.

# Wayfarer v0.8 rc.21 — Retro world and fantasy HUD

The Babylon realm now uses a stronger matte palette, greener terrain vertex tints, brighter warm/cool lighting separation, and a seeded single-mesh grass layer. Grass stays outside the centre bridge lane and off water/steep slopes. It is cosmetic and noncolliding; no movement coordinates, terrain heights, rewards or world persistence are altered. Visual goal: a nostalgic faceted console feeling with readable fantasy MMO interfaces, rather than a recreation of any specific commercial game.

The HUD now separates Drills, Combat, Skills, Quest and Pack into labelled tabs. It includes a minimise button, textured-looking CSS gradients, gold rims, clearer depth, larger padding, 44px touch targets, text-labelled glyphs, keyboard tab navigation, visible focus and safe-area spacing. Saved HUD preferences use a small validated local browser record; the existing PGlite visual quality preference surface stays intact. Both are cosmetic settings, separate from server-owned gameplay persistence.

A World metrics foldout reports enabled mesh objects, enabled triangle count excluding line meshes, grass tufts, metre units and the 20Hz authority clock. Counts are sampled at most once per second. These are geometry metrics, not a GPU benchmark or measured visible-frustum/draw-call claim. The retro atmosphere switch controls haze and bloom style; the richer base world palette is shared across render modes.

**279 Node tests pass**, including strict TypeScript and browser bundles. Five additional tests verify seeded grass limits/terrain filtering, one-mesh disposal, unchanged terrain geometry, HUD keyboard/collapse behaviour, and actual HTTP delivery of the stylesheet/panels. Existing client-button interactions still pass over real sockets with a stub DOM. Two Python tests, eight asset validations and five fresh multiplayer/replay workflows pass. Actual browser/GPU/physical touch visual QA remains open.

This candidate stays in the existing Babylon/PGlite/CSS client. Native Tauri packaging, GPU upscalers and generative model pipelines are not installed or claimed as integrations in this release. The CSS uses no remote fonts or new framework dependencies. Simulation contract remains 14; gameplay-save schema remains 5. All rc.20 active-drill gates and saved cooldowns remain intact.

Start: `npm ci`, then `npm start`; use the exact printed loopback address. Optional development profiles: `PROFILE_DB=runtime/profiles.json npm start`. See RETRO-WORLD-HUD.md and RC21-VERIFICATION.md.

---

Earlier release notes below are historical.

# Wayfarer v0.8 rc.20 — Active skill drills

Every one of the 23 starter practice methods now requires three skill-themed actions before awarding its single XP. Choose a skill at Halden’s yard, press Start drill, wait for the action to settle, and press the marked target. The target changes between steps, so repeatedly clicking one location cannot complete a drill. Labels and star markers accompany the colour highlight; four large native buttons support touch and keyboard Tab/Enter.

The existing woodcutting, mining and fishing gathering buttons also start this interaction at the far landing. Only full completion can award their existing 25 XP and tool-tier resource yield. Banking/crafting are still ordinary bounded transactions; real Warden combat retains its combat mechanics. Gathering and all practice drills share the five-second attempt-start recovery, deliberately limiting these starter activities.

Settling takes 0.4–1 second per action, with 15 seconds for the whole attempt. No narrow reaction window or rapid clicking is required. A wrong target, cancellation, expiry, departure from the interaction zone, death or disconnect ends unfinished work without XP or materials. No punitive account flagging, resource loss or ban is applied. Saved recovery survives reconnect and host restart; unfinished challenges are not restored.

Server-owned challenge tokens, step numbers, timing, health, distance and reward kind are validated. Duplicate, stale, foreign, early and fabricated responses cannot grant XP. Updates remain transactional. Private prompts are not broadcast to other players. Variation is deterministic for replay and not a secret or proof of humanity: protocol-aware bots or recorded multi-button patterns can still automate or sometimes succeed. This makes fixed-position autoclickers less useful and preserves bounded rewards; it is not a complete anti-bot system.

The local 3D player now uses chopping, bracing, aiming, focusing, balancing or working gestures during active drills. Pausing secondary motion resets those poses. These are stylized shared rig gestures, not bespoke animation clips for every tool. Remote drill gestures and actual GPU/device visual QA remain future work.

**274 Node tests pass**, including a client-button workflow over a real socket with a stub DOM, all 23 practice methods, gathering gates and new pose reset checks. Strict TypeScript/browser bundle builds, two Python tests, eight asset validations and five fresh actual-WebSocket/replay workflows pass. Simulation contract 14; save schema remains 5. See ACTIVE-PRACTICE.md and RC20-VERIFICATION.md.

Start with `npm ci` then `npm start`, using the printed loopback address. Optional local development durability: `PROFILE_DB=runtime/profiles.json npm start`. The signed cookie and JSON profile store remain development infrastructure.

---

Earlier release notes below are historical.

# Wayfarer v0.8 rc.19 — All-skill practice yard

Every one of the 23 skills now has a basic manual practice method in Halden’s near-landing yard. Choose a method in the Practice yard panel and press Practice while within 3 metres of Halden. Six small cosmetic fixtures mark the yard without blocking the crossing. A label also appears in the 2D fallback.

Each successful action awards exactly **1 XP to the selected skill**, with a **shared 100-tick / five-second recovery** across all practice methods. Sustained practice rate is at most 720 XP/hour total. No items, money, resource outputs, consumed materials, combat damage, automatic repetition or extra Hitpoints XP. Existing combat and resource-gathering methods retain their own rules and rates.

The server owns distance, identity, simulation time, cooldown and XP. Practice recovery is saved as remaining ticks and restored across reconnect and host restart; offline time does not accelerate it. Unknown skills and client-supplied XP, positions, clocks or identities are rejected. Dead players cannot practise. Queued actions are bounded, duplicate sequences rejected and transitions staged atomically. This controls the practice reward rate; it is not production authentication or a guarantee against automation.

Save schema 5 migrates valid schemas 1–4; simulation contract 13 rejects old clients/replays. Level 99 / combat 126 and the exact 13,034,431 XP curve remain intact. Practice-only directory entries now support drills; their full crafting, farming, ranged combat and other gameplay systems remain pending. Existing gathering, quests, combat, wildlife, camera and character models are retained.

**269 Node tests pass**, including eight new practice tests, strict TypeScript and browser bundle builds. Two Python tests, eight asset validations and five fresh WebSocket/replay workflows pass. GPU/browser/device visual QA remains open. See PRACTICE-TRAINING.md and RC19-VERIFICATION.md.

Start with `npm ci` then `npm start`, using the exact printed loopback address. To retain development profiles between host runs: `PROFILE_DB=runtime/profiles.json npm start`. Local JSON persistence and signed development cookies remain a rehearsal system rather than public MMO account infrastructure.

---

Earlier release notes below are historical.

# Wayfarer v0.8 rc.18 — 99 skills /126 combat

Skill levels cap99; combat caps126. Exact cumulative XP thresholds: level2=83,level3=174,level5=388,level10=1154,level50=101333,level92=6517253,level99=13034431. XP may continue to200million; no virtual levels or extra level bonuses above99. The complete exponential curve is exported in XP-THRESHOLDS.csv.

23 classic-style skill records have independent XP, validation, derived levels, next-level progress,15 tier bands and requirement/bonus lookup. Combat XP lives in Progression; noncombat XP in Skilling, without duplicated ownership. Per-skill/per-level data lives in skill-bonus-directory/. The realm's All Skills panel lists every skill and distinguishes playable skills from progression-only entries. Existing playable actions remain melee/magic training, Hitpoints from actual damage, and woodcutting/mining/fishing; other activities are not yet implemented.

Live level bonuses: Strength/Magic flat damage, Defence pulse reduction, Hitpoints maximum health, and gathering cooldown. Attack/Ranged/Magic accuracy ratings, Prayer capacity and other skill role/tier requirements are derived directory values awaiting their relevant gameplay systems. No claimed complete ranged, prayers, crafting, farming, agility or other missing content loop. Warden attacks still use the introductory guaranteed-hit encounter rather than an accuracy/evasion RNG system.

Combat level uses Defence, Hitpoints, half Prayer and the strongest melee/ranged/magic offence branch. Fresh characters begin Hitpoints10(1154XP), all other skills1. Actual dealt damage grants4XP per damage to the selected compatible combat training mode and1XP per damage to Hitpoints; no Attack/Defence leakage into pure Strength builds. These XP reward rates and numerical bonuses are Wayfarer tuning choices. Maximum health starts40 and grows to129; the temporary health scale is retained rather than changing all existing encounter balance to OSRS numbers.

Gameplay saves now schema4; valid schemas1–3 migrate on the server, preserving existing XP totals, bank, pack, equipment, tool tier and mode. New skills start0XP; new Hitpoints starts1154. Levels are re-derived from the requested curve, so old provisional levels can change. Simulation contract12 rejects older clients/replays. Authority remains20Hz/50ms. Fresh261Node tests, strict TypeScript/build, two Python tests, eight assets and four real-WebSocket/replay workflows pass. See PROGRESSION.md and RC18-VERIFICATION.md. GPU/device visual QA remains open.

Start: `npm ci`, `npm start`; open the exact printed loopback address. Optional development persistence: `PROFILE_DB=runtime/profiles.json npm start`.

---

Earlier release notes below are historical.

# Wayfarer v0.8 rc.17 — Detailed character rigs

All six shared roster characters now use upgraded procedural faceted humanoids, including Seraphine, Halden, the Warden and ambient NPCs. Facial detail includes jaw/chin/cheek contours, nose bridge/tip/nostrils, ear folds, eyebrows/lashes, whites/irises/pupils/highlights, eyelids, lips and teeth exposed in speaking/sneeze gestures. Skin uses subtle deterministic vertex-color variation. Distinct default skin/hair/eye palettes, haircuts, facial hair, makeup and builds are assigned to the roster.

Clothed torso/hip shapes suggest chest, ribcage, waist, abdomen, back, shoulder blades and seat. Arms/legs now include upper/lower segments and shoulder, elbow, wrist, hip, knee and ankle pivots; hands have four fingers and a thumb, boots have heels and toe caps. Animation retains weighted walking, skin-specific cadence, eased turning and cape motion, with knee/elbow/ankle flex and pelvis twist. Pausing resets joint and facial secondary motion. These are stylized transform rigs, not anatomically complete skin-weighted production meshes.

Start with `npm ci` and `npm start`; open the exact loopback address printed. Open Character Studio through the realm tools or `/preview/characters.html`. Studio supports face/body views, six skin tones, hair/eye palettes, three haircuts, facial hair, makeup, builds and eight poses. Studio edits are local previews; multiplayer still shares the existing roster selection rather than custom appearance saves.

**256 Node tests**, strict TypeScript/five browser bundles, two Python tests and eight sprite validations passed. Fresh multiplayer/replay workflows also pass. Simulation contract remains11, gameplay-save schema3, authority20Hz/50ms. Existing travel, stamina, wildlife, skilling, combat and persistence are retained. Geometry batching reduces 108–134 details to43–54 meshes per rig; this is a mesh-budget result, not a measured GPU FPS claim. Physical GPU/browser visual QA remains open.

Read CHARACTER-MODELS.md, CHARACTER-MODELS.json and RC17-VERIFICATION.md. Earlier release notes below are historical.

---

# Wayfarer v0.8 rc.16 — Comfortable camera and weighted travel

Start: `npm ci`, `npm start`; open the exact loopback address printed by the host. Use a second tab for multiplayer. Optional local durable development profiles: `PROFILE_DB=runtime/profiles.json npm start`.

WASD/arrows and direction buttons now follow the 3D camera orientation. Drag to orbit, right-drag to pan, wheel/pinch to zoom. Two-finger gestures use Babylon's existing touch controls. Camera follows with damping, preserves your orbit/zoom and bounded pan; C or Recenter restores the default view. Zoom +/- buttons support devices without a wheel. V cycles Walk/Jog/Run; Shift temporarily requests Run. Travel selector supports touch. Release, blur, hiding the page and input timeout stop movement without sliding.

Walk 2m/s, Jog 4m/s, Run 6.25m/s, gradual 10m/s² acceleration / 16m/s² deceleration between speeds. Immediate release is intentional for precise bridge/combat controls. Server owns travel speed and energy; packets can request a mode but cannot set speed, position, time or energy. Run energy: 100%; moving Run drains 6%/s; standing restores 5%/s, Walk 3%/s, Jog 1%/s. Exhaustion falls back to Jog. Switch to Walk/Jog and recover >=20% to rearm Run; holding an exhausted Run request does not produce repeated automatic bursts. These are tuning values, not final balance. Energy is session-only and resets on reconnect; it is not an economy or persistent progression resource.

Characters use shortest-angle eased turning, speed-sensitive stride weights, softer stride transitions, small torso compression and forward lean. Existing skin-specific cadence and cape motion remain. No camera shake was added. The 2D fallback retains its fixed isometric movement layout and uses the same server travel modes.

Contract simulation revision **11**, gameplay-save schema **3**, 20Hz/50ms host authority. New snapshots include validated travel mode and run energy. Old three-field movement packets remain supported at historical constant Jog speed for tooling; the new client always sends an explicit mode. Old handshake revisions and old replay contracts are rejected. Save profiles remain compatible because session energy/velocity are intentionally not persisted.

Fresh verification: **251 Node tests**, strict TypeScript/build and four real WebSocket/replay workflows pass. Read [TRAVEL-CONTROLS.md](TRAVEL-CONTROLS.md) and [RC16-VERIFICATION.md](RC16-VERIFICATION.md). Real Chromium visual verification was attempted but blocked by runtime startup failure; GPU/device/touch feel is not certified. Earlier release notes below are historical and do not describe the current contract or test totals.

---

# Wayfarer v0.8 rc.15 — Non-attackable wildlife

New: fourteen procedural wildlife visual entries, including every requested animal plus ducks and hedgehogs. All fourteen render in the checked causeway population. Habitat-aware seeded placement works for every procedural chunk and is shown through atlas habitat lists and sample markers. Rigs have gentle roaming, resting, rabbit hops, paw/head motion and bird wing movement. No combat, collision, drops, XP or player persistence is attached to these decorative NPCs.

See `WILDLIFE.md` and `RC15-VERIFICATION.md`. Run `npm ci && npm start`. The wider regional maps remain atlas/planning surfaces; the causeway is the current multiplayer destination. Real-device GPU and production deployment gates remain open. This is an internal candidate toward final v0.8; the next public version stays v0.9.

## Historical rc.14 notes

New: 22 seeded decorative prop roots across the two playable landings, eleven prop types, clockwork-toy and woodcutter NPCs, blink/wave/chop/sneeze/play animations, balloon sway, fireflies, incidental authored chatter, distant lightning and a small firework event. Retro palette and flash controls are available alongside the existing Babylon quality presets. Static dressing is batched by shared material and cape animation buffers are reused.

Visible snapshot heartbeat and a manual host-health check distinguish live updates, stalls and resting pages. Effects pause/reduced-motion handling suppresses cosmetic animation. No gameplay, collision, rewards or server save state is changed by the ambient scene. See `LIVING-REALM.md` and `RC14-VERIFICATION.md`.

Run `npm ci && npm start`; open the printed loopback URL. This is another internal v0.8 candidate. Physical GPU/device QA and production authentication/database gates remain open. The supplied linked rc.13 archive was downloaded and its SHA-256/CRC matched the checked source baseline.

## Historical rc.13 notes

New: Maximum/High/Balanced render presets, bloom, FXAA, capability-bounded MSAA, pixel-density caps and context-loss rendering suspension/recovery. Maximum targets 60 FPS; actual GPU performance is unmeasured. PGlite 0.5.4 provides real, lazy-loaded local visual preferences through a worker-backed plugin surface. Use Save/Load/Clear visual controls to activate it. Multiplayer inventory, skills, rewards and gameplay saves remain server-owned.

See `WEBGL-PGLITE.md` and `RC13-VERIFICATION.md`. Browser worker/IndexedDB and physical GPU QA remain open; Node tests verify actual PGlite persistence and WASM assets. Run `npm ci && npm start`. Maximum is the default, with lower-cost presets available. Public versioning remains final v0.8 then v0.9; this is another internal release candidate.

## Historical rc.12 notes

Current candidate: simulation revision 10, gameplay-save schema 3, 20 Hz server authority. The skilling/PvM loop, private banking, earned weapons and Seraphine remain integrated. rc.12 skips hidden 2D world drawing when 3D is active, resizes Babylon only on viewport/pixel-ratio changes, and adds WASD plus independent keyboard/touch hold tracking.

Run `npm ci && npm start` with Node 24, then open the printed loopback URL. Arrow keys or WASD move; Space attacks; G guards. Touch buttons are supported. Drag the 3D view to orbit; wheel to zoom. WebGL-unavailable browsers retain the 2D fallback.

All 233 Node tests pass. Fresh evidence is in `RC12-VERIFICATION.md`; Drive coverage, incomplete ZIPs, separate source families and integration gates are in `DRIVE_INTEGRATION_REVIEW.md`. No FPS/battery benchmark or physical-device GPU verification is claimed. Signed local profiles are development identity, not production authentication. Native installers, cloud database persistence, cape-slot sacks and magnetic quivers remain unfinished.

This is an internal candidate, not final public v0.8. Final v0.8 remains gated on production identity/persistence and mobile/desktop evidence; the next public version is v0.9. Notes below and `HISTORICAL-README.md` are historical evidence.

## Historical rc.11 and earlier notes

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
