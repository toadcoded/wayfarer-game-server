# Project Copper Lantern

Clean-room, original fantasy MMORPG client/server slice inspired by early 2000s online RPG presentation without using proprietary Jagex/RSPS assets, protocols, or legacy archives.

## What is included

- TypeScript clean-room client domain:
  - Welcome Garden scene/controller
  - deterministic movement and appearance presentation
  - procedural resources and harvesting
  - NPC dialogue state
  - inventory and bank ledger/UI contracts
  - server-authority transport adapter
  - map expansion, vertical layers, roofs, compass, HUD, and realm detail
- Go authoritative server-world:
  - validated multi-level world topology
  - stairs, ramps, ladders, ropes, trapdoors, crawl spaces, tunnels, hubs, doors, and dungeon connectors
  - session/v1 WebSocket gateway
  - authoritative movement and traversal
  - resource harvesting, cooldowns, inventory, bank tabs, stacking, deposits, withdrawals, and replay receipts
  - moderator special-policy and starter-armour domain rules
- World content:
  - original Ashfen content manifest
  - Welcome Garden, Frostcrown, Sunwash, Gloamfen, and Redglass expansion definitions
- Tests and research records supporting the clean-room boundary.

## Explicit boundary

This package does not import Google Drive files, proprietary game assets, RSPS caches, legacy protocols, or the separate referenced Papyrus/browser bundle. The Drive audit and quarantine records remain documentation only. The current release is a verified source/runtime slice, not a commercial production MMO: authentication, PostgreSQL persistence, browser bundling, combat networking, matchmaking, and deployment infrastructure remain subsequent milestones.

## Run the authoritative gateway

```bash
./scripts/run-gateway.sh
```

The default local WebSocket endpoint is:

```text
ws://127.0.0.1:8080/session/v1
```

The local development admission ticket is `local-dev-ticket`. This is intentionally not production authentication.

## Validate the package

```bash
./scripts/check-cleanroom.sh
```

The check runs strict TypeScript compilation, all standalone TypeScript tests, and all Go tests.

## Package structure

```text
src/cleanroom-client/       TypeScript client/domain/transport code
src/cleanroom-world/        Go authoritative world and gateway
src/cleanroom-world/content/Original world content manifest
research/                   Architecture, audit, and clean-room records
scripts/                    Reproducible checks and local launchers
release/                    Generated release manifest and checksums
```

## Clean-room release rule

Only original project files under this repository are packaged. Unverified Drive content is not a source dependency and must not be copied into the release.
