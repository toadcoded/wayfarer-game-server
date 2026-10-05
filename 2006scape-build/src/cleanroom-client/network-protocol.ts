import type {
  GardenAuthorityError,
  GardenAuthorityPort,
  GardenIntent,
  GardenWorldSnapshot,
} from "./welcome-garden/welcome-garden-slice";
import type { BankViewModel } from "./bank-system";

export const SESSION_PROTOCOL_VERSION = "session/v1" as const;
export const MAX_SESSION_FRAME_BYTES = 64 * 1024;

type WireEnvelope = Readonly<{ version: typeof SESSION_PROTOCOL_VERSION; type: string; requestId: string; payload: unknown }>;
type SessionSnapshotPayload = Readonly<{
  sessionId: string;
  playerId: string;
  worldSpace: string;
  levelId: string;
  tile: { x: number; y: number; levelId: string };
  facing: string;
  locationRevision: number;
  transitionRevision: number;
  graphRevision: number;
  inventory: Record<string, number>;
  resourceCooldowns: Record<string, number>;
  bank: BankViewModel;
}>;
type HarvestedPayload = Readonly<{ itemId: string; quantity: number; inventory: Record<string, number>; resourceCooldowns: Record<string, number> }>;
type ErrorPayload = Readonly<{ code: string; message: string }>;

type WebSocketLike = {
  readonly readyState: number;
  onopen: ((event?: unknown) => void) | null;
  onmessage: ((event: { data: string | ArrayBuffer }) => void) | null;
  onerror: ((event?: unknown) => void) | null;
  onclose: ((event?: unknown) => void) | null;
  send(data: string): void;
  close(): void;
};

export type WebSocketFactory = (url: string) => WebSocketLike;

function defaultSocketFactory(url: string): WebSocketLike {
  if (typeof WebSocket === "undefined") throw new Error("WebSocket is unavailable in this runtime.");
  return new WebSocket(url) as unknown as WebSocketLike;
}

function assertEnvelope(value: unknown): WireEnvelope {
  if (!value || typeof value !== "object") throw new Error("Protocol frame must be an object.");
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort().join(",");
  if (keys !== "payload,requestId,type,version") throw new Error("Protocol frame contains unknown or missing fields.");
  if (record.version !== SESSION_PROTOCOL_VERSION || typeof record.type !== "string" || typeof record.requestId !== "string") throw new Error("Protocol frame header is invalid.");
  return record as WireEnvelope;
}

function frameBytes(frame: string): number { return new TextEncoder().encode(frame).byteLength; }

function facingRadians(facing: string): number {
  if (facing === "north") return Math.PI;
  if (facing === "east") return Math.PI / 2;
  if (facing === "west") return -Math.PI / 2;
  return 0;
}

function directionForMove(from: GardenWorldSnapshot["player"]["tile"], to: GardenWorldSnapshot["player"]["tile"]): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === -1) return "north";
  if (dx === 1 && dy === 0) return "east";
  if (dx === 0 && dy === 1) return "south";
  if (dx === -1 && dy === 0) return "west";
  throw new Error("The network protocol only accepts one-cardinal-step movement.");
}

function authorityError(requestId: string, payload: ErrorPayload): GardenAuthorityError {
  return { code: payload.code as GardenAuthorityError["code"], message: payload.message, requestId };
}

export class WebSocketGardenAuthority implements GardenAuthorityPort {
  private readonly url: string;
  private readonly seed: GardenWorldSnapshot;
  private readonly socketFactory: WebSocketFactory;
  private socket?: WebSocketLike;
  private connected?: Promise<void>;
  private snapshot?: GardenWorldSnapshot;
  private requestCounter = 0;

  public constructor(url: string, seed: GardenWorldSnapshot, socketFactory: WebSocketFactory = defaultSocketFactory) {
    this.url = url;
    this.seed = seed;
    this.socketFactory = socketFactory;
  }

  public async load(): Promise<GardenWorldSnapshot> {
    await this.connect();
    if (!this.snapshot) this.snapshot = await this.requestSnapshot("admission.request", { ticket: "local-dev-ticket", clientBuild: "cleanroom-client-v1" });
    return this.snapshot;
  }

  public async submit(intent: GardenIntent): Promise<GardenWorldSnapshot> {
    await this.connect();
    if (!this.snapshot) await this.load();
    if (intent.type === "resource.harvest") {
      this.snapshot = await this.requestSnapshot("resource.harvest", { nodeId: intent.nodeId, tool: intent.tool, skillLevel: intent.skillLevel, nowSeconds: intent.nowSeconds }, intent.requestId);
      return this.snapshot;
    }
    if (intent.type === "bank.tab.select") {
      this.snapshot = await this.requestSnapshot("bank.tab.select", { tab: intent.tab }, intent.requestId);
      return this.snapshot;
    }
    if (intent.type === "bank.deposit" || intent.type === "bank.withdraw") {
      this.snapshot = await this.requestSnapshot(intent.type, { itemId: intent.itemId, quantity: intent.quantity, tab: intent.tab ?? this.snapshot!.bank.activeTab }, intent.requestId);
      return this.snapshot;
    }
    if (intent.type !== "move.request") throw { code: "UNKNOWN", message: "The Go session gateway does not expose this intent yet.", requestId: intent.requestId } satisfies GardenAuthorityError;
    const direction = directionForMove(this.snapshot!.player.tile, intent.destination);
    this.snapshot = await this.requestSnapshot("move.request", {
      expectedLocationRevision: this.snapshot!.revision,
      knownGraphRevision: 1,
      direction,
    }, intent.requestId);
    return this.snapshot;
  }

  public close(): void { this.socket?.close(); this.socket = undefined; this.connected = undefined; }

  private async connect(): Promise<void> {
    if (this.connected) return this.connected;
    this.connected = new Promise<void>((resolve, reject) => {
      const socket = this.socketFactory(this.url);
      this.socket = socket;
      socket.onopen = () => resolve();
      socket.onerror = () => reject(new Error("WebSocket session connection failed."));
      socket.onclose = () => { this.connected = undefined; };
    });
    try { await this.connected; } catch (error) { this.connected = undefined; throw error; }
  }

  private async requestSnapshot(type: string, payload: unknown, requestId = this.nextRequestId()): Promise<GardenWorldSnapshot> {
    const socket = this.socket;
    if (!socket) throw new Error("WebSocket session is not connected.");
    const frame = JSON.stringify({ version: SESSION_PROTOCOL_VERSION, type, requestId, payload });
    if (frameBytes(frame) > MAX_SESSION_FRAME_BYTES) throw new Error("WebSocket frame exceeds protocol limit.");
    const response = await new Promise<WireEnvelope>((resolve, reject) => {
      const previous = socket.onmessage;
      const timeout = setTimeout(() => { socket.onmessage = previous; reject(new Error("WebSocket request timed out.")); }, 10_000);
      socket.onmessage = (event) => {
        try {
          const data = typeof event.data === "string" ? event.data : new TextDecoder().decode(event.data);
          if (frameBytes(data) > MAX_SESSION_FRAME_BYTES) throw new Error("Received frame exceeds protocol limit.");
          const envelope = assertEnvelope(JSON.parse(data));
          if (envelope.requestId !== requestId) return;
          clearTimeout(timeout);
          socket.onmessage = previous;
          resolve(envelope);
        } catch (error) { clearTimeout(timeout); socket.onmessage = previous; reject(error); }
      };
      socket.send(frame);
    });
    if (response.type === "error") throw authorityError(response.requestId, response.payload as ErrorPayload);
    if (response.type === "resource.harvested") {
      const previous = this.snapshot ?? this.seed;
      const harvested = response.payload as HarvestedPayload;
      this.snapshot = { ...previous, source: "online", inventory: harvested.inventory, resourceCooldowns: harvested.resourceCooldowns };
      return this.snapshot;
    }
    if (response.type !== "admission.accepted" && response.type !== "snapshot") throw new Error(`Unexpected gateway response: ${response.type}`);
    return this.applyServerSnapshot(response.payload as SessionSnapshotPayload);
  }

  private applyServerSnapshot(payload: SessionSnapshotPayload): GardenWorldSnapshot {
    const previous = this.snapshot ?? this.seed;
    this.snapshot = {
      ...previous,
      source: "online",
      revision: payload.locationRevision,
      worldSpace: "sable-fen",
      levelId: "welcome-garden-ground",
      player: {
        ...previous.player,
        playerId: payload.playerId,
        tile: { x: payload.tile.x, y: payload.tile.y },
        facingRadians: facingRadians(payload.facing),
        motion: "idle",
        speed01: 0,
      },
      inventory: payload.inventory,
      resourceCooldowns: payload.resourceCooldowns,
      bank: payload.bank,
      portal: { ...previous.portal },
    };
    return this.snapshot;
  }

  private nextRequestId(): string { this.requestCounter += 1; return `ws-${this.requestCounter}`; }
}
