import { generateChunk,CHUNK_SIZE,type WorldConfig } from './world.js';
import {terrainSampler} from './navigation.js';
import {propPrimitives,type Primitive} from './geometry.js';
import {surfaceMesh,railMeshes,type MeshData} from './construction.js';
import {CROSSING_STYLES,mountCrossing,type CrossingPlan} from './crossings.js';
import {reserveSites} from './site-placement.js';
/** Literal low-poly primitive geometry; no external assets or renderer dependency. */
export function primitiveMesh(p:Primitive):MeshData {
 const {position:a,size:s}=p;
 if(![a.x,a.y,a.z,s.x,s.y,s.z].every(Number.isFinite)||Math.min(s.x,s.y,s.z)<=0)throw new Error('Invalid primitive dimensions');
 let vertices:number[][],indices:number[];
 if(p.shape==='box'){
  vertices=[[-1,1,-1],[1,1,-1],[-1,1,1],[1,1,1],[-1,-1,-1],[1,-1,-1],[-1,-1,1],[1,-1,1]];
  indices=[0,2,1,1,2,3,4,5,6,5,7,6,0,1,4,1,5,4,2,6,3,3,6,7,0,4,2,2,4,6,1,3,5,3,7,5];
 }else if(p.shape==='sphere'){
  // Rounded render mesh within the original full extents; collider semantics stay unchanged.
  vertices=[[0,1,0],[0,-1,0]];indices=[];
  const rings=5,segments=12;
  for(let r=1;r<=rings;r++){const phi=Math.PI*r/(rings+1);for(let i=0;i<segments;i++){const theta=i*2*Math.PI/segments;vertices.push([Math.sin(phi)*Math.cos(theta),Math.cos(phi),Math.sin(phi)*Math.sin(theta)]);}}
  for(let i=0;i<segments;i++){const next=(i+1)%segments;indices.push(0,2+next,2+i,1,2+(rings-1)*segments+i,2+(rings-1)*segments+next);}
  for(let r=0;r<rings-1;r++)for(let i=0;i<segments;i++){const next=(i+1)%segments,a=2+r*segments+i,b=2+r*segments+next,c=a+segments,d=b+segments;indices.push(a,b,c,b,d,c);}

 }else{
  vertices=[[0,1,0],[0,-1,0]];indices=[];
  for(let i=0;i<8;i++){const t=i*Math.PI/4;vertices.push([Math.cos(t),-1,Math.sin(t)]);}
  for(let i=0;i<8;i++){const next=(i+1)%8;indices.push(0,next+2,i+2,1,i+2,next+2);}
 }
 return {positions:new Float32Array(vertices.flatMap(v=>[a.x+v[0]!*s.x/2,a.y+v[1]!*s.y/2,a.z+v[2]!*s.z/2])),indices:new Uint32Array(indices),color:p.color};
}
/** A bounded reference scene, using the same construction definition as the walker. */
export function crossingScene(world:WorldConfig,plan:CrossingPlan):MeshData[] {
 const base=terrainSampler(world),{construction}=mountCrossing(base,plan),style=CROSSING_STYLES[plan.style],b=plan.bounds;
 const meshes:MeshData[]=[construction.terrainMesh(b,style.ground)];
 for(const s of plan.surfaces)meshes.push(surfaceMesh(s),...railMeshes(s));
 for(const p of plan.primitives)meshes.push(primitiveMesh(p));
 // Same four-unit water-cell convention as the base world. Clip edge cells to scene bounds.
 for(let z=Math.floor(b.minZ/4)*4;z<b.maxZ;z+=4)for(let x=Math.floor(b.minX/4)*4;x<b.maxX;x+=4){
  const sample=base(x+2,z+2);if(sample.waterDepth<=0)continue;
  const y=sample.height+sample.waterDepth;
  if(construction.terrainAt(x+2,z+2).height>=y)continue;
  const x0=Math.max(x,b.minX),x1=Math.min(x+4,b.maxX),z0=Math.max(z,b.minZ),z1=Math.min(z+4,b.maxZ);
  meshes.push({positions:new Float32Array([x0,y,z0,x1,y,z0,x0,y,z1,x1,y,z1]),indices:new Uint32Array([0,2,1,1,2,3]),color:style.water});
 }
 for(let cz=Math.floor(b.minZ/CHUNK_SIZE);cz<=Math.floor(b.maxZ/CHUNK_SIZE);cz++)for(let cx=Math.floor(b.minX/CHUNK_SIZE);cx<=Math.floor(b.maxX/CHUNK_SIZE);cx++){
  const chunk=reserveSites(generateChunk(world,cx,cz),[plan]);
  const props=chunk.props.filter(p=>p.position.x>=b.minX&&p.position.x<=b.maxX&&p.position.z>=b.minZ&&p.position.z<=b.maxZ)
   .map(p=>({...p,position:{...p.position,y:construction.terrainAt(p.position.x,p.position.z).height}}));
  for(const p of propPrimitives({...chunk,props}))meshes.push(primitiveMesh(p));
 }
 return meshes;
}
