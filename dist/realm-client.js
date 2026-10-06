import { checkedXamView } from './xam-view.js';
import { RenderRecovery } from './render-recovery.js';
import { placeRealmCast, nearestNPC, NPC_PROTOTYPES } from './npc-prototypes.js';
import { initRealmHud } from './hud-controls.js';
import { PRACTICE_VERBS, practiceResponse } from './practice-interaction.js';
import { PRACTICE_METHODS, isPracticeSkill } from './practice.js';
import { WEAPONS } from './encounter.js';
import { skillBook } from './skill-directory.js';
import { levels, combatLevel, level, xpProgress, combatBonuses } from './progression.js';
import { PROFESSIONS, RESOURCES, TOOL_RECIPES } from './skilling.js';
import { WEAPON_BUILDS } from './weapon-builds.js';
import { ITEMS } from './inventory.js';
import { rasterIso } from './iso-raster.js';
import { RESULT_TEXT, SKILL_RESULT_TEXT, decodeGameState } from './game-actions.js';
initRealmHud();
const ALL_RESULT_TEXT = { ...RESULT_TEXT, ...SKILL_RESULT_TEXT };
import { GameCape } from './game-cape.js';
import { CharacterRenderer } from './character-renderer.js';
import { SnapshotBuffer } from './snapshot-buffer.js';
import { REALM_SUBPROTOCOL, encodeHello, decodeWelcome, compatibilityMessage, CompatibilityError } from './realm-contract.js';
import { decodeRealmSnapshot } from './replication.js';
import { isTravelMode } from './movement.js';
import { encodeMoveIntent } from './movement.js';
import { createRealmScene, REALM_WORLD } from './realm-scene.js';
import { crossingScene } from './scene-meshes.js';
import { toIso, fromIso } from './adapters/iso.js';
import { DirectionInput } from './direction-input.js';
import { realmHeartbeat } from './realm-heartbeat.js';
import { isVisualQuality } from './visual-surface.js';
import { RealmAudio } from './realm-audio.js';
let visualSurface, visualClosed = false;
const realmAudio = new RealmAudio();
const getVisualSurface = () => visualSurface ??= (async () => { const url = '/preview/pglite-plugin.bundle.js'; const module = await import(url); const surface = await module.createVisualSurface(); if (visualClosed) {
    await surface.close();
    throw new Error('Page closed');
} return surface; })().catch(error => { visualSurface = undefined; throw error; });
const qualityChoice = () => { const value = document.querySelector('#visual-quality')?.value; return isVisualQuality(value) ? value : 'maximum'; };
document.querySelector('#visual-quality')?.addEventListener('change', () => view3d?.setQuality(qualityChoice()));
const configureAmbience = () => { view3d?.setRetro(document.querySelector('#retro-style')?.checked ?? true); view3d?.setFlashes(!!document.querySelector('#ambient-flashes')?.checked); };
document.querySelector('#retro-style')?.addEventListener('change', configureAmbience);
document.querySelector('#ambient-flashes')?.addEventListener('change', configureAmbience);
document.querySelector('#check-health')?.addEventListener('click', async () => {
    const button = document.querySelector('#check-health'), text = document.querySelector('#host-health'), controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 3000);
    if (button)
        button.disabled = true;
    try {
        const response = await fetch(new URL('/health', location.href), { cache: 'no-store', signal: controller.signal });
        if (!response.ok)
            throw new Error('Host not ready');
        const health = await response.json();
        if (health.ready !== true || !Number.isSafeInteger(health.tick))
            throw new Error('Invalid host health');
        if (text)
            text.textContent = `Host ready · tick ${health.tick} · ${health.ticking ? 'simulation running' : 'realm resting'}`;
    }
    catch {
        if (text)
            text.textContent = 'Host health unavailable · check the connection heartbeat.';
    }
    finally {
        clearTimeout(timeout);
        if (button)
            button.disabled = false;
    }
});
for (const operation of ['save', 'load', 'clear'])
    document.querySelector('#visual-' + operation)?.addEventListener('click', async () => {
        const feedback = document.querySelector('#visual-storage-status'), button = document.querySelector('#visual-' + operation);
        if (button)
            button.disabled = true;
        if (feedback)
            feedback.textContent = 'Opening local visual preferences…';
        try {
            const surface = await getVisualSurface();
            if (operation === 'save')
                await surface.setQuality(qualityChoice());
            else if (operation === 'clear')
                await surface.clear();
            else {
                const value = await surface.getQuality(), choice = document.querySelector('#visual-quality');
                if (value) {
                    if (choice)
                        choice.value = value;
                    view3d?.setQuality(value);
                }
            }
            if (feedback)
                feedback.textContent = operation === 'save' ? 'Visual quality saved on this device.' : operation === 'clear' ? 'Local visual preferences cleared.' : 'Local visual preferences loaded.';
        }
        catch {
            if (feedback)
                feedback.textContent = 'Local preferences unavailable; current visuals still work.';
        }
        finally {
            if (button)
                button.disabled = false;
        }
    });
let view3d, overlay;
const graphics = new RenderRecovery();
const fallbackGraphics = () => { view3d = undefined; overlay?.remove(); overlay = undefined; const base = document.querySelector('#world'); if (base)
    base.style.display = ''; const hint = document.querySelector('#render-status'); if (hint)
    hint.textContent = '2D fallback active · retry 3D in Settings'; };
async function startGraphics() {
    if (visualClosed || graphics.state === 'loading' || graphics.state === 'ready')
        return;
    const button = document.querySelector('#retry-graphics');
    if (button)
        button.disabled = true;
    try {
        if (typeof WebGLRenderingContext === 'undefined') {
            fallbackGraphics();
            return;
        }
        overlay = document.createElement('canvas');
        overlay.id = 'world-3d';
        overlay.setAttribute('aria-label', '3D multiplayer causeway');
        document.body.prepend(overlay);
        const target = overlay;
        let pointerStart;
        target.addEventListener('pointerdown', event => { pointerStart = { x: event.clientX, y: event.clientY }; });
        target.addEventListener('pointerup', event => { if (!pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8) {
            pointerStart = undefined;
            return;
        } pointerStart = undefined; const point = view3d?.pickGround(event.clientX, event.clientY); if (point)
            setClickTarget(point); });
        const next = await graphics.load(async () => { const moduleUrl = '/preview/realm-3d.bundle.js', module = await import(moduleUrl); if (visualClosed)
            throw Error('Page closed'); const view = module.Realm3D.create(target); try {
            view.setQuality(qualityChoice());
            view.setRetro(document.querySelector('#retro-style')?.checked ?? true);
            view.setFlashes(!!document.querySelector('#ambient-flashes')?.checked);
            return view;
        }
        catch (error) {
            view.dispose();
            throw error;
        } });
        if (next && !visualClosed) {
            view3d = next;
            const base = document.querySelector('#world');
            if (base)
                base.style.display = 'none';
        }
        else
            fallbackGraphics();
    }
    catch {
        fallbackGraphics();
    }
    finally {
        if (button)
            button.disabled = false;
    }
}
document.querySelector('#retry-graphics')?.addEventListener('click', () => { void startGraphics(); });
document.querySelector('#retry-artwork')?.addEventListener('click', () => view3d?.retryArtwork());
void startGraphics();
const scene = createRealmScene(), canvas = document.querySelector('#world'), ctx = canvas.getContext('2d');
let clickTarget;
const setClickTarget = (point) => { if (!point)
    return; const checked = scene.navigation.check(point); if (checked.ok && checked.position)
    clickTarget = checked.position; };
const castPlacements = placeRealmCast(scene.plan.start, scene.plan.goal, p => scene.navigation.check(p));
const status = document.querySelector('#connection'), stats = document.querySelector('#players');
const join = document.querySelector('#join'), leave = document.querySelector('#leave');
let socket, id, snapshot, sequence = 0;
const characters = new CharacterRenderer(), cape = new GameCape();
let game, actionSequence = 0;
let xamView, xamPending = false, xamChecked = -Infinity, xamFollowing = false;
const reduced = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : undefined;
function action(action, value) { if (socket?.readyState === WebSocket.OPEN && id && socket.bufferedAmount < 65536)
    socket.send(JSON.stringify({ kind: 'action', sequence: actionSequence++, action, value })); }
const effectPaused = () => !!document.querySelector('#pause-effects')?.checked || !!reduced?.matches;
function configureWind() { const options = cape.patch.getABC(); options.enabled = !!document.querySelector('#cape-enabled')?.checked; for (const key of ['a', 'b', 'c'])
    options[key] = Number(document.querySelector('#wind-' + key)?.value || 0); cape.patch.setABC(options); }
for (const key of ['a', 'b', 'c'])
    document.querySelector('#wind-' + key)?.addEventListener('input', configureWind);
document.querySelector('#cape-enabled')?.addEventListener('change', configureWind);
document.querySelector('#reset-cape')?.addEventListener('click', () => { cape.reset(); configureWind(); });
document.querySelector('#beacon-action')?.addEventListener('click', () => action('beacon', 'light'));
document.querySelector('#appearance')?.addEventListener('change', () => action('appearance', document.querySelector('#appearance').value));
for (const button of document.querySelectorAll('[data-quest]'))
    button.addEventListener('click', () => action('quest', button.dataset.quest));
for (const kind of ['claim', 'equip', 'unequip'])
    document.querySelector('#item-' + kind)?.addEventListener('click', () => action(kind, kind === 'unequip' ? 'weapon' : document.querySelector('#item-choice').value));
for (const value of ['attack', 'guard'])
    document.querySelector('#combat-' + value)?.addEventListener('click', () => action('combat', value));
document.querySelector('#training-mode')?.addEventListener('change', () => action('training', document.querySelector('#training-mode').value));
document.querySelector('#practice-action')?.addEventListener('click', () => { const skill = document.querySelector('#practice-choice')?.value; if (isPracticeSkill(skill))
    action('practice', skill); });
for (const b of document.querySelectorAll('[data-practice-pad]'))
    b.addEventListener('click', () => { const c = game?.practiceChallenge; if (c)
        action('practice-step', practiceResponse(c, Number(b.dataset.practicePad))); });
document.querySelector('#practice-cancel')?.addEventListener('click', () => action('practice-step', 'cancel'));
for (const button of document.querySelectorAll('[data-skilling]'))
    button.addEventListener('click', () => action('skilling', button.dataset.skilling));
const buffer = new SnapshotBuffer();
let connectedAt = 0, animationId = 0;
let travelMode = 'jog';
const sprintKeys = new Set();
function chooseTravel(value) { if (isTravelMode(value)) {
    travelMode = value;
    const choice = document.querySelector('#travel-mode');
    if (choice)
        choice.value = value;
    sendDirection();
} }
document.querySelector('#travel-mode')?.addEventListener('change', () => chooseTravel(document.querySelector('#travel-mode')?.value));
for (const [id, factor] of [['camera-in', .85], ['camera-out', 1.18]])
    document.querySelector('#' + id)?.addEventListener('click', () => view3d?.zoomCamera(factor));
document.querySelector('#camera-reset')?.addEventListener('click', () => view3d?.resetCamera());
const held = new DirectionInput();
let width = 1, height = 1, scale = 1, ox = 0, oy = 0;
const faces = [];
for (const m of crossingScene(REALM_WORLD, scene.plan))
    for (let i = 0; i < m.indices.length; i += 3) {
        const points = Array.from(m.indices.slice(i, i + 3), v => ({ x: m.positions[v * 3], y: m.positions[v * 3 + 1], z: m.positions[v * 3 + 2] }));
        faces.push({ points, color: m.color, depth: points.reduce((n, p) => n + p.x + p.z + p.y * .02, 0) / 3 });
    }
faces.sort((a, b) => a.depth - b.depth);
const project = (p) => { const q = toIso(p.x, p.z); return { x: ox + q.isoX * scale, y: oy + (q.isoY - p.y) * scale }; };
canvas.addEventListener('click', event => { if (view3d)
    return; const p = fromIso((event.offsetX - ox) / scale, (event.offsetY - oy) / scale); setClickTarget({ x: p.tx, y: 0, z: p.tz }); });
// Static scenery is rasterized only on resize, not once per network snapshot.
const scenery = document.createElement('canvas'), sc = scenery.getContext('2d');
let resizing = false;
function resize() {
    if (resizing)
        return;
    resizing = true;
    try {
        width = innerWidth;
        height = innerHeight;
        const dpr = Math.min(devicePixelRatio || 1, 2);
        if (view3d) {
            render();
            return;
        }
        for (const c of [canvas, scenery]) {
            c.width = width * dpr;
            c.height = height * dpr;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        sc.setTransform(dpr, 0, 0, dpr, 0, 0);
        const points = faces.flatMap(f => f.points.map(p => { const q = toIso(p.x, p.z); return { x: q.isoX, y: q.isoY - p.y }; }));
        const xs = points.map(p => p.x), ys = points.map(p => p.y), minX = xs.reduce((a, b) => Math.min(a, b), Infinity), maxX = xs.reduce((a, b) => Math.max(a, b), -Infinity), minY = ys.reduce((a, b) => Math.min(a, b), Infinity), maxY = ys.reduce((a, b) => Math.max(a, b), -Infinity);
        scale = Math.max(.5, Math.min((width - 30) / (maxX - minX), (height - 220) / (maxY - minY)));
        ox = width / 2 - (minX + maxX) / 2 * scale;
        oy = height / 2 - (minY + maxY) / 2 * scale - (width <= 650 ? 85 : 0);
        const pixels = sc.createImageData(scenery.width, scenery.height);
        if (pixels) {
            pixels.data.set(rasterIso(scenery.width, scenery.height, faces, p => { const q = project(p); return { x: q.x * dpr, y: q.y * dpr }; }));
            sc.putImageData(pixels, 0, 0);
        }
        else {
            sc.fillStyle = '#142923';
            sc.fillRect(0, 0, width, height);
            for (const f of faces) {
                sc.beginPath();
                f.points.map(project).forEach((p, i) => i ? sc.lineTo(p.x, p.y) : sc.moveTo(p.x, p.y));
                sc.closePath();
                sc.fillStyle = f.color;
                sc.fill();
            }
        }
        render();
    }
    finally {
        resizing = false;
    }
}
function render() {
    const now = performance.now(), frame = buffer.sample(now), players = frame.players;
    characters.retain(players.map(p => p.id));
    const heartbeat = document.querySelector('#realm-heartbeat'), health = realmHeartbeat(!!id, snapshot ? frame.ageMs : now - connectedAt, document.hidden, !!snapshot);
    if (heartbeat) {
        heartbeat.textContent = health.text;
        heartbeat.style.color = health.state === 'live' ? '#b7d6a0' : health.state === 'waiting' || health.state === 'lost' ? '#e4b075' : '#aab4c6';
    }
    view3d?.setXam(xamView?.id, xamView?.phase.startsWith('training ') ? xamView.phase.slice(9) : undefined);
    if (view3d && !graphics.run(view => view.update(players, game, id, now, effectPaused(), cape.patch.getABC().enabled ? cape.patch.getABC().c + cape.patch.getABC().b - cape.patch.getABC().a : 0)))
        fallbackGraphics();
    if (view3d) {
        const hint = document.querySelector('#render-status');
        if (hint)
            hint.textContent = view3d.renderState === 'recovering' ? 'Graphics context interrupted · recovering…' : `3D · ${qualityChoice()} · drag orbit · right-drag pan · scroll/pinch zoom`;
    }
    const energy = document.querySelector('#run-energy'), self = snapshot?.players.find(p => p.id === id);
    if (energy)
        energy.textContent = self ? `${self.travelMode ?? 'jog'} · Run energy ${Math.round(self.runEnergy ?? 100)}%` : 'Jog · Join to move';
    if (id && now - xamChecked > 5000) {
        xamChecked = now;
        void examineXam();
    }
    const xamButton = document.querySelector('#xam-action'), xamFollow = document.querySelector('#xam-follow'), xamLive = document.querySelector('#xam-live'), me = snapshot?.players.find(p => p.id === id)?.position;
    if (xamButton)
        xamButton.disabled = !me || !xamView || Math.hypot(me.x - xamView.position.x, me.z - xamView.position.z) > 4;
    if (xamFollow) {
        xamFollow.disabled = !xamView;
        xamFollow.textContent = xamFollowing ? 'Stop watching Xam' : 'Watch Xam';
    }
    if (xamLive)
        xamLive.textContent = xamView ? `Xam activity: ${xamView.phase} · level ${xamView.totalLevel} · ${xamView.totalXp.toLocaleString()} XP · travelling demo bot is live.` : 'Xam activity: waiting for your realm connection.';
    const nameplate = document.querySelector('#xam-nameplate'), xamPosition = players.find(p => p.id === xamView?.id)?.position;
    if (nameplate) {
        const label = view3d && xamPosition ? view3d.projectLabel(xamPosition) : undefined;
        nameplate.hidden = !label?.visible;
        if (label) {
            nameplate.style.left = label.x + 'px';
            nameplate.style.top = label.y + 'px';
        }
    }
    const artStatus = document.querySelector('#artwork-status');
    if (artStatus)
        artStatus.textContent = view3d ? view3d.artworkState.map(a => a.title + ' · ' + a.state).join(' | ') : 'Artwork appears in the 3D view.';
    const weather = document.querySelector('#weather-state'), climate = view3d?.weatherState;
    if (weather && climate)
        weather.textContent = `${climate.kind} · Cloud water ${Math.round(climate.cloudWater * 100)}% · Humidity ${Math.round(climate.humidity * 100)}% · Surface damp ${Math.round(climate.wetness * 100)}%`;
    const metrics = document.querySelector('#world-metrics');
    if (metrics && view3d) {
        const m = view3d.worldMetrics;
        metrics.textContent = `${m.meshes} enabled mesh objects · ${m.triangles.toLocaleString()} enabled triangles · ${m.grassTufts} grass tufts · 1m world units · server 20Hz`;
    }
    const nearby = nearestNPC(castPlacements, snapshot?.players.find(p => p.id === id)?.position), talk = document.querySelector('#npc-talk');
    if (talk) {
        talk.disabled = !nearby;
        talk.textContent = nearby ? 'Talk to ' + NPC_PROTOTYPES[nearby.id].name : 'Talk · move closer';
    }
    const chatter = document.querySelector('#ambient-line');
    if (chatter)
        chatter.textContent = view3d?.ambienceText ?? 'Lanterns glow. Tiny things stir beside the causeway.';
    if (!view3d) {
        ctx.drawImage(scenery, 0, 0, scenery.width, scenery.height, 0, 0, width, height);
        if (game) {
            const target = project(game.beacon.position), e = game.encounter;
            ctx.save();
            ctx.strokeStyle = e.strikeAt ? '#ff9569' : '#82d2bc';
            ctx.lineWidth = e.strikeAt ? 3 : 1;
            ctx.beginPath();
            ctx.ellipse(target.x, target.y, 4 * scale, 2 * scale, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = e.hp === 0 ? '#506761' : e.strikeAt ? '#f7a572' : '#8ab4a8';
            ctx.beginPath();
            ctx.arc(target.x, target.y - 32, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#263e39';
            ctx.fillRect(target.x - 22, target.y - 55, 44, 5);
            ctx.fillStyle = '#a3e3ad';
            ctx.fillRect(target.x - 22, target.y - 55, 44 * e.hp / 80, 5);
            ctx.restore();
        }
        for (const npc of castPlacements) {
            const q = project(npc.position), spec = NPC_PROTOTYPES[npc.id];
            characters.draw(ctx, 'npc:' + npc.id, npc.position, q, now, spec.skin, false, effectPaused());
            ctx.fillStyle = '#dfc594';
            ctx.font = '11px system-ui';
            ctx.fillText(spec.name, q.x + 12, q.y - 22);
        }
        if (game) {
            const q = project(game.beacon.position);
            ctx.fillStyle = game.beacon.lit ? '#ffce70' : '#a2bcb0';
            ctx.beginPath();
            ctx.arc(q.x, q.y - 12, game.beacon.lit ? 9 : 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f2ebcf';
            ctx.font = '12px system-ui';
            ctx.fillText(game.beacon.lit ? 'Landing beacon · lit' : 'Landing beacon', Math.min(q.x + 14, width - 150), q.y - 12);
        }
        for (const p of [...players].sort((a, b) => a.position.x + a.position.z - b.position.x - b.position.z)) {
            const q = project(p.position), local = p.id === id, skin = game?.players.find(v => v.id === p.id)?.skin ?? 'adventurer';
            if (local && cape.patch.getABC().enabled)
                cape.draw(ctx, q, now, effectPaused());
            characters.draw(ctx, p.id, p.position, q, now, skin, local, effectPaused());
            const weapon = game?.players.find(v => v.id === p.id)?.weapon;
            if (weapon) {
                ctx.save();
                ctx.strokeStyle = ITEMS[weapon].color;
                ctx.fillStyle = ITEMS[weapon].color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(q.x + 10, q.y - 15);
                ctx.lineTo(q.x + 16, q.y - 36);
                ctx.stroke();
                if (weapon === 'granite_maul')
                    ctx.fillRect(q.x + 10, q.y - 39, 13, 7);
                else if (weapon === 'ash_staff') {
                    ctx.beginPath();
                    ctx.arc(q.x + 16, q.y - 36, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
            ctx.fillStyle = local ? '#ffe2a1' : '#91dbed';
            ctx.font = '12px system-ui';
            ctx.fillText(local ? 'You' : p.id === xamView?.id ? 'Xam' : p.id, q.x + 13, q.y - 35);
        }
    }
    const button = document.querySelector('#beacon-action');
    if (button)
        button.disabled = !id;
    const feedback = document.querySelector('#action-result');
    if (feedback)
        feedback.textContent = !id ? 'Join to meet Halden.' : game?.result ? ALL_RESULT_TEXT[game.result.code] : 'Speak to Halden at the near landing.';
    const inv = game?.inventory, choice = document.querySelector('#item-choice')?.value;
    const inventoryText = document.querySelector('#inventory-state');
    if (inventoryText)
        inventoryText.textContent = inv ? `Pack ${inv.slots.filter(Boolean).length}/20: ${inv.slots.filter((v) => v !== null).map(v => ITEMS[v].name).join(', ') || 'empty'} · Equipped: ${inv.weapon ? ITEMS[inv.weapon].name : 'none'}` : 'Join to open your pack.';
    const claim = document.querySelector('#item-claim'), equip = document.querySelector('#item-equip'), unequip = document.querySelector('#item-unequip');
    if (claim)
        claim.disabled = !id || game?.quest?.tithes !== 1 || !!inv?.rewardClaimed;
    if (equip)
        equip.disabled = !id || !inv?.slots.includes(choice);
    if (unequip)
        unequip.disabled = !id || !inv?.weapon;
    const f = game?.fighter, e = game?.encounter, tick = game?.tick ?? 0, w = WEAPONS[inv?.weapon ?? 'unarmed'];
    const combat = document.querySelector('#combat-state');
    if (combat)
        combat.textContent = f && e ? `You ${f.hp}/${game?.progression ? combatBonuses(game.progression).maxHealth : 40} · Warden ${e.hp}/80 · Victories ${f.wins} · ${f.hp === 0 ? 'Recovering' : e.hp === 0 ? 'Warden resting' : e.strikeAt ? 'Pulse in ' + Math.max(0, (e.strikeAt - tick) / 20).toFixed(1) + 's — guard or step away' : 'Approach the far landing'}` : 'Join to train at the far landing.';
    for (const kind of ['attack', 'guard']) {
        const b = document.querySelector('#combat-' + kind);
        if (b)
            b.disabled = !id || !f || f.hp === 0 || tick < (kind === 'attack' ? f.attackReady : f.guardReady) || (kind === 'attack' && e?.hp === 0);
    }
    const weaponText = document.querySelector('#weapon-stats');
    if (weaponText)
        weaponText.textContent = `${inv?.weapon ? ITEMS[inv.weapon].name : 'Unarmed'} · ${w.damage + (game?.progression ? (inv?.weapon === 'ash_staff' ? combatBonuses(game.progression).magicDamage : combatBonuses(game.progression).meleeDamage) : 0)} damage · ${w.range}m · ${(w.cooldown / 20).toFixed(1)}s`;
    const progress = game?.progression, training = document.querySelector('#training-mode'), skillText = document.querySelector('#skill-state');
    if (training) {
        training.disabled = !id;
        if (progress)
            training.value = progress.mode;
    }
    if (skillText)
        skillText.textContent = progress ? `Combat ${combatLevel(progress)} · ${Object.entries(levels(progress)).map(([k, v]) => k + ' ' + v + ' (' + progress.xp[k] + ' XP)').join(' · ')} · Training: ${progress.mode}` : 'Join to view your build.';
    const book = document.querySelector('#skill-book');
    if (book)
        book.textContent = game?.progression && game?.skilling ? skillBook(game.progression, game.skilling).map(row => `${row.name} ${row.level}/99 · ${row.xp.toLocaleString()} XP · ${row.maxed ? 'MAX' : row.remaining.toLocaleString() + ' to next'} · ${row.role} · ${row.status}`).join('\n') : 'Join to view all 23 skills.';
    const professions = game?.skilling, professionText = document.querySelector('#profession-state'), bankText = document.querySelector('#resource-bank');
    if (professionText)
        professionText.textContent = professions ? PROFESSIONS.map(k => `${k} ${level(professions.xp[k])} · ${professions.xp[k]} XP / next ${level(professions.xp[k]) === 99 ? 'max' : xpProgress(professions.xp[k]).nextThreshold}`).join(' | ') : 'Join to start gathering.';
    if (bankText)
        bankText.textContent = professions ? `Tools: ${professions.toolTier === 1 ? 'Starter' : TOOL_RECIPES[professions.toolTier].name} · yield ${professions.toolTier} · Pack ${Object.values(professions.pack).reduce((a, b) => a + b, 0)}/12: ${RESOURCES.map(k => k + ' ' + professions.pack[k]).join(', ')} · Bank: ${RESOURCES.map(k => k + ' ' + professions.bank[k]).join(', ')}` : 'Your resource bank is private.';
    const mine = players.find(p => p.id === id)?.position, nearTarget = (p, range) => !!mine && !!p && Math.hypot(mine.x - p.x, mine.y - p.y, mine.z - p.z) <= range;
    const practiceButton = document.querySelector('#practice-action'), practiceText = document.querySelector('#practice-state'), practiceChoice = document.querySelector('#practice-choice'), c = game?.practiceChallenge;
    const practiceNear = nearTarget(game?.camp, 3), practiceRemaining = Math.max(0, (game?.practiceReadyTick ?? 0) - tick), waiting = !!c && tick < c.readyTick;
    if (practiceButton)
        practiceButton.disabled = !id || !game?.fighter?.hp || !practiceNear || practiceRemaining > 0 || !!c;
    if (practiceChoice)
        practiceChoice.disabled = !!c;
    const cancel = document.querySelector('#practice-cancel');
    if (cancel)
        cancel.disabled = !id || !c;
    const padNames = ['Left', 'Upper', 'Right', 'Lower'];
    for (const b of document.querySelectorAll('[data-practice-pad]')) {
        const pad = Number(b.dataset.practicePad), marked = !!c && pad === c.target;
        b.disabled = !id || !c || waiting || !(c?.reward === 'gathering' ? nearTarget(game?.beacon.position, 8) : practiceNear) || !game?.fighter?.hp;
        b.textContent = (marked ? '★ ' : '') + (c ? PRACTICE_VERBS[c.skill][c.step] + ' · ' : '') + padNames[pad];
        b.style.background = marked ? '#66592c' : '';
        b.style.borderColor = marked ? '#f7df87' : '';
    }
    if (practiceText) {
        if (c)
            practiceText.textContent = `${c.skill} · action ${c.step + 1}/3: ${PRACTICE_VERBS[c.skill][c.step]} at ${padNames[c.target]}. ${waiting ? 'Settling… ' : ''}${Math.ceil((c.expiresTick - tick) / 20)}s remaining. Follow the marked target.`;
        else {
            const choice = practiceChoice?.value;
            practiceText.textContent = isPracticeSkill(choice) ? `${PRACTICE_METHODS[choice].description}. ${!practiceNear ? 'Move to Halden’s practice yard.' : practiceRemaining > 0 ? `Recovering: ${(practiceRemaining / 20).toFixed(1)}s` : 'Ready · three actions for 1 XP.'}` : 'Join to practise.';
        }
    }
    for (const b of document.querySelectorAll('[data-skilling]')) {
        const atCamp = b.dataset.skilling === 'deposit' || b.dataset.skilling === 'upgrade';
        b.disabled = !id || !professions || !game?.fighter?.hp || !nearTarget(atCamp ? game?.camp : game?.beacon.position, atCamp ? 3 : 8) || (!atCamp && (tick < professions.readyTick || tick < (game?.practiceReadyTick ?? 0) || !!game?.practiceChallenge));
    }
    const build = WEAPON_BUILDS[inv?.weapon ?? 'unarmed'];
    if (weaponText)
        weaponText.textContent += ` · tier ${build.tier} · ${Object.entries(build.requirements).map(([k, v]) => k + ' ' + v).join(', ') || 'no requirements'}`;
    const quest = game?.quest, panel = document.querySelector('#quest-progress');
    if (panel)
        panel.textContent = quest?.status === 'completed' ? `Completed · ${quest.tithes} offering token${game?.inventory?.rewardClaimed ? ' · reward claimed' : ''}` : quest?.status === 'active' ? `Reeds ${quest.reeds}/3 · ${quest.reeds === 3 ? 'Return to Halden' : 'Gather at the far landing'} · patch ${game.patch.stock}/3` : 'Halden needs three reed bundles from across the causeway.';
    for (const b of document.querySelectorAll('[data-quest]'))
        b.disabled = !id || (b.dataset.quest === 'accept' ? quest?.status !== 'available' : quest?.status !== 'active');
    if (game && !view3d) {
        const q = project(game.camp);
        ctx.fillStyle = '#ffe2a1';
        ctx.font = '12px system-ui';
        ctx.fillText('Halden · Quiet Tithe', q.x - 50, q.y + 30);
        const r = project(game.beacon.position);
        ctx.fillStyle = '#a9dc9a';
        ctx.fillText(`Reeds ${game.patch.stock}/3`, Math.min(r.x + 14, width - 100), r.y + 8);
    }
    stats.textContent = snapshot ? `${snapshot.players.length} nearby · tick ${snapshot.tick} · ${id ?? 'joining'}${frame.stale ? ' · waiting for server' : ''}` : 'No realm snapshot';
}
function sendDirection() {
    if (socket?.readyState !== WebSocket.OPEN || !id)
        return;
    const frame = buffer.sample(performance.now());
    const age = snapshot ? frame.ageMs : performance.now() - connectedAt;
    if (age >= 500)
        held.clear();
    if (age >= 5000) {
        status.textContent = 'Server updates stopped. Rejoin to reconnect.';
        socket.close(1000, 'snapshot_timeout');
        return;
    }
    // The client's queue is bounded too. Rejoin manually after a stalled connection.
    if (socket.bufferedAmount >= 65536) {
        status.textContent = 'Connection stalled. Disconnect and join again.';
        socket.close();
        return;
    }
    const manual = held.has('ArrowRight') || held.has('ArrowLeft') || held.has('ArrowUp') || held.has('ArrowDown');
    let dx = Number(held.has('ArrowRight')) - Number(held.has('ArrowLeft')) - Number(held.has('ArrowUp')) + Number(held.has('ArrowDown'));
    let dz = -Number(held.has('ArrowRight')) + Number(held.has('ArrowLeft')) - Number(held.has('ArrowUp')) + Number(held.has('ArrowDown'));
    const n = Math.max(1, Math.hypot(dx, dz));
    dx /= n;
    dz /= n;
    if (clickTarget && !manual) {
        const current = snapshot?.players.find(player => player.id === id)?.position;
        if (current) {
            const distance = Math.hypot(clickTarget.x - current.x, clickTarget.z - current.z);
            if (distance < .8)
                clickTarget = undefined;
            else {
                dx = (clickTarget.x - current.x) / distance;
                dz = (clickTarget.z - current.z) / distance;
            }
        }
    }
    else if (view3d) {
        const right = Number(held.has('ArrowRight')) - Number(held.has('ArrowLeft')), forward = Number(held.has('ArrowUp')) - Number(held.has('ArrowDown'));
        ({ dx, dz } = view3d.movementDirection(right, forward));
    }
    socket.send(encodeMoveIntent({ sequence: sequence++, dx, dz, mode: sprintKeys.size ? 'run' : travelMode }));
}
function stop() { sprintKeys.clear(); held.clear(); clickTarget = undefined; sendDirection(); }
function connect() {
    if (socket && socket.readyState < WebSocket.CLOSING)
        return;
    id = undefined;
    snapshot = undefined;
    game = undefined;
    sequence = 0;
    actionSequence = 0;
    xamFollowing = false;
    view3d?.followPlayer(undefined);
    cape.reset();
    configureWind();
    buffer.clear();
    characters.clear();
    sprintKeys.clear();
    held.clear();
    render();
    join.disabled = true;
    status.textContent = 'Joining the realm…';
    const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/socket`, REALM_SUBPROTOCOL);
    socket = ws;
    let failureMessage = '';
    ws.addEventListener('open', () => { leave.disabled = false; if (ws.protocol !== REALM_SUBPROTOCOL) {
        failureMessage = 'Server selected an incompatible protocol.';
        ws.close(1002);
        return;
    } ws.send(encodeHello()); });
    ws.addEventListener('message', event => {
        if (socket !== ws)
            return;
        try {
            if (typeof event.data !== 'string')
                throw new Error('Expected text');
            if (!id) {
                const welcome = decodeWelcome(event.data);
                id = welcome.id;
                connectedAt = performance.now();
                status.textContent = 'Connected. Explore the causeway and train at the far landing.';
                return;
            }
            if (JSON.parse(event.data)?.kind === 'game') {
                const next = decodeGameState(event.data);
                if (!game) {
                    const choice = document.querySelector('#appearance'), local = next.players.find(p => p.id === id);
                    if (choice && local)
                        choice.value = local.skin;
                }
                game = next;
                render();
                return;
            }
            const next = decodeRealmSnapshot(event.data);
            if (!next.players.some(p => p.id === id))
                throw new Error('Missing local player');
            if (!buffer.push(next, performance.now()))
                return;
            snapshot = next;
            render();
        }
        catch (error) {
            failureMessage = error instanceof CompatibilityError ? compatibilityMessage(error.code) : 'Invalid server data. Connection stopped.';
            status.textContent = failureMessage;
            ws.close(1002);
        }
    });
    ws.addEventListener('error', () => { status.textContent = 'Cannot reach the realm. Check your connection and try Join again.'; });
    ws.addEventListener('close', event => { if (socket !== ws)
        return; sprintKeys.clear(); held.clear(); id = undefined; snapshot = undefined; game = undefined; xamFollowing = false; view3d?.followPlayer(undefined); buffer.clear(); characters.clear(); join.disabled = false; leave.disabled = true; status.textContent = failureMessage || (event.reason === 'snapshot_timeout' ? 'Server updates stopped. Join again to reconnect.' : compatibilityMessage(event.reason)); render(); });
}
join.addEventListener('click', () => { void realmAudio.start(); realmAudio.play('click'); connect(); });
leave.addEventListener('click', () => { realmAudio.play('click'); stop(); socket?.close(); });
addEventListener('keydown', e => { if (typeof Element !== 'undefined' && e.target instanceof Element && e.target.closest('input,select,textarea,button,summary,a'))
    return; if (held.keyDown(e.key, e.code))
    e.preventDefault(); if (e.code === 'Space' || e.code === 'KeyG') {
    if (!e.repeat) {
        e.preventDefault();
        action('combat', e.code === 'Space' ? 'attack' : 'guard');
    }
    return;
} if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    sprintKeys.add(e.code);
    e.preventDefault();
} if (e.code === 'KeyV' && !e.repeat) {
    chooseTravel(travelMode === 'walk' ? 'jog' : travelMode === 'jog' ? 'run' : 'walk');
    e.preventDefault();
} if (e.code === 'KeyC' && !e.repeat) {
    view3d?.resetCamera();
    e.preventDefault();
} });
addEventListener('keyup', e => { if (e.code === 'ShiftLeft' || e.code === 'ShiftRight')
    sprintKeys.delete(e.code); held.keyUp(e.key, e.code); });
addEventListener('blur', stop);
document.addEventListener('visibilitychange', () => { if (document.hidden)
    stop(); render(); });
for (const button of Array.from(document.querySelectorAll('[data-direction]'))) {
    const direction = button.dataset.direction;
    button.addEventListener('pointerdown', e => { e.preventDefault(); button.setPointerCapture(e.pointerId); held.pointerDown(e.pointerId, direction); });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
        button.addEventListener(event, e => { held.pointerUp(e.pointerId); sendDirection(); });
}
const timer = setInterval(() => { if (!document.hidden)
    sendDirection(); }, 50);
addEventListener('pagehide', () => { visualClosed = true; void visualSurface?.then(surface => surface.close()).catch(() => { }); clearInterval(timer); cancelAnimationFrame(animationId); socket?.close(); graphics.close(); view3d = undefined; overlay?.remove(); });
addEventListener('resize', resize);
resize();
let lastPaint = 0;
function animate(now) { try {
    if (!document.hidden && now - lastPaint >= 1000 / (view3d ? 60 : 30)) {
        render();
        lastPaint = now;
    }
}
catch {
    const hint = document.querySelector('#render-status');
    if (hint)
        hint.textContent = 'Display update interrupted · controls and connection remain active';
}
finally {
    if (!visualClosed)
        animationId = requestAnimationFrame(animate);
} }
animationId = requestAnimationFrame(animate);
async function examineXam(show = false) { if (xamPending || visualClosed)
    return; xamPending = true; const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 3000); try {
    const response = await fetch(new URL('/npc/xam', location.href), { cache: 'no-store', signal: controller.signal });
    if (!response.ok)
        throw Error('Xam unavailable');
    xamView = checkedXamView(await response.json());
    if (show) {
        const text = document.querySelector('#xam-examine');
        if (text)
            text.textContent = xamView.examine + ' ' + xamView.phase + ' · Total level ' + xamView.totalLevel + ' · ' + xamView.totalXp.toLocaleString() + ' XP · Bank ' + Object.entries(xamView.bank).map(([k, n]) => k + ' ' + n).join(', ');
    }
}
catch {
    if (show) {
        const text = document.querySelector('#xam-examine');
        if (text)
            text.textContent = 'Xam is unavailable. His host must be running.';
    }
}
finally {
    clearTimeout(timeout);
    xamPending = false;
} }
document.querySelector('#xam-action')?.addEventListener('click', () => { void examineXam(true); });
document.querySelector('#xam-follow')?.addEventListener('click', () => { if (!xamView)
    return; xamFollowing = !xamFollowing; view3d?.followPlayer(xamFollowing ? xamView.id : undefined); render(); });
let dialogueIndex = 0;
document.querySelector('#npc-talk')?.addEventListener('click', () => {
    const position = snapshot?.players.find(p => p.id === id)?.position, npc = nearestNPC(castPlacements, position), text = document.querySelector('#npc-dialogue');
    if (text)
        text.textContent = npc ? NPC_PROTOTYPES[npc.id].name + ' · ' + NPC_PROTOTYPES[npc.id].lines[dialogueIndex++ % NPC_PROTOTYPES[npc.id].lines.length] : 'Move within three metres of a villager to talk.';
});
const accountStatus = document.querySelector('#account-status'), accountCode = document.querySelector('#account-code');
async function accountRequest(path, body) { const init = { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' }; if (body !== undefined)
    init.body = JSON.stringify(body); const response = await fetch(path, init); const value = await response.json().catch(() => ({})); if (!response.ok)
    throw Error(typeof value.error === 'string' ? value.error : 'request_failed'); return value; }
document.querySelector('#account-create-code')?.addEventListener('click', async () => { try {
    const value = await accountRequest('/api/profile/link-code');
    if (accountCode)
        accountCode.textContent = `Your link code: ${String(value.code)} · expires in 10 minutes`;
    if (accountStatus)
        accountStatus.textContent = 'Use this one-time code on another device, then reload the realm.';
}
catch {
    if (accountStatus)
        accountStatus.textContent = 'Cloud login is unavailable until the persistent realm server is running.';
} });
document.querySelector('#account-use-code')?.addEventListener('click', async () => { const input = document.querySelector('#account-link-code'), code = input?.value.trim().toUpperCase(); if (!code) {
    if (accountStatus)
        accountStatus.textContent = 'Enter the 10-character link code first.';
    return;
} try {
    await accountRequest('/api/profile/link-login', { code });
    if (accountStatus)
        accountStatus.textContent = 'Cloud save connected. Reloading your character…';
    setTimeout(() => location.reload(), 300);
}
catch {
    if (accountStatus)
        accountStatus.textContent = 'That link code is invalid or expired.';
} });
