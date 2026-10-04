export interface ToolAction {
    id: string;
    label: string;
    tooltip: string;
    key?: string;
    unavailable?: () => string | undefined;
    run: () => void;
}
export type ToolResult = {
    ok: true;
} | {
    ok: false;
    reason: string;
};
/** Local action registry: the same gate runs for toolbar and keyboard dispatch. */
export declare class Multitool {
    readonly actions: readonly Readonly<ToolAction>[];
    constructor(actions: readonly ToolAction[]);
    reason(id: string): string | undefined;
    execute(id: string): ToolResult;
    key(key: string): ToolResult;
}
/** Buttons, titles, disabled explanations and shortcuts share a single registry. */
export declare function mountToolbar(registry: Multitool, container: HTMLElement, report?: (result: ToolResult) => void): {
    refresh: () => void;
    dispose(): void;
};
