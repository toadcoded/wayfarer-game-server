import {ServerWalker,type PlayerSnapshot} from './movement.js';
import {NavigationWorld,type XZ} from './navigation.js';
/** Transport-neutral authority. Host binds connection identity; packets cannot select another player. */
export class WorldSession {
 private players=new Map<string,{walker:ServerWalker;packets:number}>();
 private failed=false;
 get status():'active'|'faulted'{return this.failed?'faulted':'active';}
 private requireActive():void{if(this.failed)throw new Error('Session faulted; replace it before continuing');}
 constructor(private nav:NavigationWorld,readonly capacity=32){if(!Number.isInteger(capacity)||capacity<1||capacity>256)throw new Error('Invalid capacity');}
 join(connectionId:string,spawn:XZ):PlayerSnapshot {
  this.requireActive();
  if(!connectionId||connectionId.length>128||this.players.has(connectionId)||this.players.size>=this.capacity)throw new Error('Join rejected');
  const walker=new ServerWalker(this.nav,spawn);this.players.set(connectionId,{walker,packets:0});return walker.snapshot();
 }
 receive(connectionId:string,message:string):boolean {
  if(this.failed)return false;
  const player=this.players.get(connectionId);if(!player||player.packets>=8)return false;player.packets++;
  try{return player.walker.receiveInput(message);}catch{return false;}
 }
 /** Compute a detached next session. No mutation of this session, even on failure. */
 stagedTick():WorldSession {
  this.requireActive();
  const candidate=new WorldSession(this.nav,this.capacity);
  for(const [id,p] of this.players)candidate.players.set(id,{walker:p.walker.stagedAdvance(),packets:0});
  return candidate;
 }
 /** Standalone session API retains fail-stop behavior. RealmRuntime uses stagedTick(). */
 tick():ReadonlyMap<string,PlayerSnapshot> {
  this.requireActive();
  try{const candidate=this.stagedTick();this.players=candidate.players;return this.committedState();}
  catch(error){this.failed=true;throw error;}
 }
 inspection(connectionId:string){return this.players.get(connectionId)?.walker.inspection();}
 /** Detached last-good state for fault diagnostics; never used to resume a faulted session. */
 committedState():ReadonlyMap<string,PlayerSnapshot>{return new Map([...this.players].map(([id,p])=>[id,p.walker.snapshot()]));}
 leave(connectionId:string):boolean{return this.players.delete(connectionId);}
 snapshot(connectionId:string):PlayerSnapshot|undefined{this.requireActive();return this.players.get(connectionId)?.walker.snapshot();}
}
