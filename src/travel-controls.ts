/** Screen-space intent transformed into the current camera plane, normalized. */
export function cameraDirection(right:number,forward:number,alpha:number):{dx:number;dz:number}{
 if(![right,forward,alpha].every(Number.isFinite)||Math.abs(right)>1||Math.abs(forward)>1)throw new Error('Invalid camera direction');
 const length=Math.max(1,Math.hypot(right,forward));
 return {dx:(-Math.sin(alpha)*right-Math.cos(alpha)*forward)/length,dz:(Math.cos(alpha)*right-Math.sin(alpha)*forward)/length};
}
export function dampAngle(current:number,target:number,dt:number):number{
 if(![current,target,dt].every(Number.isFinite)||dt<0)throw new Error('Invalid turning sample');
 const delta=Math.atan2(Math.sin(target-current),Math.cos(target-current));return current+delta*(1-Math.exp(-12*Math.min(dt,.1)));
}
