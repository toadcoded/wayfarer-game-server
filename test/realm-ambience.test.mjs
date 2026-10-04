import test from 'node:test';import assert from 'node:assert/strict';import {NullEngine,Scene} from '@babylonjs/core';import {realmDetails,ambientFrame,DETAIL_KINDS} from '../dist/realm-ambience.js';import {RealmAmbience3D} from '../dist/realm-ambience-3d.js';import {realmHeartbeat} from '../dist/realm-heartbeat.js';
test('seeded realm dressing is reproducible, diverse and separated from the walking lane',()=>{
 const anchors=[{x:38,y:2,z:0},{x:106,y:2,z:0}],details=realmDetails(123,anchors);assert.equal(details.length,22);assert.deepEqual(details,realmDetails(123,anchors));assert.notDeepEqual(details,realmDetails(124,anchors));assert.equal(new Set(details.map(d=>d.id)).size,22);assert.deepEqual([...new Set(details.map(d=>d.kind))],DETAIL_KINDS);assert.ok(details.every(d=>Math.abs(d.position.z)>=4));assert.deepEqual(anchors,[{x:38,y:2,z:0},{x:106,y:2,z:0}]);
});
test('ambient schedule reaches every event without repeated-rate dependence; pause removes events',()=>{
 const found=new Set();for(let t=0;t<84000;t+=100){const frame=ambientFrame(33,t);assert.deepEqual(frame,ambientFrame(33,t));if(frame.event){found.add(frame.event.kind);assert.ok(frame.event.progress>=0&&frame.event.progress<1);}}
 assert.deepEqual(found,new Set(['conversation','toy','sneeze','lightning','fireworks']));assert.equal(ambientFrame(33,20000,true).event,undefined);assert.throws(()=>ambientFrame(1,NaN));assert.throws(()=>ambientFrame(1,-1));
});
test('decorative meshes and NPCs stay bounded through long animation and dispose completely',()=>{
 const engine=new NullEngine(),scene=new Scene(engine),view=new RealmAmbience3D(scene,33,[{x:38,y:2,z:0},{x:106,y:2,z:0}],()=>2);const count=scene.meshes.length;
 try{assert.ok(count>80);assert.ok(scene.meshes.some(m=>m.name.startsWith("dressing-batch:")));for(let t=0;t<100000;t+=200){view.update(t,false,false);assert.equal(scene.meshes.length,count);assert.ok(scene.meshes.every(m=>m.position.asArray().every(Number.isFinite)));assert.equal(scene.getMeshByName('distant-lightning').isEnabled(),false);}view.update(100000,true);const poses=scene.meshes.map(m=>m.position.asArray());view.update(130000,true);assert.deepEqual(scene.meshes.map(m=>m.position.asArray()),poses);view.dispose();view.dispose();assert.equal(scene.meshes.length,0);assert.equal(scene.transformNodes.length,0);assert.equal(scene.materials.length,0);}finally{view.dispose();scene.dispose();engine.dispose();}
});
test('heartbeat uses actual snapshot age and never labels a stalled realm live',()=>{
 assert.equal(realmHeartbeat(false,0).state,'offline');assert.equal(realmHeartbeat(true,499).state,'live');assert.equal(realmHeartbeat(true,500).state,'waiting');assert.equal(realmHeartbeat(true,5000).state,'lost');assert.equal(realmHeartbeat(true,0,true).state,'paused');assert.equal(realmHeartbeat(true,Infinity).state,'lost');
 assert.equal(realmHeartbeat(true,0,false,false).state,'waiting');
});
