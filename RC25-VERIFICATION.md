# rc.25 fresh verification · 2026-10-04

- Strict TypeScript compilation and browser bundles succeeded.
- Complete Node suite: **291 passed, 0 failed, 0 skipped** (verification/rc25-final-tests.log).
- New checks cover HUD close/reopen, overlay restoration, size changes, out-of-range height rejection and Escape; the actual host serves all six accessible tabs and preserved gameplay control IDs.
- Grounded navigation checks allow actual generated shallows above the old 15cm limit, accept 45cm water, and reject 45.1cm water including traversal across its boundary. No swimming is implemented.
- Cosmetic daylight is bounded, periodic, continuous and rejects invalid clocks; existing sky pause, rain, cleanup and complete renderer tests pass.
- Fresh real WebSocket persistence/reopen, active practice, gathering, combat and travel scripts pass and their journals replay completely (verification/rc25-network.log). Current revision 15 / scene revision 2 is used throughout; exported REALM-CONTRACT.json was regenerated.
- ZIP CRC and file-manifest SHA-256 checks are performed by packaging; two packages are compared for identical output.

The two initial suite failures were expectations that assumed exactly five HUD tabs and a hardcoded scene revision of 2 as an invalid handshake. Those tests now account for Settings and reject current scene revision + 1; the final complete run is the evidence above.

Actual WebGL shadow/texture appearance, phone usability and GPU frame-time measurement remain unverified. NullEngine and stub DOM tests do not substitute for those reviews. Specular water highlights are not actual reflected scene imagery. Prior candidate verification files remain historical.
