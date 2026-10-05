# 2006scape RSPS Build — Google Drive Inventory

**Inventory date:** 2026-09-11  
**Method:** Read-only Google Drive inventory with `gws`; metadata queries, Drive text search, Google Docs plain-text exports, and local filename-only inspection of three downloaded archives. **No Drive files, folders, permissions, or content were modified.**

## Executive summary

The supplied Drive contains a large, mixed **PolycodexServerClientApp** workspace rather than one clean, self-contained 2006scape release. The primary project folder is [`PolycodexServerClientApp`](https://drive.google.com/drive/folders/1qYDrO0MZD3Q5NKLtL8Y2BvJg4Nqz-6Ux) (`1qYDrO0MZD3Q5NKLtL8Y2BvJg4Nqz-6Ux`), which held **3,213 direct children** at inventory time. Across the non-trashed accessible Drive, **4,600 records** were returned. Drive full-text searches returned 39 records matching `2006scape` and 201 matching `RSPS` (the former are a subset of the latter).

The evidence supports a **mixed-era, partially duplicated Polycodex/RSPS build collection**:

- A named structural layout exists for a **Go 317 server**, **Java 3D client**, **map/cache**, **companion**, and **build scripts**.
- The strongest confirmed runnable-bundle candidate is [`polycodex-20260817T014332Z.tar.gz`](https://drive.google.com/file/d/1akdazlTUu4xlkI6lUu-d59ymWKyHC95C/view) (15,003,652 bytes), which contains `bin/pcboot`, `bin/realm`, `bin/realm-api`, `client/playlet.json`, `maps/map.bin`, map JSON, plugins, and an RSPS-317 protocol note.
- A build/launch document describes a conventional Java/Maven 2006Scape packaging workflow yielding `Client.jar`, `Server.jar`, `ServerConfig.json`, `SinglePlayer.bat`, `plugins/`, and `data/`. However, this is **documentation, not a confirmed matching build artifact** in the accessible Drive.
- The strongest cache tooling candidate is a 25,559-byte `polycodex-cache-pipeline.tar.gz` revision, whose archive contains a Go module with cache validation, regions, map generation, world chunk cache/preload, and a `cachectl` command. This is **pipeline/source tooling**, not a raw Jagex cache archive.
- There are exact checksum duplicates and multiple non-identical revisions of the cache pipeline, companion stubs, generic source files, and document exports. This workspace needs deduplication and provenance/release selection before attempting a build.

> **Bottom line:** treat this Drive as a development/research corpus. It contains credible server, client, map/cache, and build evidence, but not a single verified, coherent 2006Scape release with a confirmed original client/server pair, launcher binary, and raw game-cache payload.

## Scope and hierarchy

| Role | Drive item | ID | Inventory interpretation |
|---|---|---:|---|
| Primary project root | [`PolycodexServerClientApp`](https://drive.google.com/drive/folders/1qYDrO0MZD3Q5NKLtL8Y2BvJg4Nqz-6Ux) | `1qYDrO0MZD3Q5NKLtL8Y2BvJg4Nqz-6Ux` | Main supplied project container; 3,213 direct entries. It is heavily mixed with generated assets, duplicated exports, notes, dependencies, and project material. |
| Server folder | [`02-Server-Go-317`](https://drive.google.com/drive/folders/1LcvDs38x8UP7pmPQ71nrvqWg49fUZR_t) | `1LcvDs38x8UP7pmPQ71nrvqWg49fUZR_t` | Explicitly named 317 server component. Direct inventory has cache-pipeline and companion-daemon tarball revisions; it does not itself expose a complete loose Go source tree. |
| Client folder | [`03-Client-3D-Java`](https://drive.google.com/drive/folders/1b0EvYF-BUVA-POHIbdc_csARgaBWKQ1z) | `1b0EvYF-BUVA-POHIbdc_csARgaBWKQ1z` | Explicitly named Java/3D client component, but its direct child listing was empty at inventory time. Client material therefore appears to be elsewhere (archives, root files, or external references). |
| Cache/map folder | [`04-Map-Cache-2730`](https://drive.google.com/drive/folders/1fLvxye7BzB0zNs8xTw_k89qrHGuJwjyv) | `1fLvxye7BzB0zNs8xTw_k89qrHGuJwjyv` | Contains cache-pipeline revisions, `map_schema.sql`, and sample cohort/fauna/pipeline JSON. |
| Companion folder | [`06-PolyLite-Companion`](https://drive.google.com/drive/folders/1VMHKGZ9UNOnI3oVbxs0vrkncgtvZnYsY) | `1VMHKGZ9UNOnI3oVbxs0vrkncgtvZnYsY` | Contains `COMPANION_DAEMON_STUBS.md`, `PLUGIN_SKETCH_README.md`, and five revisions of companion-daemon stubs. It is a companion/plugin concept, not a confirmed release launcher. |
| Build folder | [`07-Build-Scripts`](https://drive.google.com/drive/folders/1yDgY0t6RBD4KG8pCJXSU5cizE9_XG1Gj) | `1yDgY0t6RBD4KG8pCJXSU5cizE9_XG1Gj` | Contains two cache-pipeline archive revisions and a nested `polycodex-cli` folder. |
| Nested CLI | [`polycodex-cli`](https://drive.google.com/drive/folders/17l7OR_mIMd3Q-KgtxYlykq2WpQuomoSM) | `17l7OR_mIMd3Q-KgtxYlykq2WpQuomoSM` | Contains `polycodex-offline-queue.tgz` (4,652 bytes); no evident end-user launcher executable. |

A separate [`polycodex`](https://drive.google.com/drive/folders/1iRG0-YsLxhUuUe26atNaVie-mNocX49G) folder (`1iRG0-YsLxhUuUe26atNaVie-mNocX49G`) is nested below the project root and contains a high volume of duplicated build/source exports. A later [`polycodex/ingestion/google_drive/`](https://drive.google.com/drive/folders/1cEG70HH2X_ezs9zbWfRAmxEX1rzzxegQ) folder (`1cEG70HH2X_ezs9zbWfRAmxEX1rzzxegQ`) appears to be a separate ingestion/care-package collection rather than the core RSPS project.

## Likely build components

### Server

| Evidence | ID / size | Findings |
|---|---:|---|
| [`02-Server-Go-317`](https://drive.google.com/drive/folders/1LcvDs38x8UP7pmPQ71nrvqWg49fUZR_t) | folder | The folder name explicitly identifies a Go-based 317 server. Direct contents are five tarballs: one cache-pipeline revision and four distinct `polycodex-companion-daemon-stubs.tar.gz` revisions. |
| [`polycodex-20260817T014332Z.tar.gz`](https://drive.google.com/file/d/1akdazlTUu4xlkI6lUu-d59ymWKyHC95C/view) | `1akdazlTUu4xlkI6lUu-d59ymWKyHC95C`; 15,003,652 B | Filename-only inspection found `bin/realm`, `bin/realm-api`, `bin/pcboot`, `plugins/`, `polycodex.toml`, and `docs/rsps317_protocol.md`. This is the most concrete server/runtime bundle discovered. |
| [`IMPORT-COPILOTED-POLYCODEX`](https://docs.google.com/document/d/1hz9qe4E5_1H8HVE2Hy2Pv6rPiEyNSw0OliMOOn1Z1Uw/edit) | `1hz9qe4E5_1H8HVE2Hy2Pv6rPiEyNSw0OliMOOn1Z1Uw` | Exported text specifies an RSPS-317 packet model, ISAAC, sessions, 600 ms tick concepts, Go code examples, and a Go `cmd/rsps317` layout. It is design/import material, not proof that a production server compiles. |
| [`Custom LLM RSPS Development Research`](https://docs.google.com/document/d/1YlT9gDuEU_sWFcR2K0DTGIcgqcnti3hQL6BpMd026yU/edit) | `1YlT9gDuEU_sWFcR2K0DTGIcgqcnti3hQL6BpMd026yU` | Architecture research for a custom “2006scape”/317 environment. It names external upstream options (e.g., 2006-Scape, Apollo, Displee cache library) but is a research roadmap, not vendor/source provenance. |

**Assessment:** a Go/realm-oriented server is strongly indicated. The accessible artifacts do not establish that it is protocol-compatible with the documented Java 2006Scape client build path; validate protocol, configuration, and revision compatibility before combining them.

### Client

| Evidence | ID / size | Findings |
|---|---:|---|
| [`03-Client-3D-Java`](https://drive.google.com/drive/folders/1b0EvYF-BUVA-POHIbdc_csARgaBWKQ1z) | folder | Named client folder, but it had zero direct children when listed. No standalone client JAR was found through the name-based Drive search. |
| [`polycodex-20260817T014332Z.tar.gz`](https://drive.google.com/file/d/1akdazlTUu4xlkI6lUu-d59ymWKyHC95C/view) | 15,003,652 B | Includes `client/playlet.json`, but the inspected file list does not establish that it is a classic Java 2006Scape client. |
| [`polycodex-offline-source.zip`](https://drive.google.com/file/d/1EwqSAspoejPeMNFccPFkqhjFKMS_Y2H2/view) | `1EwqSAspoejPeMNFccPFkqhjFKMS_Y2H2`; 32,322,254 B | Archive inspection shows a Polycodex source/export tree with `.grok` build-game guidance, generated 2D map/sprite tooling, and art assets. This appears to be a web/game project source snapshot, not a confirmed 2006Scape Java client. |
| [`HelpStartBootRun`](https://docs.google.com/document/d/1-X0t-X6GAjxG4bIsywqFi8RMSL-NHi0ketm9E7XO1sI/edit) | `1-X0t-X6GAjxG4bIsywqFi8RMSL-NHi0ketm9E7XO1sI` | Contains a Maven/GitHub Actions example that copies `2006Scape Client/target/client-1.0-jar-with-dependencies.jar` to `Client.jar`. This confirms an intended Java client packaging path only. |

**Assessment:** there are at least two client concepts: an empty named `03-Client-3D-Java` folder and a newer Polycodex web/offline source tree. The actual Java client source/JAR used by the documented CI recipe was not verified in Drive.

### Cache and maps

| Evidence | ID / size | Findings |
|---|---:|---|
| [`04-Map-Cache-2730`](https://drive.google.com/drive/folders/1fLvxye7BzB0zNs8xTw_k89qrHGuJwjyv) | folder | Direct children include six cache-pipeline revisions, `map_schema.sql`, `sample_cohorts.json`, `sample_fauna.json`, and `sample_pipeline_report.json`. |
| [`polycodex-cache-pipeline.tar.gz`](https://drive.google.com/file/d/11R9c_GUOB1TYXiROxxLZgLTRmr8giuDv/view) | `11R9c_GUOB1TYXiROxxLZgLTRmr8giuDv`; 25,559 B | The newest cache-folder revision inspected. Archive contains Go commands `cachectl`, `preload-demo`, and `sidecar`; `configs/pipeline.default.json`; cache modules for `mapgen`, `regions`, `validate`; chunk cache/preload; `map_schema.sql`; and a CI script. It is source/tooling for map/cache processing. |
| Dated runtime bundle | `1akdazlTUu4xlkI6lUu-d59ymWKyHC95C` | Contains `maps/grid.json`, `maps/map.bin`, `maps/regions.json`, `maps/world.json`, and `maps/viewer.html`. These are the clearest map payloads discovered. |
| [`cashthecache`](https://docs.google.com/document/d/1OkT-6CZ-QyCaCtBCuC_IYMOyiLbECkj4YaPrTivHRBI/edit) | `1OkT-6CZ-QyCaCtBCuC_IYMOyiLbECkj4YaPrTivHRBI` | Despite its name, exported content is release-plugin/AWS/launcher setup guidance for a RuneLite-derived client, not a raw cache file or cache editor. |

**Raw-cache caveat:** no files named `main_file_cache`, `dat2`, or `jagcached` were returned by direct filename search. Do **not** assume any `polycodex-cache-pipeline` archive includes a usable legacy RuneScape cache without unpacking and validating its generated output.

### Launcher, boot, and packaging

| Evidence | ID / size | Findings |
|---|---:|---|
| [`HelpStartBootRun`](https://docs.google.com/document/d/1-X0t-X6GAjxG4bIsywqFi8RMSL-NHi0ketm9E7XO1sI/edit) | Google Doc | The strongest launcher/build note. It specifies `launcher.properties`, `launcher.crt`, RuneLite launcher bootstrap URLs and signature, branding values, JDK 8, Maven, and GitHub Actions. The sample artifact job produces `Client.jar`, `Server.jar`, `ServerConfig.json`, `SinglePlayer.bat`, server `plugins/`, and server `data/` under `2006Scape-SinglePlayer`. |
| [`cashthecache`](https://docs.google.com/document/d/1OkT-6CZ-QyCaCtBCuC_IYMOyiLbECkj4YaPrTivHRBI/edit) | Google Doc | Explains release plugin configuration, AWS/S3 publishing, launcher configuration, and RuneLite main class (`net.runelite.client.RuneLite`). It contains a prominent private-key warning. |
| Dated runtime bundle | `1akdazlTUu4xlkI6lUu-d59ymWKyHC95C` | Contains `bin/pcboot`, which is a plausible bootstrap command; `bin/realm` and `bin/realm-api` indicate a runtime alternative. |
| `06-PolyLite-Companion` | folder | Contains daemon stubs and plugin sketch materials, not a user-facing launcher binary. |

**Assessment:** build and launcher instructions exist, but the actual launcher package was not identified by metadata: a name query for `launcher` returned zero files. Treat the documentation as a migration/packaging recipe pending recovery of the referenced source/repository or a verified release archive.

### Notes, research, and architectural guidance

| Item | ID | Relevance |
|---|---:|---|
| [`Custom LLM RSPS Development Research`](https://docs.google.com/document/d/1YlT9gDuEU_sWFcR2K0DTGIcgqcnti3hQL6BpMd026yU/edit) | `1YlT9gDuEU_sWFcR2K0DTGIcgqcnti3hQL6BpMd026yU` | Comprehensive proposal for an LLM-enhanced 317/“2006scape” world. It is valuable design context, but it mixes alternatives and external references. |
| [`HelpStartBootRun`](https://docs.google.com/document/d/1-X0t-X6GAjxG4bIsywqFi8RMSL-NHi0ketm9E7XO1sI/edit) | `1-X0t-X6GAjxG4bIsywqFi8RMSL-NHi0ketm9E7XO1sI` | Includes a recovered “PolyCodex MMORPG Architecture Plan,” which explicitly characterizes the current product as an offline-first proposal and states it is not production-ready or an active complete MMORPG runtime. |
| [`GrokBuildLodgeManifold`](https://docs.google.com/document/d/1JRkyCkSrGQAW5NIa3qI57RJ3RT0uX8w5bpXPq3DDf98/edit) | `1JRkyCkSrGQAW5NIa3qI57RJ3RT0uX8w5bpXPq3DDf98` | Link/resource ledger; includes references to `2006-Scape/2006Scape`, Polycodex repositories, RuneStar client resources, launcher resources, and Drive folders. |
| [`07SCAPE_MAPGEN.md`](https://drive.google.com/file/d/1_ueSWBZvMRbOnYfRpvO9c3Elb2cL2q9W/view) | `1_ueSWBZvMRbOnYfRpvO9c3Elb2cL2q9W` | Direct project-root map-generation note (4,088 bytes), aligned with the map/cache/tooling theme. |

## Archives and source snapshots worth preserving

| Priority | Item | ID / size | Why it matters |
|---|---|---:|---|
| High | `polycodex-20260817T014332Z.tar.gz` | `1akdazlTUu4xlkI6lUu-d59ymWKyHC95C`; 15.0 MB | Best compact runtime/build handoff: boot, realm binaries, client config, maps, plugins, manifest, and RSPS protocol documentation. |
| High | `polycodex-cache-pipeline.tar.gz` — 25,559 B revision | `11R9c_GUOB1TYXiROxxLZgLTRmr8giuDv` | Latest observed cache-folder revision and the full cache pipeline inspected by file list. |
| High | `polycodex-offline-source.zip` | `1EwqSAspoejPeMNFccPFkqhjFKMS_Y2H2`; 32.3 MB | Large offline source/art export, useful for recovering the web/asset pipeline. Not established as Java 2006Scape client source. |
| Medium | `polycodex-pipeline-game-offline.zip` | `1SFMbcB3gn3mRChnDj_EU6dLWDW9_on50`; 11.5 MB | Offline game pipeline snapshot; needs content comparison against the offline source ZIP. |
| Medium | `polycodex-game-site-main-page.zip` | `1jtBZyJl1v8PwlvxE4nlpmOAm5cfDFuPB`; 12.5 MB | Site/UI snapshot; likely related but checksum-distinct from other web bundles. |
| Medium | `polycodex-expanded-site.zip` | `1_ElKay-PnsD17qnQB3CXnfPtWYW5i2cN`; 12.5 MB | Separate, checksum-distinct site snapshot. |
| Medium | `polycodex-companion-daemon-stubs.tar.gz` revisions | see duplicates section | Companion/plugin experimentation; not enough evidence to treat as production launch tooling. |

## Exact duplicates and revision sprawl

### Exact checksum duplicates relevant to the build

| Checksum | Equivalent items | Implication |
|---|---|---|
| `5d4d175f9f15a3a21a0fd111b6bb2e7a` | [`11R9c_GUOB1TYXiROxxLZgLTRmr8giuDv`](https://drive.google.com/file/d/11R9c_GUOB1TYXiROxxLZgLTRmr8giuDv/view) in `04-Map-Cache-2730` and [`1m3zkh3QidX_MnHwGRF_3ndNHPEWydiGf`](https://drive.google.com/file/d/1m3zkh3QidX_MnHwGRF_3ndNHPEWydiGf/view) in `07-Build-Scripts`; both 25,559 B | Exact same newest cache-pipeline archive stored in two component folders. |
| `ac28f4e2e324bce1827ff4e71ab1ce27` | [`1zepDeWH9mbk-tz0hdawIxAcgphokfWeY`](https://drive.google.com/file/d/1zepDeWH9mbk-tz0hdawIxAcgphokfWeY/view) in `02-Server-Go-317` and [`1kVxhcEs55J2SD-BZOsruBt27mNm4NR7E`](https://drive.google.com/file/d/1kVxhcEs55J2SD-BZOsruBt27mNm4NR7E/view) in `04-Map-Cache-2730`; both 11,593 B | Exact older cache-pipeline duplicate across server and cache folders. |
| `40e51290fc38bb0b327552a1e3cc3dad` | [`1JcEjjBe5T3_GxR-kiBPAOemDLnlxbu5_`](https://drive.google.com/file/d/1JcEjjBe5T3_GxR-kiBPAOemDLnlxbu5_/view) in `07-Build-Scripts` and [`1AvHx4kyXInox5vIezdVOSo6XnMuqdptf`](https://drive.google.com/file/d/1AvHx4kyXInox5vIezdVOSo6XnMuqdptf/view) in `04-Map-Cache-2730`; both 7,112 B | Exact earliest cache-pipeline duplicate across build/cache folders. |
| `3b4299447ad7e25d7107c89943acef4a` | [`1r4Nv2KtkHJKsfZTvTwKxUxzx2CIZc2be`](https://drive.google.com/file/d/1r4Nv2KtkHJKsfZTvTwKxUxzx2CIZc2be/view) in `02-Server-Go-317` and [`1TNZtW1lnCTDWFBzt6GAt8O3lxLR2f3J5`](https://drive.google.com/file/d/1TNZtW1lnCTDWFBzt6GAt8O3lxLR2f3J5/view) in `06-PolyLite-Companion`; both 14,667 B | Exact companion-daemon-stubs duplicate across server and companion folders. |

### Same-name, non-identical revisions

The `polycodex-cache-pipeline.tar.gz` family has at least **six distinct payload revisions**: 7,112 B; 11,593 B; 17,058 B; 18,754 B; and 25,559 B, with duplicates for the 7,112 B, 11,593 B, and 25,559 B payloads. The newest observed timestamp is 2026-08-20 22:28 UTC for the 25,559 B revision. This should be selected as the provisional baseline only after source-level diff/build validation.

The companion-daemon archive family has at least five size/checksum variants (6,257 B; 11,787 B; 12,964 B; 14,667 B; 16,352 B). The 14,667 B revision is duplicated between the server and companion folders; the other revisions are distinct.

Beyond the RSPS-specific items, the root contains a large amount of generic duplicate/exported source material. The inventory found many exact MD5 groups such as repeated JavaScript modules, Go files, markdown references, and source maps. These records are likely import/export residue and should not be silently assumed to belong to the active RSPS build.

## Build-readiness interpretation and recommended next actions

1. **Preserve and hash a candidate baseline before changes.** Start with `polycodex-20260817T014332Z.tar.gz`, the 25,559-byte cache-pipeline revision, and `polycodex-offline-source.zip`. The metadata checksums in this report are suitable for Drive-level duplicate recognition; compute SHA-256 after downloading for an explicit build manifest.
2. **Recover a definitive client/server pair.** The available docs describe a Maven build which should emit 2006Scape `Client.jar` and `Server.jar`, but those artifacts/source directories were not confirmed in Drive. Obtain the referenced GitHub revision or a matching archive, then verify the server protocol against the client before building.
3. **Treat `map.bin` and cache pipeline output as custom project assets.** No conventional raw cache filenames (`main_file_cache`, `dat2`, `idx`) or `jagcached` item were found by name. Validate content ownership, source provenance, and runtime format before any distribution.
4. **Separate products before implementation.** The Drive combines a classic Java/RuneLite-derived launcher recipe, Go/317 realm prototypes, and a React/web/offline Polycodex game source tree. Establish a release manifest that names one authoritative server, client, map/cache producer, launcher, and configuration set.
5. **Deduplicate only after choosing an authoritative revision.** The exact duplicate records are safe candidates for later cleanup, but this inventory did not modify Drive and does not recommend deletion of revision variants without release history.
6. **Keep credentials out of artifacts.** The cache/release note includes AWS credential setup guidance and explicitly warns against sharing private keys. Ensure any recovered configuration contains placeholders only and rotate/remove any live credentials discovered during later build work.

## Limitations

This is a **metadata and readable-content inventory**, not a compilation, malware scan, license audit, or protocol-compatibility test. Google Docs were exported to local plain text where possible. The listed archives were downloaded only into the sandbox for filename inspection; their source code was not executed and their full contents were not semantically audited. Exact MD5 matches identify byte-identical Drive blobs; they do not establish which revision is intended for release. The report deliberately distinguishes confirmed files from documentation claims.

## Evidence records inspected directly

- `1qYDrO0MZD3Q5NKLtL8Y2BvJg4Nqz-6Ux` — project root metadata and direct-child inventory.
- `1LcvDs38x8UP7pmPQ71nrvqWg49fUZR_t`, `1b0EvYF-BUVA-POHIbdc_csARgaBWKQ1z`, `1fLvxye7BzB0zNs8xTw_k89qrHGuJwjyv`, `1VMHKGZ9UNOnI3oVbxs0vrkncgtvZnYsY`, `1yDgY0t6RBD4KG8pCJXSU5cizE9_XG1Gj` — component-folder metadata and direct child inventories.
- `1OkT-6CZ-QyCaCtBCuC_IYMOyiLbECkj4YaPrTivHRBI`, `1-X0t-X6GAjxG4bIsywqFi8RMSL-NHi0ketm9E7XO1sI`, `1YlT9gDuEU_sWFcR2K0DTGIcgqcnti3hQL6BpMd026yU`, `1hz9qe4E5_1H8HVE2Hy2Pv6rPiEyNSw0OliMOOn1Z1Uw`, `1JRkyCkSrGQAW5NIa3qI57RJ3RT0uX8w5bpXPq3DDf98` — exported Google Docs.
- `11R9c_GUOB1TYXiROxxLZgLTRmr8giuDv`, `1EwqSAspoejPeMNFccPFkqhjFKMS_Y2H2`, `1akdazlTUu4xlkI6lUu-d59ymWKyHC95C` — archive filename listings.

---

**Report created:** `/home/ubuntu/2006scape-build/research/drive-inventory.md`
