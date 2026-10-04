export type MessagePriority = 'critical' | 'state' | 'transient';
export type SendDecision = 'send' | 'drop' | 'close';
/** Pure outgoing queue policy. Host must inspect the real socket before EVERY send. */
export declare class SocketFlowGate {
    readonly softBytes: number;
    readonly hardBytes: number;
    constructor(softBytes?: number, hardBytes?: number);
    decide(bufferedBytes: number, messageBytes: number, priority: MessagePriority): SendDecision;
}
