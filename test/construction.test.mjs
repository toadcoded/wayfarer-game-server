import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ConstructionWorld,surfaceMesh,surfaceHeight,railColliders} from '../dist/construction.js';
import {terrainSampler,NavigationWorld} from '../dist/navigation.js';
import {planCrossing,mountCrossing,inspectNearby,CROSSING_STYLES} from '../dist/crossings.js';
import {ServerWalker,encodeMoveIntent} from '../dist/movement.js';
const dry=(x,z)=>({height:0,slopeDegrees:0,waterDepth:0});
const water=(x,z)=>({height:0,slopeDegrees:0,waterDepth:2});
const bridge={id:'deck',bounds:{minX:-5,maxX:5,minZ:-3,maxZ:3},axis:'x',startY:3,endY:3,thickness:.4,color:'#987654'};
test('bridge supports replace deep-water walking only inside their footprint',()=>{
 const w=new ConstructionWorld(water);w.addSurface(bridge);
 assert.equal(w.sample(0,0).height,3);assert.equal(w.sample(0,0).waterDepth,0);
 assert.equal(w.sample(0,4).waterDepth,2);
 w.removeSurface('deck');assert.equal(w.sample(0,0).waterDepth,2);
});
test('submerged decks stay wet, and buried decks do not replace terrain',()=>{
 const w=new ConstructionWorld(water);w.addSurface({...bridge,startY:1,endY:1});assert.equal(w.sample(0,0).waterDepth,1);
 const buried=new ConstructionWorld(dry);buried.addSurface({...bridge,startY:-2,endY:-2});assert.equal(buried.sample(0,0).height,0);
});
test('ramp top geometry and navigation agree along both axes',()=>{
 for(const axis of ['x','z']){
  const w=new ConstructionWorld(dry),s={...bridge,axis,startY:1,endY:3};w.addSurface(s);const mesh=surfaceMesh(s);
  for(let i=0;i<4;i++){
   const x=mesh.positions[i*3],z=mesh.positions[i*3+2];assert.ok(Math.abs(w.sample(x,z).height-mesh.positions[i*3+1])<1e-6);
  }
  assert.equal(w.sample(0,0).height,2);assert.ok(w.sample(0,0).slopeDegrees>0);
 }
});
test('foundation interior is level and blend joins untouched ground continuously',()=>{
 const base=(x,z)=>({height:x*.1+z*.05,slopeDegrees:7,waterDepth:0}),w=new ConstructionWorld(base);
 w.addPad({id:'pad',bounds:{minX:-4,maxX:4,minZ:-4,maxZ:4},elevation:3,blend:6});
 assert.equal(w.sample(0,0).height,3);assert.equal(w.sample(3.5,-2.5).height,3);
 assert.ok(Math.abs(w.terrainAt(10,0).height-base(10,0).height)<1e-9);
 assert.ok(Math.abs(w.terrainAt(9.9999,0).height-w.terrainAt(10.0001,0).height)<.001);
});
test('edited terrain triangles match samples at fractional positions and shared mesh borders',()=>{
 const w=new ConstructionWorld(dry);w.addPad({id:'p',bounds:{minX:-2,maxX:2,minZ:-2,maxZ:2},elevation:2,blend:4});
 const a=w.terrainMesh({minX:-8,maxX:0,minZ:-8,maxZ:8},'#777777'),b=w.terrainMesh({minX:0,maxX:8,minZ:-8,maxZ:8},'#777777');
 for(let z=0;z<=16;z++)assert.equal(a.positions[(z*9+8)*3+1],b.positions[(z*9)*3+1]);
 const full=w.terrainMesh({minX:-8,maxX:8,minZ:-8,maxZ:8},'#777777');
 for(let z=0;z<16;z++)for(let x=0;x<16;x++){
  const idx=z*17+x,aa=full.positions[idx*3+1],bb=full.positions[(idx+1)*3+1],cc=full.positions[(idx+17)*3+1];
  assert.ok(Math.abs(w.terrainAt(-8+x+.2,-8+z+.3).height-(aa+(bb-aa)*.2+(cc-aa)*.3))<1e-5);
 }
});
test('conflicting earthworks, overlapping decks and invalid pad sizes are rejected',()=>{
 const w=new ConstructionWorld(dry),p={id:'p',bounds:{minX:0,maxX:4,minZ:0,maxZ:4},elevation:2,blend:4};w.addPad(p);
 assert.throws(()=>w.addPad({...p,id:'q'}));assert.throws(()=>w.addPad({...p,id:'bad',blend:0}));
 w.addSurface(bridge);assert.throws(()=>w.addSurface({...bridge,id:'overlap'}));
});
test('bridge rails block sideways exits while the walking center remains clear',()=>{
 const w=new ConstructionWorld(water);w.addSurface(bridge);
 const n=new NavigationWorld(w.sample,{bounds:{minX:-10,maxX:10,minZ:-10,maxZ:10}});
 for(const c of railColliders(bridge))n.upsertCollider(c);
 assert.equal(n.traverse({x:-4,z:0},{x:4,z:0}).ok,true);assert.equal(n.traverse({x:0,z:0},{x:0,z:3}).ok,false);
});
test('all three themed plans cross real generated water with fitted dry landings',()=>{
 const base=terrainSampler({seed:20260928,generatorVersion:1});
 for(const [style,z] of [['willowglass',0],['saffron',128],['mothlight',-128]]){
  const p=planCrossing(base,{id:style,style,z,minX:-16,maxX:176});const {construction,navigation}=mountCrossing(base,p);
  assert.equal(p.name,CROSSING_STYLES[style].name);assert.equal(navigation.traverse(p.start,p.goal).ok,true);
  assert.equal(navigation.findPath(p.start,p.goal).status,'found');
  const deck=p.surfaces[1],mid=(deck.bounds.minX+deck.bounds.maxX)/2;
  assert.ok(base(mid,z).waterDepth>.15);assert.equal(construction.sample(mid,z).waterDepth,0);
  for(const pad of p.pads)assert.equal(construction.terrainAt((pad.bounds.minX+pad.bounds.maxX)/2,z).height,pad.elevation);
 }
});
test('fixed-tick server walker completes a real bridge crossing without teleporting or sinking',()=>{
 const base=terrainSampler({seed:20260928,generatorVersion:1});const p=planCrossing(base,{id:'walk',style:'willowglass',z:0,minX:-16,maxX:176});
 const {construction,navigation}=mountCrossing(base,p),walker=new ServerWalker(navigation,p.start);
 let previous=walker.snapshot().position;
 for(let tick=0;tick<Math.ceil((p.goal.x-p.start.x)/.2);tick++){
  walker.receiveInput(encodeMoveIntent({sequence:tick,dx:Math.min(1,(p.goal.x-previous.x)/.2),dz:0}));
  const s=walker.advance();assert.equal(s.blocked,false);assert.ok(Math.hypot(s.position.x-previous.x,s.position.z-previous.z)<=.200001);
  assert.ok(Math.abs(s.position.y-construction.sample(s.position.x,s.position.z).height)<1e-9);previous=s.position;
 }
 assert.ok(Math.abs(previous.x-p.goal.x)<1e-6);
});
test('planner rejects dry sites, clipped banks, multiple channels and invalid options',()=>{
 assert.throws(()=>planCrossing(dry,{id:'dry',style:'willowglass',z:0,minX:-16,maxX:176}),/No water/);
 assert.throws(()=>planCrossing(water,{id:'wet',style:'willowglass',z:0,minX:-16,maxX:176}),/banks/);
 assert.throws(()=>planCrossing(dry,{id:'bad',style:'willowglass',z:0,minX:0,maxX:999}),/options/);
 const two=(x,z)=>({...dry(x,z),waterDepth:(x>-10&&x<-5)||(x>5&&x<10)?1:0});
 assert.throws(()=>planCrossing(two,{id:'two',style:'willowglass',z:0,minX:-20,maxX:20}),/Multiple/);
});
test('nearby inscriptions respect three-dimensional inspection distance',()=>{
 const base=terrainSampler({seed:20260928,generatorVersion:1});const p=planCrossing(base,{id:'inspect',style:'willowglass',z:0,minX:-16,maxX:176});
 const spot=p.inspection[0].position;assert.equal(inspectNearby(p,spot).length,1);
 assert.equal(inspectNearby(p,{...spot,y:spot.y+10}).length,0);
 const copy=inspectNearby(p,spot);copy[0].position.x=999;assert.notEqual(p.inspection[0].position.x,999);
});

test('site reservations clear conflicting generated props and leave source chunks untouched',async()=>{
 const {reserveSites}=await import('../dist/site-placement.js');const {generateChunk}=await import('../dist/world.js');
 const base=terrainSampler({seed:20260928,generatorVersion:1}),p=planCrossing(base,{id:'reserved',style:'willowglass',z:0,minX:-16,maxX:176});
 const source={...generateChunk({seed:1,generatorVersion:1},0,0),props:[
  {id:'on-deck',kind:'tree',position:{x:72,y:0,z:0},yaw:0,scale:1},
  {id:'far',kind:'tree',position:{x:-50,y:0,z:-50},yaw:0,scale:1},
 ]};
 const result=reserveSites(source,[p]);assert.deepEqual(result.props.map(p=>p.id),['far']);assert.equal(source.props.length,2);
});
test('reference scene buffers are finite, indexed correctly and reproduce identically',async()=>{
 const {crossingScene}=await import('../dist/scene-meshes.js');const c={seed:20260928,generatorVersion:1},base=terrainSampler(c);
 const p=planCrossing(base,{id:'scene',style:'willowglass',z:0,minX:-16,maxX:176});const meshes=crossingScene(c,p);
 assert.ok(meshes.length>20);
 for(const m of meshes){assert.ok([...m.positions].every(Number.isFinite));assert.ok([...m.indices].every(i=>i<m.positions.length/3));}
 assert.deepEqual(crossingScene(c,p),meshes);
});

test('adjacent ramps cannot silently register a discontinuous seam',()=>{
 const w=new ConstructionWorld(dry);w.addSurface(bridge);
 assert.throws(()=>w.addSurface({...bridge,id:'bad-ramp',bounds:{...bridge.bounds,minX:5,maxX:10},startY:9,endY:0}),/seam/);
 w.addSurface({...bridge,id:'ramp',bounds:{...bridge.bounds,minX:5,maxX:10},startY:3,endY:0});
 assert.equal(w.sample(5,0).height,3);
});
test('reserved procedural props and neighboring structures do not block the verified crossing',async()=>{
 const {reserveSites}=await import('../dist/site-placement.js');const {generateChunk}=await import('../dist/world.js');
 const {NavigationChunks}=await import('../dist/navigation-chunks.js');
 const config={seed:20260928,generatorVersion:1},base=terrainSampler(config);
 const p=planCrossing(base,{id:'full',style:'willowglass',z:0,minX:-16,maxX:176}),{navigation}=mountCrossing(base,p);
 const registry=new NavigationChunks(navigation);
 for(let cx=-1;cx<=3;cx++)for(let cz=-2;cz<=1;cz++)registry.mount(reserveSites(generateChunk(config,cx,cz),[p]));
 assert.equal(navigation.traverse(p.start,p.goal).ok,true);
 registry.dispose();assert.equal(navigation.traverse(p.start,p.goal).ok,true);
});
