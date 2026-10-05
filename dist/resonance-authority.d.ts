import { type ResonanceEffectId, type ResonanceNodeId } from './resonance-codex.js';
export declare const RESONANCE_COOLDOWN_TICKS: number;
export declare const RESONANCE_MAX_CASTS = 1000000;
export interface ResonanceState {
    readyTick: number;
    activeEffect: ResonanceEffectId | null;
    activeUntilTick: number;
    lastChord: ResonanceNodeId[];
    casts: number;
}
export interface PersistentResonanceState {
    cooldownTicks: number;
    casts: number;
}
export declare const freshResonanceState: () => ResonanceState;
export declare function checkedPersistentResonance(value: unknown): PersistentResonanceState;
export declare function checkedResonanceState(value: unknown, tick: number): ResonanceState;
export declare function restoreResonance(saved: PersistentResonanceState, tick: number): ResonanceState;
export declare function persistResonance(state: ResonanceState, tick: number): PersistentResonanceState;
export declare function expireResonance(state: ResonanceState, tick: number): boolean;
export declare function castResonance(state: ResonanceState, value: string, tick: number): {
    ok: false;
    reason: "cooldown";
    chord?: never;
    durationTicks?: never;
} | {
    ok: false;
    reason: "cap";
    chord?: never;
    durationTicks?: never;
} | {
    ok: true;
    chord: import("./resonance-codex.js").ResonanceChord;
    durationTicks: number;
    reason?: never;
};
export declare function consumeResonance(state: ResonanceState, effect: ResonanceEffectId, tick: number): boolean;
export declare const resonanceEffectForSkill: (skill: string) => ResonanceEffectId | undefined;
