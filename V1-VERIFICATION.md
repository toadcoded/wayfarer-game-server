# Wayfarer v1.0 verification — 2026-10-04 UTC

Release scope: executable persistent single-realm server and built browser client, derived from the intact supplied v0.9 rc.3 source. This is version 1.0.0 of the server package; no public deployment or platform provisioning was performed.

## Fresh checks

| Check | Result | Evidence |
| --- | --- | --- |
| Input ZIP CRC | Pass | Input SHA-256 in PROVENANCE.md |
| Clean pinned dependency installation | Pass | npm ci on Node 24.19.0 |
| Original candidate baseline | 306 Node tests pass | verification/v1-baseline.log |
| Final strict TypeScript and browser bundle build | Pass | verification/v1-complete-tests.log |
| Final complete Node suite | 316 pass, 0 failed/skipped | verification/v1-complete-tests.log |
| Focused v1.0 release tests | 10 pass | verification/v1-release-tests.log |
| Python validation tests | 2 pass | verification/v1-python-tests.log |
| Existing asset validation | 8 assets pass | verification/v1-assets.log |
| npm dependency audit | 0 known vulnerabilities reported | verification/v1-dependency-audit.json |
| Compose and CI YAML syntax | Parsed | Python YAML parse; semantic Docker checks outstanding |
| Archive contents | CRC and per-file SHA-256 checked by packaging tool | SHA256SUMS.json |

The ten focused release tests are included in the 316-test total, not additional to it.

## Release behavior tested

- Production configuration fails without an exact HTTPS public origin; invalid ports, capacities, intervals and booleans are rejected.
- SQLite profile changes are transactional: a later invalid entry rolls back the full batch. Guest cookies survive reopen and backups; malformed signatures are rejected. Secure cookies are issued in public mode.
- A competing authority cannot acquire the realm lease. OS locks are released after a real child process is killed.
- Real socket peers join with the compatibility contract. Invalid origin/cookie/Host and duplicate identities are rejected. Static JavaScript retains its MIME type and CSP allows the canonical secure socket.
- Two players remain in one realm; committed appearance/quest changes survive close with both players still connected, database reopen and rejoin. Xam also persists.
- Missing assets do not create guest identities. Guest capacity refusal does not fault the realm, and existing guests remain able to load.
- Sixteen human players plus Xam tick concurrently. A seventeenth human is rejected, and a malformed binary peer is disconnected while other players continue receiving game state. This brief local check is not a sustained capacity benchmark.
- The actual v1.0 entrypoint commits periodic saves before SIGKILL; those saves are recovered after process restart. SIGTERM exits cleanly and flushes the most recent committed connected-player change.
- Legacy JSON profile migration preserves the signing secret, saved progression and revisions; nonempty destinations are rejected.
- Restore refuses an active authority lease, validates the backup and preserves the previous database. Both restored and previous states were opened and checked.

## Unverified boundaries

A cloud browser attempt to localhost returned ERR_BLOCKED_BY_CLIENT. The agent-browser Chromium installer failed certificate validation; a separate official Playwright browser download failed with a truncated ZIP. No successful browser screenshot, GPU rendering, mobile touch/orientation test or sustained device performance result is claimed.

Docker is unavailable in the creation environment. The Dockerfile, Compose stack and Caddy configuration are included, and Docker build is specified in the supplied CI workflow; neither a local image build nor that remote CI run was completed here. DNS, certificate issuance, HTTPS/wss end-to-end behavior and actual public-host readiness must be checked on the selected host.

No shared-world/encounter persistence, distributed authority, automatic reconnect, registered-account recovery, native app signing or offline XP has been added. The existing art references are not newly implemented academy/cavern regions. The exact deployment sequence and recovery commands are in DEPLOYMENT.md.

Historical verification under legacy/, audit/ and earlier RC documents is retained for lineage and is not fresh v1.0 evidence.
