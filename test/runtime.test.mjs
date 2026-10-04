import test from 'node:test';
import assert from 'node:assert/strict';
import { FixedClock } from '../dist/fixed-clock.js';
import { RealmRuntime } from '../dist/realm-runtime.js';
import { NavigationWorld, terrainSampler } from '../dist/navigation.js';
import { encodeMoveIntent } from '../dist/movement.js';
import { checkedSnapshot, encodeRealmSnapshot, decodeRealmSnapshot, MAX_SNAPSHOT_BYTES } from '../dist/replication.js';
import { SocketFlowGate } from '../dist/transport-guard.js';
import { planCrossing, mountCrossing } from '../dist/crossings.js';

const flat = () => new NavigationWorld(() => ({height:0,slopeDegrees:0,waterDepth:0}),{bounds:{minX:-150,maxX:150,minZ:-150,maxZ:150}});
const packet = (sequence, dx=1, dz=0) => encodeMoveIntent({sequence,dx,dz});
const fixture = () => ({version:1,tick:2,simulationTimeMs:100,players:[{id:'p1',position:{x:0,y:0,z:0},lastInputSequence:-1,blocked:false}]});

test('fixed clock preserves cadence across irregular frame partitions',()=>{
  const a=new FixedClock(),b=new FixedClock();let ca=0,cb=0;
  for(const dt of [7,14,29,101,49])a.advance(dt,()=>ca++);
  for(let i=0;i<4;i++)b.advance(50,()=>cb++);
  assert.equal(ca,4);assert.equal(ca,cb);
});
test('long stalls have four-step budget and no delayed catch-up debt',()=>{
  const c=new FixedClock();let n=0;c.advance(49,()=>n++);
  const r=c.advance(10000,()=>n++);assert.equal(r.steps,4);assert.equal(r.droppedMs,9800);assert.equal(n,4);
  assert.equal(c.advance(0,()=>n++).steps,0);assert.equal(c.advance(1,()=>n++).steps,1);
});
test('invalid clock deltas leave accumulator unchanged',()=>{
  const c=new FixedClock();c.advance(25,()=>{});
  for(const dt of [-1,NaN,Infinity])assert.throws(()=>c.advance(dt,()=>{}));
  assert.equal(c.advance(25,()=>{}).steps,1);
});
test('reset removes fractional tick and clock rejects recursive advancement',()=>{
  const c=new FixedClock();c.advance(49,()=>{});c.reset();assert.equal(c.advance(1,()=>{}).steps,0);
  assert.throws(()=>c.advance(50,()=>c.advance(50,()=>{})),/recursively/);
});
test('realm packet flood cannot advance state or expose connection credentials',()=>{
  const r=new RealmRuntime(flat());r.join('private-session-token',{x:0,z:0});
  for(let i=0;i<10000;i++)r.receive('private-session-token',packet(i));
  assert.equal(r.tick,0);assert.equal(r.stateFor('private-session-token').position.x,0);
  r.advance(50);assert.equal(r.tick,1);assert.equal(r.stateFor('private-session-token').position.x,.2);
  assert.ok(!encodeRealmSnapshot(r.snapshotFor('private-session-token')).includes('private-session-token'));
});
test('visibility originates at authoritative player location and snapshot copies are isolated',()=>{
  const r=new RealmRuntime(flat(),{visibilityRadius:10});
  r.join('a',{x:0,z:0});r.join('b',{x:10,z:0});r.join('c',{x:11,z:0});
  const s=r.snapshotFor('a');assert.deepEqual(s.players.map(p=>p.id),['p1','p2']);
  s.players[0].position.x=99;s.players.pop();assert.equal(r.stateFor('a').position.x,0);assert.equal(r.snapshotFor('a').players.length,2);
  assert.equal(r.snapshotFor('missing'),undefined);
});
test('realm rejects forged input fields and stale sequence numbers',()=>{
  const r=new RealmRuntime(flat());r.join('a',{x:0,z:0});
  for(const extra of [{id:'other'},{speed:100},{time:5000},{position:{x:100,z:0}}])assert.equal(r.receive('a',JSON.stringify({sequence:0,dx:1,dz:0,...extra})),false);
  assert.equal(r.receive('a',packet(1)),true);assert.equal(r.receive('a',packet(1)),false);
  assert.equal(r.receive('missing',packet(1)),false);
});
test('disconnect removes visibility and reconnect receives a new public id and sequence scope',()=>{
  const r=new RealmRuntime(flat(),{capacity:2});const a=r.join('a',{x:0,z:0});r.join('b',{x:1,z:0});
  assert.throws(()=>r.join('c',{x:2,z:0}));r.receive('a',packet(90));
  assert.equal(r.leave('a'),true);assert.equal(r.leave('a'),false);assert.equal(r.snapshotFor('b').players.length,1);
  const next=r.join('a',{x:0,z:0});assert.notEqual(next.id,a.id);assert.equal(r.receive('a',packet(0)),true);
});
test('late joins use realm snapshot clock while idle intent expires',()=>{
  const r=new RealmRuntime(flat());r.join('a',{x:0,z:0});r.receive('a',packet(0));
  for(let i=0;i<20;i++)r.advance(50);
  assert.ok(Math.abs(r.stateFor('a').position.x-2)<1e-10);
  r.join('b',{x:5,z:0});const s=r.snapshotFor('b');assert.equal(s.tick,20);assert.equal(s.simulationTimeMs,1000);assert.equal(s.players.length,2);
});
test('realm long stall is bounded and invalid delta does not move a player',()=>{
  const r=new RealmRuntime(flat());r.join('a',{x:0,z:0});r.receive('a',packet(0));
  assert.throws(()=>r.advance(NaN));const result=r.advance(60000);assert.equal(result.steps,4);assert.equal(r.stateFor('a').position.x,.8);
});
test('realm enforces option and spawn limits without retaining failed joins',()=>{
  for(const options of [{capacity:0},{capacity:257},{visibilityRadius:Infinity},{visibilityRadius:0}])assert.throws(()=>new RealmRuntime(flat(),options));
  const r=new RealmRuntime(flat());assert.throws(()=>r.join('a',{x:NaN,z:0}));assert.equal(r.size,0);
  r.join('a',{x:0,z:0});assert.throws(()=>r.join('a',{x:1,z:0}));assert.equal(r.size,1);
});
test('realm wall collisions remain authoritative for two independently moving players',()=>{
  const nav=flat();nav.upsertCollider({id:'wall',minX:1,maxX:1.05,minZ:-5,maxZ:5,minY:0,maxY:5});
  const r=new RealmRuntime(nav);r.join('a',{x:0,z:0});r.join('b',{x:-3,z:0});
  for(let i=0;i<20;i++){r.receive('a',packet(i));r.receive('b',packet(i,0,1));r.advance(50);}
  assert.ok(r.stateFor('a').position.x<.66);assert.equal(r.stateFor('a').blocked,true);assert.ok(r.stateFor('b').position.z>3.9);
});
test('snapshot codec roundtrips, copies state and rejects unexpected fields at every level',()=>{
  const s=fixture();assert.deepEqual(decodeRealmSnapshot(encodeRealmSnapshot(s)),s);
  const copy=checkedSnapshot(s);copy.players[0].position.x=5;assert.equal(s.players[0].position.x,0);
  for(const mutate of [s=>s.extra=1,s=>s.players[0].speed=100,s=>s.players[0].position.w=1]){const v=fixture();mutate(v);assert.throws(()=>decodeRealmSnapshot(JSON.stringify(v)));}
});
test('snapshot rejects duplicates, invalid clock, coordinates, identities and sequence values',()=>{
  const mutations=[s=>s.players.push(s.players[0]),s=>s.version=2,s=>s.tick=-1,s=>s.simulationTimeMs=99,s=>s.players[0].position.x=1e9,s=>s.players[0].position.y=null,s=>s.players[0].id='connection-secret',s=>s.players[0].lastInputSequence=-2,s=>s.players[0].blocked=1];
  for(const mutate of mutations){const s=fixture();mutate(s);assert.throws(()=>decodeRealmSnapshot(JSON.stringify(s)));}
});
test('snapshot rejects malformed, oversized and excessively populated data',()=>{
  for(const text of ['null','[]','{',' '.repeat(MAX_SNAPSHOT_BYTES+1)])assert.throws(()=>decodeRealmSnapshot(text));
  const s=fixture();s.players=Array.from({length:257},(_,i)=>({...fixture().players[0],id:`p${i+1}`}));assert.throws(()=>encodeRealmSnapshot(s));
});
test('transport gate accounts for projected queue and drops cosmetics before state',()=>{
  const g=new SocketFlowGate(100,1000);
  assert.equal(g.decide(80,10,'transient'),'send');assert.equal(g.decide(80,20,'transient'),'drop');
  assert.equal(g.decide(80,20,'state'),'send');assert.equal(g.decide(990,10,'critical'),'close');assert.equal(g.decide(0,1001,'state'),'close');
});
test('transport gate rejects invalid budgets, sizes and priorities',()=>{
  assert.throws(()=>new SocketFlowGate(10,10));
  const g=new SocketFlowGate();for(const args of [[NaN,1,'state'],[0,-1,'state'],[0,.5,'state'],[0,1,'bogus']])assert.throws(()=>g.decide(...args));
});
for(const style of ['willowglass','saffron','mothlight'])test(`realm fixed-clock traversal: ${style}`,()=>{
  const config={seed:20260928,generatorVersion:1};const base=terrainSampler(config);
  const plan=planCrossing(base,{id:'realm-test',style,z:0,minX:-16,maxX:176});const {navigation}=mountCrossing(base,plan);
  const realm=new RealmRuntime(navigation);realm.join('a',plan.start);let sequence=0;
  const result=navigation.findPath(plan.start,plan.goal);assert.equal(result.status,'found');const route=result.points.slice(1);
  for(let frame=0;frame<2000&&route.length;frame++)realm.advance(50,()=>{
    const p=realm.stateFor('a').position;while(route[0]&&Math.hypot(route[0].x-p.x,route[0].z-p.z)<.04)route.shift();
    const next=route[0];let dx=0,dz=0;if(next){const n=Math.max(.2,Math.hypot(next.x-p.x,next.z-p.z));dx=(next.x-p.x)/n;dz=(next.z-p.z)/n;}
    realm.receive('a',packet(sequence++,dx,dz));
  });
  const p=realm.stateFor('a').position;assert.ok(Math.hypot(p.x-plan.goal.x,p.z-plan.goal.z)<.05);
});
