# Wayfarer v0.9 rc.3 — unified world merge

This candidate safely reconciles the two supplied archives:

- `wayfarer-v0.9-rc2-xam-candidate.zip`
- `wayfarer-v0.8-rc8-xam-candidate.zip`

## Authority decision

The v0.9 rc.2 tree is the active runtime because it is the newer superset: it has the newer world/content systems, persistence, character/visual work, WebGL/PGlite work, practice systems and the newer player-like Xam agent.

The v0.8 rc.8 tree is preserved byte-for-byte under `legacy/rc8-snapshot/`. Nothing from that archive is discarded, but its older authority/runtime files are deliberately **not** loaded beside v0.9. Running two implementations of movement/gameplay/Xam simultaneously would create two competing authorities.

## Merge audit

Relative-path comparison before integration found:

- v0.9 files: 1,068
- v0.8 files: 490
- shared paths: 483
- byte-identical shared paths: 419
- evolved same-path files: 64
- v0.9-only files: 585
- v0.8-only files: 7

The seven v0.8-only files were the older `src/xam.ts`, its compiled output, and rc.8 verification logs. They remain in the namespaced legacy snapshot. The active runtime uses v0.9's newer `xam-agent.ts` / `xam-view.ts` implementation.

## Xam reconciliation

The rc.8 protection contract was ported into the newer rc.9 Xam instead of activating the old Xam controller in parallel:

- server-only protected membership at join time
- Warden cannot select or damage protected participants
- protection survives staged/atomic commits
- Xam remains able to use ordinary validated gameplay intents
- `autoRetaliate` remains false
- nonblocking identity is explicit
- legendary holographic-rustic armour identity is explicit
- diamond scythe / gilded secateurs identity is explicit
- a hard five-minute focus ceiling remains exported as `XAM_MAX_FOCUS_TICKS = 6000`

There is still only **one Xam** and one authoritative realm.

## Safety rule

`legacy/rc8-snapshot/` is archival source/reference only. Do not add that subtree to TypeScript build globs, package exports, runtime imports, or server startup scripts. If an older rc.8 behavior is wanted later, port it deliberately into the v0.9 authority and add a test instead of importing the old runtime wholesale.
