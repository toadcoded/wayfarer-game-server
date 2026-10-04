import {defaultABC,validateABC,sampleABC,type ABCWind} from './abc-wind.js';
export interface ForceVector {x:number;y:number;z:number}
/** Small anchored cloth patch for the mesh lab; no world/self collision. */
export class SoftPatch {
 readonly columns=7;readonly rows=9;readonly positions:Float32Array;readonly indices:Uint32Array;
 private abc=defaultABC();private seconds=0;
 private wind:ForceVector={x:0,y:0,z:2};
 private previous:Float32Array;private anchors:Float32Array;private remainder=0;
 constructor(){
  const points:number[]=[],indices:number[]=[];
  for(let y=0;y<this.rows;y++)for(let x=0;x<this.columns;x++)points.push(x-3,12-y,0);
  for(let y=0;y<this.rows-1;y++)for(let x=0;x<this.columns-1;x++){const a=y*this.columns+x,b=a+1,c=a+this.columns,d=c+1;indices.push(a,c,b,b,c,d);}
  this.positions=new Float32Array(points);this.previous=this.positions.slice();this.anchors=this.positions.slice();this.indices=new Uint32Array(indices);
 }
 /** Wind is acceleration; gravity is added separately. Vector length is capped at 12. */
 setWind(vector:ForceVector):void {this.validateVector(vector,12);this.wind={x:vector.x,y:vector.y,z:vector.z};}
 getWind():ForceVector{return {...this.wind};}
 setABC(options:ABCWind):void {validateABC(options);this.abc={...options,center:{...options.center}};}
 getABC():ABCWind{return {...this.abc,center:{...this.abc.center}};}
 get simulationSeconds():number{return this.seconds;}
 forceAt(point:ForceVector):ForceVector {const field=sampleABC(this.abc,point,this.seconds);const v={x:this.wind.x+field.x,y:this.wind.y+field.y,z:this.wind.z+field.z};const scale=Math.min(1,12/Math.max(1e-9,Math.hypot(v.x,v.y,v.z)));return {x:v.x*scale,y:v.y*scale,z:v.z*scale};}
 reset():void {this.abc=defaultABC();this.seconds=0;this.positions.set(this.anchors);this.previous.set(this.anchors);this.remainder=0;this.wind={x:0,y:0,z:2};}
 private validateVector(v:ForceVector,limit:number):void {if(![v.x,v.y,v.z].every(Number.isFinite)||Math.hypot(v.x,v.y,v.z)>limit)throw new RangeError('Invalid force vector');}
 /** Local grid-radius impulse. Anchors are immutable; accumulated speed is capped at 6. */
 impulse(point:number,vector:ForceVector,radius=2):number {
  this.validateVector(vector,6);
  if(!Number.isInteger(point)||point<0||point>=this.columns*this.rows||!Number.isFinite(radius)||radius<0||radius>4)throw new RangeError('Invalid impulse target');
  if(point<this.columns)return 0;let affected=0;
  for(let n=this.columns;n<this.columns*this.rows;n++){
   const distance=Math.hypot(n%this.columns-point%this.columns,Math.floor(n/this.columns)-Math.floor(point/this.columns));
   if(distance>radius)continue;const weight=radius===0?1:1-distance/(radius+1),i=n*3;
   const vx=(this.positions[i]!-this.previous[i]!)*120+vector.x*weight,vy=(this.positions[i+1]!-this.previous[i+1]!)*120+vector.y*weight,vz=(this.positions[i+2]!-this.previous[i+2]!)*120+vector.z*weight;
   const scale=Math.min(1,6/Math.max(1e-9,Math.hypot(vx,vy,vz)));
   this.previous[i]=this.positions[i]!-vx*scale/120;this.previous[i+1]=this.positions[i+1]!-vy*scale/120;this.previous[i+2]=this.positions[i+2]!-vz*scale/120;affected++;
  }return affected;
 }
 advance(elapsedMs:number):{steps:number;droppedMs:number}{
  if(!Number.isFinite(elapsedMs)||elapsedMs<0)throw new Error('Invalid cloth elapsed time');
  const kept=Math.min(elapsedMs,100);this.remainder+=kept;let steps=0;
  while(this.remainder+1e-8>=1000/120){this.step();this.remainder-=1000/120;steps++;}
  return {steps,droppedMs:elapsedMs-kept};
 }
 private step():void {
  const p=this.positions,dt=1/120;
  for(let i=this.columns*3;i<p.length;i+=3){
   const force=this.forceAt({x:p[i]!,y:p[i+1]!,z:p[i+2]!});
   for(let k=0;k<3;k++){const j=i+k,old=p[j]!,velocity=(old-this.previous[j]!)*.985;
    const acceleration=k===0?force.x:k===1?force.y-9.81:force.z;
    p[j]=old+velocity+acceleration*dt*dt;this.previous[j]=old;
   }
  }
  this.seconds+=dt;

  for(let iteration=0;iteration<6;iteration++){
   for(let y=0;y<this.rows;y++)for(let x=0;x<this.columns;x++){
    const a=y*this.columns+x;if(x+1<this.columns)this.constrain(a,a+1);if(y+1<this.rows)this.constrain(a,a+this.columns);
   }
   for(let i=0;i<this.columns*3;i++)p[i]=this.anchors[i]!;
  }
 }
 private constrain(a:number,b:number):void {
  const p=this.positions,dx=p[b*3]!-p[a*3]!,dy=p[b*3+1]!-p[a*3+1]!,dz=p[b*3+2]!-p[a*3+2]!,length=Math.hypot(dx,dy,dz);
  if(length<1e-8)return;const wa=a<this.columns?0:1,wb=b<this.columns?0:1;if(wa+wb===0)return;
  const correction=(length-1)/length/(wa+wb);
  for(const [k,d] of [dx,dy,dz].entries()){p[a*3+k]=p[a*3+k]!+d*correction*wa;p[b*3+k]=p[b*3+k]!-d*correction*wb;}
 }
}
