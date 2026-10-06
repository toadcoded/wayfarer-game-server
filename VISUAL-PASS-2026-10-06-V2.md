# Visual Pass V2 — 2026-10-06

This is the larger environmental-art pass requested after the initial polish pass.

- Added a generated forest layer around both landing zones: visible trunks, trunk highlights, roots, five clustered canopy volumes, contrasting canopy colors, occasional flowers, and animated wind sway.
- Added animated river ripple line accents over sampled water cells and retained translucent, day/night-responsive water materials.
- Corrected camera-follow bookkeeping so following Xam tracks the selected actor rather than being overwritten by the local player target.
- Kept foliage decorative-only: no collision, no pick interaction, no authoritative navigation changes.

Focused renderer and wildlife tests pass after the rebuild. The complete Wayfarer suite is rerun for the release package.
