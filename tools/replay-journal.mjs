import {createHash} from 'node:crypto';
import {RealmRuntime} from '../dist/realm-runtime.js';
import {REALM_CONTRACT} from '../dist/realm-contract.js';
import {decodeMoveIntent} from '../dist/movement.js';
import {decodeAction} from '../dist/game-actions.js';
import {checkedPlayerSave} from '../dist/persistence.js';
export const MAX_REPLAY_BYTES=4*1024*1024,MAX_REPLAY_EVENTS=20000;
export function canonical(value){
 if(value===null||typeof value==='boolean'||typeof value==='string')return JSON.stringify(value);
 if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 throw new Error('Non-canonical state');
}
export const stateHash=realm=>createHash('sha256').update(canonical(realm.inspection())).digest('hex');
const exact=(o,keys)=>{if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).length!==keys.length||!keys.every(k=>Object.hasOwn(o,k)))throw new Error('Invalid replay fields');};
const alias=x=>typeof x==='string'&&/^c[1-9][0-9]{0,7}$/.test(x);
function validPacket(text){if(typeof text!=='string'||Buffer.byteLength(text)>256)throw new Error('Invalid replay packet');try{return JSON.stringify(decodeAction(text));}catch{return JSON.stringify(decodeMoveIntent(text));}}
/** Opt-in accepted-input journal. Bounded prefix on exhaustion; never stores rejected payloads or tokens. */
export class ReplayJournal {
 #events=[];#aliases=new Map();#next=1;#bytes=1024;#reason=null;#options;#lastHash;
 constructor(realm,options,{maxEvents=MAX_REPLAY_EVENTS,maxBytes=MAX_REPLAY_BYTES}={}){
  if(!Number.isInteger(maxEvents)||maxEvents<1||maxEvents>MAX_REPLAY_EVENTS||!Number.isInteger(maxBytes)||maxBytes<2048||maxBytes>MAX_REPLAY_BYTES)throw new Error('Invalid replay budget');
  if(realm.size||realm.tick)throw new Error('Recorder must start with an empty new realm');
  this.maxEvents=maxEvents;this.maxBytes=maxBytes;this.#options=structuredClone(options);this.#lastHash=stateHash(realm);
 }
 stop(reason='fault'){if(!this.#reason)this.#reason=reason;}
 #append(event,realm){
  if(this.#reason)return;const item={...event,hash:stateHash(realm)},size=Buffer.byteLength(JSON.stringify(item))+1;
  if(this.#events.length>=this.maxEvents||this.#bytes+size>this.maxBytes){this.stop('limit');return;}
  this.#events.push(item);this.#bytes+=size;this.#lastHash=item.hash;
 }
 join(connection,spawn,realm,profile){if(this.#reason)return;const id=`c${this.#next++}`;this.#aliases.set(connection,id);const saved=profile===undefined?null:checkedPlayerSave(profile);this.#append({op:'join',connection:id,spawn:{x:spawn.x,z:spawn.z},profile:saved},realm);}
 input(connection,packet,realm){if(this.#reason)return;this.#append({op:'input',connection:this.#aliases.get(connection),packet:validPacket(packet)},realm);}
 leave(connection,realm){const id=this.#aliases.get(connection);this.#aliases.delete(connection);if(id)this.#append({op:'leave',connection:id},realm);}
 advance(elapsedMs,realm){if(elapsedMs>60000){this.stop('unsupported_delta');return;}this.#append({op:'advance',elapsedMs},realm);}
 export(){return structuredClone({format:'wayfarer-replay',version:2,contract:REALM_CONTRACT,options:this.#options,complete:this.#reason===null,stopReason:this.#reason,events:this.#events,finalHash:this.#lastHash});}
}
export function parseJournal(text){
 if(typeof text!=='string'||Buffer.byteLength(text)>MAX_REPLAY_BYTES)throw new Error('Replay exceeds byte budget');
 const j=JSON.parse(text);exact(j,['format','version','contract','options','complete','stopReason','events','finalHash']);
 if(j.format!=='wayfarer-replay'||j.version!==2||canonical(j.contract)!==canonical(REALM_CONTRACT)||typeof j.complete!=='boolean'||!Array.isArray(j.events)||j.events.length>MAX_REPLAY_EVENTS||!['limit','fault','unsupported_delta',null].includes(j.stopReason)||j.complete!==(j.stopReason===null)||!/^\w{64}$/.test(j.finalHash)||!/^[0-9a-f]{64}$/.test(j.finalHash))throw new Error('Invalid replay header');
 const hasCamp=Object.hasOwn(j.options,'camp'),hasCodex=Object.hasOwn(j.options,'codex');exact(j.options,['capacity','visibilityRadius','beacon',...(hasCamp?['camp']:[]),...(hasCodex?['codex']:[])]);for(const [label,value] of [['camp',j.options.camp],['codex',j.options.codex]])if(value!==undefined){exact(value,['x','y','z']);if(!Object.values(value).every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e6))throw new Error('Invalid replay '+label);}const o=j.options;exact(o.beacon,['x','y','z']);
 if(!Number.isInteger(o.capacity)||o.capacity<1||o.capacity>256||!Number.isFinite(o.visibilityRadius)||o.visibilityRadius<=0||o.visibilityRadius>4096||!Object.values(o.beacon).every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e6))throw new Error('Invalid replay options');
 for(const e of j.events){
  const keys={join:['op','connection','spawn','profile','hash'],input:['op','connection','packet','hash'],leave:['op','connection','hash'],advance:['op','elapsedMs','hash']}[e?.op];if(!keys)throw new Error('Invalid replay operation');exact(e,keys);
  if(typeof e.hash!=='string'||!/^[0-9a-f]{64}$/.test(e.hash)||e.op!=='advance'&&!alias(e.connection))throw new Error('Invalid replay event');
  if(e.op==='join'){exact(e.spawn,['x','z']);if(!Object.values(e.spawn).every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e6))throw new Error('Invalid replay spawn');if(e.profile!==null){const save=checkedPlayerSave(e.profile);if(save.position.x!==e.spawn.x||save.position.z!==e.spawn.z)throw new Error('Replay profile/spawn mismatch');}}
  if(e.op==='input')validPacket(e.packet);
  if(e.op==='advance'&&(!Number.isFinite(e.elapsedMs)||e.elapsedMs<0||e.elapsedMs>60000))throw new Error('Invalid replay clock');
 }
 return j;
}
export function replayJournal(text,nav,{allowPrefix=false}={}){
 const j=parseJournal(text);if(!j.complete&&!allowPrefix)throw new Error('Replay is incomplete; explicitly request prefix verification');
 const realm=new RealmRuntime(nav,j.options);let index=0;
 for(const e of j.events){
  if(e.op==='join')realm.join(e.connection,e.spawn,e.profile??undefined);
  if(e.op==='leave'&&!realm.leave(e.connection))throw new Error('Replay left unknown player');
  if(e.op==='input'&&!realm.receive(e.connection,e.packet))throw new Error('Replay input was rejected');
  if(e.op==='advance')realm.advance(e.elapsedMs);
  if(stateHash(realm)!==e.hash)throw new Error(`Replay divergence at event ${index}`);index++;
 }
 const hash=stateHash(realm);if(hash!==j.finalHash)throw new Error('Replay final hash mismatch');
 return {realm,events:index,hash,complete:j.complete};
}
