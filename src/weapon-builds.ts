import type {ItemId} from './inventory.js';
import {eligible,type Progression,type Skill,type TrainingMode} from './progression.js';
interface Build {tier:number;style:'melee'|'magic';requirements:Readonly<Partial<Record<Skill,number>>>;accuracy:number;modes:readonly TrainingMode[]}
const melee=Object.freeze(['attack','strength','defence'] as const),magic=Object.freeze(['magic'] as const);
export const WEAPON_BUILDS:Readonly<Record<ItemId|'unarmed',Build>>=Object.freeze({
 unarmed:Object.freeze({tier:1,style:'melee',requirements:Object.freeze({}),accuracy:1,modes:melee}),
 reed_blade:Object.freeze({tier:1,style:'melee',requirements:Object.freeze({attack:1}),accuracy:6,modes:melee}),
 granite_maul:Object.freeze({tier:1,style:'melee',requirements:Object.freeze({strength:1}),accuracy:2,modes:melee}),
 steel_warhammer:Object.freeze({tier:2,style:'melee',requirements:Object.freeze({attack:1}),accuracy:8,modes:melee}),
 steel_battleaxe:Object.freeze({tier:2,style:'melee',requirements:Object.freeze({strength:1}),accuracy:8,modes:melee}),
 steel_dagger:Object.freeze({tier:2,style:'melee',requirements:Object.freeze({attack:1}),accuracy:8,modes:melee}),
 steel_sword:Object.freeze({tier:2,style:'melee',requirements:Object.freeze({attack:1}),accuracy:9,modes:melee}),
 steel_rapier:Object.freeze({tier:2,style:'melee',requirements:Object.freeze({attack:1}),accuracy:9,modes:melee}),
 ash_staff:Object.freeze({tier:1,style:'magic',requirements:Object.freeze({magic:1}),accuracy:5,modes:magic})
});
export const canEquip=(p:Progression,item:ItemId)=>eligible(p,WEAPON_BUILDS[item].requirements);
export const canTrain=(item:ItemId|null,mode:TrainingMode)=>WEAPON_BUILDS[item??'unarmed'].modes.includes(mode);
