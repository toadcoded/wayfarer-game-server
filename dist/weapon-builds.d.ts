import type { ItemId } from './inventory.js';
import { type Progression, type Skill, type TrainingMode } from './progression.js';
interface Build {
    tier: number;
    style: 'melee' | 'magic';
    requirements: Readonly<Partial<Record<Skill, number>>>;
    accuracy: number;
    modes: readonly TrainingMode[];
}
export declare const WEAPON_BUILDS: Readonly<Record<ItemId | 'unarmed', Build>>;
export declare const canEquip: (p: Progression, item: ItemId) => boolean;
export declare const canTrain: (item: ItemId | null, mode: TrainingMode) => boolean;
export {};
