import { useEffect } from "react";
import { GameCanvas } from "./GameCanvas";
import { Hud } from "./Hud";
import { useGame } from "@/lib/ashfen/game-store";
import { AshfenNetworkClient, createFakeTransport, createWebSocketTransport } from "@/lib/ashfen/network";

export function GameShell() {
  const entered = useGame((s) => s.entered);

  useEffect(() => {
    const mode = new URLSearchParams(window.location.search).get("multiplayer");
    if (mode !== "local" && mode !== "ws") return;
    const transport = mode === "ws"
      ? createWebSocketTransport(`${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8787/ws/v1/rooms/reedhaven-01?player_id=browser&display_name=Wayfarer`)
      : createFakeTransport();
    const client = new AshfenNetworkClient(transport);
    const unsubscribe = client.subscribe((state) => useGame.getState().setNetworkStatus(state.status));
    void client.connect("reedhaven-01");
    return () => { unsubscribe(); client.close(); useGame.getState().setNetworkStatus("offline"); };
  }, []);

  return (
    <div className="ashfen-root relative h-dvh w-full overflow-hidden bg-background">
      <GameCanvas />
      <Hud />
      {!entered ? (
        <button
          type="button"
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 px-6 text-center backdrop-blur-[2px]"
          onClick={() => useGame.getState().setEntered()}
        >
          <p className="font-display text-4xl tracking-tight sm:text-5xl">Keep the Codex</p>
          <p className="mt-2 text-sm uppercase tracking-[0.22em] text-muted-foreground">
            Reedhaven · Ashfen
          </p>
          <p className="mt-6 max-w-md text-sm text-muted-foreground">
            WASD or arrows to walk. Click a tile to path. Scroll, pinch, or −/+ to zoom — realm view
            fits the square; close view is inward. Space or E to work a node. Vapor Filter marks
            honest ground.
          </p>
          <p className="mt-8 font-display text-base text-accent">Enter the square</p>
        </button>
      ) : null}
    </div>
  );
}
