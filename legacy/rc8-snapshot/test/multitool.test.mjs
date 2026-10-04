import test from 'node:test';
import assert from 'node:assert/strict';
import {Multitool,mountToolbar} from '../dist/multitool.js';
import {SoftPatch} from '../dist/soft-patch.js';
import {SoftTools} from '../dist/soft-tools.js';
test('registry gates keyboard and ID dispatch identically and reports failures',()=>{
 let enabled=false,count=0;const tools=new Multitool([{id:'a',label:'A',tooltip:'Do A',key:'a',unavailable:()=>enabled?undefined:'Not ready',run:()=>count++}]);
 assert.deepEqual(tools.key('A'),{ok:false,reason:'Not ready'});assert.equal(count,0);enabled=true;assert.equal(tools.execute('a').ok,true);assert.equal(tools.key('A').ok,true);assert.equal(count,2);assert.equal(tools.execute('unknown').ok,false);assert.throws(()=>tools.actions.push({}));
 assert.throws(()=>new Multitool([tools.actions[0],tools.actions[0]]));
 assert.equal(new Multitool([{id:'fail',label:'Failure',tooltip:'Fail',run:()=>{throw Error('internal');}}]).execute('fail').reason,'Action failed');
});
test('wind is bounded, copied and reset with the cloth',()=>{
 const patch=new SoftPatch(),v={x:3,y:0,z:0};patch.setWind(v);v.x=999;assert.equal(patch.getWind().x,3);const wind=patch.getWind();wind.x=999;assert.equal(patch.getWind().x,3);
 for(const vector of [{x:NaN,y:0,z:0},{x:13,y:0,z:0}])assert.throws(()=>patch.setWind(vector));
 patch.advance(100);patch.reset();assert.deepEqual(patch.getWind(),{x:0,y:0,z:2});assert.equal(patch.positions[0],-3);assert.equal(patch.positions[187],4);
});
test('impulse affects nearby unpinned points and leaves anchors fixed',()=>{
 const patch=new SoftPatch(),initial=patch.positions.slice();assert.equal(patch.impulse(0,{x:0,y:0,z:2}),0);assert.equal(patch.impulse(45,{x:0,y:0,z:2},0),1);patch.advance(1000/120);
 assert.deepEqual(patch.positions.slice(0,21),initial.slice(0,21));assert.ok(patch.positions[45*3+2]>0);assert.throws(()=>patch.impulse(63,{x:0,y:0,z:2}));assert.throws(()=>patch.impulse(45,{x:7,y:0,z:0}));
});
test('repeated opposing impulses and large wind remain finite with bounded geometry',()=>{
 const patch=new SoftPatch(),anchors=patch.positions.slice(0,21);patch.setWind({x:6,y:6,z:6});
 for(let i=0;i<600;i++){patch.impulse(45,{x:i%2?4:-4,y:0,z:4});patch.advance(16.6666667);}
 assert.deepEqual(patch.positions.slice(0,21),anchors);assert.ok([...patch.positions].every(Number.isFinite));assert.ok([...patch.positions].every(n=>Math.abs(n)<25));
});
test('single step, reduced motion, pinned targets and reset use shared action rules',()=>{
 const tools=new SoftTools();assert.equal(tools.registry.execute('step').ok,false);tools.registry.key('p');const before=tools.patch.positions.slice();tools.advance(100);assert.deepEqual(tools.patch.positions,before);assert.equal(tools.registry.execute('step').ok,true);assert.notDeepEqual(tools.patch.positions,before);
 assert.equal(tools.registry.execute('push').ok,false);tools.registry.execute('pause');tools.select(0);assert.match(tools.registry.execute('push').reason,/pinned/);tools.select(45);assert.equal(tools.registry.execute('push').ok,true);
 tools.reducedMotion=true;assert.match(tools.registry.execute('push').reason,/Reduced/);const still=tools.patch.positions.slice();tools.advance(100);assert.deepEqual(tools.patch.positions,still);tools.registry.execute('reset');assert.deepEqual(tools.patch.positions,before);assert.throws(()=>tools.select(-1));
});
test('toolbar button and keyboard dispatch share state; editing/repeat input is ignored; disposal removes handler',()=>{
 const descriptors=Object.getOwnPropertyDescriptors(globalThis),listeners=new Map(),children=[];let count=0,enabled=true;
 try{
 globalThis.document={createElement:()=>({dataset:{},events:{},setAttribute(){},addEventListener(k,f){this.events[k]=f;},remove(){this.removed=true;}})};
 globalThis.addEventListener=(k,f)=>listeners.set(k,f);globalThis.removeEventListener=(k,f)=>{if(listeners.get(k)===f)listeners.delete(k);};
 const registry=new Multitool([{id:'a',label:'Action',tooltip:'Apply',key:'a',unavailable:()=>enabled?undefined:'Disabled',run:()=>count++}]);const toolbar=mountToolbar(registry,{append:b=>children.push(b)});
 children[0].events.click();const key=listeners.get('keydown');key({key:'a',target:{tagName:'CANVAS'},preventDefault(){}});assert.equal(count,2);
 for(const target of [{tagName:'INPUT'},{tagName:'BUTTON'},{isContentEditable:true}])key({key:'a',target,preventDefault(){}});
 key({key:'a',repeat:true,target:{},preventDefault(){}});assert.equal(count,2);enabled=false;toolbar.refresh();assert.equal(children[0].disabled,true);children[0].events.click();assert.equal(count,2);toolbar.dispose();assert.equal(listeners.size,0);assert.equal(children[0].removed,true);
 }finally{for(const k of ['document','addEventListener','removeEventListener']){if(descriptors[k])Object.defineProperty(globalThis,k,descriptors[k]);else delete globalThis[k];}}
});
