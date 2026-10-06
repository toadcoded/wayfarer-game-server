import {DatabaseSync} from 'node:sqlite';
import {mkdir, chmod} from 'node:fs/promises';
import path from 'node:path';
import {createHmac, randomBytes, timingSafeEqual} from 'node:crypto';
import {checkedPlayerSave} from '../dist/persistence.js';
import {checkedXamSave} from './xam-store.mjs';
import {PROFILE_COOKIE} from './profile-store.mjs';

const validId = id => typeof id === 'string' && /^a_[0-9a-f]{32}$/.test(id);
const LINK_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function randomLinkCode(){
  const limit=Math.floor(256/LINK_ALPHABET.length)*LINK_ALPHABET.length;
  let code='';
  while(code.length<10){
    for(const byte of randomBytes(16))if(byte<limit){code+=LINK_ALPHABET[byte%LINK_ALPHABET.length];if(code.length===10)break;}
  }
  return code;
}
export class ProfileCapacityError extends Error {}

/** One persistent realm, local disk only. SQLite's OS lock releases on process death. */
export async function acquireRealmLease(filename) {
  await mkdir(path.dirname(path.resolve(filename)), {recursive:true, mode:0o700});
  const db = new DatabaseSync(filename, {timeout:0});
  try {
    db.exec('PRAGMA journal_mode=DELETE; CREATE TABLE IF NOT EXISTS lease (id INTEGER PRIMARY KEY); BEGIN EXCLUSIVE;');
    db.prepare('INSERT OR REPLACE INTO lease VALUES (?)').run(1);
    return () => db.close();
  } catch (error) { db.close(); throw new Error('Another realm owns this data directory', {cause:error}); }
}

export class SqliteRealmStore {
  constructor(filename, {secure=false, maxProfiles=10000}={}) {
    if (!Number.isInteger(maxProfiles) || maxProfiles<1 || maxProfiles>10000) throw Error('Invalid profile limit');
    this.path=path.resolve(filename); this.secure=secure; this.maxProfiles=maxProfiles;
    this.db=new DatabaseSync(this.path, {timeout:1000});
    try {
      this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON;');
      const version=this.db.prepare('PRAGMA user_version').get().user_version;
      if (version!==0 && version!==1) throw Error('Unsupported realm database version');
      this.transaction(() => {
        this.db.exec(`CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
          CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY, revision INTEGER NOT NULL CHECK(revision>=0), save TEXT) STRICT;
          CREATE TABLE IF NOT EXISTS agents (id TEXT PRIMARY KEY, save TEXT NOT NULL) STRICT;
          CREATE TABLE IF NOT EXISTS link_codes (code TEXT PRIMARY KEY, profile_id TEXT NOT NULL, expires INTEGER NOT NULL) STRICT;
          PRAGMA user_version=1;`);
        this.db.prepare('INSERT OR IGNORE INTO metadata VALUES (?, ?)').run('cookie_secret',randomBytes(32).toString('hex'));
      });
      this.secret=this.db.prepare('SELECT value FROM metadata WHERE key=?').get('cookie_secret').value;
      if (!/^[0-9a-f]{64}$/.test(this.secret)) throw Error('Invalid cookie secret');
      if (this.db.prepare('PRAGMA quick_check').get().quick_check!=='ok') throw Error('Realm database integrity check failed');
      if (this.count>maxProfiles) throw Error('Existing profiles exceed configured limit');
      for (const row of this.db.prepare('SELECT id, save FROM profiles').iterate()) {
        if (!validId(row.id)) throw Error('Invalid persisted profile identity');
        if (row.save!==null) checkedPlayerSave(JSON.parse(row.save));
      }
      const row=this.db.prepare('SELECT save FROM agents WHERE id=?').get('xam');
      const value=row ? checkedXamSave(JSON.parse(row.save)) : undefined;
      this.xam={value, save:async value => {
        const clean=checkedXamSave(value);
        this.db.prepare('INSERT INTO agents VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET save=excluded.save').run('xam',JSON.stringify(clean));
        this.xam.value=clean;
      }};
    } catch(error) {this.db.close(); throw error;}
  }
  static async open(filename, options) {
    await mkdir(path.dirname(path.resolve(filename)), {recursive:true, mode:0o700});
    const store=new SqliteRealmStore(filename,options);
    try {await chmod(store.path,0o600); return store;} catch(error) {store.close();throw error;}
  }
  transaction(fn) {
    this.db.exec('BEGIN IMMEDIATE');
    try {const result=fn(); this.db.exec('COMMIT'); return result;}
    catch(error) {this.db.exec('ROLLBACK'); throw error;}
  }
  get count() {return this.db.prepare('SELECT count(*) AS count FROM profiles').get().count;}
  sign(id) {return createHmac('sha256',Buffer.from(this.secret,'hex')).update(id).digest('hex');}
  resolveCookie(header) {
    if (typeof header!=='string' || header.length>8192) return;
    const raw=header.split(';').map(p=>p.trim()).find(p=>p.startsWith(PROFILE_COOKIE+'='))?.slice(PROFILE_COOKIE.length+1);
    if (!raw || !/^a_[0-9a-f]{32}\.[0-9a-f]{64}$/.test(raw)) return;
    const [id,sig]=raw.split('.');
    if (!timingSafeEqual(Buffer.from(sig,'hex'),Buffer.from(this.sign(id),'hex'))) return;
    if (this.db.prepare('SELECT 1 FROM profiles WHERE id=?').get(id)) return id;
  }
  async ensureSession(header) {
    const existing=this.resolveCookie(header);
    if (existing) return {accountId:existing,setCookie:null};
    const id='a_'+randomBytes(16).toString('hex');
    this.transaction(() => {
      if (this.count>=this.maxProfiles) throw new ProfileCapacityError('Guest profile capacity reached');
      this.db.prepare('INSERT INTO profiles VALUES (?, 0, NULL)').run(id);
    });
    return {accountId:id,setCookie:`${PROFILE_COOKIE}=${id}.${this.sign(id)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000${this.secure?'; Secure':''}`};
  }
  load(id) {
    if (!validId(id)) throw Error('Invalid profile identity');
    const row=this.db.prepare('SELECT save FROM profiles WHERE id=?').get(id);
    return row?.save ? checkedPlayerSave(JSON.parse(row.save)) : undefined;
  }
  revision(id) {return this.db.prepare('SELECT revision FROM profiles WHERE id=?').get(id)?.revision;}
  sessionCookie(id) {if(!validId(id)) throw Error('Invalid profile identity');return `${PROFILE_COOKIE}=${id}.${this.sign(id)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000${this.secure?'; Secure':''}`;}
  createLinkCode(id) {
    if(!validId(id)||!this.db.prepare('SELECT 1 FROM profiles WHERE id=?').get(id)) throw Error('Unknown profile');
    const now=Date.now(),expires=now+10*60*1000;let code;
    this.transaction(()=>{this.db.prepare('DELETE FROM link_codes WHERE expires<?').run(now);for(let attempt=0;attempt<5;attempt++){code=randomLinkCode();if(!this.db.prepare('SELECT 1 FROM link_codes WHERE code=?').get(code))break;}if(!code||this.db.prepare('SELECT 1 FROM link_codes WHERE code=?').get(code))throw Error('Unable to create link code');this.db.prepare('INSERT INTO link_codes VALUES (?, ?, ?)').run(code,id,expires);});
    return {code,expiresAt:expires};
  }
  resolveLinkCode(value) {if(typeof value!=='string'||!/^[A-Z2-9]{10}$/.test(value))return;return this.transaction(()=>{const row=this.db.prepare('SELECT profile_id,expires FROM link_codes WHERE code=?').get(value);this.db.prepare('DELETE FROM link_codes WHERE code=?').run(value);if(!row||row.expires<Date.now()||!validId(row.profile_id))return;return row.profile_id;});}
  async save(id,save) {return this.saveMany([{accountId:id,save}]);}
  async saveMany(entries) {
    if (!Array.isArray(entries) || entries.length<1 || entries.length>256) throw Error('Invalid profile batch');
    const ids=new Set();
    const clean=entries.map(e=>{
      if (!validId(e?.accountId) || ids.has(e.accountId)) throw Error('Invalid profile batch');
      ids.add(e.accountId); return {id:e.accountId,save:JSON.stringify(checkedPlayerSave(e.save))};
    });
    return this.transaction(()=>clean.map(e=>{
      const old=this.revision(e.id);
      if (old===undefined || !Number.isSafeInteger(old+1)) throw Error('Unknown or exhausted profile');
      this.db.prepare('UPDATE profiles SET revision=revision+1, save=? WHERE id=?').run(e.save,e.id);
      return {accountId:e.id,revision:old+1};
    }));
  }
  async backup(filename) {if(typeof this.db.backup==='function')return this.db.backup(filename);this.db.exec(`VACUUM INTO '${String(filename).replaceAll("'","''")}'`);}
  importLegacy(db,xam) {
    if (!db || db.format!=='wayfarer-local-profile-db' || db.version!==1 || !/^[0-9a-f]{64}$/.test(db.secret) || !db.profiles || Array.isArray(db.profiles)) throw Error('Invalid legacy database');
    const entries=Object.entries(db.profiles);
    if(entries.length>this.maxProfiles)throw Error('Too many legacy profiles');
    const clean=entries.map(([id,row])=>{
      if(!validId(id)||!row||!Number.isSafeInteger(row.revision)||row.revision<0)throw Error('Invalid legacy profile');
      return {id,revision:row.revision,save:row.save===null?null:JSON.stringify(checkedPlayerSave(row.save))};
    });
    const agent=xam===undefined?undefined:checkedXamSave(xam);
    this.transaction(()=>{
      if(this.count || this.db.prepare('SELECT 1 FROM agents').get())throw Error('Migration requires an empty destination');
      for(const row of clean)this.db.prepare('INSERT INTO profiles VALUES (?, ?, ?)').run(row.id,row.revision,row.save);
      this.db.prepare('UPDATE metadata SET value=? WHERE key=?').run(db.secret,'cookie_secret');
      if(agent)this.db.prepare('INSERT INTO agents VALUES (?, ?)').run('xam',JSON.stringify(agent));
    });
    this.secret=db.secret;if(agent)this.xam.value=agent;
  }
  close() {this.db.close();}
}
