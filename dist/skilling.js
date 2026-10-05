import { level, MAX_XP } from './progression.js';
export const PROFESSIONS = ['woodcutting', 'mining', 'fishing'];
export const SKILLING_SKILLS = ['woodcutting', 'mining', 'fishing', 'agility', 'cooking', 'crafting', 'firemaking', 'fletching', 'herblore', 'runecrafting', 'slayer', 'smithing', 'thieving', 'farming', 'construction', 'hunter'];
export const RESOURCES = ['logs', 'ore', 'fish', 'warden_essence'];
export const TOOL_RECIPES = Object.freeze({ 2: Object.freeze({ level: 2, material: 3, essence: 1, name: 'Artisan' }), 3: Object.freeze({ level: 5, material: 20, essence: 5, name: 'Masterwork' }) });
const empty = () => ({ logs: 0, ore: 0, fish: 0, warden_essence: 0 });
export const freshSkilling = () => ({ xp: Object.fromEntries(SKILLING_SKILLS.map(k => [k, 0])), pack: empty(), bank: empty(), toolTier: 1, readyTick: 0 });
export function parseBankTransfer(value) {
    if (typeof value !== 'string')
        return;
    const match = /^(deposit|withdraw):(logs|ore|fish|warden_essence):(all|[1-9][0-9]{0,6})$/.exec(value);
    if (!match)
        return;
    const amount = match[3] === 'all' ? 'all' : Number(match[3]);
    if (typeof amount === 'number' && (!Number.isSafeInteger(amount) || amount > 1000000))
        return;
    return { operation: match[1], resource: match[2], amount };
}
export const isSkillCommand = (v) => typeof v === 'string' && ([...PROFESSIONS, 'deposit', 'upgrade'].includes(v) || !!parseBankTransfer(v));
export function checkedSkilling(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw Error('Invalid skilling');
    const s = value;
    const counts = (v, keys, cap) => !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).sort().join() === [...keys].sort().join() && Object.values(v).every(n => Number.isSafeInteger(n) && n >= 0 && n <= cap);
    if (Object.keys(s).sort().join() !== 'bank,pack,readyTick,toolTier,xp' || !counts(s.xp, SKILLING_SKILLS, MAX_XP) || !counts(s.pack, RESOURCES, 12) || !counts(s.bank, RESOURCES, 1000000) || Object.values(s.pack).reduce((a, b) => a + b, 0) > 12 || ![1, 2, 3].includes(s.toolTier) || !Number.isSafeInteger(s.readyTick) || s.readyTick < 0)
        throw Error('Invalid skilling');
    if (s.toolTier > 1 && !PROFESSIONS.every(k => level(s.xp[k]) >= TOOL_RECIPES[s.toolTier].level))
        throw Error('Invalid tool requirements');
    return { xp: { ...s.xp }, pack: { ...s.pack }, bank: { ...s.bank }, toolTier: s.toolTier, readyTick: s.readyTick };
}
/** Called only inside the detached server transaction after a range check. */
export function skillAction(s, command, tick) {
    checkedSkilling(s);
    if (!Number.isSafeInteger(tick) || tick < 0 || tick > Number.MAX_SAFE_INTEGER - 40)
        throw Error('Invalid skilling clock');
    if (command === 'deposit') {
        if (RESOURCES.some(k => s.bank[k] + s.pack[k] > 1000000))
            return 'skill_bank_full';
        for (const k of RESOURCES) {
            s.bank[k] += s.pack[k];
            s.pack[k] = 0;
        }
        return 'skill_banked';
    }
    if (command === 'upgrade') {
        if (s.toolTier === 3)
            return 'skill_max_tool';
        const nextTier = s.toolTier === 1 ? 2 : 3, recipe = TOOL_RECIPES[nextTier];
        if (!PROFESSIONS.every(k => level(s.xp[k]) >= recipe.level) || s.bank.logs < recipe.material || s.bank.ore < recipe.material || s.bank.fish < recipe.material || s.bank.warden_essence < recipe.essence)
            return 'skill_requirements';
        for (const k of ['logs', 'ore', 'fish'])
            s.bank[k] -= recipe.material;
        s.bank.warden_essence -= recipe.essence;
        s.toolTier = nextTier;
        return 'skill_upgraded';
    }
    const transfer = parseBankTransfer(command);
    if (transfer) {
        const { operation, resource, amount } = transfer;
        if (operation === 'deposit') {
            const quantity = amount === 'all' ? Math.min(s.pack[resource], 1000000 - s.bank[resource]) : amount;
            if (quantity === 0)
                return s.pack[resource] === 0 ? 'skill_pack_empty' : 'skill_bank_full';
            if (quantity > s.pack[resource])
                return 'skill_transfer_unavailable';
            if (s.bank[resource] + quantity > 1000000)
                return 'skill_bank_full';
            s.pack[resource] -= quantity;
            s.bank[resource] += quantity;
            return 'skill_banked';
        }
        const capacity = 12 - Object.values(s.pack).reduce((a, b) => a + b, 0), available = s.bank[resource];
        if (available === 0)
            return 'skill_bank_empty';
        if (capacity === 0)
            return 'skill_pack_full';
        const quantity = amount === 'all' ? Math.min(available, capacity) : amount;
        if (quantity > available)
            return 'skill_bank_empty';
        if (quantity > capacity)
            return 'skill_pack_full';
        s.bank[resource] -= quantity;
        s.pack[resource] += quantity;
        return 'skill_withdrawn';
    }
    if (!PROFESSIONS.includes(command))
        throw new Error('Invalid skill command');
    const profession = command;
    if (tick < s.readyTick)
        return 'skill_wait';
    const yieldCount = s.toolTier;
    if (Object.values(s.pack).reduce((a, b) => a + b, 0) + yieldCount > 12)
        return 'skill_pack_full';
    const resource = { woodcutting: 'logs', mining: 'ore', fishing: 'fish' };
    s.pack[resource[profession]] += yieldCount;
    s.xp[profession] = Math.min(MAX_XP, s.xp[profession] + 25);
    s.readyTick = tick + gatheringBonuses(s.xp[profession]).cooldownTicks;
    return 'skill_gathered';
}
export function awardWardenEssence(s) { checkedSkilling(s); s.bank.warden_essence = Math.min(1000000, s.bank.warden_essence + 1); }
export function gatheringBonuses(xp) { const n = level(xp); return { level: n, cooldownTicks: Math.max(20, 40 - Math.floor((n - 1) / 5)), toolYieldBonus: 0 }; }
export function awardNoncombatXP(s, skill, amount) { checkedSkilling(s); if (!SKILLING_SKILLS.includes(skill) || !Number.isSafeInteger(amount) || amount < 0 || amount > MAX_XP)
    throw Error('Invalid skilling award'); s.xp[skill] = Math.min(MAX_XP, s.xp[skill] + amount); }
export function migrateSkilling(value) { if (!value || typeof value !== 'object' || Array.isArray(value))
    throw Error('Invalid legacy skilling'); const s = value; if (Object.keys(s).sort().join() !== 'bank,pack,readyTick,toolTier,xp' || !s.xp || typeof s.xp !== 'object' || Object.keys(s.xp).sort().join() !== [...PROFESSIONS].sort().join())
    throw Error('Invalid legacy professions'); if (!Object.values(s.xp).every(n => Number.isSafeInteger(n) && n >= 0 && n <= 960400))
    throw Error('Invalid legacy XP'); return checkedSkilling({ ...s, xp: { ...freshSkilling().xp, ...s.xp } }); }
/** Server-only, atomic one-unit bonus for an active resonance effect. */
export function grantResonanceGatherBonus(s, profession, xp = 10) {
    checkedSkilling(s);
    if (!PROFESSIONS.includes(profession) || !Number.isSafeInteger(xp) || xp < 0 || xp > 1000)
        throw Error('Invalid resonance gathering bonus');
    if (Object.values(s.pack).reduce((a, b) => a + b, 0) >= 12)
        return false;
    const resource = { woodcutting: 'logs', mining: 'ore', fishing: 'fish' };
    s.pack[resource[profession]] += 1;
    awardNoncombatXP(s, profession, xp);
    return true;
}
