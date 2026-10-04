import type {Point} from './world.js';
import type {ItemId} from './inventory.js';
export const WEAPONS=Object.freeze({unarmed:Object.freeze({damage:4,range:3,cooldown:16}),reed_blade:Object.freeze({damage:7,range:3,cooldown:12}),ash_staff:Object.freeze({damage:9,range:8,cooldown:24}),granite_maul:Object.freeze({damage:16,range:3,cooldown:32})});
export interface Fighter {hp:number;attackReady:number;guardReady:number;guardUntil:number;recoverAt:number;wins:number;contributed:boolean}
export interface Encounter {hp:number;strikeAt:number;respawnAt:number;round:number}
export const freshFighter=(maxHealth=40):Fighter=>({hp:maxHealth,attackReady:0,guardReady:0,guardUntil:0,recoverAt:0,wins:0,contributed:false});
export const freshEncounter=():Encounter=>({hp:80,strikeAt:0,respawnAt:0,round:1});
export const distance=(a:Point|undefined,b:Point)=>a?Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z):Infinity;
export function combatAction(f:Fighter,e:Encounter,kind:'attack'|'guard',weapon:ItemId|null,pos:Point|undefined,target:Point,tick:number,damageBonus=0){
 if(f.hp===0)return 'recovering' as const;
 if(kind==='guard'){if(tick<f.guardReady)return 'guard_cooldown' as const;f.guardUntil=tick+16;f.guardReady=tick+36;return 'guarding' as const;}
 if(e.hp===0)return 'warden_resting' as const;
 const w=WEAPONS[weapon??'unarmed'];if(distance(pos,target)>w.range)return 'out_of_range' as const;
 if(tick<f.attackReady)return 'attack_cooldown' as const;
 f.attackReady=tick+w.cooldown;f.contributed=true;e.hp=Math.max(0,e.hp-w.damage-damageBonus);
 if(e.hp===0){e.strikeAt=0;e.respawnAt=tick+160;return 'warden_defeated' as const;}
 return 'attack_hit' as const;
}
export function finishEncounter(e:Encounter,players:{fighter:Fighter;position:Point|undefined;maxHealth?:number;damageReduction?:number;protectedCombat?:boolean}[],target:Point,camp:Point,tick:number){
 for(const {fighter:f,position,maxHealth=40,protectedCombat=false} of players){
  if(protectedCombat){f.hp=maxHealth;f.recoverAt=0;}
  else if(f.hp===0&&tick>=f.recoverAt){f.hp=maxHealth;f.recoverAt=0;}
  if(f.hp>0&&tick%20===0&&distance(position,camp)<=3)f.hp=Math.min(maxHealth,f.hp+4);
 }
 if(e.hp===0){for(const {fighter:f} of players)if(f.contributed){f.wins=Math.min(999999,f.wins+1);f.contributed=false;}
  if(tick>=e.respawnAt){e.hp=80;e.respawnAt=0;e.round=Math.min(999999,e.round+1);}return;}
 if(e.strikeAt&&tick>=e.strikeAt){for(const {fighter:f,position,damageReduction=0,protectedCombat=false} of players){if(!protectedCombat&&f.hp>0&&distance(position,target)<=4&&tick>f.guardUntil){f.hp=Math.max(0,f.hp-Math.max(1,10-damageReduction));if(f.hp===0){f.recoverAt=tick+100;f.contributed=false;}}}e.strikeAt=0;}
 if(!e.strikeAt&&players.some(p=>!p.protectedCombat&&p.fighter.hp>0&&distance(p.position,target)<=4))e.strikeAt=tick+40;
}
function fields(v:unknown,keys:string[]):Record<string,unknown>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==keys.length||!keys.every(k=>Object.hasOwn(v,k)))throw Error('Invalid encounter fields');return v as Record<string,unknown>;}
const n=(v:unknown,max=Number.MAX_SAFE_INTEGER)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max;
export function checkedFighter(value:unknown,tick:number,maxHealth=40):Fighter{const f=fields(value,['hp','attackReady','guardReady','guardUntil','recoverAt','wins','contributed']);if(!n(f.hp,maxHealth)||!n(f.wins,999999)||typeof f.contributed!=='boolean'||!['attackReady','guardReady','guardUntil','recoverAt'].every(k=>n(f[k]))||Number(f.attackReady)>tick+32||Number(f.guardReady)>tick+36||Number(f.guardUntil)>tick+16||Number(f.recoverAt)>tick+100||f.hp!==0&&f.recoverAt!==0||f.hp===0&&Number(f.recoverAt)<=tick)throw Error('Invalid fighter');return {...f} as unknown as Fighter;}
export function checkedEncounter(value:unknown,tick:number):Encounter{const e=fields(value,['hp','strikeAt','respawnAt','round']);if(!n(e.hp,80)||!n(e.round,999999)||e.round===0||!n(e.strikeAt)||!n(e.respawnAt)||Number(e.strikeAt)>tick+40||Number(e.respawnAt)>tick+160||e.hp===0&&(e.strikeAt!==0||Number(e.respawnAt)<=tick)||e.hp!==0&&e.respawnAt!==0)throw Error('Invalid encounter');return {...e} as unknown as Encounter;}
