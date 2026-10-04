/** Independent input sources prevent one release from cancelling another hold. */
export class DirectionInput {
 private keys=new Map<string,string>();
 private pointers=new Map<number,string>();
 keyDown(key:string,code?:string):boolean {
  const direction=key.startsWith('Arrow')?key:({KeyW:'ArrowUp',KeyA:'ArrowLeft',KeyS:'ArrowDown',KeyD:'ArrowRight'} as Record<string,string>)[code??''];
  if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(direction??''))return false;
  this.keys.set(code||key,direction!);return true;
 }
 keyUp(key:string,code?:string){this.keys.delete(code||key);}
 pointerDown(id:number,direction:string){this.pointers.set(id,direction);}
 pointerUp(id:number){this.pointers.delete(id);}
 has(direction:string){return [...this.keys.values(),...this.pointers.values()].includes(direction);}
 clear(){this.keys.clear();this.pointers.clear();}
}
