# World presentation and HUD

| Surface | Current implementation |
| --- | --- |
| Terrain | Deterministic vertex tints mixing fern, grass and earth hues; existing positions/indices preserved |
| World materials | Matte specular response and bounded saturation enhancement |
| Lighting | Warm ground ambient, cooler sky/key lighting; exposure 1.12 and contrast 1.18 on actual Engine pipeline |
| Grass | Up to 256 seeded candidate tufts, three blades each, one nonpickable/noncolliding mesh and one material |
| Grass exclusions | Centre lane within 2.25m, water depth above .05m, slopes above 30°, nonfinite ground |
| HUD | Five panels, tab roles/relationships, arrow/Home/End navigation and native keyboard buttons |
| Small screens | Bounded scroll panels, safe-area offsets, collapse button and 44px targets |
| Preferences | Validated local HUD record; existing PGlite quality settings retained |
| World metrics | Enabled mesh/triangle counts, grass tuft count, metre scale and server tick rate |

Grass is generated once at renderer creation rather than every frame. The fixed geometry budget is 768 triangles at the maximum of 256 accepted tufts; terrain exclusions usually reduce it. It introduces one grass render mesh, with two-sided matte rendering and vertex colours. The host map and collision scene never import or depend on decorative grass. No external art, upscaling service, remote font, CSS framework or model download is required.

HUD state stores only `tab` and `compact` under wayfarer.hud.v1. Unrecognised/malformed preferences fall back to Drills with the panel open. Browser storage failure is tolerated. These settings never include player identity, inventory, progression or transport credentials. Tabs preserve the existing gameplay button IDs and server validation. Hiding a panel is presentation, not an authorization boundary.

CSS uses palette variables, gradients, borders and inset shadows to suggest cloth/metal depth. Important information retains text labels; markers and focus outlines supplement colour. There are no new blinking HUD animations. Existing reduced-motion controls still pause character/ambience secondary motion. Responsive rules are implemented, but geometry and HTTP tests do not replace physical device visual/accessibility review.

The candidate continues the existing authoritative client/server rather than introducing parallel persistence paths. Tauri/native launch, Tailwind migration, Torch/Real-ESRGAN/Flux image tooling remain possible separate experiments once useful assets and platform requirements are concrete; none is represented as working here.
