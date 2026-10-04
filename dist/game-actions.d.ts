import { type Fighter, type Encounter } from './encounter.js';
import { type Inventory, type ItemId } from './inventory.js';
import type { Point } from './world.js';
import { type Progression, type TrainingMode } from './progression.js';
import { type PracticeChallenge } from './practice-interaction.js';
import type { SkillId } from './skill-directory.js';
import { type Skilling, type SkillCommand } from './skilling.js';
export declare const SKINS: readonly ["adventurer", "elder", "traveler", "villager", "seraphine", "vector"];
export type Skin = typeof SKINS[number];
export type Action = {
    kind: 'action';
    sequence: number;
    action: 'practice-step';
    value: string;
} | {
    kind: 'action';
    sequence: number;
    action: 'practice';
    value: SkillId;
} | {
    kind: 'action';
    sequence: number;
    action: 'skilling';
    value: SkillCommand;
} | {
    kind: 'action';
    sequence: number;
    action: 'appearance';
    value: Skin;
} | {
    kind: 'action';
    sequence: number;
    action: 'beacon';
    value: 'light';
} | {
    kind: 'action';
    sequence: number;
    action: 'quest';
    value: 'accept' | 'gather' | 'submit';
} | {
    kind: 'action';
    sequence: number;
    action: 'claim' | 'equip';
    value: ItemId;
} | {
    kind: 'action';
    sequence: number;
    action: 'unequip';
    value: 'weapon';
} | {
    kind: 'action';
    sequence: number;
    action: 'combat';
    value: 'attack' | 'guard';
} | {
    kind: 'action';
    sequence: number;
    action: 'training';
    value: TrainingMode;
};
export declare const RESULT_TEXT: {
    readonly practice_started: "Follow the three marked actions. XP is awarded only on completion.";
    readonly practice_step: "Good action. Follow the next marked target.";
    readonly practice_early: "Let the action settle before responding.";
    readonly practice_miss: "The drill slipped. No XP awarded; try again after recovery.";
    readonly practice_stale: "That drill response is no longer current.";
    readonly practice_busy: "Finish or cancel the current drill first.";
    readonly practice_cancelled: "Drill cancelled. No XP awarded.";
    readonly practice_done: "Practice complete. +1 XP to the chosen skill; no items awarded.";
    readonly practice_wait: "Practice recovery: one action every five seconds across all skills.";
    readonly practice_full: "This skill has reached its XP storage cap.";
    readonly training_changed: "Training changed. Style XP goes to the selected skill; damage also trains Hitpoints.";
    readonly training_incompatible: "Choose a training mode compatible with your weapon.";
    readonly equipment_requirements: "You do not meet the weapon requirements.";
    readonly attack_hit: "Hit the Lantern Warden.";
    readonly attack_cooldown: "Your weapon is recovering.";
    readonly guarding: "Guard raised for 0.8 seconds.";
    readonly guard_cooldown: "Guard is recovering.";
    readonly recovering: "Recovering — no items are lost.";
    readonly warden_resting: "Warden resets in eight seconds.";
    readonly warden_defeated: "Warden cleared! Contributors gain a session victory.";
    readonly item_claimed: "Reward added to your pack.";
    readonly item_equipped: "Weapon equipped and shared with nearby players.";
    readonly item_unequipped: "Weapon returned to your pack.";
    readonly item_unavailable: "That item is not in your pack.";
    readonly reward_unavailable: "Complete Quiet Tithe, then claim one reward from Halden.";
    readonly equipped: "Appearance shared with the realm.";
    readonly lit: "You lit the landing beacon.";
    readonly already_lit: "The beacon is already lit.";
    readonly out_of_range: "Move within 3 metres of the target.";
    readonly quest_accepted: "Halden: Bring me three bundles from the far reed patch.";
    readonly quest_unavailable: "This quest is already accepted or completed.";
    readonly quest_not_active: "Speak to Halden before gathering reeds.";
    readonly gathered: "Reed bundle gathered.";
    readonly gather_wait: "Give the reeds a moment before gathering again.";
    readonly patch_empty: "The shared reed patch is regrowing.";
    readonly inventory_full: "You have all three bundles. Return to Halden.";
    readonly requirements_not_met: "Halden needs three reed bundles.";
    readonly quest_completed: "Quiet Tithe completed. You received one offering token.";
};
export declare const SKILL_RESULT_TEXT: {
    readonly skill_range: "Gather within 8 metres of the far landing. Bank/craft within 3 metres of Halden.";
    readonly skill_gathered: "Resource gathered. +25 profession XP.";
    readonly skill_wait: "Your gathering tool is recovering.";
    readonly skill_pack_full: "Your 12-unit resource pack is full. Bank at Halden.";
    readonly skill_banked: "Resource pack deposited in your personal bank.";
    readonly skill_bank_full: "Bank resource limit reached.";
    readonly skill_upgraded: "Next tool tier crafted! Resource yield increased.";
    readonly skill_requirements: "Check the next tool recipe: profession levels, banked materials and Warden essence are required.";
    readonly skill_max_tool: "Masterwork tools are already unlocked.";
};
export type Result = {
    sequence: number;
    code: keyof typeof RESULT_TEXT | keyof typeof SKILL_RESULT_TEXT;
};
export interface QuestState {
    status: 'available' | 'active' | 'completed';
    reeds: number;
    tithes: number;
    gatherReadyTick: number;
}
export interface PersistentQuestState {
    status: 'available' | 'active' | 'completed';
    reeds: number;
    tithes: number;
    gatherCooldownTicks: number;
}
export interface PersistentPlayerState {
    version: 5;
    practiceReadyTick: number;
    skin: Skin;
    quest: PersistentQuestState;
    inventory: Inventory;
    progression: Progression;
    skilling: Skilling;
}
export interface GameState {
    kind: 'game';
    revision: number;
    tick: number;
    beacon: {
        position: Point;
        lit: boolean;
    };
    camp: Point;
    patch: {
        stock: number;
        respawnTick: number;
    };
    quest: QuestState | null;
    inventory: Inventory | null;
    fighter: Fighter | null;
    progression: Progression | null;
    skilling: Skilling | null;
    practiceReadyTick: number | null;
    practiceChallenge: PracticeChallenge | null;
    encounter: Encounter;
    players: {
        id: string;
        skin: Skin;
        weapon: ItemId | null;
    }[];
    result: Result | null;
}
export declare function checkedPersistentPlayerState(x: unknown): PersistentPlayerState;
export declare const freshPersistentPlayerState: () => PersistentPlayerState;
export declare function decodeAction(text: string): Action;
export declare function decodeGameState(text: string): GameState;
/** All gameplay transitions are staged with movement by RealmRuntime. */
export declare class GameActions {
    private players;
    private protectedCombat;
    private lit;
    private revision;
    private tick;
    private stock;
    private respawnTick;
    private encounter;
    private readonly beacon;
    private readonly camp;
    constructor(beacon: Point, camp?: Point);
    join(connection: string, id: string, persisted?: PersistentPlayerState, protectedCombat?: boolean): void;
    leave(connection: string): void;
    receive(connection: string, text: string): boolean;
    stagedCommit(positionFor: (connection: string) => Point | undefined): GameActions;
    inspection(): {
        encounter: {
            hp: number;
            strikeAt: number;
            respawnAt: number;
            round: number;
        };
        revision: number;
        tick: number;
        beacon: {
            position: {
                x: number;
                y: number;
                z: number;
            };
            lit: boolean;
        };
        camp: {
            x: number;
            y: number;
            z: number;
        };
        patch: {
            stock: number;
            respawnTick: number;
        };
        players: {
            id: string;
            skin: "adventurer" | "seraphine" | "elder" | "traveler" | "villager" | "vector";
            sequence: number;
            pending: Action[];
            result: Result | null;
            quest: QuestState;
            inventory: Inventory;
            fighter: Fighter;
            progression: Progression;
            skilling: Skilling;
            practiceReadyTick: number;
            practiceChallenge: PracticeChallenge | null;
        }[];
    };
    persistentState(connection: string): PersistentPlayerState | undefined;
    validate(expectedIds: readonly string[]): void;
    commit(positionFor: (connection: string) => Point | undefined): void;
    snapshot(connection: string, visible: readonly string[]): GameState;
}
