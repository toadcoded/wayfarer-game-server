import {
  PROTOCOL_VERSION,
  type BootstrapResponse,
  type Envelope,
  type PlayerCommand,
  type Snapshot,
  type WorldEvent,
  parseEnvelope,
} from "../../../packages/protocol/src/index";
import { useGame, type RemotePlayer } from "./game-store";
import { freshQuietTithe, type QuietTithe, type TithePhase } from "./quests";

export type ConnectionStatus = "offline" | "connecting" | "connected" | "reconnecting" | "error";
export type NetworkState = { status: ConnectionStatus; roomId: string | null; selfId: string | null; lastServerSeq: number; error: string | null };
export type Transport = {
  connect: () => Promise<void>;
  send: (message: Envelope<PlayerCommand>) => void;
  close: () => void;
  onMessage: (handler: (message: Envelope<WorldEvent | Snapshot>) => void) => void;
  onStatus: (handler: (status: ConnectionStatus) => void) => void;
};

function questFromSnapshot(snapshot: Snapshot): QuietTithe {
  const base = freshQuietTithe();
  const phase = ["unseen", "seekWren", "collect", "bind", "light", "report", "complete"].includes(snapshot.quest?.phase ?? "") ? snapshot.quest!.phase as TithePhase : base.phase;
  return snapshot.quest ? { ...base, ...snapshot.quest, phase, version: 1 as const, offerings: { ...base.offerings, ...snapshot.quest.offerings } } : base;
}

function playersFromSnapshot(snapshot: Snapshot): RemotePlayer[] {
  return snapshot.players.filter((p) => p.playerId !== snapshot.self.playerId).map((p) => ({ playerId: p.playerId, displayName: p.displayName, x: p.position.x, y: p.position.y, lastServerSeq: snapshot.serverSeq }));
}

export function createFakeTransport(): Transport {
  let messageHandler: ((message: Envelope<WorldEvent | Snapshot>) => void) | null = null;
  let statusHandler: ((status: ConnectionStatus) => void) | null = null;
  let seq = 0;
  return {
    connect: async () => { statusHandler?.("connected"); messageHandler?.({ v: PROTOCOL_VERSION, kind: "snapshot", room: "reedhaven-01", seq: ++seq, payload: { roomId: "reedhaven-01", serverSeq: seq, worldRevision: "quiet-tithe-1", self: { playerId: "self", displayName: "You", position: { x: 18, y: 18 } }, players: [], quest: freshQuietTithe() } }); },
    send: (message) => {
      seq += 1;
      if (message.payload.name === "chat") messageHandler?.({ v: PROTOCOL_VERSION, kind: "event", room: message.room, seq, requestId: message.requestId, payload: { type: "chat", playerId: "self", displayName: "You", text: message.payload.text ?? "" } });
      else messageHandler?.({ v: PROTOCOL_VERSION, kind: "event", room: message.room, seq, requestId: message.requestId, payload: { type: "command-accepted", requestId: message.requestId ?? "", clientSeq: message.payload.clientSeq, serverSeq: seq } });
    },
    close: () => statusHandler?.("offline"), onMessage: (handler) => { messageHandler = handler; }, onStatus: (handler) => { statusHandler = handler; },
  };
}

export function createWebSocketTransport(url: string): Transport {
  let socket: WebSocket | null = null;
  let messageHandler: ((message: Envelope<WorldEvent | Snapshot>) => void) | null = null;
  let statusHandler: ((status: ConnectionStatus) => void) | null = null;
  let manuallyClosed = false;
  return {
    connect: () => new Promise((resolve, reject) => {
      manuallyClosed = false; statusHandler?.("connecting"); socket = new WebSocket(url);
      socket.onopen = () => { statusHandler?.("connected"); resolve(); };
      socket.onerror = () => { statusHandler?.("error"); reject(new Error("WebSocket connection failed")); };
      socket.onclose = () => { if (!manuallyClosed) statusHandler?.("reconnecting"); };
      socket.onmessage = (event) => { try { messageHandler?.(parseEnvelope(JSON.parse(event.data) as unknown) as Envelope<WorldEvent | Snapshot>); } catch { statusHandler?.("error"); } };
    }),
    send: (message) => { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message)); },
    close: () => { manuallyClosed = true; socket?.close(); }, onMessage: (handler) => { messageHandler = handler; }, onStatus: (handler) => { statusHandler = handler; },
  };
}

export class AshfenNetworkClient {
  private readonly listeners = new Set<(state: NetworkState) => void>();
  private state: NetworkState = { status: "offline", roomId: null, selfId: null, lastServerSeq: 0, error: null };
  private seq = 0;
  private readonly transport: Transport;
  constructor(transport: Transport) { this.transport = transport; transport.onStatus((status) => { this.update({ status, error: status === "error" ? "Connection failed" : null }); useGame.getState().setNetworkStatus(status); }); transport.onMessage((message) => this.handle(message)); }
  subscribe(listener: (state: NetworkState) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  getState() { return this.state; }
  async connect(roomId: string) { this.update({ status: "connecting", roomId }); await this.transport.connect(); }
  send(roomId: string, payload: Omit<PlayerCommand, "requestId" | "clientSeq">) { this.seq += 1; const requestId = `client-${this.seq}`; this.transport.send({ v: PROTOCOL_VERSION, kind: "command", room: roomId, seq: this.seq, requestId, payload: { ...payload, requestId, clientSeq: this.seq } }); }
  close() { this.transport.close(); }
  private handle(message: Envelope<WorldEvent | Snapshot>) {
    if ((this.state.roomId !== null && message.room !== this.state.roomId) || message.seq <= this.state.lastServerSeq) return;
    this.update({ lastServerSeq: message.seq, roomId: message.room });
    if (message.kind === "snapshot") { const snapshot = message.payload as Snapshot; this.update({ selfId: snapshot.self.playerId }); const st = useGame.getState(); st.setRemotePlayers(playersFromSnapshot(snapshot)); st.applyAuthoritativeQuest(questFromSnapshot(snapshot)); return; }
    const event = message.payload as WorldEvent; const st = useGame.getState();
    if (event.type === "player-joined") st.setRemotePlayers([...st.remotePlayers.filter((p) => p.playerId !== event.playerId), { playerId: event.playerId, displayName: event.displayName, x: event.position.x, y: event.position.y, lastServerSeq: message.seq }]);
    if (event.type === "player-left") st.setRemotePlayers(st.remotePlayers.filter((p) => p.playerId !== event.playerId));
    if (event.type === "player-moved") st.setRemotePlayers(st.remotePlayers.map((p) => p.playerId === event.playerId ? { ...p, x: event.position.x, y: event.position.y, lastServerSeq: message.seq } : p));
    if (event.type === "quest-transition" && event.playerId === this.state.selfId) st.applyAuthoritativeQuest({ ...st.quietTithe, phase: event.phase as QuietTithe["phase"] });
    if (event.type === "command-rejected") st.say(`Server rejected action: ${event.message}`);
  }
  private update(patch: Partial<NetworkState>) { this.state = { ...this.state, ...patch }; for (const listener of this.listeners) listener(this.state); }
}

export function bootstrapUrl(origin: string, roomId: string) { return `${origin}/api/v1/bootstrap?room=${encodeURIComponent(roomId)}`; }
export async function fetchBootstrap(origin: string, roomId: string): Promise<BootstrapResponse> { const response = await fetch(bootstrapUrl(origin, roomId)); if (!response.ok) throw new Error(`bootstrap failed: ${response.status}`); return response.json() as Promise<BootstrapResponse>; }
