import { ALL_SKILLS } from './skill-directory.js';
import { MAX_XP } from './progression.js';
import { checkedInventory } from './inventory.js';
import { RESOURCES } from './skilling.js';
export function checkedXamView(value) { const v = value; if (!v || typeof v !== 'object' || v.kind !== 'xam' || v.name !== 'Xam' || v.protected !== true || v.untouchable !== true || v.autoRetaliate !== false || v.collision !== 'nonblocking' || v.armor !== 'legendary_holographic_rustic' || v.mainHand !== 'diamond_scythe' || v.offHand !== 'gilded_secateurs' || !/^p[1-9][0-9]{0,15}$/.test(v.id) || !v.position || ![v.position.x, v.position.y, v.position.z].every(n => Number.isFinite(n) && Math.abs(n) <= 1e6) || typeof v.phase !== 'string' || v.phase.length > 80 || typeof v.examine !== 'string' || v.examine.length > 200 || !Array.isArray(v.skills) || v.skills.length !== ALL_SKILLS.length)
    throw Error('Invalid Xam view'); for (const [i, row] of v.skills.entries())
    if (row.id !== ALL_SKILLS[i] || !Number.isInteger(row.level) || row.level < 1 || row.level > 99 || !Number.isSafeInteger(row.xp) || row.xp < 0 || row.xp > MAX_XP)
        throw Error('Invalid Xam skills'); if (v.totalXp !== v.skills.reduce((n, s) => n + s.xp, 0) || v.totalLevel !== v.skills.reduce((n, s) => n + s.level, 0))
    throw Error('Invalid Xam totals'); for (const [counts, cap] of [[v.pack, 12], [v.bank, 1000000]])
    if (!counts || Object.keys(counts).sort().join() !== [...RESOURCES].sort().join() || !Object.values(counts).every(n => Number.isSafeInteger(n) && n >= 0 && n <= cap))
        throw Error('Invalid Xam storage'); if (Object.values(v.pack).reduce((a, b) => a + b, 0) > 12)
    throw Error('Invalid Xam pack'); return { ...v, position: { ...v.position }, skills: v.skills.map(s => ({ ...s })), inventory: checkedInventory(v.inventory), pack: { ...v.pack }, bank: { ...v.bank } }; }
