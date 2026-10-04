# Uploaded bundle assessment

Inspection used archive metadata and selected source/document files. Uploaded scripts and deployment bundles were not executed. Their own verification claims were not independently reproduced here.

| Input | Finding | Integration decision |
|---|---|---|
| wayfarer-v0.8-candidate(1).zip | SHA-256 exactly matches the previously delivered candidate | Used the matching existing source as this update's baseline |
| polycodex-complete-delivery.zip | Supplied SHA-256 matches; React/Babylon plus tRPC source and original gear/NPC/gameplay systems | Keep as a feature source for future ports into the authoritative reducer |
| first-lantern-production-2026-10-01.zip | Built Express/Vite distribution with runtime configuration and pnpm lockfile | Separate application/runtime; not a drop-in Wayfarer deployment adapter |
| mmorpg-chat-export-2026-10-01.zip | 1,052 entries, including recovered First Lantern, Ashfen, Papyrus and reference assets | Inventoried; source trees require focused compatibility review before migration |
| deep-research-ashfenwayfarer.md | Consolidation roadmap and strict final-release gates | Adopted atomic game ticks, replay, idle scheduling and provenance work in this candidate |
| SHA256SUMS.txt | Names two different /home/ubuntu/mmorpg_archives archives | These checksum targets were not supplied under those names; no verification claimed |
| Reported 12 GB Drive/iCloud upload | No file or usable link supplied in this session | Not inspected or merged |

## Concrete contract differences

PolyCodex `server/routers.ts` exposes `game.snapshot` and `game.submitIntent` as public procedures; `server/game.ts` accepts a client-supplied UUID sessionId and increments state.tick inside applyIntent. Its own SERVER_ENDPOINT.md describes in-memory prototype sessions and says verified authentication and server tick scheduling remain prerequisites. Its protocol is `polycodex.gamification.v1`.

Wayfarer binds an opaque socket connection to a host-generated player ID and advances on a fixed host clock using `wayfarer.realm.v2`. Consequently the existing PolyCodex game service cannot become a second authority over the same characters without changing identity, timing and action semantics.

The next compatible port is a small original gear or NPC catalog plus a pure reducer and renderer adapter. Public tRPC session access, per-request tick advancement and offline fallback must not replace Wayfarer's authoritative connection/tick behavior. Account, storage and renderer adapters require their own implementation and verification before a unified release is claimed.


## Reedhaven adaptation — candidate 3

The uploaded playable spine supplies the Quiet Tithe concept: Halden, three reed bundles, and an offering reward. We implemented this content against Wayfarer's existing movement, protocol and staged tick instead of importing its reducer. The supplied reducer accepts direct target movement, lacks gather cooldown and quest proximity checks, and labels serialized length as a SHA-256 content hash. None of those mechanisms were adopted. The foundation builds use a separate 600 ms simulation design; this candidate retains the established 50 ms clock. The larger Reedhaven and asset bundles are retained as source references, not wholesale merged or executed. No new asset rights are asserted.


## Provision attachment — candidate 4

`provisiisoin.gdoc` has a PDF signature and was read as PDF text. Its opening proposal describes a 20-slot inventory and three weapon IDs in a different Ashfen file structure. We adapted those item concepts to this candidate's authoritative GameActions reducer; we did not treat the embedded conversation's completion claims as verified work. The provided `ashfen.zip` is a valid empty ZIP with zero entries, so no source could be merged. The Drive tidy manifest was read as reference only; no Drive items were changed or deleted. The five image files are present despite the earlier preview errors. They are reference material; no new image assets were imported. Referenced remote archives and deployment URLs were not imported.


## Identity and persistence adaptation — candidate 5

The connected Drive workspace supplied multiple later Wayfarer candidates and retained rc.4 architectural history. Candidate 5 keeps the rc.4/rc.4-derived gameplay authority separate from account ownership: no gameplay packet can choose a profile. We added a narrow local profile adapter around the existing 20 Hz runtime instead of importing the separate app-builder authentication stack or replacing the realm loop. The adapter persists only committed player state (position, appearance, Quiet Tithe state, pack and equipment), signs local identity cookies with a server-held HMAC secret, rejects a second simultaneous socket for the same local profile, and writes a versioned JSON database through serialized atomic replacement.

This does **not** merge the connected app-builder workspace, claim its authentication as integrated, or create cloud durability. Shared beacon/reed-patch state remains process-local. The next production step is an explicit authenticated gateway + transactional durable store adapter, not expanding the local JSON file into a public service.
