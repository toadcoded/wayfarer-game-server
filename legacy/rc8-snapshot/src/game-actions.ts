import {type Fighter,type Encounter,freshFighter,freshEncounter,combatAction,finishEncounter,checkedFighter,checkedEncounter} from './encounter.js';
import {type Inventory,type ItemId,isItem,freshInventory,copyInventory,checkedInventory,grantReward,equipItem,unequipItem} from './inventory.js';
import type {Point} from './world.js';
import {checkedXamSnapshot,type XamSnapshot} from './xam.js';
export const SKINS=['adventurer','elder','traveler','villager','vector'] as const;
export type Skin=typeof SKINS[number];
export type Action={kind:'action';sequence:number;action:'appearance';value:Skin}|{kind:'action';sequence:number;action:'beacon';value:'light'}|{kind:'action';sequence:number;action:'quest';value:'accept'|'gather'|'submit'}|{kind:'action';sequence:number;action:'claim'|'equip';value:ItemId}|{kind:'action';sequence:number;action:'unequip';value:'weapon'}|{kind:'action';sequence:number;action:'combat';value:'attack'|'guard'};
export const RESULT_TEXT={attack_hit:'Hit the Lantern Warden.',attack_cooldown:'Your weapon is recovering.',guarding:'Guard raised for 0.8 seconds.',guard_cooldown:'Guard is recovering.',recovering:'Recovering — no items are lost.',warden_resting:'Warden resets in eight seconds.',warden_defeated:'Warden cleared! Contributors gain a session victory.',item_claimed:'Reward added to your pack.',item_equipped:'Weapon equipped and shared with nearby players.',item_unequipped:'Weapon returned to your pack.',item_unavailable:'That item is not in your pack.',reward_unavailable:'Complete Quiet Tithe, then claim one reward from Halden.',equipped:'Appearance shared with the realm.',lit:'You lit the landing beacon.',already_lit:'The beacon is already lit.',out_of_range:'Move within 3 metres of the target.',quest_accepted:'Halden: Bring me three bundles from the far reed patch.',quest_unavailable:'This quest is already accepted or completed.',quest_not_active:'Speak to Halden before gathering reeds.',gathered:'Reed bundle gathered.',gather_wait:'Give the reeds a moment before gathering again.',patch_empty:'The shared reed patch is regrowing.',inventory_full:'You have all three bundles. Return to Halden.',requirements_not_met:'Halden needs three reed bundles.',quest_completed:'Quiet Tithe completed. You received one offering token.'} as const;
export type Result={sequence:number;code:keyof typeof RESULT_TEXT};
export interface QuestState {status:'available'|'active'|'completed';reeds:number;tithes:number;gatherReadyTick:number}
export interface PersistentQuestState {status:'available'|'active'|'completed';reeds:number;tithes:number;gatherCooldownTicks:number}
export interface PersistentPlayerState {version:1;skin:Skin;quest:PersistentQuestState;inventory:Inventory}
export interface GameState {kind:'game';revision:number;tick:number;beacon:{position:Point;lit:boolean};camp:Point;patch:{stock:number;respawnTick:number};quest:QuestState|null;inventory:Inventory|null;fighter:Fighter|null;encounter:Encounter;players:{id:string;skin:Skin;weapon:ItemId|null}[];xam:XamSnapshot|null;result:Result|null}
const object=(x:unknown,keys:string[]):Record<string,unknown>=>{if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).length!==keys.length||!keys.every(k=>Object.hasOwn(x,k)))throw new Error('Invalid game fields');return x as Record<string,unknown>;};
const seq=(x:unknown):x is number=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0;
const skin=(x:unknown):x is Skin=>typeof x==='string'&&(SKINS as readonly string[]).includes(x);
const point=(x:unknown):Point=>{const p=object(x,['x','y','z']);if(!Object.values(p).every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e6))throw new Error('Invalid game position');return p as unknown as Point;};
const quest=(x:unknown):QuestState=>{const q=object(x,['status','reeds','tithes','gatherReadyTick']);if(!['available','active','completed'].includes(q.status as string)||!seq(q.reeds)||q.reeds>3||!seq(q.tithes)||q.tithes>1||!seq(q.gatherReadyTick)||q.status==='completed'&&(q.reeds!==0)||q.status!=='completed'&&q.tithes!==0||q.status==='available'&&(q.reeds!==0||q.gatherReadyTick!==0))throw new Error('Invalid quest state');return q as unknown as QuestState;};
const persistentQuest=(x:unknown):PersistentQuestState=>{const q=object(x,['status','reeds','tithes','gatherCooldownTicks']);if(!['available','active','completed'].includes(q.status as string)||!seq(q.reeds)||q.reeds>3||!seq(q.tithes)||q.tithes>1||!seq(q.gatherCooldownTicks)||q.gatherCooldownTicks>200||q.status==='completed'&&(q.reeds!==0)||q.status!=='completed'&&q.tithes!==0||q.status==='available'&&(q.reeds!==0||q.gatherCooldownTicks!==0))throw new Error('Invalid persistent quest state');return q as unknown as PersistentQuestState;};
export function checkedPersistentPlayerState(x:unknown):PersistentPlayerState {const r=object(x,['version','skin','quest','inventory']);if(r.version!==1||!skin(r.skin))throw new Error('Invalid persistent player');const q=persistentQuest(r.quest),inventory=checkedInventory(r.inventory);if(inventory.rewardClaimed&&(q.status!=='completed'||q.tithes!==0)||q.status==='completed'&&!inventory.rewardClaimed&&q.tithes!==1)throw new Error('Invalid persistent reward conservation');return {version:1,skin:r.skin,quest:{...q},inventory:copyInventory(inventory)};}
export const freshPersistentPlayerState=():PersistentPlayerState=>({version:1,skin:'adventurer',quest:{status:'available',reeds:0,tithes:0,gatherCooldownTicks:0},inventory:freshInventory()});
const parse=(text:string,limit:number):unknown=>{if(typeof text!=='string'||new TextEncoder().encode(text).length>limit)throw new Error('Game message too large');return JSON.parse(text);};
export function decodeAction(text:string):Action {const r=object(parse(text,256),['kind','sequence','action','value']);if(r.kind!=='action'||!seq(r.sequence)||!((r.action==='claim'||r.action==='equip')&&isItem(r.value)||r.action==='unequip'&&r.value==='weapon'||r.action==='combat'&&['attack','guard'].includes(r.value as string)||r.action==='appearance'&&skin(r.value)||r.action==='beacon'&&r.value==='light'||r.action==='quest'&&['accept','gather','submit'].includes(r.value as string)))throw new Error('Invalid action');return r as Action;}
export function decodeGameState(text:string):GameState {
 const r=object(parse(text,32768),['kind','revision','tick','beacon','camp','patch','quest','inventory','fighter','encounter','players','xam','result']);
 if(r.kind!=='game'||!seq(r.revision)||!seq(r.tick)||!Array.isArray(r.players)||r.players.length>256)throw new Error('Invalid game state');
 checkedEncounter(r.encounter,r.tick);if(r.fighter!==null)checkedFighter(r.fighter,r.tick);if((r.quest===null)!==(r.fighter===null))throw Error('Invalid fighter membership');
 const b=object(r.beacon,['position','lit']);point(b.position);point(r.camp);if(typeof b.lit!=='boolean')throw new Error('Invalid beacon');
 const patch=object(r.patch,['stock','respawnTick']);if(!seq(patch.stock)||patch.stock>3||!seq(patch.respawnTick))throw new Error('Invalid patch');if(patch.stock===0&&(patch.respawnTick<=r.tick||patch.respawnTick-r.tick>200)||patch.stock>0&&patch.respawnTick!==0)throw Error('Invalid resource clock');if(r.quest!==null){const q=quest(r.quest);if(q.gatherReadyTick-r.tick>20)throw Error('Invalid gather clock');}if(r.inventory!==null)checkedInventory(r.inventory);if((r.quest===null)!==(r.inventory===null))throw Error('Invalid private state');if(r.quest!==null){const q=quest(r.quest),inv=checkedInventory(r.inventory);if(inv.rewardClaimed&&(q.status!=='completed'||q.tithes!==0)||q.status==='completed'&&!inv.rewardClaimed&&q.tithes!==1)throw Error('Invalid reward conservation');}
 if(r.xam!==null)checkedXamSnapshot(r.xam,r.tick as number);
 const ids=new Set();for(const player of r.players){const v=object(player,['id','skin','weapon']);if(typeof v.id!=='string'||!/^p[1-9][0-9]{0,15}$/.test(v.id)||ids.has(v.id)||!skin(v.skin)||!(v.weapon===null||isItem(v.weapon)))throw new Error('Invalid appearance');ids.add(v.id);}
 if(r.result!==null){const v=object(r.result,['sequence','code']);if(!seq(v.sequence)||typeof v.code!=='string'||!Object.hasOwn(RESULT_TEXT,v.code))throw new Error('Invalid action result');}
 return r as unknown as GameState;
}
interface Player {id:string;skin:Skin;sequence:number;pending:Action[];result:Result|null;quest:QuestState;inventory:Inventory;fighter:Fighter}
const copyPlayer=(p:Player):Player=>({...p,pending:p.pending.map(a=>({...a})),result:p.result?{...p.result}:null,quest:{...p.quest},fighter:{...p.fighter},inventory:copyInventory(p.inventory)});
const near=(p:Point|undefined,target:Point)=>!!p&&Math.hypot(p.x-target.x,p.y-target.y,p.z-target.z)<=3;
/** All gameplay transitions are staged with movement by RealmRuntime. */
export class GameActions {
 private players=new Map<string,Player>();private lit=false;private revision=0;private tick=0;private stock=3;private respawnTick=0;
 private encounter=freshEncounter();
 private readonly beacon:Point;private readonly camp:Point;
 constructor(beacon:Point,camp:Point=beacon){this.beacon={...point(beacon)};this.camp={...point(camp)};}
 join(connection:string,id:string,persisted?:PersistentPlayerState):void {if(typeof connection!=='string'||!connection||connection.length>128||this.players.has(connection)||[...this.players.values()].some(p=>p.id===id)||this.players.size>=256||!/^p[1-9][0-9]{0,15}$/.test(id))throw new Error('Invalid action player');const saved=persisted?checkedPersistentPlayerState(persisted):freshPersistentPlayerState(),ready=saved.quest.status==='available'?0:this.tick+saved.quest.gatherCooldownTicks;if(!Number.isSafeInteger(ready))throw new Error('Persistent cooldown overflow');this.players.set(connection,{id,fighter:freshFighter(),skin:saved.skin,sequence:-1,pending:[],result:null,inventory:copyInventory(saved.inventory),quest:{status:saved.quest.status,reeds:saved.quest.reeds,tithes:saved.quest.tithes,gatherReadyTick:ready}});}
 leave(connection:string):void{this.players.delete(connection);}
 receive(connection:string,text:string):boolean {const p=this.players.get(connection);if(!p||p.pending.length>=8)return false;try{const a=decodeAction(text);if(a.sequence<=p.sequence)return false;p.sequence=a.sequence;p.pending.push(a);return true;}catch{return false;}}
 stagedCommit(positionFor:(connection:string)=>Point|undefined):GameActions {
  const next=new GameActions(this.beacon,this.camp);next.lit=this.lit;next.revision=this.revision;next.tick=this.tick;next.stock=this.stock;next.respawnTick=this.respawnTick;
  next.encounter={...this.encounter};next.players=new Map([...this.players].map(([c,p])=>[c,copyPlayer(p)]));next.commit(positionFor);return next;
 }
 inspection(){return {encounter:{...this.encounter},revision:this.revision,tick:this.tick,beacon:{position:{...this.beacon},lit:this.lit},camp:{...this.camp},patch:{stock:this.stock,respawnTick:this.respawnTick},players:[...this.players.values()].map(p=>{const {id,skin,sequence,pending,result,quest,inventory,fighter}=copyPlayer(p);return {id,skin,sequence,pending,result,quest,inventory,fighter};}).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)};}
 persistentState(connection:string):PersistentPlayerState|undefined {const p=this.players.get(connection);if(!p)return;const remaining=p.quest.status==='active'?Math.max(0,p.quest.gatherReadyTick-this.tick):0;return checkedPersistentPlayerState({version:1,skin:p.skin,quest:{status:p.quest.status,reeds:p.quest.reeds,tithes:p.quest.tithes,gatherCooldownTicks:remaining},inventory:p.inventory});}
 validate(expectedIds:readonly string[]):void {
  const state=this.snapshot('',expectedIds);decodeGameState(JSON.stringify(state));
  if(this.players.size!==expectedIds.length||state.players.length!==expectedIds.length)throw new Error('Gameplay membership mismatch');
  for(const [connection,p] of this.players){decodeGameState(JSON.stringify(this.snapshot(connection,[])));if(p.pending.length!==0||p.sequence!==(p.result?.sequence??-1))throw new Error('Uncommitted gameplay input');}
 }
 commit(positionFor:(connection:string)=>Point|undefined):void {
  const encounter={...this.encounter};const candidate=new Map<string,Player>();let lit=this.lit,changed=false,stock=this.stock,respawnTick=this.respawnTick;const tick=this.tick+1;
  if(!Number.isSafeInteger(tick))throw new Error('Gameplay clock exhausted');
  if(stock===0&&tick>=respawnTick){stock=3;respawnTick=0;changed=true;}
  for(const [connection,p] of this.players){const next=copyPlayer(p);next.pending=[];
   for(const a of p.pending){changed=true;let code:Result['code'];
    if(a.action==='combat'){code=combatAction(next.fighter,encounter,a.value,next.inventory.weapon,positionFor(connection),this.beacon,tick);}
    else if(a.action==='appearance'){next.skin=a.value;code='equipped';}
    else if(a.action==='claim'){if(!near(positionFor(connection),this.camp))code='out_of_range';else if(next.quest.status!=='completed'||next.quest.tithes!==1||next.inventory.rewardClaimed)code='reward_unavailable';else{const inv=grantReward(next.inventory,a.value);if(!inv)code='reward_unavailable';else{next.inventory=inv;next.quest.tithes=0;code='item_claimed';}}}
    else if(a.action==='equip'||a.action==='unequip'){const inv=a.action==='equip'?equipItem(next.inventory,a.value):unequipItem(next.inventory);if(!inv)code='item_unavailable';else{next.inventory=inv;code=a.action==='equip'?'item_equipped':'item_unequipped';}}
    else if(a.action==='beacon'){if(!near(positionFor(connection),this.beacon))code='out_of_range';else if(lit)code='already_lit';else{lit=true;code='lit';}}
    else {const q=next.quest;
     if(!near(positionFor(connection),a.value==='gather'?this.beacon:this.camp))code='out_of_range';
     else if(a.value==='accept'){if(q.status!=='available')code='quest_unavailable';else{q.status='active';code='quest_accepted';}}
     else if(q.status!=='active')code='quest_not_active';
     else if(a.value==='gather'){
      if(q.reeds>=3)code='inventory_full';else if(tick<q.gatherReadyTick)code='gather_wait';else if(stock===0)code='patch_empty';
      else{q.reeds++;q.gatherReadyTick=tick+20;stock--;if(stock===0)respawnTick=tick+200;code='gathered';}
     }else if(q.reeds<3)code='requirements_not_met';else{q.reeds=0;q.tithes=1;q.status='completed';code='quest_completed';}
    }
    next.result={sequence:a.sequence,code};
   }candidate.set(connection,next);
  }
  finishEncounter(encounter,[...candidate].map(([c,p])=>({fighter:p.fighter,position:positionFor(c)})),this.beacon,this.camp,tick);
  changed ||= JSON.stringify(encounter)!==JSON.stringify(this.encounter)||[...candidate].some(([c,p])=>JSON.stringify(p.fighter)!==JSON.stringify(this.players.get(c)!.fighter));
  if(changed&&!Number.isSafeInteger(this.revision+1))throw new Error('Gameplay revision exhausted');
  // Validate the complete detached candidate before exposing any transition, even
  // when this reducer is used directly without RealmRuntime's outer transaction.
  const staged=new GameActions(this.beacon,this.camp);
  staged.encounter=encounter;staged.players=candidate;staged.lit=lit;staged.tick=tick;staged.stock=stock;staged.respawnTick=respawnTick;staged.revision=this.revision+Number(changed);
  staged.validate([...candidate.values()].map(p=>p.id));
  this.encounter=encounter;this.players=candidate;this.lit=lit;this.tick=tick;this.stock=stock;this.respawnTick=respawnTick;this.revision=staged.revision;
 }
 snapshot(connection:string,visible:readonly string[]):GameState {const ids=new Set(visible),p=this.players.get(connection);return {kind:'game',encounter:{...this.encounter},fighter:p?{...p.fighter}:null,revision:this.revision,tick:this.tick,beacon:{position:{...this.beacon},lit:this.lit},camp:{...this.camp},patch:{stock:this.stock,respawnTick:this.respawnTick},quest:p?{...p.quest}:null,inventory:p?copyInventory(p.inventory):null,players:[...this.players.values()].filter(p=>ids.has(p.id)).map(p=>({id:p.id,skin:p.skin,weapon:p.inventory.weapon})),xam:null,result:p?.result?{...p.result}:null};}
}
