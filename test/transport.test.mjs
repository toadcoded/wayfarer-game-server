import {REALM_SUBPROTOCOL,encodeHello} from '../dist/realm-contract.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import {createLocalRealmServer} from '../tools/realm-server.mjs';
import {NavigationWorld} from '../dist/navigation.js';
import {decodeRealmSnapshot} from '../dist/replication.js';
const intent=(sequence,dx=1,dz=0)=>JSON.stringify({sequence,dx,dz});
const flat=()=>({plan:{start:{x:0,y:0,z:0}},navigation:new NavigationWorld(()=>({height:0,slopeDegrees:0,waterDepth:0}),{bounds:{minX:-20,maxX:20,minZ:-20,maxZ:20}})});
async function until(predicate){const end=Date.now()+3000;while(!predicate()){if(Date.now()>end)throw new Error('Condition timed out');await new Promise(r=>setTimeout(r,5));}}
function client(host,options={}){
 const ws=new WebSocket(host.origin.replace('http:','ws:')+'/socket',REALM_SUBPROTOCOL,{origin:host.origin,...options}),messages=[];let error,closed=false;
 ws.on('open',()=>ws.send(encodeHello()));
 ws.on('message',data=>messages.push(JSON.parse(data.toString())));ws.on('error',e=>{error=e;});ws.on('close',()=>{closed=true;});
 return {ws,messages,get error(){return error;},get closed(){return closed;},get id(){return messages.find(m=>m.kind==='welcome')?.id;},get snapshot(){return messages.findLast(m=>m.version===1);}};
}
async function joined(host,options){const c=client(host,options);await until(()=>c.id||c.closed);assert.ok(c.id);return c;}
async function withHost(options,fn){const h=await createLocalRealmServer({autoTick:false,scene:flat(),...options});try{await fn(h);}finally{await h.close();}}
test('two independent sockets receive shared authoritative movement and disconnect/rejoin',async()=>{
 await withHost({},async h=>{
  const a=await joined(h),b=await joined(h);assert.notEqual(a.id,b.id);
  a.ws.send(intent(0));await until(()=>h.metrics.accepted===1);assert.equal(h.realm.tick,0);
  h.advance(100);await until(()=>a.snapshot?.tick===2&&b.snapshot?.tick===2);
  assert.deepEqual(decodeRealmSnapshot(JSON.stringify(a.snapshot)),b.snapshot);
  assert.equal(a.snapshot.players.find(p=>p.id===a.id).position.x,.4);assert.equal(a.snapshot.players.find(p=>p.id===b.id).position.x,0);
  a.ws.close();await until(()=>h.connections===1);h.advance(100);await until(()=>b.snapshot?.tick===4);assert.equal(b.snapshot.players.length,1);
  const replacement=await joined(h);assert.notEqual(replacement.id,a.id);replacement.ws.send(intent(0));await until(()=>h.metrics.accepted===2);
 });
});
test('server rejects unexpected Origin and missing Origin before joining',async()=>{
 await withHost({},async h=>{for(const origin of ['http://evil.invalid',undefined]){const c=client(h,{origin});await until(()=>c.closed);assert.equal(c.id,undefined);}assert.equal(h.connections,0);});
});
test('capacity rejects excess peers and disconnect frees a slot',async()=>{
 await withHost({capacity:1},async h=>{const a=await joined(h),b=client(h);await until(()=>b.closed);assert.equal(h.connections,1);a.ws.terminate();await until(()=>h.connections===0);await joined(h);assert.equal(h.connections,1);});
});
test('binary and oversized frames close offending connections without killing host',async()=>{
 await withHost({},async h=>{const a=await joined(h);a.ws.send(Buffer.from([1,2]));await until(()=>a.closed);const b=await joined(h);b.ws.send('x'.repeat(257));await until(()=>b.closed);assert.equal(h.faulted,false);await joined(h);});
});
test('malformed and forged movement is rejected while healthy peer continues',async()=>{
 await withHost({},async h=>{const a=await joined(h),b=await joined(h);
 a.ws.send('{');a.ws.send(JSON.stringify({sequence:0,dx:1,dz:0,id:b.id}));b.ws.send(intent(0,0,1));await until(()=>h.metrics.received===3);
 assert.equal(h.metrics.rejected,2);h.advance(100);await until(()=>b.snapshot?.tick===2);
 assert.equal(b.snapshot.players.find(p=>p.id===a.id).position.x,0);assert.equal(b.snapshot.players.find(p=>p.id===b.id).position.z,.4);
 });
});
test('wall-clock packet flood disconnects sender even with simulation paused',async()=>{
 await withHost({},async h=>{const a=await joined(h);for(let i=0;i<70;i++)a.ws.send(intent(i));await until(()=>a.closed);assert.equal(h.realm.tick,0);assert.equal(h.connections,0);});
});
test('heartbeat reclaims a socket that stops answering ping',async()=>{
 await withHost({},async h=>{const a=await joined(h,{autoPong:false});h.heartbeat();h.heartbeat();await until(()=>a.closed);assert.equal(h.connections,0);});
});
test('realm fault disconnects all sockets and prevents replacement joins',async()=>{
 let broken=false;
 const scene={plan:{start:{x:0,y:0,z:0}},navigation:new NavigationWorld(()=>{if(broken)throw new Error('injected');return {height:0,slopeDegrees:0,waterDepth:0};},{bounds:{minX:-20,maxX:20,minZ:-20,maxZ:20}})};
 await withHost({scene},async h=>{const a=await joined(h),b=await joined(h);broken=true;h.advance(100);await until(()=>a.closed&&b.closed);assert.equal(h.faulted,true);assert.equal(h.realm.status,'faulted');assert.equal(h.connections,0);const c=client(h);await until(()=>c.closed);assert.equal(c.id,undefined);});
});
test('HTTP serves rehearsal assets, rejects metadata, and survives malformed target',async()=>{
 await withHost({},async h=>{
  assert.equal((await fetch(h.origin)).status,200);assert.equal((await fetch(h.origin+'/dist/realm-client.js')).status,200);
  assert.equal((await fetch(h.origin+'/package.json')).status,400);assert.equal((await fetch(h.origin,{method:'POST'})).status,405);
  const {request}=await import('node:http');const code=await new Promise((resolve,reject)=>{const r=request(h.origin,{path:'//[bad'},res=>{res.resume();resolve(res.statusCode);});r.on('error',reject);r.end();});assert.equal(code,400);
  assert.equal((await fetch(h.origin)).status,200);
 });
});
test('real shared crossing scene accepts a socket and advances without fault',async()=>{
 const h=await createLocalRealmServer({autoTick:false});try{const a=await joined(h);a.ws.send(intent(0));await until(()=>h.metrics.accepted===1);h.advance(100);await until(()=>a.snapshot?.tick===2);assert.equal(h.faulted,false);}finally{await h.close();}
});
