import {loadSpriteSheet} from './asset-fetch.js';
import {CharacterMotion,keyMagenta,animationFrame} from './character-motion.js';
import {CHARACTER_ASSETS} from './character-assets.js';
import type {Point} from './world.js';
const sheets=new Map<string,HTMLCanvasElement>();
// Asset failures preserve the vector fallback; fetching is shared and bounded.
if(typeof createImageBitmap==='function')for(const asset of CHARACTER_ASSETS){
 loadSpriteSheet(asset.id,asset.width*asset.frames,asset.height).then(canvas=>{
  const ctx=canvas.getContext('2d')!,pixels=ctx.getImageData(0,0,canvas.width,canvas.height);keyMagenta(pixels.data);ctx.putImageData(pixels,0,0);sheets.set(asset.id,canvas);
 }).catch(()=>{});
}
export class CharacterRenderer {
 private motions=new Map<string,CharacterMotion>();
 private reduced=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):undefined;
 clear():void{this.motions.clear();}
 retain(ids:readonly string[]):void{const keep=new Set(ids);for(const id of this.motions.keys())if(!keep.has(id))this.motions.delete(id);}
 draw(ctx:CanvasRenderingContext2D,id:string,position:Point,q:{x:number;y:number},now:number,skin='adventurer',local=true,paused=false):void {
  let motion=this.motions.get(id);if(!motion){motion=new CharacterMotion();this.motions.set(id,motion);}
  const pose=motion.sample(position,now,this.reduced?.matches||paused),bob=Math.abs(Math.sin(pose.phase))*pose.stride*1.5;
  ctx.save();ctx.translate(q.x,q.y);ctx.fillStyle='#0e211a88';ctx.beginPath();ctx.ellipse(0,0,9,3,0,0,Math.PI*2);ctx.fill();
  ctx.translate(0,-bob);ctx.rotate(pose.lean*.3);
  const asset=CHARACTER_ASSETS.find(a=>a.id===skin),sheet=asset?sheets.get(asset.id):undefined;
  if(asset&&sheet){
   const crop=asset.crop,h=asset.id==='seraphine'?60:46,w=h*crop.width/crop.height;
   const total=asset.durationsMs.reduce((a,b)=>a+b,0),frame=pose.stride>.05?animationFrame(asset.durationsMs,pose.phase/(2*Math.PI)*total):0;
   ctx.imageSmoothingEnabled=asset.id==='seraphine';
   ctx.drawImage(sheet,frame*asset.width+crop.x,crop.y,crop.width,crop.height,-w/2,-h,w,h);
  }else{
   const stride=Math.sin(pose.phase)*pose.stride*5;
   // A small articulated silhouette with spring-driven cape, arms and legs.
   ctx.fillStyle=local?'#536b42':'#376477';ctx.beginPath();ctx.moveTo(-6,-29);ctx.lineTo(7,-29);ctx.lineTo(10+pose.cloth*25,-7);ctx.lineTo(-10+pose.cloth*25,-7);ctx.closePath();ctx.fill();
   ctx.strokeStyle='#493b2e';ctx.lineWidth=5;ctx.lineCap='round';
   for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*3,-13);ctx.lineTo(side*4+side*stride,-2);ctx.stroke();}
   ctx.fillStyle=local?'#a18a50':'#65a2b4';ctx.beginPath();ctx.ellipse(0,-23,6,10,0,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='#c79668';ctx.lineWidth=3;
   for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*5,-28);ctx.lineTo(side*8-side*stride,-17);ctx.stroke();}
   ctx.fillStyle='#cfa477';ctx.beginPath();ctx.arc(0,-37,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#382b22';ctx.beginPath();ctx.ellipse(0,-40,5.5,3,0,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
}
