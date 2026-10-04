# Snapshot presentation contract

SnapshotBuffer is a client presentation utility. It never writes authoritative realm positions, checks gameplay collision, chooses speed, sends a claimed position, or advances server time.

Default render delay is 100 ms. Up to 32 validated snapshots are retained as copies. Positions interpolate linearly between known server simulation timestamps using monotonic client arrival time. Rendering never extrapolates beyond the newest known position. The presentation timeline cannot rewind when arrival jitter or a backward render-clock sample occurs.

Newest authoritative membership governs visibility. A player absent from that membership is removed immediately. New identities appear at their latest position. Disconnect/rejoin clears all buffer state. Duplicate/older ticks and backward arrival timestamps are ignored without refreshing liveness.

Large corrections over four world units, gaps over 500 ms, and stale state snap to the newest sample. At 500 ms since fresh state the browser clears held directions. At five seconds it disconnects; a new join starts at the landing. This is not persistent session recovery.

Linear interpolation is visual only and does not follow a collision-aware path between samples. It may cut visually across a short corner or slope; authority remains correct. Large jumps are deliberately not animated through scenery. No prediction, reconciliation, extrapolation, rollback, adaptive network-delay estimator, or production performance guarantee is provided.

Both local and remote avatars are buffered. Local input therefore includes the explicit presentation delay on top of network delay. Future local prediction must be a separate tested feature, not an incidental change to this buffer.

The v0.7.3 handshake remains unchanged because world geometry, physics, tick cadence and wire formats are unchanged.
