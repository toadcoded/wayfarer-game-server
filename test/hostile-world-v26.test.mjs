import test from 'node:test';
import assert from 'node:assert/strict';
import {attackHostile,advanceHostileWorld,collectHostileLoot,createHostileWorld,launchHostileProjectile,rollHostileDrop} from '../dist/hostile-world.js';
import {checkedInventory,equipItem,freshInventory,grantReward} from '../dist/inventory.js';
import {freshFighter} from '../dist/encounter.js';
import {freshProgression} from '../dist/progression.js';

const anchors=()=>({camp:{x:0,y:0,z:0},beacon:{x:100,y:0,z:0}});
function player(id='p1',position={x:0,y:0,z:0},pack={arrows:0,runes:0}){
 let inventory=grantReward(freshInventory(),'reed_blade');inventory=equipItem(inventory,'reed_blade');
 return {id,position,fighter:freshFighter(),inventory,progression:freshProgression(),lifePack:{...pack},ward:false};
}
function world(){const {camp,beacon}=anchors();return createHostileWorld(camp,beacon);}

test('hostile loot table maps each monster to the requested steel weapon at a strict five-percent threshold',()=>{
 for(const [kind,item] of [['skeleton','steel_warhammer'],['zombie','steel_battleaxe'],['thug','steel_dagger'],['bandit','steel_sword'],['mugger','steel_rapier']]){
  assert.equal(rollHostileDrop(kind,.049999),item);
  assert.equal(rollHostileDrop(kind,.05),undefined);
  assert.equal(rollHostileDrop(kind,.999999),undefined);
 }
});

test('v2.5 inventory snapshots migrate without changing the existing reward or items',()=>{
 const old={slots:Array(20).fill(null),weapon:null,rewardClaimed:true,stored:null};old.slots[0]='reed_blade';
 assert.deepEqual(checkedInventory(old),{...old,lootCount:0});
});

test('multicombat campsite pulls nearby fighters into the same encounter',()=>{
 const w=world(),p=player('p1',w.mobs.find(m=>m.id==='thug-1').position),events=attackHostile(w,p,'thug-1','slash',1,0);
 assert.ok(events.some(e=>e.code==='enemy_hit'));
 assert.equal(w.mobs.filter(m=>m.camp==='thug-campsite'&&m.target==='p1').length,6);
});

test('a ranged attack from outside nearby detection can lure one campsite guard',()=>{
 const w=world(),target=w.mobs.find(m=>m.id==='thug-1'),p=player('p1',{x:target.position.x+12,y:target.position.y,z:target.position.z},{arrows:1,runes:0});
 const events=launchHostileProjectile(w,p,target.id,'arrow',1,0);
 assert.equal(events[0].code,'projectile_fired');
 assert.equal(w.mobs.filter(m=>m.camp==='thug-campsite'&&m.target==='p1').length,1);
});

test('projectile damage resolves only on a later authoritative tick and consumes one arrow',()=>{
 const w=world(),target=w.mobs[0],p=player('p1',{x:target.position.x+10,y:target.position.y,z:target.position.z},{arrows:1,runes:0}),before=target.hp;
 const events=launchHostileProjectile(w,p,target.id,'arrow',5,0);
 assert.equal(events[0].code,'projectile_fired');assert.equal(p.lifePack.arrows,0);assert.equal(target.hp,before);
 const impact=w.projectiles[0].impactTick;
 advanceHostileWorld(w,[p],impact-1);assert.equal(target.hp,before);
 const resolved=advanceHostileWorld(w,[p],impact);assert.ok(resolved.some(e=>e.code==='projectile_hit'));
 assert.ok(target.hp<before);
});

test('loot pickup is range-gated, server-granted, and increments the migrated source counter',()=>{
 const w=world(),drop={id:'loot-1',item:'steel_sword',position:{x:1,y:0,z:0},bornTick:2,expiresTick:1202};w.nextLoot=2;w.loot.push(drop);const p=player('p1',{x:0,y:0,z:0});
 assert.equal(collectHostileLoot(w,p,drop.id,3,0)[0].code,'loot_collected');
 assert.equal(p.inventory.lootCount,1);assert.ok(p.inventory.slots.includes('steel_sword'));assert.equal(w.loot.length,0);
});

test('rejected incompatible melee styles do not advance the attack clock',()=>{
 const w=world(),target=w.mobs[0],p=player('p1',target.position);p.inventory.weapon='ash_staff';const ready=p.fighter.attackReady;
 assert.equal(attackHostile(w,p,target.id,'slash',4,0)[0].code,'style_incompatible');assert.equal(p.fighter.attackReady,ready);
});
