import { type SkillId } from './skill-directory.js';
export declare const PRACTICE_COOLDOWN_TICKS = 100;
export declare const PRACTICE_XP = 1;
export declare const PRACTICE_RADIUS = 3;
export declare const PRACTICE_METHODS: {
    readonly attack: {
        readonly skill: "attack";
        readonly station: "dummy";
        readonly description: "Aim controlled strikes at the straw dummy";
    };
    readonly strength: {
        readonly skill: "strength";
        readonly station: "dummy";
        readonly description: "Push the weighted training post";
    };
    readonly defence: {
        readonly skill: "defence";
        readonly station: "dummy";
        readonly description: "Rehearse a shield block against the padded post";
    };
    readonly ranged: {
        readonly skill: "ranged";
        readonly station: "dummy";
        readonly description: "Aim tethered practice arrows at the straw target";
    };
    readonly magic: {
        readonly skill: "magic";
        readonly station: "altar";
        readonly description: "Trace a harmless light rune";
    };
    readonly hitpoints: {
        readonly skill: "hitpoints";
        readonly station: "course";
        readonly description: "Perform a gentle conditioning drill";
    };
    readonly prayer: {
        readonly skill: "prayer";
        readonly station: "altar";
        readonly description: "Reflect quietly at the practice shrine";
    };
    readonly woodcutting: {
        readonly skill: "woodcutting";
        readonly station: "bench";
        readonly description: "Rehearse axe strokes on a reusable practice log";
    };
    readonly mining: {
        readonly skill: "mining";
        readonly station: "bench";
        readonly description: "Tap the reusable training stone";
    };
    readonly fishing: {
        readonly skill: "fishing";
        readonly station: "pond";
        readonly description: "Rehearse casting with a hookless practice rod";
    };
    readonly agility: {
        readonly skill: "agility";
        readonly station: "course";
        readonly description: "Rehearse a balance-step drill";
    };
    readonly cooking: {
        readonly skill: "cooking";
        readonly station: "bench";
        readonly description: "Rehearse stirring an empty training pot";
    };
    readonly crafting: {
        readonly skill: "crafting";
        readonly station: "bench";
        readonly description: "Shape reusable practice clay";
    };
    readonly firemaking: {
        readonly skill: "firemaking";
        readonly station: "bench";
        readonly description: "Rehearse tinder preparation without lighting a fire";
    };
    readonly fletching: {
        readonly skill: "fletching";
        readonly station: "bench";
        readonly description: "Fit reusable blunt arrow parts";
    };
    readonly herblore: {
        readonly skill: "herblore";
        readonly station: "bench";
        readonly description: "Sort labelled inert herb samples";
    };
    readonly runecrafting: {
        readonly skill: "runecrafting";
        readonly station: "altar";
        readonly description: "Trace a practice rune on an inert tablet";
    };
    readonly slayer: {
        readonly skill: "slayer";
        readonly station: "dummy";
        readonly description: "Study a reusable creature-tracking card";
    };
    readonly smithing: {
        readonly skill: "smithing";
        readonly station: "bench";
        readonly description: "Tap a cold practice billet with a wooden mallet";
    };
    readonly thieving: {
        readonly skill: "thieving";
        readonly station: "bench";
        readonly description: "Rehearse opening an unlocked practice box";
    };
    readonly farming: {
        readonly skill: "farming";
        readonly station: "garden";
        readonly description: "Tend the demonstration planter";
    };
    readonly construction: {
        readonly skill: "construction";
        readonly station: "bench";
        readonly description: "Fit reusable wooden joints";
    };
    readonly hunter: {
        readonly skill: "hunter";
        readonly station: "garden";
        readonly description: "Rehearse a harmless empty trap frame";
    };
};
export declare function isPracticeSkill(x: unknown): x is SkillId;
export declare function checkedPracticeTick(x: unknown, max?: number): number;
