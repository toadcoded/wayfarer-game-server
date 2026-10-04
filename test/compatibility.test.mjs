import test from 'node:test';
import assert from 'node:assert/strict';
import WS from 'ws';
import {REALM_CONTRACT,REALM_SUBPROTOCOL,encodeHello,decodeHello,encodeWelcome,decodeWelcome,compatibilityMessage} from '../dist/realm-contract.js';
import {createLocalRealmServer} from '../tools/realm-server.mjs';
import {NavigationWorld} from '../dist/navigation.js';
import {STEP_MS} from '../dist/fixed-clock.js';
async function until(fn){const end=Date.now()+3000;while(!fn()){if(Date.now()>end)throw new Error('Timed out');await new Promise(r=>setTimeout(r,5));}}
function client(h,{protocol=REALM_SUBPROTOCOL,hello=encodeHello()}={}){
 const ws=new WS(h.origin.replace('http:','ws:')+'/socket',protocol,{origin:h.origin}),messages=[];let closed=false,reason='';
 ws.on('open',()=>{if(hello!==null)ws.send(hello);});ws.on('message',d=>messages.push(JSON.parse(d.toString())));ws.on('error',()=>{});ws.on('close',(_code,r)=>{closed=true;reason=r.toString();});
 return {ws,messages,get closed(){return closed;},get reason(){return reason;}};
}
async function host(fn,options={}){
 const scene={plan:{start:{x:0,y:0,z:0}},navigation:new NavigationWorld(()=>({height:0,slopeDegrees:0,waterDepth:0}),{bounds:{minX:-20,maxX:20,minZ:-20,maxZ:20}})};
 const h=await createLocalRealmServer({scene,autoTick:false,...options});try{await fn(h);}finally{await h.close();}
}
test('contract roundtrips within server input budget and matches simulation cadence',()=>{
 assert.ok(Buffer.byteLength(encodeHello())<=256);assert.equal(REALM_CONTRACT.tickMs,STEP_MS);assert.deepEqual(decodeHello(encodeHello()),REALM_CONTRACT);
 assert.deepEqual(decodeWelcome(encodeWelcome('p1')),{id:'p1',contract:REALM_CONTRACT});assert.ok(Object.isFrozen(REALM_CONTRACT));
});
test('every contract-field mismatch is rejected with a compatibility reason',()=>{
 for(const key of Object.keys(REALM_CONTRACT)){
  const message=JSON.parse(encodeHello());message.contract[key]=typeof message.contract[key]==='number'?message.contract[key]+1:'different';
  assert.throws(()=>decodeHello(JSON.stringify(message)),e=>e.code==='incompatible_contract');
 }
});
test('malformed handshakes and unknown fields are rejected on both sides',()=>{
 for(const value of ['null','[]','{',' '.repeat(513),JSON.stringify({kind:'hello',contract:REALM_CONTRACT,extra:1}),JSON.stringify({kind:'hello',contract:{...REALM_CONTRACT,extra:1}})])assert.throws(()=>decodeHello(value));
 assert.throws(()=>decodeWelcome(JSON.stringify({kind:'welcome',id:'p1'})));assert.throws(()=>encodeWelcome('connection-secret'));
 assert.throws(()=>decodeWelcome(JSON.stringify({kind:'welcome',id:'p1',contract:{...REALM_CONTRACT,sceneRevision:REALM_CONTRACT.sceneRevision+1}})));
});
test('incompatible world never joins, receives snapshots, or reserves a player id',async()=>{
 await host(async h=>{
  const bad=JSON.parse(encodeHello());bad.contract.worldSeed++;
  const a=client(h,{hello:JSON.stringify(bad)});await until(()=>a.closed);assert.equal(a.reason,'incompatible_contract');assert.equal(h.realm.size,0);assert.equal(a.messages.length,0);
  const b=client(h);await until(()=>b.messages.some(m=>m.kind==='welcome'));assert.equal(b.messages[0].id,'p1');assert.equal(b.ws.protocol,REALM_SUBPROTOCOL);
 });
});
test('movement before hello is rejected before any player exists',async()=>{
 await host(async h=>{const a=client(h,{hello:JSON.stringify({sequence:0,dx:1,dz:0})});await until(()=>a.closed);assert.equal(a.reason,'invalid_handshake');assert.equal(h.realm.size,0);assert.equal(a.messages.length,0);});
});
test('missing or unsupported subprotocol cannot establish a realm connection',async()=>{
 await host(async h=>{for(const protocol of [[],['other.realm.v1']]){const a=client(h,{protocol});await until(()=>a.closed);assert.equal(a.messages.length,0);}assert.equal(h.realm.size,0);});
});
test('pending handshake expires and releases capacity without creating player',async()=>{
 await host(async h=>{const a=client(h,{hello:null});await until(()=>h.connections===1);assert.equal(h.realm.size,0);const b=client(h);await until(()=>b.closed);assert.equal(b.messages.length,0);await until(()=>a.closed);assert.equal(a.reason,'handshake_timeout');assert.equal(h.connections,0);assert.equal(h.realm.size,0);},{handshakeMs:150,capacity:1});
});
test('replayed hello cannot reset player identity or input sequence',async()=>{
 await host(async h=>{const a=client(h);await until(()=>a.messages.some(m=>m.kind==='welcome'));a.ws.send(encodeHello());await until(()=>h.metrics.rejected===1);h.advance(100);await until(()=>a.messages.some(m=>m.tick===2));assert.equal(a.messages.filter(m=>m.kind==='welcome').length,1);assert.equal(h.realm.size,1);});
});
test('compatibility errors map to bounded user messages, not arbitrary server prose',()=>{
 assert.match(compatibilityMessage('incompatible_contract'),/different world/);assert.match(compatibilityMessage('handshake_timeout'),/timed out/);assert.doesNotMatch(compatibilityMessage('<script>'),/script/);
});
