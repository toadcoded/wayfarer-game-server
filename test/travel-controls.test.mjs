import test from 'node:test';import assert from 'node:assert/strict';
import {ServerWalker,encodeMoveIntent,decodeMoveIntent} from '../dist/movement.js';
import {NavigationWorld} from '../dist/navigation.js';import {cameraDirection,dampAngle} from '../dist/travel-controls.js';
import {RealmRuntime} from '../dist/realm-runtime.js';import {checkedSnapshot} from '../dist/replication.js';
import {NullEngine} from '@babylonjs/core';import {Realm3D} from '../dist/realm-3d.js';
const nav=()=>new NavigationWorld(()=>({height:0,slopeDegrees:0,waterDepth:0}),{bounds:{minX:-200,maxX:200,minZ:-20,maxZ:20},cellSize:1,radius:.3});
function tick(w,sequence,mode='jog',dx=1,dz=0){w.receiveInput(encodeMoveIntent({sequence,dx,dz,mode}));return w.advance();}
test('camera-relative input rotates correctly without diagonal speed advantage; turns take shortest arc',()=>{
 assert.ok(Math.abs(cameraDirection(0,1,-Math.PI/2).dz-1)<1e-12);assert.ok(Math.abs(cameraDirection(1,0,-Math.PI/2).dx-1)<1e-12);
 for(let alpha=-6;alpha<6;alpha+=.2)assert.ok(Math.hypot(...Object.values(cameraDirection(1,1,alpha)))<=1+1e-12);
 const a=dampAngle(Math.PI-.05,-Math.PI+.05,.05);assert.ok(a>Math.PI-.05&&a<Math.PI+.05);assert.throws(()=>cameraDirection(2,0,0));
});
test('walk jog run accelerate to distinct host-owned speeds; releases and timeout stop immediately',()=>{
 for(const [mode,speed] of [['walk',2],['jog',4],['run',6.25]]){const w=new ServerWalker(nav(),{x:0,z:0});let before=0;for(let i=0;i<40;i++){const s=tick(w,i,mode);const distance=s.position.x-before;assert.ok(distance<=speed/20+1e-10);if(i===39)assert.ok(Math.abs(distance-speed/20)<1e-10);before=s.position.x;}const stopped=tick(w,40,mode,0);assert.equal(stopped.position.x,before);assert.equal(w.snapshot().travelMode,mode);}
 const w=new ServerWalker(nav(),{x:0,z:0},{idleTimeoutTicks:2});tick(w,0,'run');w.advance();const before=w.snapshot().position.x;w.advance();assert.equal(w.snapshot().position.x,before);
});
test('run exhaustion falls back to jog, needs recovery and mode switch; input flood cannot change energy',()=>{
 const w=new ServerWalker(nav(),{x:0,z:0});for(let i=0;i<340;i++)tick(w,i,'run');assert.equal(w.snapshot().travelMode,'jog');assert.ok(w.snapshot().runEnergy<2);
 const before=w.inspection();for(let i=340;i<400;i++)w.receiveInput(encodeMoveIntent({sequence:i,dx:1,dz:0,mode:'run'}));assert.equal(w.snapshot().runEnergy,before.state.runEnergy);assert.deepEqual(w.snapshot().position,before.state.position);
 for(let i=400;i<500;i++)tick(w,i,'walk',0);assert.ok(w.snapshot().runEnergy>=20);assert.equal(tick(w,500,'run').travelMode,'run');
 assert.throws(()=>decodeMoveIntent('{"sequence":1,"dx":0,"dz":0,"mode":"fly"}'));assert.throws(()=>decodeMoveIntent('{"sequence":1,"dx":0,"dz":0,"mode":"run","runEnergy":100}'));
});
test('staged movement preserves live speed and energy; enhanced replicated state is strict and detached',()=>{
 const w=new ServerWalker(nav(),{x:0,z:0});tick(w,0,'run');const before=w.inspection(),next=w.stagedAdvance();assert.deepEqual(w.inspection(),before);assert.ok(next.snapshot().runEnergy<before.state.runEnergy);
 const r=new RealmRuntime(nav());r.join('a',{x:0,z:0});r.receive('a',encodeMoveIntent({sequence:0,dx:1,dz:1,mode:'run'}));r.advance(50);const s=r.snapshotFor('a');assert.equal(s.players[0].travelMode,'run');assert.equal(s.players[0].runEnergy,99.7);for(const value of [-1,101,NaN]){const v=structuredClone(s);v.players[0].runEnergy=value;assert.throws(()=>checkedSnapshot(v));}
});
test('camera follow preserves orbit zoom and user pan; reset and zoom respect limits',()=>{
 const engine=new NullEngine(),view=new Realm3D(undefined,engine,false);view.scene.render=()=>{};
 try{view.update([{id:'a',position:{x:0,y:0,z:0}}],undefined,'a',0,false);const camera=view.camera;camera.alpha=.5;camera.beta=.8;camera.radius=14;camera.target.x+=3;
 view.update([{id:'a',position:{x:1,y:0,z:0}}],undefined,'a',50,false);assert.equal(camera.alpha,.5);assert.equal(camera.beta,.8);assert.equal(camera.radius,14);assert.ok(camera.target.x>3&&camera.target.x<4);
 view.zoomCamera(100);assert.equal(camera.radius,75);view.zoomCamera(.001);assert.equal(camera.radius,6);view.resetCamera();assert.equal(camera.radius,23);assert.equal(camera.alpha,-Math.PI/2);assert.equal(camera.target.x,view.follow.x);assert.equal(camera.inputs.attached.keyboard,undefined);
 }finally{view.dispose();}
});
