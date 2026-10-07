/** Server-owned pack. Item IDs are commands; quantities and grants never come from clients. */
export const ITEMS = Object.freeze({ reed_blade: Object.freeze({ name: 'Reed blade', color: '#bfe097' }), ash_staff: Object.freeze({ name: 'Ash staff', color: '#ba98e8' }), granite_maul: Object.freeze({ name: 'Granite maul', color: '#b6c1ce' }), steel_warhammer: Object.freeze({ name: 'Steel warhammer', color: '#d7dee8' }), steel_battleaxe: Object.freeze({ name: 'Steel battleaxe', color: '#d7dee8' }), steel_dagger: Object.freeze({ name: 'Steel dagger', color: '#c8d6e5' }), steel_sword: Object.freeze({ name: 'Steel sword', color: '#eff6ff' }), steel_rapier: Object.freeze({ name: 'Steel rapier', color: '#dbeafe' }) });
export const isItem = (v) => typeof v === 'string' && Object.hasOwn(ITEMS, v);
export const freshInventory = () => ({ slots: Array(20).fill(null), weapon: null, rewardClaimed: false });
export const copyInventory = (v) => ({ ...v, slots: [...v.slots] });
export function checkedInventory(v) {
    if (!v || typeof v !== 'object' || Array.isArray(v))
        throw Error('Invalid inventory');
    const r = v;
    const keys = Object.keys(r).sort().join(',');
    if (!(['rewardClaimed,slots,weapon', 'lootCount,rewardClaimed,slots,weapon', 'rewardClaimed,slots,stored,weapon'].includes(keys)) || !Array.isArray(r.slots) || r.slots.length !== 20 || !Array.from(r.slots).every(x => x === null || isItem(x)) || !(r.weapon === null || isItem(r.weapon)) || typeof r.rewardClaimed !== 'boolean')
        throw Error('Invalid inventory');
    // This slice has exactly one legal item source: one Quiet Tithe reward per session.
    const rewardItems = new Set(['reed_blade', 'ash_staff', 'granite_maul']);
    const count = r.slots.filter(x => x !== null && rewardItems.has(x)).length + Number(r.weapon !== null && rewardItems.has(r.weapon));
    if (count !== (r.rewardClaimed ? 1 : 0))
        throw Error('Invalid inventory conservation');
    const steelCount = r.slots.filter(x => typeof x === 'string' && x.startsWith('steel_')).length;
    const lootCount = typeof r.lootCount === 'number' ? r.lootCount : (keys === 'rewardClaimed,slots,stored,weapon' ? 0 : undefined);
    if (lootCount !== undefined && (!Number.isSafeInteger(lootCount) || lootCount < 0 || lootCount !== steelCount))
        throw Error('Invalid loot count');
    return { ...copyInventory(r), ...(lootCount === undefined ? {} : { lootCount }) };
}
export function grantReward(v, item) { const next = checkedInventory(v), slot = next.slots.indexOf(null); if (next.rewardClaimed || slot < 0 || !isItem(item))
    return; next.slots[slot] = item; next.rewardClaimed = true; return next; }
export function equipItem(v, item) { const next = checkedInventory(v), slot = next.slots.indexOf(item); if (slot < 0)
    return; next.slots[slot] = next.weapon; next.weapon = item; return next; }
export function unequipItem(v) { const next = checkedInventory(v), slot = next.slots.indexOf(null); if (next.weapon === null || slot < 0)
    return; next.slots[slot] = next.weapon; next.weapon = null; return next; }
export function grantLoot(v, item) { const next = checkedInventory(v), slot = next.slots.indexOf(null); if (slot < 0 || !isItem(item) || item === 'reed_blade' || item === 'ash_staff' || item === 'granite_maul')
    return; next.slots[slot] = item; next.lootCount = (next.lootCount ?? 0) + 1; return next; }
