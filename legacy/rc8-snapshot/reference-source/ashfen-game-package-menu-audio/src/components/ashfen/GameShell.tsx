import { useEffect, useRef } from "react";
import { GameCanvas } from "./GameCanvas";
import { Hud } from "./Hud";
import { useGame } from "@/lib/ashfen/game-store";
import { AshfenNetworkClient, createFakeTransport, createWebSocketTransport } from "@/lib/ashfen/network";
import { AudioController } from "@/lib/ashfen/audio";
import { SOUNDTRACKS, type SoundtrackId } from "@/lib/ashfen/settings";

export function GameShell() {
  const entered = useGame((s) => s.entered);
  const audio = useGame((s) => s.hud.audio);
  const audioRef = useRef<AudioController | null>(null);

  if (!audioRef.current) audioRef.current = new AudioController(audio);

  useEffect(() => {
    audioRef.current?.setPreferences(audio);
  }, [audio]);

  useEffect(() => () => audioRef.current?.dispose(), []);

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
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-auto bg-background/80 px-6 py-8 text-center backdrop-blur-[2px]">
          <p className="font-display text-4xl tracking-tight sm:text-5xl">Keep the Codex</p>
          <p className="mt-2 text-sm uppercase tracking-[0.22em] text-muted-foreground">
            Reedhaven · Ashfen
          </p>
          <p className="mt-6 max-w-md text-sm text-muted-foreground">
            WASD or arrows to walk. Click a tile to path. Scroll, pinch, or −/+ to zoom — realm view
            fits the square; close view is inward. Space or E to work a node. Vapor Filter marks
            honest ground.
          </p>
          <div className="mt-6 w-full max-w-sm rounded-md bg-background/80 p-3 text-left shadow-[var(--shadow-border)]">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-base">Sound</p>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Mute
                <input
                  type="checkbox"
                  checked={audio.muted}
                  onChange={(e) => useGame.getState().setPreference({ audio: { muted: e.target.checked } })}
                />
              </label>
            </div>
            <MenuVolume label="Master" value={audio.masterVolume} onChange={(value) => useGame.getState().setPreference({ audio: { masterVolume: value } })} />
            <MenuVolume label="Music" value={audio.musicVolume} onChange={(value) => useGame.getState().setPreference({ audio: { musicVolume: value } })} />
            <label className="mt-2 flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Track</span>
              <select
                className="rounded border border-border bg-elevated px-2 py-1 text-xs"
                value={audio.soundtrack}
                aria-label="Background music track"
                onChange={(e) => useGame.getState().setPreference({ audio: { soundtrack: e.target.value as SoundtrackId } })}
              >
                {SOUNDTRACKS.map((track) => <option key={track} value={track}>{track === "reedhaven" ? "Reedhaven" : track === "mire" ? "Mire" : "None"}</option>)}
              </select>
            </label>
          </div>
          <button
            type="button"
            className="mt-6 rounded-md bg-elevated px-5 py-2.5 font-display text-base text-accent shadow-[var(--shadow-border)]"
            onClick={() => {
              useGame.getState().setEntered();
              audioRef.current?.startMusic();
            }}
          >
            Enter the square
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MenuVolume({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="mt-2 flex items-center gap-2 text-xs">
      <span className="w-16 text-muted-foreground">{label}</span>
      <input
        className="min-w-0 flex-1 accent-accent"
        type="range"
        min="0"
        max="1"
        step=".05"
        value={value}
        aria-label={`${label} volume`}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output className="w-8 text-right font-mono text-[10px]">{Math.round(value * 100)}%</output>
    </label>
  );
}
