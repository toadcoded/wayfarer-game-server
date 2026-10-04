# Fresh rc.16 verification — 2026-10-04 UTC

251 Node tests passed,0failed0skipped; strict TypeScript build and mesh/realm/PGlite bundles passed. New checks cover normalized camera direction, shortest-arc turning, distinct Walk/Jog/Run speed ceilings/acceleration, immediate release/stale-input stopping, run exhaustion/recovery, rejected forged energy/mode fields, packet flood time independence, staged-state isolation, strict replicated locomotion fields and camera follow preserving angle/radius/pan. Updated motion tests assert the intentionally softer Jog stride and increasing Walk/Jog/Run weights.

Fresh real-WebSocket travel capture:100events,complete deterministic replay hash `89103eb7be5c352658cd48a118dc25b9960af0df27488c2695d8b5b1c4c2465b`. All three modes accepted and server run energy fell to95.8%. Fresh skilling/banking/restart, quest/restart and pure-Strength maul/combat scripts also passed under contract11. Raw current evidence: verification/rc16-*; all rc15 and older evidence is historical.

Browser verification attempted with agent-browser twice; daemon exited before startup. Existing Chromium/Playwright runner also exited with SIGSEGV before opening a page. Therefore no successful current browser screenshot, drag/scroll/pinch interaction test or physical mobile/desktop GPU claim is made. NullEngine camera and full realm tests passed, alongside real sockets/stub-DOM controls. Browser/device playtesting remains the next feel-validation gate.

Gameplay save schema3 and server20Hz remain unchanged. Session stamina is not persisted across reconnect. No production authentication, cloud database, public hosting or native installer was added.
