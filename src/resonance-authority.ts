import {STEP_MS} from './fixed-clock.js';
import {RESONANCE_COOLDOWN_MS,decodeResonanceCast,isResonanceEffectId,isResonanceNodeId,resonanceEffect,type ResonanceEffectId,type ResonanceNodeId} from './resonance-codex.js';

export const RESONANCE_COOLDOWN_TICKS=Math.ceil(RESONANCE_COOLDOWN_MS/STEP_MS);
export const RESONANCE_MAX_CASTS=1_000_000;
export interface ResonanceState {readyTick:number;activeEffect:ResonanceEffectId|null;activeUntilTick:number;lastChord:ResonanceNodeId[];casts:number}
export interface PersistentResonanceState {cooldownTicks:number;casts:number}

const integer=(value:unknown,max=Number.MAX_SAFE_INTEGER)=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0&&value<=max;
export const freshResonanceState=():ResonanceState=>({readyTick:0,activeEffect:null,activeUntilTick:0,lastChord:[],casts:0});
export function checkedPersistentResonance(value:unknown):PersistentResonanceState{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid resonance persistence');
 const r=value as Record<string,unknown>;if(Object.keys(r).sort().join()!=='casts,cooldownTicks'||!integer(r.cooldownTicks,RESONANCE_COOLDOWN_TICKS)||!integer(r.casts,RESONANCE_MAX_CASTS))throw Error('Invalid resonance persistence');
 return {cooldownTicks:r.cooldownTicks as number,casts:r.casts as number};
}
export function checkedResonanceState(value:unknown,tick:number):ResonanceState{
 if(!integer(tick))throw Error('Invalid resonance tick');if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid resonance state');
 const r=value as Record<string,unknown>;if(Object.keys(r).sort().join()!=='activeEffect,activeUntilTick,casts,lastChord,readyTick'||!integer(r.readyTick)||!integer(r.activeUntilTick)||!integer(r.casts,RESONANCE_MAX_CASTS)||!(r.activeEffect===null||isResonanceEffectId(r.activeEffect))||!Array.isArray(r.lastChord)||![0,3].includes(r.lastChord.length)||!r.lastChord.every(isResonanceNodeId)||new Set(r.lastChord).size!==r.lastChord.length)throw Error('Invalid resonance state');
 const effect=r.activeEffect as ResonanceEffectId|null,until=r.activeUntilTick as number,ready=r.readyTick as number;
 if(ready>tick+RESONANCE_COOLDOWN_TICKS)throw Error('Invalid resonance cooldown');
 if(effect===null?(until!==0):(until<=tick||until>tick+Math.ceil(resonanceEffect(effect).durationMs/STEP_MS)))throw Error('Invalid resonance duration');
 return {readyTick:ready,activeEffect:effect,activeUntilTick:until,lastChord:[...(r.lastChord as ResonanceNodeId[])],casts:r.casts as number};
}
export function restoreResonance(saved:PersistentResonanceState,tick:number):ResonanceState{const p=checkedPersistentResonance(saved);if(!integer(tick)||tick>Number.MAX_SAFE_INTEGER-RESONANCE_COOLDOWN_TICKS)throw Error('Invalid resonance restore tick');return {readyTick:tick+p.cooldownTicks,activeEffect:null,activeUntilTick:0,lastChord:[],casts:p.casts};}
export function persistResonance(state:ResonanceState,tick:number):PersistentResonanceState{const current=checkedResonanceState(state,tick);return checkedPersistentResonance({cooldownTicks:Math.max(0,current.readyTick-tick),casts:current.casts});}
export function expireResonance(state:ResonanceState,tick:number):boolean{checkedResonanceState(state,Math.max(0,tick-1));if(state.activeEffect!==null&&tick>=state.activeUntilTick){state.activeEffect=null;state.activeUntilTick=0;return true;}return false;}
export function castResonance(state:ResonanceState,value:string,tick:number){checkedResonanceState(state,tick);if(tick<state.readyTick)return {ok:false as const,reason:'cooldown' as const};if(state.casts>=RESONANCE_MAX_CASTS)return {ok:false as const,reason:'cap' as const};const chord=decodeResonanceCast(value),durationTicks=Math.ceil(chord.effect.durationMs/STEP_MS);state.readyTick=tick+RESONANCE_COOLDOWN_TICKS;state.activeEffect=chord.effect.id;state.activeUntilTick=tick+durationTicks;state.lastChord=[...chord.nodes];state.casts++;return {ok:true as const,chord,durationTicks};}
export function consumeResonance(state:ResonanceState,effect:ResonanceEffectId,tick:number):boolean{checkedResonanceState(state,tick);if(state.activeEffect!==effect)return false;state.activeEffect=null;state.activeUntilTick=0;return true;}
export const resonanceEffectForSkill=(skill:string):ResonanceEffectId|undefined=>({woodcutting:'lantern-bloom',mining:'miners-echo',fishing:'tide-whisper',agility:'pathfinders-gleam',magic:'starlight-trace',defence:'ward-glimmer'} as Record<string,ResonanceEffectId|undefined>)[skill];
