import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleABC,defaultABC} from '../dist/abc-wind.js';
import {SoftPatch} from '../dist/soft-patch.js';
import {SoftTools} from '../dist/soft-tools.js';
const field=(changes={})=>({...defaultABC(),enabled:true,...changes});
const center={x:0,y:8,z:0};
test('A points down, B points up; equal strengths cancel only in the center plane',()=>{
 assert.equal(sampleABC(field({a:8}),center,0).y,-4);assert.equal(sampleABC(field({b:8}),center,0).y,4);
 assert.equal(sampleABC(field({a:8,b:8}),center,0).y,0);
 assert.ok(sampleABC(field({a:8,b:8}),{x:0,y:10,z:0},0).y<0);assert.ok(sampleABC(field({a:8,b:8}),{x:0,y:6,z:0},0).y>0);
});
test('C circulates tangentially, reverses cleanly and has a finite calm core',()=>{
 const o=field({c:8});for(const p of [{x:2,y:8,z:0},{x:0,y:8,z:2},{x:-2,y:8,z:0}]){const a=sampleABC(o,p,0),b=sampleABC({...o,c:-8},p,0);assert.ok(Math.abs(a.x*p.x+a.z*p.z)<1e-9);assert.equal(a.y,0);assert.equal(a.x,-b.x);assert.equal(a.z,-b.z);}
 assert.equal(Math.hypot(...Object.values(sampleABC(o,center,0))),0);assert.ok(Object.values(sampleABC(o,{x:1e-12,y:8,z:0},0)).every(Number.isFinite));
});
test('field has bounded cylindrical support and weakens toward its edges',()=>{
 const o=field({a:8,c:8});for(const p of [{x:6,y:8,z:0},{x:0,y:14,z:0},{x:0,y:2,z:0},{x:10,y:8,z:0}])assert.deepEqual(sampleABC(o,p,0),{x:0,y:0,z:0});
 assert.ok(Math.abs(sampleABC(o,{x:5,y:8,z:0},0).y)<Math.abs(sampleABC(o,center,0).y));assert.deepEqual(sampleABC({...o,enabled:false},center,0),{x:0,y:0,z:0});
});
test('pulse follows simulation time with known peak and trough',()=>{
 const o=field({b:8,pulseHz:1});assert.equal(sampleABC(o,center,0).y,2);assert.equal(sampleABC(o,center,.25).y,4);assert.ok(Math.abs(sampleABC(o,center,.75).y)<1e-12);
});
test('invalid fields reject before mutation and settings are defensively copied',()=>{
 const p=new SoftPatch(),o=field({a:8});p.setABC(o);o.center.x=9;assert.equal(p.getABC().center.x,0);const copy=p.getABC();copy.center.x=99;assert.equal(p.getABC().center.x,0);
 for(const patch of [{a:-1},{b:13},{c:Infinity},{radius:0},{height:0},{pulseHz:4}])assert.throws(()=>p.setABC(field(patch)));assert.equal(p.getABC().a,8);
 assert.throws(()=>sampleABC(field(),center,NaN));
});
test('combined field is capped separately from gravity; pulses freeze and reset with simulation',()=>{
 const tools=new SoftTools(),p=tools.patch;p.setWind({x:0,y:12,z:0});p.setABC(field({b:12,c:12,pulseHz:1}));assert.ok(Math.hypot(...Object.values(p.forceAt(center)))<=12);
 tools.advance(100);const t=p.simulationSeconds;tools.paused=true;tools.advance(9999);assert.equal(p.simulationSeconds,t);tools.reducedMotion=true;tools.paused=false;tools.advance(100);assert.equal(p.simulationSeconds,t);p.reset();assert.equal(p.simulationSeconds,0);assert.equal(p.getABC().enabled,false);
});
test('strong pulsing ABC fields remain finite and preserve all pinned points',()=>{
 const p=new SoftPatch(),anchors=p.positions.slice(0,21);p.setWind({x:0,y:0,z:0});p.setABC(field({a:12,b:12,c:12,pulseHz:3}));
 for(let i=0;i<600;i++)p.advance(16.6666667);
 assert.deepEqual(p.positions.slice(0,21),anchors);assert.ok([...p.positions].every(Number.isFinite));assert.ok([...p.positions].every(v=>Math.abs(v)<25));
});
