import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import WS from 'ws';
import {once} from 'node:events';
import http from 'node:http';
import {SqliteRealmStore} from '../tools/sqlite-store.mjs';
import {createLocalRealmServer} from '../tools/realm-server.mjs';
import {encodeHello,REALM_SUBPROTOCOL} from '../dist/realm-contract.js';

const publicOrigin='https://play.example.com';
function requestAt(host,route,headers={}) {
  return new Promise((resolve,reject)=>{
    http.get(`http://127.0.0.1:${host.port}${route}`,{headers:{Host:'play.example.com',...headers}},res=>{
      const chunks=[];res.on('data',b=>chunks.push(b));res.on('end',()=>{
        const values=Object.fromEntries(Object.entries(res.headers).map(([k,v])=>[k,Array.isArray(v)?v.join(', '):v]));
        resolve(new Response(Buffer.concat(chunks),{status:res.statusCode,headers:values}));
      });res.on('error',reject);
    }).on('error',reject);
  });
}
async function until(fn){const end=Date.now()+5000;while(!fn()){if(Date.now()>end)throw Error('Timed out');await new Promise(r=>setTimeout(r,10));}}
function open(host,cookie,extra={}) {
  const ws=new WS(`ws://127.0.0.1:${host.port}/socket`,REALM_SUBPROTOCOL,{headers:{Host:'play.example.com',Origin:publicOrigin,Cookie:cookie,...extra}});
  ws.messages=[];ws.on('message',data=>ws.messages.push(JSON.parse(data.toString())));ws.on('error',()=>{});return ws;
}
async function joined(ws){await once(ws,'open');ws.send(encodeHello());await until(()=>ws.messages.some(m=>m.kind==='welcome'));return ws.messages.find(m=>m.kind==='welcome').id;}
async function rejected(ws){return new Promise((resolve,reject)=>{ws.once('unexpected-response',(_req,res)=>{res.resume();ws.terminate();resolve(res.statusCode);});ws.once('open',()=>{ws.terminate();reject(Error('Unexpected upgrade'));});});}

test('public host serves correct assets, rejects bad origins, saves connected players and restores after restart',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'wayfarer-public-'));let store,host,a,b;
  try {
    const file=path.join(dir,'realm.sqlite');store=await SqliteRealmStore.open(file,{secure:true});
    host=await createLocalRealmServer({publicOrigin,profileStoreOverride:store,xam:true,xamStoreOverride:store.xam,autoTick:false});
    const request=(route,headers={})=>requestAt(host,route,headers);
    assert.equal((await fetch(`http://127.0.0.1:${host.port}/health`)).status,200);
    const page=await request('/');assert.equal(page.status,200);assert.match(page.headers.get('content-security-policy'),/wss:\/\/play.example.com/);
    const first=page.headers.get('set-cookie');assert.match(first,/Secure/);const cookie=first.split(';')[0];
    assert.match(await page.text(),/WAYFARER \/ v1\.2 \/ CELESTIAL POLYCODEX/);
    const asset=await request('/dist/realm-client.js');assert.match(asset.headers.get('content-type'),/javascript/);assert.equal(asset.headers.get('set-cookie'),null);
    assert.equal((await request('/tools/server.mjs')).status,400);assert.equal((await request('/dist/.secret')).status,400);
    assert.equal((await request('/',{Host:'attacker.example'})).status,403);
    const missing=await rejected(open(host,'',{Origin:publicOrigin}));assert.equal(missing,403);
    assert.equal(await rejected(open(host,cookie,{Origin:'https://attacker.example'})),403);
    a=open(host,cookie);const id=await joined(a);
    assert.equal(await rejected(open(host,cookie)),409);
    const p2=await request('/');const cookie2=p2.headers.get('set-cookie').split(';')[0];b=open(host,cookie2);const id2=await joined(b);assert.notEqual(id,id2);
    a.send(JSON.stringify({kind:'action',sequence:0,action:'appearance',value:'elder'}));
    a.send(JSON.stringify({kind:'action',sequence:1,action:'quest',value:'accept'}));
    await until(()=>host.metrics.accepted===2);host.advance(100);
    await until(()=>a.messages.some(m=>m.kind==='game'&&m.players.some(p=>p.id===id&&p.skin==='elder')));
    assert.equal(host.faulted,false);
    const savedId=store.resolveCookie(cookie);
    // Close with both players connected: latest committed gameplay must reach SQLite.
    await host.close();host=undefined;
    assert.equal(store.load(savedId).gameplay.skin,'elder');assert.equal(store.load(savedId).gameplay.quest.status,'active');
    assert.ok(store.xam.value);store.close();store=await SqliteRealmStore.open(file,{secure:true});
    host=await createLocalRealmServer({publicOrigin,profileStoreOverride:store,xam:true,xamStoreOverride:store.xam,autoTick:false});
    a=open(host,cookie);const restoredId=await joined(a);await until(()=>a.messages.some(m=>m.kind==='game'));
    const game=a.messages.find(m=>m.kind==='game');assert.equal(game.players.find(p=>p.id===restoredId).skin,'elder');assert.equal(game.quest.status,'active');
    assert.equal(host.connections,1);assert.equal(store.count,2);
  }finally{a?.terminate();b?.terminate();await host?.close();store?.close();await rm(dir,{recursive:true,force:true});}
});

test('profile-capacity errors and invalid asset requests do not fault the running realm or create identities',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'wayfarer-full-'));let host,store;
  try {
    store=await SqliteRealmStore.open(path.join(dir,'realm.sqlite'),{maxProfiles:1});
    host=await createLocalRealmServer({publicOrigin,profileStoreOverride:store});
    const req=(url,headers={})=>requestAt(host,url,headers);
    for(let i=0;i<6;i++)await req('/preview/missing-file.js');assert.equal(store.count,0);
    const response=await req('/'),cookie=response.headers.get('set-cookie').split(';')[0];
    assert.equal((await req('/')).status,503);assert.equal(host.faulted,false);
    assert.equal((await req('/',{Cookie:cookie})).status,200);
    assert.equal((await req('/health')).status,200);
  }finally{await host?.close();store?.close();await rm(dir,{recursive:true,force:true});}
});

test('16-player realm ticks at configured capacity; malformed peer cannot stop other players',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'wayfarer-capacity-'));let host,store;const sockets=[];
  try {
    store=await SqliteRealmStore.open(path.join(dir,'realm.sqlite'));
    host=await createLocalRealmServer({capacity:16,publicOrigin,profileStoreOverride:store,xam:true,xamStoreOverride:store.xam});
    // Server-created sessions model separate browser profiles without bypassing identity validation.
    for(let i=0;i<16;i++) {
      const session=await store.ensureSession();const ws=open(host,session.setCookie.split(';')[0]);sockets.push(ws);await joined(ws);
    }
    const extra=await store.ensureSession();assert.equal(await rejected(open(host,extra.setCookie.split(';')[0])),403);
    await until(()=>sockets.every(ws=>ws.messages.some(m=>m.kind==='snapshot'||m.kind==='state'))||host.realm.tick>=10);
    assert.equal(host.connections,16);assert.equal(host.realm.size,17);assert.ok(host.realm.tick>=1);
    const closed=once(sockets[0],'close');sockets[0].send(Buffer.from([1,2,3]));await closed;
    await until(()=>host.connections===15);assert.equal(host.faulted,false);
    const tick=host.realm.tick;await until(()=>host.realm.tick>tick+4);
    assert.ok(sockets[1].messages.filter(m=>m.kind==='game').length>1);
  }finally{for(const ws of sockets)ws.terminate();await host?.close();store?.close();await rm(dir,{recursive:true,force:true});}
});
