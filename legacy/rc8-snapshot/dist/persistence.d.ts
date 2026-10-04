import { type PersistentPlayerState } from './game-actions.js';
import type { XZ } from './navigation.js';
export interface PlayerSave {
    version: 1;
    position: XZ;
    gameplay: PersistentPlayerState | null;
}
export declare function checkedPlayerSave(value: unknown): PlayerSave;
export declare function encodePlayerSave(value: PlayerSave): string;
export declare function decodePlayerSave(text: string): PlayerSave;
export declare function copyPlayerSave(value: PlayerSave): PlayerSave;
