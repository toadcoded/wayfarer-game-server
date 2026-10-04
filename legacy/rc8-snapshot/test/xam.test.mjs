import test from 'node:test';
import assert from 'node:assert/strict';
import {NavigationWorld} from '../dist/navigation.js';
import {XamController,XAM_SKILLS,XAM_MAX_TRAINING_TICKS,checkedXamSnapshot} from '../dist/xam.js';
import {RealmRuntime} from '../dist/realm-runtime.js';

const nav=()=>new NavigationWorld(()=>({height:0,slopeDegrees:0,waterDepth:0}),{bounds:{minX:-40,maxX:40,minZ:-40,maxZ:40}});
const camp={x:-8,y:0,z:0},beacon={x:8,y:0,z:0};

test('Xam is structurally untouchable, nonblocking and has no retaliation state',()=>{
 const x=new XamController(nav(),camp,beacon),s=x.snapshot();
 assert.equal(s.id,'xam');assert.equal(s.protected,true);assert.equal(s.untouchable,true);assert.equal(s.autoRetaliate,false);assert.equal(s.collision,'nonblocking');
 assert.equal(Object.hasOwn(s,'hp'),false);assert.equal(Object.hasOwn(s,'targetPlayer'),false);assert.equal(s.mainHand,'diamond_scythe');assert.equal(s.offHand,'gilded_secateurs');
 assert.doesNotThrow(()=>checkedXamSnapshot(s,0));
 assert.throws(()=>checkedXamSnapshot({...s,untouchable:false},0));
 assert.throws(()=>checkedXamSnapshot({...s,autoRetaliate:true},0));
});

test('Xam switches diversely and no training session can exceed five minutes',()=>{
 let x=new XamController(nav(),camp,beacon),previous=x.snapshot();const seen=new Set([previous.currentSkill]);
 for(let tick=1;tick<=120000;tick++){
  x=x.stagedAdvance(tick);const s=x.snapshot();seen.add(s.currentSkill);
  assert.ok(s.skillEndsAtTick-s.skillStartedTick<=XAM_MAX_TRAINING_TICKS);
  assert.ok(s.skillEndsAtTick>tick);
  if(s.currentSkill!==previous.currentSkill)assert.notEqual(s.currentSkill,previous.currentSkill);
  previous=s;
 }
 assert.deepEqual([...seen].sort(),[...XAM_SKILLS].sort());
 const sessions=x.snapshot().progress.map(p=>p.sessions);assert.ok(Math.max(...sessions)-Math.min(...sessions)<=2);
 assert.ok(x.snapshot().rewardPips>0);assert.equal(x.health(120000).status,'healthy');
});

test('Xam control is server-only; client packets cannot command or damage him',()=>{
 const n=nav(),realm=new RealmRuntime(n,{beacon,camp});realm.join('a',camp);
 const before=realm.xamState;assert.ok(before);
 assert.equal(realm.receive('a',JSON.stringify({kind:'action',sequence:0,action:'xam',value:'mining'})),false);
 assert.equal(realm.receive('a',JSON.stringify({kind:'action',sequence:1,action:'combat',value:'attack'})),true);
 realm.advance(50);const afterAttack=realm.xamState;assert.ok(afterAttack);assert.equal(afterAttack.untouchable,true);assert.equal(afterAttack.autoRetaliate,false);
 assert.equal(realm.requestXamSkill('not-a-skill'),false);assert.equal(realm.status,'active');
 assert.equal(realm.requestXamSkill('mining'),true);realm.advance(50);assert.equal(realm.xamState.currentSkill,'mining');
 const state=realm.gameStateFor('a');assert.equal(state.xam.id,'xam');assert.equal(state.xam.currentSkill,'mining');assert.equal(realm.xamHealth.status,'healthy');
});
