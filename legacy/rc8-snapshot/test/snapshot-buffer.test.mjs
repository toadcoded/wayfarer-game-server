import test from 'node:test';
import assert from 'node:assert/strict';
import {SnapshotBuffer} from '../dist/snapshot-buffer.js';
const snapshot=(tick,x=0,ids=['p1'])=>({version:1,tick,simulationTimeMs:tick*50,players:ids.map(id=>({id,position:{x,y:x/2,z:0},lastInputSequence:0,blocked:false}))});
test('presentation interpolates known positions and heights without modifying authority',()=>{
 const b=new SnapshotBuffer(),first=snapshot(0),second=snapshot(2,.4);b.push(first,1000);b.push(second,1100);
 assert.equal(b.sample(1100).players[0].position.x,0);const mid=b.sample(1150);assert.equal(mid.players[0].position.x,.2);assert.equal(mid.players[0].position.y,.1);
 mid.players[0].position.x=99;second.players[0].position.x=99;assert.equal(b.sample(1200).players[0].position.x,.4);
});
test('missing updates never extrapolate past last known position',()=>{
 const b=new SnapshotBuffer();b.push(snapshot(0),0);b.push(snapshot(2,.4),100);
 assert.equal(b.sample(10000).players[0].position.x,.4);assert.equal(b.sample(599).stale,false);assert.equal(b.sample(600).stale,true);
});
test('out-of-order and duplicate samples do not refresh liveness or reverse motion',()=>{
 const b=new SnapshotBuffer();b.push(snapshot(2,.4),100);assert.equal(b.push(snapshot(1,0),200),false);assert.equal(b.push(snapshot(2,9),300),false);
 assert.equal(b.sample(600).stale,true);assert.equal(b.sample(600).players[0].position.x,.4);
});
test('teleports and long gaps snap immediately instead of crossing the intervening world',()=>{
 const b=new SnapshotBuffer();b.push(snapshot(0),0);b.push(snapshot(2,20),100);assert.equal(b.sample(100).players[0].position.x,20);
 b.clear();b.push(snapshot(0),0);b.push(snapshot(20,2),1000);assert.equal(b.sample(1000).players[0].position.x,2);
});
test('latest membership removes departed players and introduces new ones immediately',()=>{
 const b=new SnapshotBuffer();b.push(snapshot(0,0,['p1','p2']),0);b.push(snapshot(2,.4,['p1','p3']),100);
 assert.deepEqual(b.sample(100).players.map(p=>p.id),['p1','p3']);assert.equal(b.sample(100).players[1].position.x,.4);
});
test('buffer retains at most 32 snapshots and clear removes prior connection history',()=>{
 const b=new SnapshotBuffer();for(let i=0;i<100;i++)b.push(snapshot(i,i*.1),i*50);assert.equal(b.size,32);
 b.clear();assert.equal(b.size,0);assert.deepEqual(b.sample(9999).players,[]);assert.equal(b.push(snapshot(0),0),true);
});
test('invalid clocks and delay are rejected; backward arrival does not replace state',()=>{
 assert.throws(()=>new SnapshotBuffer(Infinity));assert.throws(()=>new SnapshotBuffer(-1));const b=new SnapshotBuffer();b.push(snapshot(0),100);
 assert.equal(b.push(snapshot(1),99),false);assert.throws(()=>b.push(snapshot(2),NaN));assert.throws(()=>b.sample(-1));assert.throws(()=>b.sample(NaN));assert.equal(b.sample(50).ageMs,0);
});

test('jitter and backward presentation timestamps never rewind the render timeline',()=>{
 const b=new SnapshotBuffer();b.push(snapshot(0),0);b.push(snapshot(2,.4),100);
 const before=b.sample(190).players[0].position.x;b.push(snapshot(3,.6),190);
 assert.ok(b.sample(190).players[0].position.x>=before);assert.ok(b.sample(150).players[0].position.x>=before);
});
