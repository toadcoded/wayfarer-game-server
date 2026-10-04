import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {NullEngine,Scene} from '@babylonjs/core';
import {AssetFetcher} from '../dist/asset-fetch.js';
import {parseAssetCatalog} from '../dist/asset-catalog.js';
import {SoftPatch} from '../dist/soft-patch.js';
import {mountBabylonMesh} from '../dist/babylon-mesh.js';
import {staticPayload} from '../tools/static-compression.mjs';
import {createLocalRealmServer} from '../tools/realm-server.mjs';
const response=()=>new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/png'}});
test('asset fetch deduplicates requests and returns isolated cached bytes',async()=>{
 let calls=0;const loader=new AssetFetcher(async()=>{calls++;return response();});
 const [a,b]=await Promise.all([loader.load('/preview/assets/a.png'),loader.load('/preview/assets/a.png')]);assert.equal(calls,1);a[0]=99;assert.equal(b[0],1);assert.equal((await loader.load('/preview/assets/a.png'))[0],1);
 await assert.rejects(loader.load('https://other.test/a.png'));
});
test('fetch caps concurrency at two and retries server errors only once',async()=>{
 let active=0,max=0,calls=0;
 const loader=new AssetFetcher(async()=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,2));active--;return response();});
 await Promise.all(['a','b','c','d','e'].map(id=>loader.load(`/preview/assets/${id}.png`)));assert.equal(max,2);
 const failing=new AssetFetcher(async()=>{calls++;return new Response('',{status:503});});await assert.rejects(failing.load('/preview/assets/a.png'));assert.equal(calls,2);
});
test('fetch rejects oversize, wrong MIME and timed-out transfers',async()=>{
 await assert.rejects(new AssetFetcher(async()=>new Response(new Uint8Array(2_000_001),{headers:{'content-type':'image/png'}})).load('/preview/assets/a.png'));
 await assert.rejects(new AssetFetcher(async()=>new Response('bad')).load('/preview/assets/a.png'));
 const stuck=new AssetFetcher((_path,opts)=>new Promise((_,reject)=>opts.signal.addEventListener('abort',()=>reject(new Error('aborted')))),10);await assert.rejects(stuck.load('/preview/assets/a.png'),/aborted/);
});
test('runtime catalog validation rejects unsafe paths, bad crops, coercion and duplicate IDs',()=>{
 const a=JSON.parse(readFileSync(new URL('../preview/assets/manifest.json',import.meta.url)));assert.equal(parseAssetCatalog(a).length,7);
 for(const change of [{id:'../oops'},{width:'96'},{crop:{x:0,y:0,width:999,height:1}}])assert.throws(()=>parseAssetCatalog([{...a[0],...change}]));assert.throws(()=>parseAssetCatalog([a[0],a[0]]));
});
test('multipoint cloth preserves anchors and finite geometry under long stalls',()=>{
 const patch=new SoftPatch(),anchors=patch.positions.slice(0,21);for(let i=0;i<300;i++)patch.advance(16.6666667);
 assert.deepEqual(patch.positions.slice(0,21),anchors);assert.ok([...patch.positions].every(Number.isFinite));assert.ok([...patch.positions].every(n=>Math.abs(n)<20));
 const result=patch.advance(10000);assert.equal(result.droppedMs,9900);assert.ok(result.steps<=12);assert.throws(()=>patch.advance(NaN));
});
test('real Babylon NullEngine mounts, updates and disposes a cloth mesh',()=>{
 const engine=new NullEngine(),scene=new Scene(engine);scene.useRightHandedSystem=true;
 try{const patch=new SoftPatch(),handle=mountBabylonMesh(scene,'test',{positions:patch.positions,indices:patch.indices,color:'#bba26a'},true);assert.equal(handle.mesh.getTotalVertices(),63);patch.advance(100);handle.update(patch.positions);assert.equal(handle.mesh.getVerticesData('normal').length,189);handle.dispose();handle.dispose();assert.equal(scene.meshes.length,0);assert.throws(()=>handle.update(patch.positions));assert.throws(()=>mountBabylonMesh(scene,'bad',{positions:new Float32Array([NaN,0,0]),indices:new Uint32Array([0,0,0]),color:'#ffffff'}));}finally{scene.dispose();engine.dispose();}
});
test('static compression honors gzip refusal and preserves bytes',async()=>{
 const data=Buffer.from('realm '.repeat(1000));const yes=await staticPayload(data,'text/javascript','gzip');assert.equal(yes.headers['Content-Encoding'],'gzip');assert.deepEqual(gunzipSync(yes.bytes),data);
 const no=await staticPayload(data,'text/javascript','gzip;q=0, *;q=1');assert.equal(no.headers['Content-Encoding'],undefined);assert.deepEqual(no.bytes,data);
 assert.equal((await staticPayload(data,'image/png','gzip')).headers['Content-Encoding'],undefined);
});
test('two loopback realms use distinct ports and serve the shared fetch and mesh assets',async()=>{
 const a=await createLocalRealmServer(),b=await createLocalRealmServer();
 try{assert.notEqual(a.origin,b.origin);for(const host of [a,b]){const r=await fetch(host.origin+'/preview/assets/manifest.json');assert.equal(r.status,200);assert.match(r.headers.get('content-security-policy'),/connect-src 'self'/);assert.equal(parseAssetCatalog(await r.json()).length,7);const mesh=await fetch(host.origin+'/preview/mesh-lab.bundle.js');assert.equal(mesh.status,200);assert.equal(mesh.headers.get('content-encoding'),'gzip');}}finally{await a.close();await b.close();}
});
