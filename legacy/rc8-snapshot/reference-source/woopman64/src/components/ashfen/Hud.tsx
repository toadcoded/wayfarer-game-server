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
  Box,
  Pause,
  Play,
} from "lucide-react";
import { BOOKS, LOCATIONS, SKILLS, WORLD_LANDMARKS, locationAt, nearbyLandmark } from "@/lib/ashfen/world";
import { BOOK_PAGES, SHOP } from "@/lib/ashfen/lore";
import { useGame, type Panel } from "@/lib/ashfen/game-store";
import { cn } from "@/lib/utils";
import { press, release } from "@/lib/ashfen/input";
import { RUN_MAX, ZOOM_CLOSE, ZOOM_REALM, clampZoom } from "@/lib/ashfen/physics";
import { objectiveFor, targetFor, trailCount, TITHE_REQUIREMENTS } from "@/lib/ashfen/quests";
import { ATTACK_STYLES, CRAFTING_RECIPES, ITEM_CATALOG } from "@/lib/ashfen/rpg";
import { completeCraft } from "@/lib/ashfen/play";

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
  const boostUntil = useGame((s) => s.boostUntil);
  const viewMode = useGame((s) => s.viewMode);
  const tithe = useGame((s) => s.tithe);
  const titheSync = useGame((s) => s.titheSync);
  const gold = useGame((s) => s.gold);
  const paused = useGame((s) => s.paused);
  const loc = locationAt(tileX, tileY);
  const boosting = Date.now() < boostUntil;
  const objective = objectiveFor(tithe);
  const trails = trailCount(tithe.offerings);
  const aim = targetFor(tithe);
  const nearby = nearbyLandmark(tileX, tileY);
  const syncLabel =
    titheSync.status === "pending"
      ? "pending"
      : titheSync.status === "accepted"
        ? "kept"
        : titheSync.status === "rejected"
          ? "refused"
          : "sync";

  return (
    <div className="ashfen-hud pointer-events-none absolute inset-0 z-10 flex flex-col">
      <div className="pointer-events-auto flex items-start justify-between gap-2 p-2 sm:p-3">
        <div className="max-w-[72%] rounded-md bg-background/85 px-3 py-1.5 shadow-[var(--shadow-border)] backdrop-blur-sm">
          <p className="font-display text-sm leading-tight">
            {loc.name}{" "}
            <span className="font-mono text-xs text-accent">
              {hp}/{maxHp}
            </span>
            <span className="ml-2 font-mono text-[10px] text-subtle">t{tick}</span>
            <span className="ml-2 font-mono text-[10px] text-subtle">{Math.round(zoom * 100)}%</span>
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="w-7 font-mono text-[9px] uppercase tracking-wider text-subtle">Run</span>
            <div className="h-1.5 flex-1 rounded-full bg-elevated">
              <div
                className={cn("h-1.5 rounded-full", boosting ? "bg-warn" : "bg-accent")}
                style={{ width: `${Math.min(100, (runEnergy / RUN_MAX) * 100)}%` }}
              />
            </div>
          </div>
          <p className="mt-1.5 text-[12px] leading-snug text-foreground">{objective}</p>
          <div className="mt-1 flex gap-1">
            {TITHE_REQUIREMENTS.map((req) => (
              <span
                key={req.key}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  tithe.offerings[req.key] ? "bg-accent" : "bg-elevated",
                )}
              />
            ))}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.12em] text-subtle">
              The Four Trails · {trails}/4
            </p>
            <p className="font-mono text-[10px] text-muted-foreground">{gold}g</p>
          </div>
          {nearby ? (
            <p className="mt-0.5 text-[10px] text-accent">Nearby · {nearby.name}</p>
          ) : null}
          <p
            className={cn(
              "mt-0.5 font-mono text-[9px] uppercase tracking-wider",
              titheSync.status === "rejected"
                ? "text-warn"
                : titheSync.status === "accepted"
                  ? "text-ok"
                  : "text-subtle",
            )}
          >
            {syncLabel}
            {aim ? ` · ${aim.label}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => useGame.getState().setPaused(!paused)}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-md bg-background/85 shadow-[var(--shadow-border)]"
            title={paused ? "Resume" : "Pause"}
            aria-label={paused ? "Resume" : "Pause"}
            aria-pressed={paused}
          >
            {paused ? <Play className="size-4" strokeWidth={1.75} /> : <Pause className="size-4" strokeWidth={1.75} />}
          </button>
          <button
            type="button"
            onClick={() =>
              useGame.getState().setViewMode(viewMode === "3d" ? "2d" : "3d")
            }
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-md bg-background/85 shadow-[var(--shadow-border)]"
            title={viewMode === "3d" ? "Top-down view" : "3D view"}
            aria-label={viewMode === "3d" ? "Switch to top-down" : "Switch to 3D"}
            aria-pressed={viewMode === "3d"}
          >
            <Box className="size-4" strokeWidth={1.75} />
          </button>
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

      <div className="mt-auto flex items-end justify-between gap-2 p-2 sm:p-3">
        <div className="flex items-end gap-2">
          <Minimap />
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

function hold(code: string) {
  return {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      press(code);
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
      <PadBtn label="W" ariaLabel="Walk forward" {...hold("KeyW")} />
      <span />
      <PadBtn label="A" ariaLabel="Walk left" {...hold("KeyA")} />
      <PadBtn
        label="E"
        ariaLabel="Talk, work, or light"
        onPointerDown={(e) => {
          e.preventDefault();
          window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyE" }));
        }}
      />
      <PadBtn label="D" ariaLabel="Walk right" {...hold("KeyD")} />
      <span />
      <PadBtn label="S" ariaLabel="Walk back" {...hold("KeyS")} />
      <span />
    </div>
  );
}

function PadBtn({
  label,
  ariaLabel,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
}: {
  label: string;
  ariaLabel?: string;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerUp?: () => void;
  onPointerCancel?: () => void;
  onPointerLeave?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? label}
      title={ariaLabel ?? label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-background/85 font-mono text-xs shadow-[var(--shadow-border)]"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerLeave}
    >
      {label}
    </button>
  );
}

function Minimap() {
  const tileX = useGame((s) => s.tileX);
  const tileY = useGame((s) => s.tileY);
  const tithe = useGame((s) => s.tithe);
  const aim = targetFor(tithe);
  return (
    <div className="pointer-events-auto hidden h-28 w-28 shrink-0 overflow-hidden rounded-md bg-background/90 shadow-[var(--shadow-border)] sm:block">
      <svg viewBox="0 0 42 34" className="h-full w-full">
        <rect width="42" height="34" className="fill-elevated" />
        {LOCATIONS.map((loc) => (
          <rect
            key={loc.id}
            x={loc.x}
            y={loc.y}
            width={loc.w}
            height={loc.h}
            className={
              loc.id === "pond"
                ? "fill-accent/40"
                : loc.id === "keep"
                  ? "fill-muted/50"
                  : "fill-ok/50"
            }
            opacity={0.85}
          />
        ))}
        {aim ? <rect x={aim.x} y={aim.y} width="1.6" height="1.6" className="fill-warn" /> : null}
        {WORLD_LANDMARKS.map((mark) => (
          <circle key={mark.id} cx={mark.x + 0.5} cy={mark.y + 0.5} r="0.7" className="fill-accent" />
        ))}
        <circle cx={tileX + 0.5} cy={tileY + 0.5} r="1.2" className="fill-foreground" />
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
  const attackStyle = useGame((s) => s.attackStyle);

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
                    st.addItem(s.id, ITEM_CATALOG[s.id]?.name ?? s.name, 1);
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
          <div className="mt-3 border-t border-border pt-2">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Bindery</p>
            {CRAFTING_RECIPES.filter((recipe) =>
              ["reed-blade", "ash-bow", "ember-wand", "mire-axe", "ash-staff"].includes(recipe.id),
            ).map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                className="mt-1 flex w-full items-center justify-between rounded-sm px-1 py-1 text-left text-sm hover:bg-elevated"
                onClick={() => completeCraft(recipe.id)}
              >
                <span>{recipe.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {Object.entries(recipe.ingredients)
                    .map(([id, qty]) => `${qty} ${ITEM_CATALOG[id]?.name ?? id}`)
                    .join(" · ")}
                </span>
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
        <div>
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
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">Landmarks</p>
          <ul className="mt-1 space-y-1">
            {WORLD_LANDMARKS.map((mark) => (
              <li key={mark.id}>
                <p className="text-sm">{mark.name}</p>
                <p className="text-xs text-muted-foreground">
                  {mark.blurb} · {mark.skill}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {panel === "attack" ? (
        <div>
          <p className="font-display text-base">Attack</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Three styles, one reed. Click a mireling. They return — watch the red ring.
          </p>
          <ul className="mt-2 space-y-1">
            {ATTACK_STYLES.map((style) => {
              const armed = attackStyle === style.id;
              return (
                <li key={style.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-sm px-1 py-1 text-left text-sm",
                      armed ? "bg-elevated text-foreground" : "text-muted-foreground hover:bg-elevated",
                    )}
                    onClick={() => {
                      useGame.getState().setAttackStyle(style.id);
                      useGame.getState().setAttack(true);
                      useGame.getState().say(`${style.name} ready. ${style.hint}`);
                    }}
                  >
                    <span>{style.name}</span>
                    <span className="text-xs">{style.hint}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 font-mono text-xs text-subtle">
            {mirelings.filter((m) => m.alive).length}/{mirelings.length} in the reed
          </p>
        </div>
      ) : null}
    </div>
  );
}
