import {ART_DIRECTORY,isArtId,type ArtId} from './art-directory.js';
import {Scene,TransformNode,MeshBuilder,StandardMaterial,Texture,Color3} from '@babylonjs/core';
import type {Point} from './world.js';
export const PAINTING_URL='/preview/art/causeway-adventurer.jpeg';
/** One locally bundled portrait on a decorative tavern wall. */
export function createWallPainting(scene:Scene,position:Point,loadTexture=true,artId:ArtId='adventurer'){
 if(!isArtId(artId)||![position.x,position.y,position.z].every(Number.isFinite))throw Error('Invalid painting placement');
 const art=ART_DIRECTORY[artId];let generation=0,disposed=false,state: "placeholder"|"loading"|"ready"|"unavailable"="placeholder";
 const root=new TransformNode('tavern-art-wall',scene);root.position.set(position.x,position.y,position.z);
 const wood=new StandardMaterial('art-wall-wood',scene);wood.diffuseColor=Color3.FromHexString('#634b37');wood.specularColor=Color3.Black();
 const gold=new StandardMaterial('art-frame-gold',scene);gold.diffuseColor=Color3.FromHexString('#b7934f');gold.specularColor=Color3.Black();
 const paper=new StandardMaterial('art-canvas',scene);paper.diffuseColor=Color3.White();paper.specularColor=Color3.Black();paper.emissiveColor=new Color3(.12,.12,.12);
 let texture:Texture|undefined;
 const unavailable=()=>state==='unavailable';
 const retryTexture=()=>{
  if(disposed||!loadTexture||state==='loading')return;
  const attempt=++generation;state='loading';paper.diffuseTexture=null;texture?.dispose();texture=undefined;paper.diffuseColor=Color3.White();
  const fail=()=>{if(!disposed&&attempt===generation){state='unavailable';paper.diffuseTexture=null;paper.diffuseColor=Color3.FromHexString('#aa9872');}};
  try{texture=new Texture(art.url,scene,false,true,Texture.TRILINEAR_SAMPLINGMODE,()=>{if(!disposed&&attempt===generation)state='ready';},fail);if(!unavailable())paper.diffuseTexture=texture;}catch{fail();}
 };retryTexture();
 const box=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,material:StandardMaterial)=>{const m=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.parent=root;m.position.set(x,y,z);m.material=material;m.isPickable=false;m.checkCollisions=false;return m;};
 box('tavern-wall',0,1.55,0,3.2,3.1,.18,wood);
 const width=art.worldWidth,height=width*art.height/art.width,centre=1.9;
 for(const side of [-1,1]){box('painting-frame-side'+side,side*(width/2+.045),centre,.16,.09,height+.18,.09,gold);box('painting-frame-rail'+side,0,centre+side*(height/2+.045),.16,width,.09,.09,gold);}
 const canvas=MeshBuilder.CreatePlane(artId==='adventurer'?'causeway-adventurer-painting':'harvest-festival-painting',{width,height},scene);canvas.parent=root;canvas.position.set(0,centre,.145);canvas.rotation.y=Math.PI;canvas.material=paper;canvas.isPickable=false;canvas.checkCollisions=false;
 return {root,canvas,title:art.title,get texture(){return texture;},get state(){return state;},retryTexture,dispose(){if(disposed)return;disposed=true;root.dispose();texture?.dispose();wood.dispose();gold.dispose();paper.dispose();}};
}
