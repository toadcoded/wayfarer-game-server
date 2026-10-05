# Google Drive Delta Audit — Polycodex / Wayfarer / Ashfen / Copper Lantern

**Audit time:** 2026-09-11 (UTC)  
**Baseline:** [`drive-inventory.md`](file:///home/ubuntu/2006scape-build/research/drive-inventory.md), dated 2026-09-11  
**Method:** Read-only `gws drive files list/get` metadata queries. No Drive item, permission, content, star, offline setting, or folder structure was modified.

## Conclusion

The core **PolycodexServerClientApp** RSPS-like component folders remain materially unchanged from the prior inventory: their current child counts and the previously recorded cache/companion duplicate sets match the baseline. The live root now has **3,214 direct non-trashed children**, versus **3,213** in the prior report: a net increase of **one**.

The meaningful delta is therefore mostly **newly surfaced adjacent material**, rather than a change to the established server/client/cache/build baseline. Five **Wayfarer**-titled items exist, all starred and non-trashed; none was named in the prior inventory. One root item, `2006Scape _ Polycodex Build Status.md`, is an unrecorded current direct child. Four evidence/report files in the separate `polycodex/ingestion/google_drive/` collection have modification timestamps strictly later than the Drive copy of the prior inventory. These are documentation/metadata artifacts, not evidence of a newly verified runnable client/server/cache release.

> **Important distinction:** An item absent from the prose of the prior inventory is a *newly documented delta*, not necessarily proof that it was created after that audit. Only timestamps strictly later than the prior inventory’s Drive-copy timestamp establish post-baseline activity.

## Scope and comparison boundary

| Scope | Current observation | Comparison result |
|---|---:|---|
| Main project root `PolycodexServerClientApp` (`1qYDrO0MZD3Q5NKLtL8Y2BvJg4Nqz-6Ux`) | 3,214 direct, non-trashed children; 3,208 starred | Prior report recorded 3,213 direct children; **net +1**. |
| `02-Server-Go-317` | 5 direct children | Matches prior described count/content family. |
| `03-Client-3D-Java` | 0 direct children | Still empty; **no new standalone Java client** is evidenced by this folder. |
| `04-Map-Cache-2730` | 9 direct children | Matches prior described inventory. |
| `06-PolyLite-Companion` | 7 direct children | Matches prior described inventory. |
| `07-Build-Scripts` | 3 direct children | Matches prior described inventory. |
| Nested `polycodex-cli` | 1 direct child | Matches prior `polycodex-offline-queue.tgz` observation. |
| Nested `polycodex` folder | 1,262 direct children | Current snapshot; prior narrative identified it as a high-volume duplicated export area but did not give a comparable count. |
| `polycodex/ingestion/google_drive/` | 67 direct children | Separate care-package/evidence collection; not the core build folders. |

## Genuinely post-baseline activity

The prior inventory’s Drive copy is `2006scape RSPS Build — Google Drive Inventory.md` (`1BB6U0_qiTYhhLGFhheEbUs5kzptTml_n`), modified at **2026-09-11T13:08:05.802Z**. The following four non-trashed, starred items have timestamps *strictly later* than that marker. They are all in the separate ingestion/care-package folder `1cEG70HH2X_ezs9zbWfRAmxEX1rzzxegQ`.

| Modified UTC | Item | ID | Type | Version | Size | MD5 |
|---|---|---|---|---:|---:|---|
| 2026-09-11 13:08:28.242 | `Clean-Room Architecture for an Original 2006-Era Fantasy MMORPG.md` | `14dQ0C6GSK-0A0B6IEmi-dyJOlr3PANrH` | Markdown | 4 | 39,768 B | `bbe0b9f7817de035873e65d88b16b48f` |
| 2026-09-11 13:08:46.144 | `Desktop Launcher _ Bootloader Review for a Legally Safe RSPS-Like Game.md` | `1s4oT44tFRi1AQuJRbPwBgM3QW3iZgGzS` | Markdown | 4 | 33,230 B | `93cf5abb1fae776be9461de3830db7d5` |
| 2026-09-11 13:09:01.041 | `drive-metadata.ndjson` | `1-lqe-ac8mdgDynIqYkilZ6Olu8ffymh2` | NDJSON | 3 | 7,096 B | `853d2bafa0f8f1985b0ba2c613dc97b3` |
| 2026-09-11 13:09:19.559 | `project-children.json` | `18aEb_xM8Xl58AyVLxtHkQ9cMCvKJHq-J` | JSON | 3 | 45,629 B | `97715ce377e01653c0d0cb1f9ba99cf1` |

These files are new/changed audit and architecture artifacts. They do **not** alter the earlier finding that the Drive has no confirmed coherent 2006Scape client/server/launcher/cache release.

## Newly documented current root item

The root-count increase is supported by the following current direct child, which is absent from the prior report’s item tables and was modified at **2026-09-11T13:00:12.887Z**:

| Item | ID | Type | Version | Size | MD5 | Status |
|---|---|---|---:|---:|---|---|
| `2006Scape _ Polycodex Build Status.md` | `1VxnRGPDffqa5pP0urSHTHsWB2e9GVB4c` | Markdown | 3 | 2,736 B | `de9ee3fc34f132f594793202c0815e8e` | Starred, non-trashed; direct child of the main project root. |

This item is a **current, previously undocumented root record**. The net count increase does not alone prove it is the sole created item, because deletion/moves elsewhere between snapshots cannot be reconstructed from a baseline page token that was not retained.

## Target-title results

### Wayfarer — new to the prior written inventory

A title query returned **five** non-trashed Wayfarer records. All are starred, viewable, downloadable, copyable, and editable by the connected account; all have `viewedByMe=true`. No Wayfarer title was named in the prior inventory. The records are current evidence of a related workspace/hand-off branch, but their archive contents were not downloaded or executed for this delta audit.

| Modified UTC | Item | ID | Version | Size | MD5 | Parent |
|---|---|---|---:|---:|---|---|
| 2026-09-10 18:59:14.962 | `WAYFARER_IMMERSION_REMASTER.md` | `1V13c1C8481qN69WF3KWwgwUZAHOqOlAf` | 7 | 1,835 B | `8b6f0020310c99e34069f9f74b3e9e8a` | ingestion/care-package folder |
| 2026-09-07 21:15:30.455 | `grok-workspace-wayfarer.zip` | `1bZmU7xDkyKt1DnGkJlbO4BjAjFBw66FY` | 3 | 35,593,098 B | `c62d90249cb92ea00b323a79aa80164a` | main project root |
| 2026-09-06 01:42:05.096 | `wayfarer-polycodex-handshake-strata.zip` | `1oJgYhpB8PBS-IJl7o8kU53f_mcscN4mh` | 3 | 627,861 B | `d462352a3778522c164d194b037fd98e` | main project root |
| 2026-09-06 00:35:09.809 | `wayfarer-next-strata.zip` | `1DzAbb1KzlLD7DaPVsj68yjrJQ8KO2uOs` | 3 | 621,782 B | `d738417805dcf7d8e83ddd73bf29cb89` | main project root |
| 2026-09-06 00:35:07.552 | `wayfarer-osrs-refined.zip` | `1KbYPyGT5xMpOsrxhoAERn_PlrEe3XJTq` | 3 | 618,205 B | `f58847e517580e7020257a0a89286f13` | main project root |

`WAYFARER_IMMERSION_REMASTER.md` is the only Wayfarer title modified on 2026-09-10. Its `viewedByMeTime` is 2026-09-11T00:35:25.507Z. The four archives’ `createdTime`, `modifiedTime`, `modifiedByMeTime`, and `viewedByMeTime` coincide with their listed creation/upload timestamps.

### Polycodex

The current `name contains 'Polycodex'` query returned **267** non-trashed records, **258 starred**. This broad match encompasses legacy root material, duplicated source exports, the existing component/care-package collection, and the current evidence reports; it is not a release manifest. The title query alone cannot establish a current active branch or compatibility.

The core component folders’ latest direct-child timestamps remain 2026-08-20 (except the one nested CLI payload at 2026-08-18), so no recent direct-content update was found there. The root itself has recent non-core additions, including the build-status item above.

### Ashfen and Copper Lantern

No non-trashed file or folder titles matched `Ashfen` (**0**) or `Copper Lantern` (**0**) in the current Drive title queries. Therefore neither name has a current, title-identifiable Drive artifact in the accessible audit scope.

## Duplicate and revision comparison

No new duplicate family was detected in the core server/cache/companion/build folders. The current exact-MD5 duplicate groups reproduce the four groups recorded in the baseline:

| MD5 | Current identical records | Delta assessment |
|---|---|---|
| `5d4d175f9f15a3a21a0fd111b6bb2e7a` | `11R9c_GUOB1TYXiROxxLZgLTRmr8giuDv` in Map/Cache and `1m3zkh3QidX_MnHwGRF_3ndNHPEWydiGf` in Build Scripts; each 25,559 B | Existing exact duplicate; unchanged relative to prior report. |
| `ac28f4e2e324bce1827ff4e71ab1ce27` | `1zepDeWH9mbk-tz0hdawIxAcgphokfWeY` in Server and `1kVxhcEs55J2SD-BZOsruBt27mNm4NR7E` in Map/Cache; each 11,593 B | Existing exact duplicate; unchanged. |
| `40e51290fc38bb0b327552a1e3cc3dad` | `1AvHx4kyXInox5vIezdVOSo6XnMuqdptf` in Map/Cache and `1JcEjjBe5T3_GxR-kiBPAOemDLnlxbu5_` in Build Scripts; each 7,112 B | Existing exact duplicate; unchanged. |
| `3b4299447ad7e25d7107c89943acef4a` | `1r4Nv2KtkHJKsfZTvTwKxUxzx2CIZc2be` in Server and `1TNZtW1lnCTDWFBzt6GAt8O3lxLR2f3J5` in Companion; each 14,667 B | Existing exact duplicate; unchanged. |

The current snapshots also retain the baseline’s non-identical archive-revision pattern: cache-pipeline payloads at 7,112 B, 11,593 B, 17,058 B, 18,754 B, and 25,559 B; companion-stub payloads at 6,257 B, 11,787 B, 12,964 B, 14,667 B, and 16,352 B. Nothing in the current metadata establishes an authoritative replacement revision or a new runnable bundle.

## Recent/starred/offline-relevant metadata

| Metadata dimension | Current evidence | Interpretation |
|---|---|---|
| Recent activity | 46 non-trashed Drive records have `modifiedTime >= 2026-09-11T00:00:00Z`; 4 fall strictly after the prior inventory’s Drive-copy timestamp. | Recent activity is concentrated in the separate ingestion/care-package collection, not the core components. |
| Starred | All five Wayfarer records and all four strict post-baseline artifacts are starred. The root has 3,208 starred direct children of 3,214; `Polycodex` title results have 258 starred records of 267. | Starred status is a user-preference/attention signal, **not** a release approval or provenance indicator. |
| Offline availability | The Drive Files metadata exposed by `gws` includes stars, views, versions, MIME types, checksums, parents, capabilities, and timestamps, but **does not expose a per-item “available offline” flag**. | No conclusion about offline synchronization/download state can be made from this audit. |
| Access/capabilities | The connected account can download, copy, and edit each Wayfarer item; all are non-trashed. | Access does not establish authorship, license, content integrity, or suitability for execution/distribution. |
| Checksums | Binary/archive and plain-file items include Drive MD5 where applicable; Google-native documents generally do not. | MD5 is used here only for byte-identical duplicate recognition, not security assurance. |

## Limitations and recommended handling

This is a metadata delta, not a content diff, archive inspection, compilation, malware scan, licensing review, or protocol-compatibility test. The prior inventory did not retain a Drive Changes API start-page token or a full per-ID version manifest, so the audit cannot prove every historical edit, move, deletion, or rename. A root count difference is consequently a **net** difference, not a complete change ledger.

Do not merge, execute, or redistribute the Wayfarer archives, newly listed archives, cache-pipeline revisions, or companion material based only on these names and metadata. Preserve IDs, checksums, timestamps, and parent locations as evidence; require content-level diffing and provenance approval before treating any record as an implementation baseline.

---

**Read-only evidence snapshot created in:** `/home/ubuntu/jobs/job_KuW4YmcA_a0/raw/`  
**Required report:** `/home/ubuntu/2006scape-build/research/drive-delta-audit.md`
