# Vertical Access and Structural Physics

This implementation increment adds deterministic support for stairs, ladders, ropes, cellars, trapdoors, crawl spaces, hubs, dungeon entrances, doors, and multi-level transitions.

## Authority model

The server owns the authoritative level, tile, support state, connector state, and transition revision. The client may animate a connector, preview a route, and render structural changes, but it cannot teleport the player, bypass a locked door, traverse an unsupported connector, or claim a successful transition.

## Connector types

| Connector | Typical use | Traversal | Structural rule |
|---|---|---|---|
| Staircase | Ground to upper floor | Walk/interact | Requires a continuous supported footprint and destination landing |
| Ladder | Cellar, tower, shaft | Climb | Requires an anchored top and bottom socket |
| Rope | Cave drop or rescue route | Climb/drop | Requires an anchor, bounded vertical span, and destination safety volume |
| Trapdoor | Floor hatch | Interact/climb | Requires a solid frame, open state, and clear hatch volume |
| Crawl space | Low tunnel | Crawl | Requires a continuous low-clearance corridor and crawl-capable actor |
| Hub | Building/cave junction | Walk/portal | Requires at least two valid connected exits |
| Dungeon entrance | Region boundary | Interact/portal | Requires destination registration and admission rules |
| Door | Room boundary | Walk/interact | Changes collision graph only through server-authorized state |

## Sturdy structure invariants

1. Every walkable tile has a support kind: `floor`, `stair`, `ladder`, `rope`, `crawl`, or `portal-landing`.
2. Every vertical connector has a source socket, destination socket, bounded height delta, and collision clearance.
3. Every destination landing is walkable, supported, and has a safe arrival radius.
4. A connector cannot cross an unregistered level or world space.
5. A closed or locked door is a collision edge, not a visual-only prop.
6. A transition commits atomically: level, tile, facing, support state, graph revision, and transition revision update together.
7. A duplicate command returns the original result and never grants a second transition.
8. Invalid topology fails content loading before the world accepts player connections.
9. A client route cannot remain valid after a relevant graph revision changes.
10. The system is deterministic under a fixed world definition and command sequence.

## Physics scope

This prototype uses discrete authoritative tile physics rather than a full continuous rigid-body engine. That is intentional for the first multiplayer slice: collision, support, portal traversal, and graph revisions are reproducible across server instances and clients. Continuous animation and interpolation remain client presentation concerns.

Later 3D physics may be added for cosmetic motion, falling animation, rope sway, or debris, but it must not replace the authoritative support and transition checks.
