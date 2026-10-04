import { Link } from "@tanstack/react-router";
import {
  Backpack,
  BookOpen,
  Map as MapIcon,
  Swords,
  Sparkles,
  Eye,
  TimerReset,
  Minus,
  Plus,
  Scan,
  Maximize2,
  Settings2,
  Info,
} from "lucide-react";
import { BOOKS, LOCATIONS, SKILLS, locationAt } from "@/lib/ashfen/world";
import { BOOK_PAGES, SHOP } from "@/lib/ashfen/lore";
import { useGame, type Panel } from "@/lib/ashfen/game-store";
import { cn } from "@/lib/utils";
import { press, release } from "@/lib/ashfen/input";
import { RUN_MAX, ZOOM_CLOSE, ZOOM_REALM, clampZoom } from "@/lib/ashfen/physics";
import { objectiveFor, targetFor } from "@/lib/ashfen/quests";
import { MAP_LANDMARKS, MAP_PALETTE, MAP_ROUTES, mapMarkerTone, mapRegionAt } from "@/lib/ashfen/map";
import { COSMETIC_PALETTE, COSMETIC_GENDERS, HAIR_STYLES, EYE_STYLES, CLOTHING_STYLES, APPAREL_STYLES, type CharacterCosmetics } from "@/lib/ashfen/cosmetics";
import { BRIGHTNESS_STEPS, SOUNDTRACKS } from "@/lib/ashfen/settings";
import { EMOTES, emoteLabel } from "@/lib/ashfen/emotes";
import { AudioController } from "@/lib/ashfen/audio";
import { DEFAULT_PREFERENCES } from "@/lib/ashfen/settings";

const touchAudio = new AudioController(DEFAULT_PREFERENCES.audio);

function emitTouchFeedback(kind: "touch" | "interact", vibration: number | number[]) {
  const state = useGame.getState();
  touchAudio.playSfx(kind, state.hud.audio);
  if (!state.hud.reduceEffects && typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(vibration);
  }
}

const TABS: { id: Panel; label: string; icon: typeof Backpack }[] = [
  { id: "pack", label: "Pack", icon: Backpack },
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "codex", label: "Codex", icon: BookOpen },
  { id: "map", label: "Map", icon: MapIcon },
  { id: "attack", label: "Attack", icon: Swords },
];

export function Hud() {
  const tileX = useGame((s) => s.tileX);
  const tileY = useGame((s) => s.tileY);
  const hp = useGame((s) => s.hp);
  const maxHp = useGame((s) => s.maxHp);
  const panel = useGame((s) => s.panel);
  const log = useGame((s) => s.log);
  const overlays = useGame((s) => s.overlays);
  const attackMode = useGame((s) => s.attackMode);
  const tick = useGame((s) => s.tick);
  const zoom = useGame((s) => s.zoom);
  const runEnergy = useGame((s) => s.runEnergy);
  const runToggle = useGame((s) => s.runToggle);
  const boostUntil = useGame((s) => s.boostUntil);
  const hud = useGame((s) => s.hud);
  const settingsOpen = useGame((s) => s.settingsOpen);
  const controlsOpen = useGame((s) => s.controlsOpen);
  const quietTithe = useGame((s) => s.quietTithe);
  const networkStatus = useGame((s) => s.networkStatus);
  const networkPlayerCount = useGame((s) => s.networkPlayerCount);
  const cosmetics = useGame((s) => s.cosmetics);
  const pvpStatus = useGame((s) => s.pvpStatus);
  const loc = locationAt(tileX, tileY);
  const boosting = Date.now() < boostUntil;
  const questTarget = targetFor(quietTithe);
  const distance = questTarget ? Math.abs(questTarget.x - tileX) + Math.abs(questTarget.y - tileY) : 0;

  return (
    <div className={cn("pointer-events-none absolute inset-0 z-10 flex flex-col", hud.largeUi ? "text-[1.08em]" : "")}>
      <div className="ashfen-safe-top pointer-events-auto flex items-start justify-between gap-2 px-2 pb-2 sm:px-3 sm:pb-3">
        <div className="max-w-[70%] rounded-md bg-background/85 px-3 py-1.5 shadow-[var(--shadow-border)] backdrop-blur-sm">
          <p className="font-display text-sm leading-tight">
            {loc.name}{" "}
            <span className="font-mono text-xs text-accent">
              {hp}/{maxHp}
            </span>
            <span className="ml-2 font-mono text-[10px] text-subtle">t{tick}</span>
            <span className="ml-2 font-mono text-[10px] text-subtle">{Math.round(zoom * 100)}%</span>
          </p>
          <div className="mt-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            <span className={cn("inline-block size-1.5 rounded-full", networkStatus === "connected" ? "bg-ok" : networkStatus === "reconnecting" ? "bg-warn" : networkStatus === "error" ? "bg-danger" : "bg-muted-foreground")} />
            <span>{networkStatus === "connected" ? "Reedhaven online" : networkStatus}</span>
            <span>· {networkPlayerCount} nearby</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="w-7 font-mono text-[9px] uppercase tracking-wider text-subtle">HP</span>
            <div className="h-1.5 flex-1 rounded-full bg-elevated" aria-label={`Health ${hp} of ${maxHp}`}>
              <div className={cn("h-1.5 rounded-full", hp / maxHp < 0.35 ? "bg-danger" : "bg-ok")} style={{ width: `${(hp / maxHp) * 100}%` }} />
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <button type="button" onClick={() => useGame.getState().setRunToggle(!runToggle)} className={cn("w-9 text-left font-mono text-[9px] uppercase tracking-wider", runToggle ? "text-accent" : "text-subtle")} title="Toggle run (R)">Run</button>
            <div className="h-1.5 flex-1 rounded-full bg-elevated">
              <div
                className={cn("h-1.5 rounded-full", boosting ? "bg-warn" : "bg-accent")}
                style={{ width: `${Math.min(100, (runEnergy / RUN_MAX) * 100)}%` }}
              >
              </div>
            </div>
          </div>
          <div className="mt-1 flex gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            {hp / maxHp < 0.35 ? <span className="text-danger">Low health</span> : null}
            {runEnergy < 28 ? <span className="text-warn">Winded</span> : null}
            {runToggle ? <span className="text-accent">Run on</span> : <span>Walk</span>}
            {boosting ? <span className="text-accent">Cactus boost</span> : null}
            <span className={pvpStatus.kind === "skulled" ? "text-danger" : "text-ok"}>{pvpStatus.kind === "skulled" ? "Skulled" : "Unskulled · keep 3"}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => useGame.getState().setZoom(clampZoom(zoom / 1.14))}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-md bg-background/85 shadow-[var(--shadow-border)]"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus className="size-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => useGame.getState().setZoom(ZOOM_REALM)}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-md bg-background/85 shadow-[var(--shadow-border)]"
            title="Realm view"
            aria-label="Realm view"
          >
            <Scan className="size-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => useGame.getState().setZoom(ZOOM_CLOSE)}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-md bg-background/85 shadow-[var(--shadow-border)]"
            title="Close view"
            aria-label="Close view"
          >
            <Maximize2 className="size-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => useGame.getState().setZoom(clampZoom(zoom * 1.14))}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-md bg-background/85 shadow-[var(--shadow-border)]"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus className="size-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => useGame.getState().toggleOverlay("walk")}
            className={cn(
              "inline-flex h-11 min-w-11 items-center justify-center rounded-md bg-background/85 shadow-[var(--shadow-border)]",
              overlays.walk ? "text-accent" : "text-muted-foreground",
            )}
            aria-pressed={overlays.walk}
            title="Walkable tiles"
          >
            <Eye className="size-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => useGame.getState().toggleOverlay("respawn")}
            className={cn(
              "inline-flex h-11 min-w-11 items-center justify-center rounded-md bg-background/85 shadow-[var(--shadow-border)]",
              overlays.respawn ? "text-warn" : "text-muted-foreground",
            )}
            aria-pressed={overlays.respawn}
            title="Resource respawn"
          >
            <TimerReset className="size-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => useGame.getState().setSettingsOpen(!settingsOpen)}
            className={cn("inline-flex h-11 min-w-11 items-center justify-center rounded-md bg-background/85 shadow-[var(--shadow-border)]", settingsOpen ? "text-accent" : "")}
            aria-pressed={settingsOpen}
            aria-label="Open settings"
            title="Settings"
          >
            <Settings2 className="size-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => useGame.getState().setControlsOpen(!controlsOpen)}
            className={cn("inline-flex h-11 min-w-11 items-center justify-center rounded-md bg-background/85 shadow-[var(--shadow-border)]", controlsOpen ? "text-accent" : "")}
            aria-pressed={controlsOpen}
            aria-label="Show controls"
            title="Controls"
          >
            <Info className="size-4" strokeWidth={1.75} />
          </button>
          <Link
            to="/lab"
            className="inline-flex h-11 items-center rounded-md bg-background/85 px-3 font-display text-sm shadow-[var(--shadow-border)]"
          >
            Lab
          </Link>
        </div>
      </div>

      <div className="pointer-events-none mx-2 max-w-lg space-y-0.5 sm:mx-3">
        {log.slice(-4).map((line) => (
          <p key={line.t + line.text} className="text-[11px] leading-snug text-foreground/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {line.text}
          </p>
        ))}
      </div>

      <div className="pointer-events-auto mx-2 mt-2 max-w-md rounded-md border border-accent/30 bg-background/90 p-2.5 shadow-[var(--shadow-border)] backdrop-blur-sm sm:mx-3" aria-live="polite">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">The Quiet Tithe</p>
            <p className="mt-0.5 font-display text-sm">{objectiveFor(quietTithe)}</p>
          </div>
          {questTarget ? <span className="shrink-0 rounded bg-elevated px-1.5 py-1 font-mono text-[10px] text-muted-foreground">{questTarget.label} · {distance} tiles</span> : null}
        </div>
        {quietTithe.phase === "collect" ? (
          <div className="mt-2 grid grid-cols-4 gap-1 text-center font-mono text-[9px] uppercase tracking-wider">
            {(["reedwood", "ashOre", "perch", "mireFibre"] as const).map((key) => (
              <span key={key} className={cn("rounded border px-1 py-1", quietTithe.offerings[key] ? "border-ok/50 bg-ok/10 text-ok" : "border-border text-muted-foreground")}>
                {quietTithe.offerings[key] ? "✓ " : "□ "}{key === "ashOre" ? "ore" : key === "mireFibre" ? "fibre" : key}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {settingsOpen || controlsOpen ? (
        <div className="pointer-events-auto mx-2 mt-2 max-w-sm rounded-md bg-background/92 p-3 text-sm shadow-[var(--shadow-border)] backdrop-blur-sm sm:mx-3">
          {settingsOpen ? (
            <div className="space-y-2">
              <p className="font-display text-base">Field settings</p>
              <label className="flex items-center justify-between gap-3">
                <span>Reduce effects</span>
                <input type="checkbox" checked={hud.reduceEffects} onChange={(e) => useGame.getState().setHudPreference("reduceEffects", e.target.checked)} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>Larger interface</span>
                <input type="checkbox" checked={hud.largeUi} onChange={(e) => useGame.getState().setHudPreference("largeUi", e.target.checked)} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>Corner overview</span>
                <input type="checkbox" checked={hud.showMinimap} onChange={(e) => useGame.getState().setHudPreference("showMinimap", e.target.checked)} />
              </label>
              <fieldset className="space-y-2 border-t border-border pt-2"><legend className="font-display text-sm">Lens & sound</legend>
                <label className="flex items-center justify-between gap-3 text-xs">Brightness<select className="rounded border border-border bg-elevated px-1 py-1" value={hud.brightness} onChange={(e) => useGame.getState().setPreference({ brightness: Number(e.target.value) as typeof hud.brightness })}>{BRIGHTNESS_STEPS.map((step) => <option key={step} value={step}>{step}%</option>)}</select></label>
                <label className="flex items-center justify-between gap-3 text-xs">Soundtrack<select className="rounded border border-border bg-elevated px-1 py-1" value={hud.audio.soundtrack} onChange={(e) => useGame.getState().setPreference({ audio: { soundtrack: e.target.value as typeof hud.audio.soundtrack } })}>{SOUNDTRACKS.map((track) => <option key={track} value={track}>{track}</option>)}</select></label>
                <VolumeControl label="Master" value={hud.audio.masterVolume} onChange={(value) => useGame.getState().setPreference({ audio: { masterVolume: value } })} />
                <VolumeControl label="Music" value={hud.audio.musicVolume} onChange={(value) => useGame.getState().setPreference({ audio: { musicVolume: value } })} />
                <VolumeControl label="Effects" value={hud.audio.sfxVolume} onChange={(value) => useGame.getState().setPreference({ audio: { sfxVolume: value } })} />
                <label className="flex items-center justify-between gap-3 text-xs">Mute all sound<input type="checkbox" checked={hud.audio.muted} onChange={(e) => useGame.getState().setPreference({ audio: { muted: e.target.checked } })} /></label>
              </fieldset>
              <EmoteChooser />
              <CosmeticsEditor cosmetics={cosmetics} />
            </div>
          ) : (
            <div>
              <p className="font-display text-base">Controls</p>
              <p className="mt-1 text-xs text-muted-foreground">WASD or arrows move · click a tile to path · E or Space work · wheel or pinch zoom.</p>
            </div>
          )}
        </div>
      ) : null}

      <div className="ashfen-safe-bottom mt-auto flex items-end justify-between gap-2 px-2 pt-2 sm:px-3 sm:pt-3">
        <div className="flex items-end gap-2">
          {hud.showMinimap ? <Minimap /> : null}
          <MovePad />
        </div>
        <div className="pointer-events-auto ml-auto w-full max-w-md">
          {panel ? <PanelCard /> : null}
          <nav className="mt-2 grid grid-cols-5 overflow-hidden rounded-md bg-background/90 shadow-[var(--shadow-border)] backdrop-blur-sm">
            {TABS.map((tab) => {
              const active = panel === tab.id || (tab.id === "attack" && attackMode && panel !== "attack");
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (tab.id === "attack") {
                      const next = !useGame.getState().attackMode;
                      useGame.getState().setAttack(next);
                      useGame.getState().setPanel("attack");
                      useGame.getState().say(next ? "Attack ready. Click a mireling." : "Attack sheathed.");
                    } else {
                      useGame.getState().setPanel(tab.id);
                    }
                  }}
                  className={cn(
                    "flex h-12 flex-col items-center justify-center gap-0.5 text-[10px] uppercase tracking-[0.12em]",
                    active ? "bg-elevated text-foreground" : "text-muted-foreground",
                  )}
                >
                  <tab.icon className="size-4" strokeWidth={1.75} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

function CosmeticsEditor({ cosmetics }: { cosmetics: CharacterCosmetics }) {
  const update = (next: Partial<CharacterCosmetics>) => useGame.getState().setCosmetics(next);
  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      <div><p className="font-display text-base">Character appearance</p><p className="text-[11px] text-muted-foreground">Saved locally with your Ashfen character.</p></div>
      <div className="grid grid-cols-2 gap-2">
        <CosmeticSelect label="Style" value={cosmetics.gender} options={COSMETIC_GENDERS} onChange={(value) => update({ gender: value as CharacterCosmetics["gender"] })} />
        <CosmeticSelect label="Hair" value={cosmetics.hairStyle} options={HAIR_STYLES} onChange={(value) => update({ hairStyle: value as CharacterCosmetics["hairStyle"] })} />
        <CosmeticSelect label="Eyes" value={cosmetics.eyeStyle} options={EYE_STYLES} onChange={(value) => update({ eyeStyle: value as CharacterCosmetics["eyeStyle"] })} />
        <CosmeticSelect label="Clothing" value={cosmetics.clothingStyle} options={CLOTHING_STYLES} onChange={(value) => update({ clothingStyle: value as CharacterCosmetics["clothingStyle"] })} />
        <CosmeticSelect label="Apparel" value={cosmetics.apparelStyle} options={APPAREL_STYLES} onChange={(value) => update({ apparelStyle: value as CharacterCosmetics["apparelStyle"] })} />
        <ColorSelect label="Skin" value={cosmetics.skinColor} options={COSMETIC_PALETTE.skin} onChange={(value) => update({ skinColor: value })} />
        <ColorSelect label="Hair color" value={cosmetics.hairColor} options={COSMETIC_PALETTE.hair} onChange={(value) => update({ hairColor: value })} />
        <ColorSelect label="Cloth color" value={cosmetics.clothingColor} options={COSMETIC_PALETTE.clothing} onChange={(value) => update({ clothingColor: value })} />
      </div>
    </div>
  );
}

function VolumeControl({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="flex items-center gap-2 text-xs"><span className="w-14">{label}</span><input className="min-w-0 flex-1 accent-accent" type="range" min="0" max="1" step=".05" value={value} aria-label={`${label} volume`} onChange={(e) => onChange(Number(e.target.value))} /><output className="w-8 text-right font-mono text-[10px]">{Math.round(value * 100)}%</output></label>;
}

function EmoteChooser() {
  const active = useGame((s) => s.activeEmote);
  return <fieldset className="border-t border-border pt-2"><legend className="font-display text-sm">Emotes</legend><div className="mt-1 grid grid-cols-3 gap-1">{EMOTES.map((id) => <button key={id} type="button" className="rounded border border-border bg-elevated px-1 py-1 text-[10px] hover:text-accent" aria-label={`Emote ${emoteLabel(id)}`} onClick={() => useGame.getState().triggerEmote(id)}>{emoteLabel(id)}</button>)}</div>{active ? <p role="status" className="mt-1 text-[10px] text-accent">{emoteLabel(active.id)}!</p> : null}</fieldset>;
}

function CosmeticSelect({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <label className="block text-[10px] uppercase tracking-wider text-muted-foreground">{label}<select className="mt-0.5 w-full rounded border border-border bg-elevated px-1.5 py-1 text-xs normal-case tracking-normal text-foreground" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function ColorSelect({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <label className="block text-[10px] uppercase tracking-wider text-muted-foreground">{label}<select className="mt-0.5 w-full rounded border border-border bg-elevated px-1.5 py-1 text-xs text-foreground" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function hold(code: string) {
  return {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      press(code);
      emitTouchFeedback("touch", 8);
    },
    onPointerUp: () => release(code),
    onPointerCancel: () => release(code),
    onPointerLeave: () => release(code),
  };
}

function MovePad() {
  return (
    <div className="pointer-events-auto grid grid-cols-3 grid-rows-3 gap-0.5 sm:hidden">
      <span />
      <PadBtn label="W" {...hold("KeyW")} />
      <span />
      <PadBtn label="A" {...hold("KeyA")} />
      <PadBtn
        label="E"
        title="Interact, talk, or work"
        onPointerDown={(e) => {
          e.preventDefault();
          emitTouchFeedback("interact", [12, 18, 12]);
          window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyE" }));
        }}
      />
      <PadBtn label="D" {...hold("KeyD")} />
      <span />
      <PadBtn label="S" {...hold("KeyS")} />
      <span />
    </div>
  );
}

function PadBtn({
  label,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  title,
}: {
  label: string;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerUp?: () => void;
  onPointerCancel?: () => void;
  onPointerLeave?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      className="inline-flex h-11 w-11 touch-manipulation select-none items-center justify-center rounded-md bg-background/85 font-mono text-xs shadow-[var(--shadow-border)]"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerLeave}
      aria-label={title ?? `Move ${label}`}
      title={title}
    >
      {label}
    </button>
  );
}

function Minimap() {
  const tileX = useGame((s) => s.tileX);
  const tileY = useGame((s) => s.tileY);
  const remotePlayers = useGame((s) => s.remotePlayers);
  const quietTithe = useGame((s) => s.quietTithe);
  const questTarget = targetFor(quietTithe);
  return (
    <div className="pointer-events-auto hidden h-32 w-40 shrink-0 overflow-hidden rounded-md bg-[#17201c]/95 p-1 shadow-[var(--shadow-border)] sm:block" aria-label="Ashfen overview map">
      <svg viewBox="0 0 42 34" className="h-full w-full" role="img">
        <rect width="42" height="34" rx="1.4" fill={MAP_PALETTE.ink} />
        <path d="M10 1h16l3 19H10z" fill={MAP_PALETTE.reedhaven} opacity=".5" />
        <path d="M0 10h14l4 24H0z" fill={MAP_PALETTE.mire} opacity=".54" />
        <path d="M26 4h16v30H26z" fill={MAP_PALETTE.wilds} opacity=".48" />
        {MAP_ROUTES.map((route) => (
          <polyline key={route.id} points={route.points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={route.tone === "wild" ? MAP_PALETTE.path : MAP_PALETTE.paperLight} strokeWidth={route.tone === "wild" ? ".72" : ".95"} strokeDasharray={route.tone === "wild" ? "1.5 1" : undefined} opacity=".86" />
        ))}
        {MAP_LANDMARKS.map((landmark) => (
          <g key={landmark.id}>
            <circle cx={landmark.x} cy={landmark.y} r={landmark.radius / 3} fill={mapMarkerTone(landmark.kind)} opacity=".22" />
            <circle cx={landmark.x} cy={landmark.y} r=".85" fill={mapMarkerTone(landmark.kind)} stroke={MAP_PALETTE.ink} strokeWidth=".3" />
          </g>
        ))}
        {questTarget ? <path d={`M${questTarget.x - 1},${questTarget.y}h2M${questTarget.x},${questTarget.y - 1}v2`} stroke={MAP_PALETTE.quest} strokeWidth=".7" /> : null}
        {remotePlayers.map((peer) => <circle key={peer.playerId} cx={peer.x + 0.5} cy={peer.y + 0.5} r=".9" fill={MAP_PALETTE.peer} stroke={MAP_PALETTE.ink} strokeWidth=".3" />)}
        <circle cx={tileX + 0.5} cy={tileY + 0.5} r="1.25" fill={MAP_PALETTE.player} stroke={MAP_PALETTE.ink} strokeWidth=".45" />
        <text x="1.2" y="3" fill={MAP_PALETTE.paperLight} fontSize="1.5" fontFamily="monospace">{mapRegionAt(tileX, tileY).toUpperCase()}</text>
      </svg>
    </div>
  );
}

function useItem(id: string) {
  const st = useGame.getState();
  const item = st.pack.find((p) => p.id === id);
  if (!item || item.qty < 1) return;
  if (id === "bread") {
    st.setHp(st.hp + 4);
    st.addItem("bread", "Bread", -1);
    st.say("Bread. Vitality steadies.");
    return;
  }
  if (id === "rice") {
    st.setHp(st.hp + 2);
    st.addItem("rice", "Rice cakes", -1);
    st.say("Rice cakes. The walk holds.");
    return;
  }
  if (id === "cactus") {
    st.addItem("cactus", "Cactus juice", -1);
    st.setBoostUntil(Date.now() + 20_000);
    st.say("Cactus juice. The path runs quicker.");
    return;
  }
  if (id === "honey") {
    st.addItem("honey", "Nepalien honey", -1);
    st.say("Nepalien honey. The strike lands true.");
    return;
  }
  if (id === "primer") {
    st.readBook("primer");
  }
}

function PanelCard() {
  const panel = useGame((s) => s.panel);
  const pack = useGame((s) => s.pack);
  const gold = useGame((s) => s.gold);
  const skills = useGame((s) => s.skills);
  const booksRead = useGame((s) => s.booksRead);
  const openBook = useGame((s) => s.openBook);
  const talk = useGame((s) => s.talk);
  const mirelings = useGame((s) => s.mirelings);
  const tileX = useGame((s) => s.tileX);
  const tileY = useGame((s) => s.tileY);

  return (
    <div className="max-h-64 overflow-auto rounded-md bg-background/92 p-3 shadow-[var(--shadow-border)] backdrop-blur-sm">
      {talk ? (
        <p className="mb-2 font-display text-sm">
          {talk.npc}: <span className="italic text-muted-foreground">{talk.line}</span>
        </p>
      ) : null}

      {panel === "pack" ? (
        <div>
          <p className="font-display text-base">Pack · {gold} reed-coin</p>
          <ul className="mt-2 space-y-1 text-sm">
            {pack.map((item) => (
              <li key={item.id} className="flex justify-between">
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-1 text-left"
                  onClick={() => useItem(item.id)}
                >
                  <span>{item.name}</span>
                  <span className="font-mono text-muted-foreground">{item.qty}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-border pt-2">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Toller’s board</p>
            {SHOP.map((s) => (
              <button
                key={s.id}
                type="button"
                className="mt-1 flex w-full items-center justify-between rounded-sm px-1 py-1 text-left text-sm hover:bg-elevated"
                onClick={() => {
                  const st = useGame.getState();
                  if (!st.spendGold(s.cost)) {
                    st.say("Not enough reed-coin.");
                    return;
                  }
                  if (s.id === "bread") {
                    st.addItem("bread", "Bread", 1);
                    st.setHp(st.hp + 4);
                  } else if (s.id === "rice") {
                    st.addItem("rice", s.name, 1);
                    st.setHp(st.hp + 2);
                  } else {
                    st.addItem(s.id, s.name, 1);
                  }
                  st.say(`Bought ${s.name}.`);
                }}
              >
                <span>
                  {s.name}
                  <span className="ml-2 text-xs text-muted-foreground">{s.blurb}</span>
                </span>
                <span className="font-mono text-xs">{s.cost}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {panel === "skills" ? (
        <ul className="space-y-1.5">
          {SKILLS.map((id) => {
            const s = skills[id];
            const need = s.level * 80;
            return (
              <li key={id}>
                <div className="flex justify-between text-sm">
                  <span>{id}</span>
                  <span className="font-mono text-muted-foreground">{s.level}</span>
                </div>
                <div className="mt-0.5 h-1 rounded-full bg-elevated">
                  <div
                    className="h-1 rounded-full bg-accent"
                    style={{ width: `${Math.min(100, (s.xp / need) * 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {panel === "codex" ? (
        <div>
          {openBook && BOOK_PAGES[openBook] ? (
            <div>
              <p className="font-display text-base">
                {BOOKS.find((b) => b.id === openBook)?.title}
              </p>
              {BOOK_PAGES[openBook]!.map((p) => (
                <p key={p} className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
            </div>
          ) : (
            <ul className="space-y-1">
              {BOOKS.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className="w-full py-1 text-left text-sm"
                    onClick={() => useGame.getState().readBook(b.id)}
                  >
                    {b.title}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {b.author} · {b.pages} pages
                      {booksRead.includes(b.id) ? " · kept" : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {panel === "map" ? (
        <ul className="space-y-1">
          {LOCATIONS.map((loc) => (
            <li key={loc.id}>
              <p className="text-sm">
                {loc.name}
                {loc.x === locationAt(tileX, tileY).x && loc.y === locationAt(tileX, tileY).y ? (
                  <span className="ml-2 text-xs text-accent">here</span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">{loc.blurb}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {panel === "attack" ? (
        <div>
          <p className="font-display text-base">Attack</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Click a mireling. 600ms tick. They return — watch the red ring.
          </p>
          <p className="mt-2 font-mono text-xs text-subtle">
            {mirelings.filter((m) => m.alive).length}/{mirelings.length} in the reed
          </p>
        </div>
      ) : null}
    </div>
  );
}
