import {terrainSampler} from './navigation.js';
import {planCrossing,mountCrossing} from './crossings.js';
import {generateChunk,CHUNK_SIZE} from './world.js';
import {reserveSites} from './site-placement.js';
import {propPrimitives} from './geometry.js';
import {REALM_CONTRACT} from './realm-contract.js';
export const REALM_WORLD = {seed:REALM_CONTRACT.worldSeed,generatorVersion:REALM_CONTRACT.generatorVersion} as const;
/** Shared deterministic rehearsal geometry and collision setup, independently built on each side. */
export function createRealmScene(){
 const base=terrainSampler(REALM_WORLD);
 const plan=planCrossing(base,{id:'local-realm',style:'willowglass',z:0,minX:-16,maxX:176});
 const mounted=mountCrossing(base,plan),b=plan.bounds;
 for(let cz=Math.floor(b.minZ/CHUNK_SIZE);cz<=Math.floor(b.maxZ/CHUNK_SIZE);cz++)for(let cx=Math.floor(b.minX/CHUNK_SIZE);cx<=Math.floor(b.maxX/CHUNK_SIZE);cx++){
  const chunk=reserveSites(generateChunk(REALM_WORLD,cx,cz),[plan]);
  const props=chunk.props.filter(p=>p.position.x>=b.minX&&p.position.x<=b.maxX&&p.position.z>=b.minZ&&p.position.z<=b.maxZ)
   .map(p=>({...p,position:{...p.position,y:mounted.construction.terrainAt(p.position.x,p.position.z).height}}));
  mounted.navigation.addPrimitives(propPrimitives({...chunk,props}));
 }
 return {plan,...mounted};
}
