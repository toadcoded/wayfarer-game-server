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
 const practicePads=Array.from({length:4},(_,i)=>{const b=element('practice:'+i);b.dataset={practicePad:String(i)};return b;});
 const skillButtons=['woodcutting','mining','fishing','deposit','upgrade'].map(value=>{const b=element('skill:'+value);b.dataset={skilling:value};return b;});
 try{
  set('document',{hidden:false,querySelector:element,querySelectorAll:selector=>selector==='[data-skilling]'?skillButtons:selector==='[data-practice-pad]'?practicePads:[],createElement:()=>({getContext:()=>context}),addEventListener:(type,fn)=>docListeners[type]=fn});
  set('performance',{now:()=>now});
  set('requestAnimationFrame',()=>1);set('cancelAnimationFrame',()=>{});
  set('innerWidth',390);set('innerHeight',844);set('devicePixelRatio',2);set('location',new URL(host.origin));set('addEventListener',(type,fn)=>listeners[type]=fn);
  set('setInterval',fn=>{sendTick=fn;return 12345;});set('clearInterval',()=>{});
  set('WebSocket',class extends WS{constructor(url,protocols){super(url,protocols,{origin:host.origin});}});
  await import('../dist/realm-client.js');
  element('#join').listeners.click();await until(()=>element('#connection').textContent.startsWith('Connected'));await until(()=>element('#players').textContent.includes('1 nearby'));
  assert.match(element('#realm-heartbeat').textContent,/live/);
  element('#retry-graphics').listeners.click();assert.match(element('#render-status').textContent,/2D fallback/);element('#hud-reset').listeners.click();assert.equal(element('#visual-surface').hidden,false);assert.equal(element('#living-realm').hidden,false);
  assert.equal(element('#npc-talk').disabled,false);const beforeTalk=host.realm.inspection();element('#npc-talk').listeners.click();assert.match(element('#npc-dialogue').textContent,/Halden/);assert.deepEqual(host.realm.inspection(),beforeTalk);assert.equal(host.metrics.accepted,0);
  assert.equal(host.metrics.accepted,0);listeners.keydown({key:'ArrowRight',preventDefault(){}});sendTick();await until(()=>host.metrics.accepted===1);host.advance(100);await until(()=>element('#players').textContent.includes('tick 2'));
  listeners.blur();await until(()=>host.metrics.accepted===2);
  assert.equal(element('skill:mining').disabled,true);assert.equal(element('skill:deposit').disabled,false);assert.match(element('#profession-state').textContent,/woodcutting 1/);element('skill:deposit').listeners.click();await until(()=>host.metrics.accepted===3);host.advance(100);await until(()=>element('#action-result').textContent.includes('deposited'));assert.match(element('#resource-bank').textContent,/Bank: logs 0, ore 0, fish 0, warden_essence 0/);
  element('#practice-choice').value='strength';element('#practice-action').listeners.click();await until(()=>host.metrics.accepted===4);host.advance(100);await until(()=>element('#practice-state').textContent.includes('action 1/3'));assert.equal(host.realm.inspection().game.players[0].progression.xp.strength,0);
  for(let i=0;i<3;i++){const c=host.realm.inspection().game.players[0].practiceChallenge;while(host.realm.tick<c.readyTick)host.advance(100);await until(()=>practicePads[c.target].disabled===false);assert.match(practicePads[c.target].textContent,/★/);practicePads[c.target].listeners.click();await until(()=>host.metrics.accepted===5+i);host.advance(100);await until(()=>i===2?element('#action-result').textContent.includes('Practice complete'):element('#practice-state').textContent.includes('action '+(i+2)+'/3'));}
  assert.equal(host.realm.inspection().game.players[0].progression.xp.strength,1);
  element('#leave').listeners.click();await until(()=>host.connections===0&&element('#join').disabled===false);
  element('#join').listeners.click();await until(()=>element('#connection').textContent.startsWith('Connected'));assert.equal(host.connections,1);await until(()=>element('#players').textContent.includes('1 nearby'));
  now+=6000;sendTick();await until(()=>host.connections===0);await until(()=>element('#join').disabled===false);assert.match(element('#connection').textContent,/Server updates stopped/);
  element('#join').listeners.click();await until(()=>element('#connection').textContent.startsWith('Connected'));
  document.hidden=true;docListeners.visibilitychange();assert.match(element('#realm-heartbeat').textContent,/page resting/);document.hidden=false;docListeners.visibilitychange();
  listeners.pagehide();await until(()=>host.connections===0&&element('#join').disabled===false);
 }finally{
  for(const [k,d] of old)d?Object.defineProperty(globalThis,k,d):delete globalThis[k];
  await host.close();
 }
});
