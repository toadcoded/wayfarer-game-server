import type { Chunk } from './world.js';
import { landmarkPrimitives,propPrimitives } from './geometry.js';
import { NavigationWorld,collidersFromPrimitives } from './navigation.js';
/** Register generated chunk colliders once, and remove only their owned ids on unload. */
export class NavigationChunks {
 private owned=new Map<string,string[]>();
 constructor(private readonly navigation:NavigationWorld){}
 mount(chunk:Chunk):void {
  if(this.owned.has(chunk.id))return;
  const colliders=collidersFromPrimitives([...landmarkPrimitives(chunk),...propPrimitives(chunk)]);
  // Namespace avoids colliding with host-managed dynamic gate identifiers.
  const ids:string[]=[];
  for(const c of colliders){const id=`static:${c.id}`;this.navigation.upsertCollider({...c,id});ids.push(id);}
  this.owned.set(chunk.id,ids);
 }
 unmount(chunkId:string):void {
  const ids=this.owned.get(chunkId);if(!ids)return;
  for(const id of ids)this.navigation.removeCollider(id);this.owned.delete(chunkId);
 }
 dispose():void {for(const id of this.owned.keys())this.unmount(id);}
}
