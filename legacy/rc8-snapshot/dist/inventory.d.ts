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
}>;
export type ItemId = keyof typeof ITEMS;
export interface Inventory {
    slots: (ItemId | null)[];
    weapon: ItemId | null;
    rewardClaimed: boolean;
}
export declare const isItem: (v: unknown) => v is ItemId;
export declare const freshInventory: () => Inventory;
export declare const copyInventory: (v: Inventory) => Inventory;
export declare function checkedInventory(v: unknown): Inventory;
export declare function grantReward(v: Inventory, item: ItemId): Inventory | undefined;
export declare function equipItem(v: Inventory, item: ItemId): Inventory | undefined;
export declare function unequipItem(v: Inventory): Inventory | undefined;
