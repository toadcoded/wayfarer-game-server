# Wayfarer v0.9 rc.3 unified-world verification

Fresh local verification for the merged candidate:

- Both supplied source ZIPs were opened and compared by relative path before merge.
- Source hashes:
  - v0.9 rc.2: `60a2f69acf7200aeef4673690826ff9e0a39eec12bfd5e644880bf8ed930d472`
  - v0.8 rc.8: `bdebb098827fbda9170d8850ca42866415fe289a25d19352b7cfdb2c65da7ffe`
- Pre-merge comparison: 483 shared paths, 419 byte-identical, 64 evolved same-path files, 585 v0.9-only, 7 v0.8-only.
- The entire rc.8 snapshot is preserved at `legacy/rc8-snapshot/` and its nested rc.8 SHA-256 manifest verified 489 payload entries with no mismatch.
- Modified TypeScript authority/Xam dependency graph compiled successfully with strict TypeScript settings; regenerated JS/declarations pass Node syntax checks.
- 203 locally runnable Node tests passed, 0 failed.
- New tests verify:
  - protected encounter participants are not selected or damaged by the Warden;
  - protection survives staged/atomic `GameActions` commits;
  - Xam joins via a server-only protected trait and exposes the merged protected identity contract;
  - the five-minute focus ceiling constant is exactly 6,000 ticks at 20 Hz.

## Dependency qualification

Twenty-four test modules depend directly or indirectly on packages unavailable in this execution container (`ws`, `@babylonjs/core`, `@electric-sql/pglite`, and/or bundling tooling). They were not counted as fresh passes. The supplied package still pins those dependencies in `package-lock.json`; run `npm ci && npm test` in a normal project environment for the complete dependency-backed suite.

No assertion failure was observed in the 203 runnable tests. A first broad discovery attempt hit two indirect `ws` import failures before the final dependency-independent selection was rerun cleanly.
