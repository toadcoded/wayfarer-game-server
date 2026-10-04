import test from 'node:test';
import assert from 'node:assert/strict';
import {NavigationWorld} from '../dist/navigation.js';
import {RealmRuntime} from '../dist/realm-runtime.js';
import {WorldSession} from '../dist/session.js';
const input=JSON.stringify({sequence:0,dx:1,dz:0});
function fixture(){
 let fail=false;
 const nav=new NavigationWorld(x=>{if(fail&&x>5)throw new Error('injected sampler fault');return {height:0,slopeDegrees:0,waterDepth:0};},{bounds:{minX:-20,maxX:20,minZ:-20,maxZ:20}});
 return {nav,breakGround(){fail=true;},repairGround(){fail=false;}};
}
test('second-player failure prevents partial state publication and any further realm ticks',()=>{
 const f=fixture(),r=new RealmRuntime(f.nav);r.join('a',{x:0,z:0});r.join('b',{x:10,z:0});r.receive('a',input);
 const before=r.snapshotFor('a');f.breakGround();assert.throws(()=>r.advance(50),/injected/);
 assert.equal(r.status,'faulted');assert.equal(r.tick,0);assert.equal(before.players[0].position.x,0);
 assert.throws(()=>r.stateFor('a'),/faulted/);assert.throws(()=>r.snapshotFor('b'),/faulted/);assert.throws(()=>r.advance(50),/faulted/);
 assert.equal(r.receive('a',input),false);assert.throws(()=>r.join('c',{x:0,z:0}),/faulted/);
});
test('clock reset and repaired sampler cannot revive a partially advanced realm',()=>{
 const f=fixture(),r=new RealmRuntime(f.nav);r.join('a',{x:0,z:0});r.join('b',{x:10,z:0});f.breakGround();assert.throws(()=>r.advance(50));
 f.repairGround();assert.throws(()=>r.resetClock(),/faulted/);assert.throws(()=>r.advance(50),/faulted/);
 assert.equal(r.leave('a'),true);assert.equal(r.leave('b'),true);assert.equal(r.size,0);
 const replacement=new RealmRuntime(f.nav);replacement.join('a',{x:0,z:0});replacement.advance(50);assert.equal(replacement.tick,1);
});
test('trusted hook failure faults realm without publishing hook mutations',()=>{
 const f=fixture(),r=new RealmRuntime(f.nav);r.join('a',{x:0,z:0});
 assert.throws(()=>r.advance(50,()=>{r.receive('a',input);throw new Error('hook failure');}));
 assert.equal(r.status,'faulted');assert.throws(()=>r.snapshotFor('a'),/faulted/);
});
test('invalid host deltas leave healthy realm available',()=>{
 const r=new RealmRuntime(fixture().nav);r.join('a',{x:0,z:0});
 for(const dt of [NaN,Infinity,-1])assert.throws(()=>r.advance(dt));
 assert.equal(r.status,'active');r.advance(50);assert.equal(r.tick,1);
});
test('low-level WorldSession also blocks partial snapshots after tick failure',()=>{
 const f=fixture(),s=new WorldSession(f.nav);s.join('a',{x:0,z:0});s.join('b',{x:10,z:0});s.receive('a',input);
 f.breakGround();assert.throws(()=>s.tick());assert.equal(s.status,'faulted');assert.throws(()=>s.snapshot('a'),/faulted/);
 assert.throws(()=>s.tick(),/faulted/);assert.throws(()=>s.join('c',{x:0,z:0}),/faulted/);assert.equal(s.receive('a',input),false);assert.equal(s.leave('a'),true);
});
test('catch-up fault preserves count of completed steps and stops remaining steps',()=>{
 const f=fixture(),r=new RealmRuntime(f.nav);r.join('a',{x:0,z:0});r.join('b',{x:10,z:0});let calls=0;
 assert.throws(()=>r.advance(200,()=>{if(++calls===3)f.breakGround();}));
 assert.equal(calls,3);assert.equal(r.tick,2);assert.equal(r.status,'faulted');assert.throws(()=>r.snapshotFor('a'));
});
