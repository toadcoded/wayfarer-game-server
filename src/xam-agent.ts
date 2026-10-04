import {RealmRuntime} from './realm-runtime.js';import type {NavigationWorld} from './navigation.js';import type {Point} from './world.js';import type {PlayerSave} from './persistence.js';import {ALL_SKILLS,skillBook} from './skill-directory.js';import {practiceResponse} from './practice-interaction.js';import {encodeMoveIntent} from './movement.js';
const TASKS=[...ALL_SKILLS.map(skill=>({action:'practice',value:skill})),...['woodcutting','mining','fishing','deposit','upgrade'].map(value=>({action:'skilling',value})),...['accept','gather','submit'].map(value=>({action:'quest',value})),{action:'claim',value:'reed_blade'},{action:'equip',value:'reed_blade'},{action:'combat',value:'attack'},{action:'beacon',value:'light'}];
export const XAM_MAX_FOCUS_TICKS=20*60*5;
/** Trusted host controller; sends ordinary validated intents, never edits XP or inventory. */
export class XamAgent {
 readonly connection='@server-npc/xam';readonly id:string;private moveSequence=0;private actionSequence=0;private pending:{sequence:number;progress:boolean}|undefined;private lastTick=-1;private path:Point[]=[];private pathGoal='';private retryTick=0;private focusStartedTick=0;cursor:number;phase='training';
 constructor(private realm:RealmRuntime,private nav:NavigationWorld,private camp:Point,private goal:Point,save?:PlayerSave,cursor=0,private accepted?:(packet:string)=>void){if(!Number.isInteger(cursor)||cursor<0||cursor>=TASKS.length)throw Error('Invalid Xam cursor');this.cursor=cursor;this.focusStartedTick=realm.tick;this.id=realm.join(this.connection,save?.position??camp,save,{combatProtected:true}).id;}
 private send(packet:string){if(this.realm.receive(this.connection,packet)){this.accepted?.(packet);return true;}return false;}
 private action(action:string,value:string,progress=true){const sequence=this.actionSequence++;if(this.send(JSON.stringify({kind:'action',sequence,action,value})))this.pending={sequence,progress};}
 private move(target:Point){const current=this.realm.stateFor(this.connection)!.position,tick=this.realm.tick,key=target.x+':'+target.z;if(this.pathGoal!==key||(this.path.length===0&&tick>=this.retryTick)){this.pathGoal=key;const result=this.nav.findPath(current,target,4096);this.path=result.status==='found'?result.points.slice(1):[];this.retryTick=tick+200;}
  while(this.path.length&&Math.hypot(this.path[0]!.x-current.x,this.path[0]!.z-current.z)<.22)this.path.shift();const point=this.path[0],dx=point?point.x-current.x:0,dz=point?point.z-current.z:0,n=Math.hypot(dx,dz);this.send(encodeMoveIntent({sequence:this.moveSequence++,dx:n?dx/n:0,dz:n?dz/n:0,mode:'jog'}));this.phase=point?'travelling':'path recovery';}
 step(){const tick=this.realm.tick;if(tick===this.lastTick)return;this.lastTick=tick;const g=this.realm.gameStateFor(this.connection),p=this.realm.stateFor(this.connection)?.position;if(!g||!p)return;if(tick-this.focusStartedTick>=XAM_MAX_FOCUS_TICKS){this.cursor=(this.cursor+1)%TASKS.length;this.focusStartedTick=tick;this.pending=undefined;this.path=[];this.pathGoal='';this.retryTick=tick;this.phase='switching focus';}
  if(this.pending){if(g.result?.sequence!==this.pending.sequence)return;const code=g.result.code,progress=this.pending.progress;this.pending=undefined;if(progress&&!['practice_started','practice_step','practice_early','practice_wait','skill_wait','attack_cooldown','out_of_range','skill_range','recovering','guard_cooldown','patch_empty','gather_wait'].includes(code)){if(code==='requirements_not_met'&&g.quest?.status==='active'&&(g.quest.reeds??0)<3){this.cursor=TASKS.findIndex(t=>t.action==='quest'&&t.value==='gather');this.focusStartedTick=tick;}else{this.cursor=(this.cursor+1)%TASKS.length;this.focusStartedTick=tick;}}}
  if(g.players.find(p=>p.id===this.id)?.skin!=='traveler'){this.action('appearance','traveler',false);return;}
  const c=g.practiceChallenge;if(c){this.phase='training '+c.skill;if(tick>=c.readyTick)this.action('practice-step',practiceResponse(c,c.target));return;}
  const task=TASKS[this.cursor]!;let target=this.camp,range=2.5;
  if(task.action==='skilling'&&!['deposit','upgrade'].includes(task.value)){const candidate=this.nav.check({x:this.goal.x,z:this.goal.z+6});target=candidate.ok?candidate.position:this.goal;range=1;}
  else if((task.action==='quest'&&task.value==='gather')||task.action==='combat'||task.action==='beacon'){target=this.goal;range=2.5;}
  if(g.fighter?.hp===0){this.phase='recovering';this.send(encodeMoveIntent({sequence:this.moveSequence++,dx:0,dz:0,mode:'walk'}));return;}
  if(Math.hypot(p.x-target.x,p.y-target.y,p.z-target.z)>range){this.move(target);return;}
  this.send(encodeMoveIntent({sequence:this.moveSequence++,dx:0,dz:0,mode:'walk'}));this.phase=task.action+' '+task.value;
  if(g.encounter.strikeAt&&tick>=g.fighter!.guardReady&&Math.hypot(p.x-this.goal.x,p.z-this.goal.z)<4){this.action('combat','guard',false);return;}
  if(task.action==='practice'&&tick<(g.practiceReadyTick??0))return;
  if(task.action==='skilling'&&!['deposit','upgrade'].includes(task.value)&&tick<Math.max(g.practiceReadyTick??0,g.skilling!.readyTick))return;
  if(task.action==='quest'&&task.value==='gather'&&g.quest?.status==='active'&&(g.quest.reeds??0)<3){this.action('quest','gather',false);return;}
  this.action(task.action,task.value);
 }
 export(){return {cursor:this.cursor,save:this.realm.exportPlayer(this.connection)!};}
 examine(){const g=this.realm.gameStateFor(this.connection)!,position=this.realm.stateFor(this.connection)!.position,skills=skillBook(g.progression!,g.skilling!);return {kind:'xam',id:this.id,name:'Xam',position:{...position},phase:this.phase,totalXp:skills.reduce((n,s)=>n+s.xp,0),totalLevel:skills.reduce((n,s)=>n+s.level,0),skills:skills.map(s=>({id:s.id,level:s.level,xp:s.xp})),inventory:{...g.inventory!,slots:[...g.inventory!.slots]},pack:{...g.skilling!.pack},bank:{...g.skilling!.bank},protected:true,untouchable:true,autoRetaliate:false,collision:'nonblocking',armor:'legendary_holographic_rustic',mainHand:'diamond_scythe',offHand:'gilded_secateurs',examine:'Xam. Starts small, keeps learning. Protected, nonblocking and tireless; examine only.'};}
}
export const XAM_TASK_COUNT=TASKS.length;
