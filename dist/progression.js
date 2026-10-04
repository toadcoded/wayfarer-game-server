/** Server-owned independent combat XP and capped exponential levels. */
export const SKILLS = ['attack', 'strength', 'defence', 'ranged', 'magic', 'hitpoints', 'prayer'];
export const TRAINING_MODES = ['attack', 'strength', 'defence', 'magic'];
export const XP_LEVEL_99 = 13_034_431;
export const MAX_XP = 200_000_000;
export const freshProgression = () => ({ xp: { attack: 0, strength: 0, defence: 0, ranged: 0, magic: 0, hitpoints: 1154, prayer: 0 }, mode: 'strength' });
export const isTrainingMode = (v) => typeof v === 'string' && TRAINING_MODES.includes(v);
export function checkedProgression(v) {
    if (!v || typeof v !== 'object' || Array.isArray(v))
        throw Error('Invalid progression');
    const p = v;
    if (Object.keys(p).sort().join() !== 'mode,xp' || !isTrainingMode(p.mode) || !p.xp || typeof p.xp !== 'object' || Array.isArray(p.xp) || Object.keys(p.xp).sort().join() !== [...SKILLS].sort().join() || !SKILLS.every(k => Number.isSafeInteger(p.xp[k]) && p.xp[k] >= 0 && p.xp[k] <= MAX_XP))
        throw Error('Invalid progression');
    return { mode: p.mode, xp: { ...p.xp } };
}
export const MAX_LEVEL = 99, MAX_COMBAT_LEVEL = 126;
/** Cumulative classic exponential XP thresholds. */
export const XP_THRESHOLDS = Object.freeze((() => { const result = [0, 0]; let points = 0; for (let n = 1; n < 99; n++) {
    points += Math.floor(n + 300 * 2 ** (n / 7));
    result.push(Math.floor(points / 4));
} return result; })());
export function xpForLevel(n) { if (!Number.isInteger(n) || n < 1 || n > 99)
    throw Error('Invalid skill level'); return XP_THRESHOLDS[n]; }
export function level(xp) { if (!Number.isSafeInteger(xp) || xp < 0 || xp > MAX_XP)
    throw Error('Invalid XP'); let lo = 1, hi = 99; while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (xp >= XP_THRESHOLDS[mid])
        lo = mid;
    else
        hi = mid - 1;
} return lo; }
export function xpProgress(xp) { const current = level(xp), floor = xpForLevel(current), next = current === 99 ? null : xpForLevel(current + 1); return { level: current, xp, nextLevel: next === null ? null : current + 1, nextThreshold: next, remaining: next === null ? 0 : next - xp, fraction: next === null ? 1 : (xp - floor) / (next - floor), maxed: current === 99 }; }
export function levels(p) { const v = checkedProgression(p); return Object.fromEntries(SKILLS.map(k => [k, level(v.xp[k])])); }
export function combatLevel(p) { const s = levels(p), base = (s.defence + s.hitpoints + Math.floor(s.prayer / 2)) / 4, offence = .325 * Math.max(s.attack + s.strength, Math.floor(s.ranged * 1.5), Math.floor(s.magic * 1.5)); return Math.min(126, Math.max(3, Math.floor(base + offence))); }
export function combatBonuses(p) { const s = levels(p); return { meleeDamage: Math.floor((s.strength - 1) / 10), magicDamage: Math.floor((s.magic - 1) / 10), damageReduction: Math.floor((s.defence - 1) / 20), maxHealth: 40 + Math.max(0, s.hitpoints - 10), accuracyRating: s.attack + 8, rangedAccuracyRating: s.ranged + 8, magicAccuracyRating: s.magic + 8 }; }
export function awardSkillXP(p, skill, amount) { checkedProgression(p); if (!SKILLS.includes(skill) || !Number.isSafeInteger(amount) || amount < 0 || amount > MAX_XP)
    throw Error('Invalid XP award'); p.xp[skill] = Math.min(MAX_XP, p.xp[skill] + amount); }
export function migrateProgression(value) { if (!value || typeof value !== 'object' || Array.isArray(value))
    throw Error('Invalid legacy progression'); const v = value; if (Object.keys(v).sort().join() !== 'mode,xp' || !v.xp || typeof v.xp !== 'object' || Object.keys(v.xp).sort().join() !== ['attack', 'strength', 'defence', 'ranged', 'magic'].sort().join())
    throw Error('Invalid legacy progression'); if (!Object.values(v.xp).every(n => Number.isSafeInteger(n) && n >= 0 && n <= 960400))
    throw Error('Invalid legacy XP'); return checkedProgression({ mode: v.mode, xp: { ...v.xp, hitpoints: 1154, prayer: 0 } }); }
export function eligible(p, requirements) { const s = levels(p); return Object.entries(requirements).every(([k, n]) => SKILLS.includes(k) && Number.isInteger(n) && n >= 1 && n <= 99 && s[k] >= n); }
export function awardDamage(p, damage) { if (!Number.isSafeInteger(damage) || damage < 0 || damage > 80)
    throw Error('Invalid credited damage'); checkedProgression(p); awardSkillXP(p, p.mode, damage * 4); awardSkillXP(p, 'hitpoints', damage); }
/** Fifteen level bands, separate from an item's requirements, speed, price or identity. */
export const TIER_LEVELS = Object.freeze([1, 7, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 91, 99]);
