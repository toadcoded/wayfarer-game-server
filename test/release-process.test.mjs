import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {DatabaseSync} from 'node:sqlite';
import WS from 'ws';
import {encodeHello,REALM_SUBPROTOCOL} from '../dist/realm-contract.js';

async function until(fn){const end=Date.now()+6000;while(!fn()){if(Date.now()>end)throw Error('Timed out');await new Promise(r=>setTimeout(r,20));}}
function launch(dir) {
  const child=spawn(process.execPath,['tools/server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,NODE_ENV:'development',PUBLIC_ORIGIN:'',TRUST_PROXY:'false',DATA_DIR:dir,PORT:'18763',SAVE_INTERVAL_MS:'100',XAM_ENABLED:'true'},stdio:['ignore','pipe','pipe']});
  child.logs='';child.stdout.on('data',data=>{child.logs+=data;});child.errors='';child.stderr.on('data',data=>{child.errors+=data;});return child;
}

test('actual entrypoint persists periodic saves across SIGKILL and flushes on SIGTERM',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'wayfarer-process-'));let child,ws;
  try {
    child=launch(dir);await until(()=>child.logs.includes('"event":"ready"')||child.exitCode!==null);
    assert.equal(child.exitCode,null,child.errors);
    const origin=JSON.parse(child.logs.trim().split('\n').find(l=>l.includes('"event":"ready"'))).origin;
    const response=await fetch(origin),cookie=response.headers.get('set-cookie').split(';')[0];
    const connect=async()=>{
      ws=new WS(origin.replace(/^http/,'ws')+'/socket',REALM_SUBPROTOCOL,{origin,headers:{Cookie:cookie}});
      ws.messages=[];ws.on('message',bytes=>ws.messages.push(JSON.parse(bytes.toString())));ws.on('error',()=>{});
      await once(ws,'open');ws.send(encodeHello());await until(()=>ws.messages.some(m=>m.kind==='game'));return ws.messages.find(m=>m.kind==='welcome').id;
    };
    const id=await connect();ws.send(JSON.stringify({kind:'action',sequence:0,action:'appearance',value:'elder'}));
    await until(()=>ws.messages.some(m=>m.kind==='game'&&m.players.some(p=>p.id===id&&p.skin==='elder')));
    const db=new DatabaseSync(path.join(dir,'realm.sqlite'),{readOnly:true});
    try {await until(()=>db.prepare('SELECT save FROM profiles WHERE save IS NOT NULL').all().some(row=>JSON.parse(row.save).gameplay.skin==='elder'));}finally{db.close();}
    let exited=once(child,'exit');child.kill('SIGKILL');await exited;ws.terminate();ws=undefined;
    child=launch(dir);await until(()=>child.logs.includes('"event":"ready"')||child.exitCode!==null);assert.equal(child.exitCode,null,child.errors);
    const restoredId=await connect();assert.equal(ws.messages.find(m=>m.kind==='game').players.find(p=>p.id===restoredId).skin,'elder');
    ws.send(JSON.stringify({kind:'action',sequence:0,action:'appearance',value:'traveler'}));
    await until(()=>ws.messages.some(m=>m.kind==='game'&&m.players.some(p=>p.id===restoredId&&p.skin==='traveler')));
    exited=once(child,'exit');child.kill('SIGTERM');const [code]=await exited;assert.equal(code,0,child.errors);assert.match(child.logs,/"event":"stopped"/);child=undefined;
    const saved=new DatabaseSync(path.join(dir,'realm.sqlite'),{readOnly:true});
    try {const rows=saved.prepare('SELECT save FROM profiles').all();assert.equal(rows.length,1);assert.equal(JSON.parse(rows[0].save).gameplay.skin,'traveler');assert.ok(saved.prepare('SELECT save FROM agents WHERE id=?').get('xam'));}finally{saved.close();}
  }finally{ws?.terminate();if(child&&child.exitCode===null){const exited=once(child,'exit');child.kill('SIGKILL');await exited;}await rm(dir,{recursive:true,force:true});}
});
