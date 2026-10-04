import {SoftPatch} from './soft-patch.js';
import {Multitool} from './multitool.js';
/** Testable local controller shared by mesh UI buttons and shortcuts. */
export class SoftTools {
 readonly patch=new SoftPatch();paused=false;reducedMotion=false;selected=45;lastMessage='Select a cloth point or use the point selector.';
 readonly registry:Multitool;
 constructor(onFocus:()=>void=()=>{},onWireframe:()=>void=()=>{}){
  const motionGate=()=>this.reducedMotion?'Reduced motion is enabled':undefined;
  this.registry=new Multitool([
   {id:'pause',label:'Pause / resume',tooltip:'Toggle cloth simulation',key:'p',run:()=>{this.paused=!this.paused;}},
   {id:'step',label:'Single step',tooltip:'Advance one 120 Hz cloth step while paused',key:'.',unavailable:()=>motionGate()??(!this.paused?'Pause cloth first':undefined),run:()=>{this.patch.advance(1000/120);}},
   {id:'push',label:'Apply impulse',tooltip:'Push nearby unpinned points along the wind vector',key:'i',unavailable:()=>motionGate()??(this.paused?'Resume cloth first':this.selected<this.patch.columns?'The selected point is pinned':Math.hypot(...Object.values(this.selectedForce()))<1e-8?'No wind at the selected point':undefined),run:()=>{const w=this.selectedForce(),n=Math.hypot(w.x,w.y,w.z);const count=this.patch.impulse(this.selected,{x:w.x/n*2,y:w.y/n*2,z:w.z/n*2});this.lastMessage=`Impulse applied to ${count} points.`;}},
   {id:'reset',label:'Reset cloth',tooltip:'Restore geometry, velocity and default wind',key:'r',run:()=>{this.patch.reset();this.lastMessage='Cloth and wind reset.';}},
   {id:'focus',label:'Focus cloth',tooltip:'Center the orbit camera on the cloth',key:'f',run:onFocus},
   {id:'wireframe',label:'Wireframe',tooltip:'Toggle cloth mesh edges',key:'w',run:onWireframe},
  ]);
 }
 selectedForce(){const i=this.selected*3;return this.patch.forceAt({x:this.patch.positions[i]!,y:this.patch.positions[i+1]!,z:this.patch.positions[i+2]!});}
 select(index:number):void {if(!Number.isInteger(index)||index<0||index>=this.patch.columns*this.patch.rows)throw new RangeError('Invalid point');this.selected=index;}
 advance(ms:number):void {if(!this.paused&&!this.reducedMotion)this.patch.advance(ms);}
}
