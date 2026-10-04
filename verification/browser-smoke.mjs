import chromium from '@sparticuz/chromium';
import {chromium as pw} from 'playwright';
import assert from 'node:assert/strict';
import {replayJournal} from '../tools/replay-journal.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {createLocalRealmServer} from '../tools/realm-server.mjs';
const output=new URL('./',import.meta.url);await mkdir(output,{recursive:true});
const host=await createLocalRealmServer({recordReplay:true});
const browser=await pw.launch({executablePath:new URL('./runtime/chromium',import.meta.url).pathname,args:chromium.args,headless:true});
const errors=[],checks=[];checks.push=(...items)=>{console.log(...items);return Array.prototype.push.apply(checks,items);};
try{
 const context=await browser.newContext({viewport:{width:1280,height:800}});
 await context.addInitScript(()=>{const Base=window.WebSocket;window.addEventListener('keydown',e=>{window.lastKey={key:e.key,tag:e.target.tagName,hidden:document.hidden,focus:document.hasFocus()};});window.WebSocket=class extends Base{send(data){window.lastSent=JSON.parse(data);super.send(data);}constructor(...args){super(...args);this.addEventListener('message',e=>{try{const m=JSON.parse(e.data);if(m.kind==='game')window.lastGame=m;if(m.version===1)window.lastSnapshot=m;}catch{}});}};});
 context.setDefaultTimeout(60000);
 const a=await context.newPage(),b=await context.newPage();for(const page of [a,b])page.on('pageerror',e=>errors.push(e.message));
 await a.goto(host.origin);await b.goto(host.origin);await a.evaluate(async()=>{const m=await import('/dist/asset-fetch.js');await m.loadSpriteSheet('elder',512,128);});checks.push('Sprite PNG fetch and ImageBitmap decode succeed');await a.locator('#join').click();await b.locator('#join').click();
 await a.waitForFunction(()=>document.querySelector('#connection').textContent.startsWith('Connected'));await b.waitForFunction(()=>document.querySelector('#connection').textContent.startsWith('Connected'));
 const tick=async()=>{await a.waitForTimeout(160);};await tick();
 assert.equal((await a.evaluate(()=>window.lastSnapshot.players.length)),2);checks.push('Two real browser clients join and receive shared snapshots');
 await a.locator('#appearance').selectOption('elder');await tick();assert.equal(await b.evaluate(()=>window.lastGame.players.find(p=>p.id==='p1').skin),'elder');checks.push('Appearance choice reaches the other browser through server state');
 await a.locator('#beacon-action').click();await tick();await a.locator('#action-result').filter({hasText:'within 3 metres'}).waitFor();checks.push('Distant beacon action rejected by authoritative position');
 await a.locator('[data-quest=accept]').click();await tick();assert.equal(await a.evaluate(()=>window.lastGame.quest.status),'active');
 await a.locator('#toolbox summary').click();await a.locator('#cape-enabled').check();await a.locator('#wind-b').fill('10');await a.locator('#wind-c').fill('8');await a.locator('#pause-effects').check();await a.locator('#reset-cape').click();await a.locator('#pause-effects').uncheck();await a.locator('#toolbox summary').click();
 await a.bringToFront();await a.locator('#world').click({position:{x:650,y:400}});
 await tick();await a.keyboard.down('ArrowRight');await a.keyboard.down('ArrowDown');
 const goal=host.scene.plan.goal;let arrived=false;
 for(let i=0;i<300;i++){await tick();const p=await a.evaluate(()=>window.lastSnapshot.players.find(p=>p.id==='p1').position);if(Math.hypot(p.x-goal.x,p.z-goal.z)<2){arrived=true;break;}}
 await a.keyboard.up('ArrowRight');await a.keyboard.up('ArrowDown');await tick();assert.ok(arrived,'keyboard path must reach landing');
 await a.locator('#beacon-action').click();await tick();assert.equal(await b.evaluate(()=>window.lastGame.beacon.lit),true);checks.push('Keyboard movement crosses actual causeway; beacon lights in both browsers');
 for(let i=0;i<3;i++){await a.waitForTimeout(1050);await a.locator('[data-quest=gather]').click();await tick();assert.equal(await a.evaluate(()=>window.lastGame.quest.reeds),i+1);}
 await a.locator('#world').click({position:{x:650,y:400}});await a.keyboard.down('ArrowLeft');await a.keyboard.down('ArrowUp');let returned=false;
 for(let i=0;i<300;i++){await tick();const p=await a.evaluate(()=>window.lastSnapshot.players.find(p=>p.id==='p1').position);if(Math.hypot(p.x-host.scene.plan.start.x,p.z-host.scene.plan.start.z)<2){returned=true;break;}}
 await a.keyboard.up('ArrowLeft');await a.keyboard.up('ArrowUp');assert.ok(returned);await a.locator('[data-quest=submit]').click();await tick();assert.equal(await a.evaluate(()=>window.lastGame.quest.tithes),1);assert.equal(await b.evaluate(()=>window.lastGame.quest.status),'available');checks.push('Full Quiet Tithe journey: accept, cross, gather three, return, receive one private reward');
 await a.locator('#inventory-panel summary').click();await a.locator('#item-choice').selectOption('granite_maul');await a.locator('#item-claim').click();await tick();assert.equal(await a.evaluate(()=>window.lastGame.inventory.slots.filter(Boolean).length),1);assert.equal(await a.evaluate(()=>window.lastGame.quest.tithes),0);await a.locator('#item-equip').click();await tick();assert.equal(await b.evaluate(()=>window.lastGame.players.find(p=>p.id==='p1').weapon),'granite_maul');assert.equal(await b.evaluate(()=>window.lastGame.inventory.slots.filter(Boolean).length),0);await a.locator('#item-unequip').click();await tick();assert.equal(await b.evaluate(()=>window.lastGame.players.find(p=>p.id==='p1').weapon),null);await a.locator('#item-equip').click();await tick();checks.push('Reward claim consumes one token; private pack and shared equip/stow work through both browsers');
 const checkpoint=host.exportReplay();replayJournal(JSON.stringify(checkpoint),host.scene.navigation);await writeFile(new URL('session-replay.json',output),JSON.stringify(checkpoint));
 await a.screenshot({path:new URL('desktop.png',output).pathname});
 await a.locator('#leave').click();await a.waitForFunction(()=>!document.querySelector('#join').disabled);await a.locator('#join').click();await a.waitForFunction(()=>document.querySelector('#connection').textContent.startsWith('Connected'));await tick();checks.push('Explicit disconnect and rejoin succeed');
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const m=await mobile.newPage();m.on('pageerror',e=>errors.push(e.message));await m.goto(host.origin);await m.locator('#join').tap();await m.waitForFunction(()=>document.querySelector('#connection').textContent.startsWith('Connected'));await tick();await m.locator('[data-direction="ArrowRight"]').tap();await m.locator('#toolbox summary').tap();await m.locator('#cape-enabled').check();await m.screenshot({path:new URL('mobile.png',output).pathname});assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);checks.push('390×844 touch viewport, controls, reduced motion and no horizontal overflow');
 const journal=host.exportReplay();const replay=replayJournal(JSON.stringify(journal),host.scene.navigation);checks.push('Live browser session replay verified at every recorded event: '+replay.hash);await writeFile(new URL('session-replay.json',output),JSON.stringify(journal,null,2));
 assert.deepEqual(errors,[]);await writeFile(new URL('browser-results.json',output),JSON.stringify({browser:await browser.version(),checks,errors,limits:['Chromium software rendering only','Mobile viewport emulation, not physical iOS/Android','No Firefox/WebKit run','Babylon lab unchanged; previous initialization evidence retained separately']},null,2));console.log(JSON.stringify({checks,errors}));
}finally{await browser.close();await host.close();}
