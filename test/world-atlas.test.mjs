import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAtlas,REGION_STORIES,ATLAS_LINKS,planItinerary,inspectAnchor} from '../dist/world-atlas.js';
import {REALM_WORLD} from '../dist/realm-scene.js';
import {regionAt,generateChunk,CHUNK_SIZE} from '../dist/world.js';

test('atlas anchors cover ten actual distinct biomes deterministically across seeds',()=>{
 for(const seed of [REALM_WORLD.seed,0,1,42,123456]){
  const world={seed,generatorVersion:1},a=buildAtlas(world);
  assert.deepEqual(a,buildAtlas(world));assert.equal(a.length,10);
  assert.equal(new Set(a.map(a=>`${a.rx},${a.rz}`)).size,10);
  for(const p of a){assert.equal(regionAt(world,p.x,p.z).biome,p.story.biome);assert.ok(Math.abs(p.rx)<=8&&Math.abs(p.rz)<=8);}
 }
 assert.equal(buildAtlas(REALM_WORLD)[0].x,0);
});
test('all itinerary pairs use connected planned edges without cycles',()=>{
 const edges=new Set(ATLAS_LINKS.map(e=>[e.from,e.to].sort().join(':')));
 assert.equal(edges.size,12);assert.ok(ATLAS_LINKS.every(e=>e.status==='planned'));
 for(const a of REGION_STORIES)for(const b of REGION_STORIES){
  const route=planItinerary(a.id,b.id);assert.equal(route[0],a.id);assert.equal(route.at(-1),b.id);
  assert.equal(new Set(route).size,route.length);
  for(let i=1;i<route.length;i++)assert.ok(edges.has([route[i-1],route[i]].sort().join(':')));
 }
 assert.deepEqual(planItinerary('reedhaven','aurora'),['reedhaven','barrow','cloudbreak','aurora']);
 assert.throws(()=>planItinerary('unknown','reedhaven'));
});
test('anchor inspection reports generated chunk evidence including negative coordinates',()=>{
 const anchors=buildAtlas(REALM_WORLD);assert.ok(anchors.some(a=>a.x<0||a.z<0));
 for(const a of anchors){const d=inspectAnchor(REALM_WORLD,a),c=generateChunk(REALM_WORLD,Math.floor(a.x/CHUNK_SIZE),Math.floor(a.z/CHUNK_SIZE));
  assert.equal(d.chunkId,c.id);assert.equal(d.propCount,c.props.length);assert.equal(d.minHeight,Math.min(...c.heights));assert.equal(d.wetCells,c.waterDepths.filter(d=>d>0).length);
 }
 assert.throws(()=>inspectAnchor(REALM_WORLD,{...anchors[0],story:REGION_STORIES.find(s=>s.biome==='desert')}));
});
test('authored content cannot be mutated through exported catalog',()=>{
 assert.throws(()=>REGION_STORIES[0].places.push('fake'));assert.throws(()=>REGION_STORIES[0].name='fake');assert.throws(()=>ATLAS_LINKS[0].status='walkable');
});

test('atlas controls select all regions and redraw at mobile size using a stub canvas',async()=>{
 const old=Object.getOwnPropertyDescriptors(globalThis),nodes=new Map(),windowEvents={};let paint=0;
 const ctx=new Proxy({}, {get:(t,k)=>t[k]??(()=>{paint++;}),set:(t,k,v)=>(t[k]=v,true)});
 const element=()=>({textContent:'',value:'',style:{},children:[],events:{},parentElement:{clientWidth:600},append(v){this.children.push(v);},addEventListener(k,v){this.events[k]=v;},getContext(){return ctx;},getBoundingClientRect(){return {left:0,top:0,width:260,height:260};}});
 for(const id of ['atlas','terrain','region','legend','name','description','places','note','evidence','route','survey','wildlife'])nodes.set('#'+id,element());
 try{
  globalThis.document={querySelector:id=>nodes.get(id),createElement:element};globalThis.devicePixelRatio=2;globalThis.addEventListener=(k,v)=>windowEvents[k]=v;
  await import('../dist/atlas-client.js');
  assert.equal(nodes.get('#legend').children.length,10);assert.equal(nodes.get('#region').children.length,10);
  for(const story of REGION_STORIES){const select=nodes.get('#region');select.value=story.id;select.events.change();assert.equal(nodes.get('#name').textContent,story.name);assert.match(nodes.get('#evidence').textContent,/Sample chunk/);assert.match(nodes.get('#wildlife').textContent,/Non-attackable · no loot/);}
  nodes.get('#legend').children[0].events.click();assert.equal(nodes.get('#name').textContent,'Reedhaven Vale');
  nodes.get('#atlas').parentElement.clientWidth=280;windowEvents.resize();assert.equal(nodes.get('#atlas').width,560);assert.ok(paint>1000);
 }finally{for(const k of ['document','devicePixelRatio','addEventListener']){if(old[k])Object.defineProperty(globalThis,k,old[k]);else delete globalThis[k];}}
});
