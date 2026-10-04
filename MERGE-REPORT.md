# v0.4 merge decisions

## Inspect → Classify → Register → Mount → Compile → Execute

Inspect: nine archives, 69,175 regular files, no rejected entries. The extractor checks relative paths, traversal, drive paths, symlinks, special files, encryption, duplicate case-folded paths and file/archive size budgets. ZIP reads verify CRC. Files are written without executable permissions. This is extraction hardening, not a malware certification or complete security audit.

Classify: three related implementations rather than nine interchangeable versions. All nine top-level manifests were read. Their build commands include database migrations. No source archive lifecycle scripts were run. New dependencies were installed from the package manager with scripts disabled; archived node_modules were not reused.

Register: archive and per-file hashes plus pairwise comparisons are included. Names such as “best” and “fixerrors” were not treated as proof of quality or chronology. All originals are unchanged.

Mount: explicitly selected two reviewed pure modules; retained other gameplay modules in separate reference folders. No package-wide overwrite merge.

Compile: strict TypeScript including every new runtime module, pinned TypeScript 5.9.3 and generated lockfile. The inherited package's TypeScript 7.0.2 declaration was replaced with the compiler actually used for this release.

Execute: only the new scaffold, reviewed v0.3 modules and selected pure imports were executed. HTTP serving and automated behavior checks are recorded. No external service was connected by the ambiguous `@Connect ./...` text.

## Package decisions

| Archive | Observed family | v0.4 use |
|---|---|---|
| grok-workspace-best | Wayfarer / React Three Fiber | Preserve game modules; compare against later variants |
| grok-workspace-wayfarer | Wayfarer, 96×96 tiles at 4 units | Explicit coordinate-frame reference and game snapshot |
| workman64 | Wayfarer camera, codecs, persistence, tests | Merge `src/game/iso.ts` unchanged into `src/adapters/iso.ts`; retain remaining modules |
| grok-workspacefixerrors | Papyrus world | Preserve separate source variant; no quality inferred from filename |
| papyrus-world | Papyrus, 72×72 grid | Coordinate-frame reference, world/scene snapshot |
| bestsauce | Papyrus with physics tests | Preserve world/physics/scene candidates for a later renderer integration |
| woopman64 | Ashfen with 3D realm modules | Preserve RPG, world, input and 3D reference modules |
| ashfen-game-package-mobile-polish | Ashfen, 42×34 at 32 pixels/tile | Merge `src/lib/ashfen/settings.ts` unchanged as `src/adapters/preferences.ts`; preserve game source |
| ashfen-game-package-menu-audio | Ashfen audio/menu variant | Preserve alternate shell, HUD and audio implementation |

The Ashfen pair has exactly three different `src/**/*.ts(x)` paths: GameShell.tsx, Hud.tsx and audio.ts. Numerous built assets differ as well. Coordinate scales were read from world definitions; grid adapters do not merge the actual terrain arrays.

## Ownership and boundaries

Reused unchanged code: isometric projection helpers from workman64 and normalized preferences from mobile-polish. Newly authored integration: coordinate frames/rebasing, bounded session authority, canvas preview and tests. Earlier v0.3 code was copied as a separate release baseline. Reference copies are not included in runtime imports or the compiler input set.

WebRTC full-mesh code exists in inspected multiplayer references. That does not establish a running authoritative MMO server. Auth, database, deployment metadata, dependency trees, provider configuration and generated site bundles were deliberately excluded from the new executable package. No all-source security or license audit is claimed.

## Next concrete integration pass

Choose one target renderer and one transport. Adapt its terrain and collision contracts to the canonical world module, then verify two independently connected clients against one server clock. Add persistence only after the source schema and ownership rules are settled. Keep the branch inventory as the source of provenance for each subsequent merge.
