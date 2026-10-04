import test from 'node:test';import assert from 'node:assert/strict';
import {REFERENCE_GRIDS,cellCenter,worldToCell,rebasePoint} from '../dist/adapters/coordinates.js';
import {toIso,fromIso} from '../dist/adapters/iso.js';
import {normalizePreferences} from '../dist/adapters/preferences.js';
import {WorldSession} from '../dist/session.js';
import {NavigationWorld} from '../dist/navigation.js';
const nav=()=>new NavigationWorld(()=>({height:0,slopeDegrees:0,waterDepth:0}),{bounds:{minX:-20,maxX:20,minZ:-20,maxZ:20}});
test('all reference grid centers round trip, including last cells',()=>{for(const frame of Object.values(REFERENCE_GRIDS))for(let r=0;r<frame.rows;r++)for(let c=0;c<frame.columns;c++){const p=cellCenter(frame,c,r);assert.deepEqual(worldToCell(frame,p.x,p.z),{column:c,row:r});}});
test('outside and non-finite coordinates are rejected rather than clamped',()=>{const f=REFERENCE_GRIDS.ashfen;assert.equal(worldToCell(f,-1,0),null);assert.equal(worldToCell(f,42*32,0),null);assert.equal(worldToCell(f,NaN,0),null);assert.throws(()=>cellCenter(f,.5,0));});
test('pixel to world conversion preserves tile identity',()=>{const a=REFERENCE_GRIDS.ashfen,b=REFERENCE_GRIDS.wayfarer;assert.deepEqual(rebasePoint(cellCenter(a,2,3),a,b),cellCenter(b,2,3));});
test('isometric projection is reversible',()=>{for(const [x,z] of [[-4,8],[0,0],[90.4,-20]]){const p=toIso(x,z),q=fromIso(p.isoX,p.isoY);assert.ok(Math.abs(q.tx-x)<1e-9);assert.ok(Math.abs(q.tz-z)<1e-9);}});
test('imported preferences sanitize malformed settings',()=>{const p=normalizePreferences({brightness:999,audio:{masterVolume:Infinity,musicVolume:-5,soundtrack:'evil'}});assert.equal(p.brightness,100);assert.equal(p.audio.masterVolume,.7);assert.equal(p.audio.musicVolume,0);assert.equal(p.audio.soundtrack,'reedhaven');});
test('packets cannot advance time or select another player',()=>{const s=new WorldSession(nav());s.join('a',{x:0,z:0});s.join('b',{x:3,z:0});assert.equal(s.receive('a','{"sequence":1,"dx":1,"dz":0,"id":"b"}'),false);s.receive('a','{"sequence":2,"dx":1,"dz":0}');assert.equal(s.snapshot('a').tick,0);s.tick();assert.equal(s.snapshot('a').position.x,.2);assert.equal(s.snapshot('b').position.x,3);});
test('duplicate inputs, flood limit, capacity and disconnect',()=>{const s=new WorldSession(nav(),1);s.join('a',{x:0,z:0});assert.throws(()=>s.join('b',{x:0,z:0}));assert.equal(s.receive('missing','{}'),false);assert.equal(s.receive('a','{"sequence":0,"dx":0,"dz":1}'),true);assert.equal(s.receive('a','{"sequence":0,"dx":0,"dz":1}'),false);for(let i=1;i<=6;i++)s.receive('a',JSON.stringify({sequence:i,dx:0,dz:1}));assert.equal(s.receive('a','{"sequence":7,"dx":0,"dz":1}'),false);s.tick();assert.equal(s.receive('a','{"sequence":7,"dx":0,"dz":1}'),true);assert.equal(s.leave('a'),true);assert.equal(s.snapshot('a'),undefined);});
test('snapshot copies cannot mutate authoritative positions',()=>{const s=new WorldSession(nav());s.join('a',{x:0,z:0});s.snapshot('a').position.x=500;assert.equal(s.snapshot('a').position.x,0);});
import {terrainSampler} from '../dist/navigation.js';
import {planCrossing,mountCrossing} from '../dist/crossings.js';
import {generateChunk,CHUNK_SIZE} from '../dist/world.js';
import {reserveSites} from '../dist/site-placement.js';
import {propPrimitives} from '../dist/geometry.js';
for(const style of ['willowglass','saffron','mothlight'])test(`v0.4 ${style}: session traverses with preview prop colliders`,()=>{
 const config={seed:20260928,generatorVersion:1};const base=terrainSampler(config),plan=planCrossing(base,{id:'test',style,z:0,minX:-16,maxX:176}),{navigation,construction}=mountCrossing(base,plan),b=plan.bounds;
 for(let cz=Math.floor(b.minZ/CHUNK_SIZE);cz<=Math.floor(b.maxZ/CHUNK_SIZE);cz++)for(let cx=Math.floor(b.minX/CHUNK_SIZE);cx<=Math.floor(b.maxX/CHUNK_SIZE);cx++){
 const chunk=reserveSites(generateChunk(config,cx,cz),[plan]);const props=chunk.props.filter(p=>p.position.x>=b.minX&&p.position.x<=b.maxX&&p.position.z>=b.minZ&&p.position.z<=b.maxZ).map(p=>({...p,position:{...p.position,y:construction.terrainAt(p.position.x,p.position.z).height}}));navigation.addPrimitives(propPrimitives({...chunk,props}));}
 const s=new WorldSession(navigation);s.join('walker',plan.start);const result=navigation.findPath(plan.start,plan.goal);assert.equal(result.status,'found');let route=result.points.slice(1),pos=plan.start;
 for(let i=0;i<2000&&route.length;i++){while(route[0]&&Math.hypot(route[0].x-pos.x,route[0].z-pos.z)<.04)route.shift();if(!route.length)break;const dx=route[0].x-pos.x,dz=route[0].z-pos.z,n=Math.max(.2,Math.hypot(dx,dz));s.receive('walker',JSON.stringify({sequence:i,dx:dx/n,dz:dz/n}));const state=s.tick().get('walker');assert.equal(state.blocked,false);pos=state.position;}
 assert.ok(Math.hypot(pos.x-plan.goal.x,pos.z-plan.goal.z)<.05);
});
