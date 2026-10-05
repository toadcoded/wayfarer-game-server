# Copper Lantern Release Packaging Audit

Date: 2026-09-25
Release: `clean-room-runtime-2026-09-25`

## Included and verified

| Area | Included | Verification |
|---|---|---|
| Client domain | Welcome Garden, movement, appearance, resource loop, NPC dialogue, bank UI, HUD, map expansions, vertical presentation | Strict TypeScript compilation and standalone tests |
| Network client | `session/v1` WebSocket adapter with admission, movement, harvesting, bank commands, snapshot reconciliation | `network-protocol.test.ts` |
| Go server | World validation, movement, traversal, resource authority, cooldowns, inventory, bank, replay receipts | `go test ./...` |
| Gateway executable | Linux amd64 binary and source entrypoint | Binary smoke test listened on `127.0.0.1:8080` |
| Original content | Ashfen expansion manifest and clean-room source modules | Source-only package policy |
| Documentation | Architecture, audit, continuation, clean-room, and launch notes | Included in archive |

## Excluded by policy

- Google Drive files and archives are not runtime dependencies.
- Legacy RSPS caches, proprietary assets, protocols, and client code are not included.
- The referenced Papyrus/browser bundle is a separate task artifact and is not merged into Copper Lantern.
- No unverified attack-system artifact was found in the current Copper Lantern repository or the referenced artifact index.

## Current release boundary

This is a reproducible clean-room runtime package and authoritative vertical slice. It is not yet a production MMO distribution. PostgreSQL persistence, production authentication/tickets, browser bundling/hosting, combat networking, matchmaking, patching, and deployment automation remain explicit future milestones rather than being represented as complete.

## Reproduction

```bash
./scripts/check-cleanroom.sh
./scripts/run-gateway.sh
```

The packaged binary is `release/copper-lantern-gateway-linux-amd64`.
