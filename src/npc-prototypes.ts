import type {Point} from './world.js';
import type {WalkCheck} from './navigation.js';
import type {HeroAppearance} from './hero-appearance.js';
import type {Skin} from './game-actions.js';
export const NPC_IDS=['halden','pin','mirella','branik','elowen','tovik','yarrow','kestrel'] as const;
export type NPCId=typeof NPC_IDS[number];
export interface NPCPrototype {name:string;role:string;skin:Skin;coat:string;trim:string;scale:number;appearance:HeroAppearance;lines:readonly string[]}
const look=(hairColor:number,hairStyle:HeroAppearance['hairStyle']='swept',facialHair:HeroAppearance['facialHair']='none',build:HeroAppearance['build']='balanced'):HeroAppearance=>({skinTone:1,hairColor,eyeColor:2,hairStyle,facialHair,makeup:'none',build});
export const NPC_PROTOTYPES:Readonly<Record<NPCId,NPCPrototype>>=Object.freeze({
 halden:{name:'Halden',role:'Lantern Guide',skin:'elder',coat:'#304e9c',trim:'#e7c474',scale:1,appearance:look(2,'swept','beard'),lines:['Follow the lanterns across the causeway. I keep the camp safe.','Your packs can rest at camp while you explore.']},
 pin:{name:'Pin',role:'Clockwork Child',skin:'villager',coat:'#dfd2af',trim:'#a5563b',scale:.65,appearance:look(5),lines:['One more turn of the key… there it goes!','Do you think a clockwork rabbit dreams of carrots?']},
 mirella:{name:'Mirella',role:'Apothecary',skin:'traveler',coat:'#426e43',trim:'#e7d5ac',scale:.96,appearance:look(1,'long'),lines:['Leave a few flowers for the bees. They work harder than any of us.','Rain wakes the herbs. Watch how the leaves catch the light.']},
 branik:{name:'Branik',role:'Woodcutter',skin:'villager',coat:'#3c713f',trim:'#c7ab64',scale:1.05,appearance:look(1,'cropped','beard','strong'),lines:['A steady swing beats a hurried one. Mind the roots.','That sawdust gets everywhere. Even my nose!']},
 elowen:{name:'Sister Elowen',role:'Shrine Keeper',skin:'seraphine',coat:'#31518e',trim:'#efe0b8',scale:1,appearance:look(2,'long'),lines:['Even the smallest light can guide someone home.','Rest a moment. The moon is patient.']},
 tovik:{name:'Tovik',role:'Tavern Host',skin:'villager',coat:'#71513b',trim:'#e8d8b5',scale:1.02,appearance:look(1,'cropped','stubble','strong'),lines:['A warm hearth and a good story: that is a proper evening.','The kettle is singing louder than the patrons today.']},
 yarrow:{name:'Yarrow',role:'Graveyard Warden',skin:'elder',coat:'#465342',trim:'#89759a',scale:1.03,appearance:look(2,'long'),lines:['Walk gently. Memory grows in quiet places.','The raven knows every path. It just refuses to give directions.']},
 kestrel:{name:'Kestrel',role:'Sky Courier',skin:'adventurer',coat:'#35599e',trim:'#e1c477',scale:.95,appearance:look(1),lines:['The wind is turning. Good weather for a message.','Every road ends somewhere. Every letter starts an adventure.']}
});
export interface NPCPlacement {id:NPCId;position:Point}
/** Fixed ordering and bounded retries; only navigation-checked landing ground. */
export function placeRealmCast(camp:Point,goal:Point,check:(p:Point)=>WalkCheck):NPCPlacement[]{
 const offsets:[[number,number],...Array<[number,number]>]=[[0,0],[4,4],[-5,5],[-4,-4],[5,-5],[-4,-5],[5,5],[-5,5]];
 const placed:NPCPlacement[]=[];
 for(const [i,id] of NPC_IDS.entries()){
  const anchor=i<5?camp:goal,[dx,dz]=offsets[i]!;let found:Point|undefined;
  for(let attempt=0;attempt<(i===0?1:48);attempt++){
   const x=anchor.x+dx+(attempt===0?0:Math.cos(attempt*2.399)*(.5+Math.floor(attempt/8))),z=anchor.z+dz+(attempt===0?0:Math.sin(attempt*2.399)*(.5+Math.floor(attempt/8)));
   if(i>0&&(Math.abs(z-anchor.z)<2.5||Math.hypot(x-goal.x,z-goal.z)<4.5))continue;
   const result=check({x,y:anchor.y,z});if(result.ok&&placed.every(p=>Math.hypot(x-p.position.x,z-p.position.z)>=1.8)){found={...result.position};break;}
  }
  if(found)placed.push({id,position:found});
 }
 return placed;
}
export function nearestNPC(placements:readonly NPCPlacement[],position:Point|undefined,range=3):NPCPlacement|undefined{
 if(!position||![position.x,position.y,position.z,range].every(Number.isFinite)||range<0||range>3)return undefined;
 return placements.map(p=>({p,d:Math.hypot(position.x-p.position.x,position.y-p.position.y,position.z-p.position.z)})).filter(e=>e.d<=range).sort((a,b)=>a.d-b.d)[0]?.p;
}
