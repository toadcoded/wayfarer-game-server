import { LocalGardenDemoAuthority } from "./welcome-garden/welcome-garden-slice";
import { WebSocketGardenAuthority } from "./network-protocol";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function fakeSocket() {
  const socket = {
    readyState: 1,
    onopen: null as ((event?: unknown) => void) | null,
    onmessage: null as ((event: { data: string | ArrayBuffer }) => void) | null,
    onerror: null as ((event?: unknown) => void) | null,
    onclose: null as ((event?: unknown) => void) | null,
    send(frame: string) {
      const request = JSON.parse(frame) as { requestId: string; type: string };
      const payload = request.type === "admission.request"
        ? { sessionId: "session-test", playerId: "network-player", worldSpace: "copper-lantern-realm-01", levelId: "welcome-garden-ground", tile: { x: 6, y: 8, levelId: "welcome-garden-ground" }, facing: "south", locationRevision: 1, transitionRevision: 0, graphRevision: 1 }
        : { sessionId: "session-test", playerId: "network-player", worldSpace: "copper-lantern-realm-01", levelId: "welcome-garden-ground", tile: { x: 7, y: 8, levelId: "welcome-garden-ground" }, facing: "east", locationRevision: 2, transitionRevision: 0, graphRevision: 1 };
      const response = JSON.stringify({ version: "session/v1", type: request.type === "admission.request" ? "admission.accepted" : "snapshot", requestId: request.requestId, payload });
      queueMicrotask(() => socket.onmessage?.({ data: response }));
    },
    close() { socket.onclose?.(); },
  };
  queueMicrotask(() => socket.onopen?.());
  return socket;
}

async function main(): Promise<void> {
  const seed = await new LocalGardenDemoAuthority("seed-player").load();
  const authority = new WebSocketGardenAuthority("ws://localhost/session/v1", seed, () => fakeSocket());
  const admitted = await authority.load();
  assert(admitted.source === "online", "admission marks the snapshot online");
  assert(admitted.player.playerId === "network-player", "server identity replaces the local seed identity");
  const moved = await authority.submit({ type: "move.request", requestId: "move-1", destination: { x: 7, y: 8 } });
  assert(moved.player.tile.x === 7 && moved.player.tile.y === 8, "server snapshot reconciles movement");
  assert(moved.revision === 2, "server revision is preserved");
  authority.close();
  console.log("network-protocol: all assertions passed");
}

void main();
