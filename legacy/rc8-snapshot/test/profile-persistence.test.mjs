import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {RealmRuntime} from '../dist/realm-runtime.js';
import {NavigationWorld} from '../dist/navigation.js';
import {checkedPersistentPlayerState} from '../dist/game-actions.js';
import {checkedPlayerSave,decodePlayerSave,encodePlayerSave} from '../dist/persistence.js';
import {LocalProfileStore,PROFILE_COOKIE} from '../tools/profile-store.mjs';

const nav=()=>new NavigationWorld(()=>({height:0,slopeDegrees:0,waterDepth:0}),{bounds:{minX:-20,maxX:20,minZ:-20,maxZ:20}});
function inventoryWithWeapon(item='ash_staff'){return {slots:Array(20).fill(null),weapon:item,rewardClaimed:true};}
function completedGameplay(){return checkedPersistentPlayerState({version:1,skin:'elder',quest:{status:'completed',reeds:0,tithes:0,gatherCooldownTicks:0},inventory:inventoryWithWeapon()});}
function activeGameplay(cooldown=17){return checkedPersistentPlayerState({version:1,skin:'traveler',quest:{status:'active',reeds:1,tithes:0,gatherCooldownTicks:cooldown},inventory:{slots:Array(20).fill(null),weapon:null,rewardClaimed:false}});}
function saveAt(x=2,z=3,gameplay=completedGameplay()){return checkedPlayerSave({version:1,position:{x,z},gameplay});}

test('player save codec is strict, bounded and detached',()=>{
 const save=saveAt(),text=encodePlayerSave(save),decoded=decodePlayerSave(text);assert.deepEqual(decoded,save);decoded.position.x=99;decoded.gameplay.inventory.weapon=null;assert.deepEqual(decodePlayerSave(text),save);
 assert.throws(()=>checkedPlayerSave({...save,extra:true}));assert.throws(()=>decodePlayerSave(' '.repeat(9000)));
});

test('realm restores server-owned gameplay and position but resets packet sequence',()=>{
 const save=saveAt(),r=new RealmRuntime(nav(),{beacon:{x:0,y:0,z:0},camp:{x:0,y:0,z:0}});r.join('new-connection',save.position,save);
 assert.equal(r.stateFor('new-connection').position.x,2);const state=r.gameStateFor('new-connection');assert.equal(state.inventory.weapon,'ash_staff');assert.equal(state.quest.status,'completed');assert.equal(state.players.find(p=>p.id==='p1').skin,'elder');
 assert.equal(r.receive('new-connection',JSON.stringify({kind:'action',sequence:0,action:'unequip',value:'weapon'})),true);r.advance(50);assert.equal(r.gameStateFor('new-connection').inventory.slots[0],'ash_staff');
 const exported=r.exportPlayer('new-connection');assert.equal(exported.position.x,2);assert.equal(exported.gameplay.inventory.weapon,null);assert.equal(JSON.stringify(exported).includes('new-connection'),false);
});

test('saved gather cooldown is relative to the join tick, not a stale absolute tick',()=>{
 const r=new RealmRuntime(nav(),{beacon:{x:0,y:0,z:0},camp:{x:0,y:0,z:0}});r.join('existing',{x:5,z:0});for(let i=0;i<5;i++)r.advance(50);
 const save=saveAt(0,0,activeGameplay(17));r.join('resume',save.position,save);assert.equal(r.gameStateFor('resume').quest.gatherReadyTick,22);assert.equal(r.exportPlayer('resume').gameplay.quest.gatherCooldownTicks,17);
});

test('local profile store signs identity cookies and survives process-style reopen',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'wayfarer-profile-')),file=path.join(dir,'profiles.json');try{
  const store=await LocalProfileStore.open(file),session=await store.ensureSession();assert.match(session.accountId,/^a_[0-9a-f]{32}$/);assert.match(session.setCookie,new RegExp(`^${PROFILE_COOKIE}=`));
  const cookie=session.setCookie.split(';',1)[0];assert.equal(store.resolveCookie(cookie),session.accountId);await store.save(session.accountId,saveAt());assert.equal(store.revision(session.accountId),1);
  const reopened=await LocalProfileStore.open(file);assert.equal(reopened.resolveCookie(cookie),session.accountId);assert.deepEqual(reopened.load(session.accountId),saveAt());
  const [name,value]=cookie.split('=');const tampered=`${name}=${value.slice(0,-1)}${value.endsWith('0')?'1':'0'}`;assert.equal(reopened.resolveCookie(tampered),undefined);const replacement=await reopened.ensureSession(tampered);assert.notEqual(replacement.accountId,session.accountId);assert.equal(reopened.count,2);
  const persisted=JSON.parse(await readFile(file,'utf8'));assert.ok(!JSON.stringify(persisted).includes(cookie.split('=')[1]));
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('profile batches validate completely before replacing the durable database',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'wayfarer-batch-')),file=path.join(dir,'profiles.json');try{
  const store=await LocalProfileStore.open(file),a=await store.ensureSession(),b=await store.ensureSession();await store.save(a.accountId,saveAt());const before=store.revision(a.accountId);
  await assert.rejects(store.saveMany([{accountId:a.accountId,save:saveAt(4,4)},{accountId:'a_bad',save:saveAt()}]));assert.equal(store.revision(a.accountId),before);assert.deepEqual(store.load(a.accountId),saveAt());assert.equal(store.revision(b.accountId),0);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('queued profile mutations serialize without losing concurrent sessions or saves',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'wayfarer-queue-')),file=path.join(dir,'profiles.json');try{
  const store=await LocalProfileStore.open(file);const [a,b]=await Promise.all([store.ensureSession(),store.ensureSession()]);assert.notEqual(a.accountId,b.accountId);assert.equal(store.count,2);
  await Promise.all([store.save(a.accountId,saveAt(6,1)),store.save(b.accountId,saveAt(-2,4))]);assert.equal(store.revision(a.accountId),1);assert.equal(store.revision(b.accountId),1);assert.equal(store.load(a.accountId).position.x,6);assert.equal(store.load(b.accountId).position.z,4);
  const reopened=await LocalProfileStore.open(file);assert.equal(reopened.count,2);assert.equal(reopened.load(a.accountId).position.x,6);assert.equal(reopened.load(b.accountId).position.z,4);
 }finally{await rm(dir,{recursive:true,force:true});}
});
