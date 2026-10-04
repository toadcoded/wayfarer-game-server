import {Scene,TransformNode,MeshBuilder,StandardMaterial,Color3,Mesh} from '@babylonjs/core';
import {WILDLIFE,wildlifePose,type WildlifeNPC} from './wildlife.js';
import type {GroundSampler} from './navigation.js';
function animal(scene:Scene,npc:WildlifeNPC,materials:Map<string,StandardMaterial>){
 const root=new TransformNode(npc.id,scene),body=new TransformNode(npc.id+':body',scene);body.parent=root;root.position.set(npc.position.x,npc.position.y,npc.position.z);const profile=WILDLIFE[npc.species],family=profile.family;root.scaling.setAll(profile.size);const legs:TransformNode[]=[],wings:TransformNode[]=[],eyes:Mesh[]=[],staticParts:Mesh[]=[];let tail:TransformNode|undefined;
 const material=(color:string)=>{let m=materials.get(color);if(!m){m=new StandardMaterial('wildlife:'+color,scene);m.diffuseColor=Color3.FromHexString(color);m.specularColor=Color3.Black();materials.set(color,m);}return m;};
 const shape=(name:string,p:number[],s:number[],color:string=profile.color,parent:TransformNode=body)=>{const m=MeshBuilder.CreateSphere(npc.id+':'+name,{diameter:1,segments:4},scene);m.parent=parent;m.position.set(p[0]!,p[1]!,p[2]!);m.scaling.set(s[0]!,s[1]!,s[2]!);m.material=material(color);m.isPickable=false;m.checkCollisions=false;staticParts.push(m);return m;};
 const long=family==='mustelid'||family==='fox';shape('body',[0,.25,0],[.36,.36,long?.85:.55]);const head=new TransformNode(npc.id+':head',scene);head.parent=body;head.position.set(0,.42,long?.43:.3);shape('face',[0,0,0],[.25,.24,.25],profile.color,head);
 for(const side of [-1,1]){const eye=shape('eye'+side,[side*.09,.025,.105],[.037,.045,.023],'#20262b',head);eyes.push(eye);shape('eye-glint'+side,[side*.092,.037,.118],[.012,.012,.008],'#f2ead6',head);if(family!=='bird')shape('ear'+side,[side*.095,family==='rabbit'?.23:.12,0],[.07,family==='rabbit'?.35:.11,.08],profile.color,head);}
 shape('nose',[0,-.04,.15],[family==='burrower'?.055:.04,.04,family==='burrower'?.14:.045],family==='bird'?'#cfa45f':'#6b5750',head);
 if(family==='bird'){
  shape('beak',[0,-.025,.19],[.09,.055,.18],npc.species==='duck'?'#d3a457':'#ad9c7d',head);for(const side of [-1,1]){const wing=new TransformNode(npc.id+':wing'+side,scene);wing.parent=body;wing.position.set(side*.15,.31,0);shape('feathers'+side,[side*.09,0,-.03],[.24,.11,.4],npc.species==='pigeon'?'#626e83':profile.color,wing);wings.push(wing);shape('foot'+side,[side*.08,.025,.06],[.08,.04,.12],'#b8996c');}
 }else{
  for(const side of [-1,1])for(const z of [-.18,.18]){const leg=new TransformNode(npc.id+':leg'+side+z,scene);leg.parent=body;leg.position.set(side*.12,.15,z);shape('paw'+side+z,[0,-.08,.03],[.10,.18,.15],profile.color,leg);legs.push(leg);}
  tail=new TransformNode(npc.id+':tail',scene);tail.parent=body;tail.position.set(0,.27,-(long?.4:.24));
  if(family==='rabbit')shape('puff',[0,0,-.07],[.13,.13,.13],'#d5c8b2',tail);
  else if(npc.species==='squirrel'){shape('bushy-tail',[0,.22,-.12],[.22,.5,.2],profile.color,tail);shape('tail-tip',[0,.44,-.04],[.2,.18,.18],'#bd9b6e',tail);}
  else if(npc.species==='fox'){shape('bushy-tail',[0,-.06,-.25],[.24,.24,.6],profile.color,tail);shape('tail-tip',[0,-.06,-.51],[.18,.18,.2],'#d3c5a8',tail);shape('muzzle',[0,.36,.63],[.16,.12,.28],'#c5b69c');}
  else if(npc.species==='mouse'||npc.species==='shrew')shape('thin-tail',[0,-.08,-.2],[.027,.04,.48],'#b69e8b',tail);
  else if(family==='mustelid'){shape('tapered-tail',[0,-.05,-.22],[.13,.13,.46],profile.color,tail);for(const side of [-1,1])shape('face-mask'+side,[side*.08,.41,.52],[.10,.08,.04],'#665849');}
  if(npc.species==='hedgehog')for(let i=0;i<7;i++)shape('spine'+i,[(i%3-1)*.09,.41,-.14+Math.floor(i/3)*.1],[.07,.14,.07],'#b0a482');
 }
 // Species silhouettes and small facial details; static parts batch within each joint/material.
 shape('chin',[0,-.08,.09],[.15,.09,.13],family==='fox'||family==='mustelid'?'#d8c8a9':profile.color,head);
 if(family!=='bird')for(const side of [-1,1])shape('inner-ear'+side,[side*.095,family==='rabbit'?.23:.125,.038],[.035,family==='rabbit'?.24:.06,.022],'#bc9185',head);
 if(family==='rabbit'||family==='rodent'){shape('haunch-left',[-.14,.22,-.16],[.22,.29,.27]);shape('haunch-right',[.14,.22,-.16],[.22,.29,.27]);}
 if(npc.species==='fox'){shape('cream-chest',[0,.28,.3],[.22,.27,.2],'#e0cfaa');for(const side of [-1,1])shape('dark-ankle'+side,[side*.12,.05,.19],[.1,.11,.12],'#443c36');}
 if(family==='mustelid'){for(const side of [-1,1])shape('cheek'+side,[side*.055,-.04,.15],[.09,.08,.07],'#cabb9b',head);}
 if(family==='burrower')for(const side of [-1,1]){shape('digging-paw'+side,[side*.19,.07,.2],[.18,.07,.19],'#b9a08e');for(let i=0;i<3;i++)shape('claw'+side+i,[side*.19+(i-1)*.045,.07,.31],[.025,.025,.07],'#e0d1b1');}
 if(family==='bird'){shape('breast',[0,.23,.2],[.24,.28,.16],npc.species==='duck'?'#dbd2b6':'#b8c0c2');if(npc.species==='pigeon')shape('neck-band',[0,.38,.19],[.23,.12,.16],'#82679a');}
 const groups=new Map<TransformNode,Map<StandardMaterial,Mesh[]>>();for(const m of staticParts){if(eyes.includes(m))continue;const parent=m.parent as TransformNode,mat=m.material as StandardMaterial;let by=groups.get(parent);if(!by){by=new Map();groups.set(parent,by);}const list=by.get(mat)??[];list.push(m);by.set(mat,list);}for(const [parent,by] of groups)for(const [mat,parts] of by){if(parts.length<2)continue;const features=parts.map(m=>m.name);for(const m of parts){m.parent=null;m.computeWorldMatrix(true);}const merged=Mesh.MergeMeshes(parts,true,true);if(merged){merged.name=npc.id+':detail-batch:'+mat.name;merged.parent=parent;merged.isPickable=false;merged.checkCollisions=false;merged.metadata={features};}}staticParts.length=0;groups.clear();
 return {root,update(n:WildlifeNPC,now:number,paused:boolean,ground:GroundSampler){const pose=wildlifePose(n,now,paused),g=ground(pose.x,pose.z);if(Number.isFinite(g.height)&&g.waterDepth<=.15&&g.slopeDegrees<=30)root.position.set(pose.x,g.height+pose.hop,pose.z);root.rotation.y=pose.yaw;if(tail)tail.rotation.y=paused?0:Math.sin(pose.phase*.35)*.12;const blink=paused?1:((now/1000+n.phase)%4.9<.13?.12:1);for(const eye of eyes)eye.scaling.y=.045*blink;head.rotation.y=paused?0:Math.sin(pose.phase*.3)*.13;head.rotation.x=paused?0:Math.sin(pose.phase*.7)*.06;legs.forEach((leg,i)=>leg.rotation.x=Math.sin(pose.phase+i*Math.PI)*.28*pose.activity);wings.forEach((wing,i)=>wing.rotation.z=paused?0:Math.sin(pose.phase*.5+i*Math.PI)*.16*pose.activity);},dispose(){root.dispose();}};
}
/** Bounded decorative NPC layer. Wildlife is never pickable, collidable or registered as a fighter. */
export class Wildlife3D {
 private animals=new Map<string,{npc:WildlifeNPC;rig:ReturnType<typeof animal>}>();private materials=new Map<string,StandardMaterial>();private disposed=false;
 constructor(private scene:Scene,private ground:GroundSampler){}
 get count(){return this.animals.size;}
 sync(npcs:readonly WildlifeNPC[]){
  if(this.disposed)throw new Error('Wildlife layer disposed');if(npcs.length>48||new Set(npcs.map(n=>n.id)).size!==npcs.length)throw new Error('Invalid wildlife budget or IDs');
  for(const n of npcs)if(!Object.hasOwn(WILDLIFE,n.species)||n.attackable!==false||n.collidable!==false||n.drops!==false||![n.position.x,n.position.y,n.position.z,n.phase].every(Number.isFinite))throw new Error('Invalid wildlife descriptor');
  const keep=new Set(npcs.map(n=>n.id));for(const [id,entry] of this.animals)if(!keep.has(id)){entry.rig.dispose();this.animals.delete(id);}
  for(const npc of npcs){let entry=this.animals.get(npc.id);if(entry&&entry.npc.species!==npc.species){entry.rig.dispose();this.animals.delete(npc.id);entry=undefined;}if(!entry){entry={npc:structuredClone(npc),rig:animal(this.scene,npc,this.materials)};this.animals.set(npc.id,entry);}else entry.npc=structuredClone(npc);}
 }
 update(now:number,paused:boolean){if(!this.disposed)for(const entry of this.animals.values())entry.rig.update(entry.npc,now,paused,this.ground);}
 dispose(){if(!this.disposed){this.disposed=true;for(const e of this.animals.values())e.rig.dispose();this.animals.clear();for(const m of this.materials.values())m.dispose();this.materials.clear();}}
}
