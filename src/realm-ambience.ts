import type {Point} from './world.js';
export const DETAIL_KINDS=['birdhouse','mushroom','flower','bench','skeleton','barrel','keg','bottle','fireworks','balloon','toy'] as const;
export type DetailKind=typeof DETAIL_KINDS[number];
export type AmbientKind='conversation'|'sneeze'|'toy'|'lightning'|'fireworks';
export const AMBIENT_LINES=Object.freeze(['Halden: That little mushroom was blue yesterday.','Woodcutter: The birds keep hiding acorns in my boots.','Child: My wind-up beetle thinks it is a dragon.','Traveler: Someone tied a balloon to the oldest fence post.']);
function hash(seed:number,n:number){let x=(seed^(n*0x9e3779b9))>>>0;x^=x>>>16;x=Math.imul(x,0x85ebca6b);x^=x>>>13;return (x>>>0)/4294967296;}
/** Decorative descriptors are seeded; none are colliders, loot or interactable resources. */
export function realmDetails(seed:number,anchors:readonly Point[]){return anchors.flatMap((p,a)=>DETAIL_KINDS.map((kind,i)=>({id:`detail:${a}:${kind}`,kind,position:{x:p.x+(i%4-1.5)*2.2+(hash(seed,a*20+i)-.5)*.3,y:p.y,z:p.z+(i<6?-1:1)*(4+Math.floor(i/4)*1.3)},phase:hash(seed,a*20+i+100)*Math.PI*2})));}
export function ambientFrame(seed:number,now:number,paused=false){
 if(!Number.isFinite(now)||now<0)throw new Error('Invalid ambient time');
 const seconds=paused?0:now/1000,slot=Math.floor(seconds/14),offset=seconds%14;
 const kinds:readonly AmbientKind[]=['conversation','toy','sneeze','conversation','lightning','fireworks'];
 const kind=kinds[slot%kinds.length]!,duration=kind==='lightning'?1.2:kind==='sneeze'?1.6:kind==='fireworks'?3:6;
 const start=1+hash(seed,slot)*2,active=!paused&&offset>=start&&offset<start+duration;
 return {seconds,night:true,event:active?{id:`ambient:${slot}`,kind,progress:(offset-start)/duration,line:AMBIENT_LINES[Math.floor(hash(seed,slot+50)*AMBIENT_LINES.length)]!}:undefined};
}
