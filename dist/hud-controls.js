export const HUD_TABS = ['practice', 'combat', 'gathering', 'quest', 'inventory', 'codex', 'settings'];
export const isHudTab = (x) => typeof x === 'string' && HUD_TABS.includes(x);
export function initRealmHud(doc = document) {
    let compact = false, tab = 'practice', size = 'normal', height = 55, visual = true, living = true;
    try {
        const raw = globalThis.localStorage?.getItem('wayfarer.hud.v1') ?? 'null';
        const saved = raw.length <= 1024 ? JSON.parse(raw) : null;
        if (saved && isHudTab(saved.tab) && typeof saved.compact === 'boolean') {
            tab = saved.tab;
            compact = saved.compact;
            if (['small', 'normal', 'large'].includes(saved.size))
                size = saved.size;
            if (Number.isInteger(saved.height) && saved.height >= 35 && saved.height <= 80)
                height = saved.height;
            if (typeof saved.visual === 'boolean')
                visual = saved.visual;
            if (typeof saved.living === 'boolean')
                living = saved.living;
        }
    }
    catch { }
    const save = () => { try {
        globalThis.localStorage?.setItem('wayfarer.hud.v1', JSON.stringify({ tab, compact, size, height, visual, living }));
    }
    catch { } };
    const apply = () => { const body = doc.body; body?.setAttribute?.('data-hud-size', size); body?.style?.setProperty('--hud-height', height + 'dvh'); const v = doc.querySelector('#visual-surface'), l = doc.querySelector('#living-realm'); if (v)
        v.hidden = !visual; if (l)
        l.hidden = !living; const sz = doc.querySelector('#hud-size'), ht = doc.querySelector('#hud-height'), vc = doc.querySelector('#show-visual'), lc = doc.querySelector('#show-living'); if (sz)
        sz.value = size; if (ht)
        ht.value = String(height); const label = doc.querySelector('#hud-height-value'); if (label)
        label.textContent = height + '%'; if (vc)
        vc.checked = visual; if (lc)
        lc.checked = living; doc.querySelector('footer')?.classList?.toggle('hud-collapsed', compact); const toggle = doc.querySelector('#hud-toggle'); if (toggle) {
        toggle.textContent = compact ? '▣ Open game panels' : '▣ Minimise game panels';
        toggle.setAttribute?.('aria-expanded', String(!compact));
    } for (const p of doc.querySelectorAll('[data-hud-panel]'))
        p.hidden = p.dataset.hudPanel !== tab; for (const b of doc.querySelectorAll('[data-hud-tab]')) {
        const active = b.dataset.hudTab === tab;
        b.setAttribute?.('aria-selected', String(active));
        b.setAttribute?.('tabindex', active ? '0' : '-1');
    } };
    const choose = (value) => { if (isHudTab(value)) {
        tab = value;
        compact = false;
        apply();
        save();
    } };
    for (const b of doc.querySelectorAll('[data-hud-tab]')) {
        b.addEventListener('click', () => choose(b.dataset.hudTab));
        b.addEventListener('keydown', event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
            return; event.preventDefault(); const index = HUD_TABS.indexOf(tab), next = event.key === 'Home' ? 0 : event.key === 'End' ? HUD_TABS.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + HUD_TABS.length) % HUD_TABS.length; choose(HUD_TABS[next]); doc.querySelector(`[data-hud-tab="${tab}"]`)?.focus?.(); });
    }
    doc.querySelector('#hud-reset')?.addEventListener('click', () => { compact = false; tab = 'settings'; size = 'normal'; height = 55; visual = true; living = true; apply(); save(); });
    doc.querySelector('#hud-close')?.addEventListener('click', () => { compact = true; apply(); save(); doc.querySelector('#hud-toggle')?.focus?.(); });
    doc.querySelector('#hud-size')?.addEventListener('change', () => { const value = doc.querySelector('#hud-size')?.value; if (['small', 'normal', 'large'].includes(value ?? '')) {
        size = value;
        apply();
        save();
    } });
    doc.querySelector('#hud-height')?.addEventListener('input', () => { const value = Number(doc.querySelector('#hud-height')?.value); if (Number.isInteger(value) && value >= 35 && value <= 80) {
        height = value;
        apply();
        save();
    } });
    for (const key of ['visual', 'living']) {
        doc.querySelector('#show-' + key)?.addEventListener('change', () => { const enabled = !!doc.querySelector('#show-' + key)?.checked; if (key === 'visual')
            visual = enabled;
        else
            living = enabled; apply(); save(); });
        doc.querySelector('#close-' + key)?.addEventListener('click', () => { if (key === 'visual')
            visual = false;
        else
            living = false; apply(); save(); doc.querySelector('#hud-toggle')?.focus?.(); });
    }
    doc.addEventListener?.('keydown', event => { if (event.key === 'Escape' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target?.tagName)) {
        compact = true;
        apply();
        save();
    } });
    doc.querySelector('#hud-toggle')?.addEventListener('click', () => { compact = !compact; apply(); save(); });
    apply();
    return { choose, get state() { return { tab, compact, size, height, visual, living }; } };
}
