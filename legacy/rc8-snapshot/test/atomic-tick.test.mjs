import test from 'node:test';
import assert from 'node:assert/strict';
import {WorldSession} from '../dist/session.js';
import {NavigationWorld} from '../dist/navigation.js';
import {ServerWalker} from '../dist/movement.js';
for(const failing of [0,1,2,3])test(`player ${failing+1} failure leaves all committed walkers unchanged`,()=>{
 let broken=false;const nav=new NavigationWorld(x=>{if(broken&&Math.abs(x-failing*5)<1)throw new Error('fault');return {height:0,slopeDegrees:0,waterDepth:0};},{bounds:{minX:-5,maxX:25,minZ:-5,maxZ:5}});
 const s=new WorldSession(nav);for(let i=0;i<4;i++){s.join('c'+i,{x:i*5,z:0});s.receive('c'+i,JSON.stringify({sequence:0,dx:1,dz:0}));}
 s.tick();const before=s.committedState();broken=true;assert.throws(()=>s.tick(),/fault/);assert.deepEqual(s.committedState(),before);assert.equal(s.status,'faulted');
 const copy=s.committedState();copy.get('c0').position.x=999;assert.deepEqual(s.committedState(),before);
});
test('invalid final candidate is discarded before commit',()=>{
 const nav=new NavigationWorld(()=>({height:0,slopeDegrees:0,waterDepth:0}),{bounds:{minX:-5,maxX:25,minZ:-5,maxZ:5}}),s=new WorldSession(nav);
 s.join('a',{x:0,z:0});s.join('b',{x:10,z:0});const before=s.committedState(),original=nav.traverse.bind(nav);
 nav.traverse=(from,to)=>from.x>5?{ok:true,position:{x:NaN,y:0,z:0}}:original(from,to);
 assert.throws(()=>s.tick(),/candidate/);assert.deepEqual(s.committedState(),before);
});
test('100 deterministic staged input replays match',()=>{
 const run=()=>{const nav=new NavigationWorld(()=>({height:0,slopeDegrees:0,waterDepth:0}),{bounds:{minX:-50,maxX:50,minZ:-50,maxZ:50}}),s=new WorldSession(nav);s.join('a',{x:0,z:0});for(let i=0;i<100;i++){s.receive('a',JSON.stringify({sequence:i,dx:i%2?1:-1,dz:i%3?0:1}));s.tick();}return [...s.committedState()];};const expected=run();for(let i=0;i<100;i++)assert.deepEqual(run(),expected);
});
