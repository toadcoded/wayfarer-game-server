import {level,MAX_XP} from './progression.js';
export const PROFESSIONS=['woodcutting','mining','fishing'] as const;
export const SKILLING_SKILLS=['woodcutting','mining','fishing','agility','cooking','crafting','firemaking','fletching','herblore','runecrafting','slayer','smithing','thieving','farming','construction','hunter'] as const;
export type NoncombatSkill=typeof SKILLING_SKILLS[number];
export type Profession=typeof PROFESSIONS[number];
export const RESOURCES=['logs','ore','fish','warden_essence'] as const;
export type Resource=typeof RESOURCES[number];
export type BankTransferCommand=`${'deposit'|'withdraw'}:${Resource}:${number|'all'}`;
export type SkillCommand=Profession|'deposit'|'upgrade'|BankTransferCommand;
export interface Skilling {xp:Record<NoncombatSkill,number>;pack:Record<Resource,number>;bank:Record<Resource,number>;toolTier:1|2|3;readyTick:number}
export const TOOL_RECIPES=Object.freeze({2:Object.freeze({level:2,material:3,essence:1,name:'Artisan'}),3:Object.freeze({level:5,material:20,essence:5,name:'Masterwork'})});
const empty=():Record<Resource,number>=>({logs:0,ore:0,fish:0,warden_essence:0});
export const freshSkilling=():Skilling=>({xp:Object.fromEntries(SKILLING_SKILLS.map(k=>[k,0])) as Record<NoncombatSkill,number>,pack:empty(),bank:empty(),toolTier:1,readyTick:0});
export function parseBankTransfer(value:unknown):{operation:'deposit'|'withdraw';resource:Resource;amount:number|'all'}|undefined {
 if(typeof value!=='string')return;
 const match=/^(deposit|withdraw):(logs|ore|fish|warden_essence):(all|[1-9][0-9]{0,6})$/.exec(value);
 if(!match)return;
 const amount=match[3]==='all'?'all':Number(match[3]);
 if(typeof amount==='number'&&(!Number.isSafeInteger(amount)||amount>1000000))return;
 return {operation:match[1] as 'deposit'|'withdraw',resource:match[2] as Resource,amount};
}
export const isSkillCommand=(v:unknown):v is SkillCommand=>typeof v==='string'&&([...PROFESSIONS,'deposit','upgrade'].includes(v)||!!parseBankTransfer(v));
export function checkedSkilling(value:unknown):Skilling {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid skilling');const s=value as Skilling;
 const counts=(v:unknown,keys:readonly string[],cap:number)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join() === [...keys].sort().join()&&Object.values(v).every(n=>Number.isSafeInteger(n)&&n>=0&&n<=cap);
 if(Object.keys(s).sort().join()!=='bank,pack,readyTick,toolTier,xp'||!counts(s.xp,SKILLING_SKILLS,MAX_XP)||!counts(s.pack,RESOURCES,12)||!counts(s.bank,RESOURCES,1000000)||Object.values(s.pack).reduce((a,b)=>a+b,0)>12||![1,2,3].includes(s.toolTier)||!Number.isSafeInteger(s.readyTick)||s.readyTick<0)throw Error('Invalid skilling');
 if(s.toolTier>1&&!PROFESSIONS.every(k=>level(s.xp[k])>=TOOL_RECIPES[s.toolTier as 2|3].level))throw Error('Invalid tool requirements');
 return {xp:{...s.xp},pack:{...s.pack},bank:{...s.bank},toolTier:s.toolTier,readyTick:s.readyTick};
}
export type SkillResult='skill_gathered'|'skill_wait'|'skill_pack_full'|'skill_banked'|'skill_bank_full'|'skill_withdrawn'|'skill_pack_empty'|'skill_bank_empty'|'skill_transfer_unavailable'|'skill_upgraded'|'skill_requirements'|'skill_max_tool';
/** Called only inside the detached server transaction after a range check. */
export function skillAction(s:Skilling,command:SkillCommand,tick:number):SkillResult {
 checkedSkilling(s);if(!Number.isSafeInteger(tick)||tick<0||tick>Number.MAX_SAFE_INTEGER-40)throw Error('Invalid skilling clock');
 if(command==='deposit'){if(RESOURCES.some(k=>s.bank[k]+s.pack[k]>1000000))return 'skill_bank_full';for(const k of RESOURCES){s.bank[k]+=s.pack[k];s.pack[k]=0;}return 'skill_banked';}
 if(command==='upgrade'){if(s.toolTier===3)return 'skill_max_tool';const nextTier=s.toolTier===1?2:3,recipe=TOOL_RECIPES[nextTier];if(!PROFESSIONS.every(k=>level(s.xp[k])>=recipe.level)||s.bank.logs<recipe.material||s.bank.ore<recipe.material||s.bank.fish<recipe.material||s.bank.warden_essence<recipe.essence)return 'skill_requirements';for(const k of ['logs','ore','fish'] as const)s.bank[k]-=recipe.material;s.bank.warden_essence-=recipe.essence;s.toolTier=nextTier;return 'skill_upgraded';}
 const transfer=parseBankTransfer(command);
 if(transfer){
  const {operation,resource,amount}=transfer;
  if(operation==='deposit'){
   const quantity=amount==='all'?Math.min(s.pack[resource],1000000-s.bank[resource]):amount;
   if(quantity===0)return s.pack[resource]===0?'skill_pack_empty':'skill_bank_full';if(quantity>s.pack[resource])return 'skill_transfer_unavailable';
   if(s.bank[resource]+quantity>1000000)return 'skill_bank_full';
   s.pack[resource]-=quantity;s.bank[resource]+=quantity;return 'skill_banked';
  }
  const capacity=12-Object.values(s.pack).reduce((a,b)=>a+b,0),available=s.bank[resource];
  if(available===0)return 'skill_bank_empty';if(capacity===0)return 'skill_pack_full';
  const quantity=amount==='all'?Math.min(available,capacity):amount;
  if(quantity>available)return 'skill_bank_empty';if(quantity>capacity)return 'skill_pack_full';
  s.bank[resource]-=quantity;s.pack[resource]+=quantity;return 'skill_withdrawn';
 }
 if(!PROFESSIONS.includes(command as Profession))throw new Error('Invalid skill command');
 const profession=command as Profession;
 if(tick<s.readyTick)return 'skill_wait';const yieldCount=s.toolTier;if(Object.values(s.pack).reduce((a,b)=>a+b,0)+yieldCount>12)return 'skill_pack_full';
 const resource={woodcutting:'logs',mining:'ore',fishing:'fish'} as const;s.pack[resource[profession]]+=yieldCount;s.xp[profession]=Math.min(MAX_XP,s.xp[profession]+25);s.readyTick=tick+gatheringBonuses(s.xp[profession]).cooldownTicks;return 'skill_gathered';
}
export function awardWardenEssence(s:Skilling):void {checkedSkilling(s);s.bank.warden_essence=Math.min(1000000,s.bank.warden_essence+1);}

export function gatheringBonuses(xp:number){const n=level(xp);return {level:n,cooldownTicks:Math.max(20,40-Math.floor((n-1)/5)),toolYieldBonus:0};}
export function awardNoncombatXP(s:Skilling,skill:NoncombatSkill,amount:number):void{checkedSkilling(s);if(!(SKILLING_SKILLS as readonly string[]).includes(skill)||!Number.isSafeInteger(amount)||amount<0||amount>MAX_XP)throw Error('Invalid skilling award');s.xp[skill]=Math.min(MAX_XP,s.xp[skill]+amount);}
export function migrateSkilling(value:unknown):Skilling{if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid legacy skilling');const s=value as Skilling;if(Object.keys(s).sort().join()!=='bank,pack,readyTick,toolTier,xp'||!s.xp||typeof s.xp!=='object'||Object.keys(s.xp).sort().join()!==[...PROFESSIONS].sort().join())throw Error('Invalid legacy professions');if(!Object.values(s.xp).every(n=>Number.isSafeInteger(n)&&n>=0&&n<=960400))throw Error('Invalid legacy XP');return checkedSkilling({...s,xp:{...freshSkilling().xp,...s.xp}});}

/** Server-only, atomic one-unit bonus for an active resonance effect. */
export function grantResonanceGatherBonus(s:Skilling,profession:Profession,xp=10):boolean{
 checkedSkilling(s);if(!PROFESSIONS.includes(profession)||!Number.isSafeInteger(xp)||xp<0||xp>1000)throw Error('Invalid resonance gathering bonus');
 if(Object.values(s.pack).reduce((a,b)=>a+b,0)>=12)return false;
 const resource={woodcutting:'logs',mining:'ore',fishing:'fish'} as const;s.pack[resource[profession]]+=1;awardNoncombatXP(s,profession,xp);return true;
}
