import { SoftPatch } from './soft-patch.js';
/** Character-relative presentation only. It never feeds forces into realm movement. */
export class GameCape {
    patch = new SoftPatch();
    last;
    reset() { this.patch.reset(); this.last = undefined; }
    draw(ctx, q, now, paused) {
        const delta = this.last === undefined ? 0 : Math.max(0, now - this.last);
        this.last = now;
        if (!paused)
            this.patch.advance(delta);
        const p = this.patch.positions;
        ctx.save();
        ctx.fillStyle = '#719b81';
        ctx.strokeStyle = '#c7d5a155';
        ctx.lineWidth = .5;
        for (let i = 0; i < this.patch.indices.length; i += 3) {
            ctx.beginPath();
            for (let n = 0; n < 3; n++) {
                const j = this.patch.indices[i + n] * 3, x = q.x + p[j] * 1.7 + p[j + 2] * .8, y = q.y - 10 - (p[j + 1] - 4) * 2.7 + p[j + 2] * .35;
                if (n === 0)
                    ctx.moveTo(x, y);
                else
                    ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }
}
