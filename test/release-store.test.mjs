import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {SqliteRealmStore,acquireRealmLease} from '../tools/sqlite-store.mjs';
import {freshPersistentPlayerState} from '../dist/game-actions.js';
import {checkedPlayerSave} from '../dist/persistence.js';
import {serverConfig} from '../tools/server.mjs';
import {RequestLimits} from '../tools/request-limits.mjs';
import {restoreRealm} from '../tools/restore.mjs';
const save=(x=1)=>checkedPlayerSave({version:1,position:{x,z:0},gameplay:freshPersistentPlayerState()});
const temp=()=>mkdtemp(path.join(os.tmpdir(),'wayfarer-v1-'));

test('production configuration rejects missing HTTPS origin and invalid bounds',()=>{
  for(const env of [{NODE_ENV:'production'},{PUBLIC_ORIGIN:'http://example.com'},{PUBLIC_ORIGIN:'https://example.com/'},{PORT:'0'},{REALM_CAPACITY:'33'},{SAVE_INTERVAL_MS:'NaN'},{TRUST_PROXY:'yes'}]) assert.throws(()=>serverConfig(env));
  const cfg=serverConfig({NODE_ENV:'production',PUBLIC_ORIGIN:'https://play.example.com'});
  assert.equal(cfg.bindHost,'0.0.0.0');assert.equal(cfg.trustProxy,false);assert.equal(cfg.capacity,16);
});

test('request limiter bounds memory, rejects excess and expires old windows',()=>{
  let now=0;const gate=new RequestLimits({limit:2,maxKeys:2,windowMs:100,now:()=>now});
  assert.equal(gate.allow('a'),true);assert.equal(gate.allow('a'),true);assert.equal(gate.allow('a'),false);
  assert.equal(gate.allow('b'),true);assert.equal(gate.allow('c'),false);assert.equal(gate.keys.size,2);
  now=100;assert.equal(gate.allow('c'),true);assert.equal(gate.keys.size,1);
});

test('SQLite transactions roll back whole batches and cookies survive reopen',async()=>{
  const dir=await temp();let store;
  try {
    const file=path.join(dir,'realm.sqlite');store=await SqliteRealmStore.open(file,{secure:true,maxProfiles:2});
    const a=await store.ensureSession(),b=await store.ensureSession();
    assert.match(a.setCookie,/HttpOnly/);assert.match(a.setCookie,/; Secure$/);
    const cookie=a.setCookie.split(';')[0];assert.equal(store.resolveCookie(cookie),a.accountId);
    assert.equal(store.resolveCookie(cookie.slice(0,-1)+'z'),undefined);
    await store.save(a.accountId,save());
    await assert.rejects(store.saveMany([{accountId:a.accountId,save:save(2)},{accountId:'a_'+'0'.repeat(32),save:save(3)}]));
    assert.equal(store.load(a.accountId).position.x,1);assert.equal(store.revision(a.accountId),1);
    await assert.rejects(store.ensureSession());assert.equal((await store.ensureSession(cookie)).accountId,a.accountId);
    await store.backup(path.join(dir,'backup.sqlite'));store.close();store=undefined;
    store=await SqliteRealmStore.open(file,{secure:true,maxProfiles:2});assert.equal(store.resolveCookie(cookie),a.accountId);
    assert.equal(store.load(a.accountId).position.x,1);assert.equal(store.count,2);
    store.close();store=await SqliteRealmStore.open(path.join(dir,'backup.sqlite'),{maxProfiles:2});
    assert.equal(store.resolveCookie(cookie),a.accountId);assert.equal(store.load(a.accountId).position.x,1);assert.equal(store.revision(b.accountId),0);
 }finally{store?.close();await rm(dir,{recursive:true,force:true});}
});

test('cross-device link codes are strict, single-use and expire server-side',async()=>{
  const dir=await temp();let store;
  try {
    store=await SqliteRealmStore.open(path.join(dir,'realm.sqlite'));
    const session=await store.ensureSession(),issued=store.createLinkCode(session.accountId);
    assert.match(issued.code,/^[A-HJ-NP-Z2-9]{10}$/);assert.ok(issued.expiresAt>Date.now());
    assert.equal(store.resolveLinkCode(issued.code),session.accountId);
    assert.equal(store.resolveLinkCode(issued.code),undefined);
    for(const value of ['', 'short', 'abcdefghij', 'A'.repeat(11), 'A\n'.repeat(5)])assert.equal(store.resolveLinkCode(value),undefined);
    const expired=store.createLinkCode(session.accountId);store.db.prepare('UPDATE link_codes SET expires=? WHERE code=?').run(Date.now()-1,expired.code);assert.equal(store.resolveLinkCode(expired.code),undefined);
  } finally {store?.close();await rm(dir,{recursive:true,force:true});}
});

test('realm lease denies competing authorities and is released by process death',async()=>{
  const dir=await temp(),file=path.join(dir,'lease.sqlite');let child;
  try {
    const release=await acquireRealmLease(file);await assert.rejects(acquireRealmLease(file),/Another realm/);release();
    const code=`import {acquireRealmLease} from './tools/sqlite-store.mjs'; await acquireRealmLease(process.argv[1]); console.log('locked'); setInterval(()=>{},1000);`;
    child=spawn(process.execPath,['--input-type=module','-e',code,file],{cwd:new URL('../',import.meta.url),stdio:['ignore','pipe','pipe']});
    await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',()=>reject(Error('Child exited before acquiring lease')));});
    await assert.rejects(acquireRealmLease(file),/Another realm/);
    const exited=once(child,'exit');child.kill('SIGKILL');await exited;child=undefined;
    const releaseAfterCrash=await acquireRealmLease(file);releaseAfterCrash();
  }finally{child?.kill('SIGKILL');await rm(dir,{recursive:true,force:true});}
});

test('legacy migration preserves signed identities and rejects nonempty destinations',async()=>{
  const dir=await temp();let store;
  try {store=await SqliteRealmStore.open(path.join(dir,'realm.sqlite'));
    const id='a_'+'1'.repeat(32),db={format:'wayfarer-local-profile-db',version:1,secret:'2'.repeat(64),profiles:{[id]:{revision:7,save:save(5)}}};
    store.importLegacy(db);assert.equal(store.revision(id),7);assert.equal(store.load(id).position.x,5);
    assert.equal(store.resolveCookie('wf_profile='+id+'.'+store.sign(id)),id);
    assert.throws(()=>store.importLegacy(db),/empty destination/);
  }finally{store?.close();await rm(dir,{recursive:true,force:true});}
});

test('restore validates a backup, refuses a live realm lease and preserves the replaced database',async()=>{
  const dir=await temp();let store,release;
  try {
    const file=path.join(dir,'realm.sqlite');store=await SqliteRealmStore.open(file);
    const session=await store.ensureSession();await store.save(session.accountId,save(2));
    const snapshot=path.join(dir,'snapshot.sqlite');await store.backup(snapshot);await store.save(session.accountId,save(9));store.close();store=undefined;
    const bytes=await readFile(snapshot);release=await acquireRealmLease(path.join(dir,'realm.lease.sqlite'));
    await assert.rejects(restoreRealm(bytes,dir),/Another realm/);release();release=undefined;
    await assert.rejects(restoreRealm(Buffer.from('bad backup'),dir),/Invalid/);
    const result=await restoreRealm(bytes,dir);
    store=await SqliteRealmStore.open(file);assert.equal(store.load(session.accountId).position.x,2);store.close();
    store=await SqliteRealmStore.open(result.previous);assert.equal(store.load(session.accountId).position.x,9);
  }finally{release?.();store?.close();await rm(dir,{recursive:true,force:true});}
});
