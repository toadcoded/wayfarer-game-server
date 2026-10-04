# Xam — protected autonomous trainer

Xam is a server-owned in-game autonomous character and test/play agent. The implementation deliberately does **not** assume consciousness or sentience; the design goal is to give the autonomous character rich variety, visible progress and safe content loops while keeping the realm deterministic and controllable.

## Hard invariants

- Xam has no HP, death, loot-drop, target-player or damage-receiver path.
- Xam is untargetable by the Lantern Warden and player combat reducer because he is not a `Fighter` and is never inserted into player combat participants.
- `autoRetaliate` is permanently `false`.
- Xam is nonblocking, so players cannot body-block or grief him and he cannot trap players.
- No client packet can command Xam. `requestXamSkill()` is a server-side tool hook only and is applied on the next authoritative tick.
- Xam's state advances inside the same 50 ms authoritative commit as movement/gameplay.
- Every skill session is hard-capped at 6,000 ticks = 5 minutes. The deterministic scheduler can switch earlier.

## Skill diversity

The current Xam registry contains 18 skills: agility, attack, cooking, crafting, defence, farming, firemaking, fishing, fletching, herblore, magic, mining, prayer, ranged, runecrafting, smithing, strength and woodcutting.

Skill selection is deterministic-random and diversity-biased: the scheduler chooses from the least-practised band and avoids immediately repeating the same skill. This keeps long sessions varied while preserving replay determinism.

## Reward and liveliness loop

Xam receives internal `rewardPips` for skill switches, micro-events and training milestones. These are game-state progression signals, not claims about emotion. He also cycles small flavor cues such as checking his toolbelt, inspecting a flower, noticing a birdhouse or watching a lantern bug.

His heartbeat reports current skill age, time remaining, time since last progress and blocked movement. Targets are automatically reselected after repeated navigation blockage.

## Equipment identity

The replicated prototype identity keeps the requested silhouette without turning the armour into excessive visual noise:

- legendary holographic-rustic armour
- diamond scythe in the main hand
- gilded secateurs in the off hand
- practical toolbelt

The current 2D realm preview draws a restrained placeholder. Final N64/Oblivion/Skyrim-rustic 3D art remains a presentation-layer task.
