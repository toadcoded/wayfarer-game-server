import {Multitool} from './multitool.js';
import {CharacterRenderer} from './character-renderer.js';
import {terrainSampler} from './navigation.js';
import {planCrossing,mountCrossing,inspectNearby,type CrossingStyle} from './crossings.js';
import {crossingScene} from './scene-meshes.js';
import {RealmRuntime} from './realm-runtime.js';
import {toIso} from './adapters/iso.js';
import {normalizePreferences} from './adapters/preferences.js';
import {generateChunk,CHUNK_SIZE,type Point} from './world.js';
import {reserveSites} from './site-placement.js';
import {propPrimitives} from './geometry.js';
const canvas=document.querySelector<HTMLCanvasElement>('#world')!,ctx=canvas.getContext('2d')!;
const mini=document.querySelector<HTMLCanvasElement>('#map')!,mc=mini.getContext('2d')!;
const status=document.querySelector<HTMLElement>('#status')!;
const characters=new CharacterRenderer();
const config={seed:20260928,generatorVersion:1} as const;
const prefs=normalizePreferences({});
canvas.style.filter=`brightness(${prefs.brightness}%)`;
let plan=planCrossing(terrainSampler(config),{id:'preview',style:'willowglass',z:0,minX:-16,maxX:176});
let mounted=mountCrossing(terrainSampler(config),plan),session=new RealmRuntime(mounted.navigation);
let player=session.join('local',plan.start).state.position,sequence=0,route:Point[]=[],keys=new Set<string>();
type Face={points:Point[];color:string;depth:number;ground:boolean};
let faces:Face[]=[],drawn:{face:Face;screen:{x:number;y:number}[]}[]=[];
let width=1,height=1,scale=1,offsetX=0,offsetY=0;
let paused=false,lastFrame:number|undefined,droppedMs=0;
const pauseButton=document.querySelector<HTMLButtonElement>('#pause')!;
const health=document.querySelector<HTMLElement>('#health')!;
function project(p:Point){const q=toIso(p.x,p.z);return {x:offsetX+q.isoX*scale,y:offsetY+(q.isoY-p.y)*scale};}
function load(style:CrossingStyle){
 plan=planCrossing(terrainSampler(config),{id:'preview',style,z:0,minX:-16,maxX:176});mounted=mountCrossing(terrainSampler(config),plan);
 // Match decorative props in crossingScene with their collision definitions.
 const b=plan.bounds;
 for(let cz=Math.floor(b.minZ/CHUNK_SIZE);cz<=Math.floor(b.maxZ/CHUNK_SIZE);cz++)for(let cx=Math.floor(b.minX/CHUNK_SIZE);cx<=Math.floor(b.maxX/CHUNK_SIZE);cx++){
  const chunk=reserveSites(generateChunk(config,cx,cz),[plan]);
  const props=chunk.props.filter(p=>p.position.x>=b.minX&&p.position.x<=b.maxX&&p.position.z>=b.minZ&&p.position.z<=b.maxZ).map(p=>({...p,position:{...p.position,y:mounted.construction.terrainAt(p.position.x,p.position.z).height}}));
  mounted.navigation.addPrimitives(propPrimitives({...chunk,props}));
 }
 session=new RealmRuntime(mounted.navigation);player=session.join('local',plan.start).state.position;sequence=0;route=[];keys.clear();characters.clear();faces=[];lastFrame=undefined;droppedMs=0;
 const meshes=crossingScene(config,plan);
 for(const [mi,m] of meshes.entries())for(let i=0;i<m.indices.length;i+=3){
  const points=Array.from(m.indices.slice(i,i+3),v=>({x:m.positions[v*3]!,y:m.positions[v*3+1]!,z:m.positions[v*3+2]!}));
  faces.push({points,color:m.color,depth:points.reduce((n,p)=>n+p.x+p.z+p.y*.02,0)/3,ground:mi===0||plan.surfaces.some(s=>s.color===m.color)});
 }
 faces.sort((a,b)=>a.depth-b.depth);document.querySelector('#place')!.textContent=plan.name;status.textContent='Ready. Tap a surface or cross the bridge.';resize();
}
function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
 const ps=faces.flatMap(f=>f.points.map(p=>{const q=toIso(p.x,p.z);return {x:q.isoX,y:q.isoY-p.y};}));
 const xs=ps.map(p=>p.x),ys=ps.map(p=>p.y);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 scale=Math.min((width-36)/(maxX-minX),(height-230)/(maxY-minY));scale=Math.max(.5,scale);offsetX=width/2-(minX+maxX)/2*scale;offsetY=height/2-(minY+maxY)/2*scale;
 drawn=faces.map(face=>({face,screen:face.points.map(project)}));render();}
function render(){ctx.fillStyle='#142923';ctx.fillRect(0,0,width,height);
 for(const {face,screen} of drawn){ctx.beginPath();screen.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=face.color;ctx.fill();}
 if(route.length){ctx.strokeStyle='#f2ce79';ctx.lineWidth=2;ctx.beginPath();[player,...route].forEach((p,i)=>{const s=project(p);i?ctx.lineTo(s.x,s.y):ctx.moveTo(s.x,s.y)});ctx.stroke();}
 characters.draw(ctx,'local',player,project(player),performance.now(),document.querySelector<HTMLSelectElement>('#appearance')?.value||'adventurer',true,paused||document.hidden);
 const b=plan.bounds;mc.fillStyle='#243e32';mc.fillRect(0,0,310,196);const mp=(p:Point)=>({x:10+(p.x-b.minX)/(b.maxX-b.minX)*290,y:10+(p.z-b.minZ)/(b.maxZ-b.minZ)*176});
 mc.strokeStyle='#c6b786';mc.lineWidth=8;mc.beginPath();[plan.start,plan.goal].forEach((p,i)=>{const v=mp(p);i?mc.lineTo(v.x,v.y):mc.moveTo(v.x,v.y)});mc.stroke();const m=mp(player);mc.fillStyle='#ffe2a1';mc.beginPath();mc.arc(m.x,m.y,5,0,7);mc.fill();}
function travel(goal:Point){const result=mounted.navigation.findPath(player,goal);route=result.status==='found'?result.points.slice(1):[];status.textContent=route.length?'Following the checked path.':`Path: ${result.status}`;}
canvas.addEventListener('pointerdown',event=>{
 const x=event.clientX,y=event.clientY;
 for(const {face,screen} of [...drawn].reverse()){
  const [a,b,c]=screen;if(!a||!b||!c||!face.ground)continue;
  const d=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(d)<1e-8)continue;
  const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/d,v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/d,w=1-u-v;
  if(Math.min(u,v,w)<0)continue;
  const ps=face.points;travel({x:u*ps[0]!.x+v*ps[1]!.x+w*ps[2]!.x,y:0,z:u*ps[0]!.z+v*ps[1]!.z+w*ps[2]!.z});break;
 }
});
document.querySelector('#cross')!.addEventListener('click',()=>runTool('cross'));document.querySelector('#reset')!.addEventListener('click',()=>runTool('reset'));
document.querySelector('#style')!.addEventListener('change',e=>load((e.target as HTMLSelectElement).value as CrossingStyle));
addEventListener('keydown',e=>{if(e.key.startsWith('Arrow')&&!(e.target instanceof HTMLSelectElement)){e.preventDefault();keys.add(e.key);route=[];}});addEventListener('keyup',e=>keys.delete(e.key));addEventListener('blur',()=>{keys.clear();route=[];});document.addEventListener('visibilitychange',()=>{keys.clear();route=[];});addEventListener('resize',resize);
function inputTick(){let dx=0,dz=0;
 if(keys.size){dx=(Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'))-Number(keys.has('ArrowUp'))+Number(keys.has('ArrowDown')))*Math.SQRT1_2;dz=(-Number(keys.has('ArrowRight'))+Number(keys.has('ArrowLeft'))-Number(keys.has('ArrowUp'))+Number(keys.has('ArrowDown')))*Math.SQRT1_2;const n=Math.max(1,Math.hypot(dx,dz));dx/=n;dz/=n;}
 else{while(route[0]&&Math.hypot(route[0].x-player.x,route[0].z-player.z)<.04)route.shift();if(route[0]){const x=route[0].x-player.x,z=route[0].z-player.z,n=Math.max(.2,Math.hypot(x,z));dx=x/n;dz=z/n;}}
 session.receive('local',JSON.stringify({sequence:sequence++,dx,dz}));
}
function updatePlayer(){const state=session.stateFor('local')!;player=state.position;
 if(state.blocked&&route.length){route=[];status.textContent='Path stopped by an obstacle.';}
 const lore=inspectNearby(plan,player)[0];if(lore)status.textContent=lore.text;
}
function suspend(){
 keys.clear();route=[];lastFrame=undefined;if(session.status==='faulted')return;session.resetClock();
 session.receive('local',JSON.stringify({sequence:sequence++,dx:0,dz:0}));
}
const tools=new Multitool([
 {id:'cross',label:'Cross bridge',tooltip:'Follow the navigation-checked crossing route',unavailable:()=>paused?'Resume walking first':session.status==='faulted'?'Reset the scene first':undefined,run:()=>travel(plan.goal)},
 {id:'reset',label:'Return',tooltip:'Reset the local crossing scene',run:()=>load(plan.style)},
 {id:'pause',label:'Pause',tooltip:'Pause or resume the local simulation',run:()=>{paused=!paused;suspend();pauseButton.textContent=paused?'Resume':'Pause';pauseButton.setAttribute('aria-pressed',String(paused));}},
]);
function runTool(id:string){const result=tools.execute(id);if(!result.ok)status.textContent=result.reason;}
for(const action of tools.actions)document.querySelector(`#${action.id}`)!.setAttribute('title',action.tooltip);
pauseButton.addEventListener('click',()=>runTool('pause'));
document.addEventListener('visibilitychange',suspend);
addEventListener('blur',suspend);
function frame(now:number){
 try{
 if(session.status==='active'&&!document.hidden&&!paused){
  if(lastFrame!==undefined){
   const result=session.advance(Math.max(0,now-lastFrame),()=>{updatePlayer();inputTick();});
   droppedMs+=result.droppedMs;updatePlayer();
  }
  lastFrame=now;
 }else{lastFrame=undefined;}
 }catch{keys.clear();route=[];lastFrame=undefined;status.textContent='Simulation stopped safely. Press Return to restart this local scene.';}
 health.textContent=`${session.status==='faulted'?'Simulation fault':paused?'Paused':'20 Hz simulation'} · tick ${session.tick} · ${Math.round(droppedMs)} ms catch-up discarded`;
 render();requestAnimationFrame(frame);
}
load('willowglass');requestAnimationFrame(frame);

