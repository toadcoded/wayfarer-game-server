# Wayfarer Layer v0.7 — Hardened MMORPG Runtime Architecture

Layer **v0.7 is now a materially stronger implementation layer rather than another pile of reference material**. I treated the existing v0.4 executable scaffold as the trusted base, used the v0.5/v0.6 research packages as evidence rather than blindly merging them, and converted the strongest ideas from your new images into explicit TypeScript systems.

The current v0.7 working tree is at:

`/workspace/scratch/66b6c39d3d6e/wayfarer-v0.7`

The important result: **strict TypeScript compilation succeeds and the complete suite now passes 68/68 tests.**

## What v0.7 hardened

The central architecture is now much more appropriate for a real multiplayer RPG:

**Server authority is explicit.** Client packets contain intent rather than authoritative position, time, speed, or player identity. The new `RealmRuntime` owns connection identity, monotonically increasing server time, ticks, player state, and per-player visibility. That direction matches current Colyseus multiplayer guidance: the server mutates synchronized state while clients request changes rather than directly deciding authoritative state. citeturn7view0turn8view0

```text
CLIENT
  input intent
      ↓
transport validation
      ↓
RealmRuntime
      ↓
WorldSession
      ↓
ServerWalker
      ↓
NavigationWorld
      ↓
authoritative position
      ↓
interest-filtered snapshot
      ↓
CLIENT
```

That gives us a much cleaner foundation for later combat, NPCs, inventories, trading, gathering, quests, and other systems.

### Fixed simulation clock

`fixed-clock.ts` introduces a bounded fixed-step simulation clock.

The current target is:

```text
simulation = 20 Hz
step       = 50 ms
rendering  = display-driven
```

The simulation no longer needs to depend on how quickly a phone or monitor renders frames. The preview renders using `requestAnimationFrame()`, which the browser schedules before repaints, while game-state advancement occurs through fixed simulation steps. citeturn6search3

Long stalls are bounded rather than allowing hundreds of catch-up simulation ticks. This specifically addresses the classic “tab was backgrounded and now physics explodes” failure mode.

Current invariants include:

```ts
ticksPerSecond: 20
maxCatchUpSteps: 4
maxFrameDeltaSeconds: 0.2
```

This also places us on the same conceptual trajectory as modern multiplayer netcode systems where authoritative simulation advances at a fixed timestep and client-side rendering/prediction can occur separately. Colyseus's current netcode documentation explicitly describes fixed authoritative steps, sanitized inputs, and replay-compatible prediction. citeturn8view0turn8view1

## Multiplayer replication and streaming

Two important layers were added instead of sending the entire world indiscriminately.

### Interest-managed chunk streaming

`interest.ts` now manages what chunks should exist around a player.

It has:

- configurable view radius;
- unload padding;
- load/unload budgets;
- closest-first loading;
- hysteresis near chunk boundaries.

That last part matters. Without it, standing near a world-chunk edge can result in this:

```text
load → unload → load → unload → load → unload
```

A player moving slightly back and forth can generate pointless geometry work and network churn.

V0.7 instead establishes a larger retention boundary around the smaller loading boundary.

Conceptually:

```text
            unload boundary
        ┌────────────────────┐
        │                    │
        │    load radius     │
        │    ┌──────────┐    │
        │    │          │    │
        │    │ PLAYER ● │    │
        │    │          │    │
        │    └──────────┘    │
        │                    │
        └────────────────────┘
```

### Player interest filtering

`replication.ts` and `realm-runtime.ts` support spatial snapshot filtering.

A player in Reedhaven does not inherently need every player standing in Saffron Dominion or the Aurora Expanse.

The server can instead produce:

```ts
snapshotFor(connectionId)
```

using the player's **server-owned position** as the visibility origin.

This is important: the client does not get to say:

```json
{
  "showMePlayersWithinRadiusOf": {
    "x": 999999,
    "z": 999999
  }
}
```

and thereby arbitrarily inspect another region.

The idea parallels per-client state visibility and area-based level-of-detail techniques documented by current multiplayer frameworks. citeturn7view1

Snapshot decoding is deliberately strict:

- maximum payload size;
- maximum player count;
- finite coordinates;
- bounded coordinates;
- duplicate ID rejection;
- exact schema fields;
- exact snapshot version;
- validated IDs;
- copied position structures rather than live authoritative references.

That is the kind of boring infrastructure that makes the creative systems safe to build on top of.

## Network and movement health

The movement layer inherited the strongest existing v0.4 behavior and gained an explicit transport-pressure seam.

The existing hardened rules remain intact:

```text
client chooses direction
server chooses speed
server chooses dt
server chooses identity
server validates collision
server owns final position
```

Injected packet properties such as client-specified speed, coordinates, timestamps, or another player's ID remain invalid.

Diagonal input remains normalized so:

```text
W speed == W+D resultant speed
```

instead of diagonal movement becoming approximately 1.414× faster.

Stale held input expires, duplicate sequence numbers are ignored, packet flooding does not advance simulation time, and walls use swept traversal tests so thin barriers cannot simply be skipped between two movement samples.

### WebSocket pressure protection

`transport-guard.ts` adds `SocketFlowGate`.

The browser's ordinary `WebSocket` API does **not** provide automatic backpressure for incoming data, and outgoing `send()` calls queue bytes that are reflected in `bufferedAmount`. MDN explicitly warns that uncontrolled message rates can grow memory use or overwhelm processing. citeturn6search2turn5search12turn6search10

So v0.7 establishes the policy:

```text
normal queue
    ↓
SEND EVERYTHING

soft pressure
    ↓
SEND state + critical
DROP transient effects

hard pressure
    ↓
CLOSE / recover connection
```

Default thresholds currently are:

```ts
softBytes = 64 * 1024
hardBytes = 512 * 1024
```

That means decorative/transient information can be sacrificed before authoritative state.

That distinction will become useful later:

```text
CRITICAL
login
disconnect
inventory transaction
quest completion
combat result

STATE
player position
NPC state
equipment state
world-object state

TRANSIENT
footstep
particle burst
floating leaf
cosmetic ambient event
temporary ping
```

A network hiccup should not preserve butterfly particles at the expense of player position.

## Visual quality and mobile HUD direction

Your reference screenshots suggest a very useful principle: **the game world stays visually dominant while information is densely compartmentalized around it.**

I intentionally treated those references as layout research rather than assets to copy.

The resulting `hud-layout.ts` defines an original responsive MMORPG composition with explicit rectangles for:

```text
status
minimap
utility panel
chat / event log
primary actions
mobile movement
```

Desktop composition is conceived approximately as:

```text
┌──────────────────────────────────────────────────────────┐
│ STATUS                              ┌──── MINIMAP ────┐  │
│                                    │                 │  │
│                                    └─────────────────┘  │
│                                      ┌───────────────┐  │
│                                      │               │  │
│               WORLD                  │ UTILITY PANEL │  │
│                                      │               │  │
│                                      │               │  │
│                                      └───────────────┘  │
│ ┌──────── CHAT / REALM LOG ───────┐ ┌──── ACTIONS ───┐ │
│ └─────────────────────────────────┘ └────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

Mobile becomes:

```text
┌─────────────────────────────┐
│ STATUS          ◯ MINIMAP   │
│                             │
│                             │
│            WORLD            │
│                             │
│                             │
│                             │
│ REALM LOG                   │
│                             │
│   MOVEMENT     ACTION BAR   │
└─────────────────────────────┘
```

It accounts for coarse-pointer/mobile input, safe-area insets, larger-interface accessibility mode, and minimum usable viewport dimensions.

This is the right conceptual direction for your project because it lets us eventually support a high-information MMO interface without shrinking the actual explorable world into a tiny center rectangle.

### Adaptive rendering quality

`quality.ts` establishes three runtime profiles:

| Tier | Max DPR | Prop density | Atmosphere | Shadow budget | Minimap |
|---|---:|---:|---|---:|---:|
| Low | 1.0 | 55% | Off | 0 | 4 Hz |
| Balanced | 1.5 | 80% | Low | 50% | 8 Hz |
| High | 2.0 | 100% | High | 100% | 12 Hz |

Instead of identifying phones by model name, initial quality can use runtime hints such as hardware concurrency, pixel ratio, memory information where available, and reduced-motion preference.

The governor then watches an exponential moving average of actual frame duration and changes tiers slowly with hysteresis rather than oscillating every few frames.

That means a beautiful device can remain beautiful:

```text
sun haze
dense flowers
water details
lantern glow
higher resolution
```

while a struggling phone can quietly shed:

```text
secondary props
atmosphere
extra shadow work
excessive pixel density
frequent minimap redraws
```

without changing core game rules.

High device pixel ratio can significantly increase a canvas's backing resolution, so explicitly controlling rendering density rather than always blindly matching the physical display is an important performance lever. MDN also documents `devicePixelRatio` changes as something applications can observe at runtime. citeturn4search3

## The world itself is becoming a network, not a random biome soup

The biochemical/network diagrams you provided were actually useful conceptually.

I did **not** translate biological terminology literally into gameplay mechanics. I extracted the architectural idea: complex systems become understandable when nodes have identities, connections, boundaries, inputs, outputs, and pathways.

That inspired `region-strata.ts`.

V0.7 now defines twelve coherent macro-regions:

| Region | Primary character |
|---|---|
| **Reedhaven Vale** | river valley, grasslands, lantern gardens, stronghold |
| **Barrow Meadow** | hilltop enclave, ravines, burial landscapes |
| **Ashfen Mire** | peat bog, crooked willow, mothlight boardwalk |
| **Moonroot Elderwood** | ancient forest, roots, hollows, fungal paths |
| **Saffron Dominion** | red desert, pyramids, glyphs, obelisks |
| **Glass Oasis** | palm courts, canals, mirror pools |
| **Saltwind Coves** | tropical coast, mangroves, lagoons |
| **Emberfall Caldera** | basalt fortress, geothermal gardens, obsidian |
| **Cloudbreak Heights** | alpine cliffs, monasteries, rope crossings |
| **Aurora Expanse** | tundra, standing stones, ice harbor |
| **Luminous Underdeep** | crystal cavern, fungi, buried archives |
| **Sky Garden Enclave** | mountaintop terraces, cloud gates, observatory |

Each region contains separate fields for:

```ts
biomes
motifs
traversal
resources
dangers
anchors
neighbors
```

For example:

```text
Reedhaven
   ├── Barrow Meadow
   ├── Ashfen Mire
   └── Moonroot Elderwood
           │
           └── Underdeep
                  │
                  └── Emberfall
                         │
                         └── Saffron Dominion
                                │
                                └── Glass Oasis
                                       │
                                       └── Saltwind Coves
```

while the northern route climbs toward:

```text
Barrow Meadow
      ↓
Cloudbreak Heights
    ↙       ↘
Emberfall   Aurora Expanse
                 ↘
                Sky Garden
```

The graph is automatically checked for asymmetric region connections, and shortest-region routing is implemented.

That creates a foundation for something much richer later:

```text
regional quest chains
caravan routes
faction influence
resource economies
weather fronts
NPC migration
world events
trade dependencies
dungeon entrances
fast-travel unlocks
biome music layers
regional crafting materials
ecological relationships
```

The crucial distinction is that **a biome describes terrain; a region describes a place.**

That is a major improvement in how we should think about this game's world.

## Verification state

The v0.7 working tree was compiled using its strict TypeScript configuration. The configuration retains strong compiler checks including `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`; TypeScript documents these options as providing stronger correctness guarantees around nullability, indexed access, and optional-property semantics. citeturn5search6turn5search7

The final automated run was:

```text
tests:      68
passed:     68
failed:      0
skipped:     0
cancelled:   0
```

Coverage now includes, among other behaviors:

```text
✓ deterministic world generation
✓ neighboring chunk seam matching
✓ negative chunk coordinates
✓ deterministic weather
✓ strict protocol rejection
✓ distant chunk request rejection

✓ ramps
✓ foundations
✓ bridges
✓ bridge rails
✓ deep water
✓ submerged geometry
✓ terrain seams
✓ construction conflicts

✓ collision
✓ thin-wall sweep detection
✓ A* routing
✓ stronghold gates
✓ dynamic collider changes
✓ slope limits
✓ step limits
✓ water limits

✓ movement normalization
✓ duplicate input rejection
✓ stale-input expiry
✓ packet-flood resistance
✓ movement codec validation
✓ authoritative session identity

✓ all three themed crossing scenarios
✓ Willowglass Causeway
✓ Saffron Meridian
✓ Mothlight Boardwalk

✓ fixed simulation cadence
✓ bounded catch-up
✓ chunk-interest budgets
✓ chunk-stream hysteresis

✓ strict realm snapshots
✓ spatial snapshot filtering
✓ duplicate player rejection
✓ snapshot copy isolation

✓ remote interpolation
✓ bounded extrapolation
✓ out-of-order sample rejection

✓ adaptive quality selection
✓ degradation hysteresis
✓ recovery hysteresis

✓ mobile HUD geometry
✓ desktop HUD geometry

✓ region-graph symmetry
✓ cross-region route connectivity

✓ RealmRuntime server ownership
✓ transport pressure shedding

✓ preview boot
✓ resizing
✓ crossing switching
✓ simulation/render loop
```

The preview's simulation loop has also been moved away from frame-dependent movement and onto the v0.7 fixed clock.

The overall runtime shape is therefore now:

```text
                    WAYFARER v0.7

 ┌──────────────── WORLD DEFINITION ────────────────┐
 │ deterministic terrain                           │
 │ biomes → regions → landmarks → crossings       │
 └──────────────────────┬───────────────────────────┘
                        │
                  NavigationWorld
                        │
                  authoritative
                     collision
                        │
        ┌───────────────▼────────────────┐
        │          RealmRuntime          │
        │ identity • time • ticks • AOI │
        └───────────────┬────────────────┘
                        │
                    snapshots
                        │
                 replication codec
                        │
               transport pressure gate
                        │
             ┌──────────▼──────────┐
             │       CLIENT        │
             │ interpolation       │
             │ chunk streaming     │
             │ adaptive quality    │
             │ responsive HUD      │
             └──────────┬──────────┘
                        │
                 render @ display
                        │
                   PLAYER EYES
```

## Remaining boundaries

I am deliberately **not** calling v0.7 a finished production MMO.

The 68 passing tests demonstrate the behavior covered by those tests; they do not prove production readiness.

Still outstanding are a real hosted WebSocket adapter, authenticated accounts, persistent character storage, server/database transactions, actual two-device Internet testing, reconnection semantics, combat authority, inventory/economy persistence, NPC simulation, chat moderation, distributed realm scaling, load testing, production monitoring, audio integration, production-grade renderer integration, and full real-device visual QA.

Likewise, remote player smoothing exists, but full local-player client prediction/reconciliation has not been wired into the playable client. Current multiplayer netcode literature treats prediction plus reconciliation as a separate layer on top of server authority, so keeping that work distinct instead of pretending interpolation solves it is intentional. citeturn8view0turn8view1

The current ordinary browser WebSocket transport also should not be considered hardened simply because `SocketFlowGate` exists; the gate is an integration primitive that still needs to be wired to a live connection's actual `bufferedAmount`. citeturn6search2turn6search10

**The important transition is complete, though: v0.7 is no longer just “more map.” It now has a coherent world graph, fixed simulation time, server-owned realm state, interest management, replication boundaries, smoothing, network-pressure policy, adaptive rendering quality, and a responsive MMO HUD architecture—all layered on top of the tested walking/construction/world systems we already built.**