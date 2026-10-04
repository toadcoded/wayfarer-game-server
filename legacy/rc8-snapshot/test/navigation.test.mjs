import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NavigationWorld,terrainSampler} from '../dist/navigation.js';
import {ServerWalker,encodeMoveIntent,decodeMoveIntent,stepMovement} from '../dist/movement.js';
import {generateChunk} from '../dist/world.js';
import {landmarkPrimitives} from '../dist/geometry.js';
const flat=()=>({height:0,slopeDegrees:0,waterDepth:0});
const area={minX:-20,maxX:20,minZ:-20,maxZ:20};
const make=(sample=flat,options={})=>new NavigationWorld(sample,{bounds:area,cellSize:1,radius:.3,...options});
const wall={id:'wall',minX:-.01,maxX:.01,minY:-1,maxY:4,minZ:-5,maxZ:5};
test('thin walls cannot be tunneled through between samples',()=>{
 const n=make(flat,{sampleSpacing:1,radius:0});n.upsertCollider(wall);
 assert.equal(n.check({x:-.5,z:0}).ok,true);assert.equal(n.check({x:.5,z:0}).ok,true);
 assert.deepEqual(n.traverse({x:-.5,z:0},{x:.5,z:0}),{ok:false,reason:'obstacle'});
});
test('pathfinder goes around walls and every returned segment is traversable',()=>{
 const n=make();n.upsertCollider(wall);const a=n.findPath({x:-5,z:0},{x:5,z:0});
 assert.equal(a.status,'found');assert.ok(a.points.some(p=>Math.abs(p.z)>5));
 for(let i=1;i<a.points.length;i++)assert.equal(n.traverse(a.points[i-1],a.points[i]).ok,true);
 assert.deepEqual(n.findPath({x:-5,z:0},{x:5,z:0}),a);
});
test('sealed barriers and search budgets report explicit failures',()=>{
 const n=make();n.upsertCollider({...wall,minZ:-20,maxZ:20});
 assert.equal(n.findPath({x:-5,z:0},{x:5,z:0},1).status,'budget-exceeded');
 assert.equal(n.findPath({x:-5,z:0},{x:5,z:0}).status,'unreachable');
});
test('water, steep slopes, steps, bounds and invalid ground are rejected',()=>{
 assert.equal(make(()=>({...flat(),waterDepth:1})).check({x:0,z:0}).reason,'water');
 assert.equal(make(()=>({...flat(),slopeDegrees:65})).check({x:0,z:0}).reason,'slope');
 assert.equal(make(()=>({...flat(),height:NaN})).check({x:0,z:0}).reason,'invalid-ground');
 assert.equal(make().check({x:19.9,z:0}).reason,'bounds');
 assert.equal(make(x=>({...flat(),height:x>0?3:0})).traverse({x:-1,z:0},{x:1,z:0}).reason,'step');
});
test('stronghold gate opening is passable while adjoining wall remains solid',()=>{
 const n=make();const c=generateChunk({seed:1,generatorVersion:1},0,0);
 n.addPrimitives(landmarkPrimitives({...c,landmarks:[{id:'keep',kind:'stronghold',position:{x:0,y:0,z:0},radius:24}]}));
 assert.equal(n.traverse({x:0,z:17},{x:0,z:10}).ok,true);
 assert.equal(n.traverse({x:8,z:17},{x:8,z:10}).ok,false);
});
test('adding and removing a gate collider updates routes immediately',()=>{
 const n=make();const before=n.revision;n.upsertCollider({...wall,id:'gate'});
 assert.ok(n.revision>before);assert.equal(n.traverse({x:-1,z:0},{x:1,z:0}).ok,false);
 assert.equal(n.removeCollider('gate'),true);assert.equal(n.traverse({x:-1,z:0},{x:1,z:0}).ok,true);
});
test('mesh triangle sampling agrees at vertices and interiors including negative coordinates',()=>{
 const c={seed:20260928,generatorVersion:1},sample=terrainSampler(c);
 for(const [cx,cz] of [[0,0],[-1,-1],[3,3]]){
  const chunk=generateChunk(c,cx,cz),a=chunk.heights[0],b=chunk.heights[1],cc=chunk.heights[17],d=chunk.heights[18];
  assert.equal(sample(cx*64,cz*64).height,a);
  assert.ok(Math.abs(sample(cx*64+1,cz*64+1).height-(a+(b-a)*.25+(cc-a)*.25))<1e-9);
  assert.ok(Math.abs(sample(cx*64+3,cz*64+3).height-(d+(cc-d)*.25+(b-d)*.25))<1e-9);
 }
});
test('diagonal movement is normalized and duplicate inputs are ignored',()=>{
 const w=new ServerWalker(make(),{x:0,z:0},{speed:4,ticksPerSecond:20});
 const msg=encodeMoveIntent({sequence:1,dx:1,dz:1});assert.equal(w.receiveInput(msg),true);assert.equal(w.receiveInput(msg),false);
 const s=w.advance();assert.ok(Math.abs(Math.hypot(s.position.x,s.position.z)-.2)<1e-12);
});
test('packet flooding does not advance simulation and stale held input stops',()=>{
 const w=new ServerWalker(make(),{x:0,z:0},{idleTimeoutTicks:2});
 for(let i=0;i<100;i++)w.receiveInput(encodeMoveIntent({sequence:i,dx:1,dz:0}));
 assert.equal(w.snapshot().position.x,0);w.advance();w.advance();assert.equal(w.snapshot().position.x,.4);
 w.advance();assert.equal(w.snapshot().position.x,.4);
});
test('sliding follows wall without crossing it or increasing speed',()=>{
 const n=make();n.upsertCollider(wall);const p={x:-.32,y:0,z:0};
 assert.equal(n.check(p).ok,true);
 const r=stepMovement(n,p,{x:1,z:1},4,.05);assert.equal(r.blocked,true);assert.equal(r.position.x,p.x);assert.ok(r.position.z>0);
 assert.ok(Math.hypot(r.position.x-p.x,r.position.z-p.z)<=.2);
});
test('movement codec rejects injected speed, timestamps, coordinates and invalid sequence',()=>{
 for(const o of [{sequence:1,dx:2,dz:0},{sequence:-1,dx:0,dz:0},{sequence:1,dx:0,dz:0,speed:999},{sequence:1,dx:0,dz:0,dt:999},null])assert.throws(()=>decodeMoveIntent(JSON.stringify(o)));
 assert.throws(()=>decodeMoveIntent(' '.repeat(257)));assert.throws(()=>new ServerWalker(make(),{x:99,z:99}));
});

test('chunk collider lifetime includes props and preserves unrelated dynamic gates',async()=>{
 const {NavigationChunks}=await import('../dist/navigation-chunks.js');const n=make(),registry=new NavigationChunks(n);
 n.upsertCollider({...wall,id:'dynamic-gate',minZ:8,maxZ:10});
 const chunk={...generateChunk({seed:1,generatorVersion:1},0,0),landmarks:[],props:[{id:'tree',kind:'tree',position:{x:0,y:0,z:0},yaw:0,scale:1}]};
 registry.mount(chunk);const revision=n.revision;registry.mount(chunk);assert.equal(n.revision,revision);
 assert.equal(n.check({x:0,z:0}).reason,'obstacle');registry.unmount(chunk.id);assert.equal(n.check({x:0,z:0}).ok,true);
 assert.equal(n.check({x:0,z:9}).reason,'obstacle');registry.dispose();
});
test('all eight prop kinds generate valid shared geometry and unique ids',async()=>{
 const {propPrimitives}=await import('../dist/geometry.js');
 const chunk={...generateChunk({seed:1,generatorVersion:1},0,0),props:['tree','rock','flower','reed','cactus','palm','crystal','ruin'].map((kind,i)=>({id:`prop${i}`,kind,position:{x:i*10,y:0,z:0},yaw:0,scale:1}))};
 const parts=propPrimitives(chunk);assert.equal(new Set(parts.map(p=>p.id)).size,parts.length);
 assert.ok(parts.length>=8);assert.ok(parts.every(p=>p.size.x>0&&p.size.y>0&&p.size.z>0));
});
