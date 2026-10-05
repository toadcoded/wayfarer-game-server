import {BIOMES,CHUNK_SIZE,GRID,type Chunk,type Point,type WorldConfig,surfaceAt,type BiomeId} from './world.js';
/** Engine-independent triangle buffers. Each vertex stores three world coordinates. */
export interface TerrainMesh { positions:Float32Array; indices:Uint32Array; color:string; walkable?:boolean }
export function terrainMesh(chunk:Chunk):TerrainMesh {
 const positions=new Float32Array((GRID+1)*(GRID+1)*3),indices=new Uint32Array(GRID*GRID*6);
 const step=CHUNK_SIZE/GRID;
 for(let z=0;z<=GRID;z++)for(let x=0;x<=GRID;x++) {
  const v=z*(GRID+1)+x;
  positions.set([chunk.cx*CHUNK_SIZE+x*step,chunk.heights[v]!,chunk.cz*CHUNK_SIZE+z*step],v*3);
 }
 let n=0;
 for(let z=0;z<GRID;z++)for(let x=0;x<GRID;x++){
  const a=z*(GRID+1)+x,b=a+1,c=a+GRID+1,d=c+1;
  // Counter-clockwise from above (+Y).
  indices.set([a,c,b,b,c,d],n);n+=6;
 }
 return {positions,indices,color:BIOMES[chunk.region.biome].palette.ground};
}
export interface Primitive {
 id:string; shape:'box'|'cone'|'sphere'; position:Point;
 /** Full extents in world units; primitive centered at position. */
 size:Point; color:string; collision:'solid'|'none';
}
/** Low-poly blockouts. Replace asset appearance while preserving semantic IDs. */
export function landmarkPrimitives(chunk:Chunk):Primitive[] {
 const out:Primitive[]=[];
 for(const l of chunk.landmarks){
  let index=0;
  const add=(shape:Primitive['shape'],dx:number,dy:number,dz:number,sx:number,sy:number,sz:number,color:string,solid=true)=>{
   out.push({id:`${l.id}:${index++}`,shape,position:{x:l.position.x+dx,y:l.position.y+dy,z:l.position.z+dz},
    size:{x:sx,y:sy,z:sz},color,collision:solid?'solid':'none'});
  };
  const stone='#787B70',wood='#73583C';
  switch(l.kind){
   case 'stronghold':
    add('box',0,4,-14,30,8,2,stone);add('box',-14,4,0,2,8,28,stone);add('box',14,4,0,2,8,28,stone);
    // Front wall split for an eight-unit traversable gate opening.
    add('box',-9.5,4,14,11,8,2,stone);add('box',9.5,4,14,11,8,2,stone);
    add('box',0,9,14,8,2,2,stone);
    add('box',0,5,-4,12,10,10,stone);break;
   case 'pyramid':
    for(let i=0;i<7;i++)add('box',0,i*2+1,0,28-i*3.5,2,28-i*3.5,'#BD8451');break;
   case 'garden':
    // Fence segments leave the front approach clear; garden beds are decorative.
    add('box',0,1,-10,22,2,.4,wood);add('box',-11,1,0,.4,2,20,wood);add('box',11,1,0,.4,2,20,wood);
    add('box',-7,1,10,8,2,.4,wood);add('box',7,1,10,8,2,.4,wood);
    for(const x of [-6,6])for(const z of [-5,5])add('box',x,.2,z,5,.4,5,'#977653',false);break;
   case 'barrow':
    add('sphere',0,0,0,24,10,20,'#63704E');
    for(const x of [-5,0,5])add('box',x,1.5,12,1.2,3,.6,stone);break;
   case 'shrine':
    add('box',0,.5,0,12,1,12,stone);
    for(const x of [-4,4])for(const z of [-4,4])add('box',x,4,z,1,7,1,stone);
    add('box',0,8,0,12,1,12,stone);break;
   case 'bridge':
    // A blockout at a landmark anchor, NOT a fitted river crossing.
    add('box',0,1,0,8,1,24,wood);add('box',-4,2.5,0,.4,2,24,wood);add('box',4,2.5,0,.4,2,24,wood);break;
   case 'village':
    for(const x of [-8,8]){add('box',x,3,0,8,6,8,'#AA9670');add('cone',x,8,0,12,4,12,wood);}break;
  }
 }
 return out;
}
/** Simple cell-center water planes; coastline clipping and smoothing belong to the renderer. */
export function waterCells(config:WorldConfig,chunk:Chunk):Array<{position:Point;size:number;color:string}> {
 const cells:Array<{position:Point;size:number;color:string}>=[],size=CHUNK_SIZE/GRID;
 for(let z=0;z<GRID;z++)for(let x=0;x<GRID;x++){
  if(chunk.waterDepths[z*GRID+x]!<=0)continue;
  const wx=chunk.cx*CHUNK_SIZE+(x+.5)*size,wz=chunk.cz*CHUNK_SIZE+(z+.5)*size;
  const s=surfaceAt(config,wx,wz);
  if(s.water)cells.push({position:{x:wx,y:s.waterY!,z:wz},size,color:BIOMES[chunk.region.biome].palette.water});
 }
 return cells;
}
export function groundColor(biome:BiomeId):string{return BIOMES[biome].palette.ground;}

/** Shared low-poly prop dimensions for renderers and server collider construction. */
export function propPrimitives(chunk:Chunk):Primitive[] {
 const out:Primitive[]=[];
 for(const p of chunk.props){
  let n=0;const s=p.scale;
  const add=(shape:Primitive['shape'],x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string,solid=false)=>
   out.push({id:`${p.id}:${n++}`,shape,position:{x:p.position.x+x*s,y:p.position.y+y*s,z:p.position.z+z*s},
    size:{x:sx*s,y:sy*s,z:sz*s},color,collision:solid?'solid':'none'});
  switch(p.kind){
   case 'tree':add('box',0,2,0,.7,4,.7,'#72533B',true);add('cone',0,4,0,4,5,4,'#355B38');break;
   case 'rock':add('sphere',0,.5,0,1.7,1.3,1.5,'#7E8177',true);break;
   case 'flower':add('box',0,.25,0,.08,.5,.08,'#5D7D3D');add('sphere',0,.55,0,.35,.18,.35,'#D7BB69');break;
   case 'reed':for(const x of [-.25,0,.25]){add('box',x,.65,0,.06,1.3,.06,'#7D8A4C');add('box',x,1.3,0,.1,.3,.1,'#856843');}break;
   case 'cactus':add('box',0,1.5,0,.7,3,.7,'#688B56',true);add('box',.65,1.5,0,.7,.3,.3,'#688B56');add('box',.9,1.9,0,.3,1.1,.3,'#688B56');break;
   case 'palm':add('box',0,3,0,.6,6,.6,'#987447',true);add('sphere',0,6,0,6,.8,2,'#5D8D4E');add('sphere',0,6,0,2,.8,6,'#5D8D4E');break;
   case 'crystal':add('cone',0,1,0,1.2,2,1.2,'#81B8C1',true);break;
   case 'ruin':add('box',0,1.2,0,1.2,2.4,1.2,'#8E8978',true);add('box',.8,.3,.4,1.3,.6,1.1,'#8E8978',true);break;
  }
 }
 return out;
}
