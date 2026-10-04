export type DriveSlot = {
  id: string;
  name: string;
  kind: "cluster" | "track" | "lab" | "inbox";
  owns: string;
  status: "latched" | "empty" | "lab-only";
};

/** Live snapshot from the connected Drive root `1qYDrO0MZD3Q5NKLtL8Y2BvJg4Nqz-6Ux`. */
export const DRIVE_ROOT_ID = "1qYDrO0MZD3Q5NKLtL8Y2BvJg4Nqz-6Ux";

export const DRIVE_SLOTS: DriveSlot[] = [
  {
    id: "1ePAPelDwqHfvKpgkLAKbVSTpixE4l1Ar",
    name: "01 Architecture-Ontology",
    kind: "cluster",
    owns: "Domain terms, module boundaries, glossaries",
    status: "latched",
  },
  {
    id: "1LcvDs38x8UP7pmPQ71nrvqWg49fUZR_t",
    name: "02 Server-Go-317",
    kind: "cluster",
    owns: "Original tick, bitstream, viewport — no Jagex pack",
    status: "latched",
  },
  {
    id: "1b0EvYF-BUVA-POHIbdc_csARgaBWKQ1z",
    name: "03 Client-3D-Java",
    kind: "cluster",
    owns: "Original client experiments",
    status: "latched",
  },
  {
    id: "1fLvxye7BzB0zNs8xTw_k89qrHGuJwjyv",
    name: "04 Map-Cache-2730",
    kind: "cluster",
    owns: "Cache shapes, mapgen, seed 2730",
    status: "latched",
  },
  {
    id: "1TEqobs_f3Ew5wov74tr8xgEJhHYIYNag",
    name: "05 Auth-JWT-RSA",
    kind: "cluster",
    owns: "JWT/RSA boundaries",
    status: "latched",
  },
  {
    id: "1VMHKGZ9UNOnI3oVbxs0vrkncgtvZnYsY",
    name: "06 Companion notes",
    kind: "lab",
    owns: "Observation notes only — not shipped",
    status: "lab-only",
  },
  {
    id: "1yDgY0t6RBD4KG8pCJXSU5cizE9_XG1Gj",
    name: "07 Build-Scripts",
    kind: "cluster",
    owns: "CI, make, workflows",
    status: "latched",
  },
  {
    id: "15O6sxUJl6WSkLAvrwrfJcH4Gm8vLzWfc",
    name: "08 Educational-Content",
    kind: "cluster",
    owns: "Tutorials, curricula — currently empty",
    status: "empty",
  },
  {
    id: "15ixE7PmcbLBba5m2--8iFNzTsfybEYKB",
    name: "09 Mixin-Techniques",
    kind: "lab",
    owns: "Lab templates. Not on the ship path.",
    status: "lab-only",
  },
  {
    id: "16bt0yzVv-Mg0D1GLBvjtpPRIww9Ux8yv",
    name: "99 Inbox-Unsorted",
    kind: "inbox",
    owns: "Triage landing zone",
    status: "latched",
  },
  {
    id: "1iRG0-YsLxhUuUe26atNaVie-mNocX49G",
    name: "polycodex",
    kind: "track",
    owns: "Working corpus, recovery, connectors",
    status: "latched",
  },
  {
    id: "1_8uAIy-xTU3M6TacDRZ5dCv_BNHKihDm",
    name: "PolyCodex-RSPS",
    kind: "track",
    owns: "Original-IP 600ms tick notes: skill vessel, stamp, transfer utils",
    status: "latched",
  },
  {
    id: "1zp1ghKb9LnN1who_APIIpJ-j8hdHUnPj",
    name: "PolyCodex-Connector-Core-Official",
    kind: "track",
    owns: "Connector core",
    status: "latched",
  },
  {
    id: "1cEG70HH2X_ezs9zbWfRAmxEX1rzzxegQ",
    name: "ingestion / google_drive",
    kind: "inbox",
    owns: "Care-package + audits. Evidence only — quarantined from runtime.",
    status: "latched",
  },
  {
    id: "1akUeBgdoUARDVM0lEpF6r2zZClLfVefs",
    name: "00 AUDIT AND PROVENANCE",
    kind: "inbox",
    owns: "Clean-room reports, inventory, launcher review.",
    status: "latched",
  },
  {
    id: "1tSnElNKaY1QzcI2SNO1CuEKCZCpvXqN-",
    name: "01 CLEAN ROOM PHASE 1",
    kind: "cluster",
    owns: "Original-IP planning. NOTICE-QUARANTINE.",
    status: "latched",
  },
  {
    id: "1D4njGiJLKn533TV4JK0cIcgb7rfclwc-",
    name: "00 INDEX AND GUIDANCE",
    kind: "inbox",
    owns: "Ingestion index.",
    status: "latched",
  },
  {
    id: "1uK8-t5M9fEmzT12k_OMSdqa2410lxrjm",
    name: "01 TASK MANAGEMENT",
    kind: "inbox",
    owns: "Task ledger for care-package.",
    status: "latched",
  },
  {
    id: "1RX4TqQmWZ84GAX3zzygOnwGdms_ieV0m",
    name: "02 VALIDATION",
    kind: "inbox",
    owns: "validate_package.py — evidence only.",
    status: "latched",
  },
  {
    id: "197CPxYJGI4bRSgFZ4RGXoKzC7ntPQKv8",
    name: "03 FORMATTERS AND TEMPLATES",
    kind: "inbox",
    owns: "format_markdown.py — evidence only.",
    status: "latched",
  },
  {
    id: "1ztP9AHakHFZOQ-tTjRReQ-RYXHTrUK6U",
    name: "04 CONNECTOR REGISTRY",
    kind: "inbox",
    owns: "connector_registry.json — metadata, no secrets.",
    status: "latched",
  },
  {
    id: "1DURKUZTKViL8uj2UplHXEWdBaFlmCeAT",
    name: "05 CHANGE LOGS",
    kind: "inbox",
    owns: "Dated Drive organization logs.",
    status: "latched",
  },
  {
    id: "1tSDS-xiExSP-tDhYN1gShs-oCD0x3_Ad",
    name: "99 Inbox reports",
    kind: "inbox",
    owns: "Misc reports. Archives stay quarantined.",
    status: "latched",
  },
  {
    id: "17l7OR_mIMd3Q-KgtxYlykq2WpQuomoSM",
    name: "polycodex-cli",
    kind: "lab",
    owns: "Offline queue tarball — quarantined, not extracted.",
    status: "lab-only",
  },
];

export const INDEX_RULE =
  "Ship path = original encode + auth + map. Lab path = observation notes under 06 / 09 only. Archives, 2006scape, RuneLite, mixins, and caches stay quarantined.";
