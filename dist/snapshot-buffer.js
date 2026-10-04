import { checkedSnapshot } from './replication.js';
/** Presentation only. Interpolates known positions; never extrapolates or changes authority. */
export class SnapshotBuffer {
    delayMs;
    frames = [];
    receivedAt = 0;
    presentedTime = -Infinity;
    constructor(delayMs = 100) {
        this.delayMs = delayMs;
        if (!Number.isFinite(delayMs) || delayMs < 0 || delayMs > 500)
            throw new RangeError('Invalid interpolation delay');
    }
    get size() { return this.frames.length; }
    clear() { this.frames = []; this.receivedAt = 0; this.presentedTime = -Infinity; }
    push(value, receivedAt) {
        if (!Number.isFinite(receivedAt) || receivedAt < 0)
            throw new RangeError('Invalid arrival clock');
        const snapshot = checkedSnapshot(value), latest = this.frames.at(-1);
        if (latest && (snapshot.tick <= latest.tick || receivedAt < this.receivedAt))
            return false;
        this.frames.push(snapshot);
        if (this.frames.length > 32)
            this.frames.shift();
        this.receivedAt = receivedAt;
        return true;
    }
    sample(now) {
        if (!Number.isFinite(now) || now < 0)
            throw new RangeError('Invalid presentation clock');
        const latest = this.frames.at(-1);
        if (!latest)
            return { players: [], stale: false, ageMs: 0, tick: 0 };
        const ageMs = Math.max(0, now - this.receivedAt), stale = ageMs >= 500;
        const target = Math.min(latest.simulationTimeMs, Math.max(this.presentedTime, latest.simulationTimeMs + ageMs - this.delayMs));
        this.presentedTime = target;
        let left = this.frames[0], right = left;
        for (const frame of this.frames) {
            if (frame.simulationTimeMs <= target)
                left = frame;
            if (frame.simulationTimeMs >= target) {
                right = frame;
                break;
            }
            right = frame;
        }
        const gap = right.simulationTimeMs - left.simulationTimeMs;
        const alpha = gap > 0 ? Math.min(1, Math.max(0, (target - left.simulationTimeMs) / gap)) : 0;
        // Membership follows the newest authoritative frame: no ghost avatars after departures.
        const previous = this.frames.at(-2);
        const players = latest.players.map(p => {
            const prior = previous?.players.find(q => q.id === p.id);
            const discontinuity = previous && (!prior || latest.simulationTimeMs - previous.simulationTimeMs > 500 || Math.hypot(p.position.x - prior.position.x, p.position.y - prior.position.y, p.position.z - prior.position.z) > 4);
            const a = left.players.find(q => q.id === p.id), b = right.players.find(q => q.id === p.id);
            if (stale || discontinuity || gap > 500 || !a || !b || Math.hypot(b.position.x - a.position.x, b.position.y - a.position.y, b.position.z - a.position.z) > 4)
                return { ...p, position: { ...p.position } };
            return { ...p, position: { x: a.position.x + (b.position.x - a.position.x) * alpha, y: a.position.y + (b.position.y - a.position.y) * alpha, z: a.position.z + (b.position.z - a.position.z) * alpha } };
        });
        return { players, stale, ageMs, tick: latest.tick };
    }
}
