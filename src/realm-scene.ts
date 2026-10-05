import {terrainSampler} from './navigation.js';
import {planCrossing,mountCrossing} from './crossings.js';
import {generateChunk,CHUNK_SIZE} from './world.js';
import {reserveSites} from './site-placement.js';
import {propPrimitives,type Primitive} from './geometry.js';
import {REALM_CONTRACT} from './realm-contract.js';
import {cavernCandidates,expandedRealmBounds,observatoryCandidates,ORCHARD_TREE_OFFSETS} from './world-sites.js';
export const REALM_WORLD = {seed:REALM_CONTRACT.worldSeed,generatorVersion:REALM_CONTRACT.generatorVersion} as const;
/** Shared deterministic rehearsal geometry and collision setup, independently built on each side. */
export function createRealmScene(){
 const base=terrainSampler(REALM_WORLD);
 const plan=planCrossing(base,{id:'local-realm',style:'willowglass',z:0,minX:-16,maxX:176});
 plan.bounds=expandedRealmBounds(plan.bounds);
 const mounted=mountCrossing(base,plan,.45),b=plan.bounds;
 const orchardTrees=ORCHARD_TREE_OFFSETS.map((offset,index)=>{
  const x=plan.start.x+offset.x,z=plan.start.z+offset.z,y=mounted.construction.terrainAt(x,z).height;
  return {id:`celestial-orchard-tree:${index}`,x,y,z};
 });
 for(const tree of orchardTrees)mounted.navigation.upsertCollider({id:tree.id,minX:tree.x-.36,maxX:tree.x+.36,minZ:tree.z-.36,maxZ:tree.z+.36,minY:tree.y,maxY:tree.y+3.8});
 const findSite=(candidates:readonly {x:number;z:number}[])=>{
  for(const candidate of candidates){const checked=mounted.navigation.check(candidate);if(checked.ok)return checked.position;}
  throw new Error('Expanded realm needs a walkable landmark site');
 };
 const codexPoint=findSite(observatoryCandidates(plan.start)),cavernPoint=findSite(cavernCandidates(plan.goal));
 const clearings=[{x:plan.start.x,z:plan.start.z,radius:15},{x:plan.goal.x,z:plan.goal.z,radius:12},{x:codexPoint.x,z:codexPoint.z,radius:12},{x:cavernPoint.x,z:cavernPoint.z,radius:12}];
 const worldPrimitives:Primitive[]=[];
 for(let cz=Math.floor(b.minZ/CHUNK_SIZE);cz<=Math.floor(b.maxZ/CHUNK_SIZE);cz++)for(let cx=Math.floor(b.minX/CHUNK_SIZE);cx<=Math.floor(b.maxX/CHUNK_SIZE);cx++){
  const chunk=reserveSites(generateChunk(REALM_WORLD,cx,cz),[plan]);
  const props=chunk.props.filter(p=>p.position.x>=b.minX&&p.position.x<=b.maxX&&p.position.z>=b.minZ&&p.position.z<=b.maxZ)
   .filter(p=>!clearings.some(site=>Math.hypot(p.position.x-site.x,p.position.z-site.z)<site.radius))
   .map(p=>({...p,position:{...p.position,y:mounted.construction.terrainAt(p.position.x,p.position.z).height}}));
  const primitives=propPrimitives({...chunk,props});worldPrimitives.push(...primitives);mounted.navigation.addPrimitives(primitives);
 }
 return {plan,...mounted,worldPrimitives,orchardTrees,codexPoint,cavernPoint};
}

export function realmCodexPoint(realm:ReturnType<typeof createRealmScene>){return {...(realm.codexPoint??realm.plan.start)};}
export function realmCavernPoint(realm:ReturnType<typeof createRealmScene>){return {...realm.cavernPoint};}
