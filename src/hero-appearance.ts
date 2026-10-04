import type {Skin} from './game-actions.js';
export const SKIN_TONES=Object.freeze(['#f0cbb1','#e7b18d','#cb926b','#aa704e','#80513b','#57372c'] as const);
export const HAIR_COLORS=Object.freeze(['#d69c43','#664726','#a5a099','#634733','#241e22','#ae482d'] as const);
export const EYE_COLORS=Object.freeze(['#244798','#433523','#42715b','#717d8a'] as const);
export interface HeroAppearance {skinTone:number;hairColor:number;eyeColor:number;hairStyle:'cropped'|'swept'|'long';facialHair:'none'|'stubble'|'beard';makeup:'none'|'natural'|'moonlit';build:'lean'|'balanced'|'strong'}
export function checkedAppearance(value:unknown):Readonly<HeroAppearance>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid hero appearance');
 const a=value as Record<string,unknown>,keys=['skinTone','hairColor','eyeColor','hairStyle','facialHair','makeup','build'];
 if(Object.keys(a).length!==keys.length||!keys.every(k=>Object.hasOwn(a,k)))throw new Error('Invalid appearance fields');
 for(const [key,count] of [['skinTone',SKIN_TONES.length],['hairColor',HAIR_COLORS.length],['eyeColor',EYE_COLORS.length]] as const)if(!Number.isInteger(a[key])||(a[key] as number)<0||(a[key] as number)>=count)throw new Error('Invalid appearance palette');
 for(const [key,choices] of [['hairStyle',['cropped','swept','long']],['facialHair',['none','stubble','beard']],['makeup',['none','natural','moonlit']],['build',['lean','balanced','strong']]] as const)if(!choices.includes(a[key] as never))throw new Error('Invalid appearance choice');
 return Object.freeze({...a}) as unknown as Readonly<HeroAppearance>;
}
export function appearanceForSkin(skin:Skin):Readonly<HeroAppearance>{
 const profiles:Record<Skin,HeroAppearance>={
 seraphine:{skinTone:1,hairColor:0,eyeColor:0,hairStyle:'long',facialHair:'none',makeup:'moonlit',build:'lean'},
 adventurer:{skinTone:2,hairColor:1,eyeColor:1,hairStyle:'swept',facialHair:'stubble',makeup:'none',build:'strong'},
 elder:{skinTone:3,hairColor:2,eyeColor:3,hairStyle:'cropped',facialHair:'beard',makeup:'none',build:'lean'},
 traveler:{skinTone:4,hairColor:4,eyeColor:2,hairStyle:'swept',facialHair:'stubble',makeup:'none',build:'balanced'},
 villager:{skinTone:1,hairColor:5,eyeColor:2,hairStyle:'cropped',facialHair:'none',makeup:'natural',build:'balanced'},
 vector:{skinTone:5,hairColor:4,eyeColor:1,hairStyle:'cropped',facialHair:'none',makeup:'none',build:'strong'}
 };
 return checkedAppearance(profiles[skin]);
}
