import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';import WS from 'ws';import {createLocalRealmServer} from '../tools/realm-server.mjs';import {REALM_SUBPROTOCOL,encodeHello} from '../dist/realm-contract.js';import {replayJournal} from '../tools/replay-journal.mjs';
const host=await createLocalRealmServer({autoTick:false,recordReplay:true});let ws;const messages=[];const until=async fn=>{for(let i=0;i<300;i++){if(fn())return;await new Promise(r=>setTimeout(r,5));}throw Error('Timeout');};
try{
 ws=new WS(host.origin.replace('http:','ws:')+'/socket',REALM_SUBPROTOCOL,{origin:host.origin});ws.on('message',m=>messages.push(JSON.parse(m)));await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});ws.send(encodeHello());await until(()=>messages.some(m=>m.kind==='game'));
 const initial=messages.find(m=>m.version===1)?.players[0];assert.ok(initial);let sequence=0;
 for(const mode of ['walk','jog','run'])for(let i=0;i<16;i++){ws.send(JSON.stringify({sequence:sequence++,dx:1,dz:0,mode}));await until(()=>host.metrics.accepted===sequence);host.advance(50);}
 await until(()=>messages.some(m=>m.version===1&&m.players[0].travelMode==='run'));const last=messages.filter(m=>m.version===1).at(-1).players[0];assert.ok(last.runEnergy<100);assert.equal(last.travelMode,'run');
 ws.send(JSON.stringify({sequence:sequence++,dx:0,dz:0,mode:'walk'}));await until(()=>host.metrics.accepted===sequence);host.advance(100);ws.close();await until(()=>host.connections===0);await host.close();
 const journal=host.exportReplay(),replay=replayJournal(JSON.stringify(journal),host.scene.navigation);assert.ok(replay.complete);
 await writeFile(new URL('./rc16-travel-replay.json',import.meta.url),JSON.stringify(journal));const result={passed:true,events:replay.events,hash:replay.hash,energy:last.runEnergy,scope:'Fresh real WebSocket all three travel modes and deterministic replay'};await writeFile(new URL('./rc16-travel-results.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{ws?.terminate();await host.close();}
