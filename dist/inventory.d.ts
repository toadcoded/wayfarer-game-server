/** Server-owned pack. Item IDs are commands; quantities and grants never come from clients. */
export declare const ITEMS: Readonly<{
    reed_blade: Readonly<{
        name: "Reed blade";
        color: "#bfe097";
    }>;
    ash_staff: Readonly<{
        name: "Ash staff";
        color: "#ba98e8";
    }>;
    granite_maul: Readonly<{
        name: "Granite maul";
        color: "#b6c1ce";
    }>;
    steel_warhammer: Readonly<{
        name: "Steel warhammer";
        color: "#d7dee8";
    }>;
    steel_battleaxe: Readonly<{
        name: "Steel battleaxe";
        color: "#d7dee8";
    }>;
    steel_dagger: Readonly<{
        name: "Steel dagger";
        color: "#c8d6e5";
    }>;
    steel_sword: Readonly<{
        name: "Steel sword";
        color: "#eff6ff";
    }>;
    steel_rapier: Readonly<{
        name: "Steel rapier";
        color: "#dbeafe";
    }>;
}>;
export type ItemId = keyof typeof ITEMS;
export interface Inventory {
    slots: (ItemId | null)[];
    weapon: ItemId | null;
    rewardClaimed: boolean;
    lootCount?: number;
}
export declare const isItem: (v: unknown) => v is ItemId;
export declare const freshInventory: () => Inventory;
export declare const copyInventory: (v: Inventory) => Inventory;
export declare function checkedInventory(v: unknown): Inventory;
export declare function grantReward(v: Inventory, item: ItemId): Inventory | undefined;
export declare function equipItem(v: Inventory, item: ItemId): Inventory | undefined;
export declare function unequipItem(v: Inventory): Inventory | undefined;
export declare function grantLoot(v: Inventory, item: ItemId): Inventory | undefined;
