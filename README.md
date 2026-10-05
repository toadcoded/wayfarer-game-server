# Wayfarer v1.2 — Celestial PolyCodex realm package

A runnable, server-authoritative multiplayer realm derived from the supplied v0.9 rc.3 candidate. Version 1.2 makes the PolyCodex a server-owned magic/skilling system and expands Reedhaven/Ashfen with an original Celestial Observatory, Sunward Orchard, Prism Dew garden and Moonlight Cavern presentation layer. It does not mean a public host has been provisioned or every planned MMO feature is complete.

## Run locally

Use Node 24.19.x. From this folder:

```sh
npm ci
npm run build
npm start
```

Open `http://127.0.0.1:8081`. Your guest character is saved in `runtime/realm.sqlite`; the browser holds its signed identity cookie. A separate browser profile represents another player. Two tabs in the same browser profile share an identity, and only one can join at a time. Clearing cookies loses access to that guest character; account recovery and cross-device login are not implemented.

## Publish with HTTPS

The package includes a Docker image build, Docker Compose stack, and Caddy HTTPS gateway. On an always-on Linux host with Docker Compose, point your domain at the host, allow inbound TCP 80/443 and optionally UDP 443, then:

```sh
cp .env.example .env
# Set DOMAIN to your real hostname and EMAIL to your certificate contact.
docker compose config
docker compose up -d --build
```

Visit `https://YOUR_DOMAIN`. The game server has no published direct port. Player data and certificates use persistent Docker volumes. Read [DEPLOYMENT.md](DEPLOYMENT.md) for verification, backup, restore, upgrades, configuration, and hosting boundaries. A domain and persistent host are required; neither was created during this release.

## v1.2 Celestial PolyCodex additions

- Server-authoritative 12-node PolyCodex casting with range checks, tick cooldown, persistence and Magic/Runecrafting XP.
- Six one-use resonance attunements that are consumed only by matching successful authoritative skilling/combat actions.
- Original procedural Celestial Observatory, dodecahedral Codex, Sunward Orchard, Prism Dew garden and Moonlight Cavern art layers inspired by the supplied references.
- Moonlight Cavern presentation includes cyan/violet crystals, timber walkways, moon pool, lanterns, glowshrooms, portal energy and an astral snail.
- Circular minimap/HUD now exposes the authoritative Codex point and server resonance state.
- Compatibility contract bumped to simulation revision 16 / scene revision 3; old clients fail closed instead of guessing new semantics.

The note/color/dodecahedral motif is fictional game design. It makes no medical or physical-science claim. Visual effects cannot mutate authoritative movement, collision, inventory, combat or XP. See [V1.2-CELESTIAL-EXPANSION.md](V1.2-CELESTIAL-EXPANSION.md), [ART-INSPIRATION-V1.2.md](ART-INSPIRATION-V1.2.md) and [V1.2-VERIFICATION.md](V1.2-VERIFICATION.md).

## Included gameplay

- A shared Willowglass Causeway, authoritative movement at 20 Hz, navigation, walking/jogging/running and energy.
- Quiet Tithe quest, equipment/inventory, the cooperative Lantern Warden, XP and bank state.
- Gathering systems and explicit practice drills across 23 skills. Practice drills are not complete implementations of every profession.
- Server-controlled protected Xam, persistent progress and continuous simulation even without human players.
- Babylon 3D rendering with a 2D fallback, articulated characters, NPCs, wildlife, weather, framed art, HUD settings and touch controls.
- ABC cape wind controls retained as cosmetic motion.

## Changes for v1.0

SQLite WAL transactions with full synchronization replace the production JSON save path. A separate SQLite OS lock prevents competing realm processes using one data directory and releases automatically after a crash. New guest profiles are created only when loading the game page, with bounded enrollment/request/upgrade rates. Public mode requires an exact HTTPS origin and enforces origin, Host, signed-cookie and duplicate-session checks. Secure/HttpOnly cookies, CSP, health checks, structured lifecycle logs, graceful shutdown, backup and legacy migration tools are included.

Default capacity is 16 human players plus Xam; configuration accepts 1–32 humans. The 16-player automated check verifies basic concurrent operation, not sustained load or a 32-player performance guarantee.

## Verification and limits

Fresh v1.2 evidence is in [V1.2-VERIFICATION.md](V1.2-VERIFICATION.md). With Node 24.19.0 and npm 10.9.2, the canonical TypeScript/Babylon build and full automated suite pass **331/331 tests**. The Python asset validator passes **8/8 assets**. The full matrix includes client-to-server WebSocket integration, authoritative gameplay and resonance, SQLite save/restore, guest-enrollment throttling and process-restart coverage.

The three initial failures were stale test assumptions: one expected the offline visual-bundle bridge after a canonical build, one used a DOM stub missing APIs used by the new HUD, and one asserted the old v1.0 page banner. Those test expectations/fixtures were corrected; no server-authority behavior was weakened. The v1.0 verification material remains historical baseline evidence, not proof of the new v1.2 code.

The supplied orchard, crystal-mine, enchanted-book, luminous-fauna, neon-observatory and saturated-landscape images now influence original procedural gameplay presentation layers. They are not copied world textures or shipped as proprietary scene assets. See [ART-INSPIRATION-V1.2.md](ART-INSPIRATION-V1.2.md). Physical iPhone/Android/GPU visual review, live DNS/TLS and public Internet end-to-end operation remain unverified here.

This remains one persistent small realm with guest identities. There is no multi-region/sharded authority, account recovery, PvP economy, signed native mobile app or public uptime guarantee. Shared encounter/world state resets at restart; player exports and Xam progress persist. Abrupt termination can lose the latest unsaved interval (one second by default); stopped servers award no offline XP. SQLite requires a reliable persistent local filesystem, not ephemeral function storage or a network filesystem shared by replicas.

Historical rc.3 source, release notes, prior evidence and the older rc.8 snapshot remain included as reference material. [verification/v09-rc3-README.md](verification/v09-rc3-README.md) contains the previous README. The current production entrypoint remains `tools/server.mjs`; historical servers are not deployed by Docker.
