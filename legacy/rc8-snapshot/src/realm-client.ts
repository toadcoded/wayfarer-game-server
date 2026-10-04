import {WEAPONS} from './encounter.js';
import {ITEMS,type ItemId} from './inventory.js';
import {rasterIso} from './iso-raster.js';
import {RESULT_TEXT,decodeGameState,type GameState,type Action} from './game-actions.js';
import {GameCape} from './game-cape.js';
import {CharacterRenderer} from './character-renderer.js';
import {SnapshotBuffer} from './snapshot-buffer.js';
import {REALM_SUBPROTOCOL,encodeHello,decodeWelcome,compatibilityMessage,CompatibilityError} from './realm-contract.js';
import {decodeRealmSnapshot,type RealmSnapshot} from './replication.js';
import {encodeMoveIntent} from './movement.js';
import {createRealmScene,REALM_WORLD} from './realm-scene.js';
import {crossingScene} from './scene-meshes.js';
import {toIso} from './adapters/iso.js';
import type {Point} from './world.js';
const scene=createRealmScene(),canvas=document.querySelector<HTMLCanvasElement>('#world')!,ctx=canvas.getContext('2d')!;
const status=document.querySelector<HTMLElement>('#connection')!,stats=document.querySelector<HTMLElement>('#players')!;
const join=document.querySelector<HTMLButtonElement>('#join')!,leave=document.querySelector<HTMLButtonElement>('#leave')!;
let socket:WebSocket|undefined,id:string|undefined,snapshot:RealmSnapshot|undefined,sequence=0;
const characters=new CharacterRenderer(),cape=new GameCape();
let game:GameState|undefined,actionSequence=0;
const reduced=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):undefined;
function action(action:Action['action'],value:string){if(socket?.readyState===WebSocket.OPEN&&id&&socket.bufferedAmount<65536)socket.send(JSON.stringify({kind:'action',sequence:actionSequence++,action,value}));}
const effectPaused=()=>!!document.querySelector<HTMLInputElement>('#pause-effects')?.checked||!!reduced?.matches;
function configureWind(){const options=cape.patch.getABC();options.enabled=!!document.querySelector<HTMLInputElement>('#cape-enabled')?.checked;for(const key of ['a','b','c'] as const)options[key]=Number(document.querySelector<HTMLInputElement>('#wind-'+key)?.value||0);cape.patch.setABC(options);}
for(const key of ['a','b','c'])document.querySelector('#wind-'+key)?.addEventListener('input',configureWind);
document.querySelector('#cape-enabled')?.addEventListener('change',configureWind);
document.querySelector('#reset-cape')?.addEventListener('click',()=>{cape.reset();configureWind();});
document.querySelector('#beacon-action')?.addEventListener('click',()=>action('beacon','light'));
document.querySelector('#appearance')?.addEventListener('change',()=>action('appearance',document.querySelector<HTMLSelectElement>('#appearance')!.value));
for(const button of document.querySelectorAll<HTMLButtonElement>('[data-quest]'))button.addEventListener('click',()=>action('quest',button.dataset.quest!));
for(const kind of ['claim','equip','unequip'] as const)document.querySelector('#item-'+kind)?.addEventListener('click',()=>action(kind,kind==='unequip'?'weapon':document.querySelector<HTMLSelectElement>('#item-choice')!.value));
for(const value of ['attack','guard'])document.querySelector('#combat-'+value)?.addEventListener('click',()=>action('combat',value));
addEventListener('keydown',e=>{if(e.repeat||!(e.code==='Space'||e.code==='KeyG')||(typeof Element!=='undefined'&&e.target instanceof Element&&e.target.closest('input,select,textarea,button,summary,a')))return;e.preventDefault();action('combat',e.code==='Space'?'attack':'guard');});
const buffer=new SnapshotBuffer();let connectedAt=0,animationId=0;
const held=new Set<string>();let width=1,height=1,scale=1,ox=0,oy=0;
type Face={points:Point[];color:string;depth:number};
const faces:Face[]=[];
for(const m of crossingScene(REALM_WORLD,scene.plan))for(let i=0;i<m.indices.length;i+=3){
 const points=Array.from(m.indices.slice(i,i+3),v=>({x:m.positions[v*3]!,y:m.positions[v*3+1]!,z:m.positions[v*3+2]!}));
 faces.push({points,color:m.color,depth:points.reduce((n,p)=>n+p.x+p.z+p.y*.02,0)/3});
}
faces.sort((a,b)=>a.depth-b.depth);
const project=(p:Point)=>{const q=toIso(p.x,p.z);return {x:ox+q.isoX*scale,y:oy+(q.isoY-p.y)*scale};};
// Static scenery is rasterized only on resize, not once per network snapshot.
const scenery=document.createElement('canvas'),sc=scenery.getContext('2d')!;
function resize(){
 width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);
 for(const c of [canvas,scenery]){c.width=width*dpr;c.height=height*dpr;}
 ctx.setTransform(dpr,0,0,dpr,0,0);sc.setTransform(dpr,0,0,dpr,0,0);
 const points=faces.flatMap(f=>f.points.map(p=>{const q=toIso(p.x,p.z);return {x:q.isoX,y:q.isoY-p.y};}));
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 scale=Math.max(.5,Math.min((width-30)/(maxX-minX),(height-220)/(maxY-minY)));ox=width/2-(minX+maxX)/2*scale;oy=height/2-(minY+maxY)/2*scale-(width<=650?85:0);
 const pixels=sc.createImageData(scenery.width,scenery.height);
 if(pixels){pixels.data.set(rasterIso(scenery.width,scenery.height,faces,p=>{const q=project(p);return {x:q.x*dpr,y:q.y*dpr};}));sc.putImageData(pixels,0,0);}
 else {sc.fillStyle='#142923';sc.fillRect(0,0,width,height);for(const f of faces){sc.beginPath();f.points.map(project).forEach((p,i)=>i?sc.lineTo(p.x,p.y):sc.moveTo(p.x,p.y));sc.closePath();sc.fillStyle=f.color;sc.fill();}}
 render();
}
function render(){
 ctx.drawImage(scenery,0,0,scenery.width,scenery.height,0,0,width,height);
 const now=performance.now(),players=buffer.sample(now).players;characters.retain([...players.map(p=>p.id),...(game?.xam?['xam']:[])]);
 if(game){const target=project(game.beacon.position),e=game.encounter;ctx.save();ctx.strokeStyle=e.strikeAt?'#ff9569':'#82d2bc';ctx.lineWidth=e.strikeAt?3:1;ctx.beginPath();ctx.ellipse(target.x,target.y,4*scale,2*scale,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle=e.hp===0?'#506761':e.strikeAt?'#f7a572':'#8ab4a8';ctx.beginPath();ctx.arc(target.x,target.y-32,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#263e39';ctx.fillRect(target.x-22,target.y-55,44,5);ctx.fillStyle='#a3e3ad';ctx.fillRect(target.x-22,target.y-55,44*e.hp/80,5);ctx.restore();}
 if(game){const q=project(game.beacon.position);ctx.fillStyle=game.beacon.lit?'#ffce70':'#a2bcb0';ctx.beginPath();ctx.arc(q.x,q.y-12,game.beacon.lit?9:5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f2ebcf';ctx.font='12px system-ui';ctx.fillText(game.beacon.lit?'Landing beacon · lit':'Landing beacon',Math.min(q.x+14,width-150),q.y-12);}
 for(const p of [...players].sort((a,b)=>a.position.x+a.position.z-b.position.x-b.position.z)){
  const q=project(p.position),local=p.id===id,skin=game?.players.find(v=>v.id===p.id)?.skin??'adventurer';
  if(local&&cape.patch.getABC().enabled)cape.draw(ctx,q,now,effectPaused());
  characters.draw(ctx,p.id,p.position,q,now,skin,local,effectPaused());
  const weapon=game?.players.find(v=>v.id===p.id)?.weapon;if(weapon){ctx.save();ctx.strokeStyle=ITEMS[weapon].color;ctx.fillStyle=ITEMS[weapon].color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(q.x+10,q.y-15);ctx.lineTo(q.x+16,q.y-36);ctx.stroke();if(weapon==='granite_maul')ctx.fillRect(q.x+10,q.y-39,13,7);else if(weapon==='ash_staff'){ctx.beginPath();ctx.arc(q.x+16,q.y-36,4,0,Math.PI*2);ctx.fill();}ctx.restore();}
  ctx.fillStyle=local?'#ffe2a1':'#91dbed';ctx.font='12px system-ui';ctx.fillText(local?'You':p.id,q.x+13,q.y-35);
 }
 if(game?.xam){
  const x=game.xam,q=project(x.position);characters.draw(ctx,'xam',x.position,q,now,'elder',false,effectPaused());
  ctx.save();ctx.strokeStyle='#aee7ff';ctx.fillStyle='#d8f5ff';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(q.x-10,q.y-18);ctx.lineTo(q.x-20,q.y-45);ctx.stroke();ctx.beginPath();ctx.arc(q.x-21,q.y-47,7,Math.PI*.05,Math.PI*.95);ctx.stroke();ctx.strokeStyle='#caa25c';ctx.beginPath();ctx.moveTo(q.x+9,q.y-16);ctx.lineTo(q.x+18,q.y-29);ctx.stroke();ctx.beginPath();ctx.moveTo(q.x+18,q.y-29);ctx.lineTo(q.x+24,q.y-35);ctx.moveTo(q.x+18,q.y-29);ctx.lineTo(q.x+12,q.y-36);ctx.stroke();ctx.fillStyle='#f0e6ce';ctx.font='bold 12px system-ui';ctx.fillText('Xam',q.x+13,q.y-38);ctx.font='11px system-ui';ctx.fillStyle='#b9d8cb';ctx.fillText(x.currentSkill,q.x+13,q.y-24);ctx.restore();
 }
 const button=document.querySelector<HTMLButtonElement>('#beacon-action');if(button)button.disabled=!id;
 const feedback=document.querySelector<HTMLElement>('#action-result');
 if(feedback)feedback.textContent=!id?'Join to meet Halden.':game?.result?RESULT_TEXT[game.result.code]:'Speak to Halden at the near landing.';
 const inv=game?.inventory,choice=document.querySelector<HTMLSelectElement>('#item-choice')?.value as ItemId;
 const inventoryText=document.querySelector<HTMLElement>('#inventory-state');if(inventoryText)inventoryText.textContent=inv?`Pack ${inv.slots.filter(Boolean).length}/20: ${inv.slots.filter((v):v is ItemId=>v!==null).map(v=>ITEMS[v].name).join(', ')||'empty'} · Equipped: ${inv.weapon?ITEMS[inv.weapon].name:'none'}`:'Join to open your pack.';
 const claim=document.querySelector<HTMLButtonElement>('#item-claim'),equip=document.querySelector<HTMLButtonElement>('#item-equip'),unequip=document.querySelector<HTMLButtonElement>('#item-unequip');if(claim)claim.disabled=!id||game?.quest?.tithes!==1||!!inv?.rewardClaimed;if(equip)equip.disabled=!id||!inv?.slots.includes(choice);if(unequip)unequip.disabled=!id||!inv?.weapon;
 const f=game?.fighter,e=game?.encounter,tick=game?.tick??0,w=WEAPONS[inv?.weapon??'unarmed'];
 const combat=document.querySelector<HTMLElement>('#combat-state');if(combat)combat.textContent=f&&e?`You ${f.hp}/40 · Warden ${e.hp}/80 · Victories ${f.wins} · ${f.hp===0?'Recovering':e.hp===0?'Warden resting':e.strikeAt?'Pulse in '+Math.max(0,(e.strikeAt-tick)/20).toFixed(1)+'s — guard or step away':'Approach the far landing'}`:'Join to train at the far landing.';
 for(const kind of ['attack','guard']){const b=document.querySelector<HTMLButtonElement>('#combat-'+kind);if(b)b.disabled=!id||!f||f.hp===0||tick<(kind==='attack'?f.attackReady:f.guardReady)||(kind==='attack'&&e?.hp===0);}
 const weaponText=document.querySelector<HTMLElement>('#weapon-stats');if(weaponText)weaponText.textContent=`${inv?.weapon?ITEMS[inv.weapon].name:'Unarmed'} · ${w.damage} damage · ${w.range}m · ${(w.cooldown/20).toFixed(1)}s`;
 const quest=game?.quest, panel=document.querySelector<HTMLElement>('#quest-progress');
 if(panel)panel.textContent=quest?.status==='completed'?`Completed · ${quest.tithes} offering token${game?.inventory?.rewardClaimed?' · reward claimed':''}`:quest?.status==='active'?`Reeds ${quest.reeds}/3 · ${quest.reeds===3?'Return to Halden':'Gather at the far landing'} · patch ${game!.patch.stock}/3`:'Halden needs three reed bundles from across the causeway.';
 for(const b of document.querySelectorAll<HTMLButtonElement>('[data-quest]'))b.disabled=!id||(b.dataset.quest==='accept'?quest?.status!=='available':quest?.status!=='active');
 if(game){const q=project(game.camp);ctx.fillStyle='#ffe2a1';ctx.font='12px system-ui';ctx.fillText('Halden · Quiet Tithe',q.x-50,q.y+30);const r=project(game.beacon.position);ctx.fillStyle='#a9dc9a';ctx.fillText(`Reeds ${game.patch.stock}/3`,Math.min(r.x+14,width-100),r.y+8);}
 const xamState=document.querySelector<HTMLElement>('#xam-state');if(xamState)xamState.textContent=game?.xam?`Xam · ${game.xam.activity} · ${game.xam.flavor} · reward pips ${game.xam.rewardPips}`:'Xam comes online with the realm.';

 stats.textContent=snapshot?`${snapshot.players.length} nearby · tick ${snapshot.tick} · ${id??'joining'}${buffer.sample(performance.now()).stale?' · waiting for server':''}`:'No realm snapshot';
}
function sendDirection(){
 if(socket?.readyState!==WebSocket.OPEN||!id)return;
 const frame=buffer.sample(performance.now());
 const age=snapshot?frame.ageMs:performance.now()-connectedAt;
 if(age>=500)held.clear();
 if(age>=5000){status.textContent='Server updates stopped. Rejoin to reconnect.';socket.close(1000,'snapshot_timeout');return;}
 // The client's queue is bounded too. Rejoin manually after a stalled connection.
 if(socket.bufferedAmount>=65536){status.textContent='Connection stalled. Disconnect and join again.';socket.close();return;}
 let dx=Number(held.has('ArrowRight'))-Number(held.has('ArrowLeft'))-Number(held.has('ArrowUp'))+Number(held.has('ArrowDown'));
 let dz=-Number(held.has('ArrowRight'))+Number(held.has('ArrowLeft'))-Number(held.has('ArrowUp'))+Number(held.has('ArrowDown'));
 const n=Math.max(1,Math.hypot(dx,dz));dx/=n;dz/=n;
 socket.send(encodeMoveIntent({sequence:sequence++,dx,dz}));
}
function stop(){held.clear();sendDirection();}
function connect(){
 if(socket&&socket.readyState<WebSocket.CLOSING)return;
 id=undefined;snapshot=undefined;game=undefined;sequence=0;actionSequence=0;cape.reset();configureWind();buffer.clear();characters.clear();held.clear();render();join.disabled=true;
 status.textContent='Joining the local realm…';
 const ws=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/socket`,REALM_SUBPROTOCOL);socket=ws;
 let failureMessage='';
 ws.addEventListener('open',()=>{leave.disabled=false;if(ws.protocol!==REALM_SUBPROTOCOL){failureMessage='Server selected an incompatible protocol.';ws.close(1002);return;}ws.send(encodeHello());});
 ws.addEventListener('message',event=>{
  if(socket!==ws)return;
  try{
   if(typeof event.data!=='string')throw new Error('Expected text');
   if(!id){
    const welcome=decodeWelcome(event.data);id=welcome.id;connectedAt=performance.now();status.textContent='Connected. Explore the causeway and train at the far landing.';return;
   }
   if(JSON.parse(event.data)?.kind==='game'){const next=decodeGameState(event.data);if(!game){const choice=document.querySelector<HTMLSelectElement>('#appearance'),local=next.players.find(p=>p.id===id);if(choice&&local)choice.value=local.skin;}game=next;render();return;}
   const next=decodeRealmSnapshot(event.data);
   if(!next.players.some(p=>p.id===id))throw new Error('Missing local player');
   if(!buffer.push(next,performance.now()))return;
   snapshot=next;render();
  }catch(error){failureMessage=error instanceof CompatibilityError?compatibilityMessage(error.code):'Invalid server data. Connection stopped.';status.textContent=failureMessage;ws.close(1002);}
 });
 ws.addEventListener('error',()=>{status.textContent='Cannot reach the local realm.';});
 ws.addEventListener('close',event=>{if(socket!==ws)return;held.clear();id=undefined;snapshot=undefined;game=undefined;buffer.clear();characters.clear();join.disabled=false;leave.disabled=true;status.textContent=failureMessage||(event.reason==='snapshot_timeout'?'Server updates stopped. Join again to reconnect.':compatibilityMessage(event.reason));render();});
}
join.addEventListener('click',connect);leave.addEventListener('click',()=>{stop();socket?.close();});
addEventListener('keydown',e=>{if(e.key.startsWith('Arrow')&&!(typeof Element!=='undefined'&&e.target instanceof Element&&e.target.closest('input,select,textarea,button,summary,a'))){e.preventDefault();held.add(e.key);}});
addEventListener('keyup',e=>{held.delete(e.key);});addEventListener('blur',stop);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
for(const button of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-direction]'))){
 const direction=button.dataset.direction!;
 button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);held.add(direction);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>{held.delete(direction);sendDirection();});
}
const timer=setInterval(()=>{if(!document.hidden)sendDirection();},50);
addEventListener('pagehide',()=>{clearInterval(timer);cancelAnimationFrame(animationId);socket?.close();});addEventListener('resize',resize);
resize();
let lastPaint=0;
function animate(now:number){if(!document.hidden&&now-lastPaint>=1000/30){render();lastPaint=now;}animationId=requestAnimationFrame(animate);}
animationId=requestAnimationFrame(animate);
