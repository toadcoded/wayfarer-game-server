/** Private rehearsal subprotocol; application compatibility is checked before any realm join. */
export declare const REALM_SUBPROTOCOL = "wayfarer.realm.v2";
export declare const REALM_CONTRACT: Readonly<{
    readonly protocolVersion: 2;
    readonly simulationRevision: 16;
    readonly worldSeed: 20260928;
    readonly generatorVersion: 1;
    readonly sceneRevision: 3;
    readonly coordinateSystem: "xz-y-up-metres";
    readonly tickMs: 50;
    readonly snapshotVersion: 1;
}>;
export type RealmContract = typeof REALM_CONTRACT;
export declare class CompatibilityError extends Error {
    readonly code: 'invalid_handshake' | 'incompatible_contract';
    constructor(code: 'invalid_handshake' | 'incompatible_contract');
}
export declare function encodeHello(): string;
export declare function decodeHello(text: string): RealmContract;
export declare function encodeWelcome(id: string): string;
export declare function decodeWelcome(text: string): {
    id: string;
    contract: RealmContract;
};
export declare function compatibilityMessage(reason: string): string;
