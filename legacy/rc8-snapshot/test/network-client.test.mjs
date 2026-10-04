import test from 'node:test';
import assert from 'node:assert/strict';
import WS from 'ws';
import {createLocalRealmServer} from '../tools/realm-server.mjs';
async function until(fn){const end=Date.now()+3000;while(!fn()){if(Date.now()>end)throw new Error('Timed out');await new Promise(r=>setTimeout(r,5));}}
test('browser-client module uses real socket: join, input, snapshot, disconnect and rejoin (stub DOM)',async()=>{
 const host=await createLocalRealmServer({autoTick:false}),old=new Map(),listeners={},docListeners={};let sendTick,now=0;
 const set=(k,v)=>{old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};
 const context=new Proxy({},{get:()=>()=>{}}),elements=new Map();
 function element(id){if(!elements.has(id))elements.set(id,{style:{},textContent:'',disabled:false,getContext:()=>context,listeners:{},addEventListener(type,fn){this.listeners[type]=fn;}});return elements.get(id);}
 try{
  set('document',{hidden:false,querySelector:element,querySelectorAll:()=>[],createElement:()=>({getContext:()=>context}),addEventListener:(type,fn)=>docListeners[type]=fn});
  set('performance',{now:()=>now});
  set('requestAnimationFrame',()=>1);set('cancelAnimationFrame',()=>{});
  set('innerWidth',390);set('innerHeight',844);set('devicePixelRatio',2);set('location',new URL(host.origin));set('addEventListener',(type,fn)=>listeners[type]=fn);
  set('setInterval',fn=>{sendTick=fn;return 12345;});set('clearInterval',()=>{});
  set('WebSocket',class extends WS{constructor(url,protocols){super(url,protocols,{origin:host.origin});}});
  await import('../dist/realm-client.js');
  element('#join').listeners.click();await until(()=>element('#connection').textContent.startsWith('Connected'));await until(()=>element('#players').textContent.includes('1 nearby'));
  assert.equal(host.metrics.accepted,0);listeners.keydown({key:'ArrowRight',preventDefault(){}});sendTick();await until(()=>host.metrics.accepted===1);host.advance(100);await until(()=>element('#players').textContent.includes('tick 2'));
  listeners.blur();await until(()=>host.metrics.accepted===2);
  element('#leave').listeners.click();await until(()=>host.connections===0&&element('#join').disabled===false);
  element('#join').listeners.click();await until(()=>element('#connection').textContent.startsWith('Connected'));assert.equal(host.connections,1);await until(()=>element('#players').textContent.includes('1 nearby'));
  now+=6000;sendTick();await until(()=>host.connections===0);await until(()=>element('#join').disabled===false);assert.match(element('#connection').textContent,/Server updates stopped/);
  element('#join').listeners.click();await until(()=>element('#connection').textContent.startsWith('Connected'));
  listeners.pagehide();await until(()=>host.connections===0&&element('#join').disabled===false);
 }finally{
  for(const [k,d] of old)d?Object.defineProperty(globalThis,k,d):delete globalThis[k];
  await host.close();
 }
});
