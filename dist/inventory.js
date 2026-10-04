/** Server-owned pack. Item IDs are commands; quantities and grants never come from clients. */
export const ITEMS = Object.freeze({ reed_blade: Object.freeze({ name: 'Reed blade', color: '#bfe097' }), ash_staff: Object.freeze({ name: 'Ash staff', color: '#ba98e8' }), granite_maul: Object.freeze({ name: 'Granite maul', color: '#b6c1ce' }) });
export const isItem = (v) => typeof v === 'string' && Object.hasOwn(ITEMS, v);
export const freshInventory = () => ({ slots: Array(20).fill(null), weapon: null, rewardClaimed: false });
export const copyInventory = (v) => ({ ...v, slots: [...v.slots] });
export function checkedInventory(v) {
    if (!v || typeof v !== 'object' || Array.isArray(v))
        throw Error('Invalid inventory');
    const r = v;
    if (Object.keys(r).sort().join(',') !== 'rewardClaimed,slots,weapon' || !Array.isArray(r.slots) || r.slots.length !== 20 || !Array.from(r.slots).every(x => x === null || isItem(x)) || !(r.weapon === null || isItem(r.weapon)) || typeof r.rewardClaimed !== 'boolean')
        throw Error('Invalid inventory');
    // This slice has exactly one legal item source: one Quiet Tithe reward per session.
    const count = r.slots.filter(Boolean).length + Number(r.weapon !== null);
    if (count !== (r.rewardClaimed ? 1 : 0))
        throw Error('Invalid inventory conservation');
    return copyInventory(r);
}
export function grantReward(v, item) { const next = checkedInventory(v), slot = next.slots.indexOf(null); if (next.rewardClaimed || slot < 0 || !isItem(item))
    return; next.slots[slot] = item; next.rewardClaimed = true; return next; }
export function equipItem(v, item) { const next = checkedInventory(v), slot = next.slots.indexOf(item); if (slot < 0)
    return; next.slots[slot] = next.weapon; next.weapon = item; return next; }
export function unequipItem(v) { const next = checkedInventory(v), slot = next.slots.indexOf(null); if (next.weapon === null || slot < 0)
    return; next.slots[slot] = next.weapon; next.weapon = null; return next; }
