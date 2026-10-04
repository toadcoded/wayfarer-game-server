import type {Point} from './world.js';
export interface CharacterPose {phase:number;stride:number;lean:number;cloth:number;facing:number}
/** Bounded presentation simulation. Never feeds back into authoritative position or collision. */
export class CharacterMotion {
 private previous:Point|undefined;private clock:number|undefined;
 private phase=0;private stride=0;private lean=0;private velocity=0;private cloth=0;private clothVelocity=0;private facing=1;
 reset():void {this.previous=undefined;this.clock=undefined;this.phase=0;this.stride=0;this.lean=0;this.velocity=0;this.cloth=0;this.clothVelocity=0;this.facing=1;}
 sample(position:Point,now:number,reduced=false):CharacterPose {
  if(![position.x,position.y,position.z,now].every(Number.isFinite)||now<0)throw new RangeError('Invalid character sample');
  if(this.clock!==undefined&&now<this.clock)throw new RangeError('Character time moved backwards');
  const elapsed=this.clock===undefined?0:(now-this.clock)/1000;
  const dx=this.previous?position.x-this.previous.x:0,dz=this.previous?position.z-this.previous.z:0,distance=Math.hypot(dx,dz);
  if(elapsed>.25||distance>4){this.reset();}
  else if(elapsed>0){
   const speed=Math.min(8,distance/elapsed),target=Math.min(1,speed/4);
   this.stride+=(target-this.stride)*(1-Math.exp(-16*elapsed));
   if(distance>.001){this.phase=(this.phase+distance*3.8)%(2*Math.PI);if(Math.abs(dx-dz)>.001)this.facing=dx-dz<0?-1:1;}
   // Fixed-size substeps keep both damped springs stable across irregular render intervals.
   const steps=Math.ceil(elapsed/(1/120)),dt=elapsed/steps;
   const targetLean=Math.max(-.12,Math.min(.12,(dx-dz)/elapsed*.015));
   for(let i=0;i<steps;i++){
    this.velocity+=((targetLean-this.lean)*100-this.velocity*18)*dt;this.lean+=this.velocity*dt;
    const targetCloth=-this.lean*1.5+Math.sin(this.phase)*this.stride*.07;
    this.clothVelocity+=((targetCloth-this.cloth)*70-this.clothVelocity*12)*dt;this.cloth+=this.clothVelocity*dt;
   }
   this.lean=Math.max(-.2,Math.min(.2,this.lean));this.cloth=Math.max(-.3,Math.min(.3,this.cloth));
  }
  this.previous={...position};this.clock=now;
  return {phase:this.phase,stride:reduced?0:this.stride,lean:reduced?0:this.lean,cloth:reduced?0:this.cloth,facing:this.facing};
 }
}
/** Remove the supplied assets' saturated magenta matte only at rendering time. */
export function keyMagenta(data:Uint8ClampedArray):void {
 if(data.length%4)throw new Error('Expected RGBA pixels');
 for(let i=0;i<data.length;i+=4)if(data[i]!>200&&data[i+1]!<70&&data[i+2]!>200)data[i+3]=0;
}
export function animationFrame(durations:readonly number[],elapsedMs:number):number {
 if(!durations.length||durations.some(d=>!Number.isFinite(d)||d<=0)||!Number.isFinite(elapsedMs)||elapsedMs<0)throw new Error('Invalid animation timing');
 let time=elapsedMs%durations.reduce((a,b)=>a+b,0);
 for(let i=0;i<durations.length;i++){if(time<durations[i]!)return i;time-=durations[i]!;}return 0;
}
