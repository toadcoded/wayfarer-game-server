import { type PlayerSnapshot } from './movement.js';
import { NavigationWorld, type XZ } from './navigation.js';
/** Transport-neutral authority. Host binds connection identity; packets cannot select another player. */
export declare class WorldSession {
    private nav;
    readonly capacity: number;
    private players;
    private failed;
    get status(): 'active' | 'faulted';
    private requireActive;
    constructor(nav: NavigationWorld, capacity?: number);
    join(connectionId: string, spawn: XZ): PlayerSnapshot;
    receive(connectionId: string, message: string): boolean;
    /** Compute a detached next session. No mutation of this session, even on failure. */
    stagedTick(): WorldSession;
    /** Standalone session API retains fail-stop behavior. RealmRuntime uses stagedTick(). */
    tick(): ReadonlyMap<string, PlayerSnapshot>;
    inspection(connectionId: string): {
        state: PlayerSnapshot;
        intent: {
            sequence: number;
            dx: number;
            dz: number;
        };
        inputTick: number;
        options: {
            speed: number;
            ticksPerSecond: number;
            idleTimeoutTicks: number;
        };
    } | undefined;
    /** Detached last-good state for fault diagnostics; never used to resume a faulted session. */
    committedState(): ReadonlyMap<string, PlayerSnapshot>;
    leave(connectionId: string): boolean;
    snapshot(connectionId: string): PlayerSnapshot | undefined;
}
