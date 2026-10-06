# Visual Pass FX — 2026-10-06

- Added a bounded rain layer of pooled streak meshes that follows the camera target and pauses with reduced motion.
- Added dynamic lightning branches and a bounded storm flash light.
- Added spell particle bursts on authoritative encounter strike transitions; client coordinates do not control damage or effect authority.
- Improved humanoid idle breathing and weight settlement, plus combat anticipation, guard sway, aim stabilization, and chop recoil.
- Preserved renderer ownership, disposal, movement authority, collision, and persistence contracts.

Validation: complete Wayfarer suite passed `317/317` after the final rebuild.
