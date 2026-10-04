export declare const HUD_TABS: readonly ["practice", "combat", "gathering", "quest", "inventory", "settings"];
export type HudTab = typeof HUD_TABS[number];
export declare const isHudTab: (x: unknown) => x is HudTab;
export declare function initRealmHud(doc?: Document): {
    choose: (value: unknown) => void;
    readonly state: {
        tab: "gathering" | "practice" | "quest" | "combat" | "inventory" | "settings";
        compact: boolean;
        size: string;
        height: number;
        visual: boolean;
        living: boolean;
    };
};
