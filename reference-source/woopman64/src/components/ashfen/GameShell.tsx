import { GameCanvas } from "./GameCanvas";
import { Realm3D } from "./Realm3D";
import { Hud } from "./Hud";
import { useGame } from "@/lib/ashfen/game-store";

export function GameShell() {
  const entered = useGame((s) => s.entered);
  const viewMode = useGame((s) => s.viewMode);

  return (
    <div className="ashfen-root relative h-dvh w-full overflow-hidden bg-background">
      {viewMode === "3d" ? <Realm3D /> : <GameCanvas />}
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
            Third-person 3D. WASD walks a human stride that eases in and out.
            The Quiet Tithe is overdue — speak to Keepmaster Halden, walk the four
            trails, bind them with Toller, and light the square. Five landmarks
            mark the reed: Observatory, Mire Garden, Cinder Spire, Far Water, and
            the North Star Beacon. Reed blade, ash bow, or ember wand. Scroll zooms.
            Space or E to talk, gather, or light. Switch to top-down from the HUD.
          </p>
          <p className="mt-8 font-display text-base text-accent">Enter the square</p>
        </button>
      ) : null}
    </div>
  );
}
