/** Independent input sources prevent one release from cancelling another hold. */
export declare class DirectionInput {
    private keys;
    private pointers;
    keyDown(key: string, code?: string): boolean;
    keyUp(key: string, code?: string): void;
    pointerDown(id: number, direction: string): void;
    pointerUp(id: number): void;
    has(direction: string): boolean;
    clear(): void;
}
