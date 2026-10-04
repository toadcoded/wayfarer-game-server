/** Independent input sources prevent one release from cancelling another hold. */
export class DirectionInput {
    keys = new Map();
    pointers = new Map();
    keyDown(key, code) {
        const direction = key.startsWith('Arrow') ? key : { KeyW: 'ArrowUp', KeyA: 'ArrowLeft', KeyS: 'ArrowDown', KeyD: 'ArrowRight' }[code ?? ''];
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(direction ?? ''))
            return false;
        this.keys.set(code || key, direction);
        return true;
    }
    keyUp(key, code) { this.keys.delete(code || key); }
    pointerDown(id, direction) { this.pointers.set(id, direction); }
    pointerUp(id) { this.pointers.delete(id); }
    has(direction) { return [...this.keys.values(), ...this.pointers.values()].includes(direction); }
    clear() { this.keys.clear(); this.pointers.clear(); }
}
