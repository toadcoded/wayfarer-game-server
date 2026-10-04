import {stepMovement} from './movement.js';
import {NavigationWorld,type XZ} from './navigation.js';
import type {Point} from './world.js';

export const XAM_ID='xam' as const;
export const XAM_MAX_TRAINING_TICKS=20*60*5;
export const XAM_SKILLS=[
 'agility','attack','cooking','crafting','defence','farming','firemaking','fishing','fletching',
 'herblore','magic','mining','prayer','ranged','runecrafting','smithing','strength','woodcutting',
] as const;
export type XamSkill=typeof XAM_SKILLS[number];
export interface XamSkillProgress {skill:XamSkill;xp:number;sessions:number}
export interface XamSnapshot {
 id:typeof XAM_ID;name:'Xam';position:Point;currentSkill:XamSkill;activity:string;flavor:string;
 skillStartedTick:number;skillEndsAtTick:number;lastProgressTick:number;rewardPips:number;discoveries:number;switches:number;
 protected:true;untouchable:true;autoRetaliate:false;collision:'nonblocking';
 armor:'legendary_holographic_rustic';mainHand:'diamond_scythe';offHand:'gilded_secateurs';
 progress:XamSkillProgress[];
}
export interface XamHealth {status:'healthy'|'attention';skillAgeTicks:number;skillRemainingTicks:number;sinceProgressTicks:number;blockedTicks:number;capTicks:number}

const ACTIVITY:Record<XamSkill,readonly string[]>={
 agility:['testing stepping stones','balancing along the causeway','practising short vaults'],
 attack:['working a straw practice dummy','drilling measured scythe arcs','practising footwork without a target'],
 cooking:['checking a camp kettle','toasting flatbread','sorting herbs for a stew'],
 crafting:['binding a tool wrap','repairing a small satchel','cutting a neat leather patch'],
 defence:['bracing against a practice post','testing shieldless guard stances','practising careful sidesteps'],
 farming:['pruning moonbloom','checking reed shoots','turning a tiny garden bed'],
 firemaking:['stacking dry kindling','tending a safe lantern flame','testing damp tinder'],
 fishing:['checking a quiet fishing line','sorting hooks at the bank','watching the water for ripples'],
 fletching:['straightening practice shafts','cutting feather vanes','checking arrow balance'],
 herblore:['crushing fragrant leaves','sorting potion herbs','snipping medicinal stems'],
 magic:['tracing harmless warding shapes','studying a dim rune spark','practising a tiny light spell'],
 mining:['tapping a loose practice stone','sorting mineral chips','testing rock faces for sound'],
 prayer:['pausing at a roadside marker','polishing a small shrine token','observing a quiet ritual'],
 ranged:['aiming at a straw ring','measuring a safe firing lane','checking a practice bowstring'],
 runecrafting:['aligning blank rune stones','copying simple glyphs','sorting chalked sigils'],
 smithing:['checking a cold practice anvil','filing a blunt metal edge','sorting small rivets'],
 strength:['moving a training stone','carrying a weighted timber','doing slow controlled lifts'],
 woodcutting:['pruning dead branches','checking bark grain','working a marked training stump'],
};
const FLAVOR=[
 'adjusts the gilded secateurs','checks the diamond scythe edge','looks over the path before continuing','dusts off his toolbelt',
 'pauses to inspect a strange flower','nods at a passing traveler','turns a curious pebble over in one glove','listens to the reeds in the wind',
 'straightens a loose leather strap','watches a lantern bug blink nearby','checks a tiny birdhouse along the path','steps around a bright mushroom cap',
] as const;
const SKILL_SET=new Set<string>(XAM_SKILLS);
const safeInt=(v:unknown,max=Number.MAX_SAFE_INTEGER):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max;
export const isXamSkill=(v:unknown):v is XamSkill=>typeof v==='string'&&SKILL_SET.has(v);
const isSkill=isXamSkill;
const point=(v:unknown):Point=>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid Xam position');const r=v as Record<string,unknown>;if(Object.keys(r).sort().join(',')!=='x,y,z'||![r.x,r.y,r.z].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e6))throw Error('Invalid Xam position');return {x:r.x as number,y:r.y as number,z:r.z as number};};
const exact=(v:unknown,keys:readonly string[]):Record<string,unknown>=>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid Xam fields');const r=v as Record<string,unknown>;if(Object.keys(r).length!==keys.length||!keys.every(k=>Object.hasOwn(r,k)))throw Error('Invalid Xam fields');return r;};

export function checkedXamSnapshot(value:unknown,tick:number):XamSnapshot{
 const keys=['id','name','position','currentSkill','activity','flavor','skillStartedTick','skillEndsAtTick','lastProgressTick','rewardPips','discoveries','switches','protected','untouchable','autoRetaliate','collision','armor','mainHand','offHand','progress'] as const;
 const r=exact(value,keys);if(r.id!==XAM_ID||r.name!=='Xam'||!isSkill(r.currentSkill)||typeof r.activity!=='string'||!r.activity||r.activity.length>96||typeof r.flavor!=='string'||r.flavor.length>96||r.protected!==true||r.untouchable!==true||r.autoRetaliate!==false||r.collision!=='nonblocking'||r.armor!=='legendary_holographic_rustic'||r.mainHand!=='diamond_scythe'||r.offHand!=='gilded_secateurs')throw Error('Invalid Xam state');
 const started=r.skillStartedTick,ends=r.skillEndsAtTick,last=r.lastProgressTick;if(!safeInt(started)||!safeInt(ends)||!safeInt(last)||!safeInt(tick)||started>tick||last>tick||ends<=tick||ends-started<1||ends-started>XAM_MAX_TRAINING_TICKS||!safeInt(r.rewardPips,1e9)||!safeInt(r.discoveries,1e9)||!safeInt(r.switches,1e9))throw Error('Invalid Xam clock');
 if(!Array.isArray(r.progress)||r.progress.length!==XAM_SKILLS.length)throw Error('Invalid Xam progress');const seen=new Set<XamSkill>();
 const progress=r.progress.map(v=>{const p=exact(v,['skill','xp','sessions']);if(!isSkill(p.skill)||seen.has(p.skill)||!safeInt(p.xp,1e9)||!safeInt(p.sessions,1e7))throw Error('Invalid Xam progress');seen.add(p.skill);return {skill:p.skill,xp:p.xp as number,sessions:p.sessions as number};});
 if(XAM_SKILLS.some(s=>!seen.has(s)))throw Error('Incomplete Xam progress');
 return {id:XAM_ID,name:'Xam',position:point(r.position),currentSkill:r.currentSkill,activity:r.activity,flavor:r.flavor,skillStartedTick:started as number,skillEndsAtTick:ends as number,lastProgressTick:last as number,rewardPips:r.rewardPips as number,discoveries:r.discoveries as number,switches:r.switches as number,protected:true,untouchable:true,autoRetaliate:false,collision:'nonblocking',armor:'legendary_holographic_rustic',mainHand:'diamond_scythe',offHand:'gilded_secateurs',progress};
}

interface InternalState extends XamSnapshot {rng:number;target:XZ;blockedTicks:number;nextFlavorTick:number}

function publicSnapshot(s:InternalState):XamSnapshot{return {id:s.id,name:s.name,position:{...s.position},currentSkill:s.currentSkill,activity:s.activity,flavor:s.flavor,skillStartedTick:s.skillStartedTick,skillEndsAtTick:s.skillEndsAtTick,lastProgressTick:s.lastProgressTick,rewardPips:s.rewardPips,discoveries:s.discoveries,switches:s.switches,protected:true,untouchable:true,autoRetaliate:false,collision:'nonblocking',armor:s.armor,mainHand:s.mainHand,offHand:s.offHand,progress:s.progress.map(p=>({...p}))};}
const clone=(s:InternalState):InternalState=>({...s,position:{...s.position},target:{...s.target},progress:s.progress.map(p=>({...p}))});
function mix(seed:number):number{let x=seed>>>0||0x9e3779b9;x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0||0x85ebca6b;}
function seedFrom(a:Point,b:Point):number{let x=0x58414d;for(const n of [a.x,a.y,a.z,b.x,b.y,b.z])x=mix(x^Math.trunc(n*1000));return x;}
function anchorFor(skill:XamSkill,camp:Point,beacon:Point):Point{return ['fishing','mining','agility','attack','defence','ranged','magic','strength','runecrafting'].includes(skill)?beacon:camp;}

/** Server-owned autonomous training character. It has no network decoder, HP, target or retaliation path. */
export class XamController{
 private state:InternalState;
 constructor(private readonly nav:NavigationWorld,private readonly camp:Point,private readonly beacon:Point){
  const checkedCamp=nav.check(camp),checkedBeacon=nav.check(beacon);if(!checkedCamp.ok||!checkedBeacon.ok)throw Error('Xam anchors must be walkable');
  const progress=XAM_SKILLS.map(skill=>({skill,xp:0,sessions:0}));
  const initial:InternalState={id:XAM_ID,name:'Xam',position:{...checkedCamp.position},currentSkill:'woodcutting',activity:'',flavor:'checks his toolbelt',skillStartedTick:0,skillEndsAtTick:1,lastProgressTick:0,rewardPips:0,discoveries:0,switches:0,protected:true,untouchable:true,autoRetaliate:false,collision:'nonblocking',armor:'legendary_holographic_rustic',mainHand:'diamond_scythe',offHand:'gilded_secateurs',progress,rng:seedFrom(checkedCamp.position,checkedBeacon.position),target:{x:checkedCamp.position.x,z:checkedCamp.position.z},blockedTicks:0,nextFlavorTick:20};
  this.state=this.startSession(initial,0,undefined);
 }
 private random(s:InternalState):number{s.rng=mix(s.rng);return s.rng;}
 private chooseSkill(s:InternalState,requested?:XamSkill):XamSkill{
  if(requested!==undefined){if(!isSkill(requested))throw Error('Invalid Xam directive');return requested;}
  const min=Math.min(...s.progress.map(p=>p.sessions));let pool=s.progress.filter(p=>p.sessions<=min+1&&p.skill!==s.currentSkill);if(!pool.length)pool=s.progress.filter(p=>p.skill!==s.currentSkill);return pool[this.random(s)%pool.length]!.skill;
 }
 private chooseTarget(s:InternalState,skill:XamSkill):XZ{
  const base=anchorFor(skill,this.camp,this.beacon);for(let attempt=0;attempt<12;attempt++){const r=1.5+(this.random(s)%450)/100,angle=(this.random(s)%6284)/1000,p={x:base.x+Math.cos(angle)*r,z:base.z+Math.sin(angle)*r};if(this.nav.check(p).ok)return p;}return {x:base.x,z:base.z};
 }
 private startSession(s:InternalState,tick:number,requested?:XamSkill):InternalState{
  const next=clone(s),skill=this.chooseSkill(next,requested),duration=1+(this.random(next)%XAM_MAX_TRAINING_TICKS),entry=next.progress.find(p=>p.skill===skill)!;entry.sessions++;next.currentSkill=skill;next.skillStartedTick=tick;next.skillEndsAtTick=tick+duration;next.switches++;next.rewardPips=Math.min(1e9,next.rewardPips+1);const choices=ACTIVITY[skill];next.activity=choices[this.random(next)%choices.length]!;next.flavor=FLAVOR[this.random(next)%FLAVOR.length]!;next.target=this.chooseTarget(next,skill);next.blockedTicks=0;next.nextFlavorTick=tick+40+(this.random(next)%360);next.lastProgressTick=tick;return next;
 }
 stagedAdvance(tick:number,requested?:XamSkill):XamController{
  if(!safeInt(tick)||tick<1)throw Error('Invalid Xam tick');let next=clone(this.state);
  if(requested!==undefined||tick>=next.skillEndsAtTick)next=this.startSession(next,tick,requested);
  const dx=next.target.x-next.position.x,dz=next.target.z-next.position.z,d=Math.hypot(dx,dz);if(d>.35){const before=next.position,result=stepMovement(this.nav,next.position,{x:dx/Math.max(d,1),z:dz/Math.max(d,1)},2.2,.05);next.position={...result.position};if(result.blocked||Math.hypot(next.position.x-before.x,next.position.z-before.z)<1e-5)next.blockedTicks++;else{next.blockedTicks=0;next.lastProgressTick=tick;}if(next.blockedTicks>=20){next.target=this.chooseTarget(next,next.currentSkill);next.blockedTicks=0;}}
  else if(tick%20===0){const p=next.progress.find(v=>v.skill===next.currentSkill)!;const prior=p.xp;p.xp=Math.min(1e9,p.xp+1);next.lastProgressTick=tick;if(Math.floor(p.xp/25)>Math.floor(prior/25)){next.rewardPips=Math.min(1e9,next.rewardPips+1);next.discoveries=Math.min(1e9,next.discoveries+1);}}
  if(tick>=next.nextFlavorTick){next.flavor=FLAVOR[this.random(next)%FLAVOR.length]!;next.rewardPips=Math.min(1e9,next.rewardPips+1);next.nextFlavorTick=tick+80+(this.random(next)%520);}
  checkedXamSnapshot(publicSnapshot(next),tick);const out=Object.create(XamController.prototype) as XamController;Object.assign(out,this);out.state=next;return out;
 }
 snapshot():XamSnapshot{return publicSnapshot(this.state);}
 health(tick:number):XamHealth{const s=this.state,age=Math.max(0,tick-s.skillStartedTick),remaining=Math.max(0,s.skillEndsAtTick-tick),since=Math.max(0,tick-s.lastProgressTick);return {status:age<=XAM_MAX_TRAINING_TICKS&&since<=400&&s.blockedTicks<20?'healthy':'attention',skillAgeTicks:age,skillRemainingTicks:remaining,sinceProgressTicks:since,blockedTicks:s.blockedTicks,capTicks:XAM_MAX_TRAINING_TICKS};}
 inspection(tick:number){return {...this.snapshot(),health:this.health(tick),target:{...this.state.target},rng:this.state.rng,nextFlavorTick:this.state.nextFlavorTick};}
}
