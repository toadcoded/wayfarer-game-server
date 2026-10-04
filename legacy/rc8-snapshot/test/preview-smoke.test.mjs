import test from 'node:test';
import assert from 'node:assert/strict';
import {RealmRuntime} from '../dist/realm-runtime.js';
test('preview boots, crosses every style, resizes, pauses and resumes with bounded catch-up',async()=>{
 const old=new Map();
 const set=(k,v)=>{old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};
 const context=new Proxy({},{get:()=>()=>{}}),elements=new Map();
 const element=id=>{if(!elements.has(id))elements.set(id,{style:{},textContent:'',getContext:()=>context,listeners:{},setAttribute(k,v){this[k]=v;},addEventListener(type,fn){this.listeners[type]=fn;}});return elements.get(id);};
 let frame,now=0;const listeners={},docListeners={};
 const tick=()=>{now+=50;frame(now);};
 const realmTick=()=>Number(element('#health').textContent.match(/tick (\d+)/)?.[1]);
 try{
  set('document',{querySelector:element,hidden:false,addEventListener(type,fn){docListeners[type]=fn;}});
  set('innerWidth',390);set('innerHeight',844);set('devicePixelRatio',2);
  set('addEventListener',(type,fn)=>listeners[type]=fn);set('requestAnimationFrame',fn=>{frame=fn;return 1;});
  await import('../dist/preview-client.js');assert.match(element('#status').textContent,/Ready/);
  for(const style of ['willowglass','saffron','mothlight']){
   element('#style').listeners.change({target:{value:style}});element('#cross').listeners.click();
   for(let i=0;i<400;i++)tick();assert.doesNotMatch(element('#status').textContent,/stopped/);assert.ok(realmTick()>300);
  }
  const before=realmTick();element('#pause').listeners.click();for(let i=0;i<20;i++)tick();assert.equal(realmTick(),before);assert.equal(element('#pause')['aria-pressed'],'true');
  element('#pause').listeners.click();tick();tick();assert.equal(realmTick(),before+1);
  document.hidden=true;docListeners.visibilitychange();now+=60000;frame(now);assert.equal(realmTick(),before+1);
  document.hidden=false;docListeners.visibilitychange();tick();tick();assert.equal(realmTick(),before+2);
  const stallStart=realmTick();now+=60000;frame(now);assert.equal(realmTick(),stallStart+4);
  globalThis.innerWidth=1280;listeners.resize();assert.equal(element('#world').width,2560);
  const advance=RealmRuntime.prototype.advance;
  try{RealmRuntime.prototype.advance=function(){return advance.call(this,50,()=>{throw new Error('injected preview fault');});};tick();}
  finally{RealmRuntime.prototype.advance=advance;}
  assert.match(element('#status').textContent,/stopped safely/);assert.match(element('#health').textContent,/Simulation fault/);
  docListeners.visibilitychange();tick();assert.match(element('#health').textContent,/Simulation fault/);
  element('#reset').listeners.click();tick();tick();assert.doesNotMatch(element('#health').textContent,/fault/);assert.equal(realmTick(),1);
 }finally{for(const [k,d] of old)d?Object.defineProperty(globalThis,k,d):delete globalThis[k];}
});
