export declare function realmHeartbeat(connected: boolean, ageMs: number, hidden?: boolean, hasSnapshot?: boolean): {
    readonly state: "paused";
    readonly text: "Realm heartbeat · page resting";
} | {
    readonly state: "offline";
    readonly text: "Realm heartbeat · offline";
} | {
    readonly state: "waiting";
    readonly text: "Realm heartbeat · awaiting first snapshot";
} | {
    readonly state: "lost";
    readonly text: "Realm heartbeat · updates lost";
} | {
    readonly state: "waiting";
    readonly text: "Realm heartbeat · waiting for server";
} | {
    readonly state: "live";
    readonly text: string;
};
