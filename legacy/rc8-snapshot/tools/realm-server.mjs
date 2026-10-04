import {ReplayJournal} from './replay-journal.mjs';
import {LocalProfileStore} from './profile-store.mjs';
import {staticPayload} from './static-compression.mjs';
import {REALM_SUBPROTOCOL,decodeHello,encodeWelcome,CompatibilityError} from '../dist/realm-contract.js';
import http from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import WebSocket,{WebSocketServer} from 'ws';
import {RealmRuntime} from '../dist/realm-runtime.js';
import {createRealmScene} from '../dist/realm-scene.js';
import {encodeRealmSnapshot} from '../dist/replication.js';
import {SocketFlowGate} from '../dist/transport-guard.js';
function realmPosition(scene){const p=scene.navigation.check(scene.plan.goal??scene.plan.start);if(!p.ok)throw new Error('Beacon needs a walkable landing');return p.position;}
const root=fileURLToPath(new URL('../',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.gif':'image/gif','.json':'application/json','.css':'text/css; charset=utf-8'};
/** Loopback-only transport rehearsal. Optional local durable profiles remain server-owned. */
export async function createLocalRealmServer({port=0,capacity=8,heartbeatMs=15000,scene=createRealmScene(),autoTick=true,handshakeMs=5000,recordReplay=false,profilePath=false,profileFlushMs=1000}={}){
 if(!Number.isInteger(port)||port<0||port>65535||!Number.isInteger(heartbeatMs)||heartbeatMs<50||!Number.isInteger(handshakeMs)||handshakeMs<50||handshakeMs>30000||!Number.isInteger(profileFlushMs)||profileFlushMs<100||profileFlushMs>60000)throw new Error('Invalid host options');
 const profileStore=profilePath?await LocalProfileStore.open(profilePath):undefined;
 const realm=new RealmRuntime(scene.navigation,{capacity,visibilityRadius:256,beacon:realmPosition(scene),camp:scene.plan.start});
 const journal=recordReplay?new ReplayJournal(realm,{capacity,visibilityRadius:256,beacon:realmPosition(scene),camp:scene.plan.start}):undefined;
 const gate=new SocketFlowGate(),peers=new Map(),activeAccounts=new Map(),savingAccounts=new Set();
 let stopped=false,failed=false,persistenceFailed=false,origin='',last=performance.now(),broadcastElapsed=0,persistElapsed=0,timer,pendingSaves=0,persistTask=Promise.resolve();
 function startTicking(){if(!autoTick||timer!==undefined||stopped||failed)return;last=performance.now();timer=setInterval(()=>{const now=performance.now();advance(now-last);last=now;},25);}
 function stopIfEmpty(){if(realm.size===0){clearInterval(timer);timer=undefined;}}
 const counters={received:0,accepted:0,rejected:0};
 const server=http.createServer(async(req,res)=>{
  if(req.headers.host!==new URL(origin).host){res.writeHead(403);res.end();return;}
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  if(req.url==='/health'){const status={ready:!stopped&&!failed,mode:'loopback-development',players:realm.size,tick:realm.tick,ticking:timer!==undefined,persistence:profileStore?'local-durable':'disabled',xam:realm.xamHealth};res.writeHead(status.ready?200:503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:JSON.stringify(status));return;}
  if(stopped||failed){res.writeHead(503,{'Cache-Control':'no-store'});res.end();return;}
  let identity;try{identity=profileStore?await profileStore.ensureSession(req.headers.cookie):undefined;}catch{persistenceFailed=true;fault();res.writeHead(503,{'Cache-Control':'no-store'});res.end();return;}
  const withIdentity=headers=>identity?.setCookie?{...headers,'Set-Cookie':identity.setCookie}:headers;
  let relative;
  try{
   if(!req.url?.startsWith('/')||req.url.startsWith('//'))throw new Error('Bad URL');
   const u=new URL(req.url,origin);relative=u.pathname==='/'?'preview/realm.html':u.pathname.slice(1);
   if(!(relative.startsWith('dist/')||relative.startsWith('preview/'))||relative.includes('..')||relative.includes('%')||relative.includes('\\'))throw new Error('Not a public asset');
  }catch{res.writeHead(400);res.end();return;}
  try{
   let data=await readFile(path.join(root,relative));
   if(profileStore&&relative==='preview/realm.html')data=Buffer.from(data.toString('utf8').replace('Session progress · resets on disconnect','Local profile · saved on disconnect'));
   const type=mime[path.extname(relative)]??'application/octet-stream';const payload=await staticPayload(data,type,req.headers['accept-encoding']);
   res.writeHead(200,withIdentity({...payload.headers,'Content-Type':type,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store','Content-Security-Policy':`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' ${origin.replace('http:','ws:')}; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`}));
   res.end(req.method==='HEAD'?undefined:payload.bytes);
  }catch{res.writeHead(404);res.end();}
 });
 server.requestTimeout=10000;server.headersTimeout=10000;
 server.on('clientError',(_error,socket)=>{socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');});
 const wss=new WebSocketServer({noServer:true,maxPayload:256,perMessageDeflate:false,handleProtocols:protocols=>protocols.has(REALM_SUBPROTOCOL)?REALM_SUBPROTOCOL:false});
 function persist(entries){if(!profileStore||persistenceFailed||!entries.length)return Promise.resolve();pendingSaves++;persistTask=persistTask.then(()=>profileStore.saveMany(entries)).catch(()=>{persistenceFailed=true;fault();}).finally(()=>{pendingSaves--;});return persistTask;}
 function captureProfiles(){if(!profileStore||persistenceFailed||realm.status!=='active')return [];const out=[];for(const p of peers.values()){if(!p.joined||!p.accountId)continue;const save=realm.exportPlayer(p.connection);if(save)out.push({accountId:p.accountId,save});}return out;}
 function remove(ws){const p=peers.get(ws);if(p){clearTimeout(p.deadline);if(p.joined&&p.accountId&&!persistenceFailed&&realm.status==='active'){const save=realm.exportPlayer(p.connection);if(save){savingAccounts.add(p.accountId);persist([{accountId:p.accountId,save}]).finally(()=>savingAccounts.delete(p.accountId));}}peers.delete(ws);if(p.accountId&&activeAccounts.get(p.accountId)===ws)activeAccounts.delete(p.accountId);realm.leave(p.connection);journal?.leave(p.connection,realm);stopIfEmpty();}}
 function reject(ws,reason){remove(ws);ws.close(1008,reason);const timer=setTimeout(()=>ws.terminate(),1000);timer.unref();ws.once('close',()=>clearTimeout(timer));}
 function drop(ws){remove(ws);ws.terminate();}
 function send(ws,text,priority='state'){
  if(ws.readyState!==WebSocket.OPEN)return false;
  if(gate.decide(ws.bufferedAmount,Buffer.byteLength(text),priority)==='close'){drop(ws);return false;}
  try{ws.send(text,error=>{if(error)drop(ws);});return true;}catch{drop(ws);return false;}
 }
 function fault(){journal?.stop('fault');failed=true;for(const ws of [...peers.keys()])drop(ws);}
 server.on('upgrade',(req,socket,head)=>{
  socket.on('error',()=>{});
  if(stopped||failed||pendingSaves>=capacity||req.url!=='/socket'||req.headers.host!==new URL(origin).host||req.headers.origin!==origin||wss.clients.size>=capacity){socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');return;}
  const offered=(req.headers['sec-websocket-protocol']??'').split(',').map(p=>p.trim());
  if(!offered.includes(REALM_SUBPROTOCOL)){socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');return;}
  const accountId=profileStore?.resolveCookie(req.headers.cookie);if(profileStore&&!accountId){socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');return;}
  if(accountId&&(activeAccounts.has(accountId)||savingAccounts.has(accountId))){socket.end('HTTP/1.1 409 Conflict\r\nConnection: close\r\n\r\n');return;}
  wss.handleUpgrade(req,socket,head,ws=>{ws.__wayfarerAccountId=accountId;if(accountId)activeAccounts.set(accountId,ws);wss.emit('connection',ws);});
 });
 wss.on('connection',ws=>{
  ws.on('error',()=>remove(ws));ws.on('close',()=>remove(ws));
  const connection=randomUUID(),accountId=ws.__wayfarerAccountId;
  const peer={connection,accountId,joined:false,alive:true,windowStart:performance.now(),count:0,
   deadline:setTimeout(()=>reject(ws,'handshake_timeout'),handshakeMs)};
  peer.deadline.unref();peers.set(ws,peer);
  ws.on('pong',()=>{peer.alive=true;});
  ws.on('message',(data,binary)=>{
   if(!peers.has(ws)||failed)return;
   const now=performance.now();if(now-peer.windowStart>=1000){peer.windowStart=now;peer.count=0;}
   if(binary||++peer.count>60){drop(ws);return;}
   if(!peer.joined){
    try{decodeHello(data.toString());}catch(error){reject(ws,error instanceof CompatibilityError?error.code:'invalid_handshake');return;}
    let joined,restore=accountId?profileStore?.load(accountId):undefined,spawn=restore?.position??scene.plan.start;
    if(restore&&!scene.navigation.check(spawn).ok){restore={...restore,position:{x:scene.plan.start.x,z:scene.plan.start.z}};spawn=restore.position;}
    try{joined=realm.join(connection,spawn,restore);}catch{drop(ws);return;}
    journal?.join(connection,spawn,realm,restore);peer.joined=true;clearTimeout(peer.deadline);startTicking();
    send(ws,encodeWelcome(joined.id),'critical');
    try{const snapshot=realm.snapshotFor(connection);if(snapshot){send(ws,encodeRealmSnapshot(snapshot));send(ws,JSON.stringify(realm.gameStateFor(connection)));}}catch{fault();}
    return;
   }
   // Both command types inherit the same frame, rate and identity boundaries.
   const text=data.toString();
   counters.received++;if(realm.receive(connection,text)){counters.accepted++;journal?.input(connection,text,realm);}else counters.rejected++;
  });
 });
 function advance(elapsedMs){
  if(stopped||failed)return;
  try{
   realm.advance(elapsedMs);journal?.advance(elapsedMs,realm);const accepted=Math.min(elapsedMs,200);broadcastElapsed+=accepted;persistElapsed+=accepted;
   if(profileStore&&persistElapsed>=profileFlushMs){persistElapsed=0;if(pendingSaves===0)persist(captureProfiles());}
   if(broadcastElapsed>=100){broadcastElapsed=0;for(const [ws,p] of [...peers]){if(!p.joined)continue;const snapshot=realm.snapshotFor(p.connection);if(snapshot){send(ws,encodeRealmSnapshot(snapshot));send(ws,JSON.stringify(realm.gameStateFor(p.connection)));}}}
  }catch{fault();}
 }
 function heartbeat(){for(const [ws,p] of [...peers]){if(!p.alive){drop(ws);continue;}p.alive=false;try{ws.ping();}catch{drop(ws);}}}
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 origin=`http://127.0.0.1:${server.address().port}`;
 const heart=setInterval(heartbeat,heartbeatMs);heart.unref();
 return {origin,realm,scene,advance,heartbeat,requestXamSkill:skill=>realm.requestXamSkill(skill),exportReplay:()=>journal?.export(),get ticking(){return timer!==undefined;},get metrics(){return {...counters};},get connections(){return peers.size;},get faulted(){return failed;},get persistence(){return {enabled:!!profileStore,healthy:!persistenceFailed,count:profileStore?.count??0};},
  async close(){if(stopped)return;stopped=true;clearInterval(timer);clearInterval(heart);for(const ws of [...peers.keys()])drop(ws);await persistTask;await new Promise(resolve=>wss.close(resolve));await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});if(persistenceFailed)throw new Error('Profile persistence failed');}
 };
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const host=await createLocalRealmServer({port:Number(process.env.PORT??8081),recordReplay:!!process.env.REPLAY_OUT,profilePath:process.env.PROFILE_DB||false});
 console.log(`Wayfarer v0.8 candidate local realm: ${host.origin}`);
 console.log(process.env.PROFILE_DB?'Local signed-cookie profiles enabled. Loopback rehearsal only; not Internet authentication.':'Open two tabs at that exact address. Set PROFILE_DB to enable local durable profiles.');
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{host.close().then(async()=>{if(process.env.REPLAY_OUT)await writeFile(process.env.REPLAY_OUT,JSON.stringify(host.exportReplay())+'\n',{flag:'wx'});process.exit(0);}).catch(error=>{console.error(error.message);process.exit(1);});});
}
