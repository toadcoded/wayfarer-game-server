# v0.9 rc.2 Xam · fresh verification, 2026-10-04

- Strict TypeScript compilation and browser bundles succeeded during npm test.
- Final complete suite: **303 passed, 0 failed, 0 skipped** (`verification/xam-final-suite.log`).
- 15,000 simulated ticks demonstrate normal earned XP in all 23 skills, real resource gathering/banking and an earned/equipped starter reward.
- Real WebSocket player joins alongside Xam. Trade, follow and injected NPC connection fields are rejected; human XP remains separately owned.
- Accepted Xam inputs replay deterministically across regular and bounded stalled advances. Examination is read-only; POST is denied.
- Validated atomic saves reopen identically, no offline XP is added and corrupted saves are rejected. An injected disk failure faults health, stops upkeep and makes graceful shutdown report persistence failure.
- Empty-server runtime stays ticking. Actual standalone CLI launch, live Xam/health reads, SIGTERM shutdown and persisted profile validation passed (`verification/xam-cli.log`, `verification/xam-cli-results.json`).
- ZIP CRC and every file SHA-256 are validated by packaging; outputs from two packages are compared for identical bytes.

Earlier failed test iterations remain historical. The final persistence-fault test advances five bounded 200ms intervals to reach the one-second save schedule; a single large elapsed delta is deliberately capped and cannot accelerate saving/gameplay.

No cloud deployment or uptime guarantee. Actual WebGL/phone appearance and comfort review of Xam's nameplate/animation remains open. Practice-only skills still lack their full game systems. Standard fresh-player Hitpoints begins at level 10; other skills begin at level 1. See XAM.md for the implemented loop and persistence boundaries.
