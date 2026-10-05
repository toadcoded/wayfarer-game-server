import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {SqliteRealmStore,acquireRealmLease} from './sqlite-store.mjs';
import {createLocalRealmServer} from './realm-server.mjs';

export function serverConfig(env=process.env) {
  const production=env.NODE_ENV==='production';
  const origin=env.PUBLIC_ORIGIN||false;
  if (production&&!origin) throw Error('Production requires PUBLIC_ORIGIN=https://your-domain');
  if (origin) {const u=new URL(origin);if(u.protocol!=='https:'||u.origin!==origin)throw Error('PUBLIC_ORIGIN must be an exact HTTPS origin without a trailing slash');}
  const number=(key,fallback,min,max)=>{
    const raw=env[key]??String(fallback);
    if(!/^\d+$/.test(raw))throw Error('Invalid '+key);
    const value=Number(raw);if(!Number.isInteger(value)||value<min||value>max)throw Error('Invalid '+key);return value;
  };
  const boolean=(key,fallback)=>{
    const raw=env[key];if(raw===undefined)return fallback;
    if(raw!=='true'&&raw!=='false')throw Error(key+' must be true or false');return raw==='true';
  };
  return {port:number('PORT',8081,1,65535),capacity:number('REALM_CAPACITY',16,1,32),
    profileFlushMs:number('SAVE_INTERVAL_MS',1000,100,60000),
    maxProfiles:number('MAX_PROFILES',10000,1,10000),
    guestRegistrationsPerMinute:number('GUEST_REGISTRATIONS_PER_MINUTE',5,1,100),
    bindHost:origin?'0.0.0.0':'127.0.0.1',publicOrigin:origin,
    trustProxy:boolean('TRUST_PROXY',false),xam:boolean('XAM_ENABLED',true),
    dataDir:path.resolve(env.DATA_DIR||'runtime')};
}

export async function startServer(env=process.env) {
  const cfg=serverConfig(env);
  const release=await acquireRealmLease(path.join(cfg.dataDir,'realm.lease.sqlite'));
  let store,host;
  try {
    store=await SqliteRealmStore.open(path.join(cfg.dataDir,'realm.sqlite'),{secure:!!cfg.publicOrigin,maxProfiles:cfg.maxProfiles});
    host=await createLocalRealmServer({...cfg,profileStoreOverride:store,xamStoreOverride:cfg.xam?store.xam:undefined});
  } catch(error) {store?.close();release();throw error;}
  let closing;
  return {...host,host,store,close:()=>closing??=(async()=>{try{await host.close();}finally{store.close();release();}})()};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  process.umask(0o077);
  const app=await startServer();
  const version=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
  const log=(event,fields={})=>console.log(JSON.stringify({time:new Date().toISOString(),event,version,...fields}));
  log('ready',{origin:app.origin,capacity:serverConfig().capacity,persistence:'sqlite',xam:!!app.xam});
  let shuttingDown=false;
  const shutdown=async(exitCode=0)=>{
    if(shuttingDown)return;shuttingDown=true;clearInterval(watch);
    log('stopping');const timeout=setTimeout(()=>process.exit(1),15000);timeout.unref();
    try{await app.close();log('stopped');process.exit(exitCode);}catch(error){log('shutdown_failed',{message:error.message});process.exit(1);}
  };
  const watch=setInterval(()=>{if(app.host.faulted)void shutdown(1);},1000);watch.unref();
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>void shutdown());
  process.once('uncaughtException',error=>{log('fatal',{message:error.message});void shutdown(1);});
  process.once('unhandledRejection',error=>{log('fatal',{message:String(error)});void shutdown(1);});
}
