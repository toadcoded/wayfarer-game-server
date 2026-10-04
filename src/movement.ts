import { NavigationWorld, type XZ } from './navigation.js';
import type { Point } from './world.js';

export type TravelMode='walk'|'jog'|'run';
export const TRAVEL_SPEEDS=Object.freeze({walk:2,jog:4,run:6.25});
export const isTravelMode=(value:unknown):value is TravelMode=>value==='walk'||value==='jog'||value==='run';
export interface MoveIntent { sequence:number; dx:number; dz:number; mode?:TravelMode }
export interface PlayerSnapshot { position:Point; tick:number; lastInputSequence:number; blocked:boolean; travelMode:TravelMode; runEnergy:number }
export interface WalkerOptions { speed?:number; ticksPerSecond?:number; idleTimeoutTicks?:number }
function validate(intent:MoveIntent):void {
 if(intent.mode!==undefined&&!isTravelMode(intent.mode))throw new Error('Invalid travel mode');
 if(!Number.isSafeInteger(intent.sequence)||intent.sequence<0||
  !Number.isFinite(intent.dx)||Math.abs(intent.dx)>1||!Number.isFinite(intent.dz)||Math.abs(intent.dz)>1)throw new Error('Invalid movement intent');
}
/** Client sends a direction and sequence only. No position, speed, elapsed time or player id. */
export function decodeMoveIntent(text:string):MoveIntent {
 if(typeof text!=='string'||text.length>256||new TextEncoder().encode(text).length>256)throw new Error('Movement message too large');
 const v:unknown=JSON.parse(text);
 if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Expected movement object');
 const o=v as Record<string,unknown>;
 if(Object.keys(o).length!==(Object.hasOwn(o,'mode')?4:3)||!['sequence','dx','dz'].every(k=>Object.hasOwn(o,k))||
  typeof o.sequence!=='number'||typeof o.dx!=='number'||typeof o.dz!=='number')throw new Error('Invalid movement fields');
 const intent:MoveIntent={sequence:o.sequence,dx:o.dx,dz:o.dz};if(Object.hasOwn(o,'mode')){if(!isTravelMode(o.mode))throw new Error('Invalid travel mode');intent.mode=o.mode;}validate(intent);return intent;
}
export function encodeMoveIntent(intent:MoveIntent):string {validate(intent);return JSON.stringify({sequence:intent.sequence,dx:intent.dx,dz:intent.dz,...(intent.mode!==undefined?{mode:intent.mode}:{})});}
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
 private energy=100000;private exhausted=false;private currentSpeed=0;private travelMode:TravelMode='jog';
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
  const direction=stale?{x:0,z:0}:{x:this.intent.dx,z:this.intent.dz},dt=1/this.options.ticksPerSecond;
  const moving=Math.hypot(direction.x,direction.z)>0,requested=this.intent.mode??'jog';
  if(requested!=='run'&&this.energy>=20000)this.exhausted=false;
  this.travelMode=requested==='run'&&(this.exhausted||this.energy<=0)?'jog':requested;
  const target=moving?Math.min(30,TRAVEL_SPEEDS[this.travelMode]*this.options.speed/4):0;
  // Legacy three-field rehearsal inputs retain their historical constant jog step.
  // New controls accelerate under host ticks; release/timeout stops without drift.
  this.currentSpeed=!moving?0:this.intent.mode===undefined?target:Math.max(0,this.currentSpeed+Math.max(-16*dt,Math.min(10*dt,target-this.currentSpeed)));
  const result=stepMovement(this.nav,this.position,direction,this.currentSpeed,dt);
  const travelled=Math.hypot(result.position.x-this.position.x,result.position.z-this.position.z)>1e-8;
  if(travelled&&this.travelMode==='run'){this.energy=Math.max(0,this.energy-6000*dt);if(this.energy===0)this.exhausted=true;}
  else this.energy=Math.min(100000,this.energy+(moving?(this.travelMode==='walk'?3000:1000):5000)*dt);

  if(![result.position.x,result.position.y,result.position.z].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e6)||!Number.isSafeInteger(this.tickNumber+1))throw new Error('Invalid candidate state');
  this.position={...result.position};this.blocked=result.blocked;this.tickNumber++;return this.snapshot();
 }
 /** Detached deterministic diagnostic state, including held input and its age. */
 inspection(){return {state:this.snapshot(),intent:{...this.intent},inputTick:this.inputTick,options:{...this.options},currentSpeed:this.currentSpeed,energy:this.energy,exhausted:this.exhausted};}
 snapshot():PlayerSnapshot {return {position:{...this.position},tick:this.tickNumber,lastInputSequence:this.lastSequence,blocked:this.blocked,travelMode:this.travelMode,runEnergy:this.energy/1000};}
}
