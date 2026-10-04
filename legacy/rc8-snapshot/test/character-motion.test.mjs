import test from 'node:test';
import assert from 'node:assert/strict';
import {CharacterMotion,keyMagenta,animationFrame} from '../dist/character-motion.js';
import {primitiveMesh} from '../dist/scene-meshes.js';
import {CHARACTER_ASSETS} from '../dist/character-assets.js';
import {readFileSync} from 'node:fs';
const origin={x:0,y:0,z:0};
test('presentation springs respond to travel and settle without mutating authoritative position',()=>{
 const motion=new CharacterMotion();motion.sample(origin,0);let pose;
 for(let i=1;i<=60;i++)pose=motion.sample({x:i/15,y:0,z:0},i*1000/60);
 assert.ok(pose.stride>.9);assert.ok(pose.lean>0);assert.ok(Math.abs(pose.cloth)<=.3);assert.deepEqual(origin,{x:0,y:0,z:0});
 for(let i=61;i<=240;i++)pose=motion.sample({x:4,y:0,z:0},i*1000/60);
 assert.ok(pose.stride<.001);assert.ok(Math.abs(pose.lean)<.001);assert.ok(Math.abs(pose.cloth)<.001);
});
test('long stalls, teleports, reduced motion and invalid clocks are bounded',()=>{
 const motion=new CharacterMotion();motion.sample(origin,0);motion.sample({x:1,y:0,z:0},100);
 let pose=motion.sample({x:100,y:0,z:0},120);assert.equal(pose.stride,0);assert.equal(pose.lean,0);
 pose=motion.sample({x:101,y:0,z:0},10000);assert.equal(pose.cloth,0);
 pose=motion.sample({x:101.1,y:0,z:0},10020,true);assert.equal(pose.stride,0);assert.equal(pose.lean,0);assert.equal(pose.cloth,0);
 assert.throws(()=>motion.sample(origin,1));assert.throws(()=>motion.sample({x:NaN,y:0,z:0},11000));
});
test('irregular frame intervals keep springs finite and bounded',()=>{
 const motion=new CharacterMotion();let time=0,x=0;motion.sample(origin,0);
 for(let i=0;i<1000;i++){const dt=[1,16,33,100,250][i%5];time+=dt;x+=dt/1000*(i%2?4:-4);const p=motion.sample({x,y:0,z:0},time);assert.ok(Object.values(p).every(Number.isFinite));assert.ok(Math.abs(p.lean)<=.2&&Math.abs(p.cloth)<=.3&&p.stride<=1);}
});
test('magenta key preserves character colors and existing transparency',()=>{
 const data=new Uint8ClampedArray([255,0,255,255,120,80,50,255,0,0,0,0]);keyMagenta(data);assert.deepEqual([...data],[255,0,255,0,120,80,50,255,0,0,0,0]);assert.throws(()=>keyMagenta(new Uint8ClampedArray(3)));
});
test('animation uses frame durations and wraps at cycle boundary',()=>{
 assert.equal(animationFrame([100,200],0),0);assert.equal(animationFrame([100,200],100),1);assert.equal(animationFrame([100,200],299),1);assert.equal(animationFrame([100,200],300),0);
 for(const d of [[],[0],[NaN]])assert.throws(()=>animationFrame(d,0));
});
test('rounded sphere triangles face outwards and remain within collider extents',()=>{
 const m=primitiveMesh({id:'round',shape:'sphere',position:origin,size:{x:2,y:2,z:2},color:'#fff',collision:'solid'});
 assert.ok(m.positions.length>18);assert.ok([...m.positions].every(v=>Math.abs(v)<=1));
 for(let i=0;i<m.indices.length;i+=3){const a=[...m.positions.slice(m.indices[i]*3,m.indices[i]*3+3)],b=[...m.positions.slice(m.indices[i+1]*3,m.indices[i+1]*3+3)],c=[...m.positions.slice(m.indices[i+2]*3,m.indices[i+2]*3+3)];const u=b.map((v,j)=>v-a[j]),v=c.map((n,j)=>n-a[j]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];assert.ok(n.reduce((s,v,j)=>s+v*(a[j]+b[j]+c[j]),0)>0);}
});
test('all selectable source sheets match dimensions and crop bounds',()=>{
 for(const a of CHARACTER_ASSETS){const bytes=readFileSync(new URL(`../preview/assets/${a.id}.png`,import.meta.url));assert.equal(bytes.readUInt32BE(16),a.width*a.frames);assert.equal(bytes.readUInt32BE(20),a.height);assert.equal(a.durationsMs.length,a.frames);assert.ok(a.crop.x+a.crop.width<=a.width&&a.crop.y+a.crop.height<=a.height);}
});
