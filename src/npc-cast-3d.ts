import {Scene,MeshBuilder,StandardMaterial,Color3} from '@babylonjs/core';
import {createHero3D} from './hero-3d.js';
import {NPC_PROTOTYPES,type NPCId} from './npc-prototypes.js';
/** Faceted prototype outfits. All adornments are cosmetic and owned by this rig. */
export function createNamedNPC3D(scene:Scene,id:string,kind:NPCId){
 const spec=NPC_PROTOTYPES[kind],hero=createHero3D(scene,id,spec.skin,spec.appearance,{coat:spec.coat,trim:spec.trim});hero.root.scaling.setAll(spec.scale);
 const materials=new Map<string,StandardMaterial>();
 const part=(name:string,shape:'box'|'sphere'|'cone',position:number[],size:number[],color:string,parent=hero.root)=>{
  let mat=materials.get(color);if(!mat){mat=new StandardMaterial(id+':outfit:'+color,scene);mat.diffuseColor=Color3.FromHexString(color);mat.specularColor=Color3.Black();materials.set(color,mat);}
  const mesh=shape==='box'?MeshBuilder.CreateBox(id+':'+name,{size:1},scene):shape==='sphere'?MeshBuilder.CreateSphere(id+':'+name,{diameter:1,segments:6},scene):MeshBuilder.CreateCylinder(id+':'+name,{height:1,diameterBottom:1,diameterTop:0,tessellation:8},scene);
  mesh.parent=parent;mesh.position.set(position[0]!,position[1]!,position[2]!);mesh.scaling.set(size[0]!,size[1]!,size[2]!);mesh.material=mat;mesh.isPickable=false;mesh.checkCollisions=false;return mesh;
 };
 const head=scene.getTransformNodeByName(id+':head')!,torso=scene.getTransformNodeByName(id+':torso')!;
 if(['halden','mirella','yarrow'].includes(kind)){part('hat-brim','sphere',[0,.24,0],[.88,.06,.7],kind==='mirella'?'#426e43':'#51422f',head);part('hat-crown','cone',[0,.43,0],[.5,.48,.48],kind==='mirella'?'#426e43':'#51422f',head);part('hat-band','box',[0,.3,.17],[.45,.09,.08],spec.trim,head);}
 if(kind==='mirella'){for(let i=0;i<4;i++)part('hat-flower'+i,'sphere',[.26+Math.cos(i*Math.PI/2)*.04,.33,.18+Math.sin(i*Math.PI/2)*.04],[.08,.08,.04],'#f0dfc1',head);part('herbal-flask','sphere',[.44,1.05,.19],[.14,.22,.14],'#427ccd');}
 if(kind==='pin'||kind==='kestrel'){for(const side of [-1,1]){part('goggle-rim'+side,'sphere',[side*.13,.23,.17],[.22,.18,.08],'#c6a559',head);part('goggle-glass'+side,'sphere',[side*.13,.23,.215],[.14,.11,.025],'#5b8298',head);}part('red-scarf','box',[0,.31,.17],[.42,.12,.1],'#b8493c',torso);part('scarf-tail','box',[-.25,.2,-.2],[.16,.4,.06],'#b8493c',torso);}
 if(kind==='elowen'){part('hood','sphere',[0,.06,-.12],[.69,.65,.38],spec.coat,head);part('robe','cone',[0,.53,0],[.75,1.02,.51],spec.trim);part('moon-emblem','sphere',[0,.62,.255],[.16,.17,.02],'#d4b765');}
 if(kind==='tovik'){part('apron','box',[0,-.08,.205],[.62,.75,.035],'#71513b',torso);part('neckerchief','box',[0,.3,.17],[.42,.1,.08],'#b8493c',torso);for(const side of [-1,1])part('moustache'+side,'sphere',[side*.07,-.13,.27],[.18,.07,.05],'#664726',head);part('tankard','box',[.44,1.13,.19],[.17,.22,.17],'#8c724b');}
 if(kind==='halden'||kind==='elowen'||kind==='yarrow'){part('lantern-frame','box',[-.43,.92,.15],[.18,.27,.18],'#655331');part('lantern-light','box',[-.43,.92,.245],[.11,.17,.018],'#f0ca65');}
 if(kind==='yarrow'){part('walking-staff','box',[.44,.76,.08],[.055,1.5,.055],'#796a4d');part('skull-badge','sphere',[0,.13,.22],[.12,.15,.04],'#dacfb5',torso);}
 if(kind!=='elowen')part('satchel','box',[.31,.91,-.12],[.25,.3,.15],'#806246');
 let disposed=false;return {...hero,prototype:kind,dispose(){if(disposed)return;disposed=true;hero.dispose();for(const m of materials.values())m.dispose();materials.clear();}};
}
