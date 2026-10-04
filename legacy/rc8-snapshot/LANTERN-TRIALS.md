# rc.7 combat integration

Combat commands contain only a monotonically increasing action sequence and `attack` or `guard`. The server obtains position, equipped weapon, damage, reach, health and timing. The bounded queue and per-weapon cooldown prevent packet bursts from accelerating damage. No client damage, target or weapon override is accepted.

Every tick stages movement and gameplay together. Combat actions resolve before pulse impact; a guard received for the impact tick can block it. Defeat cancels a pending pulse. Recovery and camp healing continue while the Warden rests. Each surviving contribution is consumed once for a session victory. Final fighter/encounter schema validation happens before the candidate is committed. A failed calculation exposes none of its health, cooldown, result or clock changes.

Public game snapshots expose shared Warden state and the recipient's own fighter. Other visible players expose identity, appearance and equipped weapon; their private fighter data is absent. Profile schema version 1 is unchanged because training state is intentionally ephemeral. Replay contract revision 7 covers the added simulation state.

Nine new tests cover weapon range/cadence, immutable definitions, pulse guard/dodge, recovery during rest, capped healing, shared victory/respawn, burst rejection, rejected forged fields, rollback, private/session state, malformed health/clocks and passive revision updates. The existing socket-client test now asserts that Join sends no default appearance action.

The training ring is intended as a small repeatable cooperative loop. Ranged safety, session-only scores and reconnect health reset are explicit prototype choices. Persistent combat rewards or competitive progression would require a different durable policy before introducing trade or combat currency.
