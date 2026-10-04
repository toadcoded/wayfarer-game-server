import { CHUNK_SIZE, GRID, surfaceAt, validateConfig, type WorldConfig, type Point } from './world.js';
import type { Primitive } from './geometry.js';

export interface XZ { x:number; z:number }
export interface Bounds { minX:number; maxX:number; minZ:number; maxZ:number }
export interface GroundSample { height:number; slopeDegrees:number; waterDepth:number }
export type GroundSampler = (x:number,z:number)=>GroundSample;
export interface Collider extends Bounds { id:string; minY:number; maxY:number }
export interface NavigationOptions {
 bounds:Bounds; cellSize?:number; radius?:number; height?:number;
 maxSlopeDegrees?:number; maxStepHeight?:number; maxWaterDepth?:number;
 sampleSpacing?:number;
}
export type BlockReason = 'bounds'|'water'|'slope'|'obstacle'|'step'|'invalid-ground';
export type WalkCheck = {ok:true;position:Point} | {ok:false;reason:BlockReason};
export interface PathResult {status:'found'|'blocked'|'unreachable'|'budget-exceeded';points:Point[];visited:number}
const finite=(n:number)=>Number.isFinite(n);
const distance=(a:XZ,b:XZ)=>Math.hypot(a.x-b.x,a.z-b.z);
function positive(n:number,name:string,max=10000):number {
 if(!finite(n)||n<=0||n>max)throw new RangeError(`Invalid ${name}`);return n;
}
function nonnegative(n:number,name:string,max=10000):number {
 if(!finite(n)||n<0||n>max)throw new RangeError(`Invalid ${name}`);return n;
}
function bounds(b:Bounds):void {
 if(![b.minX,b.maxX,b.minZ,b.maxZ].every(finite)||b.minX>=b.maxX||b.minZ>=b.maxZ)throw new RangeError('Invalid bounds');
}
/** Matches the diagonal and vertices in terrainMesh, rather than the smooth source function. */
export function terrainSampler(config:WorldConfig):GroundSampler {
 validateConfig(config);const world={...config},step=CHUNK_SIZE/GRID;
 // Bounded per-sampler cache; world config is immutable for this sampler's lifetime.
 const cells=new Map<string,{a:number;b:number;c:number;d:number;waterY:number|null}>();
 return (x,z)=>{
  const x0=Math.floor(x/step)*step,z0=Math.floor(z/step)*step,u=(x-x0)/step,v=(z-z0)/step;
  const key=`${x0}:${z0}`;let cell=cells.get(key);
  if(!cell){
   const wet=surfaceAt(world,x0+step/2,z0+step/2);
   cell={a:surfaceAt(world,x0,z0).height,b:surfaceAt(world,x0+step,z0).height,
    c:surfaceAt(world,x0,z0+step).height,d:surfaceAt(world,x0+step,z0+step).height,waterY:wet.water?wet.waterY:null};
   if(cells.size>=4096)cells.delete(cells.keys().next().value!);cells.set(key,cell);
  }
  const {a,b,c,d}=cell;
  const height=u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);
  const dx=(u+v<=1?b-a:d-c)/step,dz=(u+v<=1?c-a:d-b)/step;
  return {height,slopeDegrees:Math.atan(Math.hypot(dx,dz))*180/Math.PI,
   waterDepth:cell.waterY!==null?Math.max(0,cell.waterY-height):0};
 };
}
/** Conservative AABBs for cones/spheres; exact box colliders for box blockouts. */
export function collidersFromPrimitives(primitives:readonly Primitive[]):Collider[] {
 return primitives.filter(p=>p.collision==='solid').map(p=>({id:p.id,
  minX:p.position.x-p.size.x/2,maxX:p.position.x+p.size.x/2,
  minY:p.position.y-p.size.y/2,maxY:p.position.y+p.size.y/2,
  minZ:p.position.z-p.size.z/2,maxZ:p.position.z+p.size.z/2}));
}
function intersects(a:XZ,b:XZ,c:Bounds,r:number):boolean {
 let lo=0,hi=1;
 for(const [p,d,min,max] of [[a.x,b.x-a.x,c.minX-r,c.maxX+r],[a.z,b.z-a.z,c.minZ-r,c.maxZ+r]]){
  if(Math.abs(d!)<1e-12){if(p!<min!||p!>max!)return false;continue;}
  let near=(min!-p!)/d!,far=(max!-p!)/d!;if(near>far)[near,far]=[far,near];
  lo=Math.max(lo,near);hi=Math.min(hi,far);if(lo>hi)return false;
 }
 return true;
}
/** A bounded local navigation area. Server and client can each maintain one. */
export class NavigationWorld {
 readonly options:Readonly<Required<NavigationOptions>>;
 private colliders=new Map<string,Collider>();
 private revisionNumber=0;
 get revision():number{return this.revisionNumber;}
 constructor(private readonly sample:GroundSampler,opts:NavigationOptions){
  bounds(opts.bounds);
  const cellSize=positive(opts.cellSize??2,'cell size',64);
  if(cellSize<.25||(opts.sampleSpacing??.25)<.05)throw new RangeError('Cell size must be >= .25 and sample spacing >= .05');
  const nx=Math.ceil((opts.bounds.maxX-opts.bounds.minX)/cellSize),nz=Math.ceil((opts.bounds.maxZ-opts.bounds.minZ)/cellSize);
  if(nx*nz>65536)throw new RangeError('Navigation area exceeds 65536 cells; partition it');
  this.options=Object.freeze({bounds:Object.freeze({...opts.bounds}),cellSize,
   radius:nonnegative(opts.radius??.35,'radius',8),height:positive(opts.height??1.8,'height',20),
   maxSlopeDegrees:nonnegative(opts.maxSlopeDegrees??40,'slope',89),
   maxStepHeight:nonnegative(opts.maxStepHeight??.35,'step height',4),
   maxWaterDepth:nonnegative(opts.maxWaterDepth??.15,'water depth',20),
   sampleSpacing:positive(opts.sampleSpacing??.25,'sample spacing',1)});
 }
 upsertCollider(c:Collider):void {
  bounds(c);if(!c.id||!finite(c.minY)||!finite(c.maxY)||c.minY>=c.maxY)throw new Error('Invalid collider');
  this.colliders.set(c.id,{...c});this.revisionNumber++;
 }
 removeCollider(id:string):boolean {const found=this.colliders.delete(id);if(found)this.revisionNumber++;return found;}
 /** The host must add all relevant prop/structure colliders, including neighboring chunk overlaps. */
 addPrimitives(primitives:readonly Primitive[]):void {for(const c of collidersFromPrimitives(primitives))this.upsertCollider(c);}
 private ground(p:XZ):GroundSample|null {
  const s=this.sample(p.x,p.z);
  return [s.height,s.slopeDegrees,s.waterDepth].every(finite)&&s.slopeDegrees>=0&&s.waterDepth>=0?s:null;
 }
 check(p:XZ):WalkCheck {
  const o=this.options,b=o.bounds,r=o.radius;
  if(!finite(p.x)||!finite(p.z)||p.x-r<b.minX||p.x+r>b.maxX||p.z-r<b.minZ||p.z+r>b.maxZ)return {ok:false,reason:'bounds'};
  const center=this.ground(p);if(!center)return {ok:false,reason:'invalid-ground'};
  // Nine footprint samples. This is a heightfield walker, not rigid-body physics.
  for(const [dx,dz] of [[0,0],[r,0],[-r,0],[0,r],[0,-r],[r*.707,r*.707],[-r*.707,r*.707],[r*.707,-r*.707],[-r*.707,-r*.707]]){
   const s=this.ground({x:p.x+dx!,z:p.z+dz!});if(!s)return {ok:false,reason:'invalid-ground'};
   if(s.waterDepth>o.maxWaterDepth)return {ok:false,reason:'water'};
   if(s.slopeDegrees>o.maxSlopeDegrees)return {ok:false,reason:'slope'};
   if(Math.abs(s.height-center.height)>o.maxStepHeight+Math.hypot(dx!,dz!)*Math.tan(o.maxSlopeDegrees*Math.PI/180))return {ok:false,reason:'step'};
  }
  for(const c of this.colliders.values())if(center.height<c.maxY && center.height+o.height>c.minY && intersects(p,p,c,r))return {ok:false,reason:'obstacle'};
  return {ok:true,position:{x:p.x,y:center.height,z:p.z}};
 }
 traverse(a:XZ,b:XZ):WalkCheck {
  const length=distance(a,b);if(!finite(length)||length>256)return {ok:false,reason:'bounds'};
  let current=this.check(a);if(!current.ok)return current;
  let minY=current.position.y,maxY=minY,previousY=minY;
  const count=Math.max(1,Math.ceil(length/this.options.sampleSpacing)),stride=length/count;
  for(let i=1;i<=count;i++){
   current=this.check({x:a.x+(b.x-a.x)*i/count,z:a.z+(b.z-a.z)*i/count});if(!current.ok)return current;
   if(Math.abs(current.position.y-previousY)>this.options.maxStepHeight+stride*Math.tan(this.options.maxSlopeDegrees*Math.PI/180))return {ok:false,reason:'step'};
   previousY=current.position.y;minY=Math.min(minY,previousY);maxY=Math.max(maxY,previousY);
  }
  // Analytic sweep catches arbitrarily thin walls between footprint samples.
  for(const c of this.colliders.values())if(minY<c.maxY&&maxY+this.options.height>c.minY&&intersects(a,b,c,this.options.radius))return {ok:false,reason:'obstacle'};
  return current;
 }
 findPath(start:XZ,goal:XZ,maxVisited=4096):PathResult {
  if(!Number.isInteger(maxVisited)||maxVisited<1||maxVisited>65536)throw new RangeError('Invalid path budget');
  const first=this.check(start),last=this.check(goal);
  if(!first.ok||!last.ok)return {status:'blocked',points:[],visited:0};
  if(this.traverse(start,goal).ok)return {status:'found',points:[first.position,last.position],visited:0};
  const {bounds:b,cellSize:s}=this.options,nx=Math.ceil((b.maxX-b.minX)/s),nz=Math.ceil((b.maxZ-b.minZ)/s);
  const cell=(p:XZ)=>({x:Math.min(nx-1,Math.floor((p.x-b.minX)/s)),z:Math.min(nz-1,Math.floor((p.z-b.minZ)/s))});
  const point=(x:number,z:number):XZ=>({x:b.minX+(x+.5)*s,z:b.minZ+(z+.5)*s});
  const sc=cell(start),gc=cell(goal),startKey=sc.z*nx+sc.x,goalKey=gc.z*nx+gc.x;
  if(!this.traverse(start,point(sc.x,sc.z)).ok||!this.traverse(point(gc.x,gc.z),goal).ok)return {status:'blocked',points:[],visited:0};
  const costs=new Map<number,number>([[startKey,0]]),parents=new Map<number,number>(),closed=new Set<number>();
  const open=new MinHeap();open.push({id:startKey,g:0,f:distance(point(sc.x,sc.z),point(gc.x,gc.z))});
  while(open.size){
   const node=open.pop()!;if(closed.has(node.id)||node.g!==costs.get(node.id))continue;
   if(closed.size>=maxVisited)return {status:'budget-exceeded',points:[],visited:closed.size};
   closed.add(node.id);
   if(node.id===goalKey){
    const chain:number[]=[goalKey];while(chain[chain.length-1]!==startKey)chain.push(parents.get(chain[chain.length-1]!)!);
    chain.reverse();const points=[first.position];
    for(const id of chain){const p=point(id%nx,Math.floor(id/nx));const c=this.check(p);if(!c.ok)return {status:'blocked',points:[],visited:closed.size};points.push(c.position);}
    points.push(last.position);return {status:'found',points,visited:closed.size};
   }
   const x=node.id%nx,z=Math.floor(node.id/nx),from=point(x,z);
   for(const [dx,dz] of [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[-1,-1],[1,-1]]){
    const xx=x+dx!,zz=z+dz!;if(xx<0||zz<0||xx>=nx||zz>=nz)continue;
    const id=zz*nx+xx;if(closed.has(id))continue;const to=point(xx,zz);
    if(!this.traverse(from,to).ok)continue;
    const g=node.g+distance(from,to);if(g>=(costs.get(id)??Infinity))continue;
    costs.set(id,g);parents.set(id,node.id);open.push({id,g,f:g+distance(to,point(gc.x,gc.z))});
   }
  }
  return {status:'unreachable',points:[],visited:closed.size};
 }
}
interface HeapNode {id:number;g:number;f:number}
class MinHeap {
 private items:HeapNode[]=[];
 get size(){return this.items.length;}
 private less(a:HeapNode,b:HeapNode){return a.f<b.f||(a.f===b.f&&a.id<b.id);}
 push(node:HeapNode){let i=this.items.push(node)-1;while(i>0){const p=(i-1)>>1;if(!this.less(node,this.items[p]!))break;this.items[i]=this.items[p]!;i=p;}this.items[i]=node;}
 pop():HeapNode|undefined {
  const root=this.items[0],tail=this.items.pop();if(!this.items.length)return root;
  let i=0;while(i*2+1<this.items.length){let child=i*2+1;if(child+1<this.items.length&&this.less(this.items[child+1]!,this.items[child]!))child++;
   if(!this.less(this.items[child]!,tail!))break;this.items[i]=this.items[child]!;i=child;}
  this.items[i]=tail!;return root;
 }
}
