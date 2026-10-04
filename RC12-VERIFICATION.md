# Fresh rc.12 verification — 2026-10-04 UTC

| Check | Result |
| --- | --- |
| Strict TypeScript and both Babylon bundles | Passed as part of npm test |
| Node test suite | 233 passed, 0 failed, 0 skipped |
| Python tests | 2 passed |
| Asset validation | 8 assets validated |
| Real WebSocket skilling trip | Passed: collision-world walk, 12 gathers, exact bank deposit, failed crafting without material spend, restart restoration |
| Skilling replay | 740 events, complete; hash a3d7561390ce7b4d39f04cc49640e056093c3630a2a428d757468c23063843f1 |
| Reopened skilling profile replay | 2 events, complete; hash 88f6305e318eb0cbf7c08dc4ddc14df8e4284254d1571d55e6cf01398ccd930d |
| Quest/network replay | Both 6-event recordings complete; hash e9064b26f0fb24e9455d13d5f8114f1768450c9219a5144bf5e4ba2731f74623 |
| Earned maul transport/profile check | Passed: 16 damage, Strength-only XP, cooldown rejection, durable reopen |
| Combat replay | 6 events, complete; hash 1d55c5ecb2eb5ff5ee5ae50845f2d056db24c118ee50fbc861fe85b07e46dd4a |
| Input regression | Multiple keyboard aliases/touch pointers release independently and clear on stop |
| Renderer regression | Stable viewport avoids repeated resize; changed orientation resizes once |

Raw fresh evidence is in `verification/rc12-*`. The network client test uses a stub DOM with a real socket. Renderer tests use Babylon NullEngine. These prove the stated logic, not browser GPU visual fidelity, real-device battery usage or release readiness. Historical rc.11 and earlier files remain separately labeled.

ZIP CRC and per-file manifest checks run within `tools/package-candidate.py`. The archive hash is emitted externally because embedding its own hash would change it. The package is reproducible when the included evidence files are unchanged.

Open gates: real iPhone/Android/desktop GPU QA, transactional production persistence/account identity, deployment and native delivery. Drive folder listings capped at 1,000 items remain partial; the 11 GB bundle and other oversized archives were not binary-verified. See `DRIVE_INTEGRATION_REVIEW.md`.
