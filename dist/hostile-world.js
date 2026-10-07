import { WEAPONS } from './encounter.js';
import { grantLoot } from './inventory.js';
import { awardDamage, awardSkillXP, combatBonuses } from './progression.js';
const canUseMeleeStyle = (item, style) => item !== 'ash_staff';
export const HOSTILE_KINDS = ['skeleton', 'zombie', 'thug', 'bandit', 'mugger'];
export const HOSTILE_CAMPS = ['skeleton-grave', 'zombie-marsh', 'thug-campsite'];
export const HOSTILE_RESULT_TEXT = { enemy_unavailable: 'That enemy is no longer available.', style_incompatible: 'Your weapon cannot use that attack style.', combat_protected: 'Combat is disabled in this protected area.', enemy_drop: 'A rare steel weapon has dropped nearby.', enemy_defeated: 'Enemy defeated. Watch for nearby attackers.', enemy_hit: 'Your attack hit the enemy.', projectile_busy: 'Too many projectiles are already in flight.', projectile_fired: 'Projectile launched; damage resolves on impact.', projectile_hit: 'Projectile impact resolved.', projectile_miss: 'The target was gone before impact.', hostile_strike: 'You are under attack; retreat, guard or use protection.', loot_unavailable: 'That drop is no longer available.', loot_range: 'Move closer to collect the drop.', loot_collected: 'Steel weapon collected.' };
export function parseHostileCommand(value) {
    if (typeof value !== 'string' || value.length > 64)
        return;
    const attack = /^attack:(skeleton|zombie|thug|bandit|mugger)-([1-6]):(slash|crush|strike|lunge)$/.exec(value);
    if (attack)
        return { kind: 'attack', target: `${attack[1]}-${attack[2]}`, style: attack[3] };
    const projectile = /^(shoot-mob|spell-mob):((skeleton|zombie|thug|bandit|mugger)-[1-6])$/.exec(value);
    if (projectile)
        return { kind: 'projectile', target: projectile[2], projectile: projectile[1] === 'shoot-mob' ? 'arrow' : 'spell' };
    const loot = /^loot:(loot-[1-9][0-9]{0,9})$/.exec(value);
    if (loot)
        return { kind: 'loot', lootId: loot[1] };
}
export const isHostileCommand = (value) => !!parseHostileCommand(value);
const SPECS = Object.freeze({
    skeleton: Object.freeze({ name: 'Skeleton', hp: 24, damage: 4, drop: 'steel_warhammer' }),
    zombie: Object.freeze({ name: 'Zombie', hp: 28, damage: 5, drop: 'steel_battleaxe' }),
    thug: Object.freeze({ name: 'Thug', hp: 22, damage: 4, drop: 'steel_dagger' }),
    bandit: Object.freeze({ name: 'Bandit', hp: 26, damage: 6, drop: 'steel_sword' }),
    mugger: Object.freeze({ name: 'Mugger', hp: 20, damage: 3, drop: 'steel_rapier' })
});
const MOB_RANGE = 2.15, DETECTION_RANGE = 8.5, LEASH_RANGE = 36, LOOT_TTL = 1200;
const finite = (n) => Number.isFinite(n);
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const clonePoint = (p) => ({ x: p.x, y: p.y, z: p.z });
const safeNumber = (v, max = Number.MAX_SAFE_INTEGER) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= max;
const pointOk = (v) => !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).sort().join(',') === 'x,y,z' && finite(v.x) && finite(v.y) && finite(v.z) && Math.abs(v.x) <= 10000 && Math.abs(v.y) <= 10000 && Math.abs(v.z) <= 10000;
function groundPoint(x, z, fallbackY, nav) {
    if (!nav)
        return { x, y: fallbackY, z };
    const result = nav.check({ x, z });
    return result.ok ? result.position : undefined;
}
function campCenter(camp, beacon, t, side, nav) {
    const dx = beacon.x - camp.x, dz = beacon.z - camp.z, length = Math.max(.001, Math.hypot(dx, dz)), px = -dz / length, pz = dx / length;
    for (const offset of [side, side * .65, -side * .65, 0, side * 1.4, -side * 1.4])
        for (let r = 0; r <= 8; r += 2) {
            const sign = r === 0 ? 0 : 1, x = camp.x + dx * t + px * (offset + sign * r), z = camp.z + dz * t + pz * (offset + sign * r), p = groundPoint(x, z, camp.y + (beacon.y - camp.y) * t, nav);
            if (p)
                return p;
        }
    return groundPoint(camp.x + dx * t, camp.z + dz * t, camp.y + (beacon.y - camp.y) * t, undefined);
}
function scatter(center, index, nav) {
    const patterns = [[0, 0], [-3, 0], [3, 0], [0, -3], [0, 3], [-4, -3], [4, 3], [5, -2], [-5, 2], [2, 5], [-2, -5], [6, 1]];
    const [dx, dz] = patterns[index % patterns.length];
    return groundPoint(center.x + dx, center.z + dz, center.y, nav) ?? clonePoint(center);
}
/** The only drop source: every listed gear item is rolled independently at exactly 5%. */
export function rollHostileDrop(kind, unit) {
    if (!HOSTILE_KINDS.includes(kind) || !finite(unit) || unit < 0 || unit >= 1)
        throw new Error('Invalid hostile drop roll');
    return unit < .05 ? SPECS[kind].drop : undefined;
}
export function createHostileWorld(camp, beacon, nav) {
    if (!pointOk(camp) || !pointOk(beacon))
        throw new Error('Invalid hostile anchors');
    const centers = [
        { id: 'skeleton-grave', name: 'Old Bell Grave', position: campCenter(camp, beacon, .28, 14, nav), radius: 13, multiCombat: false },
        { id: 'zombie-marsh', name: 'Mirewake Hollow', position: campCenter(camp, beacon, .54, -15, nav), radius: 14, multiCombat: false },
        { id: 'thug-campsite', name: 'Broken Standard Camp', position: campCenter(camp, beacon, .77, 17, nav), radius: 16, multiCombat: true }
    ];
    const mobs = [];
    const add = (campId, kinds) => { const center = centers.find(c => c.id === campId).position; for (const kind of kinds) {
        const index = mobs.filter(m => m.camp === campId).length, position = scatter(center, index, nav), maxHp = SPECS[kind].hp, id = `${kind}-${index + 1}`;
        mobs.push({ id, camp: campId, kind, home: clonePoint(position), position: clonePoint(position), hp: maxHp, maxHp, target: null, attackAt: 0, respawnAt: 0 });
    } };
    add('skeleton-grave', ['skeleton', 'skeleton', 'skeleton']);
    add('zombie-marsh', ['zombie', 'zombie', 'zombie']);
    add('thug-campsite', ['thug', 'thug', 'bandit', 'bandit', 'mugger', 'mugger']);
    return { camps: centers, mobs, projectiles: [], loot: [], rng: 0x6d2b79f5, nextProjectile: 1, nextLoot: 1 };
}
export function checkedHostileWorld(value, tick) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error('Invalid hostile world');
    const v = value;
    if (Object.keys(v).sort().join(',') !== 'camps,loot,mobs,nextLoot,nextProjectile,projectiles,rng' || !Array.isArray(v.camps) || v.camps.length !== 3 || !Array.isArray(v.mobs) || v.mobs.length !== 12 || !Array.isArray(v.projectiles) || v.projectiles.length > 64 || !Array.isArray(v.loot) || v.loot.length > 128 || !safeNumber(v.rng, 0xffffffff) || v.rng === 0 || !safeNumber(v.nextProjectile) || v.nextProjectile < 1 || !safeNumber(v.nextLoot) || v.nextLoot < 1)
        throw new Error('Invalid hostile world');
    const camps = new Set();
    for (const c of v.camps) {
        if (!c || Object.keys(c).sort().join(',') !== 'id,multiCombat,name,position,radius' || !HOSTILE_CAMPS.includes(c.id) || camps.has(c.id) || typeof c.name !== 'string' || c.name.length > 48 || !pointOk(c.position) || !finite(c.radius) || c.radius < 8 || c.radius > 40 || typeof c.multiCombat !== 'boolean' || c.multiCombat !== (c.id === 'thug-campsite'))
            throw new Error('Invalid hostile camp');
        camps.add(c.id);
    }
    const ids = new Set();
    for (const m of v.mobs) {
        if (!m || Object.keys(m).sort().join(',') !== 'attackAt,camp,home,hp,id,kind,maxHp,position,respawnAt,target' || typeof m.id !== 'string' || m.id.length > 32 || ids.has(m.id) || !HOSTILE_CAMPS.includes(m.camp) || !HOSTILE_KINDS.includes(m.kind) || !pointOk(m.home) || !pointOk(m.position) || !safeNumber(m.hp, 60) || !safeNumber(m.maxHp, 60) || m.maxHp !== SPECS[m.kind].hp || m.hp > m.maxHp || !(m.target === null || typeof m.target === 'string' && /^p[1-9][0-9]{0,8}$/.test(m.target)) || !safeNumber(m.attackAt) || !safeNumber(m.respawnAt) || m.attackAt > tick + 40 || m.respawnAt > tick + 2400 || m.hp > 0 && m.respawnAt !== 0 || m.hp === 0 && m.respawnAt <= tick)
            throw new Error('Invalid hostile mob');
        ids.add(m.id);
    }
    const projectileIds = new Set();
    for (const p of v.projectiles) {
        if (!p || Object.keys(p).sort().join(',') !== 'damage,id,impactTick,kind,launchTick,owner,position,sequence,skill,target' || typeof p.id !== 'string' || !/^shot-[1-9][0-9]{0,9}$/.test(p.id) || projectileIds.has(p.id) || typeof p.owner !== 'string' || !/^p[1-9][0-9]{0,8}$/.test(p.owner) || !ids.has(p.target) || !['arrow', 'spell'].includes(p.kind) || !['ranged', 'magic'].includes(p.skill) || !pointOk(p.position) || !safeNumber(p.launchTick) || !safeNumber(p.impactTick) || p.launchTick > tick || p.impactTick <= tick || p.impactTick > tick + 40 || !safeNumber(p.damage, 80) || p.damage < 1 || !safeNumber(p.sequence))
            throw new Error('Invalid hostile projectile');
        projectileIds.add(p.id);
    }
    const lootIds = new Set();
    for (const d of v.loot) {
        if (!d || Object.keys(d).sort().join(',') !== 'bornTick,expiresTick,id,item,position' || typeof d.id !== 'string' || !/^loot-[1-9][0-9]{0,9}$/.test(d.id) || lootIds.has(d.id) || !pointOk(d.position) || !safeNumber(d.bornTick) || !safeNumber(d.expiresTick) || d.bornTick > tick || d.expiresTick <= tick || d.expiresTick > d.bornTick + LOOT_TTL || !['steel_warhammer', 'steel_battleaxe', 'steel_dagger', 'steel_sword', 'steel_rapier'].includes(d.item))
            throw new Error('Invalid ground loot');
        lootIds.add(d.id);
    }
    return structuredClone(v);
}
function nextRandom(world) { world.rng = (Math.imul(world.rng, 1664525) + 1013904223) >>> 0; if (world.rng === 0)
    world.rng = 0x6d2b79f5; return world.rng / 0x1_0000_0000; }
function addDrop(world, kind, position, tick, events, playerId, sequence) {
    const item = rollHostileDrop(kind, nextRandom(world));
    if (!item)
        return;
    if (world.nextLoot > 9_999_999)
        return;
    const drop = { id: `loot-${world.nextLoot++}`, item, position: clonePoint(position), bornTick: tick, expiresTick: tick + LOOT_TTL };
    if (world.loot.length < 128)
        world.loot.push(drop);
    events.push({ playerId, sequence, code: 'enemy_drop', item, target: drop.id });
}
function damageMob(world, mob, player, damage, tick, events, sequence, skill) {
    const before = mob.hp;
    mob.hp = Math.max(0, mob.hp - damage);
    mob.target = player.id;
    const dealt = before - mob.hp;
    if (skill) {
        awardSkillXP(player.progression, skill, dealt * 4);
        awardSkillXP(player.progression, 'hitpoints', dealt);
    }
    else
        awardDamage(player.progression, dealt);
    if (mob.hp === 0) {
        mob.target = null;
        mob.attackAt = 0;
        mob.respawnAt = tick + 2400;
        addDrop(world, mob.kind, mob.position, tick, events, player.id, sequence);
        events.push({ playerId: player.id, sequence, code: 'enemy_defeated', target: mob.id, damage: before });
    }
    else
        events.push({ playerId: player.id, sequence, code: 'enemy_hit', target: mob.id, damage: dealt });
}
function attractNearby(world, target, player, tick) {
    target.target = player.id;
    target.attackAt = Math.max(target.attackAt, tick + 8);
    const camp = world.camps.find(c => c.id === target.camp);
    if (!camp?.multiCombat)
        return;
    for (const ally of world.mobs)
        if (ally.camp === target.camp && ally.hp > 0 && ally.id !== target.id && dist(ally.position, player.position) <= DETECTION_RANGE) {
            ally.target = player.id;
            ally.attackAt = Math.max(ally.attackAt, tick + 8);
        }
}
export function attackHostile(world, player, targetId, style, tick, sequence) {
    const mob = world.mobs.find(m => m.id === targetId);
    if (!mob || mob.hp === 0)
        return [{ playerId: player.id, sequence, code: 'enemy_unavailable', target: targetId }];
    if (player.protectedCombat)
        return [{ playerId: player.id, sequence, code: 'combat_protected', target: targetId }];
    if (player.fighter.hp === 0)
        return [{ playerId: player.id, sequence, code: 'recovering', target: targetId }];
    const weapon = player.inventory.weapon;
    if (!canUseMeleeStyle(weapon, style))
        return [{ playerId: player.id, sequence, code: 'style_incompatible', target: targetId }];
    const profile = WEAPONS[weapon ?? 'unarmed'], range = profile.range + (style === 'lunge' ? 1.4 : 0);
    if (dist(player.position, mob.position) > range)
        return [{ playerId: player.id, sequence, code: 'out_of_range', target: targetId }];
    if (tick < player.fighter.attackReady)
        return [{ playerId: player.id, sequence, code: 'attack_cooldown', target: targetId }];
    player.fighter.attackReady = tick + profile.cooldown + (style === 'lunge' ? 4 : 0);
    attractNearby(world, mob, player, tick);
    const multiplier = style === 'crush' && mob.kind === 'skeleton' ? 1.35 : style === 'slash' && ['zombie', 'thug', 'bandit', 'mugger'].includes(mob.kind) ? 1.12 : style === 'lunge' ? 1.08 : 1;
    const damage = Math.max(1, Math.floor((profile.damage + combatBonuses(player.progression).meleeDamage) * multiplier));
    const events = [];
    damageMob(world, mob, player, damage, tick, events, sequence);
    return events;
}
export function launchHostileProjectile(world, player, targetId, kind, tick, sequence) {
    const mob = world.mobs.find(m => m.id === targetId);
    if (!mob || mob.hp === 0)
        return [{ playerId: player.id, sequence, code: 'enemy_unavailable', target: targetId }];
    if (player.fighter.hp === 0)
        return [{ playerId: player.id, sequence, code: 'recovering', target: targetId }];
    if (player.protectedCombat)
        return [{ playerId: player.id, sequence, code: 'combat_protected', target: targetId }];
    const skill = kind === 'arrow' ? 'ranged' : 'magic', ammo = kind === 'arrow' ? 'arrows' : 'runes', range = kind === 'arrow' ? 13 : 15;
    if (dist(player.position, mob.position) > range)
        return [{ playerId: player.id, sequence, code: 'out_of_range', target: targetId }];
    if (tick < player.fighter.attackReady)
        return [{ playerId: player.id, sequence, code: 'attack_cooldown', target: targetId }];
    if (!player.lifePack || player.lifePack[ammo] < 1)
        return [{ playerId: player.id, sequence, code: 'life_ammo', target: targetId }];
    if (world.projectiles.length >= 64 || world.nextProjectile > 9_999_999)
        return [{ playerId: player.id, sequence, code: 'projectile_busy', target: targetId }];
    const bonus = skill === 'ranged' ? Math.floor((Math.max(1, player.progression.xp.ranged) - 1) / 10) : combatBonuses(player.progression).magicDamage;
    const damage = Math.min(80, (kind === 'arrow' ? 7 : 8) + bonus);
    const flight = Math.max(2, Math.ceil(dist(player.position, mob.position) / (kind === 'arrow' ? .75 : 1.1)));
    player.fighter.attackReady = tick + (kind === 'arrow' ? 20 : 24);
    player.lifePack[ammo]--;
    attractNearby(world, mob, player, tick);
    world.projectiles.push({ id: `shot-${world.nextProjectile++}`, owner: player.id, target: mob.id, kind, skill, position: clonePoint(player.position), launchTick: tick, impactTick: tick + flight, damage, sequence });
    return [{ playerId: player.id, sequence, code: 'projectile_fired', target: targetId }];
}
export function collectHostileLoot(world, player, lootId, tick, sequence) {
    const drop = world.loot.find(d => d.id === lootId);
    if (!drop)
        return [{ playerId: player.id, sequence, code: 'loot_unavailable', target: lootId }];
    if (dist(player.position, drop.position) > 2.8)
        return [{ playerId: player.id, sequence, code: 'loot_range', target: lootId }];
    const next = grantLoot(player.inventory, drop.item);
    if (!next)
        return [{ playerId: player.id, sequence, code: 'inventory_full', target: lootId }];
    player.inventory = next;
    world.loot = world.loot.filter(d => d.id !== lootId);
    return [{ playerId: player.id, sequence, code: 'loot_collected', target: lootId, item: drop.item }];
}
/** Advance enemy decisions and delayed projectile impacts only from the server's fixed tick. */
export function advanceHostileWorld(world, players, tick, nav) {
    const events = [];
    world.loot = world.loot.filter(d => d.expiresTick > tick);
    for (const projectile of world.projectiles.filter(p => p.impactTick <= tick)) {
        const mob = world.mobs.find(m => m.id === projectile.target), player = players.find(p => p.id === projectile.owner);
        if (mob && player && mob.hp > 0) {
            damageMob(world, mob, player, projectile.damage, tick, events, projectile.sequence, projectile.skill);
            events.push({ playerId: player.id, sequence: projectile.sequence, code: 'projectile_hit', target: mob.id, damage: projectile.damage });
        }
        else if (player)
            events.push({ playerId: player.id, sequence: projectile.sequence, code: 'projectile_miss', target: projectile.target });
    }
    world.projectiles = world.projectiles.filter(p => p.impactTick > tick);
    for (const mob of world.mobs) {
        if (mob.hp === 0) {
            if (tick >= mob.respawnAt) {
                mob.hp = mob.maxHp;
                mob.respawnAt = 0;
                mob.attackAt = 0;
                mob.target = null;
                mob.position = clonePoint(mob.home);
            }
            continue;
        }
        let target = mob.target ? players.find(p => p.id === mob.target) : undefined;
        if (target && dist(target.position, mob.home) > LEASH_RANGE) {
            mob.target = null;
            target = undefined;
        }
        if (!target) {
            target = players.find(p => !p.protectedCombat && p.fighter.hp > 0 && dist(p.position, mob.position) <= DETECTION_RANGE);
            if (target) {
                mob.target = target.id;
                mob.attackAt = Math.max(mob.attackAt, tick + 8);
            }
        }
        if (target?.protectedCombat) {
            mob.target = null;
            target = undefined;
        }
        if (target) {
            if (dist(target.position, mob.position) <= MOB_RANGE) {
                if (tick >= mob.attackAt) {
                    const reduction = combatBonuses(target.progression).damageReduction + (target.ward ? 1 : 0), damage = Math.max(0, SPECS[mob.kind].damage - reduction);
                    if (damage > 0) {
                        target.fighter.hp = Math.max(0, target.fighter.hp - damage);
                        if (target.fighter.hp === 0) {
                            target.fighter.recoverAt = tick + 100;
                            target.fighter.contributed = false;
                        }
                    }
                    mob.attackAt = tick + 36;
                    events.push({ playerId: target.id, code: 'hostile_strike', target: mob.id, damage });
                }
                continue;
            }
            const length = dist(target.position, mob.position), step = Math.min(.06, length), x = mob.position.x + (target.position.x - mob.position.x) / length * step, z = mob.position.z + (target.position.z - mob.position.z) / length * step;
            const moved = nav?.traverse(mob.position, { x, z });
            if (!nav || moved?.ok)
                mob.position = nav && moved?.ok ? moved.position : { x, y: mob.position.y, z };
            continue;
        }
        const homeDistance = dist(mob.position, mob.home);
        if (homeDistance > .12) {
            const length = homeDistance, step = Math.min(.045, length), x = mob.position.x + (mob.home.x - mob.position.x) / length * step, z = mob.position.z + (mob.home.z - mob.position.z) / length * step, moved = nav?.traverse(mob.position, { x, z });
            if (!nav || moved?.ok)
                mob.position = nav && moved?.ok ? moved.position : { x, y: mob.position.y, z };
        }
    }
    return events;
}
export function hostileView(world) {
    return { camps: structuredClone(world.camps), mobs: structuredClone(world.mobs), projectiles: structuredClone(world.projectiles), loot: structuredClone(world.loot) };
}
export function checkedHostileView(value, tick) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error('Invalid hostile view');
    const v = value;
    const full = { ...v, rng: 0x6d2b79f5, nextProjectile: 1, nextLoot: 1 };
    return (({ camps, mobs, projectiles, loot }) => ({ camps, mobs, projectiles, loot }))(checkedHostileWorld(full, tick));
}
