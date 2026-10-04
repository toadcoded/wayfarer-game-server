import { type Inventory } from './inventory.js';
import type { Point } from './world.js';
import { type Resource } from './skilling.js';
export interface XamView {
    kind: 'xam';
    id: string;
    name: 'Xam';
    position: Point;
    phase: string;
    totalXp: number;
    totalLevel: number;
    skills: {
        id: string;
        level: number;
        xp: number;
    }[];
    inventory: Inventory;
    pack: Record<Resource, number>;
    bank: Record<Resource, number>;
    protected: true;
    untouchable: true;
    autoRetaliate: false;
    collision: 'nonblocking';
    armor: 'legendary_holographic_rustic';
    mainHand: 'diamond_scythe';
    offHand: 'gilded_secateurs';
    examine: string;
}
export declare function checkedXamView(value: unknown): XamView;
