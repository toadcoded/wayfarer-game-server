export type MessagePriority = 'critical' | 'state' | 'transient';
export type SendDecision = 'send' | 'drop' | 'close';
/** Pure outgoing queue policy. Host must inspect the real socket before EVERY send. */
export class SocketFlowGate {
  readonly softBytes: number;
  readonly hardBytes: number;
  constructor(softBytes = 65536, hardBytes = 524288) {
    if (!Number.isSafeInteger(softBytes) || !Number.isSafeInteger(hardBytes) || softBytes < 1 || hardBytes <= softBytes || hardBytes > 16 * 1024 * 1024) throw new RangeError('Invalid queue limits');
    this.softBytes = softBytes;
    this.hardBytes = hardBytes;
  }
  decide(bufferedBytes: number, messageBytes: number, priority: MessagePriority): SendDecision {
    if (![bufferedBytes, messageBytes].every(n => Number.isSafeInteger(n) && n >= 0) || !['critical', 'state', 'transient'].includes(priority)) throw new RangeError('Invalid send request');
    const projected = bufferedBytes + messageBytes;
    if (projected >= this.hardBytes) return 'close';
    if (priority === 'transient' && projected >= this.softBytes) return 'drop';
    return 'send';
  }
}
