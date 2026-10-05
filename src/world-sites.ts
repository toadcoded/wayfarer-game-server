import type {Bounds,XZ} from './navigation.js';

/** Expanded, still bounded play space around the original causeway route. */
export const REALM_MAP_PADDING=Object.freeze({x:32,z:64});
export function expandedRealmBounds(bounds:Bounds):Bounds {
 return {
  minX:bounds.minX-REALM_MAP_PADDING.x,
  maxX:bounds.maxX+REALM_MAP_PADDING.x,
  minZ:Math.min(bounds.minZ,-REALM_MAP_PADDING.z),
  maxZ:Math.max(bounds.maxZ,REALM_MAP_PADDING.z),
 };
}

/** Shared orchard trunk positions, relative to the camp; render and collision use this list. */
export const ORCHARD_TREE_OFFSETS:readonly XZ[]=Object.freeze(Array.from({length:5},(_,i)=>{
 const angle=(i/5)*Math.PI*2+.35,radius=8.5+(i%2)*2.4;
 return Object.freeze({x:Math.cos(angle)*radius,z:Math.sin(angle)*radius});
}));

/** Clear, walkable sites deliberately separated from the camp orchard and the far landing. */
export function observatoryCandidates(anchor:XZ):readonly XZ[] {
 return [
  {x:anchor.x+26,z:anchor.z+25},
  {x:anchor.x-26,z:anchor.z+25},
  {x:anchor.x+26,z:anchor.z-25},
  {x:anchor.x-26,z:anchor.z-25},
  {x:anchor.x,z:anchor.z+34},
  {x:anchor.x,z:anchor.z-34},
 ];
}
export function cavernCandidates(anchor:XZ):readonly XZ[] {
 return [
  {x:anchor.x+26,z:anchor.z+25},
  {x:anchor.x+26,z:anchor.z-25},
  {x:anchor.x-26,z:anchor.z+25},
  {x:anchor.x-26,z:anchor.z-25},
  {x:anchor.x,z:anchor.z+34},
  {x:anchor.x,z:anchor.z-34},
 ];
}
