import { STEP_MS } from './fixed-clock.js';
import { RESONANCE_NODES, encodeResonanceCast, resonanceEffect, resolveResonanceChord } from './resonance-codex.js';
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const text = (value) => value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 220);
class TonePlayer {
    context;
    muted = false;
    play(frequency) { if (this.muted || typeof AudioContext === 'undefined')
        return; try {
        this.context ??= new AudioContext();
        const ctx = this.context;
        if (ctx.state === 'suspended')
            void ctx.resume();
        const osc = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.value = clamp(frequency, 80, 1200);
        gain.gain.setValueAtTime(.0001, now);
        gain.gain.exponentialRampToValueAtTime(.055, now + .015);
        gain.gain.exponentialRampToValueAtTime(.0001, now + .28);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + .3);
    }
    catch { } }
    close() { void this.context?.close().catch(() => { }); this.context = undefined; }
}
export function initRealmInterface(doc = document, onSelection, onCast) {
    const canvas = doc.querySelector('#realm-minimap'), ctx = canvas?.getContext('2d') ?? null, chatLog = doc.querySelector('#realm-chat-log'), chatStatus = doc.querySelector('#realm-chat-status'), selectionText = doc.querySelector('#codex-selection'), effectText = doc.querySelector('#codex-effect'), cast = doc.querySelector('#codex-cast'), wheel = doc.querySelector('#codex-wheel'), mute = doc.querySelector('#codex-mute');
    const tone = new TonePlayer();
    let selected = [], lastSelectionKey = '', lastServerChord = '', priorResult = '', connected = false, pendingCast = false;
    const lines = [];
    const system = (message) => { const clean = text(message); if (!clean || lines.at(-1) === clean)
        return; lines.push(clean); if (lines.length > 48)
        lines.splice(0, lines.length - 48); if (chatLog) {
        chatLog.replaceChildren(...lines.slice(-12).map(line => { const p = doc.createElement('p'); p.textContent = line; return p; }));
        chatLog.scrollTop = chatLog.scrollHeight;
    } };
    const refreshSelection = () => { for (const button of doc.querySelectorAll('[data-resonance-node]')) {
        const active = selected.includes(button.dataset.resonanceNode);
        button.setAttribute('aria-pressed', String(active));
        button.classList.toggle('is-selected', active);
    } if (selectionText)
        selectionText.textContent = selected.length ? selected.map(id => RESONANCE_NODES.find(n => n.id === id).name).join(' · ') : 'Choose three runes.'; const key = selected.join('+'); if (key !== lastSelectionKey) {
        lastSelectionKey = key;
        onSelection?.(selected);
    } };
    const refreshAuthority = (game) => {
        const state = game?.resonance, tick = game?.tick ?? 0, cooldownTicks = state ? Math.max(0, state.readyTick - tick) : 0, active = state?.activeEffect ? resonanceEffect(state.activeEffect) : undefined, activeTicks = state ? Math.max(0, state.activeUntilTick - tick) : 0;
        if (effectText) {
            if (active)
                effectText.textContent = `Authority active · ${active.name} · ${(activeTicks * STEP_MS / 1000).toFixed(1)}s · ${active.description}`;
            else if (selected.length === 3) {
                const chord = resolveResonanceChord(selected);
                effectText.textContent = `Preview · ${chord.effect.name} · ${chord.effect.description}`;
            }
            else
                effectText.textContent = 'Three notes form one server-validated utility chord.';
        }
        if (cast) {
            cast.disabled = !connected || !state || selected.length !== 3 || cooldownTicks > 0 || pendingCast;
            cast.textContent = !connected ? 'Join realm to resonate' : pendingCast ? 'Awaiting realm…' : cooldownTicks > 0 ? `Settling · ${(cooldownTicks * STEP_MS / 1000).toFixed(1)}s` : 'Resonate chord';
        }
        if (state?.lastChord.length === 3) {
            const key = state.lastChord.join('+') + ':' + (state.activeEffect ?? '');
            if (key !== lastServerChord) {
                lastServerChord = key;
                const chord = resolveResonanceChord(state.lastChord);
                if (state.activeEffect) {
                    const effect = resonanceEffect(state.activeEffect);
                    system(`PolyCodex authority · ${chord.name} → ${effect.name}.`);
                    onSelection?.(state.lastChord, effect);
                    for (const id of state.lastChord)
                        tone.play(RESONANCE_NODES.find(n => n.id === id).toneHz);
                }
            }
        }
    };
    if (wheel) {
        for (const [index, node] of RESONANCE_NODES.entries()) {
            const button = doc.createElement('button');
            button.type = 'button';
            button.dataset.resonanceNode = node.id;
            button.className = 'codex-node';
            button.setAttribute('aria-label', `${node.name}, note ${node.note}, resonance ${node.value}`);
            button.setAttribute('aria-pressed', 'false');
            button.title = `${node.name} · ${node.note} · codex ${node.value}`;
            button.innerHTML = `<span>${node.rune}</span><small>${node.note}</small>`;
            const angle = index / RESONANCE_NODES.length * Math.PI * 2 - Math.PI / 2;
            button.style.left = `${50 + 42 * Math.cos(angle)}%`;
            button.style.top = `${50 + 42 * Math.sin(angle)}%`;
            button.style.setProperty('--node-color', node.color);
            button.addEventListener('click', () => { const at = selected.indexOf(node.id); if (at >= 0)
                selected.splice(at, 1);
            else if (selected.length < 3)
                selected.push(node.id);
            else {
                selected.shift();
                selected.push(node.id);
            } tone.play(node.toneHz); refreshSelection(); refreshAuthority(lastInput?.game); });
            wheel.append(button);
        }
    }
    let lastInput;
    cast?.addEventListener('click', () => { if (!lastInput?.game?.resonance || selected.length !== 3 || pendingCast)
        return; const state = lastInput.game.resonance; if (lastInput.game.tick < state.readyTick)
        return; pendingCast = true; onCast?.(encodeResonanceCast(selected)); refreshAuthority(lastInput.game); });
    mute?.addEventListener('change', () => { tone.muted = !!mute.checked; });
    for (const button of doc.querySelectorAll('[data-chat-tab]'))
        button.addEventListener('click', () => { const channel = button.dataset.chatTab; for (const b of doc.querySelectorAll('[data-chat-tab]'))
            b.setAttribute('aria-selected', String(b === button)); if (chatStatus)
            chatStatus.textContent = channel === 'system' ? 'System events from this client and authoritative realm.' : 'Public chat transport is not enabled in this build; no simulated players are presented as real users.'; });
    const draw = (input) => {
        if (!canvas || !ctx)
            return;
        const dpr = Math.min(2, globalThis.devicePixelRatio || 1), size = 180;
        if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
            canvas.width = size * dpr;
            canvas.height = size * dpr;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.beginPath();
        ctx.arc(90, 90, 84, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#0b1720e8';
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = '#385767';
        ctx.lineWidth = 1;
        for (const r of [28, 56, 84]) {
            ctx.beginPath();
            ctx.arc(90, 90, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        const local = input.snapshot?.players.find(p => p.id === input.localId), scale = 3.0, plot = (x, z, color, radius) => { if (!local)
            return; const px = 90 + (x - local.position.x) * scale, pz = 90 + (z - local.position.z) * scale; if ((px - 90) ** 2 + (pz - 90) ** 2 > 82 ** 2)
            return; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, pz, radius, 0, Math.PI * 2); ctx.fill(); };
        if (input.game) {
            plot(input.game.camp.x, input.game.camp.z, '#e9c77d', 4);
            plot(input.game.codex.x, input.game.codex.z, '#e879ff', 4.5);
            plot(input.game.beacon.position.x, input.game.beacon.position.z, input.game.beacon.lit ? '#65ecff' : '#82b8b0', 4.5);
            const effect = input.game.resonance?.activeEffect;
            if (effect === 'miners-echo' || effect === 'tide-whisper' || effect === 'lantern-bloom') {
                const target = effect === 'lantern-bloom' ? input.game.camp : input.game.beacon.position, px = 90 + (target.x - (local?.position.x ?? target.x)) * scale, pz = 90 + (target.z - (local?.position.z ?? target.z)) * scale;
                ctx.strokeStyle = effect === 'miners-echo' ? '#ffd66e' : effect === 'tide-whisper' ? '#63dbe6' : '#8fe58c';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(px, pz, 7 + Math.sin(input.now * .008) * 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        for (const npc of input.npcs)
            plot(npc.position.x, npc.position.z, '#8cd6a6', 2.6);
        for (const p of input.snapshot?.players ?? [])
            if (p.id !== input.localId)
                plot(p.position.x, p.position.z, '#69b9ff', 3);
        if (local) {
            plot(local.position.x, local.position.z, '#ffffff', 4.2);
            const effect = input.game?.resonance?.activeEffect;
            if (effect) {
                ctx.strokeStyle = effect === 'ward-glimmer' ? '#b69cff' : effect === 'lantern-bloom' ? '#ffd776' : '#74d9ef';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(90, 90, 10 + Math.sin(input.now * .01) * 2, 0, Math.PI * 2);
                ctx.stroke();
                if (effect === 'pathfinders-gleam') {
                    ctx.beginPath();
                    ctx.moveTo(90, 78);
                    ctx.lineTo(90, 50);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(90, 48);
                    ctx.lineTo(85, 56);
                    ctx.lineTo(95, 56);
                    ctx.closePath();
                    ctx.fillStyle = '#d9f7ff';
                    ctx.fill();
                }
                if (effect === 'starlight-trace') {
                    ctx.fillStyle = '#d8ccff';
                    for (let i = 0; i < 8; i++) {
                        const a = i * Math.PI / 4 + input.now * .0004;
                        ctx.fillRect(90 + Math.cos(a) * 18 - 1, 90 + Math.sin(a) * 18 - 1, 2, 2);
                    }
                }
            }
        }
        ctx.restore();
        ctx.strokeStyle = '#c9ae73';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(90, 90, 85, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#f4dfaa';
        ctx.font = 'bold 11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('N', 90, 12);
        ctx.beginPath();
        ctx.moveTo(90, 17);
        ctx.lineTo(86, 26);
        ctx.lineTo(94, 26);
        ctx.closePath();
        ctx.fill();
    };
    const update = (input) => { lastInput = input; refreshAuthority(input.game); draw(input); const code = input.game?.result?.code ?? ''; if (code && code !== priorResult) {
        priorResult = code;
        pendingCast = false;
        system(`Realm · ${code.replaceAll('_', ' ')}.`);
    } if (input.game?.resonance && input.game.tick >= input.game.resonance.readyTick)
        pendingCast = false; };
    const connection = (value) => { connected = value; if (!value)
        pendingCast = false; system(value ? 'Connected to the authoritative realm.' : 'Disconnected from the realm.'); refreshAuthority(lastInput?.game); };
    refreshSelection();
    refreshAuthority(undefined);
    system('System · PolyCodex v1.2 ready. Chords are validated and resolved by the authoritative realm.');
    return { update, system, connection, dispose() { tone.close(); } };
}
