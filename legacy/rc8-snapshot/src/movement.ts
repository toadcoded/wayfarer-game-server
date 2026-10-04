import { NavigationWorld, type XZ } from './navigation.js';
import type { Point } from './world.js';

export interface MoveIntent { sequence:number; dx:number; dz:number }
export interface PlayerSnapshot { position:Point; tick:number; lastInputSequence:number; blocked:boolean }
export interface WalkerOptions { speed?:number; ticksPerSecond?:number; idleTimeoutTicks?:number }
function validate(intent:MoveIntent):void {
 if(!Number.isSafeInteger(intent.sequence)||intent.sequence<0||
  !Number.isFinite(intent.dx)||Math.abs(intent.dx)>1||!Number.isFinite(intent.dz)||Math.abs(intent.dz)>1)throw new Error('Invalid movement intent');
}
/** Client sends a direction and sequence only. No position, speed, elapsed time or player id. */
export function decodeMoveIntent(text:string):MoveIntent {
 if(typeof text!=='string'||text.length>256||new TextEncoder().encode(text).length>256)throw new Error('Movement message too large');
 const v:unknown=JSON.parse(text);
 if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Expected movement object');
 const o=v as Record<string,unknown>;
 if(Object.keys(o).length!==3||!['sequence','dx','dz'].every(k=>Object.hasOwn(o,k))||
  typeof o.sequence!=='number'||typeof o.dx!=='number'||typeof o.dz!=='number')throw new Error('Invalid movement fields');
 const intent={sequence:o.sequence,dx:o.dx,dz:o.dz};validate(intent);return intent;
}
export function encodeMoveIntent(intent:MoveIntent):string {validate(intent);return JSON.stringify({sequence:intent.sequence,dx:intent.dx,dz:intent.dz});}
/** Pure single movement step; the authoritative caller owns speed and dt. */
export function stepMovement(nav:NavigationWorld,position:Point,direction:XZ,speed:number,dtSeconds:number):{position:Point;blocked:boolean} {
 if(!Number.isFinite(speed)||speed<0||speed>30||!Number.isFinite(dtSeconds)||dtSeconds<=0||dtSeconds>.1||
  !Number.isFinite(direction.x)||!Number.isFinite(direction.z)||Math.abs(direction.x)>1||Math.abs(direction.z)>1)throw new Error('Invalid movement step');
 const length=Math.hypot(direction.x,direction.z),scale=speed*dtSeconds/Math.max(1,length);
 const dx=direction.x*scale,dz=direction.z*scale;
 const full=nav.traverse(position,{x:position.x+dx,z:position.z+dz});
 if(full.ok)return {position:full.position,blocked:false};
 // Keep the longer valid component. Do not accumulate two axis steps (which adds speed).
 const candidates=[{x:position.x+dx,z:position.z},{x:position.x,z:position.z+dz}]
  .sort((a,b)=>Math.hypot(b.x-position.x,b.z-position.z)-Math.hypot(a.x-position.x,a.z-position.z));
 for(const p of candidates){const result=nav.traverse(position,p);if(result.ok)return {position:result.position,blocked:true};}
 return {position:{...position},blocked:true};
}
/** Call advance() once per HOST simulation tick, never once per incoming packet. */
export class ServerWalker {
 private position:Point;
 private intent:MoveIntent={sequence:0,dx:0,dz:0};
 private tickNumber=0;
 private inputTick=0;
 private lastSequence=-1;
 private blocked=false;
 readonly options:Readonly<Required<WalkerOptions>>;
 constructor(private nav:NavigationWorld,spawn:XZ,opts:WalkerOptions={}){
  const speed=opts.speed??4,ticksPerSecond=opts.ticksPerSecond??20,idleTimeoutTicks=opts.idleTimeoutTicks??10;
  if(!Number.isFinite(speed)||speed<=0||speed>30||!Number.isInteger(ticksPerSecond)||ticksPerSecond<10||ticksPerSecond>120||
   !Number.isInteger(idleTimeoutTicks)||idleTimeoutTicks<1||idleTimeoutTicks>600)throw new Error('Invalid walker options');
  this.options=Object.freeze({speed,ticksPerSecond,idleTimeoutTicks});
  const c=nav.check(spawn);if(!c.ok)throw new Error(`Unwalkable spawn: ${c.reason}`);this.position=c.position;
 }
 receiveInput(text:string):boolean {
  const input=decodeMoveIntent(text);if(input.sequence<=this.lastSequence)return false;
  this.lastSequence=input.sequence;this.intent=input;this.inputTick=this.tickNumber;return true;
 }
 /** Compute a detached candidate. Navigation is read-only; no live walker changes. */
 stagedAdvance():ServerWalker {
  const candidate=Object.create(ServerWalker.prototype) as ServerWalker;
  Object.assign(candidate,this);candidate.position={...this.position};candidate.intent={...this.intent};
  candidate.advance();return candidate;
 }
 advance():PlayerSnapshot {
  const stale=this.tickNumber-this.inputTick>=this.options.idleTimeoutTicks;
  const result=stepMovement(this.nav,this.position,stale?{x:0,z:0}:{x:this.intent.dx,z:this.intent.dz},this.options.speed,1/this.options.ticksPerSecond);
  if(![result.position.x,result.position.y,result.position.z].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e6)||!Number.isSafeInteger(this.tickNumber+1))throw new Error('Invalid candidate state');
  this.position={...result.position};this.blocked=result.blocked;this.tickNumber++;return this.snapshot();
 }
 /** Detached deterministic diagnostic state, including held input and its age. */
 inspection(){return {state:this.snapshot(),intent:{...this.intent},inputTick:this.inputTick,options:{...this.options}};}
 snapshot():PlayerSnapshot {return {position:{...this.position},tick:this.tickNumber,lastInputSequence:this.lastSequence,blocked:this.blocked};}
}
