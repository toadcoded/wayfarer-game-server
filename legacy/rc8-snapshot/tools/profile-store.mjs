import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {checkedPlayerSave} from '../dist/persistence.js';

export const PROFILE_COOKIE='wf_profile';
const FORMAT='wayfarer-local-profile-db',VERSION=1,MAX_DB_BYTES=8*1024*1024,MAX_PROFILES=10000;
const accountOk=id=>typeof id==='string'&&/^a_[0-9a-f]{32}$/.test(id);
const clone=x=>structuredClone(x);
function exact(o,keys){if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).length!==keys.length||!keys.every(k=>Object.hasOwn(o,k)))throw new Error('Invalid profile database');}
function checkedDb(value){
 exact(value,['format','version','secret','profiles']);
 if(value.format!==FORMAT||value.version!==VERSION||typeof value.secret!=='string'||!/^[0-9a-f]{64}$/.test(value.secret)||!value.profiles||typeof value.profiles!=='object'||Array.isArray(value.profiles))throw new Error('Invalid profile database');
 const entries=Object.entries(value.profiles);if(entries.length>MAX_PROFILES)throw new Error('Profile database exceeds limit');
 const profiles={};for(const [id,entry] of entries){if(!accountOk(id))throw new Error('Invalid account id');exact(entry,['revision','save']);if(!Number.isSafeInteger(entry.revision)||entry.revision<0)throw new Error('Invalid profile revision');profiles[id]={revision:entry.revision,save:entry.save===null?null:checkedPlayerSave(entry.save)};}
 return {format:FORMAT,version:VERSION,secret:value.secret,profiles};
}
function cookiePairs(header){const map=new Map();if(typeof header!=='string')return map;for(const part of header.split(';')){const i=part.indexOf('=');if(i<1)continue;const k=part.slice(0,i).trim(),v=part.slice(i+1).trim();if(k&&!map.has(k))map.set(k,v);}return map;}
function signature(secret,id){return createHmac('sha256',Buffer.from(secret,'hex')).update(id).digest('hex');}
function verify(secret,id,sig){if(!accountOk(id)||typeof sig!=='string'||!/^[0-9a-f]{64}$/.test(sig))return false;const expected=Buffer.from(signature(secret,id),'hex'),actual=Buffer.from(sig,'hex');return expected.length===actual.length&&timingSafeEqual(expected,actual);}
function cookieValue(secret,id){return `${id}.${signature(secret,id)}`;}
function setCookie(secret,id){return `${PROFILE_COOKIE}=${cookieValue(secret,id)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000`;}

export class LocalProfileStore {
 #db;#queue=Promise.resolve();
 constructor(readonlyPath,db){this.path=readonlyPath;this.#db=checkedDb(db);}
 static async open(filename){
  if(typeof filename!=='string'||!filename)throw new Error('Profile path required');const target=path.resolve(filename);let db;
  try{const bytes=await readFile(target);if(bytes.length>MAX_DB_BYTES)throw new Error('Profile database exceeds byte budget');db=checkedDb(JSON.parse(bytes.toString('utf8')));}
  catch(error){if(error?.code!=='ENOENT')throw error;db={format:FORMAT,version:VERSION,secret:randomBytes(32).toString('hex'),profiles:{}};const store=new LocalProfileStore(target,db);await store.#write(db);return store;}
  return new LocalProfileStore(target,db);
 }
 get count(){return Object.keys(this.#db.profiles).length;}
 resolveCookie(header){const raw=cookiePairs(header).get(PROFILE_COOKIE);if(!raw)return;const dot=raw.indexOf('.');if(dot<1)return;const id=raw.slice(0,dot),sig=raw.slice(dot+1);if(!verify(this.#db.secret,id,sig)||!Object.hasOwn(this.#db.profiles,id))return;return id;}
 async ensureSession(header){
  const existing=this.resolveCookie(header);if(existing)return {accountId:existing,setCookie:null};const accountId=`a_${randomBytes(16).toString('hex')}`;
  await this.#mutate(next=>{if(Object.keys(next.profiles).length>=MAX_PROFILES)throw new Error('Profile capacity reached');next.profiles[accountId]={revision:0,save:null};});
  return {accountId,setCookie:setCookie(this.#db.secret,accountId)};
 }
 load(accountId){if(!accountOk(accountId))throw new Error('Invalid account id');const entry=this.#db.profiles[accountId];if(!entry)return;return entry.save===null?undefined:checkedPlayerSave(entry.save);}
 revision(accountId){if(!accountOk(accountId))throw new Error('Invalid account id');return this.#db.profiles[accountId]?.revision;}
 async save(accountId,save){return this.saveMany([{accountId,save}]);}
 async saveMany(entries){
  if(!Array.isArray(entries)||entries.length<1||entries.length>256)throw new Error('Invalid profile batch');const ids=new Set();const clean=entries.map(entry=>{if(!entry||!accountOk(entry.accountId)||ids.has(entry.accountId))throw new Error('Invalid profile batch');ids.add(entry.accountId);return {accountId:entry.accountId,save:checkedPlayerSave(entry.save)};});
  await this.#mutate(next=>{for(const {accountId,save} of clean){const old=next.profiles[accountId];if(!old)throw new Error('Unknown account id');if(!Number.isSafeInteger(old.revision+1))throw new Error('Profile revision exhausted');next.profiles[accountId]={revision:old.revision+1,save};}});
  return clean.map(({accountId})=>({accountId,revision:this.#db.profiles[accountId].revision}));
 }
 async #mutate(change){
  const task=this.#queue.then(async()=>{const next=clone(this.#db);change(next);const checked=checkedDb(next);await this.#write(checked);this.#db=checked;});
  this.#queue=task;return task;
 }
 async #write(db){const text=JSON.stringify(checkedDb(db))+'\n';if(Buffer.byteLength(text)>MAX_DB_BYTES)throw new Error('Profile database exceeds byte budget');await mkdir(path.dirname(this.path),{recursive:true});const temp=`${this.path}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;await writeFile(temp,text,{mode:0o600,flag:'wx'});await rename(temp,this.path);}
}
