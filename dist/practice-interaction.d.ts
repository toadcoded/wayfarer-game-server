import type { SkillId } from './skill-directory.js';
export interface PracticeChallenge {
    token: string;
    skill: SkillId;
    reward: 'practice' | 'gathering';
    step: number;
    target: number;
    readyTick: number;
    expiresTick: number;
}
export declare const PRACTICE_STEPS = 3, PRACTICE_ATTEMPT_TICKS = 300;
export declare const PRACTICE_VERBS: Record<SkillId, readonly [string, string, string]>;
export declare function beginPractice(skill: SkillId, id: string, tick: number, sequence: number, reward?: 'practice' | 'gathering'): PracticeChallenge;
export declare function advancePractice(c: PracticeChallenge, tick: number): PracticeChallenge;
export declare function checkedPracticeChallenge(x: unknown, tick: number): PracticeChallenge;
export declare function isPracticeResponse(x: unknown): x is string;
export declare function practiceResponse(c: PracticeChallenge, target: number): string;
