/** Local action registry: the same gate runs for toolbar and keyboard dispatch. */
export class Multitool {
    actions;
    constructor(actions) {
        if (!actions.length || actions.length > 32 || new Set(actions.map(a => a.id)).size !== actions.length || new Set(actions.filter(a => a.key).map(a => a.key.toLowerCase())).size !== actions.filter(a => a.key).length || actions.some(a => !a.id || !a.label || !a.tooltip || typeof a.run !== 'function'))
            throw new Error('Invalid tool registry');
        this.actions = Object.freeze(actions.map(a => Object.freeze({ ...a })));
    }
    reason(id) { const action = this.actions.find(a => a.id === id); return action ? action.unavailable?.() : 'Unknown tool'; }
    execute(id) { const a = this.actions.find(a => a.id === id); if (!a)
        return { ok: false, reason: 'Unknown tool' }; const reason = a.unavailable?.(); if (reason)
        return { ok: false, reason }; try {
        a.run();
        return { ok: true };
    }
    catch {
        return { ok: false, reason: 'Action failed' };
    } }
    key(key) { const a = this.actions.find(a => a.key?.toLowerCase() === key.toLowerCase()); return a ? this.execute(a.id) : { ok: false, reason: 'Unknown shortcut' }; }
}
/** Buttons, titles, disabled explanations and shortcuts share a single registry. */
export function mountToolbar(registry, container, report = () => { }) {
    const buttons = registry.actions.map(action => { const button = document.createElement('button'); button.textContent = action.label; button.type = 'button'; button.dataset.action = action.id; button.addEventListener('click', () => { report(registry.execute(action.id)); refresh(); }); container.append(button); return { action, button }; });
    function refresh() { for (const { action, button } of buttons) {
        const reason = registry.reason(action.id);
        button.disabled = !!reason;
        button.title = `${action.tooltip}${action.key ? ` (${action.key})` : ''}${reason ? ` — ${reason}` : ''}`;
        button.setAttribute('aria-label', `${action.label}${reason ? `: ${reason}` : ''}`);
    } }
    function keyboard(event) { const target = event.target; if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || target?.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(target?.tagName ?? ''))
        return; if (registry.actions.some(a => a.key?.toLowerCase() === event.key.toLowerCase())) {
        event.preventDefault();
        report(registry.key(event.key));
        refresh();
    } }
    addEventListener('keydown', keyboard);
    refresh();
    return { refresh, dispose() { removeEventListener('keydown', keyboard); buttons.forEach(({ button }) => button.remove()); } };
}
