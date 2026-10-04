import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BIOMES,BIOME_IDS,generateChunk,regionAt,surfaceAt,weatherAt,nearbyChunks,ChunkView,GRID} from '../dist/world.js';
import {encodeMessage,decodeMessage,answerChunkRequest,chunkFromMessage} from '../dist/protocol.js';
const world={seed:20260928,generatorVersion:1};
test('same seed and coordinates reproduce all descriptors regardless of generation order',()=>{
 const a=generateChunk(world,-3,4);generateChunk(world,12,-8);assert.deepEqual(generateChunk(world,-3,4),a);
 assert.notDeepEqual(generateChunk({...world,seed:1},-3,4).heights,a.heights);
});
test('east and south edges match exactly across origin and region boundaries',()=>{
 for(const [cx,cz] of [[-1,-1],[0,0],[3,3],[-5,-5],[7,7]]) {
  const a=generateChunk(world,cx,cz),b=generateChunk(world,cx+1,cz),c=generateChunk(world,cx,cz+1);
  for(let i=0;i<=GRID;i++){
   assert.equal(a.heights[i*(GRID+1)+GRID],b.heights[i*(GRID+1)]);
   assert.equal(a.heights[GRID*(GRID+1)+i],c.heights[i]);
  }
 }
});
test('generated props have stable unique ids, dry ground and finite geometry',()=>{
 const ids=new Set();
 for(let cx=-5;cx<=5;cx++)for(let cz=-5;cz<=5;cz++){
  const c=generateChunk(world,cx,cz);assert.equal(c.heights.length,289);assert.equal(c.waterDepths.length,256);
  assert.ok(c.heights.every(Number.isFinite));assert.ok(c.waterDepths.every(d=>Number.isFinite(d)&&d>=0));
  for(const p of c.props){assert.ok(!ids.has(p.id));ids.add(p.id);assert.equal(surfaceAt(world,p.position.x,p.position.z).water,false);}
 }
});
test('catalog has ten complete biome recipes and every biome is reachable',()=>{
 const seen=new Set();for(let x=-20;x<=20;x++)for(let z=-20;z<=20;z++)seen.add(regionAt(world,x*512,z*512).biome);
 assert.equal(seen.size,10);
 for(const id of BIOME_IDS){const b=BIOMES[id];assert.ok(b.themes.length&&b.props.length&&b.weather.length&&b.landmarks.length);}
});
test('negative positions floor into negative chunks',()=>assert.deepEqual(nearbyChunks(-.1,-.1,0),[{cx:-1,cz:-1}]));
test('weather is deterministic and only changes at epoch boundaries',()=>{
 const r=regionAt(world,0,0);assert.deepEqual(weatherAt(world,r,1),weatherAt(world,r,299999));
 assert.equal(weatherAt(world,r,300000).epoch,1);
});
test('codec rejects malformed, oversized, unknown, fractional and dangerous fields',()=>{
 for(const text of ['null','[]','{',JSON.stringify({schema:2}),JSON.stringify({schema:1,type:'world.request',cx:.2,cz:0}),
  JSON.stringify({schema:1,type:'world.request',cx:999999,cz:0}),
  '{"schema":1,"type":"world.request","cx":0,"cz":0,"__proto__":{}}',' '.repeat(1025)])assert.throws(()=>decodeMessage(text));
 assert.throws(()=>generateChunk({seed:NaN,generatorVersion:1},0,0));
 assert.throws(()=>nearbyChunks(Infinity,0));assert.throws(()=>generateChunk(world,0,.5));
});
test('server rejects distant requests and client rejects different world recipes',()=>{
 const req=encodeMessage({schema:1,type:'world.request',cx:0,cz:0});
 const res=answerChunkRequest(req,world,{x:0,z:0},0);assert.deepEqual(chunkFromMessage(res,world),generateChunk(world,0,0));
 assert.throws(()=>answerChunkRequest(req,world,{x:1000,z:1000},0));
 assert.throws(()=>chunkFromMessage(res,{seed:4,generatorVersion:1}));
});
test('client chunk view reuses existing chunks and disposes unloaded chunks',()=>{
 const live=new Set();let mounts=0;
 const view=new ChunkView(world,{mount(c){assert.ok(!live.has(c.id));live.add(c.id);mounts++;},unmount(id){assert.ok(live.delete(id));}});
 view.update(0,0,1);assert.equal(live.size,9);view.update(1,1,1);assert.equal(mounts,9);
 view.update(65,0,1);assert.equal(live.size,9);assert.equal(mounts,12);view.dispose();assert.equal(live.size,0);
});

test('terrain mesh has valid upward-facing indices and finite vertex buffers',async()=>{
 const {terrainMesh,landmarkPrimitives}=await import('../dist/geometry.js');
 const chunk=generateChunk(world,0,0),mesh=terrainMesh(chunk);
 assert.equal(mesh.positions.length,289*3);assert.equal(mesh.indices.length,256*6);
 assert.ok([...mesh.indices].every(i=>i>=0&&i<289));assert.ok([...mesh.positions].every(Number.isFinite));
 const [a,b,c]=mesh.indices;const ax=mesh.positions[b*3]-mesh.positions[a*3],az=mesh.positions[b*3+2]-mesh.positions[a*3+2];
 const bx=mesh.positions[c*3]-mesh.positions[a*3],bz=mesh.positions[c*3+2]-mesh.positions[a*3+2];assert.ok(az*bx-ax*bz>0);
 for(const kind of ['stronghold','garden','barrow','pyramid','shrine','bridge','village']){
  const primitives=landmarkPrimitives({...chunk,landmarks:[{id:'test',kind,position:{x:0,y:0,z:0},radius:24}]});
  assert.ok(primitives.length>0);assert.equal(new Set(primitives.map(p=>p.id)).size,primitives.length);
  assert.ok(primitives.every(p=>p.size.x>0&&p.size.y>0&&p.size.z>0));
 }
});
